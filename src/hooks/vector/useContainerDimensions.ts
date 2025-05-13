import { useState, useCallback, useMemo, useLayoutEffect } from 'react';

export type AspectRatioOption = 'auto' | '1:1' | '16:9' | '2:1' | 'custom';

export type Dimensions = {
  width: number;
  height: number;
  adjustment: {
    type: 'width' | 'height' | 'none' | 'widthLimited' | 'heightLimited' | 'scaledToFit' | 'container';
    widthPercentage?: number;
    heightPercentage?: number;
  };
};

// Argumentos para el hook
export type UseContainerDimensionsArgs = {
  /**
   * Referencia al elemento contenedor HTML
   */
  containerRef: HTMLElement | null;
  /**
   * Ancho fijo en píxeles (opcional)
   */
  fixedWidth?: number;
  /**
   * Altura fija en píxeles (opcional)
   */
  fixedHeight?: number;
  /**
   * Modo de aspect ratio (opcional, por defecto 'auto')
   */
  aspectRatio?: AspectRatioOption;
  /**
   * Relación de aspecto personalizada para cuando el modo es 'custom'
   */
  customAspectRatio?: { width: number; height: number };
};

// Altura base para todos los formatos predefinidos
const PREDEFINED_FORMAT_BASE_HEIGHT = 800;

