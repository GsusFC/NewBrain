import { useCallback } from 'react';
import { AspectRatioOption, GridSettings } from '@/components/vector/core/types';

interface CalculatorOptions {
  containerWidth: number;
  containerHeight: number;
  spacing: number;
  margin?: number;
}

interface AspectRatioData {
  ratio: number;
  name: string;
}

export function useAspectRatioCalculator() {
  /**
   * Calcula la configuración óptima de la cuadrícula basada en el aspect ratio seleccionado
   */
  const calculateOptimalGrid = useCallback(
    (aspectRatio: AspectRatioOption, customRatio: {width: number; height: number} | undefined, options: CalculatorOptions): GridSettings => {
      const { containerWidth, containerHeight, spacing, margin = 20 } = options;
      
      // Espacio disponible dentro de los márgenes
      const availableWidth = containerWidth - (margin * 2);
      const availableHeight = containerHeight - (margin * 2);
      
      switch (aspectRatio) {
        case 'auto': {
          // Usar toda el área disponible, adaptándose al contenedor
          return {
            rows: Math.max(1, Math.floor(availableHeight / spacing)),
            cols: Math.max(1, Math.floor(availableWidth / spacing)),
            spacing,
            margin
          };
        }
          
        case '1:1': {
          // Cuadrado: misma cantidad de filas y columnas
          const minDimension = Math.min(availableWidth, availableHeight);
          const cells = Math.max(5, Math.floor(minDimension / spacing));
          return {
            rows: cells,
            cols: cells,
            spacing,
            margin
          };
        }
        
        case '16:9': {
          // Proporción exacta 16:9
          // Calcular cuántas filas y columnas caben manteniendo la proporción
          const ratio = 16 / 9;
          
          // Intentar primero ajustando al ancho
          let cols = Math.floor(availableWidth / spacing);
          let rows = Math.floor(cols / ratio);
          
          // Si la altura resultante es mayor que la disponible, ajustar por altura
          if (rows * spacing > availableHeight) {
            rows = Math.floor(availableHeight / spacing);
            cols = Math.floor(rows * ratio);
          }
          
          // Asegurarse de un mínimo
          rows = Math.max(3, rows);
          cols = Math.max(5, cols);
          
          return {
            rows,
            cols, 
            spacing,
            margin
          };
        }
        
        case '2:1': {
          // Doble ancho que alto
          // Calcular cuántas filas caben en la altura disponible
          const rows = Math.max(4, Math.floor(availableHeight / spacing));
          const cols = rows * 2; // El doble de columnas que filas
          
          return {
            rows,
            cols,
            spacing,
            margin
          };
        }
        
        case 'custom': {
          if (!customRatio || customRatio.width <= 0 || customRatio.height <= 0) {
            return {
              rows: 12,
              cols: 18,
              spacing,
              margin
            };
          }
          
          // Usar la proporción personalizada
          const ratio = customRatio.width / customRatio.height;
          
          // Similar a otros casos, ajustar según el espacio disponible
          let cols = Math.floor(availableWidth / spacing);
          let rows = Math.floor(cols / ratio);
          
          if (rows * spacing > availableHeight) {
            rows = Math.floor(availableHeight / spacing);
            cols = Math.floor(rows * ratio);
          }
          
          return {
            rows: Math.max(3, rows),
            cols: Math.max(3, cols),
            spacing,
            margin
          };
        }
        
        default:
          return {
            rows: 10,
            cols: 15,
            spacing,
            margin
          };
      }
    },
    []
  );

  /**
   * Detecta qué aspect ratio estándar es más cercano a la configuración 
   * de cuadrícula actual
   */
  const detectAspectRatioFromGrid = useCallback(
    (grid: GridSettings): {aspectRatio: AspectRatioOption; confidence: number} => {
      const { rows, cols } = grid;
      
      if (!rows || !cols || rows <= 0 || cols <= 0) {
        return { aspectRatio: 'auto', confidence: 1 };
      }
      
      const currentRatio = cols / rows;
      
      // Definir proporciones estándar
      const standardRatios: Record<AspectRatioOption, AspectRatioData> = {
        'auto': { ratio: currentRatio, name: 'Auto' },
        '1:1': { ratio: 1, name: '1:1' },
        '2:1': { ratio: 2, name: '2:1' },
        '16:9': { ratio: 16/9, name: '16:9' },
        'custom': { ratio: currentRatio, name: 'Custom' }
      };
      
      // Encontrar el más cercano
      let closestRatio: AspectRatioOption = 'custom';
      let minDifference = Infinity;
      
      Object.entries(standardRatios).forEach(([key, data]) => {
        if (key === 'auto' || key === 'custom') return;
        
        const difference = Math.abs(currentRatio - data.ratio);
        if (difference < minDifference) {
          minDifference = difference;
          closestRatio = key as AspectRatioOption;
        }
      });
      
      // Calculamos una puntuación de confianza del 0 al 1
      // Donde 1 es coincidencia exacta y 0 es muy diferente
      const maxDifference = 1; // Diferencia máxima significativa
      const confidence = Math.max(0, 1 - (minDifference / maxDifference));
      
      // Si la confianza es muy alta, devolvemos ese ratio, sino, custom
      return {
        aspectRatio: confidence > 0.9 ? closestRatio : 'custom',
        confidence
      };
    },
    []
  );

  return {
    calculateOptimalGrid,
    detectAspectRatioFromGrid
  };
}
