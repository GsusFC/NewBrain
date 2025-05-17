/**
 * Directional Flow Animation
 * Creates a flow pattern in a specific direction with turbulent variations
 */

import { AnimatedVectorItem, AnimationSettings, DirectionalFlowProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { degreesToRadians } from '../utils/math';
import { lerp } from '../utils/interpolation';
import { fixPrecision } from '@/utils/precision';

/**
 * Updates a vector according to directional flow animation
 * @param item - Vector to update
 * @param currentTime - Current time in milliseconds
 * @param props - Specific properties for directional flow animation
 * @param settings - General animation settings
 * @returns Updated vector
 */
export const updateDirectionalFlow = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<DirectionalFlowProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Get properties with default values
  const defaultProps = getDefaultPropsForType('directionalFlow');
  const {
    flowAngle = 0,
    flowSpeed = 1.0,
    turbulence = 0.2
  } = { ...defaultProps, ...props } as DirectionalFlowProps;

  // Convert flow angle to radians with controlled precision
  const flowAngleRadians = fixPrecision(degreesToRadians(flowAngle), 6);
  
  // Calculate normalized time for animation with controlled precision
  const time = fixPrecision(currentTime * 0.001 * settings.baseSpeed * flowSpeed, 4);
  
  // Normalize vector position on the canvas with controlled precision
  const canvasWidth = settings.canvasWidth || 1000;
  const canvasHeight = settings.canvasHeight || 1000;
  const normalizedX = fixPrecision(item.baseX / canvasWidth, 4);
  const normalizedY = fixPrecision(item.baseY / canvasHeight, 4);
  
  // Calculate turbulence factor based on position and time with controlled precision
  // This creates variations in the flow angle to simulate turbulence
  const turbulenceFactor = fixPrecision(
    Math.sin(normalizedX * 10 + time) * 
    Math.cos(normalizedY * 10 + time * 0.7) * 
    turbulence, 
    4
  );
  
  // Calculate final angle by adding turbulence to the base angle with controlled precision
  const targetAngle = fixPrecision(flowAngleRadians + turbulenceFactor, 4);
  
  // Apply smooth angle transition if enabled
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    // Use current angle with controlled precision
    newAngle = fixPrecision(lerp(item.currentAngle || 0, targetAngle, 0.1), 4);
  }
  
  // Calculate length factor based on turbulence with controlled precision
  // Length increases slightly in low turbulence areas
  const newLengthFactor = fixPrecision(1 + Math.abs(turbulenceFactor) * 0.2, 4);
  // Get current length factor with a safe default value
  const currentLengthFactor = fixPrecision(item.lengthFactor || 1.0, 4);
  
  // Apply smooth length factor transition if enabled
  let finalLengthFactor = newLengthFactor;
  if (settings.lengthTransition) {
    finalLengthFactor = fixPrecision(lerp(currentLengthFactor, newLengthFactor, 0.1), 4);
  }
  
  // Maintain existing width factor with controlled precision
  const newWidthFactor = fixPrecision(item.widthFactor || 1.0, 4);
  
  return {
    ...item,
    currentAngle: newAngle,                       // Update current angle with precision
    targetAngle: targetAngle,                     // Save target angle with precision
    previousAngle: fixPrecision(item.currentAngle || 0, 4),   // Save previous angle
    lengthFactor: finalLengthFactor,              // Update length factor with precision
    widthFactor: newWidthFactor                   // Maintain width factor with precision
  };
};