// El hook que calcula las dimensiones del contenedor
export function useContainerDimensions(args: UseContainerDimensionsArgs) {
  const { containerRef, fixedWidth, fixedHeight, aspectRatio = 'auto', customAspectRatio } = args;

  // Estado para almacenar las dimensiones del contenedor
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 800,
    height: 800,
    adjustment: { type: 'none' }
  });

  // Estado para almacenar las dimensiones observadas del contenedor
  const [observedDimensions, setObservedDimensions] = useState<{ width: number; height: number }>({ 
    width: 1, 
    height: 1 
  });

  // Función para calcular las dimensiones en base a las dimensiones observadas del contenedor
  const calculateDimensions = useMemo(() => (observedWidth: number, observedHeight: number): Dimensions => {
    // Caso 1: Si tenemos ancho y alto fijos, usarlos directamente
    if (fixedWidth && fixedHeight) {
      return {
        width: fixedWidth,
        height: fixedHeight,
        adjustment: { type: 'none' }
      };
    }
    // Caso 2: Si solo el ancho está fijo, calcular el alto proporcionalmente
    else if (fixedWidth) {
      return {
        width: fixedWidth,
        height: Math.floor(fixedWidth * (observedHeight / observedWidth)),
        adjustment: { type: 'widthLimited' }
      };
    } else if (fixedHeight) {
      // Si solo la altura está fija, calcular ancho proporcionalmente
      return {
        width: Math.floor(fixedHeight * (observedWidth / observedHeight)),
        height: fixedHeight,
        adjustment: { type: 'heightLimited' }
      };
    }

    // Nuevas variables para el cálculo general
    let finalWidth = observedWidth;
    let finalHeight = observedHeight;
    let adjustmentType: Dimensions['adjustment']['type'] = 'container';
    let targetRatio: number | null = null;

    if (aspectRatio && aspectRatio !== 'auto') {
      // 1. Determinar el targetRatio según el modo de aspect ratio
      if (aspectRatio === 'custom' && customAspectRatio && customAspectRatio.width > 0 && customAspectRatio.height > 0) {
        targetRatio = customAspectRatio.width / customAspectRatio.height;
        adjustmentType = 'scaledToFit';
      } else if (aspectRatio === '1:1') {
        targetRatio = 1.0;
        adjustmentType = 'scaledToFit';
      } else if (aspectRatio === '16:9') {
        targetRatio = 16 / 9;
        adjustmentType = 'scaledToFit';
      } else if (aspectRatio === '2:1') {
        targetRatio = 2.0;
        adjustmentType = 'scaledToFit';
      }

      // 2. Si hay un targetRatio, aplicar los cálculos según el tipo de modo
      if (targetRatio !== null) {
        if (aspectRatio !== 'custom') {
          // FORMATOS PREDEFINIDOS: Calcular dimensiones ideales basadas en altura fija
          const idealHeight = PREDEFINED_FORMAT_BASE_HEIGHT;
          const idealWidth = idealHeight * targetRatio;

          // Calcular factor de escala para que quepan en el contenedor observado
          const scaleToFitWidth = observedWidth / idealWidth;
          const scaleToFitHeight = observedHeight / idealHeight;
          const scaleFactor = Math.min(scaleToFitWidth, scaleToFitHeight);

          // Aplicar el factor de escala a las dimensiones ideales
          finalWidth = idealWidth * scaleFactor;
          finalHeight = idealHeight * scaleFactor;

          console.log(`[useContainerDimensions] ${aspectRatio} - ideal: ${idealWidth.toFixed(0)}x${idealHeight.toFixed(0)}, escala: ${scaleFactor.toFixed(3)}, final: ${finalWidth.toFixed(0)}x${finalHeight.toFixed(0)}`);
        } else {
          // CUSTOM: Llenar el contenedor manteniendo el ratio personalizado
          const containerRatio = observedWidth / observedHeight;
          
          if (containerRatio > targetRatio) {
            // Contenedor más ancho que el ratio objetivo -> limitar por altura
            finalHeight = observedHeight;
            finalWidth = observedHeight * targetRatio;
            adjustmentType = 'heightLimited';
          } else {
            // Contenedor más alto que el ratio objetivo -> limitar por ancho
            finalWidth = observedWidth;
            finalHeight = observedWidth / targetRatio;
            adjustmentType = 'widthLimited';
          }
          
          console.log(`[useContainerDimensions] Custom ${customAspectRatio?.width}:${customAspectRatio?.height} - ratio: ${targetRatio.toFixed(3)}, final: ${finalWidth.toFixed(0)}x${finalHeight.toFixed(0)}`);
        }
      }
    } else {
      // Comportamiento de 'auto' - usar dimensiones del contenedor
      console.log('[useContainerDimensions] Modo Auto: Dimensiones:', { 
        width: finalWidth, 
        height: finalHeight 
      });
    }

      
    return {
      width: Math.max(1, Math.floor(finalWidth)),
      height: Math.max(1, Math.floor(finalHeight)),
      adjustment: {
        type: adjustmentType,
        widthPercentage: observedWidth > 0 ? (finalWidth / observedWidth) * 100 : 100,
        heightPercentage: observedHeight > 0 ? (finalHeight / observedHeight) * 100 : 100
      }
    };
  }, [fixedWidth, fixedHeight, aspectRatio, customAspectRatio]);

  // Manejador para el Resize Observer
  const handleResize = useCallback(() => {
    if (!containerRef) return;

    // Obtener dimensiones del contenedor
    const boundingRect = containerRef.getBoundingClientRect();
    const observedWidth = boundingRect.width;
    const observedHeight = boundingRect.height;

    // Actualizar estado de dimensiones observadas
    setObservedDimensions({ width: observedWidth, height: observedHeight });
    
    // Calcular y actualizar dimensiones ajustadas
    const newDimensions = calculateDimensions(observedWidth, observedHeight);
    setDimensions(newDimensions);
  }, [containerRef, calculateDimensions]);

  // Efecto para crear y limpiar el Resize Observer
  useLayoutEffect(() => {
    if (!containerRef) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef);

    // Llamada inicial para establecer valores iniciales
    handleResize();
    
    // Limpieza al desmontar
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, handleResize]);

  // Método público para recalcular las dimensiones explícitamente
  const recalculate = useCallback(() => {
    if (containerRef) {
      handleResize();
    }
  }, [containerRef, handleResize]);

  // Devolver dimensiones y métodos de utilidad
  return {
    dimensions, 
    observedDimensions,
    recalculate
  };
}
