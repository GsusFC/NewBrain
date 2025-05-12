// Ruta: src/components/vector/core/useVectorAnimation.ts

import { useRef, useEffect, useState } from 'react';
import Victor from 'victor'; // Para cálculos vectoriales en animaciones
import {
  AnimatedVectorItem,
  UseVectorAnimationProps,
  UseVectorAnimationReturn,
  VectorDimensions,
} from './types';

// Importamos las animaciones definidas en nuestro módulo de animaciones
import {
  calculateDirectionalFlow,
  calculateVortex,
  calculateFlocking,
  AnimationType,
  DirectionalFlowProps,
  VortexProps,
  FlockingProps
} from './animations';

// --- Funciones de Easing --- 
const easingFunctions: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  // ... más funciones de easing pueden ser añadidas aquí
};

// --- Funciones Auxiliares de Animación (Ejemplos) ---
// Es recomendable mover estas a un archivo separado (ej. animationLogics.ts) si crecen mucho.

/**
 * Calcula el ángulo para la animación de ondas suaves.
 * Versión mejorada con buen equilibrio entre rendimiento y atractivo visual.
 */
const calculateTargetAngle_SmoothWaves = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: Record<string, unknown>,
  timeScale: number
): number => {
  // Extraer propiedades con valores por defecto
  const { 
    waveFrequency = 0.0002, 
    waveAmplitude = 20, 
    baseAngle = 0,
    patternScale = 0.01,
    centerX,        // Opcional: centro X del patrón (por defecto, usar cálculo automático)
    centerY,        // Opcional: centro Y del patrón (por defecto, usar cálculo automático)
    waveType = 'circular',  // Opcional: tipo de patrón ('circular', 'linear', 'diagonal')
  } = props;
  
  // Tiempo escalado para la animación
  const timeComponent = timestamp * waveFrequency * timeScale;
  
  // Patrón de ondas - elegir según el tipo especificado
  let oscillation = 0;
  
  // Determinar centro del patrón si no se especificó
  // (estimamos un punto medio basado en la distribución de los vectores)
  const center = {
    x: centerX !== undefined ? centerX : item.baseX * 2, // Estimación simple
    y: centerY !== undefined ? centerY : item.baseY * 2  // Estimación simple
  };
  
  switch(waveType) {
    case 'circular': {
      // Optimización: Pre-calculamos valores una vez por frame en lugar de por vector
      // y usamos métodos más eficientes para calcular la distancia
      
      // Usar aproximación de distancia Manhattan (|x1-x2| + |y1-y2|) que es más rápida
      // que la distancia euclidiana y suficiente para efectos visuales
      const dx = Math.abs(item.baseX - center.x);
      const dy = Math.abs(item.baseY - center.y);
      const distance = (dx + dy) * patternScale * 0.5; // Factor 0.5 para ajustar escala
      
      // Aplicar una función de onda más simple con menos operaciones
      oscillation = Math.sin(timeComponent - distance) * waveAmplitude;
      break;
    }
    case 'diagonal': {
      // Patrón diagonal (ondas que se mueven en diagonal)
      const diagonal = (item.baseX + item.baseY) * patternScale;
      // Patrón diagonal (ondas que se mueven en diagonal)
      oscillation = Math.sin(timeComponent + diagonal) * waveAmplitude;
      break;
    }
    case 'linear':
    default: {
      // Patrón lineal simple (más eficiente)
      const xComponent = item.baseX * patternScale;
      const yComponent = item.baseY * patternScale * 0.5;
      oscillation = Math.sin(timeComponent + xComponent + yComponent) * waveAmplitude;
      break;
    }
  }
  
  return baseAngle + oscillation;
};

const calculateTargetAngle_MouseInteraction = (
  item: AnimatedVectorItem,
  mousePosition: Victor | null,
  props: Record<string, any>
): number => {
  const { repulsionDistance = 150, attractionDistance = 50, alignAngle = 0 } = props;
  if (!mousePosition) return item.initialAngle;

  const vectorPos = new Victor(item.baseX, item.baseY);
  const directionToMouse = mousePosition.clone().subtract(vectorPos);
  const distance = directionToMouse.length();

  if (distance < attractionDistance) { // Atracción fuerte cerca
    return directionToMouse.angleDeg();
  } else if (distance < repulsionDistance) { // Repulsión en rango medio
    return directionToMouse.clone().invert().angleDeg() + alignAngle; // Invierte y añade un ángulo de alineación
  }
  return item.currentAngle; // Mantener ángulo si está fuera del radio de influencia
};

