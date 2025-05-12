import { AnimatedVectorItem, VectorDimensions } from '../types';

/**
 * Interfaces para las propiedades de animación
 * Cada tipo de animación tiene su propia interfaz específica
 */

export interface SmoothWavesProps {
  waveFrequency?: number;
  waveAmplitude?: number;
  waveSpeed?: number;
  baseAngle?: number;
  patternScale?: number;
  timeScale?: number;
  waveType?: 'circular' | 'linear' | 'diagonal';
  centerX?: number;
  centerY?: number;
}

export interface MouseInteractionProps {
  interactionRadius?: number;
  effectType?: 'attract' | 'repel' | 'align' | 'swirl';
  effectStrength?: number;
  falloffFactor?: number;
}

export interface DirectionalFlowProps {
  flowAngle?: number;
  flowSpeed?: number;
  turbulence?: number;
}

export interface FlockingProps {
  perceptionRadius?: number;
  maxSpeed?: number;
  separationForce?: number;
  alignmentForce?: number;
  cohesionForce?: number;
  targetSeekingForce?: number;
  targetX?: number;
  targetY?: number;
}

export interface VortexProps {
  vortexCenterX?: number;
  vortexCenterY?: number;
  strength?: number;
  radiusFalloff?: number;
  swirlDirection?: 'clockwise' | 'counterclockwise';
}

export interface LissajousProps {
  xFrequency?: number;
  yFrequency?: number;
  xAmplitude?: number;
  yAmplitude?: number;
  phaseOffset?: number;
  timeSpeed?: number;
}

export interface SeaWavesProps {
  baseFrequency?: number;
  baseAmplitude?: number;
  rippleFrequency?: number;
  rippleAmplitude?: number;
  choppiness?: number;
  spatialFactor?: number;
}

export interface PerlinFlowProps {
  noiseScale?: number;
  timeEvolutionSpeed?: number;
  angleMultiplier?: number;
}

export interface RandomLoopProps {
  intervalMs?: number;
  transitionDurationFactor?: number;
}

/**
 * Tipos para el estado interno de animación
 */
export interface FlockingAnimationState {
  velocityX: number;
  velocityY: number;
  lastNeighbors?: string[]; // IDs de los últimos vecinos
}

export interface RandomLoopAnimationState {
  nextRandomTime: number;
  targetAngle: number;
  previousAngle?: number;
}

/**
 * Tipo unión para todas las propiedades de animación
 */
export type AnimationProps = 
  | SmoothWavesProps
  | MouseInteractionProps
  | DirectionalFlowProps
  | FlockingProps
  | VortexProps
  | LissajousProps
  | SeaWavesProps
  | PerlinFlowProps
  | RandomLoopProps
  | Record<string, any>; // Fallback para compatibilidad

/**
 * Lista de tipos de animación disponibles
 */
export type AnimationType = 
  | 'none'
  | 'staticAngle'
  | 'randomStatic'
  | 'randomLoop'
  | 'smoothWaves'
  | 'seaWaves' 
  | 'perlinFlow'
  | 'mouseInteraction'
  | 'centerPulse'
  | 'directionalFlow'
  | 'flocking'
  | 'geometricPattern'
  | 'tangenteClasica'
  | 'lissajous'
  | 'vortex';

/**
 * Interfaz unificada para funciones de cálculo de ángulo
 */
export interface AnimationCalculation {
  angle?: number;
  lengthFactor?: number;
  widthFactor?: number;
  intensityFactor?: number;
}
