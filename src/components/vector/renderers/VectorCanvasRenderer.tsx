// Ruta: src/components/vector/renderers/VectorCanvasRenderer.tsx
'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type {
  AnimatedVectorItem,
  VectorColorValue,
  VectorShape,
  StrokeLinecap,
  RotationOrigin,
  GradientConfig,
  VectorRenderProps,
} from '../core/types';
import { fixPrecision, formatSvgPoint } from '@/utils/precision';
import { applyCulling } from '../core/culling';

// Importar Canvg para renderizado de SVG en canvas
// Nota: Esto requiere instalar la dependencia si no está ya instalada
// npm install canvg o yarn add canvg
let Canvg: typeof import('canvg').Canvg | undefined;

// Cargar Canvg de forma dinámica solo en el cliente
if (typeof window !== 'undefined') {
  import('canvg').then((module) => {
    Canvg = module.Canvg;
  }).catch(() => {
    // Error al cargar Canvg
  });
}

// --- Props del Componente Renderer ---
interface VectorCanvasRendererProps {
  vectors: AnimatedVectorItem[];
  width: number;
  height: number;
  backgroundColor?: string;
  baseVectorLength: number | ((item: AnimatedVectorItem) => number);
  baseVectorColor: VectorColorValue;
  baseVectorWidth: number | ((item: AnimatedVectorItem) => number);
  baseStrokeLinecap?: StrokeLinecap;
  baseVectorShape: VectorShape;
  baseRotationOrigin: RotationOrigin;
  customRenderer?: (renderProps: VectorRenderProps, ctx: CanvasRenderingContext2D) => void;
  userSvgString?: string;
  userSvgPreserveAspectRatio?: string;
  onVectorClick?: (item: AnimatedVectorItem, event: React.MouseEvent) => void;
  onVectorHover?: (item: AnimatedVectorItem | null, event: React.MouseEvent) => void;
  interactionEnabled?: boolean;
  /**
   * Habilita el sistema de culling para optimizar el renderizado
   * filtrando vectores que no son visibles en el viewport
   */
  cullingEnabled?: boolean;
  /**
   * Habilita modo de depuración visual y logging
   */
  debugMode?: boolean;
}

// --- Helpers para cálculos y precisión ---
/**
 * Función auxiliar para asegurar valores numéricos finitos con precisión controlada
 * @param value - Valor a verificar
 * @param defaultValue - Valor por defecto si el valor no es válido
 * @param precision - Número de decimales a redondear (opcional, por defecto 6)
 * @returns Número válido con la precisión especificada
 */
const ensureSafeNumber = (value: unknown, defaultValue: number = 0, precision?: number): number => {
  // Primero convertimos a número
  let num = Number(value);
  
  // Verificamos si es un número finito y no es NaN
  if (!Number.isFinite(num)) {
    return defaultValue;
  }
  
  // Aplicar precisión si se especifica
  if (typeof precision === 'number' && precision >= 0) {
    const factor = Math.pow(10, precision);
    num = Math.round(num * factor) / factor;
  }
  
  return num;
};

/**
 * Helper para calcular el desplazamiento de rotación
 * @param origin - Origen de la rotación ('start' | 'center' | 'end')
 * @param length - Longitud del vector
 * @returns Desplazamiento de rotación con precisión controlada
 */
const getRotationOffset = (origin: RotationOrigin, length: number): number => {
  const safeLength = ensureSafeNumber(length, 0, 4);
  
  switch (origin) {
    case 'center': 
      return ensureSafeNumber(safeLength / 2, 0, 4);
    case 'end': 
      return ensureSafeNumber(safeLength, 0, 4);
    default: 
      return 0; // 'start'
  }
};

/**
 * Componente Canvas Renderer para VectorGrid - Implementación Básica (Fase 1)
 * 
 * Esta implementación inicial soporta el renderizado de vectores en formato 'line'.
 * Maneja correctamente DPR para pantallas de alta densidad y soporta colores básicos.
 */
