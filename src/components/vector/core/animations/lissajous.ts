/**
 * Animación de curvas Lissajous
 * Genera patrones armónicos basados en la combinación de movimientos sinusoidales
 */

import { AnimatedVectorItem, AnimationSettings, LissajousProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';

/**
 * Actualiza un vector según la animación de curvas Lissajous
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la animación de Lissajous
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateLissajous = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<LissajousProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<LissajousProps>('lissajous');
  const {
    xFrequency = defaultProps.xFrequency || 1.0,
    yFrequency = defaultProps.yFrequency || 2.0,
    xAmplitude = defaultProps.xAmplitude || 1.0,
    yAmplitude = defaultProps.yAmplitude || 1.0,
    phaseOffset = defaultProps.phaseOffset || Math.PI / 2,
    timeSpeed = defaultProps.timeSpeed || 1.0
  } = props;

  // Calcular el tiempo normalizado para la animación
  const time = currentTime * 0.001 * settings.baseSpeed * timeSpeed;
  
  // Calcular la posición normalizada del vector dentro del canvas (0-1)
  const normalizedX = item.x / settings.canvasWidth;
  const normalizedY = item.y / settings.canvasHeight;
  
  // Calcular componentes de las curvas Lissajous
  // Las curvas Lissajous se generan combinando movimientos sinusoidales en X e Y
  // con diferentes frecuencias, amplitudes y desfases
  const xComponent = Math.sin(time * xFrequency + normalizedX * Math.PI * 2) * xAmplitude;
  const yComponent = Math.sin(time * yFrequency + phaseOffset + normalizedY * Math.PI * 2) * yAmplitude;
  
  // Calcular el ángulo resultante basado en los componentes
  // El ángulo apunta en la dirección del movimiento de la curva Lissajous
  const targetAngle = Math.atan2(yComponent, xComponent);
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerp(item.angle, targetAngle, 0.1);
  }
  
  // Calcular factor de longitud basado en la magnitud del vector en la curva Lissajous
  // Esto hace que la longitud varíe según la intensidad del movimiento
  const magnitude = Math.sqrt(xComponent * xComponent + yComponent * yComponent);
  const lengthFactor = 0.8 + magnitude * 0.4; // Rango entre 0.8 y 1.2
  const targetLength = item.originalLength * lengthFactor;
  
  // Aplicar transición suave a la longitud si está habilitado
  let newLength = targetLength;
  if (settings.lengthTransition) {
    newLength = lerp(item.length, targetLength, 0.1);
  }
  
  // También podemos modular el color basándonos en la fase de la curva si está habilitado
  let newColor = item.color;
  if (settings.colorTransition) {
    // Este es un ejemplo de cambio de color basado en la fase
    // En una implementación real, podríamos usar una función más sofisticada
    // de interpolación de color basada en HSL o RGB
    newColor = item.originalColor; // Por ahora, solo restauramos el color original
  }
  
  return {
    ...item,
    angle: newAngle,
    length: newLength,
    color: newColor
  };
};
