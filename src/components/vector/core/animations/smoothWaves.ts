/**
 * Animación de ondas suaves (Smooth Waves)
 * Crea un patrón de ondas que fluye suavemente a través del grid
 */

import { AnimatedVectorItem, AnimationSettings, SmoothWavesProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { calculateWave } from '../utils/math';
import { lerp } from '../utils/interpolation';

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
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<SmoothWavesProps>('smoothWaves');
  const {
    waveFrequency = defaultProps.waveFrequency || 0.0002,
    waveAmplitude = defaultProps.waveAmplitude || 20,
    baseAngle = defaultProps.baseAngle || 0,
    patternScale = defaultProps.patternScale || 0.01,
    timeScale = defaultProps.timeScale || 1.0,
    waveType = defaultProps.waveType || 'circular',
    centerX = defaultProps.centerX || 0.5,
    centerY = defaultProps.centerY || 0.5
  } = props;

  // Calcular el tiempo normalizado para la animación
  const time = currentTime * 0.001 * settings.baseSpeed * timeScale;
  
  // Calcular el centro de la onda en coordenadas absolutas
  const centerAbsX = settings.canvasWidth * centerX;
  const centerAbsY = settings.canvasHeight * centerY;
  
  // Calcular factor espacial según el tipo de onda
  let spatialFactor = 0;
  
  if (waveType === 'circular') {
    // Para ondas circulares, el factor espacial depende de la distancia al centro
    const dx = item.x - centerAbsX;
    const dy = item.y - centerAbsY;
    spatialFactor = Math.sqrt(dx * dx + dy * dy) * patternScale;
  } else {
    // Para ondas lineales, el factor espacial depende de las coordenadas de manera lineal
    spatialFactor = (item.x + item.y) * patternScale;
  }
  
  // Calcular la desviación angular basada en el tiempo y la posición
  const waveValue = calculateWave(
    item.x * patternScale,
    item.y * patternScale,
    time,
    waveFrequency,
    waveAmplitude
  );
  
  // Calcular el ángulo resultante sumando el ángulo base y la desviación
  const angleRadians = baseAngle + waveValue;
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = angleRadians;
  if (settings.angleTransition) {
    newAngle = lerp(item.angle, angleRadians, 0.1);
  }
  
  // Calcular factor de longitud basado en el tiempo y la posición
  // Esto hace que la longitud oscile suavemente
  const lengthFactor = 1 + Math.sin(time * 0.5 + spatialFactor) * 0.2;
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
