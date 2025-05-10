// Ruta: src/components/vector/renderers/VectorSvgRenderer.tsx
'use client'; // Si es necesario en tu entorno (ej. Next.js App Router con hooks de cliente)

import React, { useMemo, useRef } from 'react';
import type { // Asegúrate que estas importaciones son desde tu types.ts
  AnimatedVectorItem,
  VectorColorValue,
  GradientConfig,
  VectorRenderProps,
  VectorShape,
} from '../core/types'; // Ajusta la ruta si es diferente

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
  userSvgPreserveAspectRatio?: string; // ej. 'xMidYMid meet', 'none'
  onVectorClick?: (item: AnimatedVectorItem, event: React.MouseEvent<SVGElement>) => void;
  onVectorHover?: (item: AnimatedVectorItem | null, event: React.MouseEvent<SVGElement>) => void;
}

// --- Helpers ---

/**
 * Calcula el offset X local para la transformación de rotación SVG.
 */
const getRotationOffset = (origin: 'start' | 'center' | 'end', length: number): number => {
  switch (origin) {
    case 'center':
      return length / 2;
    case 'end':
      return length;
    case 'start':
    default:
      return 0;
  }
};

interface ParsedViewBox { x: number; y: number; width: number; height: number; }

/**
 * Parsea el atributo viewBox de un string SVG.
 */