// Función para comparar props y evitar re-renderizados innecesarios
const areEqual = (prevProps: VectorCanvasRendererProps, nextProps: VectorCanvasRendererProps) => {
  // Comparar props primitivas primero (más rápido)
  if (
    prevProps.width !== nextProps.width ||
    prevProps.height !== nextProps.height ||
    prevProps.backgroundColor !== nextProps.backgroundColor ||
    prevProps.baseStrokeLinecap !== nextProps.baseStrokeLinecap ||
    prevProps.baseVectorShape !== nextProps.baseVectorShape ||
    prevProps.baseRotationOrigin !== nextProps.baseRotationOrigin ||
    prevProps.interactionEnabled !== nextProps.interactionEnabled ||
    prevProps.cullingEnabled !== nextProps.cullingEnabled ||
    prevProps.debugMode !== nextProps.debugMode ||
    prevProps.userSvgString !== nextProps.userSvgString ||
    prevProps.userSvgPreserveAspectRatio !== nextProps.userSvgPreserveAspectRatio ||
    prevProps.vectors.length !== nextProps.vectors.length
  ) {
    return false;
  }
  
  // Comparar arrays de vectores (solo si las longitudes coinciden)
  if (prevProps.vectors.some((v, i) => v.id !== nextProps.vectors[i]?.id)) {
    return false;
  }
  
  // Si llegamos aquí, los props son iguales
  return true;
};

