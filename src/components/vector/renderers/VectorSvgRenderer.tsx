// Ruta: src/components/vector/renderers/VectorSvgRenderer.tsx
'use client';

import React, { useMemo, useRef } from 'react';
import type { 
  AnimatedVectorItem,
  VectorColorValue,
  GradientConfig,
  VectorRenderProps,
  VectorShape,
} from '../core/types';

// --- Props del Componente Renderer ---
interface VectorSvgRendererProps {
  vectors: AnimatedVectorItem[];
  width: number;
  height: number;
  backgroundColor?: string;
  baseVectorLength: number | ((item: AnimatedVectorItem) => number);
  baseVectorColor: VectorColorValue;
  baseVectorWidth: number | ((item: AnimatedVectorItem) => number);
  baseStrokeLinecap?: 'butt' | 'round' | 'square';
  baseVectorShape: VectorShape;
  baseRotationOrigin: 'start' | 'center' | 'end';
  customRenderer?: (renderProps: VectorRenderProps) => React.JSX.Element;
  userSvgString?: string;
  userSvgPreserveAspectRatio?: string;
  onVectorClick?: (item: AnimatedVectorItem, event: React.MouseEvent<SVGElement>) => void;
  onVectorHover?: (item: AnimatedVectorItem | null, event: React.MouseEvent<SVGElement>) => void;
  // Propiedades dinámicas adicionales
  getDynamicLength?: (item: AnimatedVectorItem) => number;
  getDynamicWidth?: (item: AnimatedVectorItem) => number;
  useDynamicProps?: boolean;
  // Propiedades adicionales
  interactionEnabled?: boolean;
  debugMode?: boolean;
  frameInfo?: {
    timestamp: number;
    frameCount: number;
    totalFrames: number;
  };
}

// Helpers
const getRotationOffset = (origin: 'start' | 'center' | 'end', length: number): number => {
  switch (origin) {
    case 'center': return length / 2;
    case 'end': return length;
    default: return 0;
  }
};

interface ParsedViewBox { x: number; y: number; width: number; height: number; }

// Función de utilidad para garantizar valores numéricos seguros para atributos SVG
const ensureSafeNumber = (value: unknown, defaultValue: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  return defaultValue;
};

const parseViewBox = (svgString?: string): ParsedViewBox | null => {
  if (!svgString) return null;
  try {
    const match = svgString.match(/viewBox="([^"]+)"/i);
    if (match && match[1]) {
      const [x, y, width, height] = match[1].split(/[\s,]+/).map(Number);
      if ([x, y, width, height].every(v => !isNaN(v))) {
        return { x, y, width, height };
      }
    }
  } catch (e) {
    console.error("Error parsing SVG viewBox", e);
  }
  return null;
};

const getSvgInnerContent = (svgString?: string): string => {
  if (!svgString) return '';
  try {
    const svgTagStart = svgString.indexOf('>') + 1;
    const svgTagEnd = svgString.lastIndexOf('</svg>');
    if (svgTagStart > 0 && svgTagEnd > svgTagStart) {
      return svgString.substring(svgTagStart, svgTagEnd);
    }
  } catch (e) {
    console.error("Error extracting SVG inner content", e);
  }
  return '';
};

