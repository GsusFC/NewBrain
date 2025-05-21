// Mock de useVectorAnimation para mantener compatibilidad
// Este archivo simula el hook eliminado para evitar errores
import { UseVectorAnimationProps, UseVectorAnimationReturn } from './types';

/**
 * @deprecated Use useVectorAnimationOptimized or useVectorAnimationWithStore instead
 */
export const useVectorAnimation = (props: UseVectorAnimationProps): UseVectorAnimationReturn => {
  console.warn(
    'DEPRECATED: useVectorAnimation ha sido reemplazado por useVectorAnimationOptimized. ' +
    'Este es un mock para mantener compatibilidad.'
  );

  // Devolver un objeto compatible con la interfaz del hook original
  return {
    animatedVectors: props.initialVectors || [],
    triggerPulse: () => {},
    setAnimatedVectors: () => {}
  };
};