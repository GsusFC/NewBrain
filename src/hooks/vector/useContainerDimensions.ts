import { useState, useCallback, useMemo, useLayoutEffect, useRef, useEffect, RefObject } from 'react';

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
   * Referencia al elemento contenedor HTML o un RefObject de React
   * @example const containerRef = useRef<HTMLDivElement>(null);
   * @example <div ref={containerRef}></div>
   */
  containerRef: HTMLElement | RefObject<HTMLElement> | null;
  /**
   * Ancho fijo en píxeles (opcional)
   * @example 800
   */
  fixedWidth?: number;
  /**
   * Altura fija en píxeles (opcional)
   * @example 600
   */
  fixedHeight?: number;
  /**
   * Modo de aspect ratio (opcional, por defecto 'auto')
   * @example '16:9' | '1:1' | '2:1' | 'custom' | 'auto'
   */
  aspectRatio?: AspectRatioOption;
  /**
   * Relación de aspecto personalizada para cuando el modo es 'custom'
   * @example { width: 4, height: 3 } // Para una relación 4:3
   */
  customAspectRatio?: { width: number; height: number };
  /**
   * Padding interno en píxeles (opcional)
   * Si es un número, se aplica el mismo padding en todos los lados
   * Si es un objeto, se pueden especificar valores diferentes para x (horizontal) e y (vertical)
   * @example 20 // 20px en todos los lados
   * @example { x: 10, y: 20 } // 10px horizontal, 20px vertical
   */
  padding?: number | { x?: number; y?: number };
  /**
   * Tiempo de debounce en ms para reducir actualizaciones frecuentes durante resize
   * @default 50
   */
  debounceMs?: number;
  /**
   * Callback que se ejecuta cuando cambian las dimensiones calculadas
   * @param dimensions Las nuevas dimensiones calculadas
   */
  onDimensionsChange?: (dimensions: Dimensions) => void;
  /**
   * Activar modo debug para ver información detallada en la consola (solo en desarrollo)
   * @default false
   */
  debug?: boolean;
};

// Nota: Con el algoritmo universal, ya no necesitamos altura base predefinida

/**
 * Hook personalizado para calcular las dimensiones óptimas de un contenedor respetando aspect ratios
 * 
 * @param args Configuración del hook
 * @returns Objeto con dimensiones calculadas, dimensiones observadas y función para recalcular
 *
 * @example
 * // Ejemplo básico usando un ref
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { dimensions } = useContainerDimensions({ containerRef });
 *
 * @example
 * // Ejemplo con aspect ratio fijo
 * const { dimensions } = useContainerDimensions({
 *   containerRef: myRef,
 *   aspectRatio: '16:9'
 * });
 *
 * @example
 * // Ejemplo con padding y callback
 * const { dimensions } = useContainerDimensions({
 *   containerRef: myRef,
 *   padding: { x: 20, y: 10 },
 *   onDimensionsChange: (newDimensions) => console.log('Dimensiones actualizadas:', newDimensions)
 * });
 */
