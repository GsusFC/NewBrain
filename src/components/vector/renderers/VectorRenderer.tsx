'use client';

import { lazy, Suspense, useMemo } from 'react';
import VectorSvgRenderer from './VectorSvgRenderer';
import { VectorRendererProps, GradientConfig } from '../types/VectorRendererProps';
import { FallbackVectorDisplay } from '../FallbackVectorDisplay';
import { VectorColorValue } from '../core/types';

// Carga diferida del renderizador Canvas para optimizar el tamaño del bundle inicial
const LazyCanvasRenderer = lazy(() => 
  import('./VectorCanvasRenderer').then(mod => ({ 
    default: mod.VectorCanvasRenderer 
  }))
);

/**
 * Componente unificado para renderizado de vectores que elige automáticamente
 * entre SVG y Canvas según la configuración o características de los datos
 */
export function VectorRenderer(props: VectorRendererProps) {
  // Adaptador para compatibilidad con tipos existentes
  const adaptVectorRendererProps = (props: VectorRendererProps): any => {
    // Adaptar los tipos GradientConfig para hacerlos compatibles
    // Añadir coords vacío si no existe
    const adaptedProps = {...props};
    
    // Si baseVectorColor es un objeto GradientConfig pero le falta coords
    if (typeof props.baseVectorColor === 'object' && 
        props.baseVectorColor !== null && 
        'type' in props.baseVectorColor &&
        !('coords' in props.baseVectorColor)) {
      
      // Añadir coords vacío para compatibilidad
      adaptedProps.baseVectorColor = {
        ...props.baseVectorColor,
        coords: {}
      };
    }
    
    return adaptedProps;
  };
  const { 
    vectors,
    renderMode = 'svg',
    debugMode,
    width,
    height,
    ...restProps
  } = props;
  
  // Determinar el modo de renderizado efectivo
  const effectiveMode = useMemo(() => {
    if (renderMode === 'auto') {
      // Lógica para selección automática basada en cantidad y complejidad
      if (vectors.length > 2000) return 'canvas';
      
      // Comprobar si hay vectores complejos (SVG personalizado)
      // En AnimatedVectorItem el shape puede estar en vectorShape
      const hasComplexVectors = vectors.some(v => {
        // Buscar si hay formas complejas según las propiedades disponibles
        return (
          // Si hay una propiedad shape
          (v as any).shape === 'custom' || 
          (v as any).shape === 'curve' ||
          // O puede venir en vectorShape
          (v as any).vectorShape === 'custom' || 
          (v as any).vectorShape === 'curve'
        );
      });
      
      if (hasComplexVectors && vectors.length > 1000) return 'canvas';
      
      // Por defecto usar SVG para mejor calidad y facilidad de debugging
      return 'svg';
    }
    return renderMode;
  }, [renderMode, vectors]);
  
  // Si se necesita Canvas, cargarlo de forma diferida
  if (effectiveMode === 'canvas') {
    return (
      <Suspense fallback={
        // Fallback mientras carga el Canvas: usar SVG o mostrar spinner
        vectors.length < 1000 ? 
          <VectorSvgRenderer {...adaptVectorRendererProps({ vectors, width, height, ...restProps, debugMode })} /> : 
          <FallbackVectorDisplay message="Cargando renderer de Canvas..." width={width} height={height} />
      }>
        <LazyCanvasRenderer {...adaptVectorRendererProps({ vectors, width, height, ...restProps, debugMode })} />
      </Suspense>
    );
  }
  
  // Por defecto usar SVG (mejor para la mayoría de casos)
  return <VectorSvgRenderer {...adaptVectorRendererProps({ vectors, width, height, ...restProps, debugMode })} />;
}

// Función auxiliar para determinar complejidad general
function calculateVectorComplexity(vectors: VectorRendererProps['vectors']): number {
  // Implementación futura: algoritmo más sofisticado que tenga en cuenta
  // longitud, grosor, tipo y otras características de los vectores
  return vectors.length;
}
