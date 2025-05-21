'use client';

// Mantenemos importaciones por compatibilidad

import VectorSvgRenderer from './VectorSvgRenderer';
import type { VectorRendererProps, RotationOrigin } from '../types/VectorRendererProps';
import type { VectorSvgRendererProps } from './VectorSvgRenderer'; // Corrected import path
import type { GradientConfig as CoreGradientConfig, VectorShape, AnimatedVectorItem } from '../core/types';

/**
 * Componente unificado para renderizado de vectores que usa exclusivamente SVG.
 * Las referencias a Canvas se mantienen por compatibilidad pero no se utilizan.
 */
export function VectorRenderer(props: VectorRendererProps) {
  /**
   * Adapta las propiedades de VectorRendererProps a las que necesita VectorSvgRenderer,
   * especialmente manejando la configuración de `baseVectorColor`.
   */
  // Define a more precise type for the input of adaptVectorRendererProps
  // This reflects that VectorRenderer component ensures width, height, vectors, and baseVectorShape are provided.
  type AdaptInputProps = Omit<VectorRendererProps, 'renderMode' | 'baseRotationOrigin'> & {
    width: number;
    height: number;
    vectors: AnimatedVectorItem[]; // Ensure vectors is non-optional for the adapter
    baseVectorShape: VectorShape; // baseVectorShape is guaranteed by VectorRenderer
    baseRotationOrigin: RotationOrigin;
    debugMode?: boolean;
    getDynamicLength?: (item: AnimatedVectorItem) => number;
    getDynamicWidth?: (item: AnimatedVectorItem) => number;
    useDynamicProps?: boolean;
  };

  const adaptVectorRendererProps = (
    props: AdaptInputProps
  ): VectorSvgRendererProps => {
    // Explicitly destructure all required props for VectorSvgRendererProps
    // to ensure correct typing and avoid issues with spread operator generalization.
    const {
      vectors,
      width,
      height,
      baseVectorShape,
      baseRotationOrigin,
      baseVectorColor,
      baseVectorLength,
      baseVectorWidth,
      // Optional props with defaults or that can be undefined
      backgroundColor,
      baseStrokeLinecap,
      customRenderer,
      userSvgString,
      userSvgPreserveAspectRatio,
      onVectorClick,
      onVectorHover,
      getDynamicLength,
      getDynamicWidth,
      useDynamicProps,
      interactionEnabled,
      debugMode,
      cullingEnabled,
      frameInfo,
      ...otherProps // Collect any other valid props from VectorRendererProps
    } = props;

    let adaptedBaseVectorColor = baseVectorColor;
    if (typeof baseVectorColor === 'object' && baseVectorColor !== null && 'stops' in baseVectorColor) {
      if (!baseVectorColor.coords) {
        adaptedBaseVectorColor = {
          ...baseVectorColor,
          coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
        } as CoreGradientConfig;
      }
    }

    return {
      // Pass all destructured props, ensuring types are maintained
      vectors,
      width,
      height,
      baseVectorShape, // This is VectorShape
      baseRotationOrigin, // This is 'start' | 'center' | 'end'
      baseVectorColor: adaptedBaseVectorColor,
      baseVectorLength,
      baseVectorWidth,
      backgroundColor,
      baseStrokeLinecap,
      customRenderer,
      userSvgString,
      userSvgPreserveAspectRatio,
      onVectorClick,
      onVectorHover,
      getDynamicLength,
      getDynamicWidth,
      useDynamicProps,
      interactionEnabled,
      debugMode,
      cullingEnabled,
      frameInfo,
      ...otherProps, // Spread any remaining valid props
    } as VectorSvgRendererProps; // Asserting the return type for clarity
  };
  
  const { 
    vectors,
    // renderMode is no longer used directly as we always use SVG
    debugMode,
    width,
    height,
    baseVectorShape = 'arrow' as VectorShape, // Default value ensures it's always present
    baseRotationOrigin = 'start', // Default value ensures it's always present
    ...restProps
  } = props;
  
  // MODIFICACIÓN: Si se intenta usar Canvas, mostrar advertencia en modo debug
  if (debugMode && props.renderMode === 'canvas') {
    console.warn('VectorRenderer: El modo Canvas ha sido desactivado. Utilizando SVG en su lugar.');
  }
  
  // MODIFICACIÓN: Siempre usar SVG independientemente del valor de renderMode
  const adaptedProps = adaptVectorRendererProps({
    ...restProps,       // Spread other props from VectorRenderer's input
    vectors,            // Explicitly pass required/handled props for AdaptInputProps
    width,
    height,
    baseVectorShape,    // This is VectorShape
    baseRotationOrigin, // This is 'start' | 'center' | 'end'
    debugMode,
  });
  return <VectorSvgRenderer {...adaptedProps} />;
}

// calculateVectorComplexity was here, removed as it's unused.
