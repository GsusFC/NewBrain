// Vector Canvas Renderer: Implementación del renderer de Canvas para vectores

'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';
import type { 
  AnimatedVectorItem,
  VectorColorValue,
  VectorShape,
  GradientConfig,
} from '../core/types';

// Importar módulos de utilidades
import { ensureSafeNumber, fixPrecision, lerp } from '../utils/numericUtils';
import { ensureContrastColor, rgbToHex } from '../utils/colorUtils';

// Fallback para parseColorWithFallback si no existe en colorUtils
const parseColorWithFallback = (color?: string | null, fallback = '#a0a0a0'): string => {
  if (!color || typeof color !== 'string') return fallback;
  return color;
};

import { applyCulling, calculateAdaptivePadding, ViewportBounds } from '../utils/cullingUtils';
import { createCanvasGradient } from '../utils/gradientUtils';
import { createComponentLogger } from '../utils/debugUtils';

// Tipos adicionales para el VectorCanvasRenderer
type VectorLengthValue = number | ((item: AnimatedVectorItem) => number);
type VectorWidthValue = number | ((item: AnimatedVectorItem) => number);
type RotationOrigin = 'start' | 'center' | 'end';

// Extensión de AnimatedVectorItem para permitir propiedades adicionales
interface ExtendedVectorItem extends AnimatedVectorItem {
  shape?: VectorShape;
  strokeWidth?: number;
  strokeLinecap?: StrokeLinecap;
  // color ya está en AnimatedVectorItem como string
}

// Props del componente VectorCanvasRenderer
interface VectorCanvasRendererProps {
  vectors: AnimatedVectorItem[];
  width: number;
  height: number;
  backgroundColor?: string;
  baseVectorLength: VectorLengthValue;
  baseVectorColor: VectorColorValue;
  baseVectorWidth: VectorWidthValue;
  baseStrokeLinecap?: StrokeLinecap;
  baseVectorShape: VectorShape;
  baseRotationOrigin: RotationOrigin;
  customRenderer?: (renderProps: any) => React.ReactNode;
  userSvgString?: string;
  userSvgPreserveAspectRatio?: string;
  onVectorClick?: (item: AnimatedVectorItem, event: React.MouseEvent<HTMLCanvasElement>) => void;
  onVectorHover?: (item: AnimatedVectorItem | null, event: React.MouseEvent<HTMLCanvasElement>) => void;
  getDynamicLength?: (item: AnimatedVectorItem) => number;
  getDynamicWidth?: (item: AnimatedVectorItem) => number;
  useDynamicProps?: boolean;
  interactionEnabled?: boolean;
  debugMode?: boolean;
  cullingEnabled?: boolean;
  frameInfo?: FrameInfo;
}

// Definición de FrameInfo para información del frame actual
interface FrameInfo {
  timestamp: number;
  frameCount: number;
  deltaTime: number;
  totalFrames: number;
}
type StrokeLinecap = CanvasLineCap; // 'butt' | 'round' | 'square'
type RotationOrigin = 'start' | 'center' | 'end';

// Importar Canvg de forma condicional para el cache SVG
let Canvg: any;
// En el lado del cliente, importamos Canvg
if (typeof window !== 'undefined') {
  import('canvg').then(module => {
    Canvg = module;
  }).catch(() => {
    console.warn('Canvg no está disponible, el renderizado de SVG en Canvas será limitado');
  });
}

// Interfaz para el sistema de culling (recorte espacial)
interface CullingBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Interfaz para los metadatos de renderizado de vectores
interface VectorRenderMetadata {
  isHovered: boolean;
  isSelected: boolean;
}

// Interfaz para los parámetros de renderizado personalizado
interface CustomRenderProps {
  item: AnimatedVectorItem;
  length: number;
  width: number;
  metadata: VectorRenderMetadata;
}

