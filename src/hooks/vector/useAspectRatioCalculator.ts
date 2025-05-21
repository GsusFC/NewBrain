import { useCallback } from 'react';
import { AspectRatioOption, GridSettings, CalculatorOptions } from '@/components/vector/controls/grid/types';

/**
 * Constantes configurables para cálculos de cuadrícula
 * 
 * Estas constantes definen los valores límite y predeterminados utilizados
 * en todos los cálculos relacionados con el grid de vectores.
 */
const GRID_CONSTANTS = {
  /** Número mínimo de filas para cualquier grid */
  MIN_ROWS: 3,
  /** Número mínimo de columnas para cualquier grid */
  MIN_COLS: 3,
  /** Número recomendado de filas base (usado cuando no hay constraints específicos) */
  RECOMMENDED_ROWS: 6,
  /** Ancho y alto predeterminados para contenedor (cuando no se especifica) */
  DEFAULT_CONTAINER_SIZE: 500,
  /** Espaciado predeterminado entre elementos de la grid */
  DEFAULT_SPACING: 30,
  /** Margen predeterminado alrededor de la grid */
  DEFAULT_MARGIN: 20,
  /** Padding predeterminado interno (nuevo) */
  DEFAULT_PADDING: 0,
  /** Diferencia máxima significativa para cálculo de confianza en detección de ratio */
  MAX_RATIO_DIFFERENCE: 1.0,
  /** Nivel de confianza mínimo para considerar que un ratio detectado coincide con un estándar */
  MIN_CONFIDENCE_THRESHOLD: 0.9
};

/**
 * Calcula el número óptimo de filas y columnas para un ratio personalizado,
 * maximizando el uso del espacio disponible y respetando spacing, margen y padding.
 *
 * @param containerWidth - Ancho del contenedor
 * @param containerHeight - Alto del contenedor
 * @param spacing - Espaciado entre elementos
 * @param margin - Margen exterior
 * @param ratio - Proporción ancho/alto a mantener
 * @param minRows - Mínimo número de filas permitido
 * @param minCols - Mínimo número de columnas permitido
 * @param padding - Padding interno adicional (opcional)
 * @returns Objeto con número óptimo de filas y columnas
 */
function calculateCustomGrid(
  containerWidth: number,
  containerHeight: number,
  spacing: number,
  margin: number,
  ratio: number, // ancho/alto
  minRows = GRID_CONSTANTS.MIN_ROWS,
  minCols = GRID_CONSTANTS.MIN_COLS,
  padding = GRID_CONSTANTS.DEFAULT_PADDING
): { rows: number; cols: number } {
  // Crear variables seguras para trabajar (evitar mutación de parámetros)
  let safeW = containerWidth;
  let safeH = containerHeight;
  let safeSpacing = spacing;
  let safeMargin = margin;
  let safeRatio = ratio;
  let safePadding = padding;

  // Validación de parámetros
  if (safeW <= 0 || safeH <= 0 || safeSpacing <= 0 || safeMargin < 0 || safeRatio <= 0 || safePadding < 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[calculateCustomGrid] Valores de entrada no válidos:', 
        { containerWidth, containerHeight, spacing, margin, ratio, padding }, 'Usando valores seguros.');
    }
    safeW       = Math.max(1, safeW);
    safeH       = Math.max(1, safeH);
    safeSpacing = Math.max(1, safeSpacing);
    safeMargin  = Math.max(0, safeMargin);
    safeRatio   = Math.max(0.1, safeRatio);
    safePadding = Math.max(0, safePadding);
  }

  // Descuenta tanto el margen exterior como el padding interno
  const availableWidth = safeW - safeMargin * 2 - safePadding * 2;
  const availableHeight = safeH - safeMargin * 2 - safePadding * 2;

  // Intentar primero ajustando por ancho disponible
  let cols = Math.floor(availableWidth / safeSpacing);
  let rows = Math.floor(cols / safeRatio);

  // Si las filas no caben en altura, ajustar por altura
  if (rows * safeSpacing > availableHeight) {
    rows = Math.floor(availableHeight / safeSpacing);
    cols = Math.floor(rows * safeRatio);
    
    // 🔁 Asegurar que el ancho también cabe (validación secundaria)
    // Esto previene desbordamiento en contenedores altos y estrechos
    if (cols * safeSpacing > availableWidth) {
      cols = Math.floor(availableWidth / safeSpacing);
      rows = Math.floor(cols / safeRatio);
    }
  }

  return {
    rows: Math.max(minRows, rows),
    cols: Math.max(minCols, cols)
  };
}

