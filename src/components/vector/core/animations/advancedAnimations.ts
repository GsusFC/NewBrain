import { AnimatedVectorItem, VectorDimensions } from '../types';
import { 
  LissajousProps,
  SeaWavesProps,
  PerlinFlowProps,
  RandomLoopProps,
  AnimationCalculation
} from './animationTypes';
import { fixPrecision } from '@/utils/precision';

// Para detección temprana de problemas según TDD
const assert = (condition: boolean, message: string): void => {
  if (!condition && process.env.NODE_ENV !== 'production') {
    console.error(`[Assertion Error] ${message}`);
  }
};

/**
 * Calcula el ángulo para la animación de curvas Lissajous
 * Patrones paramétricos basados en funciones seno y coseno
 */
export const calculateLissajous = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: LissajousProps
): AnimationCalculation => {
  const {
    xFrequency = 1.0,
    yFrequency = 2.0,
    xAmplitude = 20,
    yAmplitude = 20,
    phaseOffset = 0,
    timeSpeed = 1.0
  } = props;
  
  // Calculamos dimensiones aproximadas basadas en la posición del vector con precisión controlada
  // Evitamos problemas si baseX o baseY son undefined
  const baseX = fixPrecision(item.baseX || 0, 2);
  const baseY = fixPrecision(item.baseY || 0, 2);
  const parentWidth = fixPrecision(baseX * 2, 2); // Estimación aproximada de las dimensiones
  const parentHeight = fixPrecision(baseY * 2, 2); // Estimación aproximada de las dimensiones
  
  // Normaliza la posición del vector entre 0 y 1 con precisión controlada
  // Evitamos divisiones por cero
  const normalizedX = fixPrecision(parentWidth !== 0 ? baseX / parentWidth : 0, 4);
  const normalizedY = fixPrecision(parentHeight !== 0 ? baseY / parentHeight : 0, 4);
  
  // Verificar que las posiciones normalizadas son válidas
  assert(normalizedX >= 0 && normalizedX <= 1, `Posición X normalizada fuera de rango: ${normalizedX}`);
  assert(normalizedY >= 0 && normalizedY <= 1, `Posición Y normalizada fuera de rango: ${normalizedY}`);
  
  // Componente temporal con precisión controlada
  const timeComponent = fixPrecision(timestamp * 0.001 * timeSpeed, 4);
  
  // Ecuaciones de Lissajous con precisión controlada
  const xFreqPi = fixPrecision(xFrequency * Math.PI, 6);
  const yFreqPi = fixPrecision(yFrequency * Math.PI, 6);
  
  const xArgument = fixPrecision((normalizedX + timeComponent) * xFreqPi + phaseOffset, 6);
  const yArgument = fixPrecision((normalizedY + timeComponent) * yFreqPi, 6);
  
  const xComponent = fixPrecision(Math.sin(xArgument), 6);
  const yComponent = fixPrecision(Math.cos(yArgument), 6);
  
  // Calcula el ángulo basado en las componentes con precisión controlada
  const xScaled = fixPrecision(xComponent * xAmplitude, 4);
  const yScaled = fixPrecision(yComponent * yAmplitude, 4);
  const angleRad = fixPrecision(Math.atan2(yScaled, xScaled), 6);
  const angle = fixPrecision(angleRad * (180 / Math.PI), 4);
  
  // El factor de longitud puede variar según la posición en la curva, con precisión controlada
  const xSquared = fixPrecision((xComponent * xAmplitude) ** 2, 4);
  const ySquared = fixPrecision((yComponent * yAmplitude) ** 2, 4);
  const numerator = fixPrecision(Math.sqrt(xSquared + ySquared), 4);
  
  const denominatorSquared = fixPrecision(xAmplitude ** 2 + yAmplitude ** 2, 4);
  const denominator = fixPrecision(Math.sqrt(denominatorSquared), 4);
  
  // Evitar división por cero
  assert(denominator > 0, `Denominador para cálculo de magnitud es cero`);
  const magnitude = fixPrecision(numerator / denominator, 4);
  
  const lengthFactor = fixPrecision(0.8 + magnitude * 0.4, 4); // Entre 0.8 y 1.2
  
  return { 
    angle,
    lengthFactor
  };
};

/**
 * Calcula el ángulo para la animación de olas marinas
 * Simula movimientos de olas con componentes de frecuencia base y ondulación
 */