// --- Props del Componente Renderer ---
interface VectorCanvasRendererProps {
  vectors: AnimatedVectorItem[];
  width: number;
  height: number;
  backgroundColor?: string;
  baseVectorLength: VectorLengthValue;
  baseVectorColor: VectorColorValue;
  baseVectorWidth: VectorWidthValue;
  baseStrokeLinecap?: StrokeLinecap;
  baseVectorShape?: VectorShape;
  baseRotationOrigin?: RotationOrigin;
  customRenderer?: (renderProps: CustomRenderProps, ctx: CanvasRenderingContext2D) => void;
  userSvgString?: string;
  userSvgPreserveAspectRatio?: string;
  onVectorClick?: (item: AnimatedVectorItem, event: React.MouseEvent) => void;
  onVectorHover?: (item: AnimatedVectorItem | null, event: React.MouseEvent) => void;
  interactionEnabled?: boolean;
  cullingEnabled?: boolean;
  debugMode?: boolean;
  frameInfo?: FrameInfo;
}

// Función auxiliar para calcular el desplazamiento de rotación
const getRotationOffset = (origin: RotationOrigin, length: number): number => {
  const safeLength = ensureSafeNumber(length);
  
  switch (origin) {
    case 'start': return 0;
    case 'center': return ensureSafeNumber(safeLength / 2);
    case 'end': return safeLength;
    default: return 0;
  }
};

// Función auxiliar para calcular la longitud actual de un vector
const calculateVectorLength = (
  item: AnimatedVectorItem, 
  baseLength: VectorLengthValue,
  frameInfo?: FrameInfo
): number => {
  // Calcular longitud base
  const baseValue = typeof baseLength === 'function' 
    ? baseLength(item) // Usamos solo el item ya que la función ahora solo acepta ese parámetro
    : baseLength;
    
  // Aplicar el factor de longitud del vector (calculado en la animación)
  return fixPrecision(baseValue * item.lengthFactor);
};

// Función auxiliar para calcular el grosor actual de un vector
const calculateVectorWidth = (
  item: AnimatedVectorItem, 
  baseWidth: VectorWidthValue,
  frameInfo?: FrameInfo
): number => {
  // Calcular grosor base
  const baseValue = typeof baseWidth === 'function' 
    ? baseWidth(item) 
    : baseWidth;
    
  // Aplicar el factor de grosor del vector y asegurar un valor mínimo
  return Math.max(0.5, fixPrecision(baseValue * item.widthFactor));
};

// Función auxiliar para calcular el color actual de un vector
const calculateVectorColor = (
  item: AnimatedVectorItem, 
  baseColor: VectorColorValue,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frameInfo?: FrameInfo
): string | CanvasGradient => {
  // Si el vector tiene un color específico, usarlo
  if (item.color) {
    if (typeof item.color === 'string') {
      return item.color;
    } else if (typeof item.color === 'object' && item.color !== null) {
      return createCanvasGradient(ctx, item.color, x, y);
    }
  }
  
  // Si color es una función dinámica, ejecutarla
  if (typeof baseColor === 'function') {
    const timestamp = frameInfo?.timestamp || Date.now();
    const frameCount = frameInfo?.frameCount || 0;
    const totalFrames = frameInfo?.totalFrames || 1000;
    
    const dynamicColor = baseColor(item, frameCount, totalFrames, timestamp);
    if (typeof dynamicColor === 'string') {
      return dynamicColor;
    }
  }

  // Si es un gradiente, crearlo
  if (baseColor && typeof baseColor === 'object') {
    const gradConfig = baseColor as GradientConfig;
    return createCanvasGradient(ctx, gradConfig, x, y);
  }
  
  // Valor base como string simple
  return typeof baseColor === 'string' ? baseColor : '#000000';
};

// Función para crear un gradiente en el canvas
const createGradient = (
  gradConfig: GradientConfig,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): CanvasGradient => {
  let gradient: CanvasGradient;
  
  if (gradConfig.type === 'linear') {
    // Gradiente lineal
    const coords = gradConfig.coords || {};
    const x1 = Number(coords.x1 ?? 0) * width;
    const y1 = Number(coords.y1 ?? 0) * height;
    const x2 = Number(coords.x2 ?? 1) * width;
    const y2 = Number(coords.y2 ?? 0) * height;
    
    gradient = ctx.createLinearGradient(
      x + x1, 
      y + y1, 
      x + x2, 
      y + y2
    );
  } else {
    // Gradiente radial (por defecto)
    const coords = gradConfig.coords || {};
    const cx = Number(coords.cx ?? 0.5) * width;
    const cy = Number(coords.cy ?? 0.5) * height;
    const r = Number(coords.r ?? 0.5) * Math.max(width, height);
    
    // Valores para el círculo interior (opcional)
    const fx = Number(coords.fx ?? cx) * width;
    const fy = Number(coords.fy ?? cy) * height;
    
    gradient = ctx.createRadialGradient(
      x + fx, 
      y + fy, 
      0, 
      x + cx, 
      y + cy, 
      r
    );
  }
  
  // Añadir paradas de color
  for (const stop of gradConfig.stops || []) {
    gradient.addColorStop(stop.offset, stop.color);
  }
  
  return gradient;
};

