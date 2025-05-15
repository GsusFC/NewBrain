import { AnimatedVectorItem, VectorDimensions } from '../types';
import { 
  LissajousProps,
  SeaWavesProps,
  PerlinFlowProps,
  RandomLoopProps,
  AnimationCalculation
} from './animationTypes';

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
  
  // Calculamos dimensiones aproximadas basadas en la posición del vector
  // Evitamos problemas si baseX o baseY son undefined
  const baseX = item.baseX || 0;
  const baseY = item.baseY || 0;
  const parentWidth = baseX * 2; // Estimación aproximada de las dimensiones
  const parentHeight = baseY * 2; // Estimación aproximada de las dimensiones
  
  // Normaliza la posición del vector entre 0 y 1
  // Evitamos divisiones por cero
  const normalizedX = parentWidth !== 0 ? baseX / parentWidth : 0;
  const normalizedY = parentHeight !== 0 ? baseY / parentHeight : 0;
  
  // Componente temporal (avanza con el tiempo)
  const timeComponent = timestamp * 0.001 * timeSpeed;
  
  // Ecuaciones de Lissajous
  const xComponent = Math.sin((normalizedX + timeComponent) * xFrequency * Math.PI + phaseOffset);
  const yComponent = Math.cos((normalizedY + timeComponent) * yFrequency * Math.PI);
  
  // Calcula el ángulo basado en las componentes
  const angle = Math.atan2(yComponent * yAmplitude, xComponent * xAmplitude) * (180 / Math.PI);
  
  // El factor de longitud puede variar según la posición en la curva
  const magnitude = Math.sqrt(
    (xComponent * xAmplitude) ** 2 + 
    (yComponent * yAmplitude) ** 2
  ) / Math.sqrt(xAmplitude ** 2 + yAmplitude ** 2);
  
  const lengthFactor = 0.8 + magnitude * 0.4; // Entre 0.8 y 1.2
  
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
  
  // Posición espacial
  // Nos aseguramos de que no sean undefined
  const baseX = item.baseX || 0;
  const baseY = item.baseY || 0;
  const xFactor = baseX * spatialFactor;
  const yFactor = baseY * spatialFactor;
  
  // Componente temporal
  const timeComponent = timestamp * baseFrequency;
  
  // Onda base (movimiento principal de las olas)
  const baseWave = Math.sin(timeComponent + xFactor * 1.5 - yFactor * 0.5) * baseAmplitude;
  
  // Componente de ondulación (pequeñas olas en la superficie)
  const rippleComponent = timestamp * rippleFrequency;
  const rippleWave = Math.sin(rippleComponent + xFactor * 3 + yFactor) * rippleAmplitude;
  
  // Choppiness (asimetría en las crestas de las olas - efecto más natural)
  let waveAngle = baseWave + rippleWave;
  if (choppiness > 0) {
    // Añadir asimetría basada en la posición de la ola
    const phasePosition = (Math.sin(timeComponent + xFactor * 1.5 - yFactor * 0.5) + 1) / 2; // 0 a 1
    waveAngle += phasePosition > 0.7 ? (phasePosition - 0.7) * 20 * choppiness : 0;
  }
  
  // Factor de longitud basado en la posición de la ola
  // Las olas son más largas en las crestas y más cortas en los valles
  const wavePosition = (Math.sin(timeComponent + xFactor) + 1) / 2; // 0 a 1
  const lengthFactor = 0.8 + wavePosition * 0.4;
  
  // El ancho también puede variar con la posición de la ola
  const widthFactor = 0.9 + wavePosition * 0.2;
  
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
    noiseScale = 0.005,
    timeEvolutionSpeed = 0.0002,
    angleMultiplier = 360
  } = props;
  
  // Implementamos una aproximación de ruido Perlin usando múltiples funciones seno
  // con frecuencias y fases diferentes (no es ruido Perlin puro, pero visual y
  // computacionalmente eficiente para este caso de uso)
  
  // Coordenadas en el espacio del ruido
  const nx = item.baseX * noiseScale;
  const ny = item.baseY * noiseScale;
  const nt = timestamp * timeEvolutionSpeed;
  
  // Combinamos varias funciones seno con diferentes frecuencias y fases
  // para simular ruido Perlin
  const noise = (
    Math.sin(nx * 10 + ny * 8 + nt) * 0.5 +
    Math.sin(nx * 21 + ny * 13.5 + nt * 1.3) * 0.25 +
    Math.sin(nx * 43 + ny * 29 + nt * 0.7) * 0.125 +
    Math.sin(nx * 87 - ny * 53 + nt * 1.5) * 0.0625
  ) / 0.9375; // Normalizar a [-1, 1]
  
  // Convertimos el ruido a un ángulo
  const angle = noise * (angleMultiplier as number);
  
  // El factor de longitud puede variar según el valor del ruido
  // Valores más altos = vectores más largos
  const lengthFactor = 0.8 + ((noise + 1) / 2) * 0.4; // Entre 0.8 y 1.2
  
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
  
  // El factor de intensidad puede variar con la posición
  const intensityFactor = 0.8 + Math.abs(Math.sin(nx + timeComponent)) * 0.4;
  
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
