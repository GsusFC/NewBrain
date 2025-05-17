/**
 * Animación de ondas suaves (Smooth Waves)
 * Crea un patrón de ondas que fluye suavemente a través del grid
 */

import { AnimatedVectorItem, AnimationSettings, SmoothWavesProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { calculateWave } from '../utils/math';
import { lerp } from '../utils/interpolation';
import { fixPrecision, formatSvgPoint, fixTransformPrecision } from '@/utils/precision';

/**
 * Actualiza un vector según la animación de ondas suaves
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la animación de ondas suaves
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateSmoothWaves = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<SmoothWavesProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados y aplicar fixPrecision para garantizar consistencia
  const defaultProps = getDefaultPropsForType<SmoothWavesProps>('smoothWaves');
  const {
    waveFrequency = fixPrecision(defaultProps.waveFrequency || 0.0002, 6),
    waveAmplitude = fixPrecision(defaultProps.waveAmplitude || 20, 1),
    baseAngle = fixPrecision(defaultProps.baseAngle || 0, 6),
    patternScale = fixPrecision(defaultProps.patternScale || 0.01, 6),
    timeScale = fixPrecision(defaultProps.timeScale || 1.0, 6),
    waveType = defaultProps.waveType || 'circular',
    centerX = fixPrecision(defaultProps.centerX || 0.5, 6),
    centerY = fixPrecision(defaultProps.centerY || 0.5, 6)
  } = props;

  // Calcular el tiempo normalizado para la animación con precisión controlada
  const time = fixPrecision(currentTime * 0.001 * settings.baseSpeed * timeScale, 6);
  
  // Calcular el centro de la onda en coordenadas absolutas con precisión fija
  const centerAbsX = fixPrecision(settings.canvasWidth * centerX, 2);
  const centerAbsY = fixPrecision(settings.canvasHeight * centerY, 2);
  
  // Calcular factor espacial según el tipo de onda
  let spatialFactor = 0;
  
  if (waveType === 'circular') {
    // Para ondas circulares, el factor espacial depende de la distancia al centro
    // Aplicamos precisión en cada paso del cálculo para evitar errores de propagación
    const dx = fixPrecision(item.x - centerAbsX, 2);
    const dy = fixPrecision(item.y - centerAbsY, 2);
    const distanceSquared = fixPrecision(dx * dx + dy * dy, 2);
    const distance = fixPrecision(Math.sqrt(distanceSquared), 4);
    spatialFactor = fixPrecision(distance * patternScale, 6);
  } else {
    // Para ondas lineales, el factor espacial depende de las coordenadas de manera lineal
    spatialFactor = fixPrecision((item.x + item.y) * patternScale, 6);
  }
  
  // Calcular la desviación angular basada en el tiempo y la posición con precisión controlada
  const waveValue = fixPrecision(calculateWave(
    fixPrecision(item.x * patternScale, 6),
    fixPrecision(item.y * patternScale, 6),
    time,
    waveFrequency,
    waveAmplitude
  ), 6);
  
  // Calcular el ángulo resultante sumando el ángulo base y la desviación con precisión fija
  const angleRadians = fixPrecision(baseAngle + waveValue, 6);
  
  // Aplicar transición suave al ángulo si está habilitado, con precisión controlada
  let newAngle = angleRadians;
  if (settings.angleTransition) {
    newAngle = fixPrecision(lerp(item.angle, angleRadians, fixPrecision(0.1, 6)), 6);
  }
  
  // Calcular factor de longitud basado en el tiempo y la posición con precisión controlada
  // Esto hace que la longitud oscile suavemente
  const sinArg = fixPrecision(time * 0.5 + spatialFactor, 6);
  const sinValue = fixPrecision(Math.sin(sinArg), 6);
  const lengthFactor = fixPrecision(1 + sinValue * 0.2, 6);
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
