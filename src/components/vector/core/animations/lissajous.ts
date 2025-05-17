/**
 * Animación de curvas Lissajous
 * Genera patrones armónicos basados en la combinación de movimientos sinusoidales
 */

import { AnimatedVectorItem, AnimationSettings } from './animationTypes';
import { LissajousProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';
import { fixPrecision } from '@/utils/precision';

// Extender el tipo AnimationSettings para incluir las propiedades de Lissajous
type LissajousAnimationSettings = AnimationSettings & LissajousProps;

/**
 * Actualiza un vector según la animación de curvas Lissajous
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la animación de Lissajous
 * @param settings - Configuración general de la animación
 * @param allVectors - Todos los vectores (opcional)
 * @returns Vector actualizado
 */
export const updateLissajous = (
  item: AnimatedVectorItem,
  currentTime: number,
  settings: AnimationSettings,
  allVectors?: AnimatedVectorItem[]
): AnimatedVectorItem => {
  const props = {
    ...getDefaultPropsForType('lissajous'),
    ...settings
  } as LissajousProps;

  // Obtener propiedades con valores por defecto
  const {
    xFrequency,
    yFrequency,
    xAmplitude,
    yAmplitude,
    phaseOffset,
    timeSpeed,
  } = props;

  // Calcular la posición en la curva de Lissajous
  const x = Math.sin(currentTime * 0.001 * timeSpeed * (xFrequency || 0.01) + (phaseOffset || 0)) * (xAmplitude || 1);
  const y = Math.cos(currentTime * 0.001 * timeSpeed * (yFrequency || 0.01)) * (yAmplitude || 1);

  // Calcular el ángulo resultante basado en los componentes con precisión fija
  const targetAngle = fixPrecision(Math.atan2(y, x), 6);
  
  // Aplicar transición suave al ángulo si está habilitado, con precisión controlada
  let newAngle = targetAngle;
  
  if (settings.angleTransition !== false) {
    // Si no tenemos un ángulo previo, usamos el ángulo actual
    const previousAngle = typeof item.previousAngle === 'number' 
      ? fixPrecision(item.previousAngle, 6) 
      : fixPrecision(item.angle, 6);
    
    // Aplicar interpolación lineal con el factor de suavizado
    const easingFactor = typeof settings.easingFactor === 'number' 
      ? Math.max(0, Math.min(1, settings.easingFactor)) // Asegurar que esté entre 0 y 1
      : 0.1;
    const safeEasingFactor = fixPrecision(easingFactor, 6) as number;
    newAngle = fixPrecision(lerp(previousAngle, targetAngle, safeEasingFactor), 6);
  }
  
  // Calcular la magnitud del vector resultante (puede usarse para escalar la longitud)
  const magnitude = fixPrecision(Math.sqrt(x * x + y * y), 6);
  
  // Calcular la longitud basada en la magnitud o usar la longitud actual
  const newLength = settings.lengthTransition !== false
    ? fixPrecision(magnitude * (item.originalLength || 1), 6)
    : item.length;

  // Mantener el color original o aplicar transición si es necesario
  const newColor = settings.colorTransition !== false
    ? item.originalColor
    : item.color;
  
  // Devolver el vector actualizado
  return {
    ...item,
    x: item.baseX + x * 10, // Escalar para mayor visibilidad
    y: item.baseY + y * 10, // Escalar para mayor visibilidad
    angle: newAngle,
    length: newLength,
    color: newColor,
    previousAngle: newAngle // Actualizar el ángulo previo para la próxima actualización
  };
};
