// Archivo de exportación centralizado para todas las animaciones
import { 
  calculateDirectionalFlow,
  calculateVortex,
  calculateFlocking
} from './basicAnimations';

import {
  calculateLissajous,
  calculateSeaWaves,
  calculatePerlinFlow,
  calculateRandomLoop,
  calculateTangenteClasica,
  calculateGeometricPattern
} from './advancedAnimations';

// Re-exportar todas las animaciones y tipos
export * from './animationTypes';
export {
  // Animaciones básicas
  calculateDirectionalFlow,
  calculateVortex,
  calculateFlocking,
  
  // Animaciones avanzadas
  calculateLissajous,
  calculateSeaWaves,
  calculatePerlinFlow,
  calculateRandomLoop,
  calculateTangenteClasica,
  calculateGeometricPattern
};
