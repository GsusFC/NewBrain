'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { 
  AnimatedVectorItem,
  VectorColorValue,
  VectorShape,
  GradientConfig,
  VectorLengthValue,
  VectorWidthValue,
  FrameInfo,
} from '../core/types';

// Definiciones internas de tipos
type StrokeLinecap = 'butt' | 'round' | 'square';
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

// Extensión de AnimatedVectorItem para permitir propiedades adicionales
interface ExtendedVectorItem extends AnimatedVectorItem {
  shape?: VectorShape;
  strokeWidth?: number;
  strokeLinecap?: StrokeLinecap;
  color?: VectorColorValue;
}

// Interfaz para los metadatos de renderizado de vectores
interface VectorRenderMetadata {
  isHovered: boolean;
  isSelected?: boolean;
  cachedTransformation?: DOMMatrix;
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
  frameInfo: FrameInfo;
}

// --- Helpers para el renderizado ---
const getRotationOffset = (origin: RotationOrigin, length: number): number => {
  switch (origin) {
    case 'start': return 0;
    case 'center': return length / 2;
    case 'end': return length;
    default: return 0;
  }
};

// Función auxiliar para calcular la longitud actual de un vector
const calculateVectorLength = (
  item: AnimatedVectorItem, 
  baseLength: VectorLengthValue,
  frameInfo: FrameInfo
): number => {
  // Si baseLength es una función, calcular el valor base dinámicamente
  const baseValue = typeof baseLength === 'function' 
    ? baseLength(item, frameInfo) 
    : baseLength;
    
  // Aplicar el factor de longitud del vector (calculado en la animación)
  return baseValue * (item.lengthFactor ?? 1);
};

// Función auxiliar para calcular el grosor actual de un vector
const calculateVectorWidth = (
  item: AnimatedVectorItem, 
  baseWidth: VectorWidthValue,
  frameInfo: FrameInfo
): number => {
  // Si baseWidth es una función, calcular el valor base dinámicamente
  const baseValue = typeof baseWidth === 'function' 
    ? baseWidth(item, frameInfo) 
    : baseWidth;
    
  // Aplicar el factor de grosor del vector (calculado en la animación)
  return baseValue * (item.widthFactor ?? 1);
};