const VectorCanvasRendererComponent: React.FC<VectorCanvasRendererProps> = ({
  vectors,
  width,
  height,
  backgroundColor = 'transparent',
  baseVectorLength,
  baseVectorColor,
  baseVectorWidth,
  baseStrokeLinecap = 'round',
  baseVectorShape,
  baseRotationOrigin,
  customRenderer,
  userSvgString,
  userSvgPreserveAspectRatio,
  onVectorClick,
  onVectorHover,
  interactionEnabled = true,
  cullingEnabled = false,
  debugMode = false
}) => {
  // Referencia para el canvas principal
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Referencia para el cache de SVG
  const userSvgCacheRef = useRef<HTMLCanvasElement | null>(null);
  
  // Estado para vectores resaltados (hover)
  const [hoveredVectorId, setHoveredVectorId] = useState<string | null>(null);

  // Efecto para renderizar SVG en un canvas separado (cache)
  // Solo se ejecuta cuando cambia userSvgString o userSvgPreserveAspectRatio
  useEffect(() => {
    if (!userSvgString || !Canvg) {
      // Si no hay SVG o no se ha cargado Canvg, limpiar la referencia
      userSvgCacheRef.current = null;
      return;
    }
    
    // Función para crear el cache de SVG
    const createSvgCache = async () => {
      try {
        // Crear un canvas temporal
        const cacheCanvas = document.createElement('canvas');
        const ctx = cacheCanvas.getContext('2d');
        if (!ctx) {
          // No se pudo obtener contexto 2D para el cache de SVG
          return;
        }
        
        // Tamaño base para el SVG (luego se escala al renderizar)
        cacheCanvas.width = 100;
        cacheCanvas.height = 100;
        
        // Limpiar el canvas
        ctx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height);
        
        // Renderizar el SVG en el canvas usando Canvg
        const v = await Canvg.from(ctx, userSvgString, {
          ignoreMouse: true,
          ignoreAnimation: true
          // 'preserveAspectRatio' no es una opción válida en IOptions de Canvg
        });
        
        await v.render();
        
        // Guardar el canvas en la referencia
        userSvgCacheRef.current = cacheCanvas;
        // console.log('SVG renderizado correctamente en cache');
      } catch (err) {
        // console.error('Error al renderizar SVG en cache:', err);
        userSvgCacheRef.current = null;
      }
    };
    
    createSvgCache();
  }, [userSvgString, userSvgPreserveAspectRatio]);
  
  // Aplicar culling si está habilitado para optimizar el rendimiento visual
  // Solo se recalcula cuando cambian los vectores, el ancho, el alto o la configuración de culling
  const optimizedVectors = useMemo(() => {
    if (cullingEnabled && width > 0 && height > 0) {
      // Aplicar culling con precisión controlada para mantener consistencia visual
      const culledVectors = applyCulling(
        vectors, 
        fixPrecision(width, 0),
        fixPrecision(height, 0),
        {
          // Habilitar nivel de detalle para vectores lejanos
          enableLOD: true,
          // Añadir padding para evitar cortes bruscos en los bordes
          padding: fixPrecision(Math.max(50, typeof baseVectorLength === 'number' ? baseVectorLength / 2 : 10), 0),
          // Usar quadtree solo si hay muchos vectores (>1000)
          useQuadtree: vectors.length > 1000
        }
      );
      
      if (debugMode) {
        // Log del porcentaje de vectores optimizados
        const optimizationRate = fixPrecision((1 - culledVectors.length / vectors.length) * 100, 1);
        // eslint-disable-next-line no-console
        console.info(`[Culling Canvas] Optimizados ${optimizationRate}% (${culledVectors.length}/${vectors.length} vectores renderizados)`);
      }
      
      return culledVectors;
    }
    
    return vectors;
  }, [vectors, width, height, cullingEnabled, baseVectorLength, debugMode]);

  // Efecto principal de renderizado
  // Solo se ejecuta cuando cambian las dependencias relevantes
  useEffect(() => {
    // No renderizar si las dimensiones no son válidas
    if (width <= 0 || height <= 0) {
      if (debugMode) {
        console.log('[VectorCanvasRenderer] Saltando renderizado: dimensiones inválidas', { width, height });
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Asegurar dimensiones mínimas
    const safeWidth = Math.max(1, width || 0);
    const safeHeight = Math.max(1, height || 0);
    
    if (debugMode) {
      console.log('[Canvas] Dimensiones:', { width: safeWidth, height: safeHeight });
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas');
      return;
    }

    // Manejar DPR (Device Pixel Ratio) para pantallas de alta densidad
    const dpr = window.devicePixelRatio || 1;
    
    // Ajustar dimensiones físicas del canvas
    canvas.width = safeWidth * dpr;
    canvas.height = safeHeight * dpr;
    
    // Ajustar dimensiones de visualización (CSS)
    canvas.style.width = safeWidth + 'px';
    canvas.style.height = safeHeight + 'px';
    
    // Aplicar escala para manejar DPR
    ctx.scale(dpr, dpr);
    
    // Estilos de depuración
    if (debugMode) {
      canvas.style.border = '2px dashed red';
      canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    }

    // Limpiar el canvas
    ctx.clearRect(0, 0, safeWidth, safeHeight);
    
    // Dibujar el fondo si no es transparente
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, safeWidth, safeHeight);
    } else if (debugMode) {
      // Fondo de cuadrícula para depuración
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      
      // Líneas verticales
      for (let x = 0; x <= safeWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, safeHeight);
        ctx.stroke();
      }
      
      // Líneas horizontales
      for (let y = 0; y <= safeHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(safeWidth, y);
        ctx.stroke();
      }
    }

    // Log de depuración
    if (debugMode) {
      console.log('[CanvasRenderer] Renderizando', optimizedVectors.length, 'vectores');
      console.log('[CanvasRenderer] Dimensiones:', { width, height });
      if (optimizedVectors.length > 0) {
        console.log('[CanvasRenderer] Primer vector:', optimizedVectors[0]);
      }
    }

    // Renderizar cada vector
    optimizedVectors.forEach((vector) => {
      const { lengthFactor = 1, widthFactor = 1 } = vector;
      // Asegurar valores base con manejo de undefined
      const baseX = ensureSafeNumber(vector.baseX, 0, 2);
      const baseY = ensureSafeNumber(vector.baseY, 0, 2);
      const vectorAngle = ensureSafeNumber(vector.currentAngle, 0, 4);
      
      // Saltar renderizado si las coordenadas base no son válidas
      if (isNaN(baseX) || isNaN(baseY)) {
        if (debugMode) {
          console.warn('Vector con coordenadas inválidas:', { baseX, baseY, vector });
        }
        return;
      }
      
      // Determinar longitud y ancho del vector - con validación de valores finitos
      let actualVectorLength = ensureSafeNumber(
        typeof baseVectorLength === 'function' 
        ? baseVectorLength(vector) * lengthFactor 
        : baseVectorLength * lengthFactor
      );
      
      let actualStrokeWidth = ensureSafeNumber(
        typeof baseVectorWidth === 'function'
        ? baseVectorWidth(vector) * widthFactor
        : baseVectorWidth * widthFactor
      );
      
      // Asegurar que los valores sean finitos con precisión controlada
      actualVectorLength = ensureSafeNumber(actualVectorLength, 10, 2); // Valor predeterminado de 10px, 2 decimales
      actualStrokeWidth = ensureSafeNumber(actualStrokeWidth, 1, 2);   // Valor predeterminado de 1px, 2 decimales
      
      // Asegurar que los valores estén dentro de rangos razonables
      actualVectorLength = Math.max(0.1, Math.min(1000, actualVectorLength));
      actualStrokeWidth = Math.max(0.1, Math.min(100, actualStrokeWidth));
      
      // Calcular offset de rotación con validación
      const rotationOffset = ensureSafeNumber(getRotationOffset(baseRotationOrigin, actualVectorLength));
      
      // Guardar estado del contexto
      ctx.save();
      
      // Determinar el color a utilizar (string, función o gradiente)
      let styleColor: string | CanvasGradient = "var(--primary)"; // Color por defecto
      
      // Preparar propiedades para el renderizado personalizado
      const renderProps: VectorRenderProps = {
        item: vector,
        dimensions: { width, height },
        baseVectorLength: typeof baseVectorLength === 'function' ? baseVectorLength(vector) : baseVectorLength,
        baseVectorColor: styleColor,
        baseVectorWidth: typeof baseVectorWidth === 'function' ? baseVectorWidth(vector) : baseVectorWidth,
        baseStrokeLinecap: baseStrokeLinecap,
        baseVectorShape: baseVectorShape,
        baseRotationOrigin: baseRotationOrigin,
        actualLength: actualVectorLength,
        actualStrokeWidth: actualStrokeWidth,
        getRotationOffset: (origin: 'start' | 'center' | 'end', len: number) => 
          origin === 'center' ? len / 2 : origin === 'end' ? len : 0,
        // Añadimos el contexto de canvas como propiedad no tipada para compatibilidad
        ctx: ctx as any
      };
      
      // Si hay un renderizador personalizado, llamarlo primero
      if (typeof customRenderer === 'function') {
        try {
          // Llamar al renderizador personalizado con las propiedades y el contexto
          customRenderer(renderProps, renderProps.ctx);
          // El renderizador personalizado es responsable de manejar su propio save/restore
        } catch (error) {
          console.error('Error en renderizador personalizado:', error);
          // Restaurar el contexto en caso de error para evitar corrupción del estado
          ctx.restore();
          ctx.save();
        }
      }
      
      if (typeof baseVectorColor === 'string') {
        // Color simple (string)
        styleColor = baseVectorColor;
      } else if (typeof baseVectorColor === 'function') {
        // Función que genera un color
        try {
          // Pasamos el vector actual, frame 0 (podríamos implementar un contador), total frames 1, y timestamp actual
          const calculatedColor = baseVectorColor(vector, 0, 1, performance.now());
          if (typeof calculatedColor === 'string') {
            styleColor = calculatedColor;
          }
        } catch (err) {
          // console.error('Error al calcular color dinámico:', err);
        }
      } else if (baseVectorColor && typeof baseVectorColor === 'object') {
        // Posible gradiente
        const gradConfig = baseVectorColor as GradientConfig;
        if (gradConfig.type && gradConfig.stops && gradConfig.coords) {
          // Calcular dimensiones locales para el gradiente
          const unitFactorX = actualVectorLength;
          const unitFactorY = actualStrokeWidth * 2;
          
          try {
            let gradient: CanvasGradient;
            
            // Función auxiliar para asegurar valores numéricos finitos con precisión controlada
            
            if (gradConfig.type === 'linear') {
              // Gradiente lineal con validación
              // Extraer valores base
              let x1 = Number(gradConfig.coords?.x1 ?? 0);
              let y1 = Number(gradConfig.coords?.y1 ?? 0);
              let x2 = Number(gradConfig.coords?.x2 ?? 1);
              let y2 = Number(gradConfig.coords?.y2 ?? 0);
              
              // Validar valores y usar valores por defecto si no son finitos
              x1 = ensureSafeNumber(x1, 0);
              y1 = ensureSafeNumber(y1, 0);
              x2 = ensureSafeNumber(x2, 1); // Valor por defecto 1 para x2
              y2 = ensureSafeNumber(y2, 0);
              
              // Aplicar escalado
              x1 = ensureSafeNumber(x1 * unitFactorX, 0);
              y1 = ensureSafeNumber(y1 * unitFactorY, 0);
              x2 = ensureSafeNumber(x2 * unitFactorX, unitFactorX);
              y2 = ensureSafeNumber(y2 * unitFactorY, 0);
              
              gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            } else {
              // Gradiente radial con validación
              // Extraer valores base
              let cx = Number(gradConfig.coords?.cx ?? 0.5);
              let cy = Number(gradConfig.coords?.cy ?? 0.5);
              let r = Number(gradConfig.coords?.r ?? 0.5);
              let fx = Number(gradConfig.coords?.fx ?? cx);
              let fy = Number(gradConfig.coords?.fy ?? cy);
              
              // Validar valores
              cx = ensureSafeNumber(cx, 0.5);
              cy = ensureSafeNumber(cy, 0.5);
              r = ensureSafeNumber(r, 0.5);
              fx = ensureSafeNumber(fx, cx);
              fy = ensureSafeNumber(fy, cy);
              
              // Aplicar escalado
              cx = ensureSafeNumber(cx * unitFactorX, unitFactorX * 0.5);
              cy = ensureSafeNumber(cy * unitFactorY, unitFactorY * 0.5);
              r = ensureSafeNumber(r * Math.max(unitFactorX, unitFactorY), Math.max(unitFactorX, unitFactorY) * 0.5);
              fx = ensureSafeNumber(fx * unitFactorX, cx);
              fy = ensureSafeNumber(fy * unitFactorY, cy);
              
              gradient = ctx.createRadialGradient(
                fx, fy, 0, // Origen interno del gradiente
                cx, cy, r  // Origen externo y radio final
              );
            }
            
            // Añadir paradas de color con validación
            for (const stop of gradConfig.stops) {
              try {
                // Asegurar que el offset sea un número finito entre 0 y 1
                let offset = Number(stop.offset);
                offset = ensureSafeNumber(offset, 0);
                offset = Math.max(0, Math.min(1, offset)); // Limitar entre 0 y 1
                
                gradient.addColorStop(
                  offset, 
                  stop.color || "var(--primary)" // Valor por defecto si el color es inválido
                );
              } catch (err) {
                // console.error('Error al añadir parada de color:', err);
              }
            }
            
            styleColor = gradient;
          } catch (err) {
            // console.error('Error al crear gradiente:', err);
          }
        }
      }
      
      // Aplicar estilos finales
      ctx.strokeStyle = styleColor;
      ctx.fillStyle = styleColor;
      ctx.lineWidth = actualStrokeWidth;
      ctx.lineCap = baseStrokeLinecap;
      
      // Transformaciones
      ctx.translate(fixPrecision(baseX), fixPrecision(baseY));
      ctx.rotate(fixPrecision(vectorAngle * (Math.PI / 180))); // Convertir grados a radianes
      ctx.translate(-rotationOffset, 0);
      
      // Dibujar vector según su forma
      ctx.beginPath();
      
      switch (baseVectorShape) {
        case 'arrow': {
          // Dibujar una flecha
          const drawArrow = (x: number, y: number, angle: number, length: number, width: number) => {
            ctx.save();
            ctx.translate(fixPrecision(x), fixPrecision(y));
            // Convertir ángulo de grados a radianes para la rotación
            const angleInRadians = fixPrecision(angle * (Math.PI / 180));
            ctx.rotate(angleInRadians);
            
            // Dibujar la línea
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(fixPrecision(length), 0);
            ctx.stroke();
            
            // Dibujar la punta de flecha
            const arrowHeadSize = fixPrecision(Math.min(length * 0.3, width * 2 + 5));
            ctx.beginPath();
            ctx.moveTo(fixPrecision(length), 0);
            ctx.lineTo(fixPrecision(length - arrowHeadSize), fixPrecision(-arrowHeadSize / 2));
            ctx.lineTo(fixPrecision(length - arrowHeadSize), fixPrecision(arrowHeadSize / 2));
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          };
          drawArrow(0, 0, vectorAngle, actualVectorLength, actualStrokeWidth);
          break;
        }
        
        case 'dot': {
          // Círculo simple centrado en la posición base
          ctx.arc(0, 0, fixPrecision(actualStrokeWidth), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        
        case 'triangle': {
          // Triángulo con punta hacia la derecha
          const triangleHeight = fixPrecision(actualVectorLength);
          const triangleWidth = fixPrecision(actualStrokeWidth * 2);
          
          ctx.beginPath();
          ctx.moveTo(0, 0);  // Base izquierda
          ctx.lineTo(0, fixPrecision(-triangleWidth / 2));  // Arriba
          ctx.lineTo(triangleHeight, 0);  // Punta
          ctx.lineTo(0, fixPrecision(triangleWidth / 2));  // Abajo
          ctx.closePath();
          ctx.fill();
          break;
        }
        
        case 'semicircle': {
          // Semicircle with flat edge at left (origin)
          ctx.arc(fixPrecision(actualVectorLength / 2), 0, fixPrecision(actualVectorLength / 2), Math.PI, 0, false);
          ctx.stroke();
          break;
        }
        
        case 'curve': {
          // Curva cuadrática simple
          const amplitude = fixPrecision(actualStrokeWidth);
          const steps = 20; // Más pasos para curvas más suaves
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          
          for (let i = 0; i <= steps; i++) {
            const x = fixPrecision((i / steps) * actualVectorLength);
            const y = fixPrecision(amplitude * Math.sin((i / steps) * Math.PI));
            ctx.lineTo(x, y);
          }
          
          ctx.stroke();
          break;
        }
        
        case 'userSvg':
        case 'custom': {
          // Renderizar SVG desde el cache si existe
          if (userSvgCacheRef.current && userSvgString) {
            try {
              // Calcular dimensiones para mantener proporciones
              const svgSize = Math.max(actualVectorLength, actualStrokeWidth * 5);
              // const svgScale = svgSize / 100; // El cache se renderiza a 100x100
              
              // Centrar el SVG en el punto de origen
              const offsetX = 0; // Podemos ajustar esto para alinear mejor
              const offsetY = fixPrecision(-svgSize / 2); // Centrar verticalmente
              
              // Dibujar el SVG cacheado
              ctx.drawImage(
                userSvgCacheRef.current,
                offsetX, offsetY, // Posición de destino
                fixPrecision(svgSize), fixPrecision(svgSize)  // Tamaño de destino
              );
              
              // Mostrar debug info si es necesario (quitar en producción)
              // console.log(`SVG renderizado: tamaño ${svgSize}px, escala ${svgScale}`);
            } catch (err) {
              // console.error('Error al renderizar SVG cacheado:', err);
              
              // Fallback: Renderizar un rectángulo simple como indicador de error
              ctx.fillStyle = 'rgba(255,0,0,0.3)';
              ctx.fillRect(0, fixPrecision(-actualStrokeWidth), fixPrecision(actualVectorLength), fixPrecision(actualStrokeWidth * 2));
              ctx.strokeRect(0, fixPrecision(-actualStrokeWidth), fixPrecision(actualVectorLength), fixPrecision(actualStrokeWidth * 2));
            }
          } else {
            // SVG no disponible - mostrar un marcador simple
            ctx.fillStyle = 'rgba(200,200,200,0.5)';
            ctx.fillRect(0, fixPrecision(-actualStrokeWidth), fixPrecision(actualVectorLength), fixPrecision(actualStrokeWidth * 2));
            ctx.strokeRect(0, fixPrecision(-actualStrokeWidth), fixPrecision(actualVectorLength), fixPrecision(actualStrokeWidth * 2));
          }
          break;
        }
        
        case 'line':
        default: {
          // Línea simple (caso base, por defecto)
          ctx.moveTo(0, 0);
          ctx.lineTo(fixPrecision(actualVectorLength), 0);
          ctx.stroke();
          break;
        }
      }
      
      // Restaurar estado
      ctx.restore();
    });
  }, [
    vectors, 
    width, 
    height, 
    backgroundColor, 
    baseVectorLength, 
    baseVectorColor,
    baseVectorWidth, 
    baseStrokeLinecap, 
    baseVectorShape, 
    baseRotationOrigin,
    customRenderer,
    userSvgString, // Incluir SVG string para re-renderizar cuando cambie
    // No incluimos onVectorClick y onVectorHover ya que no afectan al renderizado,
    // solo a la interactividad que se maneja en los event handlers
    hoveredVectorId
  ]);

  // Función para detectar si un punto (x,y) está dentro del área de un vector
  const isPointInVector = (x: number, y: number, vector: AnimatedVectorItem): boolean => {
    if (!interactionEnabled) return false;
    
    const { baseX, baseY, lengthFactor = 1, widthFactor = 1 } = vector;
    const vectorAngle = ensureSafeNumber(vector.currentAngle || 0);
    
    // Calcular dimensiones reales
    const actualVectorLength = ensureSafeNumber(
      typeof baseVectorLength === 'function' 
      ? baseVectorLength(vector) * lengthFactor 
      : baseVectorLength * lengthFactor
    );
    
    const actualStrokeWidth = ensureSafeNumber(
      typeof baseVectorWidth === 'function'
      ? baseVectorWidth(vector) * widthFactor
      : baseVectorWidth * widthFactor
    );
      
    // Calcular desplazamiento para rotación
    const rotationOffset = getRotationOffset(baseRotationOrigin, actualVectorLength);
    
    // Convertir el punto del canvas al sistema de coordenadas del vector
    // 1. Trasladar al origen del vector
    const translatedX = x - baseX;
    const translatedY = y - baseY;
    
    // 2. Rotar en sentido inverso
    const angleInRadians = fixPrecision(vectorAngle * (Math.PI / 180));
    const rotatedX = fixPrecision(translatedX * Math.cos(-angleInRadians) - translatedY * Math.sin(-angleInRadians));
    const rotatedY = fixPrecision(translatedX * Math.sin(-angleInRadians) + translatedY * Math.cos(-angleInRadians));
    
    // 3. Considerar el desplazamiento de rotación
    const adjustedX = rotatedX + rotationOffset;
    
    // Definir el área de detección según la forma del vector
    switch (baseVectorShape) {
      case 'dot': {
        // Para un punto, el área es un círculo
        const distance = fixPrecision(Math.sqrt(Math.pow(rotatedX, 2) + Math.pow(rotatedY, 2)));
        return distance <= fixPrecision(actualStrokeWidth * 1.5); // Área un poco más grande para facilitar la interacción
      }
      
      case 'arrow':
      case 'triangle': {
        // Hacemos una detección rectangular pero más ancha en la punta
        return adjustedX >= -actualStrokeWidth && 
               adjustedX <= actualVectorLength + actualStrokeWidth && 
               Math.abs(rotatedY) <= Math.max(actualStrokeWidth * 2, actualVectorLength * 0.2);
      }
      
      case 'semicircle':
      case 'curve': {
        // Para curvas, usamos una detección basada en distancia a la curva 
        // (simplificada como un rectángulo para esta implementación)
        return adjustedX >= -actualStrokeWidth && 
               adjustedX <= actualVectorLength + actualStrokeWidth && 
               Math.abs(rotatedY) <= actualVectorLength * 0.4;
      }
      
      case 'line':
      default: {
        // Para líneas, el área es un rectángulo alargado
        return adjustedX >= -actualStrokeWidth && 
               adjustedX <= actualVectorLength + actualStrokeWidth && 
               Math.abs(rotatedY) <= actualStrokeWidth * 2;
      }
    }
  };
  
  // Encontrar el vector bajo el cursor
  const findVectorUnderCursor = (x: number, y: number): AnimatedVectorItem | null => {
    // Recorremos en orden inverso para manejar correctamente las superposiciones
    // (los vectores dibujados más tarde están "encima")
    for (let i = optimizedVectors.length - 1; i >= 0; i--) {
      if (isPointInVector(x, y, optimizedVectors[i])) {
        return optimizedVectors[i];
      }
    }
    return null;
  };
  
  // Manejadores de eventos
  const handleMouseMove = (event: React.MouseEvent): void => {
    if (!interactionEnabled || !onVectorHover) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Obtener coordenadas del canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Encontrar el vector bajo el cursor
    const hoveredVector = findVectorUnderCursor(x, y);
    
    // Actualizar estado y llamar al callback solo si hay un cambio
    if (hoveredVector?.id !== hoveredVectorId) {
      setHoveredVectorId(hoveredVector?.id || null);
      onVectorHover(hoveredVector, event);
    }
  };
  
  const handleMouseLeave = (event: React.MouseEvent): void => {
    if (!interactionEnabled || !onVectorHover) return;
    
    // Limpiar el estado al salir del canvas
    if (hoveredVectorId !== null) {
      setHoveredVectorId(null);
      onVectorHover(null, event);
    }
  };
  
  const handleClick = (event: React.MouseEvent): void => {
    if (!interactionEnabled || !onVectorClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Obtener coordenadas del canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Encontrar el vector bajo el cursor
    const clickedVector = findVectorUnderCursor(x, y);
    
    // Llamar al callback si se encontró un vector
    if (clickedVector) {
      onVectorClick(clickedVector, event);
    }
  };

  // Sistema de logging con throttling
  const logRender = (() => {
    if (process.env.NODE_ENV !== 'development' || !debugMode) return () => {};
    
    let lastLogTime = 0;
    const LOG_INTERVAL = 2000; // 2 segundos entre logs
    let logGroup: string | null = null;
    
    return () => {
      const now = Date.now();
      if (now - lastLogTime < LOG_INTERVAL) return;
      
      lastLogTime = now;
      
      // Cerrar grupo anterior si existe
      if (logGroup) {
        console.groupEnd();
      }
      
      // Crear nuevo grupo
      logGroup = `[VectorCanvasRenderer] Renderizado (${width}x${height})`;
      console.groupCollapsed(logGroup);
      
      // Solo mostrar detalles en el primer log
      if (lastLogTime === now) {
        console.log('Vectores activos:', optimizedVectors.length);
        console.log('Dimensiones del canvas:', { width, height });
        console.log('Color de fondo:', backgroundColor);
        console.log('Última actualización:', new Date().toLocaleTimeString());
      }
      
      // Usar setTimeout para cerrar el grupo después de un breve retraso
      // Esto permite ver el grupo expandido en la consola
      setTimeout(() => {
        if (logGroup) {
          console.groupEnd();
          logGroup = null;
        }
      }, 100);
    };
  })();
  
  // Ejecutar el logger
  logRender();

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={cn("block w-full h-full bg-blue-50", {
          'cursor-pointer': interactionEnabled && onVectorClick,
          'cursor-default': !interactionEnabled || !onVectorClick,
          'border-2 border-dashed border-red-500': debugMode,
        })}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        width={width}
        height={height}
        style={{
          backgroundColor,
          touchAction: 'none',
        }}
      />
      {debugMode && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
          Canvas: {width}×{height}px
        </div>
      )}
    </div>
  );
};

// Exportar el componente memoizado para evitar re-renderizados innecesarios
export const VectorCanvasRenderer = React.memo(VectorCanvasRendererComponent, areEqual);

// Exportar el componente sin memo para casos de prueba
export { VectorCanvasRendererComponent };

export default VectorCanvasRenderer;