const calculateTargetAngle_CenterPulse = (
  item: AnimatedVectorItem,
  timestamp: number, // Tiempo actual del sistema (performance.now())
  pulseStartTime: number, // performance.now() cuando se activó el pulso
  dimensions: { width: number; height: number },
  props: Record<string, any>
): { angle: number; lengthFactor?: number; widthFactor?: number, completed?: boolean } => {
  const {
    pulseDuration = 800, // Duración del efecto principal del pulso
    pulsePropagationSpeed = 0.5, // 0-1, velocidad de la onda (más alto es más rápido)
    maxDistanceEffect = 0.8, // Qué tan lejos se propaga el efecto principal (0-1 del radio máximo)
    outwardAngleOffset = 0, // Desfase angular para el ángulo de salida
    returnToTangential = true, // Si debe volver a un ángulo tangencial después del pulso
    postPulseOscillationDuration = 500, // Duración de la oscilación post-pulso
    postPulseOscillationAmplitude = 15, // Amplitud de la oscilación
  } = props;

  let targetAngle = item.currentAngle;
  let lengthFactor = 1.0;
  let widthFactor = 1.0;
  let pulseCompletedForThisVector = false;

  const timeSincePulseActivation = timestamp - pulseStartTime;

  if (timeSincePulseActivation < 0) return { angle: targetAngle }; // Pulso aún no ha comenzado

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const centerVec = new Victor(centerX, centerY);
  const itemVec = new Victor(item.baseX, item.baseY);
  const directionFromCenter = itemVec.clone().subtract(centerVec);
  const distanceToCenter = directionFromCenter.length();
  const maxPossibleDistance = Math.sqrt(centerX * centerX + centerY * centerY) * maxDistanceEffect;

  if (distanceToCenter > maxPossibleDistance && maxPossibleDistance > 0) {
    // Fuera del rango de efecto del pulso principal
    if (returnToTangential && timeSincePulseActivation > pulseDuration + postPulseOscillationDuration) { // Si el pulso ya pasó completamente
        const angleToCenter = Math.atan2(item.baseY - centerY, item.baseX - centerX);
        targetAngle = (angleToCenter + Math.PI / 2) * (180 / Math.PI); // Tangencial
    }
    return { angle: targetAngle, completed: timeSincePulseActivation > pulseDuration + postPulseOscillationDuration };
  }

  const normalizedDistance = maxPossibleDistance > 0 ? distanceToCenter / maxPossibleDistance : 0; // 0 (centro) a 1 (borde del efecto)
  const delay = normalizedDistance * (pulseDuration * (1 - pulsePropagationSpeed)); // Pulso llega más tarde a los más lejanos

  if (timeSincePulseActivation >= delay) {
    const timeIntoPulseEffect = timeSincePulseActivation - delay;

    if (timeIntoPulseEffect < pulseDuration) {
      // Fase principal del pulso: apuntar hacia afuera
      targetAngle = directionFromCenter.angleDeg() + 180 + outwardAngleOffset; // Hacia afuera + offset
      // Efecto de "onda" en longitud/grosor
      const pulseProgress = timeIntoPulseEffect / pulseDuration; // 0 a 1
      const wave = Math.sin(pulseProgress * Math.PI); // Onda sinusoidal simple (0 -> 1 -> 0)
      lengthFactor = 1 + wave * 0.5; // Se alarga hasta 1.5x
      widthFactor = 1 + wave * 0.2;  // Se ensancha hasta 1.2x
    } else if (timeIntoPulseEffect < pulseDuration + postPulseOscillationDuration) {
      // Fase de oscilación post-pulso
      const postPulseProgress = (timeIntoPulseEffect - pulseDuration) / postPulseOscillationDuration; // 0 a 1
      const oscillation = Math.sin(postPulseProgress * Math.PI * 4) * postPulseOscillationAmplitude * (1 - postPulseProgress); // Oscilación que se desvanece

      if (returnToTangential) {
        const angleToCenter = Math.atan2(item.baseY - centerY, item.baseX - centerX);
        const tangentialAngle = (angleToCenter + Math.PI / 2) * (180 / Math.PI);
        targetAngle = tangentialAngle + oscillation;
      } else {
        targetAngle = item.initialAngle + oscillation; // Vuelve al inicial con oscilación
      }
    } else {
        // Pulso completado para este vector
        pulseCompletedForThisVector = true;
        if (returnToTangential) {
            const angleToCenter = Math.atan2(item.baseY - centerY, item.baseX - centerX);
            targetAngle = (angleToCenter + Math.PI / 2) * (180 / Math.PI);
        } else {
            targetAngle = item.initialAngle;
        }
    }
  }


  return { angle: targetAngle, lengthFactor, widthFactor, completed: pulseCompletedForThisVector };
};

