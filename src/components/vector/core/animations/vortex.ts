/**
 * Animación de vórtice (Vortex)
 * Crea un efecto de rotación alrededor de un punto central con fuerza variable según la distancia
 */

import { AnimatedVectorItem, AnimationSettings, VortexProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';

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
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<VortexProps>('vortex');
  const {
    vortexCenterX = defaultProps.vortexCenterX || 0.5,
    vortexCenterY = defaultProps.vortexCenterY || 0.5,
    strength = defaultProps.strength || 1.0,
    radiusFalloff = defaultProps.radiusFalloff || 0.5,
    swirlDirection = defaultProps.swirlDirection || 'clockwise'
  } = props;

  // Calcular el tiempo normalizado para la animación
  const time = currentTime * 0.001 * settings.baseSpeed;
  
  // Calcular el centro del vórtice en coordenadas absolutas
  const centerX = settings.canvasWidth * vortexCenterX;
  const centerY = settings.canvasHeight * vortexCenterY;
  
  // Calcular la distancia al centro del vórtice
  const dx = item.x - centerX;
  const dy = item.y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calcular la fuerza del vórtice basada en la distancia
  // Decrece exponencialmente con la distancia según el factor de caída
  const forceFactor = Math.exp(-distance * radiusFalloff) * strength;
  
  // Calcular el ángulo de rotación
  // El directionFactor controla si la rotación es en sentido horario o antihorario
  const directionFactor = swirlDirection === 'clockwise' ? 1 : -1;
  
  // El ángulo base apunta hacia el centro del vórtice
  const baseAngle = Math.atan2(dy, dx);
  
  // Calcular el ángulo de rotación adicional basado en el tiempo y la fuerza
  const rotationAngle = time * forceFactor * directionFactor;
  
  // Combinar el ángulo base con la rotación para obtener el ángulo final
  const targetAngle = baseAngle + rotationAngle;
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerp(item.angle, targetAngle, 0.1);
  }
  
  // Calcular la longitud basada en la fuerza del vórtice
  // Los vectores se alargan ligeramente cerca del centro
  const lengthFactor = 1 + forceFactor * 0.3 * Math.sin(time);
  const targetLength = item.originalLength * lengthFactor;
  
  // Aplicar transición suave a la longitud si está habilitado
  let newLength = targetLength;
  if (settings.lengthTransition) {
    newLength = lerp(item.length, targetLength, 0.1);
  }
  
  return {
    ...item,
    angle: newAngle,
    length: newLength
  };
};
