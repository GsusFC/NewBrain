'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { AnimationSelector } from '@/components/vector/controls/AnimationSelector';
import { AnimationType } from '@/components/vector/core/animations/animationTypes';

// Definir tipo para propiedades de animación
type AnimationPropsType = {
  waveFrequency?: number;
  waveAmplitude?: number;
  baseAngle?: number;
  patternScale?: number;
  waveType?: string;
  flowAngle?: number;
  turbulence?: number;
  flowSpeed?: number;
  strength?: number;
  radiusFalloff?: number;
  swirlDirection?: string;
  perceptionRadius?: number;
  separationForce?: number;
  alignmentForce?: number;
  cohesionForce?: number;
  angle?: number;
  intervalMs?: number;
  [key: string]: unknown;
};

// Definir tipo para los settings de animación
type AnimationSettings = {
  animationType: AnimationType;
  animationProps: AnimationPropsType;
  easingFactor: number;
  timeScale: number;
  dynamicLengthEnabled: boolean;
  dynamicWidthEnabled: boolean;
  dynamicIntensity: number;
  isPaused: boolean;
};

interface LeftPanelProps {
  animationSettings: {
    animationType: AnimationType;
    animationProps: any; // Usar any para evitar incompatibilidades de tipos
    easingFactor: number;
    timeScale: number;
    dynamicLengthEnabled: boolean;
    dynamicWidthEnabled: boolean;
    dynamicIntensity: number;
    isPaused: boolean;
  };
  onAnimationChange: (newSettings: any) => void; // Usar any temporalmente para resolver problemas de tipo
  className?: string;
}

export function LeftPanel({ 
  animationSettings, 
  onAnimationChange, 
  className = ''
}: LeftPanelProps) {
  return (
    <div className={`flex flex-col space-y-4 w-full ${className}`}>
      <div className="flex-1 overflow-y-auto p-3 pt-1 space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-1">Ajustes de Vectores</h3>
          <Separator className="mb-4" />
          
          <div className="space-y-6">
            {/* Selector de animaciones - se activan automáticamente al seleccionarlas */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Tipo de Animación</h4>
              <AnimationSelector 
                value={animationSettings}
                onChange={(newSettings) => onAnimationChange({
                  ...animationSettings,
                  animationType: newSettings.animationType,
                  animationProps: newSettings.animationProps
                })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
