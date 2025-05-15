import { useState, useRef, useEffect, useCallback } from 'react';
import type { AspectRatioOption } from './useContainerDimensions';

interface UseGridContainerReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  containerSize: { width: number; height: number };
  calculateOptimalGrid: (aspectRatio: AspectRatioOption, spacing: number, customAspectRatio?: { width: number; height: number }) => { rows: number; cols: number };
}

/**
 * Hook para obtener las dimensiones reales del contenedor y calcular filas/columnas óptimas
 */
export function useGridContainer(): UseGridContainerReturn {
  // Referencia al contenedor
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estado para almacenar las dimensiones reales del contenedor
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600
  });
  
  // Efecto para medir el contenedor cuando cambia de tamaño
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (!containerRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    };
    
    // Crear un observador de redimensionamiento
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    
    // Medir inmediatamente
    updateSize();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Función para calcular dimensiones óptimas basadas en el tamaño real
  const calculateOptimalGrid = useCallback((aspectRatio: AspectRatioOption, spacing: number, customAspectRatio?: { width: number; height: number }) => {
    let optimalRows: number, optimalCols: number;
    const { width, height } = containerSize;
    
    // Factor de margen para evitar que los vectores toquen los bordes
    const marginFactor = 0.9;
    const usableWidth = width * marginFactor;
    const usableHeight = height * marginFactor;
    
    switch (aspectRatio) {
      case '1:1': {
        // Para 1:1, el lado más pequeño determina ambas dimensiones
        const squareSide = Math.min(usableWidth, usableHeight);
        optimalRows = optimalCols = Math.max(5, Math.floor(squareSide / spacing));
        break;
      }
        
      case '2:1': {
        optimalRows = Math.max(5, Math.floor(usableHeight / spacing));
        optimalCols = optimalRows * 2;
        break;
      }
        
      case '16:9': {
        // Para 16:9, mantenemos esa proporción exacta
        if (usableWidth / usableHeight > 16/9) {
          // Contenedor más ancho, limitar por altura
          optimalRows = Math.max(9, Math.floor(usableHeight / spacing));
          optimalCols = Math.floor(optimalRows * (16/9));
        } else {
          // Contenedor más estrecho, limitar por ancho
          optimalCols = Math.max(16, Math.floor(usableWidth / spacing));
          optimalRows = Math.floor(optimalCols * (9/16));
        }
        break;
      }
        
      case 'custom': {
        if (customAspectRatio && customAspectRatio.width > 0 && customAspectRatio.height > 0) {
          const targetRatio = customAspectRatio.width / customAspectRatio.height;
          if (usableWidth / usableHeight > targetRatio) {
            // Limitar por altura
            optimalRows = Math.max(5, Math.floor(usableHeight / spacing));
            optimalCols = Math.floor(optimalRows * targetRatio);
          } else {
            // Limitar por ancho
            optimalCols = Math.max(5, Math.floor(usableWidth / spacing));
            optimalRows = Math.floor(optimalCols / targetRatio);
          }
        } else {
          // Fallback si no hay ratio personalizado válido
          optimalRows = Math.max(9, Math.floor(usableHeight / spacing));
          optimalCols = Math.max(16, Math.floor(usableWidth / spacing));
        }
        break;
      }
        
      default: { // 'auto'
        // Usar el máximo de filas/columnas que caben en el espacio disponible
        optimalRows = Math.max(5, Math.floor(usableHeight / spacing));
        optimalCols = Math.max(5, Math.floor(usableWidth / spacing));
        break;
      }
    }
    
    // Asegurar mínimos razonables
    return {
      rows: Math.max(3, Math.floor(optimalRows)),
      cols: Math.max(3, Math.floor(optimalCols))
    };
  }, [containerSize]);
  
  return {
    containerRef,
    containerSize,
    calculateOptimalGrid
  };
}