export const calculateSeaWaves = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: SeaWavesProps
): AnimationCalculation => {
  const {
    baseFrequency = 0.0004,
    baseAmplitude = 25,
    rippleFrequency = 0.001,
    rippleAmplitude = 10,
    choppiness = 0.3,
    spatialFactor = 0.01
  } = props;
  
  // Posición espacial con precisión controlada
  // Nos aseguramos de que no sean undefined
  const baseX = fixPrecision(item.baseX || 0, 2);
  const baseY = fixPrecision(item.baseY || 0, 2);
  const xFactor = fixPrecision(baseX * spatialFactor, 4);
  const yFactor = fixPrecision(baseY * spatialFactor, 4);
  
  // Componente temporal con precisión controlada
  const timeComponent = fixPrecision(timestamp * baseFrequency, 4);
  
  // Onda base (movimiento principal de las olas) con precisión controlada
  const baseWaveArg = fixPrecision(timeComponent + xFactor * 1.5 - yFactor * 0.5, 6);
  const baseWaveSin = fixPrecision(Math.sin(baseWaveArg), 6);
  const baseWave = fixPrecision(baseWaveSin * baseAmplitude, 4);
  
  // Componente de ondulación (pequeñas olas en la superficie) con precisión controlada
  const rippleComponent = fixPrecision(timestamp * rippleFrequency, 4);
  const rippleArg = fixPrecision(rippleComponent + xFactor * 3 + yFactor, 6);
  const rippleSin = fixPrecision(Math.sin(rippleArg), 6);
  const rippleWave = fixPrecision(rippleSin * rippleAmplitude, 4);
  
  // Combinar ondas con precisión controlada
  let waveAngle = fixPrecision(baseWave + rippleWave, 4);
  
  // Choppiness (asimetría en las crestas de las olas - efecto más natural)
  if (choppiness > 0) {
    // Añadir asimetría basada en la posición de la ola con precisión controlada
    const phaseArg = fixPrecision(timeComponent + xFactor * 1.5 - yFactor * 0.5, 6);
    const phaseSin = fixPrecision(Math.sin(phaseArg), 6);
    const phasePosition = fixPrecision((phaseSin + 1) / 2, 4); // Normalizado de 0 a 1
    
    // Aplicar choppiness solo en crestas de olas (cuando phasePosition > 0.7)
    if (phasePosition > 0.7) {
      const choppyOffset = fixPrecision((phasePosition - 0.7) * 20 * choppiness, 4);
      waveAngle = fixPrecision(waveAngle + choppyOffset, 4);
    }
  }
  
  // Factor de longitud basado en la posición de la ola con precisión controlada
  // Las olas son más largas en las crestas y más cortas en los valles
  const wavePositionArg = fixPrecision(timeComponent + xFactor, 6);
  const wavePositionSin = fixPrecision(Math.sin(wavePositionArg), 6);
  const wavePosition = fixPrecision((wavePositionSin + 1) / 2, 4); // Normalizado de 0 a 1
  
  // Verificar que la posición está en el rango esperado
  assert(wavePosition >= 0 && wavePosition <= 1, 
         `Posición de ola fuera de rango: ${wavePosition}`);
  
  // Calcular factores con precisión controlada
  const lengthFactor = fixPrecision(0.8 + wavePosition * 0.4, 4);
  const widthFactor = fixPrecision(0.9 + wavePosition * 0.2, 4);
  
  return {
    angle: 180 + waveAngle, // Añade 180 para que apunte en la dirección contraria al origen
    lengthFactor,
    widthFactor
  };
};

/**
 * Calcula el ángulo para la animación basada en ruido Perlin
 * Crea patrones de flujo orgánicos y naturales
 */
