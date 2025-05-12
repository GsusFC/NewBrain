// Archivo de exportación centralizado para todas las animaciones
import { 
  calculateDirectionalFlow,
  calculateVortex,
  calculateFlocking
} from './basicAnimations';

// Re-exportar todas las animaciones y tipos
export * from './animationTypes';
export {
  calculateDirectionalFlow,
  calculateVortex,
  calculateFlocking
};

// En el futuro, aquí se añadirán más exportaciones a medida que se implementen más animaciones
