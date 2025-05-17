import { useEffect, useRef, useState, useCallback } from 'react';
import { AspectRatioOption, GridSettings } from '@/components/vector/controls/grid/types';
import { useAspectRatioCalculator } from './useAspectRatioCalculator';

// Interfaz para el retorno del hook
export interface UseGridContainerReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  containerSize: { width: number; height: number };
  calculateOptimalGrid: (
    aspectRatio: AspectRatioOption,
    spacing: number,
    customRatio?: number,
    density?: number
  ) => GridSettings;
  isRecalculating: boolean;
}

// Constantes
const CONTAINER_MARGIN_FACTOR = 0.9; // Usamos el 90% del contenedor para evitar que los vectores toquen los bordes
const SIGNIFICANT_CHANGE_THRESHOLD = 2; // Consideramos significativo un cambio de más de 2 filas/columnas
const DEFAULT_SIZE = { width: 800, height: 600 };

/**
 * Hook personalizado que gestiona las dimensiones del contenedor y calcula
 * los parámetros óptimos del grid según el aspect ratio.
 * 
 * Características:
 * - Usa ResizeObserver para detectar cambios en las dimensiones del contenedor
 * - Calcula rows/cols óptimos según el aspect ratio seleccionado
 * - Permite ajustar la densidad de vectores manteniendo el aspect ratio
 * - Evita recálculos innecesarios para cambios pequeños
 * - Proporciona feedback visual durante recálculos
 */
export function useGridContainer(): UseGridContainerReturn {
  // Referencia al contenedor
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>(DEFAULT_SIZE);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Hook para cálculos de aspect ratio
  const { calculateOptimalGrid: baseCalculateOptimal, calculateCustomGrid } = useAspectRatioCalculator();
  
  // Efecto para medir el contenedor con ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Solo actualizamos si hay un cambio significativo para evitar renders innecesarios
      setContainerSize(prev => {
        const widthDiff = Math.abs(prev.width - rect.width);
        const heightDiff = Math.abs(prev.height - rect.height);
        
        // Si el cambio es muy pequeño (< 5px), no actualizamos
        if (widthDiff < 5 && heightDiff < 5) return prev;
        
        setIsRecalculating(true);
        // Reseteamos la bandera después de un breve retraso (para efecto visual)
        setTimeout(() => setIsRecalculating(false), 300);
        
        return {
          width: rect.width,
          height: rect.height
        };
      });
    };
    
    // Configuración inicial
    updateSize();
    
    // Configurar ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0) {
        updateSize();
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    // Limpieza
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);
  
  /**
   * Calcula la configuración óptima de grid basada en el aspect ratio y la densidad deseada
   */
  const calculateOptimalGrid = useCallback((  
    aspectRatio: AspectRatioOption,
    spacing: number,
    customRatio?: number,
    density?: number
  ): GridSettings => {
    const margin = Math.min(containerSize.width, containerSize.height) * 0.05; // 5% de margen
    
    // Calculamos el espacio efectivo aplicando el factor de margen
    const effectiveWidth = containerSize.width * CONTAINER_MARGIN_FACTOR;
    const effectiveHeight = containerSize.height * CONTAINER_MARGIN_FACTOR;
    
    let result: GridSettings;
    
    // Si hay un valor de densidad, lo usamos como base para el cálculo
    if (density !== undefined && density > 0) {
      // Usamos density como número base de filas
      const baseRows = Math.max(3, Math.round(density));
      
      if (aspectRatio === 'custom' && customRatio) {
        // Para ratio personalizado, calculamos las columnas basándonos en la densidad y el ratio
        const baseCols = Math.max(3, Math.round(baseRows * customRatio));
        result = { rows: baseRows, cols: baseCols, spacing, margin };
      } else if (aspectRatio === '1:1') {
        // Para 1:1, mantenemos el mismo número para filas y columnas
        result = { rows: baseRows, cols: baseRows, spacing, margin };
      } else if (aspectRatio === '2:1') {
        // Para 2:1, el doble de columnas que filas
        const baseCols = baseRows * 2;
        result = { rows: baseRows, cols: baseCols, spacing, margin };
      } else if (aspectRatio === '16:9') {
        // Para 16:9, aplicamos la proporción
        const baseCols = Math.round(baseRows * (16/9));
        result = { rows: baseRows, cols: baseCols, spacing, margin };
      } else {
        // Para auto (o casos no contemplados), usamos el cálculo base
        result = baseCalculateOptimal(aspectRatio, undefined, {
          containerWidth: effectiveWidth,
          containerHeight: effectiveHeight,
          spacing,
          margin
        });
      }
    } else {
      // Sin densidad especificada, usamos el cálculo estándar
      if (aspectRatio === 'custom' && customRatio) {
        // Calculamos usando el ratio personalizado
        result = calculateCustomGrid(
          effectiveWidth,
          effectiveHeight,
          spacing,
          margin,
          customRatio
        );
      } else {
        // Usamos el cálculo basado en tipo de aspect ratio
        result = baseCalculateOptimal(aspectRatio, undefined, {
          containerWidth: effectiveWidth,
          containerHeight: effectiveHeight,
          spacing,
          margin
        });
      }
    }
    
    // Aseguramos valores mínimos
    result.rows = Math.max(3, result.rows);
    result.cols = Math.max(3, result.cols);
    
    return result;
  }, [containerSize, baseCalculateOptimal, calculateCustomGrid]);
  
  return {
    containerRef,
    containerSize,
    calculateOptimalGrid,
    isRecalculating
  };
}
