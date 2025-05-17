import { useState, useEffect, useCallback, RefObject } from 'react';
import { AspectRatioOption } from '../types';

interface ContainerSize {
  width: number;
  height: number;
}

interface OptimalGridResult {
  rows: number;
  cols: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
}

/**
 * Hook para gestionar las dimensiones del contenedor y detectar cambios de tamaño
 * @param containerRef Referencia al elemento contenedor
 * @returns Dimensiones del contenedor y función para calcular dimensiones óptimas
 */
export const useGridContainer = (containerRef: RefObject<HTMLElement>) => {
  // Estado para almacenar las dimensiones actuales del contenedor
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 0, height: 0 });
  
  // Función para medir el contenedor actual y actualizar el estado
  const measureContainer = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      
      // Solo actualizar si las dimensiones han cambiado realmente
      setContainerSize(prev => {
        if (prev.width !== offsetWidth || prev.height !== offsetHeight) {
          return { width: offsetWidth, height: offsetHeight };
        }
        return prev;
      });
    }
  }, [containerRef]);
  
  // Efecto para medir el contenedor inicialmente y configurar el observer para cambios
  useEffect(() => {
    // Medir inmediatamente
    measureContainer();
    
    // Crear un ResizeObserver para detectar cambios de tamaño
    // Usar un guard para navegadores antiguos y SSR
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          measureContainer();
        })
      : null;
    
    // Observar el elemento contenedor si existe y el ResizeObserver está disponible
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Limpiar al desmontar
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerRef, measureContainer]);
  
  // Función para calcular las dimensiones óptimas de la cuadrícula
  const calculateOptimalGrid = useCallback((
    rows: number,
    cols: number,
    spacing: number,
    margin: number,
    aspectRatio: AspectRatioOption,
    customAspectRatio?: { width: number; height: number }
  ): OptimalGridResult => {
    // Si no tenemos dimensiones del contenedor válidas, devolver valores predeterminados
    if (containerSize.width <= 0 || containerSize.height <= 0) {
      return {
        rows,
        cols,
        cellSize: 20, // Valor predeterminado
        gridWidth: 0,
        gridHeight: 0
      };
    }
    
    // Calcular el área disponible dentro del contenedor considerando el margen
    const availableWidth = containerSize.width - (margin * 2);
    const availableHeight = containerSize.height - (margin * 2);
    
    // Si no hay espacio disponible, devolver valores predeterminados
    if (availableWidth <= 0 || availableHeight <= 0) {
      return {
        rows,
        cols,
        cellSize: 20,
        gridWidth: 0,
        gridHeight: 0
      };
    }
    
    // Calcular el tamaño de celda basado en la relación de aspecto
    let cellSize: number;
    let gridWidth: number;
    let gridHeight: number;
    
    if (aspectRatio === 'auto') {
      // Adaptarse al contenedor automáticamente
      const cellWidthByWidth = availableWidth / (cols + (cols - 1) * spacing);
      const cellHeightByHeight = availableHeight / (rows + (rows - 1) * spacing);
      
      // Usar el valor más pequeño para asegurar que cabe completamente
      cellSize = Math.min(cellWidthByWidth, cellHeightByHeight);
    } else {
      // Para aspectos preestablecidos o personalizados
      let targetAspectRatio: number;
      
      switch (aspectRatio) {
        case '1:1':
          targetAspectRatio = 1;
          break;
        case '2:1':
          targetAspectRatio = 2;
          break;
        case '16:9':
          targetAspectRatio = 16 / 9;
          break;
        case 'custom':
          // Usar relación personalizada si está disponible, o caer en auto
          if (customAspectRatio && customAspectRatio.width > 0 && customAspectRatio.height > 0) {
            targetAspectRatio = customAspectRatio.width / customAspectRatio.height;
          } else {
            targetAspectRatio = availableWidth / availableHeight;
          }
          break;
        default:
          // Fallback a la relación del contenedor
          targetAspectRatio = availableWidth / availableHeight;
      }
      
      // Calcular dimensiones basadas en la relación de aspecto objetivo
      const totalColsWithSpacing = cols * (1 + spacing) - spacing;
      const totalRowsWithSpacing = rows * (1 + spacing) - spacing;
      
      // Intentar ajustar al ancho primero
      cellSize = availableWidth / totalColsWithSpacing;
      gridWidth = availableWidth;
      gridHeight = gridWidth / targetAspectRatio;
      
      // Si la altura excede el espacio disponible, ajustar a la altura
      if (gridHeight > availableHeight) {
        gridHeight = availableHeight;
        gridWidth = gridHeight * targetAspectRatio;
        cellSize = gridWidth / totalColsWithSpacing;
      }
    }
    
    // Calcular dimensiones finales de la cuadrícula
    gridWidth = cellSize * cols + spacing * cellSize * (cols - 1);
    gridHeight = cellSize * rows + spacing * cellSize * (rows - 1);
    
    return {
      rows,
      cols,
      cellSize,
      gridWidth,
      gridHeight
    };
  }, [containerSize]);
  
  return {
    containerSize,
    calculateOptimalGrid,
    measureContainer
  };
};

