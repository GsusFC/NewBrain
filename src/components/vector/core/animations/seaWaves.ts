/**
 * Animación de ondas marinas (Sea Waves)
 * Crea un patrón similar a las olas del mar con variaciones en la intensidad y dirección
 */

import { AnimatedVectorItem, AnimationSettings, SeaWavesProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';

/**
 * Actualiza un vector según la animación de ondas marinas
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la animación de ondas marinas
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateSeaWaves = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<SeaWavesProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<SeaWavesProps>('seaWaves');
  const {
    baseFrequency = defaultProps.baseFrequency || 0.0004,
    baseAmplitude = defaultProps.baseAmplitude || 25,
    rippleFrequency = defaultProps.rippleFrequency || 0.001,
    rippleAmplitude = defaultProps.rippleAmplitude || 10,
    choppiness = defaultProps.choppiness || 0.3,
    spatialFactor = defaultProps.spatialFactor || 0.01
  } = props;

  // Calcular el tiempo normalizado para la animación
  const time = currentTime * 0.001 * settings.baseSpeed;
  
  // Normalizar las coordenadas del vector (0-1)
  const nx = item.x / settings.canvasWidth;
  const ny = item.y / settings.canvasHeight;
  
  // Calcular componentes de onda primaria y secundaria
  const waveX = Math.sin(nx * baseFrequency * settings.canvasWidth + time);
  const waveY = Math.cos(ny * baseFrequency * settings.canvasHeight + time * 0.8);
  
  // Calcular componentes de ondulación (ripple) para añadir detalle
  const rippleX = Math.sin(nx * rippleFrequency * settings.canvasWidth + time * 1.2) * 0.5;
  const rippleY = Math.sin(ny * rippleFrequency * settings.canvasHeight + time * 1.5) * 0.5;
  
  // Combinar ondas primarias y secundarias con factor de agitación (choppiness)
  // El factor de agitación afecta cómo de abruptas son las transiciones en las olas
  const combinedWaveX = waveX + rippleX * choppiness;
  const combinedWaveY = waveY + rippleY * choppiness;
  
  // Calcular el ángulo basado en la combinación de ondas
  // La dirección predominante es hacia la derecha, con variaciones basadas en la onda
  const baseAngle = Math.PI * 0.5; // Orientación base hacia la derecha
  const angleVariation = Math.atan2(combinedWaveY, combinedWaveX) * baseAmplitude / 90;
  const targetAngle = baseAngle + angleVariation;
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerp(item.angle, targetAngle, 0.1);
  }
  
  // Calcular factor de longitud basado en la posición en la onda
  // Esto simula cómo las olas crecen y decrecen en intensidad
  const spatialComponent = (nx * ny) * spatialFactor * settings.canvasWidth;
  const temporalComponent = time * 0.2;
  const waveHeight = Math.sin(spatialComponent + temporalComponent) * 0.5 + 0.5;
  
  // Aplicar un patrón de ripple a la longitud para simular olas secundarias
  const rippleEffect = (Math.sin(nx * rippleFrequency * 5 * settings.canvasWidth + time * 2) * 
                        Math.cos(ny * rippleFrequency * 5 * settings.canvasHeight + time * 1.5)) * rippleAmplitude / 100;
  
  // Combinar efectos para la longitud final
  const lengthFactor = 0.7 + waveHeight * 0.5 + rippleEffect;
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
