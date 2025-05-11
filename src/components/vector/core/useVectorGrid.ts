import { useMemo } from 'react';
import type { 
  AnimatedVectorItem,
  GridSettings,       
  UseVectorGridProps, 
  UseVectorGridReturn,
  VectorSettings, 
  VectorShape,
} from './types'; 

const DEFAULT_SPACING = 30; 
const DEFAULT_MARGIN = 0;   
const DEFAULT_VECTORS_PER_FLOCK = 10; 
const DEFAULT_VECTOR_LENGTH = 20; // Añadir una longitud de vector por defecto

/**
 * @hook useVectorGrid
 * @description Calcula la disposición inicial de los vectores en la cuadrícula.
 *
 * Este hook toma las dimensiones del contenedor, la configuración de la cuadrícula
 * (filas, columnas, espaciado, margen, aspect ratio) y la configuración visual
 * base de los vectores para generar un array de `AnimatedVectorItem`.
 *
 * La lógica prioriza las `rows` y `cols` si son proporcionadas. Si no,
 * calcula la disposición basándose en el `spacing` para llenar el espacio disponible,
 * ajustando el espaciado final para asegurar un encaje óptimo y respetando
 * el `aspectRatio` cuando sea aplicable.
 *
 * @param {UseVectorGridProps} props - Propiedades del hook.
 * @returns {UseVectorGridReturn} - Objeto con los vectores iniciales y dimensiones calculadas de la cuadrícula.
 */
