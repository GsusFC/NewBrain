/**
 * Propiedades predeterminadas para todas las animaciones
 * Centraliza la configuración predeterminada para mejorar la mantenibilidad
 */

import { 
  SmoothWavesProps, 
  SeaWavesProps,
  MouseInteractionProps,
  DirectionalFlowProps,
  FlockingProps,
  VortexProps,
  LissajousProps,
  PerlinFlowProps,
  RandomLoopProps,
  CenterPulseProps,
  AnimationType
} from './animationTypes';

/**
 * Configuración predeterminada para la animación SmoothWaves
 */
const SMOOTH_WAVES_DEFAULTS: SmoothWavesProps = {
  waveFrequency: 0.0002,
  waveAmplitude: 20,
  baseAngle: 0,
  patternScale: 0.01,
  timeScale: 1.0,
  waveType: 'circular',
  centerX: 0.5,
  centerY: 0.5,
};

/**
 * Configuración predeterminada para la animación SeaWaves
 */
const SEA_WAVES_DEFAULTS: SeaWavesProps = {
  baseFrequency: 0.0004,
  baseAmplitude: 25,
  rippleFrequency: 0.001,
  rippleAmplitude: 10,
  choppiness: 0.3,
  spatialFactor: 0.01,
};

/**
 * Configuración predeterminada para la animación MouseInteraction
 */
const MOUSE_INTERACTION_DEFAULTS: MouseInteractionProps = {
  interactionRadius: 150,
  effectType: 'attract',
  effectStrength: 1.0,
  falloffFactor: 0.5,
};

/**
 * Configuración predeterminada para la animación DirectionalFlow
 */
const DIRECTIONAL_FLOW_DEFAULTS: DirectionalFlowProps = {
  flowAngle: 0,
  flowSpeed: 1.0,
  turbulence: 0.2,
};

/**
 * Configuración predeterminada para la animación Flocking
 */
const FLOCKING_DEFAULTS: FlockingProps = {
  perceptionRadius: 100,
  maxSpeed: 2.0,
  separationForce: 0.05,
  alignmentForce: 0.05,
  cohesionForce: 0.01,
  targetSeekingForce: 0.01,
  targetX: 0.5,
  targetY: 0.5,
};

/**
 * Configuración predeterminada para la animación Vortex
 */
const VORTEX_DEFAULTS: VortexProps = {
  vortexCenterX: 0.5,
  vortexCenterY: 0.5,
  strength: 1.0,
  radiusFalloff: 0.9,
  swirlDirection: 'clockwise',
};

/**
 * Configuración predeterminada para la animación Lissajous
 */
const LISSAJOUS_DEFAULTS: LissajousProps = {
  xFrequency: 0.5,
  yFrequency: 1.0,
  xAmplitude: 1.0,
  yAmplitude: 1.0,
  phaseOffset: 0,
  timeSpeed: 1.0,
};

/**
 * Configuración predeterminada para la animación PerlinFlow
 */
const PERLIN_FLOW_DEFAULTS: PerlinFlowProps = {
  noiseScale: 0.01,
  timeEvolutionSpeed: 0.5,
  angleMultiplier: 1.0,
};

/**
 * Configuración predeterminada para la animación RandomLoop
 */
const RANDOM_LOOP_DEFAULTS: RandomLoopProps = {
  intervalMs: 2000,
  transitionDurationFactor: 0.5,
};

/**
 * Configuración predeterminada para la animación CenterPulse
 */
const CENTER_PULSE_DEFAULTS: CenterPulseProps = {
  pulseDuration: 1000,
  pulseCenter: { x: 0.5, y: 0.5 },
  maxDistanceFactor: 1.5,
  pulsePropagationSpeed: 1.0,
  maxAngleDisplacement: Math.PI / 4,
  maxLengthFactor: 1.5,
  affectAngle: true,
  continuousMode: false,
  pulseInterval: 3000,
  fadeOutFactor: 0.9,
  maxActivePulses: 3, // Limite predeterminado de pulsos activos
};

/**
 * Mapa de propiedades predeterminadas para todos los tipos de animación
 * Facilita el acceso a la configuración predeterminada para cualquier tipo de animación
 */
export const DEFAULT_ANIMATION_PROPS: Record<string, unknown> = {
  smoothWaves: SMOOTH_WAVES_DEFAULTS,
  seaWaves: SEA_WAVES_DEFAULTS,
  mouseInteraction: MOUSE_INTERACTION_DEFAULTS,
  directionalFlow: DIRECTIONAL_FLOW_DEFAULTS,
  flocking: FLOCKING_DEFAULTS,
  vortex: VORTEX_DEFAULTS,
  lissajous: LISSAJOUS_DEFAULTS,
  perlinFlow: PERLIN_FLOW_DEFAULTS,
  randomLoop: RANDOM_LOOP_DEFAULTS,
  centerPulse: CENTER_PULSE_DEFAULTS,
};

/**
 * Recupera las propiedades predeterminadas para un tipo de animación específico
 * @param type - Tipo de animación
 * @returns Propiedades predeterminadas para el tipo de animación
 */
export const getDefaultPropsForType = <T>(type: AnimationType): Partial<T> => {
  return (DEFAULT_ANIMATION_PROPS[type] || {}) as Partial<T>;
};
