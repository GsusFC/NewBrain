/**
 * Animación de pulso central (Center Pulse)
 * Crea un efecto de pulso que se propaga desde un punto central
 */

import { AnimatedVectorItem, AnimationSettings, CenterPulseProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { distance } from '../utils/math';
import { lerp, lerpAngle } from '../utils/interpolation';
import { ensureRange } from '../utils/validation';
import { fixPrecision } from '@/utils/precision';

/**
 * Función de hash simple para generar un número pseudoaleatorio determinista
 * a partir de una cadena de texto. Utiliza el algoritmo djb2.
 * Garantiza una distribución uniforme en el rango [0, 1).
 */
function simpleHash(str: string): number {
  let hash = 5381; // Número primo inicial
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }
  // Usar Math.abs para asegurar positivo y normalizar a [0, 1)
  return Math.abs(hash) / 0x100000000;
}

/**
 * Genera un valor aleatorio determinista basado en el ID del vector y el tiempo de inicio del pulso
 */
function getDeterministicRandom(itemId: string, pulseStartTime: number): number {
  const seed = `${itemId}-${pulseStartTime}`;
  return simpleHash(seed);
}

// Interfaz para representar un pulso activo
interface ActivePulse {
  startTime: number;
  center: { x: number; y: number };
  progress: number;
}

export interface CenterPulseManager {
  triggerPulse: (centerX: number, centerY: number, currentTime: number) => void;
  updateCenterPulse: (
    item: AnimatedVectorItem,
    currentTime: number,
    props: Partial<CenterPulseProps>,
    settings: AnimationSettings
  ) => AnimatedVectorItem;
  clearPulses: () => void;
}

/**
 * Crea un nuevo gestor de pulsos con su propio estado aislado
 * Esto evita el acoplamiento entre diferentes instancias de animación
 */
