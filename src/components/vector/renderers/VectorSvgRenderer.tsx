// Ruta: src/components/vector/renderers/VectorSvgRenderer.tsx
'use client';

import React, { useRef, useMemo } from 'react';
import { 
  AnimatedVectorItem, 
  VectorColorValue, 
  VectorShape, 
  GradientConfig, 
  VectorRenderProps 
} from '../core/types';
import { formatSvgPoint, fixPrecision } from '@/utils/precision';
import { ensureSafeNumber } from '../utils/mathUtils';
import { applyCulling } from '../core/culling';
import { createComponentLogger } from '../utils/debugUtils';



// --- Props del Componente Renderer ---
export interface VectorSvgRendererProps {
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
  cullingEnabled?: boolean;
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

// La función ensureSafeNumber ahora se importa desde mathUtils

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

// Componente principal
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
    getDynamicLength,
    getDynamicWidth,
    useDynamicProps = false,
    interactionEnabled = true,
    debugMode = false,
    cullingEnabled = false,
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const gradientMap = useRef<Map<string, { config: GradientConfig; id: string }>>(new Map());
  const gradientIdCounterRef = useRef(0);
  const logger = useMemo(() => createComponentLogger('VectorSvgRenderer'), []);

  // Generar IDs únicos para gradientes
  const getGradientId = (key: string, config: GradientConfig): string => {
    if (!gradientMap.current.has(key)) {
      const id = `global-grad-${gradientIdCounterRef.current}`;
      gradientIdCounterRef.current += 1;
      gradientMap.current.set(key, { config, id });
    }
    return gradientMap.current.get(key)!.id;
  };