// Función para determinar si un vector está dentro de los límites de visualización
const isVectorInBounds = (vector: AnimatedVectorItem, bounds: ViewportBounds, padding: number): boolean => {
  // Obtener posición del vector
  const { x, y } = vector;
  
  // Comprobar si el punto base del vector está en los límites con padding
  return (
    x >= bounds.minX - padding && 
    x <= bounds.maxX + padding && 
    y >= bounds.minY - padding && 
    y <= bounds.maxY + padding
  );
};

// Función auxiliar para obtener metadatos del vector (hover, selección, etc.)
const getVectorMetadata = (item: AnimatedVectorItem, hoveredId?: string | null): VectorRenderMetadata => {
  return {
    isHovered: Boolean(hoveredId && item.id === hoveredId),
    isSelected: false
  };

// Definición del componente principal
const VectorCanvasRenderer = ({ 
  vectors,
  width,
  height,
  backgroundColor = 'transparent',
  baseVectorLength,
  baseVectorColor,
  baseVectorWidth,
  baseStrokeLinecap = 'round',
  baseVectorShape = 'line',
  baseRotationOrigin = 'center',
  customRenderer,
  userSvgString,
  userSvgPreserveAspectRatio,
  onVectorClick,
  onVectorHover,
  interactionEnabled = true,
  cullingEnabled = true,
  debugMode = false,
  frameInfo = { timestamp: Date.now(), frameCount: 0, deltaTime: 0, totalFrames: 1000 }
}: VectorCanvasRendererProps) => {
  // Inicializar el logger para este componente con throttling
  const logger = useMemo(() => {
    return createComponentLogger('VectorCanvasRenderer', {
      enabled: !!debugMode,
      throttleInterval: 2000, // Reducir logs a máximo uno cada 2 segundos
      level: 'info'
    });
  }, [debugMode]);

  // Referencia para el canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cache para SVG personalizado si existe
  const svgCacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Estados para gestionar la interactividad
  const [hoveredVectorId, setHoveredVectorId] = useState<string | null>(null);
  
  // Referencias para animación
  const animationFrameRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  
  // Función para configurar un canvas (dimensiones, DPR, etc.)
  const setupCanvas = useCallback((canvas: HTMLCanvasElement | null, clear: boolean = true): CanvasRenderingContext2D | null => {
    if (!canvas || width <= 0 || height <= 0) return null;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    
    // Limpiar canvas si es necesario
    if (clear) {
      ctx.clearRect(0, 0, width, height);
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
    }
    
    // Configuración avanzada para alta calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Optimización para pantallas de alta densidad
    const pixelRatio = window.devicePixelRatio || 1;
    if (pixelRatio > 1) {
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      ctx.scale(pixelRatio, pixelRatio);
    }
    
    return ctx;
  }, [backgroundColor, width, height]);
  
  // Calcular vectores visibles
  // Calcular padding para culling adaptativo usando la utilidad compartida
  const canvasPadding = useMemo(() => {
    const baseLengthValue = typeof baseVectorLength === 'number' 
      ? baseVectorLength 
      : (vectors.length > 0 ? 20 : 50);
    
    return calculateAdaptivePadding(vectors, 150);
  }, [baseVectorLength, vectors]);
  
  // Aplicar culling optimizado usando la función de utilidad
  const visibleVectors = useMemo(() => {
    if (!cullingEnabled || vectors.length === 0) return vectors;
    
    // Asegurar que las dimensiones sean válidas
    if (width <= 0 || height <= 0) {
      if (debugMode) {
        logger.warn('Dimensiones inválidas para culling', { width, height });
      }
      return vectors;
    }
    
    try {
      // Aplicar culling para optimizar renderizado
      logger.debug(`Aplicando culling: ${vectors.length} vectores, viewport ${width}x${height}`);
      
      // Usar el padding adaptativo calculado
      return applyCulling(vectors, width, height, canvasPadding);
    } catch (error) {
      logger.error('Error al aplicar culling:', error);
      return vectors;
    }

      // Usar la utilidad de culling compartida
      return applyCulling(vectors, viewport, {
        padding: canvasPadding,
        enableLOD: vectors.length > 200, // Activar LOD solo con muchos vectores
        useQuadtree: false
      });
    } catch (error) {
      if (debugMode) {
        logger.error('Error durante culling', error);
      }
      return vectors; // En caso de error, devolver todos los vectores
    }
  }, [vectors, width, height, cullingEnabled, canvasPadding, debugMode, logger]);

  // Efecto para renderizar el cache de SVG si existe
  useEffect(() => {
    if (!userSvgString || !Canvg) return;
    
    const createSvgCache = async () => {
      try {
        // Crear canvas fuera de pantalla para renderizar
        const cacheCanvas = document.createElement('canvas');
        const ctx = cacheCanvas.getContext('2d');
        if (!ctx) return;
        
        // Configurar dimensiones iniciales
        cacheCanvas.width = 100;
        cacheCanvas.height = 100;
        
        // Crear SVG y renderizarlo en el canvas
        const v = await Canvg.from(ctx, userSvgString, {
          ignoreMouse: true,
          ignoreAnimation: true,
          preserveAspectRatio: userSvgPreserveAspectRatio || 'xMidYMid meet'
        });
        
        await v.render();
        
        // Guardar el canvas en la referencia para uso futuro
        svgCacheCanvasRef.current = cacheCanvas;
      } catch (error) {
        console.error('Error al crear cache SVG:', error);
      }
    };
    
    createSvgCache();
  }, [userSvgString, userSvgPreserveAspectRatio]);

  // Renderizar el contenido del canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }
    
    // Limpiar el canvas antes de renderizar
    ctx.clearRect(0, 0, width, height);
    
    // Establecer color de fondo si no es transparente
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Asegurarnos que frameInfo tenga un valor válido y completo
    const currentFrameInfo: FrameInfo = {
      timestamp: frameInfo?.timestamp || Date.now(),
      frameCount: frameInfo?.frameCount || 0,
      deltaTime: frameInfo?.deltaTime || 16.667, // ~60fps
      totalFrames: frameInfo?.totalFrames || 1000
    };
    
    // Variables para rendimiento
    let vectorsDrawn = 0;
    let pathsGrouped = 0;
    
    // Técnica de batching - agrupar vectores por forma y color para minimizar cambios de contexto
    const batchedVectors: Map<string, AnimatedVectorItem[]> = new Map();
    
    visibleVectors.forEach(vector => {
      // Tratar vector como ExtendedVectorItem para acceder a propiedades adicionales
      const extVector = vector as ExtendedVectorItem;
      
      // Clave de agrupación: forma + grosor + estilo de línea
      const shape = extVector.shape ?? baseVectorShape;
      const strokeWidth = calculateVectorWidth(vector, baseVectorWidth, currentFrameInfo);
      const linecap = extVector.strokeLinecap ?? baseStrokeLinecap;
      
      const batchKey = `${shape}-${strokeWidth.toFixed(1)}-${linecap}`;
      
      if (!batchedVectors.has(batchKey)) {
        batchedVectors.set(batchKey, []);
      }
      
      batchedVectors.get(batchKey)?.push(vector);
    });
    
    // Renderizar cada batch de vectores
    batchedVectors.forEach((vectorBatch) => {
      vectorBatch.forEach(item => {
        const { baseX, baseY, currentAngle, lengthFactor = 1, widthFactor = 1 } = item;
        
        // Determinar longitud y ancho del vector
        const actualVectorLength = calculateVectorLength(item, baseVectorLength, currentFrameInfo);
        const actualStrokeWidth = calculateVectorWidth(item, baseVectorWidth, currentFrameInfo);
        
        // Obtener metadatos del vector (hover, selección, etc.)
        const metadata = getVectorMetadata(item, hoveredVectorId);
        
        // Guardar estado actual del contexto
        ctx.save();
        
        // Posicionar y rotar
        ctx.translate(baseX, baseY);
        ctx.rotate((currentAngle || 0) * (Math.PI / 180));
        
        // Calcular punto de inicio de rotación según origen
        // Nos aseguramos de que el valor sea uno de los permitidos por RotationOrigin
        const safeRotationOrigin = (baseRotationOrigin || 'center') as RotationOrigin;
        const rotationOffset = getRotationOffset(safeRotationOrigin, actualVectorLength);
        ctx.translate(-rotationOffset, 0);
        
        // Configurar estilo de trazo
        ctx.lineWidth = actualStrokeWidth;
        
        // Usar el strokeLinecap del vector si está especificado, o el valor base si no
        // Casting necesario para TypeScript ya que sabemos que estos valores son compatibles
        ctx.lineCap = (item.strokeLinecap || baseStrokeLinecap || 'round') as CanvasLineCap;
        
        // Determinar color a usar
        let styleColor: string | CanvasGradient = '#000000'; // Color por defecto
        
        if (typeof baseVectorColor === 'string') {
          // Asegurar mejor contraste para colores sólidos
          styleColor = ensureContrastColor(baseVectorColor, backgroundColor || '#000000');
        } else if (typeof baseVectorColor === 'object' && baseVectorColor !== null) {
          // Manejar objeto GradientConfig para gradientes
          try {
            if ('type' in baseVectorColor && baseVectorColor.type === 'linear') {
              const gradient = ctx.createLinearGradient(
                0, 0, actualVectorLength, 0
              );
              
              baseVectorColor.stops.forEach(stop => {
                // Mejorar contraste en cada parada del gradiente si es necesario
                const enhancedColor = typeof stop.color === 'string' 
                  ? ensureContrastColor(stop.color, backgroundColor || '#000000')
                  : stop.color;
                gradient.addColorStop(stop.offset, enhancedColor);
              });
              
              styleColor = gradient;
            }
          } catch (error) {
            console.error('[VectorCanvasRenderer] Error al crear gradiente:', error);
            styleColor = '#a0a0a0'; // Color de fallback con mejor contraste
          }
        } else if (typeof baseVectorColor === 'function') {
          try {
            // Calculamos el timestamp, frameCount, etc. si no se proporciona frameInfo
            const timestamp = currentFrameInfo.timestamp;
            const totalFrames = currentFrameInfo.totalFrames || 1000;
            const frameCount = currentFrameInfo.frameCount || 0;
            
            const calculatedColor = baseVectorColor(item, frameCount, totalFrames, timestamp);
            if (typeof calculatedColor === 'string') {
              styleColor = calculatedColor;
            }
          } catch (err) {
            console.error('Error al calcular color dinámico de vector:', err);
          }
        }
        
        // Efectos especiales para hover
        if (metadata.isHovered) {
          ctx.globalAlpha = 0.8;
          ctx.shadowColor = 'rgba(0, 0, 255, 0.5)';
          ctx.shadowBlur = 10;
        }
        
        ctx.strokeStyle = styleColor;
        
        // Usar renderer personalizado si existe
        if (customRenderer) {
          customRenderer({
            item,
            length: actualVectorLength,
            width: actualStrokeWidth,
            metadata
          }, ctx);
        } else {
          // Dibujar vector según su forma
          const extItem = item as ExtendedVectorItem;
          const shape = extItem.shape || baseVectorShape;
          
          ctx.beginPath();
          
          switch (shape) {
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
                ctx.moveTo(lineLength, 0);
                ctx.lineTo(lineLength - arrowHeadSize, -arrowHeadSize / 2);
                ctx.lineTo(actualVectorLength, 0);
                ctx.lineTo(lineLength - arrowHeadSize, arrowHeadSize / 2);
                ctx.lineTo(lineLength, 0);
                ctx.fillStyle = styleColor;
                ctx.fill();
              } else {
                // Vector demasiado corto, dibujar solo punta
                ctx.moveTo(0, 0);
                ctx.lineTo(actualVectorLength, 0);
                ctx.stroke();
              }
              break;
            }
            
            case 'dot': {
              // Círculo en el punto final del vector
              const radius = actualStrokeWidth;
              ctx.moveTo(0, 0);
              ctx.lineTo(actualVectorLength - radius, 0);
              ctx.stroke();
              
              // Dibujar punto
              ctx.beginPath();
              ctx.arc(actualVectorLength, 0, radius, 0, Math.PI * 2);
              ctx.fillStyle = styleColor;
              ctx.fill();
              break;
            }
            
            case 'custom':
            case 'userSvg': {
              // Usar SVG personalizado si existe cache
              if (svgCacheCanvasRef.current) {
                const svgSize = actualVectorLength;
                ctx.drawImage(svgCacheCanvasRef.current, 0, -svgSize / 2, svgSize, svgSize);
              } else {
                // Fallback a línea si no hay SVG
                ctx.moveTo(0, 0);
                ctx.lineTo(actualVectorLength, 0);
                ctx.stroke();
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
        }
        
        // Restaurar estado
        ctx.restore();
      });
    });
  }, [
    hoveredVectorId,
    baseVectorLength, 
    baseVectorColor,
    baseVectorWidth, 
    baseStrokeLinecap, 
    baseVectorShape,
    customRenderer,
    visibleVectors,
    frameInfo,
    baseRotationOrigin,
    width,
    height
  ]);
  
  // Función para renderizar la info de debug en el canvas
  const drawDebugInfo = useCallback((ctx: CanvasRenderingContext2D, allVectors: AnimatedVectorItem[], visibleVectors: AnimatedVectorItem[]) => { 
    // Dibujar texto de depuración
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Mostrar información de vectores
    ctx.fillText(`Vectors: ${allVectors.length} (${visibleVectors.length} visible)`, 10, 10);
    ctx.fillText(`Culling: ${cullingEnabled ? 'ON' : 'OFF'}`, 10, 25);
  }, [cullingEnabled]);

  // Efecto para el bucle de animación
  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      const elapsed = now - lastRenderTimeRef.current;
      
      // Solo renderizar si han pasado suficientes ms (máx 60 FPS)
      if (elapsed > 16) { // ~60fps
        renderCanvas();
        lastRenderTimeRef.current = now;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Iniciar animación
    lastRenderTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Limpiar al desmontar
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  // Manejadores de eventos para interactividad (hover, click)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactionEnabled || !onVectorHover) return;
    
    // Obtener posición del mouse relativa al contenedor del canvas
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Buscar el vector que está debajo del cursor
    const hoveredVector = visibleVectors.find(vector => {
      // Calcular tamaño de hitbox
      const vectorLength = calculateVectorLength(vector, baseVectorLength, frameInfo);
      
      const vectorWidth = calculateVectorWidth(vector, baseVectorWidth, frameInfo);
      
      // Crear hitbox rectangular simple
      const hitboxSize = Math.max(10, vectorWidth * 2);
      const hitboxLength = vectorLength;
      
      // Calcular ángulo en radianes
      const angleRad = (vector.currentAngle || 0) * (Math.PI / 180);
      
      // Calcular offset de rotación
      const offset = getRotationOffset(baseRotationOrigin, hitboxLength);
      
      // Calcular punto de inicio del vector después de aplicar offset
      const startX = vector.baseX - offset * Math.cos(angleRad);
      const startY = vector.baseY - offset * Math.sin(angleRad);
      
      // Calcular distancia del punto al segmento de línea (simplificado)
      const dx = mouseX - startX;
      const dy = mouseY - startY;
      
      // Proyectar el punto al vector
      const projectionLength = dx * Math.cos(angleRad) + dy * Math.sin(angleRad);
      
      // Verificar si la proyección está dentro de la longitud del vector
      if (projectionLength < 0 || projectionLength > hitboxLength) {
        return false;
      }
      
      // Calcular distancia perpendicular al vector
      const perpDistance = Math.abs(dx * Math.sin(angleRad) - dy * Math.cos(angleRad));
      
      // Está dentro de la hitbox si la distancia perpendicular es menor que la mitad del ancho
      return perpDistance <= hitboxSize / 2;
    });
    
    if (hoveredVector) {
      if (hoveredVector.id !== hoveredVectorId) {
        setHoveredVectorId(hoveredVector.id);
        onVectorHover(hoveredVector, e);
      }
    } else if (hoveredVectorId !== null) {
      // El mouse no está sobre ningún vector
      setHoveredVectorId(null);
      onVectorHover(null, e);
    }
  }, [
    interactionEnabled, 
    onVectorHover,
    visibleVectors,
    hoveredVectorId,
    baseVectorLength,
    baseVectorWidth,
    baseRotationOrigin,
    frameInfo
  ]);
  
  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (interactionEnabled && onVectorHover && hoveredVectorId !== null) {
      setHoveredVectorId(null);
      onVectorHover(null, e);
    }
  }, [interactionEnabled, onVectorHover, hoveredVectorId]);
  
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactionEnabled || !onVectorClick) return;
    
    // Usar el vector actualmente en hover
    if (hoveredVectorId) {
      const clickedVector = visibleVectors.find(
        vector => vector.id === hoveredVectorId
      );
      
      if (clickedVector) {
        onVectorClick(clickedVector, e);
      }
    }
  }, [interactionEnabled, onVectorClick, hoveredVectorId, visibleVectors]);
  
  // Debugging Info - opcional, para mostrar estadísticas, optimizado con throttling
  const [debugStats, setDebugStats] = useState<{totalVectors: number, visibleVectors: number, fps: number} | null>(null);
  
  // Actualizar stats solo en el cliente y solo cuando debugMode está activo, con throttling
  useEffect(() => {
    if (!debugMode) {
      setDebugStats(null);
      return;
    }
    
    // Actualización inicial
    setDebugStats({
      totalVectors: vectors.length,
      visibleVectors: visibleVectors.length,
      fps: 0 // Inicialmente 0, se actualizará durante la animación
    });
    
    // Log inicial con estadísticas básicas
    logger.info('Configuración inicial', {
      vectores: {
        total: vectors.length,
        visibles: visibleVectors.length
      },
      dimensiones: { width, height },
      culling: { activo: cullingEnabled, padding: canvasPadding }
    });
    
    // Se actualizará con menor frecuencia (cada 1s)
    const statsInterval = setInterval(() => {
      const now = performance.now();
      const deltaTime = now - lastRenderTimeRef.current;
      const currentFps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
      
      setDebugStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalVectors: vectors.length,
          visibleVectors: visibleVectors.length,
          fps: currentFps
        };
      });
      
      // Solo registrar cambios significativos en FPS o cantidad de vectores
      if (Math.abs(currentFps - (debugStats?.fps || 0)) > 5) {
        logger.debug('Actualización de rendimiento', { fps: currentFps });
      }
    }, 1000); // Actualizar cada 1s para reducir overhead
    
    return () => clearInterval(statsInterval);
  }, [debugMode, vectors.length, visibleVectors.length, width, height, cullingEnabled, canvasPadding, logger]);
  
  // Renderizar el componente con diseño mejorado
  return (
    <div className="relative w-full h-full">
      {/* Canvas principal */}
      <canvas
        ref={canvasRef}
        className={cn("block w-full h-full", {
          'cursor-pointer': interactionEnabled && onVectorClick,
          'cursor-default': !interactionEnabled || !onVectorClick,
          'border-2 border-dashed border-red-500': debugMode,
        })}
        width={width}
        height={height}
        style={{
          backgroundColor,
          touchAction: 'none',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        data-vectors={visibleVectors.length}
        data-culling={cullingEnabled ? 'enabled' : 'disabled'}
      />
      
      {/* Panel de depuración mejorado */}
      {debugMode && (
        <>
          {/* Panel de información */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded z-10 font-mono">
            <div>Dimensiones: {width}×{height}px</div>
            <div>Vectores: {vectors.length} ({visibleVectors.length} visible)</div>
            <div>Culling: {cullingEnabled ? 'ON' : 'OFF'}</div>
            <div>Hover: {hoveredVectorId || 'ninguno'}</div>
            {debugStats && (
              <div className="mt-1 pt-1 border-t border-white/20">
                <div>FPS: {debugStats.fps}</div>
              </div>
            )}
          </div>
          
          {/* Visualización del área de culling */}
          {cullingEnabled && (
            <div 
              className="absolute border border-dashed border-yellow-500 pointer-events-none z-0 opacity-30"
              style={{
                top: `-${canvasPadding}px`,
                left: `-${canvasPadding}px`,
                width: `${width + canvasPadding * 2}px`,
                height: `${height + canvasPadding * 2}px`,
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

// Exportación simple para evitar errores
export default VectorCanvasRenderer;