/**
 * Función auxiliar para calcular las dimensiones óptimas de la cuadrícula
 * basadas en la relación de aspecto
 */
export const calculateOptimalGrid = (
  rows: number,
  cols: number,
  spacing: number,
  margin: number,
  containerWidth: number,
  containerHeight: number,
  aspectRatio: AspectRatioOption,
  customAspectRatio?: { width: number; height: number }
): OptimalGridResult => {
  // Si no tenemos dimensiones del contenedor válidas, devolver valores predeterminados
  if (containerWidth <= 0 || containerHeight <= 0) {
    return {
      rows,
      cols,
      cellSize: 20, // Valor predeterminado
      gridWidth: 0,
      gridHeight: 0
    };
  }
  
  // Calcular el área disponible dentro del contenedor considerando el margen
  const availableWidth = containerWidth - (margin * 2);
  const availableHeight = containerHeight - (margin * 2);
  
  // Si no hay espacio disponible, devolver valores predeterminados
  if (availableWidth <= 0 || availableHeight <= 0) {
    return {
      rows,
      cols,
      cellSize: 20,
      gridWidth: 0,
      gridHeight: 0
    };
  }
  
  // Calcular el tamaño de celda basado en la relación de aspecto
  let cellSize: number;
  let gridWidth: number;
  let gridHeight: number;
  
  if (aspectRatio === 'auto') {
    // Adaptarse al contenedor automáticamente
    const cellWidthByWidth = availableWidth / (cols + (cols - 1) * spacing);
    const cellHeightByHeight = availableHeight / (rows + (rows - 1) * spacing);
    
    // Usar el valor más pequeño para asegurar que cabe completamente
    cellSize = Math.min(cellWidthByWidth, cellHeightByHeight);
  } else {
    // Para aspectos preestablecidos o personalizados
    let targetAspectRatio: number;
    
    switch (aspectRatio) {
      case '1:1':
        targetAspectRatio = 1;
        break;
      case '2:1':
        targetAspectRatio = 2;
        break;
      case '16:9':
        targetAspectRatio = 16 / 9;
        break;
      case 'custom':
        // Usar relación personalizada si está disponible, o caer en auto
        if (customAspectRatio && customAspectRatio.width > 0 && customAspectRatio.height > 0) {
          targetAspectRatio = customAspectRatio.width / customAspectRatio.height;
        } else {
          targetAspectRatio = availableWidth / availableHeight;
        }
        break;
      default:
        // Fallback a la relación del contenedor
        targetAspectRatio = availableWidth / availableHeight;
    }
    
    // Calcular dimensiones basadas en la relación de aspecto objetivo
    const totalColsWithSpacing = cols * (1 + spacing) - spacing;
    const totalRowsWithSpacing = rows * (1 + spacing) - spacing;
    
    // Intentar ajustar al ancho primero
    cellSize = availableWidth / totalColsWithSpacing;
    gridWidth = availableWidth;
    gridHeight = gridWidth / targetAspectRatio;
    
    // Si la altura excede el espacio disponible, ajustar a la altura
    if (gridHeight > availableHeight) {
      gridHeight = availableHeight;
      gridWidth = gridHeight * targetAspectRatio;
      cellSize = gridWidth / totalColsWithSpacing;
    }
  }
  
  // Calcular dimensiones finales de la cuadrícula
  gridWidth = cellSize * cols + spacing * cellSize * (cols - 1);
  gridHeight = cellSize * rows + spacing * cellSize * (rows - 1);
  
  return {
    rows,
    cols,
    cellSize,
    gridWidth,
    gridHeight
  };
};
