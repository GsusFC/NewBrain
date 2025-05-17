/**
 * Definiciones de tipos para el sistema de animaciones
 * Centraliza todas las interfaces y tipos utilizados en el sistema
 */

// Importar tipos desde types para mantener una sola fuente de verdad
import type { AnimatedVectorItem, VectorDimensions } from '../types';

export type { AnimatedVectorItem, VectorDimensions };

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
interface BaseAnimationSettings {
  type: AnimationType;
  baseSpeed: number;
  canvasWidth: number;
  canvasHeight: number;
  mouseX: number | null;
  mouseY: number | null;
  isMouseDown: boolean;
  resetOnTypeChange: boolean;
  seed: number;
  colorTransition: boolean;
  lengthTransition: boolean;
  angleTransition: boolean;
  deltaTime?: number;
}

export interface AnimationSettings extends Partial<BaseAnimationSettings> {
  [key: string]: unknown;
}

/**
 * Valores por defecto para AnimationSettings
 */
export const DEFAULT_ANIMATION_SETTINGS: Omit<BaseAnimationSettings, 'type'> = {
  baseSpeed: 1.0,
  canvasWidth: 0,
  canvasHeight: 0,
  mouseX: null,
  mouseY: null,
  isMouseDown: false,
  resetOnTypeChange: true,
  seed: 0,
  colorTransition: true,
  lengthTransition: true,
  angleTransition: true
};

/**
 * Normaliza la configuración de animación aplicando valores por defecto
 */
export function normalizeAnimationSettings(
  settings: AnimationSettings
): BaseAnimationSettings & Record<string, unknown> {
  return {
    ...DEFAULT_ANIMATION_SETTINGS,
    ...settings,
    type: settings.type! // type es requerido en AnimationSettings
  } as BaseAnimationSettings & Record<string, unknown>;
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
/**
 * Estructura de resultado para cálculos de animación
 */
export interface AnimationCalculation {
  angle: number;
  lengthFactor?: number;
  widthFactor?: number;
  intensityFactor?: number;
}

/**
 * Estado interno para animaciones de comportamiento en bandada
 */
export interface FlockingAnimationState {
  velocityX: number;
  velocityY: number;
  lastNeighborIds?: string[];
}

/**
 * Función para actualizar un vector individual
 */
export type UpdateFunction = <T extends AnimatedVectorItem>(
  item: T,
  index: number,
  timestamp: number,
  settings: AnimationSettings,
  dimensions: VectorDimensions,
  allVectors?: T[]
) => T;

/**
 * Mapa de funciones de actualización por tipo de animación
 */
export type UpdateFunctionMap = Record<AnimationType, UpdateFunction | null>;

/**
 * Unión de todas las interfaces de propiedades de animación
 */
export type AnimationPropsMap = {
  none: {};
  smoothWaves: SmoothWavesProps;
  seaWaves: SeaWavesProps;
  mouseInteraction: MouseInteractionProps;
  directionalFlow: DirectionalFlowProps;
  flocking: FlockingProps;
  vortex: VortexProps;
  lissajous: LissajousProps;
  perlinFlow: PerlinFlowProps;
  randomLoop: RandomLoopProps;
  centerPulse: CenterPulseProps;
};

/**
 * Obtiene el tipo de propiedades para un tipo de animación específico
 */
export type AnimationPropsForType<T extends AnimationType> = T extends keyof AnimationPropsMap
  ? AnimationPropsMap[T]
  : never;

/**
 * Todas las propiedades de animación posibles
 */
export type AnyAnimationProps = AnimationPropsMap[Exclude<keyof AnimationPropsMap, 'none'>];
