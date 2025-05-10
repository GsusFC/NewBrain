// Ruta: src/components/vector/renderers/VectorCanvasRenderer.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import type { 
  AnimatedVectorItem,
  VectorColorValue,
  VectorShape,
  StrokeLinecap,
  RotationOrigin,
  GradientConfig,
} from '../core/types';

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
  customRenderer?: (renderProps: any, ctx: CanvasRenderingContext2D) => void;
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
  onVectorClick,
  onVectorHover,
  interactionEnabled = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredVectorId, setHoveredVectorId] = React.useState<string | null>(null);

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

    // Renderizar cada vector
    vectors.forEach(item => {
      const { baseX, baseY, currentAngle, lengthFactor = 1, widthFactor = 1 } = item;
      
      // Determinar longitud y ancho del vector
      const actualVectorLength = typeof baseVectorLength === 'function' 
        ? baseVectorLength(item) * lengthFactor 
        : baseVectorLength * lengthFactor;
      
      const actualStrokeWidth = typeof baseVectorWidth === 'function'
        ? baseVectorWidth(item) * widthFactor
        : baseVectorWidth * widthFactor;
      
      // Calcular offset de rotación
      const rotationOffset = getRotationOffset(baseRotationOrigin, actualVectorLength);
      
      // Guardar estado del contexto
      ctx.save();
      
      // Determinar el color a utilizar (string, función o gradiente)
      let styleColor: string | CanvasGradient = '#000000'; // Color por defecto
      
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
              
              gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            } else {
              // Gradiente radial
              const cx = Number(gradConfig.coords.cx ?? 0.5) * unitFactorX;
              const cy = Number(gradConfig.coords.cy ?? 0) * unitFactorY;
              const r = Number(gradConfig.coords.r ?? 0.5) * Math.min(unitFactorX, unitFactorY);
              
              // Valores opcionales para radial
              const fx = Number(gradConfig.coords.fx ?? gradConfig.coords.cx ?? 0.5) * unitFactorX;
              const fy = Number(gradConfig.coords.fy ?? gradConfig.coords.cy ?? 0) * unitFactorY;
              
              gradient = ctx.createRadialGradient(
                cx, cy, 0, // Origen interno del gradiente
                fx, fy, r  // Origen externo y radio final
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
