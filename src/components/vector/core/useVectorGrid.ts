// Mock de useVectorGrid para mantener compatibilidad
// Este archivo simula el hook eliminado para evitar errores
import { UseVectorGridProps, UseVectorGridReturn } from './types';
import { useVectorGridStore } from './hooks/useVectorGridStore';

/**
 * @deprecated Use useVectorGridStore instead
 */
export const useVectorGrid = (props: UseVectorGridProps): UseVectorGridReturn => {
  console.warn(
    'DEPRECATED: useVectorGrid ha sido reemplazado por los hooks del store. ' +
    'Este es un mock para mantener compatibilidad.'
  );

  // Generar vectores iniciales para mantener compatibilidad
  // Creamos una cuadrícula de vectores básica para evitar errores de renderizado
  const rows = props.gridSettings?.rows || 10;
  const cols = props.gridSettings?.cols || 15;
  const spacing = props.gridSettings?.spacing || 30;
  const width = props.dimensions?.width || 800;
  const height = props.dimensions?.height || 600;
  
  // Generar un grid básico de vectores
  const initialVectors = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const vector = {
        id: `vector-${r}-${c}`,
        r: r,
        c: c,
        baseX: c * spacing + spacing,
        baseY: r * spacing + spacing,
        originalX: c * spacing + spacing,
        originalY: r * spacing + spacing,
        initialAngle: 0,
        currentAngle: 0,
        lengthFactor: 1,
        widthFactor: 1,
        intensityFactor: 1,
        customData: {}
      };
      initialVectors.push(vector);
    }
  }
  
  return {
    initialVectors,
    dimensions: {
      width: width,
      height: height
    }
  };
};