// Componente
const VectorSvgRenderer: React.FC<VectorSvgRendererProps> = (props) => {
  const {
    vectors,
    width,
    height,
    backgroundColor = 'transparent',
    baseVectorLength,
    baseVectorColor,
    baseVectorWidth,
    baseStrokeLinecap,
    baseVectorShape,
    baseRotationOrigin,
    customRenderer,
    userSvgString,
    userSvgPreserveAspectRatio = 'xMidYMid meet',
    onVectorClick,
    onVectorHover,
    // Nuevas propiedades dinámicas
    getDynamicLength,
    getDynamicWidth,
    useDynamicProps = false,
    // Propiedades adicionales
    interactionEnabled = true,
    debugMode = false,
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  
  // Verificar dimensiones
  if (width <= 0 || height <= 0) {
    console.error('Error: Las dimensiones del componente deben ser mayores que cero.');
    return null;
  }

  // Defs para gradientes y SVG
  const defsContent = useMemo(() => {
    const gradientMap = new Map<string, { config: GradientConfig, id: string }>();
    let gradientIdCounter = 0;
    const localGradientDefs: React.JSX.Element[] = [];
    
    // Procesar color base si es un GradientConfig
    if (typeof baseVectorColor === 'object' && baseVectorColor !== null && 'type' in baseVectorColor) {
      const key = JSON.stringify(baseVectorColor);
      if (!gradientMap.has(key)) {
        const id = `global-grad-${gradientIdCounter++}`;
        gradientMap.set(key, { config: baseVectorColor, id });
      }
    }

    gradientMap.forEach(({ config, id }) => {
      const commonProps = {
        id,
        gradientUnits: config.units || "objectBoundingBox",
      };
      
      const stops = config.stops.map((stop, i) => (
        <stop
          key={`${id}-stop-${i}`}
          offset={`${stop.offset * 100}%`}
          stopColor={stop.color}
          stopOpacity={stop.opacity !== undefined ? stop.opacity : 1}
        />
      ));
      
      if (config.type === 'linear') {
        localGradientDefs.push(
          <linearGradient key={id} {...commonProps} {...config.coords}>
            {stops}
          </linearGradient>
        );
      } else if (config.type === 'radial') {
        localGradientDefs.push(
          <radialGradient key={id} {...commonProps} {...config.coords}>
            {stops}
          </radialGradient>
        );
      }
    });

    // SVG de usuario
    let userSymbolDef: React.JSX.Element | null = null;
    if (baseVectorShape === 'userSvg' && userSvgString) {
      const userSymbolViewBox = parseViewBox(userSvgString);
      const innerContent = getSvgInnerContent(userSvgString);
      
      if (innerContent) {
        userSymbolDef = (
          <symbol
            id="userProvidedSymbol"
            key="userProvidedSymbol"
            viewBox={userSymbolViewBox ? 
              `${userSymbolViewBox.x} ${userSymbolViewBox.y} ${userSymbolViewBox.width} ${userSymbolViewBox.height}` : 
              undefined}
            preserveAspectRatio={userSvgPreserveAspectRatio}
          >
            <g dangerouslySetInnerHTML={{ __html: innerContent }} />
          </symbol>
        );
      }
    }

    if (localGradientDefs.length > 0 || userSymbolDef) {
      return (
        <defs>
          {localGradientDefs}
          {userSymbolDef}
        </defs>
      );
    }
    
    return null;
  }, [baseVectorColor, baseVectorShape, userSvgString, userSvgPreserveAspectRatio]);

  // Función para renderizar cada vector
  const renderVector = (item: AnimatedVectorItem, index: number) => {
    try {
      const resolvedBaseLength = typeof baseVectorLength === 'function'
        ? baseVectorLength(item)
        : baseVectorLength;

      const resolvedBaseWidth = typeof baseVectorWidth === 'function'
        ? baseVectorWidth(item)
        : baseVectorWidth;

      // Extraer propiedades del vector con valores por defecto seguros
      const { id, baseX, baseY, currentAngle } = item;
      
      // Determinar si usamos props dinámicas o estáticas
      let actualLength: number;
      let actualStrokeWidth: number;
      
      // Si useDynamicProps está activado y tenemos funciones dinámicas, las usamos directamente
      if (useDynamicProps && getDynamicLength && getDynamicWidth) {
        actualLength = ensureSafeNumber(getDynamicLength(item), 30);
        actualStrokeWidth = ensureSafeNumber(getDynamicWidth(item), 2);
      } else {
        // Usar el método tradicional con factores
        const lengthFactor = typeof item.lengthFactor === 'number' && !isNaN(item.lengthFactor) ? item.lengthFactor : 1;
        const widthFactor = typeof item.widthFactor === 'number' && !isNaN(item.widthFactor) ? item.widthFactor : 1;
        
        // Asegurar que lengthFactor y resolvedBaseLength son números válidos
        const safeLength = typeof resolvedBaseLength === 'number' && !isNaN(resolvedBaseLength) ? resolvedBaseLength : 20;
        actualLength = lengthFactor * safeLength;
        
        // Asegurar que widthFactor y resolvedBaseWidth son números válidos
        const safeWidth = typeof resolvedBaseWidth === 'number' && !isNaN(resolvedBaseWidth) ? resolvedBaseWidth : 2;
        actualStrokeWidth = Math.max(0.5, widthFactor * safeWidth);
      }
      
      // Validación adicional para evitar valores NaN
      if (isNaN(actualStrokeWidth)) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn(`strokeWidth es NaN para vector ${id}`);
        }
      }
      
      const rotationXOffset = getRotationOffset(baseRotationOrigin, actualLength);
      
      // Props para el grupo (sin incluir key, ya que debe pasarse directamente al JSX)
      const groupProps = {
        transform: `translate(${baseX}, ${baseY}) rotate(${currentAngle}, ${rotationXOffset}, 0)`,
      };

      // Props de interacción - solo si está habilitada la interacción
      const interactionProps = interactionEnabled ? {
        onClick: onVectorClick ? (e: React.MouseEvent<SVGElement>) => onVectorClick(item, e) : undefined,
        onMouseEnter: onVectorHover ? (e: React.MouseEvent<SVGElement>) => onVectorHover(item, e) : undefined,
        onMouseLeave: onVectorHover ? (e: React.MouseEvent<SVGElement>) => onVectorHover(null, e) : undefined,
      } : {};
      
      // Determinar el color final (sólido, gradiente o función)
      let fillOrStrokeColor: string = '#000000';
      
      if (typeof baseVectorColor === 'string') {
        fillOrStrokeColor = baseVectorColor;
      } else if (typeof baseVectorColor === 'object' && baseVectorColor !== null && 'type' in baseVectorColor) {
        // Buscar ID del gradiente
        const key = JSON.stringify(baseVectorColor);
        const gradientMap = new Map<string, { config: GradientConfig, id: string }>();
        let gradientIdCounter = 0;
        
        if (!gradientMap.has(key)) {
          const id = `global-grad-${gradientIdCounter++}`;
          gradientMap.set(key, { config: baseVectorColor, id });
        }
        
        const gradientInfo = gradientMap.get(key);
        if (gradientInfo) {
          fillOrStrokeColor = `url(#${gradientInfo.id})`;
        }
      }
      
      // Si hay un renderizador personalizado, úsalo
      if (customRenderer) {
        return customRenderer({
          id,
          baseX,
          baseY,
          currentAngle,
          baseVectorLength: actualLength,
          baseVectorWidth: actualStrokeWidth,
          fillOrStrokeColor,
          groupProps: { ...groupProps, ...interactionProps },
          item,
        });
      }
      
      // Si se usa SVG personalizado
      if (baseVectorShape === 'userSvg' && userSvgString) {
        return (
          <g key={id || index} {...groupProps} {...interactionProps}>
            <use
              href="#userProvidedSymbol"
              width={ensureSafeNumber(actualLength)}
              height={ensureSafeNumber(actualLength)}
              fill={fillOrStrokeColor}
              stroke="none"
            />
          </g>
        );
      }
      
      // Renderizar vector según su forma
      if (baseVectorShape === 'arrow') {
        const arrowHeadSizeArr = Math.min(actualLength * 0.3, actualStrokeWidth * 2 + 5);
        const lineBodyEndArr = actualLength - arrowHeadSizeArr * 0.8;
        
        return (
          <g key={id || index} {...groupProps} {...interactionProps}>
            {lineBodyEndArr > 0 && (
              <line 
                x1={0} 
                y1={0} 
                x2={ensureSafeNumber(lineBodyEndArr, 0)} 
                y2={0} 
                stroke={fillOrStrokeColor} 
                strokeWidth={ensureSafeNumber(actualStrokeWidth, 1)}
                strokeLinecap={baseStrokeLinecap || 'butt'} 
              />
            )}
            {actualLength > 0 && (
              <polygon
                points={`${ensureSafeNumber(actualLength)},0 ${ensureSafeNumber(lineBodyEndArr)},${ensureSafeNumber(-arrowHeadSizeArr / 2)} ${ensureSafeNumber(lineBodyEndArr)},${ensureSafeNumber(arrowHeadSizeArr / 2)}`}
                fill={fillOrStrokeColor}
                stroke="none"
              />
            )}
          </g>
        );
      } else if (baseVectorShape === 'dot') {
        // Para dot: el radio es actualLength/2, centro en (actualLength/2, 0)
        const radius = actualLength / 2;
        return (
          <g key={id || index} {...groupProps} {...interactionProps}>
            <circle 
              cx={ensureSafeNumber(actualLength/2)} 
              cy={0} 
              r={ensureSafeNumber(radius, 5)} 
              fill={fillOrStrokeColor} 
              stroke="none" 
            />
          </g>
        );
      } else if (baseVectorShape === 'triangle') {
        return (
          <g key={id || index} {...groupProps} {...interactionProps}>
            <polygon 
              points={`${ensureSafeNumber(actualLength)},0 0,${ensureSafeNumber(-actualStrokeWidth)} 0,${ensureSafeNumber(actualStrokeWidth)}`} 
              fill={fillOrStrokeColor} 
              stroke="none"
            />
          </g>
        );
      } else if (baseVectorShape === 'semicircle') {
        // Para semicircle: diámetro de -actualLength/2 a actualLength/2, centrado en (0,0)
        const radius = actualLength / 2;
        
        return (
          <g key={id || index} {...groupProps} {...interactionProps}>
            <path 
              d={`M ${ensureSafeNumber(-radius)} 0 A ${ensureSafeNumber(radius)} ${ensureSafeNumber(radius)} 0 0 1 ${ensureSafeNumber(radius)} 0`} 
              stroke={fillOrStrokeColor}
              fill="none"
              strokeWidth={ensureSafeNumber(actualStrokeWidth, 1)}
              strokeLinecap={baseStrokeLinecap || 'butt'}
            />
          </g>
        );
      } else if (baseVectorShape === 'curve') {
        // Para curve: desde (0,0) hasta (actualLength,0) con punto de control 
        const controlY = -actualLength * (item.animationState?.curveFactor ?? 0.3);
        
        return (
          <g key={id || index} {...groupProps} {...interactionProps}>
            <path 
              d={`M 0 0 Q ${ensureSafeNumber(actualLength/2)} ${ensureSafeNumber(controlY)} ${ensureSafeNumber(actualLength)} 0`} 
              stroke={fillOrStrokeColor}
              fill="none"
              strokeWidth={ensureSafeNumber(actualStrokeWidth, 1)}
              strokeLinecap={baseStrokeLinecap || 'butt'}
            />
          </g>
        );
      } else {
        // Caso default: line
        return (
          <g key={id || index} {...groupProps} {...interactionProps}>
            <line 
              x1={0} 
              y1={0} 
              x2={ensureSafeNumber(actualLength)} 
              y2={0} 
              stroke={fillOrStrokeColor}
              fill="none"
              strokeWidth={ensureSafeNumber(actualStrokeWidth, 1)}
              strokeLinecap={baseStrokeLinecap || 'butt'}
              data-vectorid={id}
            />
          </g>
        );
      }
    } catch (error) {
      // Reemplazando console.error con una forma más segura de manejar errores
      console.warn(`Error al renderizar vector ${item?.id}:`, error);
      return null;
    }
  };

  // Crear el elemento SVG
  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ 
        display: 'block',
        userSelect: 'none', 
        backgroundColor: 'transparent',
        border: debugMode ? '2px dashed red' : 'none'
      }}
    >
      {defsContent}
      
      {backgroundColor !== 'transparent' && (
        <rect x="0" y="0" width={width} height={height} fill={backgroundColor} />
      )}
      
      <g data-testid="vector-group-container">
        {vectors.map(renderVector)}
      </g>
      
      {debugMode && (
        <rect 
          x="0" 
          y="0" 
          width={width} 
          height={height} 
          stroke="blue" 
          strokeWidth="1" 
          fill="none" 
          strokeDasharray="5,5" 
        />
      )}
    </svg>
  );
};

export default React.memo(VectorSvgRenderer);