const interpolateAngle = (currentAngle: number, targetAngle: number, easingFactor: number): number => {
  let diff = targetAngle - currentAngle;
  // Normalizar la diferencia para tomar el camino más corto
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  
  let newAngle = currentAngle + diff * easingFactor;
  
  // Normalizar el resultado a 0-360 grados
  newAngle %= 360;
  if (newAngle < 0) newAngle += 360;
  
  return newAngle;
};

const interpolateValue = (currentValue: number, targetValue: number, easingFactor: number): number => {
  return currentValue + (targetValue - currentValue) * easingFactor;
};

const applyPulseToVector = (
  item: AnimatedVectorItem,
  pulseStartTime: number,
  currentTime: number,
  pulseProps: Record<string, unknown>,
  timeScale: number,
  gridDimensions: VectorDimensions
): { 
  angle?: number; 
  lengthFactor?: number; 
  widthFactor?: number; 
  intensityFactor?: number; 
  pulseCompletedThisFrame: boolean; // Indica si la animación de pulso general para este frame ha terminado
  pulseCompletedForThisVector: boolean; // Indica si ESTE vector ha terminado su ciclo de pulso
} => {
  const {
    pulseDuration = 1000, // ms, duración total del pulso para un vector
    maxAngleOffset = 90, // grados, cambio máximo de ángulo durante el pulso
    angleOffsetMode = 'sine', // 'sine', 'triangle', 'random'
    targetAngleDuringPulse = 'initialRelative', // 'initialRelative', 'awayFromCenter', 'towardsCenter', 'perpendicularClockwise', 'perpendicularCounterClockwise'
    maxLengthFactorPulse = 1.5, // Factor de longitud máximo durante el pulso
    minLengthFactorPulse = 0.8, // Factor de longitud mínimo durante el pulso
    maxWidthFactorPulse = 1.2,  // Factor de grosor máximo
    minWidthFactorPulse = 0.9,  // Factor de grosor mínimo
    maxIntensityFactorPulse = 1.0, // Factor de intensidad máximo
    minIntensityFactorPulse = 0.5, // Factor de intensidad mínimo
    // distanceImpactFactor = 0.3, // Comentado: No usado actualmente
    delayPerDistanceUnit = 0, // Retraso adicional basado en la distancia (ms por unidad de distancia normalizada)
    easingFnKey = 'easeInOutQuad', // Función de easing para la progresión general del pulso
    angleEasingFnKey = 'easeOutQuad', // Función de easing para el cambio de ángulo específico
    factorEasingFnKey = 'easeOutElastic', // Función de easing para los cambios de factores (longitud, grosor, intensidad)
  } = pulseProps;

  const centerX = gridDimensions.width / 2;
  const centerY = gridDimensions.height / 2;
  const dx = item.baseX - centerX;
  const dy = item.baseY - centerY;
  const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
  const maxPossibleDistance = Math.max(1, Math.sqrt(centerX * centerX + centerY * centerY)); // Evitar división por cero
  const normalizedDistance = distanceToCenter / maxPossibleDistance;

  const delayOffset = normalizedDistance * delayPerDistanceUnit;
  const timeSincePulseStart = (currentTime - pulseStartTime - delayOffset) * timeScale;
  
  const pulseProgress = Math.min(1, Math.max(0, timeSincePulseStart / pulseDuration));
  const pulseCompletedForThisVector = pulseProgress >= 1;
  const pulseActiveForThisVector = pulseProgress > 0 && pulseProgress < 1;

  const easingFunction = easingFunctions[easingFnKey] || easingFunctions.linear;
  const easedPulseProgress = easingFunction(pulseProgress);

  // Si distanceImpactFactor es negativo, los más lejanos se activan antes/más fuerte.
  // Si es positivo, los más cercanos se activan antes/más fuerte.
  // Aquí, un factor de 0 significa que la distancia no afecta la *intensidad* del progreso, solo el posible *retraso*.
  // Para afectar la intensidad, podemos modular easedPulseProgress:
  // easedPulseProgress *= (1 - normalizedDistance * distanceImpactFactor); // Esto haría que los más lejanos tengan un pulso más débil si distanceImpactFactor es positivo.

  let angleOffset = 0;
  const angleEasingFunction = easingFunctions[angleEasingFnKey] || easingFunctions.linear;
  const angleEffectProgress = angleEasingFunction(easedPulseProgress); // Easing específico para el efecto de ángulo

  if (angleOffsetMode === 'sine') {
    angleOffset = Math.sin(angleEffectProgress * Math.PI) * maxAngleOffset; 
  } else if (angleOffsetMode === 'triangle') {
    angleOffset = (angleEffectProgress < 0.5 ? 2 * angleEffectProgress : 2 * (1 - angleEffectProgress)) * maxAngleOffset;
  } else if (angleOffsetMode === 'random') {
    angleOffset = (Math.random() - 0.5) * 2 * maxAngleOffset * Math.sin(angleEffectProgress * Math.PI);
  }

  let newAngle = item.currentAngle;
  const angleToCenterRad = Math.atan2(dy, dx);
  const angleToCenterDeg = angleToCenterRad * (180 / Math.PI);

  switch (targetAngleDuringPulse) {
    case 'initialRelative':
      newAngle = item.initialAngle + angleOffset;
      break;
    case 'currentRelative': // Relativo al ángulo actual del vector, no al inicial
      newAngle = item.currentAngle + angleOffset;
      break;
    case 'awayFromCenter':
      newAngle = angleToCenterDeg + angleOffset;
      break;
    case 'towardsCenter':
      newAngle = (angleToCenterDeg + 180) % 360 + angleOffset;
      break;
    case 'perpendicularClockwise':
      newAngle = (angleToCenterDeg + 90) % 360 + angleOffset;
      break;
    case 'perpendicularCounterClockwise':
      newAngle = (angleToCenterDeg - 90 + 360) % 360 + angleOffset;
      break;
    default: // Mantener ángulo o basado en el inicial sin offset si no se especifica
      newAngle = item.initialAngle; 
      break;
  }

  // Aplicar efectos a los factores (longitud, grosor, intensidad)
  const factorEasingFunction = easingFunctions[factorEasingFnKey] || easingFunctions.linear;
  const factorEffectProgress = factorEasingFunction(easedPulseProgress); // Easing específico para los factores
  
  // Interpolar factores entre min y max usando la progresión del pulso
  // La forma de la onda de los factores es típicamente una subida y bajada (como un pulso real)
  // Esto se puede lograr con sin(progress * PI) o similar para que comience y termine en el valor base (asumido 1 para factores).
  const factorWave = Math.sin(factorEffectProgress * Math.PI); // Va de 0 a 1 y de nuevo a 0

  const newLengthFactor = 1 + (factorWave > 0 ? 
                                (maxLengthFactorPulse - 1) * factorWave : 
                                (1 - minLengthFactorPulse) * factorWave); // Si minLengthFactorPulse es < 1, factorWave negativo lo reduce

  const newWidthFactor = 1 + (factorWave > 0 ? 
                               (maxWidthFactorPulse - 1) * factorWave : 
                               (1 - minWidthFactorPulse) * factorWave);

  const newIntensityFactor = 1 + (factorWave > 0 ? 
                                 (maxIntensityFactorPulse - 1) * factorWave : 
                                 (1 - minIntensityFactorPulse) * factorWave);

  // Solo aplicar cambios si el pulso está activo para este vector
  if (pulseActiveForThisVector) {
    return {
      angle: newAngle,
      lengthFactor: newLengthFactor,
      widthFactor: newWidthFactor,
      intensityFactor: newIntensityFactor,
      pulseCompletedThisFrame: false, // Aún no ha terminado para este frame si está activo
      pulseCompletedForThisVector: pulseCompletedForThisVector, 
    };
  } else if (pulseCompletedForThisVector) {
     // El pulso ha terminado para este vector, podría volver a valores base o mantener el último estado del pulso.
     // Por simplicidad, aquí no hacemos nada, se asumirá que el easing normal lo llevará de vuelta.
     // O podrías devolver explícitamente factores base (1.0) y ángulo inicial.
    return { 
      angle: item.initialAngle, // Opcional: resetear al ángulo inicial explícitamente
      lengthFactor: 1.0,      // Opcional: resetear factor
      widthFactor: 1.0,       // Opcional: resetear factor
      intensityFactor: 1.0,   // Opcional: resetear factor
      pulseCompletedThisFrame: true, 
      pulseCompletedForThisVector: true 
    };
  }

  // Si el pulso no ha comenzado para este vector (debido al delay)
  return {
    angle: item.currentAngle, // Mantener estado actual
    lengthFactor: item.lengthFactor,
    widthFactor: item.widthFactor,
    intensityFactor: item.intensityFactor,
    pulseCompletedThisFrame: false, // No ha terminado para el frame general si algunos pueden estar retrasados
    pulseCompletedForThisVector: false,
  };
};