  const defsContent = useMemo(() => {
    const localGradientDefs: React.ReactNode[] = [];
    
    // Procesar color base si es un GradientConfig
    if (typeof baseVectorColor === 'object' && baseVectorColor !== null && 'type' in baseVectorColor) {
      const key = JSON.stringify(baseVectorColor);
      const gradientId = getGradientId(key, baseVectorColor);
      
      const commonProps = {
        id: gradientId,
        gradientUnits: baseVectorColor.units || "objectBoundingBox",
      };
      
      const stops = baseVectorColor.stops.map((stop, i) => (
        <stop
          key={`${gradientId}-stop-${i}`}
          offset={`${stop.offset * 100}%`}
          stopColor={stop.color}
          stopOpacity={stop.opacity !== undefined ? stop.opacity : 1}
        />
      ));
      
      if (baseVectorColor.type === 'linear') {
        localGradientDefs.push(
          <linearGradient key={gradientId} {...commonProps} {...baseVectorColor.coords}>
            {stops}
          </linearGradient>
        );
      } else if (baseVectorColor.type === 'radial') {
        localGradientDefs.push(
          <radialGradient key={gradientId} {...commonProps} {...baseVectorColor.coords}>
            {stops}
          </radialGradient>
        );
      }
    }

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

  const renderVector = (item: AnimatedVectorItem, index: number) => {
    try {
      // Calcular longitud y grosor base
      const resolvedBaseLength = typeof baseVectorLength === 'function' ? baseVectorLength(item) : baseVectorLength;
      const resolvedBaseWidth = typeof baseVectorWidth === 'function' ? baseVectorWidth(item) : baseVectorWidth;
      
      // Extraer propiedades del vector con valores por defecto seguros
      const { id, baseX, baseY, animationState = {} } = item;
      // Use angle property instead of currentAngle for compatibility with our updated types
      const currentAngle = item.angle || 0;
      
      // Determinar si usamos props dinámicas o estáticas
      let actualLength: number;
      let actualStrokeWidth: number;
      
      if (useDynamicProps && getDynamicLength && getDynamicWidth) {
        actualLength = ensureSafeNumber(getDynamicLength(item), 30);
        actualStrokeWidth = ensureSafeNumber(getDynamicWidth(item), 2);
      } else {
        // Usar el método tradicional con factores
        const lengthFactor = ensureSafeNumber(item.lengthFactor, 1);
        const widthFactor = ensureSafeNumber(item.widthFactor, 1);
        
        // Asegurar que lengthFactor y resolvedBaseLength son números válidos
        const safeLength = ensureSafeNumber(resolvedBaseLength, 20);
        actualLength = lengthFactor * safeLength;
        
        // Asegurar que widthFactor y resolvedBaseWidth son números válidos
        const safeWidth = ensureSafeNumber(resolvedBaseWidth, 2);
        actualStrokeWidth = Math.max(0.5, widthFactor * safeWidth);
      }
      
      // Validación adicional para evitar valores NaN
      if (isNaN(actualStrokeWidth)) {
        console.warn(`strokeWidth es NaN para vector ${id}`);
        actualStrokeWidth = 2; // Valor predeterminado seguro
      }
      
      const rotationXOffset = getRotationOffset(baseRotationOrigin, actualLength);
      // Transformación para el grupo SVG
      const groupTransform = `translate(${baseX}, ${baseY}) rotate(${currentAngle}, ${rotationXOffset}, 0)`;

      // Color de relleno/trazo (soporte para gradientes)
      let fillOrStrokeColor: string | undefined;
      
      if (typeof baseVectorColor === 'string') {
        fillOrStrokeColor = baseVectorColor;
      } else if (typeof baseVectorColor === 'object' && baseVectorColor !== null) {
        // Buscar ID del gradiente
        const key = JSON.stringify(baseVectorColor);
        const gradientId = getGradientId(key, baseVectorColor);
        if (gradientId) {
          fillOrStrokeColor = `url(#${gradientId})`;
        }
      }

      // Si hay un renderizador personalizado, úsalo
      if (customRenderer) {
        return customRenderer({
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
        });
      }

      // SVG personalizado
      if (baseVectorShape === 'userSvg' && userSvgString) {
        return (
          <g key={`vector-${item.r}-${item.c}-${index}`} transform={groupTransform}>
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
        // Para flechas: línea con triángulo
        const arrowHeadSize = ensureSafeNumber(actualStrokeWidth) * 2.5;
        
        return (
          <g key={`vector-${item.r}-${item.c}-${index}`} transform={groupTransform}>
            <line 
              x1={0} 
              y1={0} 
              x2={ensureSafeNumber(actualLength)} 
              y2={0} 
              stroke={fillOrStrokeColor}
              strokeWidth={ensureSafeNumber(actualStrokeWidth)}
              strokeLinecap={baseStrokeLinecap || 'butt'}
              data-vectorid={item.id}
            />
            <polygon 
              points={`
                ${formatSvgPoint(ensureSafeNumber(actualLength), 0)},
                ${formatSvgPoint(ensureSafeNumber(actualLength - arrowHeadSize), -ensureSafeNumber(arrowHeadSize / 2))},
                ${formatSvgPoint(ensureSafeNumber(actualLength - arrowHeadSize), ensureSafeNumber(arrowHeadSize / 2))}
              `}
              fill={fillOrStrokeColor}
              strokeLinejoin="round"
              data-vectorid={item.id}
            />
          </g>
        );
      } else if (baseVectorShape === 'dot') {
        // Para dot: el radio es actualLength/2, centro en (actualLength/2, 0)
        const radius = ensureSafeNumber(actualLength) / 2;
        return (
          <g key={`vector-${item.r}-${item.c}-${index}`} transform={groupTransform}>
            <circle 
              cx={ensureSafeNumber(actualLength/2)} 
              cy={0} 
              r={ensureSafeNumber(radius, 5)} 
              fill={fillOrStrokeColor} 
              stroke="none"
              data-vectorid={item.id}
            />
          </g>
        );
      } else if (baseVectorShape === 'triangle') {
        return (
          <g key={`vector-${item.r}-${item.c}-${index}`} transform={groupTransform}>
            <polygon 
              points={`${ensureSafeNumber(actualLength)},0 0,${ensureSafeNumber(-actualStrokeWidth)} 0,${ensureSafeNumber(actualStrokeWidth)}`} 
              fill={fillOrStrokeColor}
              stroke="none"
              data-vectorid={item.id}
            />
          </g>
        );
      } else if (baseVectorShape === 'semicircle') {
        // Para semicircle: diámetro de -actualLength/2 a actualLength/2, centrado en (0,0)
        const radius = ensureSafeNumber(actualLength) / 2;
        
        return (
          <g key={`vector-${item.r}-${item.c}-${index}`} transform={groupTransform}>
            <path
              d={`M ${fixPrecision(-radius, 5)},0 A ${fixPrecision(radius, 5)},${fixPrecision(radius, 5)} 0 0 1 ${fixPrecision(radius, 5)},0`}
              fill={fillOrStrokeColor}
              stroke="none"
              data-vectorid={item.id}
            />
          </g>
        );
      } else if (baseVectorShape === 'curve') {
        const curveFactor = 'curveFactor' in animationState && typeof animationState.curveFactor === 'number' 
          ? animationState.curveFactor 
          : 0.3;
        const controlY = -ensureSafeNumber(actualLength) * ensureSafeNumber(curveFactor, 0.3);
        
        return (
          <g key={`vector-${item.r}-${item.c}-${index}`} transform={groupTransform}>
            <path 
              d={`M 0 0 Q ${fixPrecision(actualLength/2, 5)} ${fixPrecision(controlY, 5)} ${fixPrecision(actualLength, 5)} 0`} 
              stroke={fillOrStrokeColor}
              fill="none"
              strokeWidth={ensureSafeNumber(actualStrokeWidth)}
              strokeLinecap={baseStrokeLinecap || 'butt'}
              data-vectorid={item.id}
            />
          </g>
        );
      } else {
        // Caso default: line
        return (
          <g key={`vector-${item.r}-${item.c}-${index}`} transform={groupTransform}>
            <line 
              x1={0} 
              y1={0} 
              x2={ensureSafeNumber(actualLength)} 
              y2={0} 
              stroke={fillOrStrokeColor}
              fill="none"
              strokeWidth={ensureSafeNumber(actualStrokeWidth)}
              strokeLinecap={baseStrokeLinecap || 'butt'}
              data-vectorid={item.id}
            />
          </g>
        );
      }
    } catch (error) {
      // Manejo seguro de errores de renderizado
      console.warn(`Error al renderizar vector ${item?.id}:`, error);
      return null;
    }
  };

  // Manejar eventos
  const handleClick = interactionEnabled ? (e: React.MouseEvent<SVGElement>) => {
    if (!onVectorClick) return;
    
    // Usar closest para manejar correctamente elementos anidados
    const target = (e.target as Element).closest('[data-vectorid]') as HTMLElement;
    if (!target) return;
    
    const vectorId = target.getAttribute('data-vectorid');
    if (!vectorId) return;
    
    const clickedItem = vectors.find(v => v.id === vectorId);
    if (clickedItem) {
      onVectorClick(clickedItem, e);
    }
  } : undefined;
  
  const handleMouseMove = interactionEnabled && onVectorHover ? (e: React.MouseEvent<SVGElement>) => {
    // Usar closest para manejar correctamente elementos anidados
    const target = (e.target as Element).closest('[data-vectorid]') as HTMLElement;
    const vectorId = target?.getAttribute('data-vectorid') || null;
    
    if (vectorId) {
      const hoveredItem = vectors.find(v => v.id === vectorId);
      if (hoveredItem) {
        onVectorHover(hoveredItem, e);
      }
    } else {
      // Si no hay hover sobre ningún vector
      onVectorHover(null, e);
    }
  } : undefined;

  // Calcular el padding para el culling de manera segura
  const cullingPadding = useMemo(() => {
    // Si baseVectorLength es una función, usamos el primer vector como referencia
    // o un valor por defecto si no hay vectores
    const lengthValue = typeof baseVectorLength === 'function'
      ? vectors.length > 0
        ? baseVectorLength(vectors[0])
        : 50 * 2 // Valor por defecto si no hay vectores
      : baseVectorLength;
      
    return fixPrecision(Math.max(50, lengthValue / 2), 0);
  }, [baseVectorLength, props.vectors]);

  // Aplicar culling si está habilitado
  const optimizedVectors = useMemo(() => {
    if (!cullingEnabled || vectors.length === 0) return vectors;
    
    // Aplicar culling con la implementación de core/culling
    const culledVectors = applyCulling(
      vectors,
      width,
      height,
      {
        padding: cullingPadding,
        enableLOD: true,
        useQuadtree: vectors.length > 1000
      }
    );
    
    if (debugMode) {
      const optimizationRate = fixPrecision((1 - culledVectors.length / vectors.length) * 100, 1);
      logger.info(`[Culling] Optimizados ${optimizationRate}% (${culledVectors.length}/${vectors.length} vectores renderizados)`);
    }
    
    return culledVectors;
  }, [vectors, width, height, cullingEnabled, cullingPadding, debugMode, logger]);

  // Renderizar el componente
  const finalBackgroundColor = backgroundColor && backgroundColor !== 'transparent' ? backgroundColor : 'transparent';

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{
        backgroundColor: backgroundColor,
        boxSizing: 'border-box'
      }}
    >
      <rect width="100%" height="100%" fill={finalBackgroundColor} />
      {/* Definiciones de gradientes */}
      {defsContent}

      {/* Fondo si es necesario */}
      {backgroundColor && (
        <rect
          width={width}
          height={height}
          fill={backgroundColor}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Vectores optimizados */}
      {optimizedVectors.map((vector, index) => renderVector(vector, vector.r * 10000 + vector.c * 100 + index))}

      {/* Debug info eliminado */}
    </svg>
  );
};

export default React.memo(VectorSvgRenderer);