export function useContainerDimensions(args: UseContainerDimensionsArgs) {
  const { 
    containerRef, 
    fixedWidth, 
    fixedHeight, 
    aspectRatio = 'auto', 
    customAspectRatio,
    padding,
    debounceMs = 50,
    onDimensionsChange,
    debug = false
  } = args;
  
  // Validación de argumentos en desarrollo
  if (process.env.NODE_ENV === 'development') {
    // Validar que customAspectRatio tenga valores positivos
    if (aspectRatio === 'custom' && customAspectRatio && 
        (customAspectRatio.width <= 0 || customAspectRatio.height <= 0)) {
      console.warn("[useContainerDimensions] customAspectRatio debe tener valores positivos. "
                  + "Se usará una relación de aspecto predeterminada.");
    }
  }

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
  
  // Referencia para timeout de debounce
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Referencia para el último elemento observado
  const lastObservedElement = useRef<Element | null>(null);

  // Función para calcular las dimensiones en base a las dimensiones observadas del contenedor
  const calculateDimensions = useMemo(() => (observedWidth: number, observedHeight: number): Dimensions => {
    // Aplicar padding si está definido
    const padX = typeof padding === 'number' ? padding : padding?.x || 0;
    const padY = typeof padding === 'number' ? padding : padding?.y || 0;
    
    // Ancho y alto disponibles después de restar el padding
    const usableWidth = Math.max(1, observedWidth - 2 * padX);
    const usableHeight = Math.max(1, observedHeight - 2 * padY);
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
        height: Math.floor(fixedWidth * (usableHeight / usableWidth)),
        adjustment: { type: 'widthLimited' }
      };
    } else if (fixedHeight) {
      // Si solo la altura está fija, calcular ancho proporcionalmente
      return {
        width: Math.floor(fixedHeight * (usableWidth / usableHeight)),
        height: fixedHeight,
        adjustment: { type: 'heightLimited' }
      };
    }

    // Nuevas variables para el cálculo general
    let finalWidth = usableWidth;
    let finalHeight = usableHeight;
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

      // Algoritmo universal para todos los tipos de aspect ratio
      if (targetRatio !== null) {
        // Calculamos la relación del contenedor (ancho/alto)
        const containerRatio = usableWidth / usableHeight;

        if (containerRatio > targetRatio) {
          // Contenedor más ancho que el ratio objetivo → limitar por altura
          finalHeight = usableHeight;
          finalWidth = usableHeight * targetRatio;
          adjustmentType = 'heightLimited';
        } else {
          // Contenedor más alto que el ratio objetivo → limitar por ancho
          finalWidth = usableWidth;
          finalHeight = usableWidth / targetRatio;
          adjustmentType = 'widthLimited';
        }

        // Solo mostramos logs en modo debug
        if (process.env.NODE_ENV === 'development' && debug) {
          // eslint-disable-next-line no-console
          console.log(`[useContainerDimensions] ${aspectRatio === 'custom' ? `Custom ${customAspectRatio?.width}:${customAspectRatio?.height}` : aspectRatio} - ratio: ${targetRatio.toFixed(3)}, final: ${finalWidth.toFixed(0)}x${finalHeight.toFixed(0)}, adjusted by: ${adjustmentType}`);
        }
      }
    } else {
      // Comportamiento de 'auto' - usar dimensiones del contenedor
      // Solo mostramos logs en modo debug
      if (process.env.NODE_ENV === 'development' && debug) {
        // eslint-disable-next-line no-console
        console.log('[useContainerDimensions] Modo Auto: Dimensiones:', { 
          width: finalWidth, 
          height: finalHeight 
        });
      }
    }

      
    return {
      width: Math.max(1, Math.floor(finalWidth)),
      height: Math.max(1, Math.floor(finalHeight)),
      adjustment: {
        type: adjustmentType,
        widthPercentage: usableWidth > 0 ? (finalWidth / usableWidth) * 100 : 100,
        heightPercentage: usableHeight > 0 ? (finalHeight / usableHeight) * 100 : 100
      }
    };
  }, [fixedWidth, fixedHeight, aspectRatio, customAspectRatio, padding, debug]);

  /**
   * Obtiene el elemento DOM a partir de una referencia que puede ser un elemento directo o un RefObject
   */
  const getElement = useCallback((ref: HTMLElement | RefObject<HTMLElement> | null): Element | null => {
    if (!ref) return null;
    
    // Si es un objeto con propiedad 'current', es un RefObject
    if (typeof ref === "object" && "current" in ref) {
      return ref.current;
    }
    
    // Si no, asumimos que es un elemento DOM directo
    return ref as Element;
  }, []);
  
  // Manejador para el Resize Observer con debounce
  const handleResize = useCallback(() => {
    // Obtener el elemento DOM
    const element = getElement(containerRef);
    if (!element) return;
    
    // Cancelar cualquier timeout pendiente
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    // Implementar debounce para evitar actualizaciones excesivas
    resizeTimeoutRef.current = setTimeout(() => {
      // Obtener dimensiones del contenedor
      const boundingRect = element.getBoundingClientRect();
      const observedWidth = boundingRect.width;
      const observedHeight = boundingRect.height;
      
      if (process.env.NODE_ENV === 'development' && debug) {
        // eslint-disable-next-line no-console
        console.log('[useContainerDimensions] Resize detectado:', { width: observedWidth, height: observedHeight });
      }

      // Actualizar estado de dimensiones observadas
      setObservedDimensions({ width: observedWidth, height: observedHeight });
      
      // Calcular dimensiones ajustadas
      const newDimensions = calculateDimensions(observedWidth, observedHeight);
      
      // Evitar actualizaciones innecesarias comprobando si realmente cambiaron las dimensiones
      setDimensions(prevDimensions => {
        if (
          Math.abs(prevDimensions.width - newDimensions.width) < 1 &&
          Math.abs(prevDimensions.height - newDimensions.height) < 1 &&
          prevDimensions.adjustment.type === newDimensions.adjustment.type
        ) {
          return prevDimensions; // No ha cambiado significativamente, mantenemos las dimensiones actuales
        }
        return newDimensions;
      });
      
    }, debounceMs);
  }, [containerRef, calculateDimensions, debounceMs, debug, getElement]);

  // Efecto para crear y limpiar el Resize Observer
  useLayoutEffect(() => {
    // Obtener el elemento DOM del containerRef
    const element = getElement(containerRef);
      
    if (!element) return;
    
    // Evitar crear un nuevo observer si el elemento no ha cambiado
    if (lastObservedElement.current === element) return;
    
    // Guardar referencia al elemento actual
    lastObservedElement.current = element;
    
    // Limpiar observer previo si existe
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(element);

    // Llamada inicial para establecer valores iniciales
    handleResize();
    
    // Limpieza al desmontar
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      resizeObserver.disconnect();
      lastObservedElement.current = null;
    };
  }, [containerRef, handleResize, getElement]);
  
  // Efecto para notificar cambios en dimensiones mediante callback
  useEffect(() => {
    if (onDimensionsChange) {
      onDimensionsChange(dimensions);
    }
  }, [dimensions, onDimensionsChange]);

  // Método público para recalcular las dimensiones explícitamente
  const recalculate = useCallback(() => {
    // Forzar recálculo inmediato (sin debounce)
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }
    
    // Llamar directamente al manejador de resize
    handleResize();
  }, [handleResize]);

  // Devolver dimensiones y métodos de utilidad
  return {
    dimensions, 
    observedDimensions,
    recalculate
  };
}

/**
 * Ejemplo de uso básico de useContainerDimensions:
 *
 * ```tsx
 * import { useRef } from 'react';
 * import { useContainerDimensions } from '@/hooks/vector/useContainerDimensions';
 *
 * function MyComponent() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { dimensions } = useContainerDimensions({
 *     containerRef,
 *     aspectRatio: '16:9',
 *     padding: 20,
 *     onDimensionsChange: (dims) => console.log("Dimensiones actualizadas", dims)
 *   });
 *
 *   return (
 *     <div className="container" ref={containerRef}>
 *       <div style={{ width: dimensions.width, height: dimensions.height }}>
 *         Contenido con aspect ratio controlado
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
