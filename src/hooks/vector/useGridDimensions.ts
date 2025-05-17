import { useLayoutEffect, useState, useRef, MutableRefObject } from 'react';
import { AspectRatioOption } from '@/components/vector/core/types';

// Definimos la interfaz de opciones
interface GridDimensionsOptions {
  aspectRatio: AspectRatioOption;
  containerRef: React.RefObject<HTMLDivElement>;
  margin: number;
  customAspectRatio?: { width: number; height: number };
  forceRecalculation?: boolean;
  debug?: boolean;
}

// Interfaz para el resultado
export interface GridDimensions {
  width: number;
  height: number;
  gridOffsetX: number;
  gridOffsetY: number;
  effectiveWidth: number;
  effectiveHeight: number;
}

/**
 * Hook especializado para calcular dimensiones del grid con posicionamiento centrado
 * 
 * Este hook centraliza toda la lógica de dimensionamiento y centrado del VectorGrid,
 * calculando tanto las dimensiones efectivas como los offsets necesarios para centrar
 * el grid dentro de su contenedor según el aspect ratio especificado.
 */
export function useGridDimensions({
  aspectRatio,
  containerRef,
  margin,
  customAspectRatio,
  forceRecalculation = false,
  debug = false
}: GridDimensionsOptions): GridDimensions {
  // Estado para las dimensiones - inicializado con valores por defecto
  const [dimensions, setDimensions] = useState<GridDimensions>({
    width: 0,
    height: 0,
    gridOffsetX: 0,
    gridOffsetY: 0,
    effectiveWidth: 0,
    effectiveHeight: 0,
  });
  
  // Referencias para control de cálculos y actualizaciones
  const resizeTimeoutRef = useRef<number | null>(null);
  const prevDimensionsRef = useRef<GridDimensions | null>(null);
  const forceUpdateRef = useRef(forceRecalculation);
  const aspectRatioRef = useRef(aspectRatio);
  const marginRef = useRef(margin);
  const customAspectRatioRef = useRef(customAspectRatio);
  
  // Actualizar refs cuando cambien las props
  if (aspectRatioRef.current !== aspectRatio) {
    aspectRatioRef.current = aspectRatio;
  }
  
  if (marginRef.current !== margin) {
    marginRef.current = margin;
  }
  
  if (customAspectRatioRef.current !== customAspectRatio) {
    customAspectRatioRef.current = customAspectRatio;
  }
  
  if (forceUpdateRef.current !== forceRecalculation) {
    forceUpdateRef.current = forceRecalculation;
  }
  
  // Función de cálculo de dimensiones con referencias estables
  const calculateDimensions = (rect: DOMRect): GridDimensions => {
    const currentAspectRatio = aspectRatioRef.current;
    const currentMargin = marginRef.current;
    const currentCustomRatio = customAspectRatioRef.current;
    
    // Espacio disponible considerando márgenes
    const availableWidth = rect.width - (currentMargin * 2);
    const availableHeight = rect.height - (currentMargin * 2);
    
    let gridWidth: number, gridHeight: number;
    
    // Cálculos según aspect ratio
    if (currentAspectRatio === '1:1') {
      // Para ratio cuadrado, usar el lado más corto
      gridWidth = gridHeight = Math.min(availableWidth, availableHeight);
    } else if (currentAspectRatio === '16:9') {
      // Para 16:9, calcular dimensión limitante
      const heightBasedOnWidth = (availableWidth * 9) / 16;
      if (heightBasedOnWidth <= availableHeight) {
        // Ancho es limitante
        gridWidth = availableWidth;
        gridHeight = heightBasedOnWidth;
      } else {
        // Alto es limitante
        gridHeight = availableHeight;
        gridWidth = (gridHeight * 16) / 9;
      }
    } else if (currentAspectRatio === '2:1') {
      // Para 2:1, similar al anterior
      const heightBasedOnWidth = availableWidth / 2;
      if (heightBasedOnWidth <= availableHeight) {
        gridWidth = availableWidth;
        gridHeight = heightBasedOnWidth;
      } else {
        gridHeight = availableHeight;
        gridWidth = gridHeight * 2;
      }
    } else if (currentAspectRatio === 'custom' && currentCustomRatio) {
      // Para ratio personalizado
      const ratio = currentCustomRatio.width / currentCustomRatio.height;
      const heightBasedOnWidth = availableWidth / ratio;
      
      if (heightBasedOnWidth <= availableHeight) {
        gridWidth = availableWidth;
        gridHeight = heightBasedOnWidth;
      } else {
        gridHeight = availableHeight;
        gridWidth = gridHeight * ratio;
      }
    } else {
      // Fallback para 'auto' o valores desconocidos
      gridWidth = availableWidth;
      gridHeight = availableHeight;
    }
    
    // Calcular offsets para centrado perfecto
    const gridOffsetX = Math.max(0, (rect.width - gridWidth) / 2);
    const gridOffsetY = Math.max(0, (rect.height - gridHeight) / 2);
    
    // Dimensiones calculadas (con round para evitar problemas de decimales)
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      gridOffsetX: Math.round(gridOffsetX),
      gridOffsetY: Math.round(gridOffsetY),
      effectiveWidth: Math.round(gridWidth),
      effectiveHeight: Math.round(gridHeight),
    };
  };
  
  // Configuración del observer y manejador de resize
  useLayoutEffect(() => {
    // Seguridad para SSR y existencia de referencia
    if (typeof window === 'undefined' || !containerRef?.current) return;
    
    const container = containerRef.current;
    
    // Función de recálculo con debounce
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        window.cancelAnimationFrame(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = window.requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const calculatedDimensions = calculateDimensions(rect);
        
        // Debug opcional
        if (debug) {
          console.log('[useGridDimensions]', {
            container: { width: rect.width, height: rect.height },
            calculated: calculatedDimensions
          });
        }
        
        // Evitar actualizaciones innecesarias
        const prevDims = prevDimensionsRef.current;
        if (
          !prevDims || 
          prevDims.effectiveWidth !== calculatedDimensions.effectiveWidth ||
          prevDims.effectiveHeight !== calculatedDimensions.effectiveHeight ||
          prevDims.gridOffsetX !== calculatedDimensions.gridOffsetX ||
          prevDims.gridOffsetY !== calculatedDimensions.gridOffsetY ||
          prevDims.width !== calculatedDimensions.width ||
          prevDims.height !== calculatedDimensions.height ||
          forceUpdateRef.current
        ) {
          setDimensions(calculatedDimensions);
          prevDimensionsRef.current = calculatedDimensions;
          
          // Reset forzado después de actualizar
          if (forceUpdateRef.current) {
            forceUpdateRef.current = false;
          }
        }
        
        resizeTimeoutRef.current = null;
      });
    };
    
    // Observer de tamaño
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    
    // Cálculo inicial inmediato
    handleResize();
    
    // Limpiar
    return () => {
      if (resizeTimeoutRef.current) {
        window.cancelAnimationFrame(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, [containerRef, debug]);
  
  // Effect para recalcular cuando cambian aspectRatio o margin
  useLayoutEffect(() => {
    // Forzar recálculo si cambian estos valores
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const calculatedDimensions = calculateDimensions(rect);
      setDimensions(calculatedDimensions);
      prevDimensionsRef.current = calculatedDimensions;
    }
  }, [aspectRatio, margin, customAspectRatio]);
  
  return dimensions;
}