// --- Implementación del Hook ---
export const useVectorAnimation = ({
  initialVectors,
  dimensions,
  animationSettings,
  mousePosition,
  pulseTrigger,
  onPulseComplete,
  onAllPulsesComplete,
  // throttleMs = 16, // No usado actualmente, utilizamos requestAnimationFrame
}: UseVectorAnimationProps): UseVectorAnimationReturn => {
  const [animatedVectors, setAnimatedVectors] = useState<AnimatedVectorItem[]>([]);
  const settingsRef = useRef(animationSettings);
  const dimensionsRef = useRef(dimensions);
  const mousePosRef = useRef<Victor | null>(mousePosition ? new Victor(mousePosition.x, mousePosition.y) : null);
  const pulseStartTimeRef = useRef<number | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const onPulseCompleteRef = useRef(onPulseComplete); // Ref para callbacks
  const onAllPulsesCompleteRef = useRef(onAllPulsesComplete);
  const prevInitialVectorsRef = useRef<string>(); // Para comparar contenido de initialVectors

  // Actualizar refs cuando las props cambien
  useEffect(() => { settingsRef.current = animationSettings; }, [animationSettings]);
  useEffect(() => { dimensionsRef.current = dimensions; }, [dimensions]);
  useEffect(() => { 
    if(mousePosition){
      mousePosRef.current = new Victor(mousePosition.x, mousePosition.y);
    } else {
      mousePosRef.current = null;
    }
  }, [mousePosition]);
  useEffect(() => { onPulseCompleteRef.current = onPulseComplete; }, [onPulseComplete]);
  useEffect(() => { onAllPulsesCompleteRef.current = onAllPulsesComplete; }, [onAllPulsesComplete]);

  // Detectar trigger de pulso
  useEffect(() => {
    if (pulseTrigger && pulseTrigger !== pulseStartTimeRef.current) {
      pulseStartTimeRef.current = pulseTrigger;
    }
  }, [pulseTrigger]);

  // Efecto SOLO para inicializar/resetear animatedVectors cuando initialVectors cambia
  useEffect(() => {
    // Comprobar si el contenido de initialVectors realmente ha cambiado
    // para evitar bucles si la referencia del array cambia pero el contenido es el mismo.
    const currentInitialVectorsString = JSON.stringify(initialVectors);
    if (currentInitialVectorsString === prevInitialVectorsRef.current) {
      return; // El contenido no ha cambiado, no hacer nada.
    }
    prevInitialVectorsRef.current = currentInitialVectorsString;

    setAnimatedVectors(initialVectors.map(item => ({
      ...item,
      animationState: { ...(item.animationState || {}) },
      // Asegurar que previousAngle y targetAngle existen si se usan en cálculos antes del primer frame
      previousAngle: item.previousAngle ?? item.initialAngle,
      targetAngle: item.targetAngle ?? item.initialAngle,
    })));
    lastFrameTimeRef.current = performance.now(); // Resetear tiempo para deltaCálculos
  }, [initialVectors]); // El efecto se ejecuta si la referencia de initialVectors cambia

  // Efecto para el BUCLE DE ANIMACIÓN
  useEffect(() => {
    if (animatedVectors.length === 0) {
      // Si hay un frame de animación en curso debido a un cambio anterior, cancelarlo.
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return; // No iniciar bucle si no hay vectores listos
    }

    const animate = (currentTime: number) => {
      if (settingsRef.current.isPaused) {
        animationFrameId.current = requestAnimationFrame(animate); // Seguir solicitando para poder reanudar
        return;
      }

      const currentSettings = settingsRef.current;
      const currentDimensions = dimensionsRef.current;
      const currentMousePos = mousePosRef.current;
      const currentPulseStartTime = pulseStartTimeRef.current;
      const timeScale = currentSettings.timeScale ?? 1.0;

      // Delta time (opcional, pero puede ser útil para animaciones basadas en física)
      const deltaTime = (currentTime - lastFrameTimeRef.current) * timeScale / 1000; // en segundos
      lastFrameTimeRef.current = currentTime;

      let allOverallPulsesCompleted = true;

      setAnimatedVectors(prevItems => {
        const newItems = prevItems.map(item => {
          const newItem = { ...item }; // Clonar para mutación segura
          
          // Determinar el ángulo objetivo según el tipo de animación
          let targetAngle = newItem.currentAngle;
          let targetLengthFactor = newItem.lengthFactor;
          let targetWidthFactor = newItem.widthFactor;
          let targetIntensityFactor = newItem.intensityFactor ?? 1;
          
          switch (currentSettings.animationType as AnimationType) {
            case 'smoothWaves':
              targetAngle = calculateTargetAngle_SmoothWaves(
                newItem, 
                currentTime, 
                currentSettings.animationProps, 
                timeScale
              );
              break;
            case 'mouseInteraction':
              if (currentMousePos) {
                targetAngle = calculateTargetAngle_MouseInteraction(
                  newItem, 
                  currentMousePos, 
                  currentSettings.animationProps
                );
              }
              break;
            case 'directionalFlow': {
              // Usar la nueva función modular de flujo direccional
              const flowResult = calculateDirectionalFlow(
                newItem,
                currentTime,
                currentSettings.animationProps as DirectionalFlowProps
              );
              targetAngle = flowResult.angle ?? targetAngle;
              targetLengthFactor = flowResult.lengthFactor ?? targetLengthFactor;
              break;
            }
            case 'vortex': {
              // Usar la función de vórtice si hay dimensiones disponibles
              if (currentDimensions) {
                const vortexResult = calculateVortex(
                  newItem,
                  currentTime,
                  currentSettings.animationProps as VortexProps,
                  currentDimensions
                );
                targetAngle = vortexResult.angle ?? targetAngle;
                targetLengthFactor = vortexResult.lengthFactor ?? targetLengthFactor;
              }
              break;
            }
            case 'flocking': {
              // La animación de flocking necesita acceso a todos los vectores
              const flockingResult = calculateFlocking(
                newItem,
                currentTime,
                currentSettings.animationProps as FlockingProps,
                prevItems // Usar los vectores del frame anterior
              );
              targetAngle = flockingResult.angle ?? targetAngle;
              targetLengthFactor = flockingResult.lengthFactor ?? targetLengthFactor;
              break;
            }  
            case 'centerPulse':
              // Solo como ejemplo, normalmente reemplazado por logic de pulse
              // const pulseResult = calculateTargetAngle_CenterPulse(newItem, currentTime, pulseStartTimeRef.current || 0, currentDimensions, currentSettings.animationProps);
              // targetAngle = pulseResult.angle;
              // if (pulseResult.lengthFactor) targetLengthFactor = pulseResult.lengthFactor;
              // if (pulseResult.widthFactor) targetWidthFactor = pulseResult.widthFactor;
              break;
            case 'perlinFlow':
              // Implementación pendiente - podría usar una librería de ruido Perlin
              // targetAngle = calculateTargetAngle_PerlinNoise(newItem, currentTime, currentSettings.animationProps);
              break;
            case 'staticAngle': {
              // Simplemente establece todos los vectores al mismo ángulo fijo
              const { angle = 0 } = currentSettings.animationProps || {};
              targetAngle = angle;
              break;
            }
            case 'randomLoop': {
              // Cambiar ángulos aleatoriamente a intervalos definidos
              const { intervalMs = 2000, transitionDurationFactor = 0.5 } = currentSettings.animationProps || {};
              
              // Inicializar estado si no existe
              if (!newItem.animationState || !newItem.animationState.nextRandomTime) {
                newItem.animationState = {
                  nextRandomTime: currentTime + Math.random() * intervalMs,
                  targetAngle: Math.random() * 360,
                  previousAngle: newItem.currentAngle
                };
              }
              
              // Verificar si es tiempo de cambiar a un nuevo ángulo aleatorio
              if (currentTime >= newItem.animationState.nextRandomTime) {
                newItem.animationState.previousAngle = newItem.animationState.targetAngle;
                newItem.animationState.targetAngle = Math.random() * 360;
                newItem.animationState.nextRandomTime = currentTime + intervalMs;
              }
              
              // Interpolar hacia el ángulo objetivo basado en el tiempo
              const timeInTransition = Math.min(intervalMs * transitionDurationFactor, 
                                              currentTime - (newItem.animationState.nextRandomTime - intervalMs));
              const transitionProgress = timeInTransition / (intervalMs * transitionDurationFactor);
              
              if (transitionProgress < 1) {
                targetAngle = interpolateAngle(
                  newItem.animationState.previousAngle,
                  newItem.animationState.targetAngle,
                  easingFunctions.easeInOutQuad(transitionProgress)
                );
              } else {
                targetAngle = newItem.animationState.targetAngle;
              }
              break;
            }
            // Otros tipos de animación pendientes de implementar
            // case 'lissajous':
            // case 'seaWaves':
            // case 'tangenteClasica':
            // case 'geometricPattern':
            case 'none':
            default:
              targetAngle = newItem.initialAngle; // Volver al ángulo inicial o mantener actual
              break;
          }

          // Aplicar animación de pulso si está activa
          if (currentPulseStartTime && currentSettings.animationProps?.pulse && currentDimensions) {
            const pulseResult = applyPulseToVector(
              newItem, 
              currentPulseStartTime, 
              currentTime, 
              currentSettings.animationProps.pulse, 
              timeScale,
              currentDimensions // Pasar dimensiones para cálculos de pulso basados en el centro
            );
            targetAngle = pulseResult.angle ?? targetAngle;
            targetLengthFactor = pulseResult.lengthFactor ?? targetLengthFactor;
            targetIntensityFactor = pulseResult.intensityFactor ?? targetIntensityFactor;
            targetWidthFactor = pulseResult.widthFactor ?? targetWidthFactor;

            if (!pulseResult.pulseCompletedThisFrame) {
              allOverallPulsesCompleted = false;
            }
            if (pulseResult.pulseCompletedForThisVector && onPulseCompleteRef.current) {
              onPulseCompleteRef.current(newItem.id);
            }
          }

          // Suavizar la transición al ángulo y longitud objetivo
          const easing = currentSettings.easingFactor ?? 0.1;
          newItem.currentAngle = interpolateAngle(newItem.currentAngle, targetAngle, easing * (deltaTime * 60)); // Ajustar easing por deltaTime
          
          if (currentSettings.dynamicLengthEnabled) {
            newItem.lengthFactor = interpolateValue(newItem.lengthFactor ?? 1, targetLengthFactor, easing * (deltaTime * 60));
          }
          if (currentSettings.dynamicWidthEnabled) {
            newItem.widthFactor = interpolateValue(newItem.widthFactor ?? 1, targetWidthFactor, easing * (deltaTime * 60));
          }
          if (currentSettings.dynamicIntensity) {
            newItem.intensityFactor = interpolateValue(newItem.intensityFactor ?? 1, targetIntensityFactor, easing * (deltaTime * 60));
          }

          return newItem;
        });

        // Comprobación drástica: solo actualizar si el contenido realmente cambió.
        // Esto es para romper bucles donde el estado se establece con contenido idéntico.
        // Considerar implicaciones de rendimiento si se mantiene a largo plazo.
        if (JSON.stringify(newItems) === JSON.stringify(prevItems)) {
          return prevItems;
        }
        return newItems;
      });

      if (currentPulseStartTime && allOverallPulsesCompleted && onAllPulsesCompleteRef.current) {
        onAllPulsesCompleteRef.current();
        pulseStartTimeRef.current = null; // Resetear para que no se vuelva a llamar hasta el próximo trigger
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null; // Importante para evitar doble cancelación o confusión
      }
    };
  }, [animatedVectors.length]); // Depender de animatedVectors.length
                                 // para reiniciar el efecto si la cantidad de vectores cambia (ej. de 0 a N o N a 0)
                                 // Las demás dependencias (settings, dimensions, mousePos, etc.) se manejan vía refs
                                 // para no recrear 'animate' en cada cambio de prop, solo cuando es estructuralmente necesario.

  return { animatedVectors, setAnimatedVectors }; // Devuelve setAnimatedVectors si es necesario externamente
};
