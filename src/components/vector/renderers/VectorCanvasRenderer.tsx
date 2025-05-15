// Ruta: src/components/vector/renderers/VectorCanvasRenderer.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import type {
  AnimatedVectorItem,
  VectorColorValue,
  VectorShape,
  StrokeLinecap,
  RotationOrigin,
  GradientConfig,
  VectorRenderProps,
} from '../core/types';

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
}

// --- Helper para calcular el desplazamiento de rotación ---
const getRotationOffset = (origin: RotationOrigin, length: number): number => {
  switch (origin) {
    case 'center': return length / 2;
    case 'end': return length;
    default: return 0; // 'start'
  }
};

/**
 * Componente Canvas Renderer para VectorGrid - Implementación Básica (Fase 1)
 * 
 * Esta implementación inicial soporta el renderizado de vectores en formato 'line'.
 * Maneja correctamente DPR para pantallas de alta densidad y soporta colores básicos.
 */
export const VectorCanvasRenderer: React.FC<VectorCanvasRendererProps> = ({
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
  interactionEnabled = true
}) => {
  // Referencia para el canvas principal
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Referencia para el cache de SVG
  const userSvgCacheRef = useRef<HTMLCanvasElement | null>(null);
  
  // Estado para vectores resaltados (hover)
  const [hoveredVectorId, setHoveredVectorId] = useState<string | null>(null);

  // Efecto para renderizar SVG en un canvas separado (cache)
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
  
  // Efecto principal para el renderizado
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Manejar DPR (Device Pixel Ratio) para pantallas de alta densidad
    const dpr = window.devicePixelRatio || 1;
    
    // Ajustar dimensiones físicas del canvas
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Ajustar dimensiones de visualización (CSS)
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Aplicar escala para manejar DPR
    ctx.scale(dpr, dpr);

    // Limpiar el canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dibujar el fondo si no es transparente
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Función auxiliar para asegurar que un valor sea finito
    const ensureFinite = (value: number, defaultValue: number = 0): number => {
      return isFinite(value) ? value : defaultValue;
    };
    
    // Renderizar cada vector
    vectors.forEach(item => {
      const { baseX, baseY, currentAngle, lengthFactor = 1, widthFactor = 1 } = item;
      
      // Determinar longitud y ancho del vector - con validación de valores finitos
      let actualVectorLength = typeof baseVectorLength === 'function' 
        ? baseVectorLength(item) * lengthFactor 
        : baseVectorLength * lengthFactor;
      
      let actualStrokeWidth = typeof baseVectorWidth === 'function'
        ? baseVectorWidth(item) * widthFactor
        : baseVectorWidth * widthFactor;
      
      // Asegurar que los valores sean finitos
      actualVectorLength = ensureFinite(actualVectorLength, 10); // Valor predeterminado de 10px
      actualStrokeWidth = ensureFinite(actualStrokeWidth, 1);   // Valor predeterminado de 1px
      
      // Calcular offset de rotación con validación
      const rotationOffset = ensureFinite(getRotationOffset(baseRotationOrigin, actualVectorLength));
      
      // Guardar estado del contexto
      ctx.save();
      
      // Determinar el color a utilizar (string, función o gradiente)
      let styleColor: string | CanvasGradient = "var(--primary)"; // Color por defecto
      
      if (typeof baseVectorColor === 'string') {
        // Color simple (string)
        styleColor = baseVectorColor;
      } else if (typeof baseVectorColor === 'function') {
        // Función que genera un color
        try {
          // Pasamos el vector actual, frame 0 (podríamos implementar un contador), total frames 1, y timestamp actual
          const calculatedColor = baseVectorColor(item, 0, 1, performance.now());
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
            
            // Función auxiliar para asegurar valores numéricos finitos
            const ensureFinite = (value: number, defaultValue: number = 0): number => {
              return isFinite(value) ? value : defaultValue;
            };
            
            if (gradConfig.type === 'linear') {
              // Gradiente lineal con validación
              // Extraer valores base
              let x1 = Number(gradConfig.coords?.x1 ?? 0);
              let y1 = Number(gradConfig.coords?.y1 ?? 0);
              let x2 = Number(gradConfig.coords?.x2 ?? 1);
              let y2 = Number(gradConfig.coords?.y2 ?? 0);
              
              // Validar valores y usar valores por defecto si no son finitos
              x1 = ensureFinite(x1, 0);
              y1 = ensureFinite(y1, 0);
              x2 = ensureFinite(x2, 1); // Valor por defecto 1 para x2
              y2 = ensureFinite(y2, 0);
              
              // Aplicar escalado
              x1 = ensureFinite(x1 * unitFactorX, 0);
              y1 = ensureFinite(y1 * unitFactorY, 0);
              x2 = ensureFinite(x2 * unitFactorX, unitFactorX);
              y2 = ensureFinite(y2 * unitFactorY, 0);
              
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
              cx = ensureFinite(cx, 0.5);
              cy = ensureFinite(cy, 0.5);
              r = ensureFinite(r, 0.5);
              fx = ensureFinite(fx, cx);
              fy = ensureFinite(fy, cy);
              
              // Aplicar escalado
              cx = ensureFinite(cx * unitFactorX, unitFactorX * 0.5);
              cy = ensureFinite(cy * unitFactorY, unitFactorY * 0.5);
              r = ensureFinite(r * Math.max(unitFactorX, unitFactorY), Math.max(unitFactorX, unitFactorY) * 0.5);
              fx = ensureFinite(fx * unitFactorX, cx);
              fy = ensureFinite(fy * unitFactorY, cy);
              
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
                offset = ensureFinite(offset, 0);
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
      ctx.translate(baseX, baseY);
      ctx.rotate(currentAngle * (Math.PI / 180)); // Convertir grados a radianes
      ctx.translate(-rotationOffset, 0);
      
      // Dibujar vector según su forma
      ctx.beginPath();
      
      switch (baseVectorShape) {
        case 'arrow': {
          // Dibujar el cuerpo de la flecha
          const arrowHeadSize = Math.min(actualVectorLength * 0.3, actualStrokeWidth * 2 + 5);
          const lineLength = actualVectorLength - arrowHeadSize * 0.8;
          
          if (lineLength > 0) {
            // Dibujar la línea principal
            ctx.moveTo(0, 0);
            ctx.lineTo(lineLength, 0);
            ctx.stroke();
            
            // Dibujar la punta triangular
            ctx.beginPath();
            ctx.moveTo(actualVectorLength, 0);
            ctx.lineTo(lineLength, -arrowHeadSize / 2);
            ctx.lineTo(lineLength, arrowHeadSize / 2);
            ctx.closePath();
            ctx.fill();
          } else {
            // Flecha muy corta, mostrar solo una línea simple como fallback
            ctx.moveTo(0, 0);
            ctx.lineTo(actualVectorLength, 0);
            ctx.stroke();
          }
          break;
        }
        
        case 'dot': {
          // Círculo simple centrado en la posición base
          ctx.arc(0, 0, actualStrokeWidth, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        
        case 'triangle': {
          // Triángulo con punta hacia la derecha
          const tipX = actualVectorLength;
          const halfBase = actualVectorLength * 0.3 * Math.min(1, widthFactor);
          
          ctx.moveTo(tipX, 0); // Punta del triángulo
          ctx.lineTo(0, -halfBase); // Esquina superior izquierda
          ctx.lineTo(0, halfBase); // Esquina inferior izquierda
          ctx.closePath();
          ctx.fill();
          break;
        }
        
        case 'semicircle': {
          // Semicircle with flat edge at left (origin)
          ctx.arc(actualVectorLength / 2, 0, actualVectorLength / 2, Math.PI, 0, false);
          ctx.stroke();
          break;
        }
        
        case 'curve': {
          // Curva cuadrática simple
          const controlY = -actualVectorLength * 0.3; // Punto de control encima de la línea
          
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(actualVectorLength / 2, controlY, actualVectorLength, 0);
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
              const offsetY = -svgSize / 2; // Centrar verticalmente
              
              // Dibujar el SVG cacheado
              ctx.drawImage(
                userSvgCacheRef.current,
                offsetX, offsetY, // Posición de destino
                svgSize, svgSize  // Tamaño de destino
              );
              
              // Mostrar debug info si es necesario (quitar en producción)
              // console.log(`SVG renderizado: tamaño ${svgSize}px, escala ${svgScale}`);
            } catch (err) {
              // console.error('Error al renderizar SVG cacheado:', err);
              
              // Fallback: Renderizar un rectángulo simple como indicador de error
              ctx.fillStyle = 'rgba(255,0,0,0.3)';
              ctx.fillRect(0, -actualStrokeWidth, actualVectorLength, actualStrokeWidth * 2);
              ctx.strokeRect(0, -actualStrokeWidth, actualVectorLength, actualStrokeWidth * 2);
            }
          } else {
            // SVG no disponible - mostrar un marcador simple
            ctx.fillStyle = 'rgba(200,200,200,0.5)';
            ctx.fillRect(0, -actualStrokeWidth, actualVectorLength, actualStrokeWidth * 2);
            ctx.strokeRect(0, -actualStrokeWidth, actualVectorLength, actualStrokeWidth * 2);
          }
          break;
        }
        
        case 'line':
        default: {
          // Línea simple (caso base, por defecto)
          ctx.moveTo(0, 0);
          ctx.lineTo(actualVectorLength, 0);
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
    
    const { baseX, baseY, currentAngle, lengthFactor = 1, widthFactor = 1 } = vector;
    
    // Calcular dimensiones reales
    const actualVectorLength = typeof baseVectorLength === 'function' 
      ? baseVectorLength(vector) * lengthFactor 
      : baseVectorLength * lengthFactor;
    
    const actualStrokeWidth = typeof baseVectorWidth === 'function'
      ? baseVectorWidth(vector) * widthFactor
      : baseVectorWidth * widthFactor;
      
    // Calcular desplazamiento para rotación
    const rotationOffset = getRotationOffset(baseRotationOrigin, actualVectorLength);
    
    // Convertir el punto del canvas al sistema de coordenadas del vector
    // 1. Trasladar al origen del vector
    const translatedX = x - baseX;
    const translatedY = y - baseY;
    
    // 2. Rotar en sentido inverso
    const angleInRadians = currentAngle * (Math.PI / 180);
    const rotatedX = translatedX * Math.cos(-angleInRadians) - translatedY * Math.sin(-angleInRadians);
    const rotatedY = translatedX * Math.sin(-angleInRadians) + translatedY * Math.cos(-angleInRadians);
    
    // 3. Considerar el desplazamiento de rotación
    const adjustedX = rotatedX + rotationOffset;
    
    // Definir el área de detección según la forma del vector
    switch (baseVectorShape) {
      case 'dot': {
        // Para un punto, el área es un círculo
        const distance = Math.sqrt(Math.pow(rotatedX, 2) + Math.pow(rotatedY, 2));
        return distance <= actualStrokeWidth * 1.5; // Área un poco más grande para facilitar la interacción
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
    for (let i = vectors.length - 1; i >= 0; i--) {
      if (isPointInVector(x, y, vectors[i])) {
        return vectors[i];
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

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        display: 'block', 
        width: width + 'px', 
        height: height + 'px', 
        cursor: hoveredVectorId ? 'pointer' : 'default' 
      }}
      onClick={interactionEnabled && onVectorClick ? handleClick : undefined}
      onMouseMove={interactionEnabled && onVectorHover ? handleMouseMove : undefined}
      onMouseLeave={interactionEnabled && onVectorHover ? handleMouseLeave : undefined}
    />
  );
};

export default VectorCanvasRenderer;
