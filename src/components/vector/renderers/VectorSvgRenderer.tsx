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
const VectorSvgRenderer: React.FC<VectorSvgRendererProps> = ({
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
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Validar dimensiones
  if (width <= 0 || height <= 0) return null;

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
        border: '2px dashed red' // Borde temporal para depuración
      }}
    >
      {defsContent}
      
      {backgroundColor !== 'transparent' && (
        <rect x="0" y="0" width={width} height={height} fill={backgroundColor} />
      )}
      
      <g data-testid="vector-group-container">

        {vectors.map((item) => {
          try {
            const resolvedBaseLength = typeof baseVectorLength === 'function'
              ? baseVectorLength(item)
              : baseVectorLength;

            const resolvedBaseWidth = typeof baseVectorWidth === 'function'
              ? baseVectorWidth(item)
              : baseVectorWidth;

            // Extraer propiedades del vector con valores por defecto seguros
            const { id, baseX, baseY, currentAngle } = item;
            
            // Depuración para verificar qué forma se está aplicando
            if (id === 'vector-0-0') {
              console.log(`Vector ${id} → Forma: ${baseVectorShape}, Ángulo: ${currentAngle}`);
            }
            // Asegurar que estos factores sean números válidos
            const lengthFactor = typeof item.lengthFactor === 'number' && !isNaN(item.lengthFactor) ? item.lengthFactor : 1;
            const widthFactor = typeof item.widthFactor === 'number' && !isNaN(item.widthFactor) ? item.widthFactor : 1;

            const actualLength = lengthFactor * resolvedBaseLength;
            const actualStrokeWidth = Math.max(0.5, widthFactor * resolvedBaseWidth);
            const rotationXOffset = getRotationOffset(baseRotationOrigin, actualLength);

            // Determinar el color del vector
            let fillOrStrokeColor: string = '#4a80f5'; // Color por defecto si algo falla
            
            try {
              if (typeof baseVectorColor === 'function') {
                fillOrStrokeColor = baseVectorColor(item, 0, 0, performance.now());
              } else if (typeof baseVectorColor === 'object' && baseVectorColor !== null && 'type' in baseVectorColor) {
                // Buscar el ID del gradiente en el mapa
                const key = JSON.stringify(baseVectorColor);
                const gradientId = `global-grad-0`; // Simplificado para este ejemplo
                fillOrStrokeColor = `url(#${gradientId})`;
              } else if (typeof baseVectorColor === 'string') {
                fillOrStrokeColor = baseVectorColor;
              }
            } catch (e) {
              console.error('Error al procesar el color del vector:', e);
            }

            // Props - La key se pasa directamente al JSX
            const groupProps = {
              transform: `translate(${baseX.toFixed(3)}, ${baseY.toFixed(3)}) rotate(${currentAngle.toFixed(3)}, ${rotationXOffset.toFixed(3)}, 0)`,
              onClick: onVectorClick ? (e: React.MouseEvent<SVGElement>) => { e.stopPropagation(); onVectorClick(item, e); } : undefined,
              onMouseEnter: onVectorHover ? (e: React.MouseEvent<SVGElement>) => onVectorHover(item, e) : undefined,
              onMouseLeave: onVectorHover ? (e: React.MouseEvent<SVGElement>) => onVectorHover(null, e) : undefined
            };

            if (customRenderer) {
              const renderProps: VectorRenderProps = {
                item, 
                dimensions: { width, height }, 
                baseVectorLength: resolvedBaseLength, 
                baseVectorColor, 
                baseVectorWidth: resolvedBaseWidth, 
                baseStrokeLinecap, 
                baseVectorShape, 
                baseRotationOrigin,
                actualLength, 
                actualStrokeWidth, 
                getRotationOffset,
              };
              
              return <g key={id} {...groupProps}>{customRenderer(renderProps)}</g>;
            }

            // Aplicamos los estilos específicos a cada forma según la especificación

            // Renderizar forma
            if (baseVectorShape === 'userSvg') {
              const userSymbolViewBox = parseViewBox(userSvgString);
              if (userSvgString && userSymbolViewBox) {
                const { width: vbWidth, height: vbHeight } = userSymbolViewBox;
                let scale = 1;
                
                if (vbWidth > 0) {
                  scale = actualLength / vbWidth;
                }
                
                return (
                  <g key={id} {...groupProps}
                    fill={fillOrStrokeColor}
                    stroke={fillOrStrokeColor}
                    strokeWidth={actualStrokeWidth}
                  >
                    <use
                      xlinkHref="#userProvidedSymbol"
                      width={vbWidth}
                      height={vbHeight}
                      transform={`scale(${scale.toFixed(3)})`}
                    />
                  </g>
                );
              }
              
              return (
                <g key={id} {...groupProps}>
                  <circle cx={0} cy={0} r={actualStrokeWidth/2} fill="red" />
                </g>
              );
            }
            
            if (baseVectorShape === 'arrow') {
              const arrowHeadSizeArr = Math.min(actualLength * 0.3, actualStrokeWidth * 2 + 5);
              const lineBodyEndArr = actualLength - arrowHeadSizeArr * 0.8;
              
              return (
                <g key={id} {...groupProps}>
                  {lineBodyEndArr > 0 && (
                    <line 
                      x1={0} 
                      y1={0} 
                      x2={lineBodyEndArr} 
                      y2={0} 
                      stroke={fillOrStrokeColor} 
                      strokeWidth={actualStrokeWidth}
                      strokeLinecap={baseStrokeLinecap || 'butt'} 
                    />
                  )}
                  {actualLength > 0 && (
                    <polygon
                      points={`${actualLength},0 ${lineBodyEndArr},${-arrowHeadSizeArr / 2} ${lineBodyEndArr},${arrowHeadSizeArr / 2}`}
                      fill={fillOrStrokeColor}
                      stroke="none"
                    />
                  )}
                </g>
              );
            }
            
            if (baseVectorShape === 'dot') {
              // Para dot: el radio es actualLength/2, centro en (actualLength/2, 0)
              const radius = actualLength / 2;
              return (
                <g key={id} {...groupProps}>
                  <circle 
                    cx={actualLength/2} 
                    cy={0} 
                    r={radius} 
                    fill={fillOrStrokeColor} 
                    stroke="none" 
                  />
                </g>
              );
            }
            
            if (baseVectorShape === 'triangle') {
              return (
                <g key={id} {...groupProps}>
                  <polygon 
                    points={`${actualLength},0 0,${-actualStrokeWidth} 0,${actualStrokeWidth}`} 
                    fill={fillOrStrokeColor} 
                    stroke="none"
                  />
                </g>
              );
            }
            
            if (baseVectorShape === 'semicircle') {
              // Para semicircle: diámetro de -actualLength/2 a actualLength/2, centrado en (0,0)
              const radius = actualLength / 2;
              
              return (
                <g key={id} {...groupProps}>
                  <path 
                    d={`M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`} 
                    stroke={fillOrStrokeColor}
                    fill="none"
                    strokeWidth={actualStrokeWidth}
                    strokeLinecap={baseStrokeLinecap || 'butt'}
                  />
                </g>
              );
            }
            
            if (baseVectorShape === 'curve') {
              // Para curve: desde (0,0) hasta (actualLength,0) con punto de control 
              const controlY = -actualLength * (item.animationState?.curveFactor ?? 0.3);
              
              return (
                <g key={id} {...groupProps}>
                  <path 
                    d={`M 0 0 Q ${actualLength/2} ${controlY} ${actualLength} 0`} 
                    stroke={fillOrStrokeColor}
                    fill="none"
                    strokeWidth={actualStrokeWidth}
                    strokeLinecap={baseStrokeLinecap || 'butt'}
                  />
                </g>
              );
            }
            
            // La implementación de la forma 'plus' ha sido eliminada
            // La implementaremos correctamente en el futuro
            
            // Caso default: line
            return (
              <g key={id} {...groupProps}>
                <line 
                  x1={0} 
                  y1={0} 
                  x2={actualLength} 
                  y2={0} 
                  stroke={fillOrStrokeColor}
                  fill="none"
                  strokeWidth={actualStrokeWidth}
                  strokeLinecap={baseStrokeLinecap || 'butt'}
                  data-vectorid={id}
                />
              </g>
            );
          } catch (error) {
            console.error("Error rendering vector", error);
            return null;
          }
        })}
      </g>
    </svg>
  );
};

export default React.memo(VectorSvgRenderer);