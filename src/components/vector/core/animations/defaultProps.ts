/**
 * Default properties for all animations
 * Centralizes default configuration to improve maintainability
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
  AnimationType,
  AnimationSettings
} from './animationTypes';

/**
 * Map each AnimationType to its corresponding props interface
 * This provides full type safety when accessing default props
 */
interface AnimationPropsMap {
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
  // 'none' has no props
  none: Record<string, never>;
}

/**
 * Default configuration for SmoothWaves animation
 */
const SMOOTH_WAVES_DEFAULTS = Object.freeze<SmoothWavesProps>({
  waveFrequency: 0.0002,
  waveAmplitude: 20,
  baseAngle: 0,
  patternScale: 0.01,
  timeScale: 1.0,
  waveType: 'circular',
  centerX: 0.5,
  centerY: 0.5,
});

/**
 * Default configuration for SeaWaves animation
 */
const SEA_WAVES_DEFAULTS = Object.freeze<SeaWavesProps>({
  baseFrequency: 0.0004,
  baseAmplitude: 25,
  rippleFrequency: 0.001,
  rippleAmplitude: 10,
  choppiness: 0.3,
  spatialFactor: 0.01,
});

/**
 * Default configuration for MouseInteraction animation
 */
const MOUSE_INTERACTION_DEFAULTS = Object.freeze<MouseInteractionProps>({
  interactionRadius: 150,
  effectType: 'attract',
  effectStrength: 1.0,
  falloffFactor: 0.5,
});

/**
 * Default configuration for DirectionalFlow animation
 */
const DIRECTIONAL_FLOW_DEFAULTS = Object.freeze<DirectionalFlowProps>({
  flowAngle: 0,
  flowSpeed: 1.0,
  turbulence: 0.2,
});

/**
 * Default configuration for Flocking animation
 */
const FLOCKING_DEFAULTS = Object.freeze<FlockingProps>({
  perceptionRadius: 100,
  maxSpeed: 2.0,
  separationForce: 0.05,
  alignmentForce: 0.05,
  cohesionForce: 0.01,
  targetSeekingForce: 0.01,
  targetX: 0.5,
  targetY: 0.5,
});

/**
 * Default configuration for Vortex animation
 */
const VORTEX_DEFAULTS = Object.freeze<VortexProps>({
  vortexCenterX: 0.5,
  vortexCenterY: 0.5,
  strength: 1.0,
  radiusFalloff: 0.9,
  swirlDirection: 'clockwise',
});

/**
 * Default configuration for Lissajous animation
 */
const LISSAJOUS_DEFAULTS = Object.freeze<LissajousProps>({
  xFrequency: 0.5,
  yFrequency: 1.0,
  xAmplitude: 1.0,
  yAmplitude: 1.0,
  phaseOffset: 0,
  timeSpeed: 1.0,
});

/**
 * Default configuration for PerlinFlow animation
 */
const PERLIN_FLOW_DEFAULTS = Object.freeze<PerlinFlowProps>({
  noiseScale: 0.01,
  timeEvolutionSpeed: 0.5,
  angleMultiplier: 1.0,
});

/**
 * Default configuration for RandomLoop animation
 */
const RANDOM_LOOP_DEFAULTS = Object.freeze<RandomLoopProps>({
  intervalMs: 2000,
  transitionDurationFactor: 0.5,
});

/**
 * Default configuration for CenterPulse animation
 */
const CENTER_PULSE_DEFAULTS = Object.freeze<CenterPulseProps>({
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
  maxActivePulses: 3, // Default limit of active pulses
});

/**
 * Map of default properties for all animation types
 * Provides type-safe access to default configuration for any animation type
 */
export const DEFAULT_ANIMATION_PROPS = Object.freeze<AnimationPropsMap>({
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
  none: {},
});

/**
 * Retrieves the default properties for a specific animation type
 * @param type - The animation type to get defaults for
 * @returns Default properties for the specified animation type
 */
/**
 * Retrieves the default properties for a specific animation type
 * @param type - The animation type to get defaults for
 * @returns Default properties for the specified animation type
 */
export function getDefaultPropsForType<T extends AnimationType>(
  type: T
): T extends keyof AnimationPropsMap ? Readonly<AnimationPropsMap[T]> : never {
  return (DEFAULT_ANIMATION_PROPS as any)[type] ?? {};
}

/**
 * Type guard to check if a value is a valid animation type
 * @param value - The value to check
 * @returns True if the value is a valid animation type
 */
export function isAnimationType(value: string): value is AnimationType {
  return value in DEFAULT_ANIMATION_PROPS || value === 'none';
}

/**
 * Gets the default animation settings for a given animation type
 * @param type - The animation type to get settings for
 * @returns Default settings for the specified animation type
 */
export const getDefaultAnimationSettings = (
  type: AnimationType
): Readonly<AnimationSettings> => {
  const baseSettings: AnimationSettings = {
    type,
    baseSpeed: 1.0,
    canvasWidth: 0,
    canvasHeight: 0,
    mouseX: null,
    mouseY: null,
    isMouseDown: false,
    resetOnTypeChange: true,
    seed: Math.floor(Math.random() * 10000),
    colorTransition: true,
    lengthTransition: true,
    angleTransition: true,
  };

  return Object.freeze({
    ...baseSettings,
    ...getDefaultPropsForType(type)
  });
};