export const calculatePerlinFlow = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: PerlinFlowProps
): AnimationCalculation => {
  const {
    noiseScale = 0.01,
    timeEvolutionSpeed = 0.0001,
    angleMultiplier = 180
  } = props;
  
  // Asegurarnos de que las coordenadas existen con precisión controlada
  const baseX = fixPrecision(item.baseX || 0, 2);
  const baseY = fixPrecision(item.baseY || 0, 2);
  
  // Componente temporal para evolución del ruido con precisión controlada
  const timeComponent = fixPrecision(timestamp * timeEvolutionSpeed, 4);
  
  // Calcular argumentos para funciones trigonométricas con precisión controlada
  const sinArgX = fixPrecision(baseX * noiseScale + timeComponent * 0.7, 6);
  const cosArgX = fixPrecision(baseY * noiseScale + timeComponent * 1.3, 6);
  const sinArgY = fixPrecision(baseY * noiseScale + timeComponent, 6);
  const cosArgY = fixPrecision(baseX * noiseScale + timeComponent * 1.1, 6);
  
  // Calcular componentes de ruido con precisión controlada
  const sinX = fixPrecision(Math.sin(sinArgX), 6);
  const cosX = fixPrecision(Math.cos(cosArgX), 6);
  const sinY = fixPrecision(Math.sin(sinArgY), 6);
  const cosY = fixPrecision(Math.cos(cosArgY), 6);
  
  // Simulación simple de ruido Perlin para demostración con precisión controlada
  const noiseX = fixPrecision(sinX * cosX, 6);
  const noiseY = fixPrecision(sinY * cosY, 6);
  
  // Calcular el ángulo en radianes basado en el vector de flujo con precisión controlada
  const angleRad = fixPrecision(Math.atan2(noiseY, noiseX), 6);
  // Convertir a grados y asegurar que esté en el rango [0, 360)
  let angle = fixPrecision((angleRad * 180 / Math.PI) * angleMultiplier, 4);
  // Normalizar el ángulo al rango [0, 360)
  angle = ((angle % 360) + 360) % 360;
  
  // Calcular la magnitud del vector de flujo para variar el factor de longitud con precisión controlada
  const noiseSq = fixPrecision(noiseX * noiseX + noiseY * noiseY, 6);
  const magnitude = fixPrecision(Math.sqrt(noiseSq), 4);
  const lengthFactor = fixPrecision(0.8 + magnitude * 0.4, 4); // Entre 0.8 y 1.2
  
  // Verificar que los valores calculados son válidos
  assert(isFinite(angle), `Ángulo con valor no válido: ${angle}`);
  assert(angle >= 0 && angle < 360, `Ángulo fuera de rango: ${angle}`);
  assert(isFinite(lengthFactor) && lengthFactor > 0, 
         `Factor de longitud no válido: ${lengthFactor}`);
  
  return {
    angle,
    lengthFactor
  };
};

/**
 * Calcula el ángulo para la animación de bucles aleatorios
 * Los vectores cambian periódicamente a nuevos ángulos aleatorios
 */
export const calculateRandomLoop = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: RandomLoopProps
): AnimationCalculation => {
  const {
    intervalMs = 3000,
    transitionDurationFactor = 0.3 // Proporción de intervalMs para la transición
  } = props;
  
  // Inicializar el estado de animación si no existe
  if (!item.animationState) {
    item.animationState = {
      nextRandomTime: timestamp + Math.random() * intervalMs, // Desincronizar los vectores
      targetAngle: Math.random() * 360,
      previousAngle: item.currentAngle
    };
  }
  
  // Obtenemos el estado actual y tipamos correctamente
  const state = item.animationState as { 
    nextRandomTime: number; 
    targetAngle: number; 
    previousAngle?: number;
  };
  
  // Verificar si es hora de generar un nuevo ángulo aleatorio
  if (timestamp >= state.nextRandomTime) {
    state.previousAngle = state.targetAngle;
    state.targetAngle = Math.random() * 360;
    state.nextRandomTime = timestamp + intervalMs;
  }
  
  // Calcular la interpolación entre el ángulo anterior y el objetivo
  const transitionDuration = intervalMs * transitionDurationFactor;
  const timeSinceLastChange = timestamp - (state.nextRandomTime - intervalMs);
  
  let progress = Math.min(timeSinceLastChange / transitionDuration, 1);
  
  // Aplicar función de suavizado (easing)
  progress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Easing in-out quad
  
  // Interpolar entre el ángulo anterior y el objetivo
  let angle = state.previousAngle! + progress * ((state.targetAngle - state.previousAngle!) % 360);
  
  // Asegurar que el ángulo esté en el rango [0, 360)
  angle = (angle + 360) % 360;
  
  return { angle };
};

/**
 * Calcula el ángulo para la animación "Tangente Clásica"
 * Implementa un patrón de tangentes matemáticas con variaciones
 */
