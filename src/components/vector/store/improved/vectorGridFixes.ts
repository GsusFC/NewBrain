// Este archivo agrega las funciones y tipos faltantes para la compatibilidad
import { useVectorGridStore as originalStore } from './vectorGridStore';

// Grid Dimensions
interface GridDimensions {
  effectiveWidth: number;
  effectiveHeight: number;
  offsetX: number;
  offsetY: number;
}

// Estructura para almacenar las dimensiones del grid
let gridDimensionsState: GridDimensions = {
  effectiveWidth: 0,
  effectiveHeight: 0,
  offsetX: 0,
  offsetY: 0
};

// Función para obtener las dimensiones del grid
export const getGridDimensions = (): GridDimensions => gridDimensionsState;

// Función para actualizar las dimensiones del grid
export const updateGridDimensions = (dimensions: GridDimensions) => {
  gridDimensionsState = dimensions;
};

// Función de compatibilidad para updateAnimationProps (alias de setAnimationProps)
// Creamos una función wrapper en lugar de una referencia directa para asegurar que sea una función
const updateAnimationPropsFunc = (props: any) => {
  return originalStore.getState().setAnimationProps(props);
};

// Extendemos el store original para incluir la función faltante
const extendedStore = {
  ...originalStore,
  getState: () => {
    const originalState = originalStore.getState();
    return {
      ...originalState,
      updateAnimationProps: updateAnimationPropsFunc
    };
  }
};

// Exportamos la versión mejorada del store
export const useVectorGridStore = extendedStore;

// Exportamos todos los hooks desde aquí
export * from './hooks';