export const createCenterPulseManager = (): CenterPulseManager => {
  // Estado local del gestor
  let activePulses: ActivePulse[] = [];
  let lastPulseTime = 0;

  /**
   * Dispara un nuevo pulso desde un punto específico
   * @param centerX - Coordenada X del centro del pulso (normalizada 0-1)
   * @param centerY - Coordenada Y del centro del pulso (normalizada 0-1)
   * @param currentTime - Tiempo actual en milisegundos (se convierte a segundos internamente)
   */
  const triggerPulse = (centerX: number, centerY: number, currentTimeMs: number): void => {
    // Convertir el tiempo actual a segundos para consistencia con updateCenterPulse
    const currentTimeSec = currentTimeMs * 0.001;
    
    activePulses.push({
      startTime: currentTimeSec, // Almacenar en segundos
      center: { x: fixPrecision(centerX, 4), y: fixPrecision(centerY, 4) },
      progress: 0
    });
    lastPulseTime = currentTimeSec; // Actualizar el tiempo del último pulso
  };

  /**
   * Actualiza un vector según la animación de pulso central
   * @param item - Vector a actualizar
   * @param currentTime - Tiempo actual en segundos (debe ser consistente con triggerPulse)
   * @param props - Propiedades específicas de la animación de pulso central
   * @param settings - Configuración general de la animación
   * @returns Vector actualizado
   */
  const updateCenterPulse = (
    item: AnimatedVectorItem,
    currentTimeSec: number, // Asegurar que está en segundos
    props: Partial<CenterPulseProps>,
    settings: AnimationSettings
  ): AnimatedVectorItem => {
    // Obtener propiedades con valores predeterminados
    const defaultProps = getDefaultPropsForType('centerPulse');
    // Usar el operador de fusión nula (??) para los valores predeterminados
    const {
      pulseDuration = 1000,
      pulseCenter = { x: 0.5, y: 0.5 },
      maxDistanceFactor = 1.5,
      pulsePropagationSpeed = 1.0,
      maxAngleDisplacement = Math.PI / 4,
      maxLengthFactor = 1.5,
      affectAngle = true,
      continuousMode = false,
      pulseInterval = 3000,
      fadeOutFactor = 0.9
    } = { ...defaultProps, ...props } as CenterPulseProps;

    // Modo continuo: generar pulsos automáticamente según el intervalo
    if (continuousMode && currentTimeSec - lastPulseTime > (pulseInterval * 0.001)) { // Convertir intervalo a segundos
      triggerPulse(pulseCenter.x, pulseCenter.y, currentTimeSec * 1000); // Convertir a ms para triggerPulse
      lastPulseTime = currentTimeSec;
    }

    // Actualizar el progreso de cada pulso activo con precisión controlada
    // y eliminar los pulsos que han completado su duración
    activePulses = activePulses
      .map(pulse => ({
        ...pulse,
        progress: fixPrecision((currentTimeSec - pulse.startTime) / (pulseDuration * 0.001), 4) // Convertir duración a segundos
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

    // Calcular valores constantes una sola vez
    const canvasWidth = settings.canvasWidth || 1000;
    const canvasHeight = settings.canvasHeight || 1000;
    
    // Calcular la diagonal del canvas una sola vez
    const canvasDiagonal = fixPrecision(Math.sqrt(
      canvasWidth * canvasWidth + 
      canvasHeight * canvasHeight
    ), 2);
    const maxEffectDistance = fixPrecision(canvasDiagonal * maxDistanceFactor * 0.5, 2);
    const pulseWidth = fixPrecision(maxEffectDistance * 0.1, 2); // Ancho del frente de onda
    
    // Calcular el efecto combinado de todos los pulsos activos
    let totalAngleEffect = 0;
    let totalLengthEffect = 0;
    let totalEffectWeight = 0;

    // Iterar a través de todos los pulsos activos
    for (const pulse of activePulses) {
      // Coordenadas absolutas del centro del pulso con precisión controlada
      const centerAbsX = fixPrecision(pulse.center.x * canvasWidth, 2);
      const centerAbsY = fixPrecision(pulse.center.y * canvasHeight, 2);
      
      // Calcular la distancia desde el centro del pulso hasta el vector con precisión controlada
      const dist = fixPrecision(distance(item.baseX, item.baseY, centerAbsX, centerAbsY), 2);
      
      // Calcular la distancia de propagación actual del pulso con precisión controlada
      const propagationDistance = fixPrecision(pulse.progress * maxEffectDistance * pulsePropagationSpeed, 2);
      
      // Calcular el efecto basado en la posición del vector respecto a la onda del pulso
      // El efecto es máximo cuando la distancia coincide con la distancia de propagación
      const distanceDifference = fixPrecision(Math.abs(dist - propagationDistance), 2);
      const pulseWidth = fixPrecision(maxEffectDistance * 0.1, 2); // Ancho del frente de onda
      
      // Calcular la intensidad del efecto basado en la cercanía al frente de onda
      // y en el progreso general del pulso (para que se desvanezca al final)
      let effectIntensity = 0;
      if (distanceDifference < pulseWidth) {
        // Normalizar la diferencia de distancia al frente de onda (0-1) con precisión controlada
        const normalizedDifference = fixPrecision(distanceDifference / pulseWidth, 4);
        // Función de atenuación para suavizar el efecto con precisión controlada
        effectIntensity = fixPrecision((1 - normalizedDifference) * (1 - pulse.progress), 4);
      }
      
      // Aplicar factor de desvanecimiento adicional para pulsos continuos con precisión controlada
      if (continuousMode) {
        effectIntensity = fixPrecision(effectIntensity * Math.pow(fadeOutFactor, pulse.progress * 10), 4);
      }
      
      // Si no hay efecto para este pulso, pasar al siguiente
      if (effectIntensity <= 0) {
        continue;
      }
      
      // Calcular el ángulo desde el centro del pulso hacia el vector con precisión controlada
      const angleToVector = fixPrecision(Math.atan2(item.baseY - centerAbsY, item.baseX - centerAbsX), 6);
      
      // Calcular efecto en el ángulo si está habilitado
      if (affectAngle) {
        // Generar un valor aleatorio determinista basado en el ID del vector y el tiempo de inicio del pulso
        // Esto asegura que el mismo vector tenga el mismo valor aleatorio en cada frame para un pulso dado
        const randomValue = getDeterministicRandom(item.id, pulse.startTime);
        // Escalar el valor a [-1, 1] para usarlo como factor de desplazamiento angular
        const randomFactor = fixPrecision(randomValue * 2 - 1, 4);
        // Aplicar el factor aleatorio al desplazamiento angular
        const angleEffect = fixPrecision(angleToVector + randomFactor * maxAngleDisplacement * effectIntensity, 6);
        // Acumular el efecto en el ángulo total, ponderado por la intensidad
        totalAngleEffect = fixPrecision(totalAngleEffect + angleEffect * effectIntensity, 6);
      }
      
      // Calcular efecto en la longitud con precisión controlada
      // Los vectores se elongan cuando el pulso pasa por ellos
      // Usamos un valor base estimado ya que originalLength ya no existe en AnimatedVectorItem
      const baseLength = 20; // Longitud base estándar
      const lengthEffect = fixPrecision(baseLength * (1 + (maxLengthFactor - 1) * effectIntensity), 2);
      totalLengthEffect = fixPrecision(totalLengthEffect + lengthEffect * effectIntensity, 2);
      
      // Acumular el peso del efecto para ponderación posterior con precisión controlada
      totalEffectWeight = fixPrecision(totalEffectWeight + effectIntensity, 4);
    }
    
    // Si no hubo efectos acumulados, mantener el vector sin cambios
    if (totalEffectWeight <= 0) {
      return item;
    }
    
    // Calcular valores finales promediando todos los efectos según sus pesos con precisión controlada
    let targetAngle = affectAngle
      ? fixPrecision(totalAngleEffect / totalEffectWeight, 6)
      : fixPrecision(item.currentAngle || 0, 6);
      
    // Calcular el factor de longitud basado en los efectos acumulados
    const newLengthFactor = fixPrecision(totalLengthEffect / totalEffectWeight / 20, 4); // Dividir por la longitud base estimada
    
    // Obtener el factor de longitud actual con un valor predeterminado seguro
    const currentLengthFactor = fixPrecision(item.lengthFactor || 1.0, 4);
    
    // Aplicar transición suave al ángulo si está habilitado
    let newAngle = targetAngle;
    if (settings.angleTransition) {
      newAngle = fixPrecision(lerpAngle(item.currentAngle || 0, targetAngle, 0.2), 6);
    }
    
    // Aplicar transición suave al factor de longitud si está habilitado
    let finalLengthFactor = newLengthFactor;
    if (settings.lengthTransition) {
      finalLengthFactor = fixPrecision(lerp(currentLengthFactor, newLengthFactor, 0.2), 4);
    }
    
    // Limitar el factor de longitud para evitar valores extremos con precisión controlada
    finalLengthFactor = fixPrecision(ensureRange(finalLengthFactor, 0.5, 2.0), 4);
    
    // Mantener el factor de ancho existente con precisión controlada
    const newWidthFactor = fixPrecision(item.widthFactor || 1.0, 4);
    
    return {
      ...item,
      currentAngle: newAngle,                        // Actualizar el ángulo actual con precisión
      targetAngle: targetAngle,                      // Guardar el ángulo objetivo con precisión
      previousAngle: fixPrecision(item.currentAngle || 0, 6),    // Guardar el ángulo anterior
      lengthFactor: finalLengthFactor,               // Actualizar el factor de longitud con precisión
      widthFactor: newWidthFactor                    // Mantener el factor de ancho con precisión
    };
  };

  /**
   * Limpia todos los pulsos activos
   */
  const clearPulses = (): void => {
    activePulses = [];
  };

  return {
    triggerPulse,
    updateCenterPulse,
    clearPulses
  };
};

// Mantener compatibilidad con el código existente
// Crear una instancia por defecto para compatibilidad con código existente
const defaultPulseManager = createCenterPulseManager();

export const triggerPulse = defaultPulseManager.triggerPulse;
export const updateCenterPulse = defaultPulseManager.updateCenterPulse;
