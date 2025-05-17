import { useMemo } from 'react';
import { AnimatedVectorItem, GridSettings, VectorSettings, VectorShape } from './types';

const DEFAULT_SPACING = 50;
const DEFAULT_MARGIN = 0;   
const DEFAULT_VECTORS_PER_FLOCK = 10; 
const DEFAULT_VECTOR_LENGTH = 20; // Añadir una longitud de vector por defecto
const MIN_GRID_SIZE = 1; // Mínimo de filas/columnas a renderizar
const WARN_SPACING_RATIO = 0.8; // Porcentaje del espacio que debe ocupar el espaciado máximo

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

    // Validación temprana de dimensiones
    if (width <= 0 || height <= 0) {
      if (debugMode) {
        console.warn('[useVectorGrid] Dimensiones inválidas:', { width, height });
      }
      return { 
        initialVectors: [], 
        calculatedCols: 0, 
        calculatedRows: 0, 
        calculatedGridWidth: 0, 
        calculatedGridHeight: 0 
      };
    }

    // Configuración con valores por defecto
    const {
      rows: desiredRows = 0,
      cols: desiredCols = 0,
      spacing = DEFAULT_SPACING,
      margin = DEFAULT_MARGIN,
      aspectRatio = 'auto',
      vectorsPerFlock = DEFAULT_VECTORS_PER_FLOCK,
    } = gridSettings;

    // Debug: Mostrar configuración recibida
    if (debugMode) {
      console.groupCollapsed('[useVectorGrid] Configuración inicial');
      console.log('Dimensiones:', { width, height });
      console.log('Grid Settings:', { desiredRows, desiredCols, spacing, margin, aspectRatio });
      console.log('Vector Settings:', vectorSettings);
      console.groupEnd();
    }

    const {
        vectorShape = 'line' as VectorShape, 
        initialRotation = 0,
    } = vectorSettings;

    if (width === 0 || height === 0) {
      if (debugMode) {
        console.warn('[useVectorGrid] Dimensiones inválidas:', { width, height });
      }
      return { initialVectors: [], calculatedCols: 0, calculatedRows: 0, calculatedGridWidth: 0, calculatedGridHeight: 0 };
    }

    // Validar márgenes y espaciado
    const safeMargin = Math.max(0, margin);
    const safeSpacing = Math.max(1, spacing);
  
    // Calcular espacio disponible después de márgenes
    const availableWidth = Math.max(1, width - 2 * safeMargin);
    const availableHeight = Math.max(1, height - 2 * safeMargin);

    // Inicializar variables para filas, columnas, espaciado y dimensiones
    let actualRows = 1;
    let actualCols = 1;
    let calculatedGridWidth = 0;
    let calculatedGridHeight = 0;
    let adjustedSpacing = spacing ?? DEFAULT_SPACING;

    // Calcular el aspect ratio basado en la configuración
    const getAspectRatio = (): number => {
      if (aspectRatio === 'auto') return availableWidth / availableHeight;
      if (aspectRatio === '16:9') return 16 / 9;
      if (aspectRatio === '2:1') return 2;
      if (aspectRatio === '1:1') return 1;
      if (aspectRatio === 'custom' && gridSettings.customAspectRatio) {
        return gridSettings.customAspectRatio.width / gridSettings.customAspectRatio.height;
      }
      return availableWidth / availableHeight; // Valor por defecto basado en el contenedor
    };

    const gridAspectRatio = getAspectRatio();
    
    // Variables para almacenar las dimensiones finales de la cuadrícula
    // calculatedGridWidth se declarará más adelante
    // actualCols y actualRows ya están declarados al inicio de la función
    
    // Calcular el espaciado basado en la configuración
    if (desiredRows > 0 && desiredCols > 0) {
        // Caso 1: Se especifican tanto filas como columnas
        actualRows = Math.max(1, desiredRows);
        actualCols = Math.max(1, desiredCols);
        
        // Ajustar el espaciado para llenar el espacio disponible
        const spacingByWidth = availableWidth / actualCols;
        const spacingByHeight = availableHeight / actualRows;
        adjustedSpacing = Math.min(spacingByWidth, spacingByHeight) * WARN_SPACING_RATIO;
        
        if (debugMode) {
            console.log('[useVectorGrid] Caso 1: Filas y columnas definidas:', 
                { actualRows, actualCols, adjustedSpacing });
        }
    } else if (desiredRows > 0) {
        // Caso 2: Solo se especifica el número de filas
        actualRows = Math.max(1, desiredRows);
        actualCols = Math.max(1, Math.round(actualRows * gridAspectRatio));
        
        // Ajustar el espaciado
        adjustedSpacing = Math.min(
            availableWidth / actualCols,
            availableHeight / actualRows
        ) * WARN_SPACING_RATIO;
        
        if (debugMode) {
            console.log('[useVectorGrid] Caso 2: Solo filas definidas:', 
                { actualRows, actualCols, adjustedSpacing, gridAspectRatio });
        }
    } else if (desiredCols > 0) {
        // Caso 3: Solo se especifica el número de columnas
        actualCols = Math.max(1, desiredCols);
        actualRows = Math.max(1, Math.round(actualCols / gridAspectRatio));
        
        // Ajustar el espaciado
        adjustedSpacing = Math.min(
            availableWidth / actualCols,
            availableHeight / actualRows
        ) * WARN_SPACING_RATIO;
        
        if (debugMode) {
            console.log('[useVectorGrid] Caso 3: Solo columnas definidas:', 
                { actualRows, actualCols, adjustedSpacing, gridAspectRatio });
        }
    } else {
        // Caso 4: No se especifican filas ni columnas
        // Calcular basado en el espaciado y el aspect ratio
        const baseSpacing = adjustedSpacing;
        actualCols = Math.max(1, Math.floor(availableWidth / baseSpacing));
        actualRows = Math.max(1, Math.floor(availableHeight / (baseSpacing / gridAspectRatio)));
        
        // Ajustar para mantener el aspect ratio
        if (aspectRatio !== 'auto') {
            const targetCols = Math.round(actualRows * gridAspectRatio);
            if (targetCols < actualCols) {
                actualCols = targetCols;
            } else {
                actualRows = Math.round(actualCols / gridAspectRatio);
            }
        }
        
        // Recalcular el espaciado real
        adjustedSpacing = Math.min(
            availableWidth / actualCols,
            availableHeight / actualRows
        ) * WARN_SPACING_RATIO;
        
        if (debugMode) {
            console.log('[useVectorGrid] Caso 4: Sin filas/columnas definidas:', 
                { actualRows, actualCols, adjustedSpacing, gridAspectRatio });
        }
    }
    
    // Asegurar valores mínimos y máximos
    actualCols = Math.max(1, Math.min(actualCols, Math.floor(availableWidth / 5)));
    actualRows = Math.max(1, Math.min(actualRows, Math.floor(availableHeight / 5)));
    
    // Asegurar que el espaciado no sea demasiado pequeño
    const minSpacing = 5; // Mínimo espaciado en píxeles
    adjustedSpacing = Math.max(minSpacing, adjustedSpacing);
    
    // Calcular dimensiones finales de la cuadrícula
    calculatedGridWidth = actualCols * adjustedSpacing;
    calculatedGridHeight = actualRows * adjustedSpacing;
    
    // Calcular márgenes para centrar la cuadrícula
    const finalMarginX = (availableWidth - calculatedGridWidth) / 2 + safeMargin;
    const finalMarginY = (availableHeight - calculatedGridHeight) / 2 + safeMargin;
    
    if (debugMode) {
        console.log('[useVectorGrid] Valores finales:', {
            actualRows,
            actualCols,
            adjustedSpacing,
            calculatedGridWidth,
            calculatedGridHeight,
            finalMarginX,
            finalMarginY,
            availableWidth,
            availableHeight,
            width: dimensions.width,
            height: dimensions.height,
            safeMargin,
            vectorsPerFlock: gridSettings.vectorsPerFlock
        });
    }
    // Cálculo mejorado para centrado perfecto
    // Calculamos el espacio sobrante después de considerar el grid completo
    const extraWidthSpace = width - calculatedGridWidth;
    const extraHeightSpace = height - calculatedGridHeight;
    
    // Distribuimos el espacio extra uniformemente en ambos lados
    // Y añadimos la mitad del espaciado para centrar el primer vector
    const finalOffsetX = Math.max(safeMargin, extraWidthSpace / 2) + (adjustedSpacing / 2);
    const finalOffsetY = Math.max(safeMargin, extraHeightSpace / 2) + (adjustedSpacing / 2);

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

    // Generar vectores
    const vectors: AnimatedVectorItem[] = [];
    const cellSize = adjustedSpacing; // Tamaño de celda basado en el espaciado ajustado
    
    // Solo un bucle para generar los vectores
    for (let row = 0; row < actualRows; row++) {
      for (let col = 0; col < actualCols; col++) {
        const id = `vector-${row}-${col}`;
        // Calcular posición centrada en la celda
        const x = finalOffsetX + col * cellSize;
        const y = finalOffsetY + row * cellSize;
        
        const {
          vectorShape = 'line' as VectorShape, 
          initialRotation = 0,
        } = vectorSettings;

        const vector: AnimatedVectorItem = {
          id,
          r: row,
          c: col,
          baseX: x,
          baseY: y,
          originalX: x,
          originalY: y,
          x: x,
          y: y,
          initialAngle: 0, // Temporal, se actualizará
          currentAngle: 0, // Temporal, se actualizará
          angle: 0, // Temporal, se actualizará
          previousAngle: 0, // Temporal, se actualizará
          targetAngle: 0, // Temporal, se actualizará
          lengthFactor: 1,
          widthFactor: 1,
          intensityFactor: 1,
          length: 20,
          originalLength: 20,
          color: '#000000',
          originalColor: '#000000',
          animationState: {},
          flockId: Math.floor(Math.random() * (vectorsPerFlock || 1)),
          customData: null
        };

        const calculatedRotation = typeof initialRotation === 'function' 
          ? initialRotation(vector) 
          : initialRotation;

        Object.assign(vector, {
          initialAngle: calculatedRotation,
          currentAngle: calculatedRotation,
          angle: calculatedRotation,
          previousAngle: calculatedRotation,
          targetAngle: calculatedRotation,
        });

        vectors.push(vector);
      }
    }

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

          // Calcular el ángulo inicial, manejando tanto números como funciones
          const currentVector = {
            id: `vector-${row}-${col}`,
            r: row,
            c: col,
            baseX: x,
            baseY: y,
            originalX: x,
            originalY: y,
            x: x,
            y: y,
            initialAngle: 0, // Temporal, se actualizará
            currentAngle: 0, // Temporal, se actualizará
            angle: 0, // Temporal, se actualizará
            previousAngle: 0, // Temporal, se actualizará
            targetAngle: 0, // Temporal, se actualizará
            lengthFactor: 1,
            widthFactor: 1,
            intensityFactor: 1,
            length: 20,
            originalLength: 20,
            color: '#000000',
            originalColor: '#000000',
            animationState: {},
            flockId: 0,
            customData: null
          };

          const calculatedRotation = typeof initialRotation === 'function' 
            ? initialRotation(currentVector) 
            : initialRotation;

          const vector: AnimatedVectorItem = {
            ...currentVector,
            initialAngle: calculatedRotation,
            currentAngle: calculatedRotation,
            angle: calculatedRotation,
            previousAngle: calculatedRotation,
            targetAngle: calculatedRotation,
            
            // Factores de transformación
            lengthFactor: 1,
            widthFactor: 1,
            intensityFactor: 1,
            
            // Longitudes
            length: 20, // Valor por defecto
            originalLength: 20, // Valor por defecto
            
            // Colores
            color: '#000000', // Color por defecto
            originalColor: '#000000', // Color por defecto
            
            // Estado y metadatos
            animationState: {},
            flockId: Math.floor(Math.random() * (vectorsPerFlock || 1)),
            customData: null
          };

          vectors.push(vector);
        }
      }
    }
    
    // Debug: Mostrar información de los vectores generados
    if (debugMode) {
      console.groupCollapsed(`[useVectorGrid] Vectores generados: ${vectors.length}`);
      if (vectors.length > 0) {
        console.log('Primer vector:', {
          id: vectors[0].id,
          x: vectors[0].baseX,
          y: vectors[0].baseY,
          angle: vectors[0].initialAngle
        });
      } else {
        console.warn('No se generaron vectores');
        // Forzar al menos un vector en modo debug
        console.warn('[DEBUG] Generando vector de ejemplo en el centro');
        vectors.push({
          id: 'debug-vector',
          r: 0,
          c: 0,
          baseX: width / 2,
          baseY: height / 2,
          originalX: width / 2,
          originalY: height / 2,
          x: width / 2,
          y: height / 2,
          initialAngle: 0,
          currentAngle: 0,
          angle: 0,
          previousAngle: 0,
          targetAngle: 0,
          lengthFactor: 1,
          widthFactor: 1,
          intensityFactor: 1,
          length: 20,
          originalLength: 20,
          color: '#000000',
          originalColor: '#000000',
          animationState: {},
          flockId: 0,
          customData: null
        });
      }
      console.groupEnd();
    }

    return {
      initialVectors: vectors,
      calculatedCols: actualCols,
      calculatedRows: actualRows,
      calculatedGridWidth: calculatedGridWidth,
      calculatedGridHeight: calculatedGridHeight
    };
  }, [dimensions, gridSettings, vectorSettings, debugMode]);

  return result;
};