/**
 * Datos de ratio de aspecto, incluyendo valor numérico y nombre descriptivo
 */
interface AspectRatioData {
  /** Valor numérico del ratio (ancho/alto) */
  ratio: number;
  /** Nombre descriptivo del ratio */
  name: string;
  /** Metadatos adicionales (opcionales) */
  metadata?: {
    /** Indica si este ratio es una versión optimizada para UI y no exacta */
    isOptimizedForUI?: boolean;
    /** Valor exacto del ratio, si isOptimizedForUI es true */
    exactRatio?: number;
    /** Descripción del uso típico de este ratio */
    description?: string;
  };
}

/**
 * Resultado de la detección de aspect ratio
 */
interface AspectRatioDetectionResult {
  /** Ratio de aspecto detectado */
  aspectRatio: AspectRatioOption;
  /** Nivel de confianza (0-1) donde 1 es coincidencia exacta */
  confidence: number;
  /** Nombre descriptivo del ratio */
  name: string;
}

/**
 * Hook que proporciona utilidades para cálculos de aspect ratio en grids
 * 
 * Permite:
 * - Calcular dimensiones óptimas basadas en aspect ratios
 * - Detectar el aspect ratio que mejor se ajusta a una configuración existente
 * - Convertir entre diferentes formatos de aspect ratio
 * 
 * @returns Objeto con funciones de utilidad para cálculos de aspect ratio
 */
