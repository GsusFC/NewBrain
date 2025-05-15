// Ruta: src/components/vector/core/useVectorAnimation.ts

import { useRef, useEffect, useState, useCallback } from 'react';
import Victor from 'victor'; // Para cálculos vectoriales en animaciones
import {
  AnimatedVectorItem,
  UseVectorAnimationProps,
  UseVectorAnimationReturn,
  VectorDimensions,
  AnimationSettings,
} from './types';

// --- Funciones de Easing --- 
// Funciones de easing para animaciones
// Para uso futuro en implementaciones más avanzadas de animaciones
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Calcula el ángulo suavizado entre el ángulo actual y el objetivo
 */
const interpolateAngle = (currentAngle: number, targetAngle: number, easingFactor: number): number => {
  // Normalizar ángulos a 0-360
  currentAngle = ((currentAngle % 360) + 360) % 360;
  targetAngle = ((targetAngle % 360) + 360) % 360;
  
  // Calcular la diferencia más corta
  let delta = targetAngle - currentAngle;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  
  // Aplicar easing
  return currentAngle + delta * easingFactor;
};

/**
 * Interpola suavemente entre dos valores
 */
const interpolateValue = (currentValue: number, targetValue: number, easingFactor: number): number => {
  return currentValue + (targetValue - currentValue) * easingFactor;
};

/**
 * Hook para animar vectores en un grid
 */
export const useVectorAnimation = ({
  initialVectors,
  dimensions,
  animationSettings,
  mousePosition,
  pulseTrigger,
  onPulseComplete,
  onAllPulsesComplete,
}: UseVectorAnimationProps): UseVectorAnimationReturn => {
  // Estado principal
  const [animatedVectors, setAnimatedVectors] = useState<AnimatedVectorItem[]>(initialVectors || []);
  
  // Referencias para mantener valores entre renders
  const settingsRef = useRef<AnimationSettings>(animationSettings);
  const dimensionsRef = useRef<VectorDimensions | undefined>(dimensions);
  const mousePosRef = useRef<Victor | null>(mousePosition ? new Victor(mousePosition.x, mousePosition.y) : null);
  const pulseStartTimeRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const requestAnimationFrameIdRef = useRef<number | null>(null);
  const onPulseCompleteRef = useRef(onPulseComplete);
  const onAllPulsesCompleteRef = useRef(onAllPulsesComplete);
  const animationEnabled = !animationSettings?.isPaused;

  // Actualizar refs cuando las props cambien
  useEffect(() => { settingsRef.current = animationSettings; }, [animationSettings]);
  useEffect(() => { dimensionsRef.current = dimensions; }, [dimensions]);
  useEffect(() => { 
    mousePosRef.current = mousePosition ? new Victor(mousePosition.x, mousePosition.y) : null;
  }, [mousePosition]);
  useEffect(() => { onPulseCompleteRef.current = onPulseComplete; }, [onPulseComplete]);
  useEffect(() => { onAllPulsesCompleteRef.current = onAllPulsesComplete; }, [onAllPulsesComplete]);

  // Efecto para inicializar/actualizar el vector cuando cambia initialVectors
  useEffect(() => {
    if (!initialVectors || initialVectors.length === 0) return;
    
    setAnimatedVectors(initialVectors.map(item => ({
      ...item,
      currentAngle: item.initialAngle || 0,
    })));
  }, [initialVectors]);

  // Detectar trigger de pulso
  useEffect(() => {
    if (pulseTrigger && pulseTrigger !== pulseStartTimeRef.current) {
      pulseStartTimeRef.current = pulseTrigger;
    }
  }, [pulseTrigger]);

  // La función principal de animación
  const animate = useCallback(() => {
    if (!animationEnabled || !animatedVectors || animatedVectors.length === 0) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      const currentTime = performance.now();
      const deltaTime = Math.min(0.1, (currentTime - (lastFrameTimeRef.current || currentTime)) / 1000);
      lastFrameTimeRef.current = currentTime;

      const currentSettings = settingsRef.current;
      const currentPulseStartTime = pulseStartTimeRef.current;
      const allOverallPulsesCompleted = true; // Cambiado a const ya que nunca se reasigna

      setAnimatedVectors((prevAnimatedVectors) => {
        return prevAnimatedVectors.map(item => {
          if (!currentSettings) {
            return item;
          }
          
          // Valores por defecto
          let targetAngle = item.initialAngle || 0;
          const targetLengthFactor = 1.0; // Cambiado a const ya que nunca se reasigna
          const targetWidthFactor = 1.0; // Cambiado a const ya que nunca se reasigna
          const targetIntensityFactor = 1.0; // Cambiado a const ya que nunca se reasigna

          // Implementación simplificada para diferentes tipos de animaciones
          switch (currentSettings.animationType) {
            case 'centerPulse':
              // Implementación básica de pulso
              targetAngle = item.initialAngle || 0;
              break;
              
            case 'randomLoop':
              // Animación simple de rotación constante
              targetAngle = (item.currentAngle + 1) % 360;
              break;
              
            default:
              // Mantener ángulo actual o inicial
              targetAngle = item.initialAngle || 0;
              break;
          }

          // Aplicar suavizado a los cambios
          const easing = currentSettings.easingFactor ?? 0.1;
          const newAngle = interpolateAngle(item.currentAngle, targetAngle, easing * (deltaTime * 60));
          
          // Crear copia actualizada del vector
          return {
            ...item,
            currentAngle: newAngle,
            lengthFactor: currentSettings.dynamicLengthEnabled ? 
              interpolateValue(item.lengthFactor ?? 1, targetLengthFactor, easing * (deltaTime * 60)) : 
              item.lengthFactor,
            widthFactor: currentSettings.dynamicWidthEnabled ? 
              interpolateValue(item.widthFactor ?? 1, targetWidthFactor, easing * (deltaTime * 60)) : 
              item.widthFactor,
            intensityFactor: currentSettings.dynamicIntensity ? 
              interpolateValue(item.intensityFactor ?? 1, targetIntensityFactor, easing * (deltaTime * 60)) : 
              item.intensityFactor
          };
        });
      });

      // Gestionar la finalización de los pulsos
      if (currentPulseStartTime && allOverallPulsesCompleted && onAllPulsesCompleteRef.current) {
        onAllPulsesCompleteRef.current();
        pulseStartTimeRef.current = null;
      }

      // Continuar el ciclo de animación
      requestAnimationFrameIdRef.current = requestAnimationFrame(animate);
    });
    
    requestAnimationFrameIdRef.current = animationFrame;
  }, [animationEnabled, animatedVectors]);

  // Efecto para iniciar y detener la animación
  useEffect(() => {
    if (animationEnabled && animatedVectors.length > 0) {
      animate();
    }
    
    return () => {
      if (requestAnimationFrameIdRef.current !== null) {
        cancelAnimationFrame(requestAnimationFrameIdRef.current);
        requestAnimationFrameIdRef.current = null;
      }
    };
  }, [animationEnabled, animatedVectors.length, animate]);

  // Función para desencadenar un pulso
  const triggerPulse = useCallback(() => {
    pulseStartTimeRef.current = performance.now();
  }, []);

  return { 
    animatedVectors, 
    setAnimatedVectors,
    triggerPulse 
  };
};
