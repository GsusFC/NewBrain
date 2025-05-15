// Estas interfaces son requeridas para la tipificación
// aunque el IDE pueda marcarlas como no utilizadas
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { VectorDimensions } from '../types';

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

export interface CenterPulseProps {
  pulseDuration?: number;
  pulseCenter?: { x: number, y: number };
  maxDistanceFactor?: number;
  pulsePropagationSpeed?: number;
  maxAngleDisplacement?: number;
  maxLengthFactor?: number;
  affectAngle?: boolean;
  
  // Nuevas propiedades para pulso continuo
  continuousMode?: boolean;    // Activar modo continuo
  pulseInterval?: number;      // Intervalo entre pulsos en ms (solo en modo continuo)
  fadeOutFactor?: number;      // Qué tanto se desvanece cada pulso (0-1)
  maxActivePulses?: number;    // Número máximo de pulsos activos simultáneamente
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
  | CenterPulseProps
  | Record<string, unknown>; // Reemplazamos any por unknown para mayor seguridad

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
