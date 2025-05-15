/**
 * Definiciones de tipos para el sistema de animaciones
 * Centraliza todas las interfaces y tipos utilizados en el sistema
 */

/**
 * Item vectorial con estado de animación
 */
export interface AnimatedVectorItem {
  id: string;
  x: number;
  y: number;
  angle: number;
  length: number;
  originalLength: number;
  color: string;
  originalColor: string;
  userData?: Record<string, unknown>;
}

/**
 * Tipos de animación soportados
 */
export type AnimationType =
  | 'none'
  | 'smoothWaves'
  | 'seaWaves'
  | 'mouseInteraction'
  | 'directionalFlow'
  | 'flocking'
  | 'vortex'
  | 'lissajous'
  | 'perlinFlow'
  | 'randomLoop'
  | 'centerPulse';

/**
 * Configuración global de la animación
 */
export interface AnimationSettings {
  type: AnimationType;
  baseSpeed: number;
  canvasWidth: number;
  canvasHeight: number;
  mouseX: number | null;
  mouseY: number | null;
  isMouseDown: boolean;
  seed?: number;
  colorTransition?: boolean;
  lengthTransition?: boolean;
  angleTransition?: boolean;
  resetOnTypeChange?: boolean;
  [key: string]: unknown;
}

/**
 * Propiedades para animación de ondas suaves
 */
export interface SmoothWavesProps {
  waveFrequency: number;
  waveAmplitude: number;
  baseAngle: number;
  patternScale: number;
  timeScale: number;
  waveType: 'linear' | 'circular';
  centerX: number;
  centerY: number;
}

/**
 * Propiedades para animación de ondas marinas
 */
export interface SeaWavesProps {
  baseFrequency: number;
  baseAmplitude: number;
  rippleFrequency: number;
  rippleAmplitude: number;
  choppiness: number;
  spatialFactor: number;
}

/**
 * Propiedades para interacción con el ratón
 */
export interface MouseInteractionProps {
  interactionRadius: number;
  effectType: 'attract' | 'repel' | 'rotate';
  effectStrength: number;
  falloffFactor: number;
}

/**
 * Propiedades para flujo direccional
 */
export interface DirectionalFlowProps {
  flowAngle: number;
  flowSpeed: number;
  turbulence: number;
}

/**
 * Propiedades para animación de comportamiento en banda (flocking)
 */
export interface FlockingProps {
  perceptionRadius: number;
  maxSpeed: number;
  separationForce: number;
  alignmentForce: number;
  cohesionForce: number;
  targetSeekingForce: number;
  targetX: number;
  targetY: number;
}

/**
 * Propiedades para animación de vórtice
 */
export interface VortexProps {
  vortexCenterX: number;
  vortexCenterY: number;
  strength: number;
  radiusFalloff: number;
  swirlDirection: 'clockwise' | 'counterclockwise';
}

/**
 * Propiedades para animación de curvas Lissajous
 */
export interface LissajousProps {
  xFrequency: number;
  yFrequency: number;
  xAmplitude: number;
  yAmplitude: number;
  phaseOffset: number;
  timeSpeed: number;
}



/**
 * Propiedades para flujo basado en ruido Perlin
 */
export interface PerlinFlowProps {
  noiseScale: number;
  timeEvolutionSpeed: number;
  angleMultiplier: number;
}

/**
 * Propiedades para animación de bucle aleatorio
 */
export interface RandomLoopProps {
  intervalMs: number;
  transitionDurationFactor: number;
}

/**
 * Propiedades para animación de pulso desde el centro
 */
export interface CenterPulseProps {
  pulseDuration: number;
  pulseCenter: { x: number; y: number };
  maxDistanceFactor: number;
  pulsePropagationSpeed: number;
  maxAngleDisplacement: number;
  maxLengthFactor: number;
  affectAngle: boolean;
  continuousMode: boolean;
  pulseInterval: number;
  fadeOutFactor: number;
  maxActivePulses?: number; // Límite de pulsos activos simultáneamente
}







/**
 * Función de actualización para un tipo de animación
 */
export type UpdateFunction = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: unknown,
  settings: AnimationSettings,
  allVectors?: AnimatedVectorItem[]
) => AnimatedVectorItem;

/**
 * Mapa de funciones de actualización por tipo de animación
 */
export type UpdateFunctionMap = Record<AnimationType, UpdateFunction | null>;
