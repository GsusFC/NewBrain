/**
 * Animación de vórtice (Vortex)
 * Crea un efecto de rotación alrededor de un punto central con fuerza variable según la distancia
 */

import { AnimatedVectorItem, AnimationSettings, VortexProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';
import { fixPrecision, formatSvgPoint, fixTransformPrecision } from '@/utils/precision';

/**
 * Actualiza un vector según la animación de vórtice
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la animación de vórtice
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateVortex = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<VortexProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados y aplicar fixPrecision para garantizar consistencia
  const defaultProps = getDefaultPropsForType<VortexProps>('vortex');
  const {
    vortexCenterX = fixPrecision(defaultProps.vortexCenterX || 0.5, 6),
    vortexCenterY = fixPrecision(defaultProps.vortexCenterY || 0.5, 6),
    strength = fixPrecision(defaultProps.strength || 1.0, 4),
    radiusFalloff = fixPrecision(defaultProps.radiusFalloff || 0.5, 6),
    swirlDirection = defaultProps.swirlDirection || 'clockwise'
  } = props;

  // Calcular el tiempo normalizado para la animación con precisión controlada
  const time = fixPrecision(currentTime * 0.001 * settings.baseSpeed, 6);
  
  // Calcular el centro del vórtice en coordenadas absolutas con precisión fija
  const centerX = fixPrecision(settings.canvasWidth * vortexCenterX, 2);
  const centerY = fixPrecision(settings.canvasHeight * vortexCenterY, 2);
  
  // Calcular la distancia al centro del vórtice con precisión controlada
  const dx = fixPrecision(item.x - centerX, 2);
  const dy = fixPrecision(item.y - centerY, 2);
  const distanceSquared = fixPrecision(dx * dx + dy * dy, 2);
  const distance = fixPrecision(Math.sqrt(distanceSquared), 4);
  
  // Calcular la fuerza del vórtice basada en la distancia con precisión fija
  // Decrece exponencialmente con la distancia según el factor de caída
  // El uso de fixPrecision es crucial en operaciones exponenciales para evitar desbordamientos
  const expArg = fixPrecision(-distance * radiusFalloff, 6);
  const expValue = fixPrecision(Math.exp(expArg), 6);
  const forceFactor = fixPrecision(expValue * strength, 6);
  
  // Calcular el ángulo de rotación con precisión controlada
  // El directionFactor controla si la rotación es en sentido horario o antihorario
  const directionFactor = swirlDirection === 'clockwise' ? 1 : -1;
  
  // El ángulo base apunta hacia el centro del vórtice
  // Math.atan2 es especialmente sensible a la precisión
  const baseAngle = fixPrecision(Math.atan2(dy, dx), 6);
  
  // Calcular el ángulo de rotación adicional basado en el tiempo y la fuerza
  const rotationAngle = fixPrecision(time * forceFactor * directionFactor, 6);
  
  // Combinar el ángulo base con la rotación para obtener el ángulo final
  const targetAngle = fixPrecision(baseAngle + rotationAngle, 6);
  
  // Aplicar transición suave al ángulo si está habilitado, con precisión controlada
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = fixPrecision(lerp(item.angle, targetAngle, fixPrecision(0.1, 6)), 6);
  }
  
  // Calcular la longitud basada en la fuerza del vórtice con precisión controlada
  // Los vectores se alargan ligeramente cerca del centro
  const sinValue = fixPrecision(Math.sin(time), 6);
  const lengthFactor = fixPrecision(1 + forceFactor * 0.3 * sinValue, 6);
  const targetLength = fixPrecision(item.originalLength * lengthFactor, 3);
  
  // Aplicar transición suave a la longitud si está habilitado, con precisión controlada
  let newLength = targetLength;
  if (settings.lengthTransition) {
    newLength = fixPrecision(lerp(item.length, targetLength, fixPrecision(0.1, 6)), 3);
  }
  
  return {
    ...item,
    angle: newAngle,
    length: newLength
  };
};
