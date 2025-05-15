/**
 * Animación de flujo direccional (Directional Flow)
 * Crea un patrón de flujo en una dirección específica con variaciones turbulentas
 */

import { AnimatedVectorItem, AnimationSettings, DirectionalFlowProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { degreesToRadians } from '../utils/math';
import { lerp } from '../utils/interpolation';

/**
 * Actualiza un vector según la animación de flujo direccional
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la animación de flujo direccional
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateDirectionalFlow = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<DirectionalFlowProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<DirectionalFlowProps>('directionalFlow');
  const {
    flowAngle = defaultProps.flowAngle || 0,
    flowSpeed = defaultProps.flowSpeed || 1.0,
    turbulence = defaultProps.turbulence || 0.2
  } = props;

  // Convertir el ángulo de flujo a radianes
  const flowAngleRadians = degreesToRadians(flowAngle);
  
  // Calcular el tiempo normalizado para la animación
  const time = currentTime * 0.001 * settings.baseSpeed * flowSpeed;
  
  // Normalizar la posición del vector en el lienzo
  const normalizedX = item.x / settings.canvasWidth;
  const normalizedY = item.y / settings.canvasHeight;
  
  // Calcular factor de turbulencia basado en la posición y el tiempo
  // Esto crea variaciones en el ángulo del flujo para simular turbulencia
  const turbulenceFactor = Math.sin(normalizedX * 10 + time) * 
                          Math.cos(normalizedY * 10 + time * 0.7) * 
                          turbulence;
  
  // Calcular el ángulo final sumando la turbulencia al ángulo base
  const targetAngle = flowAngleRadians + turbulenceFactor;
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerp(item.angle, targetAngle, 0.1);
  }
  
  // Calcular factor de longitud basado en la turbulencia
  // La longitud aumenta ligeramente en áreas de baja turbulencia
  const lengthFactor = 1 + Math.abs(turbulenceFactor) * 0.2;
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
