/**
 * Sistema centralizado de animaciones vectoriales
 * Este archivo exporta todas las funciones de animación y tipos necesarios
 * para el sistema de animación modular
 */

// Importar tipos
import {
  AnimationType,
  AnimatedVectorItem,
  AnimationSettings,
  UpdateFunction,
  UpdateFunctionMap
} from './animationTypes';

// Importar funciones de actualización de animaciones
import { updateSmoothWaves } from './smoothWaves';
import { updateSeaWaves } from './seaWaves';
import { updateCenterPulse, triggerPulse } from './centerPulse';
import { updateVortex } from './vortex';
import { updateLissajous } from './lissajous';
import { updateDirectionalFlow } from './directionalFlow';
import { updateMouseInteraction } from './mouseInteraction';
import { updatePerlinFlow } from './perlinFlow';
import { updateFlocking } from './flocking';
import { updateRandomLoop } from './randomLoop';

// Importar propiedades predeterminadas
import { getDefaultPropsForType } from './defaultProps';

// Re-exportar todos los tipos y propiedades predeterminadas
export * from './animationTypes';
export * from './defaultProps';

// Exportar funciones de animación específicas
export {
  updateSmoothWaves,
  updateSeaWaves,
  updateCenterPulse,
  triggerPulse,
  updateVortex,
  updateLissajous,
  updateDirectionalFlow,
  updateMouseInteraction,
  updatePerlinFlow,
  updateFlocking,
  updateRandomLoop
};

/**
 * Mapa de funciones de actualización por tipo de animación
 * Centraliza todas las funciones de actualización disponibles
 */
export const UPDATE_FUNCTIONS: UpdateFunctionMap = {
  none: null,
  smoothWaves: updateSmoothWaves as UpdateFunction,
  seaWaves: updateSeaWaves as UpdateFunction,
  centerPulse: updateCenterPulse as UpdateFunction,
  vortex: updateVortex as UpdateFunction,
  lissajous: updateLissajous as UpdateFunction,
  mouseInteraction: updateMouseInteraction as UpdateFunction,
  directionalFlow: updateDirectionalFlow as UpdateFunction,
  flocking: updateFlocking as UpdateFunction,
  perlinFlow: updatePerlinFlow as UpdateFunction,
  randomLoop: updateRandomLoop as UpdateFunction
};

/**
 * Función central para actualizar un vector según el tipo de animación
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param settings - Configuración de la animación
 * @param allVectors - Todos los vectores (necesario para algunas animaciones)
 * @returns Vector actualizado
 */
export const updateVectorByType = (
  item: AnimatedVectorItem,
  currentTime: number,
  settings: AnimationSettings,
  allVectors?: AnimatedVectorItem[]
): AnimatedVectorItem => {
  // Si no hay tipo de animación o es 'none', devolver el vector sin cambios
  if (!settings.type || settings.type === 'none') {
    return item;
  }
  
  // Obtener la función de actualización para el tipo especificado
  const updateFunction = UPDATE_FUNCTIONS[settings.type];
  
  // Si no hay función de actualización disponible, devolver el vector sin cambios
  if (!updateFunction) {
    return item;
  }
  
  // Obtener propiedades específicas para el tipo de animación desde settings
  const animationProps = settings[settings.type] || {};
  
  // Actualizar el vector utilizando la función correspondiente
  return updateFunction(item, currentTime, animationProps, settings, allVectors);
};