export function useAspectRatioCalculator() {
  /**
   * Función auxiliar para obtener los valores numéricos de un ratio de aspecto
   * 
   * NOTA IMPORTANTE: Para '16:9', devolvemos un ratio MODIFICADO (22:9 = 2.44:1) 
   * en lugar del matemáticamente exacto (16:9 = 1.77:1). Esto proporciona mejor
   * experiencia visual al tener más columnas manteniendo una apariencia similar.
   * 
   * @param ratio - El tipo de aspect ratio deseado
   * @param customRatio - Valores personalizados para cuando ratio es 'custom'
   * @returns Tupla con [ancho, alto] que representa el ratio
   */
  const getAspectRatioValues = useCallback(
    (ratio: AspectRatioOption, customRatio?: { width: number; height: number }): [number, number] => {
      switch (ratio) {
        case '1:1':
          return [1, 1];
        case '16:9':
          // ¡IMPORTANTE! - Valor MODIFICADO para optimización visual
          // En lugar del exacto 16:9 (1.77:1), usamos 22:9 (2.44:1)
          // Esto proporciona ~6-8 columnas más mientras mantiene apariencia widescreen
          // Si necesitas el valor exacto 16:9 para cálculos precisos, usa getExactAspectRatioValues
          return [22, 9];
        case '2:1':
          return [2, 1];
        case 'auto':
          // Let the caller know there is no fixed ratio
          return [0, 0]; // Indica "libre" o sin restricción de ratio
        case 'custom':
          // Validar el customRatio
          if (!customRatio) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useAspectRatioCalculator] customRatio no definido con modo "custom". Usando 16:9 como fallback.');
            }
            return [16, 9];
          }
          
          // Validar que width y height sean positivos
          if (customRatio.width <= 0 || customRatio.height <= 0) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useAspectRatioCalculator] customRatio contiene valores no positivos. Usando valores absolutos.');
            }
            // Usar valores absolutos como fallback seguro
            return [Math.abs(customRatio.width) || 1, Math.abs(customRatio.height) || 1];
          }
          
          return [customRatio.width, customRatio.height];
        default:
          return [16, 9];
      }
    },
    []
  );

  /**
   * Obtiene los valores exactos matemáticos (no modificados para UI) de un ratio de aspecto
   * 
   * A diferencia de getAspectRatioValues, esta función devuelve valores matemáticamente precisos
   * sin optimizaciones visuales. Útil para cálculos que requieren precisión matemática.
   * 
   * @param ratio - El tipo de aspect ratio deseado
   * @param customRatio - Valores personalizados para cuando ratio es 'custom'
   * @returns Tupla con [ancho, alto] que representa el ratio exacto
   */
  const getExactAspectRatioValues = useCallback(
    (ratio: AspectRatioOption, customRatio?: { width: number; height: number }): [number, number] => {
      switch (ratio) {
        case '1:1':
          return [1, 1];
        case '16:9':
          // Valor exacto matemático de 16:9
          return [16, 9];
        case '2:1':
          return [2, 1];
        case 'custom':
          // Misma validación que en getAspectRatioValues
          if (!customRatio) return [16, 9];
          if (customRatio.width <= 0 || customRatio.height <= 0) {
            return [Math.abs(customRatio.width) || 1, Math.abs(customRatio.height) || 1];
          }
          return [customRatio.width, customRatio.height];
        default:
          return [16, 9];
      }
    },
    []
  );
  
  /**
   * Calcula el número de columnas necesarias para mantener un ratio de aspecto basado en filas
   * 
   * @param rows - Número de filas
   * @param aspectRatio - Tipo de aspect ratio
   * @param customRatio - Valores personalizados para cuando aspectRatio es 'custom'
   * @returns Número de columnas calculado
   */
  const calculateColumnsFromRows = useCallback(
    (rows: number, aspectRatio: AspectRatioOption, customRatio?: { width: number; height: number }): number => {
      // Validar que rows sea positivo
      if (rows <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useAspectRatioCalculator] Se intentó calcular con filas <= 0. Usando 1 como mínimo.');
        }
        rows = Math.max(1, rows); // Asegurar valor positivo
      }
      
      const [width, height] = getAspectRatioValues(aspectRatio, customRatio);
      
      // Evitar división por cero o valores inválidos
      if (width === 0 || height === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useAspectRatioCalculator] Se intentó calcular con ancho o alto igual a 0. Usando valor por defecto.');
        }
        return rows; // Devolver el mismo número de filas como columnas por defecto
      }
      
      const aspectRatioValue = width / height;
      
      // Calcular columnas para mantener proporción y redondear para evitar números con decimales
      return Math.round(rows * aspectRatioValue);
    },
    [getAspectRatioValues]
  );
  
  /**
   * Calcula el número de filas necesarias para mantener un ratio de aspecto basado en columnas
   * 
   * @param cols - Número de columnas
   * @param aspectRatio - Tipo de aspect ratio
   * @param customRatio - Valores personalizados para cuando aspectRatio es 'custom'
   * @returns Número de filas calculado
   */
  const calculateRowsFromColumns = useCallback(
    (cols: number, aspectRatio: AspectRatioOption, customRatio?: { width: number; height: number }): number => {
      // Validar que cols sea positivo
      if (cols <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useAspectRatioProvider] Se intentó calcular con columnas <= 0. Usando 1 como mínimo.');
        }
        cols = Math.max(1, cols); // Asegurar valor positivo
      }
      
      const [width, height] = getAspectRatioValues(aspectRatio, customRatio);
      
      // Evitar división por cero o valores inválidos
      if (width === 0 || height === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useAspectRatioProvider] Se intentó calcular con ancho o alto igual a 0. Usando valor por defecto.');
        }
        return cols; // Devolver el mismo número de columnas como filas por defecto
      }
      
      const aspectRatioValue = width / height;
      
      // Evitar división por cero (aunque ya está validado, es una precaución adicional)
      if (aspectRatioValue === 0) {
        return cols;
      }
      
      // Calcular filas para mantener proporción y redondear para evitar números con decimales
      return Math.round(cols / aspectRatioValue);
    },
    [getAspectRatioValues]
  );
  
  /**
   * Calcula la configuración óptima de la cuadrícula basada en el aspect ratio seleccionado
   * 
   * @param aspectRatio - Tipo de aspect ratio
   * @param customRatio - Valores personalizados para cuando aspectRatio es 'custom'
   * @param options - Opciones adicionales para el cálculo
   * @returns Configuración óptima de la cuadrícula
   */


  /**
   * Calcula la configuración óptima de la cuadrícula basada en el aspect ratio seleccionado
   * 
   * @param aspectRatio - Tipo de aspect ratio
   * @param customRatio - Valores personalizados para cuando aspectRatio es 'custom'
   * @param options - Opciones adicionales para el cálculo
   * @returns Configuración óptima de la cuadrícula
   */
  const calculateOptimalGrid = useCallback(
    (aspectRatio: AspectRatioOption, customRatio: {width: number; height: number} | undefined, options: CalculatorOptions = {}): GridSettings => {
      // Valores predeterminados para los parámetros opcionales usando las constantes
      const { 
        containerWidth = GRID_CONSTANTS.DEFAULT_CONTAINER_SIZE, 
        containerHeight = GRID_CONSTANTS.DEFAULT_CONTAINER_SIZE, 
        spacing = GRID_CONSTANTS.DEFAULT_SPACING, 
        margin = GRID_CONSTANTS.DEFAULT_MARGIN,
        padding = GRID_CONSTANTS.DEFAULT_PADDING, // padding interno opcional
        baseRows: optionsBaseRows 
      } = options;
      
      // Validación de customRatio
      if (aspectRatio === 'custom' && customRatio) {
        if (!customRatio.width || !customRatio.height || customRatio.width <= 0 || customRatio.height <= 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useAspectRatioCalculator] Custom ratio inválido:',
              customRatio, 'Usando valores seguros.');
          }
          // Fallback seguro: usar proporción estándar
          customRatio = { width: 16, height: 9 };
        }
      }

      // Asegurar valores positivos
      const safeContainerWidth = Math.max(1, containerWidth);
      const safeContainerHeight = Math.max(1, containerHeight);
      const safeSpacing = Math.max(1, spacing);
      const safeMargin = Math.max(0, margin);
      const safePadding = Math.max(0, padding);
      
      // Determinar si estamos usando filas explícitas o modo automático
      const usingExplicitRows = optionsBaseRows !== undefined;
      
      // Para el caso de custom con dimensiones específicas, usamos una lógica diferente
      if (aspectRatio === 'custom' && customRatio && !usingExplicitRows) {
        // Usar la función auxiliar calculateCustomGrid
        const ratio = customRatio.width / customRatio.height;
        const { rows, cols } = calculateCustomGrid(
          safeContainerWidth,
          safeContainerHeight,
          safeSpacing,
          safeMargin,
          ratio,
          GRID_CONSTANTS.MIN_ROWS,
          GRID_CONSTANTS.MIN_COLS,
          safePadding
        );
        
        return {
          rows,
          cols,
          spacing: safeSpacing,
          margin: safeMargin
        };
      }
      
      // Si se especifican filas explícitamente
      if (usingExplicitRows) {
        // Determinar baseRows
        const baseRows = Math.max(GRID_CONSTANTS.MIN_ROWS, optionsBaseRows ?? GRID_CONSTANTS.RECOMMENDED_ROWS);
        
        // Calcular columnas basadas en las filas y el ratio
        const [width, height] = getAspectRatioValues(aspectRatio, customRatio);
        
        // Manejar el caso especial de 'auto' (que devuelve [0, 0])
        if (width === 0 && height === 0) {
          // Para modo 'auto', usar el ratio del contenedor disponible
          const containerRatio = safeContainerWidth / safeContainerHeight;
          const cols = Math.round(baseRows * containerRatio);
          return {
            rows: baseRows,
            cols: Math.max(GRID_CONSTANTS.MIN_COLS, cols),
            spacing: safeSpacing,
            margin: safeMargin
          };
        }
        
        const aspectRatioValue = width / height;
        const cols = Math.round(baseRows * aspectRatioValue);
        
        return {
          rows: baseRows,
          cols: Math.max(GRID_CONSTANTS.MIN_COLS, cols),
          spacing: safeSpacing,
          margin: safeMargin
        };
      } else {
        // Modo automático: calcular filas y columnas óptimas según el espacio disponible
        const [width, height] = getAspectRatioValues(aspectRatio, customRatio);
        
        // Manejar el caso especial de 'auto' (que devuelve [0, 0])
        if (width === 0 && height === 0) {
          // Para 'auto', maximizar el uso del espacio disponible según las proporciones del contenedor
          // En este caso dejamos que calculateCustomGrid determine las filas/columnas basado en el espacio
          // disponible sin forzar ningún ratio específico
          
          // Proporción natural del contenedor
          const containerRatio = safeContainerWidth / safeContainerHeight;
          
          // Utilizar esta proporción para el cálculo
          const { rows, cols } = calculateCustomGrid(
            safeContainerWidth,
            safeContainerHeight,
            safeSpacing,
            safeMargin,
            containerRatio,
            GRID_CONSTANTS.MIN_ROWS,
            GRID_CONSTANTS.MIN_COLS,
            safePadding
          );
          
          return {
            rows,
            cols,
            spacing: safeSpacing,
            margin: safeMargin
          };
        }
        
        const aspectRatioValue = width / height;
        
        // Utilizar calculateCustomGrid también para ratios estándar
        const { rows, cols } = calculateCustomGrid(
          safeContainerWidth,
          safeContainerHeight,
          safeSpacing,
          safeMargin,
          aspectRatioValue,
          GRID_CONSTANTS.MIN_ROWS,
          GRID_CONSTANTS.MIN_COLS,
          safePadding
        );
        
        return {
          rows,
          cols,
          spacing: safeSpacing,
          margin: safeMargin
        };
      }
    },
    [getAspectRatioValues]
  );

  /**
   * Detecta qué aspect ratio estándar es más cercano a la configuración 
   * de cuadrícula actual
   * 
   * @param grid - Configuración actual de la cuadrícula
   * @returns Información sobre el aspect ratio detectado, incluyendo confianza y nombre
   */
  const detectAspectRatioFromGrid = useCallback(
    (grid: GridSettings): AspectRatioDetectionResult => {
      const { rows, cols } = grid;
      
      // Validar la grid
      if (!rows || !cols || rows <= 0 || cols <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useAspectRatioCalculator] Grid inválida para detección:', 
            grid, 'Devolviendo 16:9 por defecto.');
        }
        return { 
          aspectRatio: '16:9', 
          confidence: 1,
          name: '16:9'
        };
      }
      
      const currentRatio = cols / rows;
      
      // Definir proporciones estándar con metadatos completos
      const standardRatios: Record<string, AspectRatioData> = {
        '1:1': { 
          ratio: 1, 
          name: '1:1',
          metadata: {
            description: 'Cuadrado perfecto, ideal para logos e iconos'
          }
        },
        '2:1': { 
          ratio: 2, 
          name: '2:1',
          metadata: {
            description: 'Formato panorámico, ideal para banners horizontales'
          }
        },
        '16:9': { 
          ratio: 22/9, // Usando el mismo valor optimizado que getAspectRatioValues
          name: '16:9',
          metadata: {
            isOptimizedForUI: true,
            exactRatio: 16/9,
            description: 'Estándar para pantallas widescreen y vídeo HD (usando valor optimizado 22:9)'
          }
        },
        'custom': { 
          ratio: currentRatio, 
          name: 'Personalizado',
          metadata: {
            description: 'Formato personalizado, no coincide con estándares comunes'
          }
        }
      };
      
      // Encontrar el más cercano
      let closestRatio: AspectRatioOption = 'custom';
      let closestName = 'Personalizado';
      let minDifference = Infinity;
      
      Object.entries(standardRatios).forEach(([key, data]) => {
        if (key === 'custom') return;
        
        const difference = Math.abs(currentRatio - data.ratio);
        if (difference < minDifference) {
          minDifference = difference;
          closestRatio = key as AspectRatioOption;
          closestName = data.name;
          // Si necesitamos usar los metadatos en el futuro, ya tenemos la referencia
        }
      });
      
      // Calculamos una puntuación de confianza del 0 al 1
      // Donde 1 es coincidencia exacta y 0 es muy diferente
      const confidence = Math.max(0, 1 - (minDifference / GRID_CONSTANTS.MAX_RATIO_DIFFERENCE));
      
      // Si la confianza es muy alta, devolvemos ese ratio, sino, custom
      const finalRatio = confidence > GRID_CONSTANTS.MIN_CONFIDENCE_THRESHOLD ? closestRatio : 'custom';
      const finalName = confidence > GRID_CONSTANTS.MIN_CONFIDENCE_THRESHOLD ? closestName : 'Personalizado';
      
      return {
        aspectRatio: finalRatio,
        confidence,
        name: finalName
        // En el futuro podríamos añadir los metadatos si fueran útiles para la UI
      };
    },
    []
  );

  return {
    // Funciones principales
    calculateOptimalGrid,
    calculateColumnsFromRows,
    calculateRowsFromColumns,
    detectAspectRatioFromGrid,
    
    // Funciones de utilidad
    getAspectRatioValues,
    getExactAspectRatioValues,
    
    // Constantes para uso externo
    constants: GRID_CONSTANTS,
    
    // Nueva propiedad que expone calculateCustomGrid para uso directo en componentes
    calculateCustomGrid
  };
}
