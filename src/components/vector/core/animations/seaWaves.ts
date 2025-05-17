/**
 * Animación de ondas marinas (Sea Waves)
 * Crea un patrón similar a las olas del mar con variaciones en la intensidad y dirección
 */

import { AnimatedVectorItem, AnimationSettings, SeaWavesProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';
import { fixPrecision } from '@/utils/precision';

/**
 * Actualiza un vector según la animación de ondas marinas (Sea Waves)
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos con precisión controlada
 * @param props - Propiedades específicas de la animación de ondas marinas
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado con precisión controlada en sus propiedades
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

  // Calcular el tiempo normalizado para la animación con precisión controlada
  const time = fixPrecision(currentTime * 0.001 * settings.baseSpeed, 4);
  
  // Normalizar las coordenadas del vector (0-1) con precisión
  const nx = fixPrecision(item.baseX / (settings.canvasWidth || 1000), 4);
  const ny = fixPrecision(item.baseY / (settings.canvasHeight || 1000), 4);
  
  // Calcular componentes de onda primaria y secundaria con precisión
  const canvasWidth = settings.canvasWidth || 1000;
  const canvasHeight = settings.canvasHeight || 1000;
  
  // Aplicamos operaciones con precisión controlada
  const waveX = fixPrecision(Math.sin(nx * baseFrequency * canvasWidth + time), 4);
  const waveY = fixPrecision(Math.cos(ny * baseFrequency * canvasHeight + time * 0.8), 4);
  
  // Calcular componentes de ondulación (ripple) para añadir detalle
  const rippleX = fixPrecision(Math.sin(nx * rippleFrequency * canvasWidth + time * 1.2) * 0.5, 4);
  const rippleY = fixPrecision(Math.sin(ny * rippleFrequency * canvasHeight + time * 1.5) * 0.5, 4);
  
  // Combinar ondas primarias y secundarias con factor de agitación (choppiness)
  // El factor de agitación afecta cómo de abruptas son las transiciones en las olas
  const combinedWaveX = fixPrecision(waveX + rippleX * choppiness, 4);
  const combinedWaveY = fixPrecision(waveY + rippleY * choppiness, 4);
  
  // Calcular el ángulo basado en la combinación de ondas con precisión controlada
  // La dirección predominante es hacia la derecha, con variaciones basadas en la onda
  const baseAngle = fixPrecision(Math.PI * 0.5, 6); // Orientación base hacia la derecha
  const angleVariation = fixPrecision(Math.atan2(combinedWaveY, combinedWaveX) * baseAmplitude / 90, 4);
  const targetAngle = fixPrecision(baseAngle + angleVariation, 4);
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    // Usar el ángulo actual con precisión controlada
    newAngle = fixPrecision(lerp(item.currentAngle || 0, targetAngle, 0.1), 4);
  }
  
  // Calcular factor de longitud basado en la posición en la onda
  // Esto simula cómo las olas crecen y decrecen en intensidad
  const spatialComponent = fixPrecision((nx * ny) * spatialFactor * canvasWidth, 4);
  const temporalComponent = fixPrecision(time * 0.2, 4);
  const waveHeight = fixPrecision(Math.sin(spatialComponent + temporalComponent) * 0.5 + 0.5, 4);
  
  // Aplicar un patrón de ripple a la longitud para simular olas secundarias
  const rippleEffect = fixPrecision((Math.sin(nx * rippleFrequency * 5 * canvasWidth + time * 2) * 
                        Math.cos(ny * rippleFrequency * 5 * canvasHeight + time * 1.5)) * rippleAmplitude / 100, 4);
  
  // Combinar efectos para la longitud final con precisión controlada
  const newLengthFactor = fixPrecision(0.7 + waveHeight * 0.5 + rippleEffect, 4);
  // Obtener el factor de longitud actual con un valor predeterminado seguro
  const currentLengthFactor = fixPrecision(item.lengthFactor || 1.0, 4);
  
  // Aplicar transición suave al factor de longitud si está habilitado
  let finalLengthFactor = newLengthFactor;
  if (settings.lengthTransition) {
    finalLengthFactor = fixPrecision(lerp(currentLengthFactor, newLengthFactor, 0.1), 4);
  }
  
  // Mantener el factor de ancho existente con precisión controlada
  const newWidthFactor = fixPrecision(item.widthFactor || 1.0, 4);
  
  return {
    ...item,
    currentAngle: newAngle,                       // Actualizar el ángulo actual con precisión
    targetAngle: targetAngle,                     // Guardar el ángulo objetivo con precisión
    previousAngle: fixPrecision(item.currentAngle || 0, 4),   // Guardar el ángulo anterior
    lengthFactor: finalLengthFactor,              // Actualizar el factor de longitud con precisión
    widthFactor: newWidthFactor                   // Mantener el factor de ancho con precisión
  };
};