export const useVectorGrid = ({
  dimensions,
  gridSettings,
  vectorSettings,
  debugMode = false // Aceptar y usar debugMode, con valor por defecto false
}: UseVectorGridProps): UseVectorGridReturn => {
  const result = useMemo(() => {
    const { width, height } = dimensions;

    const {
      rows: desiredRows,
      cols: desiredCols,
      spacing,
      margin = DEFAULT_MARGIN,
      aspectRatio = 'auto',
      vectorsPerFlock = DEFAULT_VECTORS_PER_FLOCK,
    } = gridSettings;

    if (debugMode) {
      console.log('[useVectorGrid] Received dimensions:', dimensions);
      console.log('[useVectorGrid] Received gridSettings:', { desiredRows, desiredCols, spacing, margin, aspectRatio, vectorsPerFlock });
    }

    const {
        vectorShape = 'line' as VectorShape, 
        initialRotation = 0,
    } = vectorSettings;

    if (width === 0 || height === 0) {
      return { initialVectors: [], calculatedCols: 0, calculatedRows: 0, calculatedGridWidth: 0, calculatedGridHeight: 0 };
    }

    const finalMargin = typeof margin === 'number' ? margin : DEFAULT_MARGIN;
  
    // El área disponible es dentro de los márgenes del contenedor
    let availableWidth = dimensions.width - 2 * finalMargin;
    let availableHeight = dimensions.height - 2 * finalMargin;

    if (availableWidth <= 0) {
      if (debugMode) console.warn('[useVectorGrid] availableWidth is zero or negative after applying margins. Using dimensions.width.');
      availableWidth = dimensions.width; // Fallback a las dimensiones completas si el margen es demasiado grande
    }
    if (availableHeight <= 0) {
      if (debugMode) console.warn('[useVectorGrid] availableHeight is zero or negative after applying margins. Using dimensions.height.');
      availableHeight = dimensions.height; // Fallback
    }

    let actualRows: number;
    let actualCols: number;
    let adjustedSpacing: number = spacing ?? DEFAULT_SPACING; // Usar el spacing provisto o el default

    // Manejo mejorado del aspectRatio
    // Aseguramos que gridAspectRatio sea siempre un número
    const gridAspectRatio = aspectRatio === 'auto' 
      ? (availableWidth / availableHeight) 
      : (typeof aspectRatio === 'number' ? aspectRatio : 1.5); // Valor por defecto si no es válido

    if (desiredRows && desiredRows > 0) {
        actualRows = desiredRows;
        if (desiredCols && desiredCols > 0) {
            actualCols = desiredCols;
            if (debugMode) {
              console.log('[useVectorGrid] Case 1: desiredRows y desiredCols definidos. actualRows:', actualRows, 'actualCols:', actualCols);
            }
            
            // Aseguramos que respetamos proporciones y aprovechamos el espacio disponible
            const idealAspectRatio = actualCols / actualRows;
            const containerAspectRatio = availableWidth / availableHeight;
            
            // Ajustamos spacing para optimizar el uso del contenedor manteniendo proporción
            if (containerAspectRatio > idealAspectRatio) {
                // El contenedor es más ancho que la proporción ideal -> ajustar por altura
                adjustedSpacing = availableHeight / actualRows;
            } else {
                // El contenedor es más alto o igual a la proporción ideal -> ajustar por ancho
                adjustedSpacing = availableWidth / actualCols;
            }
            
            if (debugMode) {
                console.log('[useVectorGrid] Proporciones - ideal:', idealAspectRatio, 'contenedor:', containerAspectRatio);
            }
        } else {
            // Solo se definió número de filas, calculamos columnas basado en el aspectRatio
            actualCols = Math.max(1, Math.round(actualRows * gridAspectRatio));
            adjustedSpacing = Math.min(availableWidth / actualCols, availableHeight / actualRows);
            
            if (debugMode) {
              console.log('[useVectorGrid] Case 2: Solo desiredRows definido. actualRows:', actualRows, 'Calculado actualCols:', actualCols, 'usando gridAspectRatio:', gridAspectRatio);
            }
        }
    } else if (desiredCols && desiredCols > 0) {
        actualCols = desiredCols;
        // Calculamos filas basado en el aspectRatio
        actualRows = Math.max(1, Math.round(actualCols / gridAspectRatio));
        adjustedSpacing = Math.min(availableWidth / actualCols, availableHeight / actualRows);
        if (debugMode) {
          console.log('[useVectorGrid] Case 3: Only desiredCols provided. actualCols:', actualCols, 'Calculated actualRows:', actualRows, 'using adjustedSpacing:', adjustedSpacing);
        }
    } else {
        actualCols = Math.max(1, Math.floor(availableWidth / adjustedSpacing));
        actualRows = Math.max(1, Math.floor(availableHeight / adjustedSpacing));
        if (debugMode) {
          console.log('[useVectorGrid] Case 4: Neither rows/cols provided. Calculated actualCols:', actualCols, 'Calculated actualRows:', actualRows, 'using adjustedSpacing:', adjustedSpacing);
        }
    }

    actualCols = Math.max(1, Math.floor(actualCols));
    actualRows = Math.max(1, Math.floor(actualRows));
    
    // Redondear el spacing a 2 decimales para tener valores más limpios
    adjustedSpacing = Math.round(adjustedSpacing * 100) / 100;
    
    if (debugMode) {
      console.log('[useVectorGrid] Before rounding - actualCols:', actualCols, 'actualRows:', actualRows);
      console.log('[useVectorGrid] After rounding - actualCols:', actualCols, 'actualRows:', actualRows, 'final adjustedSpacing:', adjustedSpacing);
    }

    const calculatedGridWidth = actualCols * adjustedSpacing;
    const calculatedGridHeight = actualRows * adjustedSpacing;

    // Cálculo mejorado para centrado perfecto
    // Calculamos el espacio sobrante después de considerar el grid completo
    const extraWidthSpace = width - calculatedGridWidth;
    const extraHeightSpace = height - calculatedGridHeight;
    
    // Distribuimos el espacio extra uniformemente en ambos lados
    // Y añadimos la mitad del espaciado para centrar el primer vector
    const finalOffsetX = Math.max(finalMargin, extraWidthSpace / 2) + (adjustedSpacing / 2);
    const finalOffsetY = Math.max(finalMargin, extraHeightSpace / 2) + (adjustedSpacing / 2);

    if (debugMode) {
      console.log('[useVectorGrid] SVG dimensions:', { width, height });
      console.log('[useVectorGrid] Area for vectors (after margin):', { availableWidth, availableHeight });
      console.log('[useVectorGrid] Calculated content dimensions:', { calculatedGridWidth, calculatedGridHeight });
      console.log('[useVectorGrid] Offsets for first vector (0,0) center:', { finalOffsetX, finalOffsetY });
    }

    // Verificación para evitar valores extremos que podrían causar problemas
    const safeAdjustedSpacing = Math.min(
      Math.max(10, adjustedSpacing), // Mínimo 10px de espaciado
      Math.min(availableWidth / 2, availableHeight / 2) // Evitar que ocupen más del 50% del contenedor
    );

    // Validación adicional para evitar generación masiva de vectores
    const safeRows = Math.min(actualRows, 50); // Máximo 50 filas (seguridad)
    const safeCols = Math.min(actualCols, 50); // Máximo 50 columnas (seguridad)

    if (debugMode && (safeRows < actualRows || safeCols < actualCols)) {
      console.warn(`[useVectorGrid] Limitando grid de ${actualRows}x${actualCols} a ${safeRows}x${safeCols} para prevenir problemas de rendimiento`);
    }

    // Generamos los vectores con distribución optimizada usando memoización
    const initialVectors: AnimatedVectorItem[] = [];

    for (let row = 0; row < safeRows; row++) {
      for (let col = 0; col < safeCols; col++) {
        // Calculamos posición con distribución óptima
        const x = finalOffsetX + (col * safeAdjustedSpacing);
        const y = finalOffsetY + (row * safeAdjustedSpacing);

        // Verificación para asegurar que el vector esté dentro del área visible
        const isWithinBounds = 
          x >= 0 && 
          x <= width && 
          y >= 0 && 
          y <= height;

        if (isWithinBounds) {
          const initialAngle = typeof initialRotation === 'function'
            ? initialRotation({ r: row, c: col } as AnimatedVectorItem)
            : initialRotation;

          initialVectors.push({
            id: `vector-${row}-${col}`,
            r: row, 
            c: col, 
            baseX: x, 
            baseY: y,
            initialAngle, 
            currentAngle: initialAngle,
            lengthFactor: 1.0, 
            widthFactor: 1.0,
            previousAngle: initialAngle, 
            targetAngle: initialAngle,
            animationState: {},
            flockId: Math.floor(row * safeCols + col / (vectorsPerFlock > 0 ? vectorsPerFlock : 1)),
            customData: null,
          });
        }
      }
    }
    
    if (debugMode) {
      console.log(`[useVectorGrid] Generados ${initialVectors.length} vectores de ${safeRows * safeCols} posibles`);
    }

    return {
      initialVectors,
      calculatedCols: actualCols,
      calculatedRows: actualRows,
      calculatedGridWidth, 
      calculatedGridHeight, 
    };
  }, [dimensions, gridSettings, vectorSettings, debugMode]);

  return result;
};