export const calculateTangenteClasica = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: Record<string, unknown>
): AnimationCalculation => {
  const {
    frequency = 0.0005,
    amplitude = 30,
    baseAngle = 0,
    spatialScale = 0.01,
    curvature = 0.5
  } = props;
  
  // Asegurarnos de que todos los valores sean números
  const frequencyNum = Number(frequency);
  const spatialScaleNum = Number(spatialScale);
  const baseAngleNum = Number(baseAngle);
  const amplitudeNum = Number(amplitude);
  const curvatureNum = Number(curvature);
  
  // Posición normalizada del vector
  // Nos aseguramos de que baseX y baseY no sean undefined
  const baseX = item.baseX || 0;
  const baseY = item.baseY || 0;
  const nx = (baseX * spatialScaleNum) % (2 * Math.PI);
  const ny = (baseY * spatialScaleNum) % (2 * Math.PI);
  
  // Componente temporal
  const timeComponent = timestamp * frequencyNum;
  
  // Calcular tangente con un factor de curvatura ajustable
  const tanValue = Math.tan(nx + ny + timeComponent * Math.PI * curvatureNum);
  
  // Limitar los valores extremos de la tangente
  const clampedTan = Math.max(-3, Math.min(3, tanValue));
  
  // Convertir a ángulo
  const angle = baseAngleNum + clampedTan * amplitudeNum;
  
  // Añadir un efecto de intensidad que varía con el ruido, con precisión controlada
  const intensityFactor = fixPrecision(0.7 + Math.abs(Math.sin(nx + timeComponent)) * 0.5, 4);
  
  return {
    angle,
    intensityFactor
  };
};

/**
 * Calcula el ángulo para la animación de patrones geométricos
 * Crea patrones basados en formas geométricas como círculos, espirales, etc.
 */
export const calculateGeometricPattern = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: Record<string, unknown>,
  dimensions: VectorDimensions
): AnimationCalculation => {
  const {
    pattern = 'spiral',
    rotationSpeed = 0.0001,
    intensity = 1.0,
    centerX,
    centerY
  } = props;
  
  // Asegurarnos de que todos los valores sean números
  const rotationSpeedNum = Number(rotationSpeed);
  const intensityNum = Number(intensity);
  // Convertimos a number pero mantenemos undefined como undefined
  const centerXNum = centerX !== undefined ? Number(centerX) : undefined;
  const centerYNum = centerY !== undefined ? Number(centerY) : undefined;
  
  // Determinar el centro del patrón (usar el centro de la cuadrícula si no se especifica)
  const center = {
    x: centerXNum !== undefined ? centerXNum : dimensions.width / 2,
    y: centerYNum !== undefined ? centerYNum : dimensions.height / 2
  };
  
  // Posición relativa al centro
  const baseX = item.baseX || 0;
  const baseY = item.baseY || 0;
  const dx = baseX - center.x;
  const dy = baseY - center.y;
  
  // Distancia y ángulo polar desde el centro
  const distance = Math.sqrt(dx * dx + dy * dy);
  const polarAngle = Math.atan2(dy, dx);
  
  // Componente temporal
  const timeComponent = timestamp * rotationSpeedNum;
  
  let angle;
  let lengthFactor = 1.0;
  
  switch(pattern) {
    case 'spiral': {
      // Espiral: el ángulo depende de la distancia al centro
      angle = (polarAngle + distance * 0.01) * (180 / Math.PI) + timeComponent * 10;
      lengthFactor = 0.5 + (distance / (dimensions.width / 2)) * 0.5;
      break;
    }
      
    case 'concentric': {
      // Círculos concéntricos: los ángulos son tangentes a círculos
      angle = (polarAngle + Math.PI / 2) * (180 / Math.PI) + timeComponent * 20;
      break;
    }
      
    case 'radial': {
      // Patrón radial: los vectores apuntan hacia/desde el centro
      angle = polarAngle * (180 / Math.PI);
      // Alternar entre hacia dentro y hacia fuera
      if (Math.sin(distance * 0.05 + timeComponent * 5) > 0) {
        angle += 180;
      }
      break;
    }
      
    case 'grid': {
      // Patrón de cuadrícula: alterna horizontal y vertical
      // Obtenemos la información de la celda
      const gridSize = 50; // Tamaño de las celdas
      // Nos aseguramos de que baseX y baseY no sean undefined
      const baseX = item.baseX || 0;
      const baseY = item.baseY || 0;
      const cellX = Math.floor(baseX / gridSize);
      const cellY = Math.floor(baseY / gridSize);
      
      // Alternar entre horizontal y vertical
      if ((cellX + cellY) % 2 === 0) {
        angle = 0 + Math.sin(timeComponent * 10) * 10;
      } else {
        angle = 90 + Math.sin(timeComponent * 10) * 10;
      }
      break;
    }
      
    default:
      angle = (polarAngle * (180 / Math.PI) + timeComponent * 30) % 360;
  }
  
  // Aplicar factor de intensidad
  const intensityFactor = 0.7 + ((Math.sin(timeComponent * 5) + 1) / 2) * 0.3 * intensityNum;
  
  return {
    angle,
    lengthFactor,
    intensityFactor
  };
};
