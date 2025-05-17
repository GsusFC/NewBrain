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

// Importar utilidades de precisión
import { fixPrecision, formatSvgPoint, fixTransformPrecision } from '@/utils/precision';

// Importar funciones de actualización de animaciones
import { updateSmoothWaves } from './smoothWaves';
import { updateSeaWaves } from './seaWaves';
import { updateCenterPulse, triggerPulse, createCenterPulseManager } from './centerPulse';
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
  createCenterPulseManager,
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
 * Con precisión controlada para garantizar consistencia entre servidor y cliente
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param settings - Configuración de la animación
 * @param allVectors - Todos los vectores (necesario para algunas animaciones)
 * @returns Vector actualizado con precisión controlada
 */
export const updateVectorByType = (
  item: AnimatedVectorItem,
  currentTime: number,
  settings: AnimationSettings,
  allVectors?: AnimatedVectorItem[]
): AnimatedVectorItem => {
  // Si no hay tipo de animación o es 'none', devolver el vector con propiedades de precisión fija
  if (!settings.type || settings.type === 'none') {
    return {
      ...item,
      // Añadir precisión controlada para evitar errores de hidratación incluso sin animación
      angle: fixPrecision(item.angle, 6),
      length: fixPrecision(item.length, 3),
      x: fixPrecision(item.x, 2),
      y: fixPrecision(item.y, 2)
    };
  }
  
  // Obtener la función de actualización para el tipo especificado
  const updateFunction = UPDATE_FUNCTIONS[settings.type];
  
  // Si no hay función de actualización disponible, devolver el vector con precisión fija
  if (!updateFunction) {
    return {
      ...item,
      angle: fixPrecision(item.angle, 6),
      length: fixPrecision(item.length, 3),
      x: fixPrecision(item.x, 2),
      y: fixPrecision(item.y, 2)
    };
  }
  
  // Aplicar precisión controlada al tiempo actual para garantizar consistencia
  const preciseTime = fixPrecision(currentTime, 1); // Un decimal es suficiente para el tiempo en ms
  
  // Obtener propiedades específicas para el tipo de animación desde settings
  const animationProps = settings[settings.type] || {};
  
  // Aplicar precisión controlada a las dimensiones del canvas para cálculos precisos
  const preciseSettings = {
    ...settings,
    canvasWidth: fixPrecision(settings.canvasWidth, 2),
    canvasHeight: fixPrecision(settings.canvasHeight, 2),
    baseSpeed: fixPrecision(settings.baseSpeed || 1.0, 6)
  };
  
  // Actualizar el vector utilizando la función correspondiente con valores de precisión controlada
  const updatedVector = updateFunction(item, preciseTime, animationProps, preciseSettings, allVectors);
  
  // Garantizar que las propiedades clave del vector resultante tengan precisión fija
  // Esto es crucial para prevenir errores de hidratación y comportamiento inconsistente
  return {
    ...updatedVector,
    angle: fixPrecision(updatedVector.angle, 6),
    length: fixPrecision(updatedVector.length, 3)
  };
};