// Función auxiliar para calcular el color actual de un vector
const calculateVectorColor = (
  item: AnimatedVectorItem, 
  baseColor: VectorColorValue,
  frameInfo: FrameInfo,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): string | CanvasGradient => {
  // Si baseColor es una función, calcular el color dinámicamente
  if (typeof baseColor === 'function') {
    try {
      const calculatedColor = baseColor(item, frameInfo);
      if (typeof calculatedColor === 'string') {
        return calculatedColor;
      }
    } catch (err) {
      console.error('Error al calcular color dinámico:', err);
    }
  }
  
  // Si es un gradiente, crearlo
  if (baseColor && typeof baseColor === 'object') {
    const gradConfig = baseColor as GradientConfig;
    return createGradient(gradConfig, ctx, x, y, width, height);
  }
  
  // Valor base como string simple
  return baseColor as string;
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
const isVectorInBounds = (vector: AnimatedVectorItem, bounds: CullingBounds, vectorLength: number): boolean => {
  // Margen adicional alrededor del viewport para evitar cortes bruscos
  const margin = vectorLength * 1.5;
  
  return (
    vector.baseX >= bounds.x - margin &&
    vector.baseX <= bounds.x + bounds.width + margin &&
    vector.baseY >= bounds.y - margin &&
    vector.baseY <= bounds.y + bounds.height + margin
  );
};

// Función auxiliar para obtener metadatos del vector (hover, selección, etc.)
const getVectorMetadata = (item: AnimatedVectorItem, hoveredId?: string | null): VectorRenderMetadata => {
  return {
    isHovered: Boolean(hoveredId && item.id === hoveredId),
    isSelected: false
  };
};

export const VectorCanvasRenderer: React.FC<VectorCanvasRendererProps> = ({
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
  frameInfo
}) => {
  // Referencia para el canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cache para SVG personalizado si existe
  const userSvgCacheRef = useRef<HTMLCanvasElement | null>(null);
  
  // Estados para gestionar la interactividad
  const [hoveredVectorId, setHoveredVectorId] = useState<string | null>(null);
  
  // Referencias para animación
  const rafIdRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  
  // Calcular vectores visibles (aplicar culling espacial)
  const visibleVectors = useMemo(() => {
    if (!cullingEnabled) return vectors;
    
    // Si el culling está activado, solo renderizar vectores en el viewport
    const bounds: CullingBounds = {
      x: 0,
      y: 0,
      width,
      height
    };
    
    return vectors.filter(vector => {
      // Calcular longitud para determinar el margen de culling
      const vectorLength = calculateVectorLength(vector, baseVectorLength, frameInfo);
      
      return isVectorInBounds(vector, bounds, vectorLength);
    });
  }, [vectors, cullingEnabled, width, height, baseVectorLength, frameInfo]);

  // Función para configurar un canvas (dimensiones, DPR, etc.)
  const setupCanvas = useCallback((canvas: HTMLCanvasElement | null, clear: boolean = true): CanvasRenderingContext2D | null => {
    if (!canvas || width <= 0 || height <= 0) return null;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    
    // Limpiar canvas si es necesario
    if (clear) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    return ctx;
  }, [backgroundColor, width, height]);
  
  // Efecto para renderizar el cache de SVG si existe
  useEffect(() => {
    if (!userSvgString || !Canvg) return;
    
    const createSvgCache = async () => {
      try {
        // Crear un canvas temporal para renderizar el SVG
        const cacheCanvas = document.createElement('canvas');
        const ctx = cacheCanvas.getContext('2d');
        if (!ctx) return;
        
        // Tamaño base para el SVG (se escalará al renderizar)
        cacheCanvas.width = 100;
        cacheCanvas.height = 100;
        
        // Crear SVG y renderizarlo en el canvas
        const v = await Canvg.from(ctx, userSvgString, {
          ignoreMouse: true,
          ignoreAnimation: true,
          preserveAspectRatio: userSvgPreserveAspectRatio || 'xMidYMid meet'
        });
        
        await v.render();
        
        // Guardar el canvas en la referencia
        userSvgCacheRef.current = cacheCanvas;
      } catch (err) {
        console.error('Error al renderizar SVG en cache:', err);
        userSvgCacheRef.current = null;
      }
    };
    
    createSvgCache();
  }, [userSvgString, userSvgPreserveAspectRatio]);
  
  // Función principal para renderizar los vectores visibles
  const renderVectors = useCallback(() => {
    if (!canvasRef.current) return;
    
    const ctx = setupCanvas(canvasRef.current);
    if (!ctx) return;
    
    // Variables para rendimiento
    const startTime = performance.now();
    let vectorsDrawn = 0;
    let pathsGrouped = 0;
    
    // Técnica de batching - agrupar vectores por forma y color para minimizar cambios de contexto
    const batchedVectors: Map<string, AnimatedVectorItem[]> = new Map();
    
    visibleVectors.forEach(vector => {
      // Tratar vector como ExtendedVectorItem para acceder a propiedades opcionales
      const extVector = vector as ExtendedVectorItem;
      
      // Clave de agrupación: forma + grosor + estilo de línea
      const shape = extVector.shape ?? baseVectorShape;
      const width = calculateVectorWidth(vector, baseVectorWidth, frameInfo);
      const linecap = extVector.strokeLinecap ?? baseStrokeLinecap;
      
      const batchKey = `${shape}-${width.toFixed(1)}-${linecap}`;
      
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
        const actualVectorLength = calculateVectorLength(item, baseVectorLength, frameInfo);
        const actualStrokeWidth = calculateVectorWidth(item, baseVectorWidth, frameInfo);
        
        // Obtener metadatos del vector (hover, selección, etc.)
        const metadata = getVectorMetadata(item, hoveredVectorId);
        
        // Guardar estado actual del contexto
        ctx.save();
        
        // Posicionar y rotar
        ctx.translate(baseX, baseY);
        ctx.rotate((currentAngle || 0) * (Math.PI / 180));
        
        // Aplicar rotationOrigin
        const rotationOffset = getRotationOffset(baseRotationOrigin, actualVectorLength);
        ctx.translate(-rotationOffset, 0);
        
        // Configurar estilo
        ctx.lineWidth = actualStrokeWidth;
        ctx.lineCap = (item as ExtendedVectorItem).strokeLinecap ?? baseStrokeLinecap;
        
        // Determinar color a usar
        let styleColor: string | CanvasGradient = '#000000'; // Color por defecto
        
        if (typeof baseVectorColor === 'string') {
          // Color simple (string)
          styleColor = baseVectorColor;
        } else if (typeof baseVectorColor === 'function') {
          // Función que genera un color
          try {
            // Pasamos el vector actual, frame actual, total frames 1, y timestamp actual
            const calculatedColor = baseVectorColor(item, frameInfo);
            if (typeof calculatedColor === 'string') {
              styleColor = calculatedColor;
            }
          } catch (err) {
            console.error('Error al calcular color dinámico:', err);
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
              
              if (gradConfig.type === 'linear') {
                // Gradiente lineal
                const x1 = Number(gradConfig.coords.x1 ?? 0) * unitFactorX;
                const y1 = Number(gradConfig.coords.y1 ?? 0) * unitFactorY;
                const x2 = Number(gradConfig.coords.x2 ?? 1) * unitFactorX;
                const y2 = Number(gradConfig.coords.y2 ?? 0) * unitFactorY;
                
                gradient = ctx.createLinearGradient(
                  x1, y1, x2, y2
                );
              } else {
                // Gradiente radial
                const cx = Number(gradConfig.coords.cx ?? 0.5) * unitFactorX;
                const cy = Number(gradConfig.coords.cy ?? 0.5) * unitFactorY;
                const r = Number(gradConfig.coords.r ?? 0.5) * Math.max(unitFactorX, unitFactorY);
                
                // Origen interno del gradiente
                const fx = Number(gradConfig.coords.fx ?? cx);
                const fy = Number(gradConfig.coords.fy ?? cy);
                
                gradient = ctx.createRadialGradient(
                  fx, fy, 0, // Origen interno del gradiente
                  cx, cy, r  // Origen externo y radio final
                );
              }
              
              // Añadir paradas de color
              for (const stop of gradConfig.stops) {
                gradient.addColorStop(
                  stop.offset, 
                  stop.color
                );
              }
              
              styleColor = gradient;
            } catch (err) {
              console.error('Error al crear gradiente:', err);
            }
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
              if (userSvgCacheRef.current) {
                const svgSize = actualVectorLength;
                ctx.drawImage(userSvgCacheRef.current, 0, -svgSize / 2, svgSize, svgSize);
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
    baseRotationOrigin
  ]);
  
  // Función para renderizar el canvas completo
  const renderCanvas = useCallback(() => {
    renderVectors();
  }, [renderVectors]);
  
  // Loop de animación principal
  const animationLoop = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastRenderTimeRef.current;
    
    // Solo renderizar si han pasado suficientes ms (máx 60 FPS)
    if (elapsed > 16) { // ~60fps
      renderCanvas();
      
      // Actualizar timestamp
      lastRenderTimeRef.current = now;
    }
    
    // Continuar el loop
    rafIdRef.current = requestAnimationFrame(animationLoop);
  }, [renderCanvas]);

  // Iniciar y detener loop de animación
  useEffect(() => {
    // Iniciar loop
    lastRenderTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(animationLoop);
    
    // Limpiar al desmontar
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [animationLoop]);

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
  
  // Debugging Info - opcional, para mostrar estadísticas
  const [debugStats, setDebugStats] = useState<{totalVectors: number, visibleVectors: number, fps: number} | null>(null);
  
  // Actualizar stats solo en el cliente y solo cuando debugMode está activo
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
    
    // Se actualizará con cada frame
    const statsInterval = setInterval(() => {
      setDebugStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalVectors: vectors.length,
          visibleVectors: visibleVectors.length,
          fps: Math.round(1000 / (performance.now() - lastRenderTimeRef.current + 0.1))
        };
      });
    }, 500); // Actualizar cada 500ms para evitar demasiados rerenders
    
    return () => clearInterval(statsInterval);
  }, [debugMode, vectors, visibleVectors]);
  
  // Renderizar el componente
  return (
    <div
      className="vector-canvas-renderer"
      style={{ 
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      {/* Canvas principal */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'auto', // para capturar eventos
          border: debugMode ? '1px solid red' : 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
      />
      
      {/* Overlay de Debug (opcional) */}
      {debugMode && debugStats && (
        <div
          style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            padding: '5px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '12px',
            borderRadius: '3px',
            zIndex: 100
          }}
        >
          <div>Total: {debugStats.totalVectors}</div>
          <div>Visible: {debugStats.visibleVectors}</div>
          <div>FPS: {debugStats.fps}</div>
          {cullingEnabled && <div>Culling: ✅</div>}
        </div>
      )}
    </div>
  );
}
