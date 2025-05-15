/**
 * Animación de pulso central (Center Pulse)
 * Crea un efecto de pulso que se propaga desde un punto central
 */

import { AnimatedVectorItem, AnimationSettings, CenterPulseProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { distance } from '../utils/math';
import { lerp, lerpAngle } from '../utils/interpolation';
import { ensureRange } from '../utils/validation';

// Interfaz para representar un pulso activo
interface ActivePulse {
  startTime: number;
  center: { x: number; y: number };
  progress: number;
}

// Almacena el estado de los pulsos activos
let activePulses: ActivePulse[] = [];
let lastPulseTime = 0;

/**
 * Dispara un nuevo pulso desde un punto específico
 * @param centerX - Coordenada X del centro del pulso (normalizada 0-1)
 * @param centerY - Coordenada Y del centro del pulso (normalizada 0-1)
 * @param currentTime - Tiempo actual en milisegundos
 */
export const triggerPulse = (centerX: number, centerY: number, currentTime: number): void => {
  activePulses.push({
    startTime: currentTime,
    center: { x: centerX, y: centerY },
    progress: 0
  });
};

/**
 * Actualiza un vector según la animación de pulso central
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la animación de pulso central
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateCenterPulse = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<CenterPulseProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<CenterPulseProps>('centerPulse');
  const {
    pulseDuration = defaultProps.pulseDuration || 1000,
    pulseCenter = defaultProps.pulseCenter || { x: 0.5, y: 0.5 },
    maxDistanceFactor = defaultProps.maxDistanceFactor || 1.5,
    pulsePropagationSpeed = defaultProps.pulsePropagationSpeed || 1.0,
    maxAngleDisplacement = defaultProps.maxAngleDisplacement || (Math.PI / 4),
    maxLengthFactor = defaultProps.maxLengthFactor || 1.5,
    affectAngle = defaultProps.affectAngle !== undefined ? defaultProps.affectAngle : true,
    continuousMode = defaultProps.continuousMode || false,
    pulseInterval = defaultProps.pulseInterval || 3000,
    fadeOutFactor = defaultProps.fadeOutFactor || 0.9
  } = props;

  // Modo continuo: generar pulsos automáticamente según el intervalo
  if (continuousMode && currentTime - lastPulseTime > pulseInterval) {
    triggerPulse(pulseCenter.x, pulseCenter.y, currentTime);
    lastPulseTime = currentTime;
  }

  // Actualizar el progreso de cada pulso activo
  // y eliminar los pulsos que han completado su duración
  activePulses = activePulses
    .map(pulse => ({
      ...pulse,
      progress: (currentTime - pulse.startTime) / pulseDuration
    }))
    .filter(pulse => pulse.progress <= 1.0);
    
  // Limitar el número de pulsos activos si está configurado
  const maxActivePulses = props.maxActivePulses || 3;
  if (activePulses.length > maxActivePulses) {
    // Mantener solo los pulsos más recientes
    activePulses = activePulses
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, maxActivePulses);
  }

  // Si no hay pulsos activos, mantener el vector sin cambios
  if (activePulses.length === 0) {
    return item;
  }

  // Calcular el efecto combinado de todos los pulsos activos
  let totalAngleEffect = 0;
  let totalLengthEffect = 0;
  let totalEffectWeight = 0;

  // Iterar a través de todos los pulsos activos
  for (const pulse of activePulses) {
    // Convertir coordenadas relativas del centro del pulso a absolutas
    const centerAbsX = pulse.center.x * settings.canvasWidth;
    const centerAbsY = pulse.center.y * settings.canvasHeight;
    
    // Calcular la distancia desde el vector al centro del pulso
    const dist = distance(item.x, item.y, centerAbsX, centerAbsY);
    
    // Calcular la distancia máxima de efecto (basada en la diagonal del canvas)
    const canvasDiagonal = Math.sqrt(
      settings.canvasWidth * settings.canvasWidth + 
      settings.canvasHeight * settings.canvasHeight
    );
    const maxEffectDistance = canvasDiagonal * maxDistanceFactor * 0.5;
    
    // Calcular la distancia de propagación actual del pulso
    const propagationDistance = pulse.progress * maxEffectDistance * pulsePropagationSpeed;
    
    // Calcular el efecto basado en la posición del vector respecto a la onda del pulso
    // El efecto es máximo cuando la distancia coincide con la distancia de propagación
    const distanceDifference = Math.abs(dist - propagationDistance);
    const pulseWidth = maxEffectDistance * 0.1; // Ancho del frente de onda
    
    // Calcular la intensidad del efecto basado en la cercanía al frente de onda
    // y en el progreso general del pulso (para que se desvanezca al final)
    let effectIntensity = 0;
    if (distanceDifference < pulseWidth) {
      // Normalizar la diferencia de distancia al frente de onda (0-1)
      const normalizedDifference = distanceDifference / pulseWidth;
      // Función de atenuación para suavizar el efecto
      effectIntensity = (1 - normalizedDifference) * (1 - pulse.progress);
    }
    
    // Aplicar factor de desvanecimiento adicional para pulsos continuos
    if (continuousMode) {
      effectIntensity *= Math.pow(fadeOutFactor, pulse.progress * 10);
    }
    
    // Si no hay efecto para este pulso, pasar al siguiente
    if (effectIntensity <= 0) {
      continue;
    }
    
    // Calcular el ángulo desde el centro del pulso hacia el vector
    const angleToVector = Math.atan2(item.y - centerAbsY, item.x - centerAbsX);
    
    // Calcular efecto en el ángulo si está habilitado
    if (affectAngle) {
      // El efecto en el ángulo es máximo en el frente de onda y apunta hacia afuera desde el centro
      const angleEffect = angleToVector + (Math.random() * 2 - 1) * maxAngleDisplacement * effectIntensity;
      totalAngleEffect += angleEffect * effectIntensity;
    }
    
    // Calcular efecto en la longitud
    // Los vectores se elongan cuando el pulso pasa por ellos
    const lengthEffect = item.originalLength * (1 + (maxLengthFactor - 1) * effectIntensity);
    totalLengthEffect += lengthEffect * effectIntensity;
    
    // Acumular el peso del efecto para ponderación posterior
    totalEffectWeight += effectIntensity;
  }
  
  // Si no hubo efectos acumulados, mantener el vector sin cambios
  if (totalEffectWeight <= 0) {
    return item;
  }
  
  // Calcular valores finales promediando todos los efectos según sus pesos
  let targetAngle = affectAngle
    ? totalAngleEffect / totalEffectWeight
    : item.angle;
    
  const targetLength = totalLengthEffect / totalEffectWeight;
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerpAngle(item.angle, targetAngle, 0.2);
  }
  
  // Aplicar transición suave a la longitud si está habilitado
  let newLength = targetLength;
  if (settings.lengthTransition) {
    newLength = lerp(item.length, targetLength, 0.2);
  }
  
  // Limitar la longitud para evitar valores extremos
  newLength = ensureRange(newLength, item.originalLength * 0.5, item.originalLength * 2);
  
  return {
    ...item,
    angle: newAngle,
    length: newLength
  };
};