const parseViewBox = (svgString?: string): ParsedViewBox | null => {
  if (!svgString) return null;
  try {
    const match = svgString.match(/viewBox="([^"]+)"/);
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

/**
 * Extrae el contenido interno (elementos hijos) de la etiqueta <svg> raíz.
 */
const getSvgInnerContent = (svgString?: string): string => {
  if (!svgString) return '';
  try {
    // Una forma simple de extraer contenido, podría ser más robusta con DOMParser si es necesario
    const svgTagStart = svgString.indexOf('>') + 1;
    const svgTagEnd = svgString.lastIndexOf('</svg>');
    if (svgTagStart > 0 && svgTagEnd > svgTagStart) {
      return svgString.substring(svgTagStart, svgTagEnd);
    }
  } catch (e) {
    console.error("Error extracting SVG inner content", e);
  }
  return ''; // Devuelve vacío si no se puede parsear
};


// --- Componente Renderer ---

const VectorSvgRenderer: React.FC<VectorSvgRendererProps> = ({
  vectors,
  width,
  height,
  backgroundColor = 'transparent', // Default a transparente si no se provee
  baseVectorLength,
  baseVectorColor,
  baseVectorWidth,
  baseStrokeLinecap,
  baseVectorShape,
  baseRotationOrigin,
  customRenderer,
  userSvgString,
  userSvgPreserveAspectRatio = 'xMidYMid meet', // Default para <symbol> o <svg>
  onVectorClick,
  onVectorHover,
}) => {
  if (width <= 0 || height <= 0) return null;

  // Memoizar generación de <defs> para degradados y SVG de usuario
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
    // Nota: Si baseVectorColor es una función que devuelve GradientConfig,
    // la lógica para generar defs para esos necesitaría iterar sobre los vectores
    // o identificar todas las configs únicas devueltas.

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
        localGradientDefs.push(<linearGradient key={id} {...commonProps} {...config.coords}>{stops}</linearGradient>);
      } else if (config.type === 'radial') {
        localGradientDefs.push(<radialGradient key={id} {...commonProps} {...config.coords}>{stops}</radialGradient>);
      }
    });

    // Definición para el SVG de usuario si existe
    let userSymbolDef: React.JSX.Element | null = null;
    let userSymbolViewBox: ParsedViewBox | null = null;
    if (baseVectorShape === 'userSvg' && userSvgString) {
      userSymbolViewBox = parseViewBox(userSvgString);
      const innerContent = getSvgInnerContent(userSvgString);
      if (innerContent) {
        userSymbolDef = (
          <symbol
            id="userProvidedSymbol"
            viewBox={userSymbolViewBox ? `${userSymbolViewBox.x} ${userSymbolViewBox.y} ${userSymbolViewBox.width} ${userSymbolViewBox.height}` : undefined}
            preserveAspectRatio={userSvgPreserveAspectRatio}
          >
            {/* Usar un parser o un método más seguro si la fuente del SVG no es de confianza */}
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


  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink" // Necesario para xlink:href en <use>
      style={{ border: '2px dashed blue', boxSizing: 'border-box', display: 'block', userSelect: 'none', backgroundColor: 'transparent' }}
    >
      {defsContent}
      <rect x="0" y="0" width={width} height={height} fill={backgroundColor} data-testid="svg-background" />
      <g data-testid="vector-group-container">
        {vectors.map((item) => {
          try {
            // Resolver baseVectorLength y baseVectorWidth para este item específico
            const resolvedBaseLength = typeof baseVectorLength === 'function'
              ? baseVectorLength(item)
              : baseVectorLength;
            
            const resolvedBaseWidth = typeof baseVectorWidth === 'function'
              ? baseVectorWidth(item)
              : baseVectorWidth;

            const { id, baseX, baseY, currentAngle, lengthFactor, widthFactor } = item;

            const actualLength = lengthFactor * resolvedBaseLength;
            const actualStrokeWidth = Math.max(0.5, widthFactor * resolvedBaseWidth); // Asegurar un ancho mínimo para visibilidad

            const rotationXOffset = getRotationOffset(baseRotationOrigin, actualLength);

            let fillOrStrokeColor: string = '#ffffff'; // Default color
            if (typeof baseVectorColor === 'function') {
              fillOrStrokeColor = baseVectorColor(item, 0, 0, performance.now()); // Placeholder para frame/totalFrames
            } else if (typeof baseVectorColor === 'object' && baseVectorColor !== null && 'type' in baseVectorColor) {
              const key = JSON.stringify(baseVectorColor);
              // Buscar el ID del gradiente global (si se procesó)
              // Esta lógica de `gradientMap` necesitaría estar accesible o recalcularse aquí de forma consistente.
              // Simplificación: si es un objeto, asumimos que es un gradiente global y usamos un ID predecible o lo buscamos.
              // Por ahora, asumimos que `defsContent` ya creó el ID.
              // Esta parte es compleja si el color es una función que devuelve GradientConfig.
              // Para este ejemplo, si baseVectorColor es un objeto, intentaremos usar un ID de gradiente.
              // La memoización de defsContent ya maneja esto.
               const gradientMap = new Map<string, { config: GradientConfig, id: string }>();
               if (typeof baseVectorColor === 'object' && baseVectorColor !== null && 'type' in baseVectorColor) {
                  const id = `global-grad-0`; // ID predecible si solo hay uno global
                  gradientMap.set(JSON.stringify(baseVectorColor), { config: baseVectorColor, id });
               }
              const gradientEntry = gradientMap.get(key);
              if (gradientEntry) {
                fillOrStrokeColor = `url(#${gradientEntry.id})`;
              } else {
                   // Fallback si es un objeto pero no se encuentra el ID (podría ser error o color por función)
                   fillOrStrokeColor = typeof baseVectorColor === 'string' ? baseVectorColor : '#ff0000'; // Rojo error
              }

            } else if (typeof baseVectorColor === 'string') {
              fillOrStrokeColor = baseVectorColor;
            }

            const groupEventHandlers = {
              onClick: onVectorClick ? (e: React.MouseEvent<SVGElement>) => { e.stopPropagation(); onVectorClick(item, e); } : undefined,
              onMouseEnter: onVectorHover ? (e: React.MouseEvent<SVGElement>) => onVectorHover(item, e) : undefined,
              onMouseLeave: onVectorHover ? (e: React.MouseEvent<SVGElement>) => onVectorHover(null, e) : undefined,
            };

            // Renombrar 'key' a 'vectorId' para evitar conflictos y usarla explícitamente.
            const { key: vectorId, ...restGroupProps } = {
              key: id, // Este es el id del vector, que se usará como key de React
              transform: `translate(${baseX.toFixed(3)}, ${baseY.toFixed(3)}) rotate(${currentAngle.toFixed(3)}, ${rotationXOffset.toFixed(3)}, 0)`,
              ...groupEventHandlers
            };

            if (customRenderer) {
              const renderProps: VectorRenderProps = {
                item, dimensions: { width, height }, 
                baseVectorLength: resolvedBaseLength, 
                baseVectorColor, 
                baseVectorWidth: resolvedBaseWidth, 
                baseStrokeLinecap, 
                baseVectorShape, 
                baseRotationOrigin,
                actualLength, actualStrokeWidth, getRotationOffset,
              };
              // Pasar 'vectorId' como key explícita al <g>
              return <g key={vectorId} {...restGroupProps}>{customRenderer(renderProps)}</g>;
            }

            const shapeProps = {
              stroke: baseVectorShape !== 'dot' && baseVectorShape !== 'triangle' ? fillOrStrokeColor : 'none',
              fill: baseVectorShape === 'dot' || baseVectorShape === 'triangle' ? fillOrStrokeColor : 'none',
              strokeWidth: actualStrokeWidth,
              strokeLinecap: baseStrokeLinecap || 'butt',
            };
            if (baseVectorShape === 'arrow') {
               shapeProps.fill = fillOrStrokeColor; // La cabeza de la flecha se rellena
            }


            switch (baseVectorShape) {
              case 'userSvg':
                const userSymbolViewBox = parseViewBox(userSvgString); // Parsear de nuevo o tomar de defsContent
                if (userSvgString && userSymbolViewBox) {
                  const { width: vbWidth, height: vbHeight } = userSymbolViewBox;
                  let scale = 1;
                  if (vbWidth > 0) {
                      scale = actualLength / vbWidth; // Escalar para que el ancho del viewBox coincida con actualLength
                  }
                  // Para mantener aspect ratio, la altura del <use> debería ser vbHeight
                  // y el escalado debe ser uniforme si preserveAspectRatio no es 'none'.
                  // Si preserveAspectRatio es 'none', podrías escalar X e Y independientemente.
                  // Por simplicidad, usamos un escalado uniforme basado en el ancho.
                  // La altura efectiva será scale * vbHeight.

                  return (
                    <g key={vectorId} {...restGroupProps}
                       // Aplicar color al <g> si el SVG interno usa currentColor
                       fill={fillOrStrokeColor}
                       stroke={fillOrStrokeColor}
                       strokeWidth={actualStrokeWidth} // Esto podría afectar al SVG interno si usa stroke="currentColor"
                    >
                      <use
                        xlinkHref="#userProvidedSymbol"
                        width={vbWidth}
                        height={vbHeight}
                        transform={`scale(${scale.toFixed(3)})`} // Escalar la instancia del symbol
                        // preserveAspectRatio se aplica en el <symbol>
                      />
                    </g>
                  );
                }
                return <g key={vectorId} {...restGroupProps}><circle cx={0} cy={0} r={actualStrokeWidth/2} fill="red" /></g>; // Fallback

              case 'arrow':
                const arrowHeadSize = Math.min(actualLength * 0.3, actualStrokeWidth * 2 + 5);
                const lineLength = actualLength - arrowHeadSize * 0.8;
                return (
                  <g key={vectorId} {...restGroupProps}>
                    {lineLength > 0 && (
                      <line x1={0} y1={0} x2={lineLength} y2={0} {...shapeProps} fill="none"/>
                    )}
                    <polygon
                      points={`${actualLength},0 ${lineLength > 0 ? lineLength : 0},${-arrowHeadSize / 2} ${lineLength > 0 ? lineLength : 0},${arrowHeadSize / 2}`}
                      fill={fillOrStrokeColor} // La cabeza siempre tiene fill
                      stroke="none"
                    />
                  </g>
                );
              case 'dot':
                return <g key={vectorId} {...restGroupProps}><circle cx={0} cy={0} r={actualLength / 2} fill={fillOrStrokeColor} stroke="none" /></g>;
              case 'triangle':
                const tipX = actualLength;
                const halfBaseWidth = actualLength * 0.3 * Math.min(1, widthFactor);
                return <g key={vectorId} {...restGroupProps}><polygon points={`${tipX},0 0,${-halfBaseWidth} 0,${halfBaseWidth}`} fill={fillOrStrokeColor} stroke="none"/></g>;
              case 'semicircle':
                const radiusSemi = actualLength / 2;
                return <g key={vectorId} {...restGroupProps}><path d={`M 0 0 A ${radiusSemi} ${radiusSemi} 0 0 1 ${actualLength} 0`} {...shapeProps} /></g>;
              case 'curve':
                const controlY = -actualLength * 0.3;
                return <g key={vectorId} {...restGroupProps}><path d={`M 0 0 Q ${actualLength/2} ${controlY} ${actualLength} 0`} {...shapeProps} /></g>;
              case 'line':
              default:
                return <g key={vectorId} {...restGroupProps}><line x1={0} y1={0} x2={actualLength} y2={0} {...shapeProps} /></g>;
            }
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