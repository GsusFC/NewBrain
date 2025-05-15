import { useRef, useEffect, useState, useCallback } from 'react';
import type {
  AnimatedVectorItem as UIVectorItem,
  UseVectorAnimationProps,
  UseVectorAnimationReturn,
  AnimationSettings as UIAnimationSettings
} from './types';

// Importar sistema centralizado de animaciones
import type {
  AnimationType,
  AnimatedVectorItem as ModularVectorItem,
  AnimationSettings as ModularAnimationSettings,
} from './animations/animationTypes';

import {
  updateVectorByType,
  getDefaultPropsForType,
  triggerPulse as triggerCenterPulse
} from './animations';

// --- Constantes ---
const DEFAULT_EASING_FACTOR = 0.05;
const MAX_DELTA_TIME = 0.1;
const MS_TO_SECONDS = 0.001;

/**
 * Hook para la animación de vectores
 * Maneja el ciclo de animación y actualiza las propiedades de cada vector
 * utilizando el sistema modular de animaciones
 */
export const useVectorAnimation = ({
  initialVectors = [],
  dimensions,
  animationSettings = {},
  mousePosition,
  pulseTrigger,
  onPulseComplete,
  onAllPulsesComplete,
}: UseVectorAnimationProps): UseVectorAnimationReturn => {
  // Referencias para la animación
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now() * MS_TO_SECONDS);
  const pulseStartTimeRef = useRef<number | null>(null);
  const onPulseCompleteRef = useRef(onPulseComplete);
  const onAllPulsesCompleteRef = useRef(onAllPulsesComplete);

  // Configuración de la animación
  const settingsRef = useRef<ModularAnimationSettings>({
    type: animationSettings.animationType || 'smoothWaves',
    baseSpeed: animationSettings.timeScale || 1.0,
    canvasWidth: dimensions?.width || 800,
    canvasHeight: dimensions?.height || 600,
    mouseX: mousePosition?.x || null,
    mouseY: mousePosition?.y || null,
    isMouseDown: false,
    resetOnTypeChange: true
  });

  // Estado para vectores animados - convertir del formato UI al formato del sistema modular
  const [animatedVectors, setAnimatedVectors] = useState<ModularVectorItem[]>(() => {
    return initialVectors.map(vector => ({
      id: vector.id,
      x: vector.baseX || 0,
      y: vector.baseY || 0,
      angle: vector.initialAngle || 0,
      length: 10, // Valor por defecto
      originalLength: 10, // Valor por defecto
      color: '#000000', // Valor por defecto
      originalColor: '#000000', // Valor por defecto
      userData: (vector.customData || {}) as Record<string, unknown>
    }));
  });

  // Mantener referencias actualizadas
  useEffect(() => {
    onPulseCompleteRef.current = onPulseComplete;
    onAllPulsesCompleteRef.current = onAllPulsesComplete;
  }, [onPulseComplete, onAllPulsesComplete]);

  // Actualizar configuración de animación cuando cambian las props
  useEffect(() => {
    // Actualizar dimensiones
    if (dimensions) {
      settingsRef.current.canvasWidth = dimensions.width;
      settingsRef.current.canvasHeight = dimensions.height;
    }

    // Actualizar tipo de animación
    if (animationSettings.animationType && animationSettings.animationType !== settingsRef.current.type) {
      settingsRef.current.type = animationSettings.animationType;
      
      // Cargar propiedades predeterminadas para el nuevo tipo de animación
      const defaultProps = getDefaultPropsForType(animationSettings.animationType);
      if (defaultProps) {
        // Actualizar objeto settings usando indexación dinámica
        settingsRef.current[animationSettings.animationType] = defaultProps;
        
        // Si hay propiedades adicionales, añadirlas
        if (animationSettings.animationProps) {
          // Usamos Object.assign para evitar errores de tipo con spread
          Object.assign(settingsRef.current[animationSettings.animationType], 
                       animationSettings.animationProps);
        }
      }
    }
    // Actualizar propiedades específicas de animación si el tipo no ha cambiado
    else if (animationSettings.animationProps && settingsRef.current.type) {
      const type = settingsRef.current.type;
      if (!settingsRef.current[type]) {
        settingsRef.current[type] = {};
      }
      // Añadir propiedades de animación al objeto de configuración
      Object.assign(settingsRef.current[type], animationSettings.animationProps);
    }
    
    // Actualizar velocidad de animación
    if (typeof animationSettings.timeScale === 'number') {
      settingsRef.current.baseSpeed = animationSettings.timeScale;
    }
    
  }, [dimensions, animationSettings]);

  // Actualizar la posición del ratón cuando cambia
  useEffect(() => {
    // El sistema modular necesita conocer la posición del ratón para animaciones interactivas
    if (mousePosition) {
      settingsRef.current.mouseX = mousePosition.x;
      settingsRef.current.mouseY = mousePosition.y;
      // El estado de click no se pasa en la interfaz actual pero podría añadirse en el futuro
      settingsRef.current.isMouseDown = false;
    } else {
      settingsRef.current.mouseX = null;
      settingsRef.current.mouseY = null;
      settingsRef.current.isMouseDown = false;
    }
  }, [mousePosition]);
  
  /**
   * Función para iniciar un pulso en la animación
   * Esta función se expone al componente para permitir iniciar efectos de pulso manualmente
   */
  const triggerPulse = useCallback(() => {
    // Registrar el tiempo de inicio del pulso para su seguimiento
    pulseStartTimeRef.current = performance.now() * MS_TO_SECONDS;
    
    // Si estamos usando la animación de pulso central, notificar al sistema modular
    if (settingsRef.current.type === 'centerPulse') {
      // Calcular punto central relativo (0.0-1.0) desde la posición absoluta
      const centerX = settingsRef.current.mouseX !== null ? 
        settingsRef.current.mouseX / settingsRef.current.canvasWidth : 0.5;
      const centerY = settingsRef.current.mouseY !== null ? 
        settingsRef.current.mouseY / settingsRef.current.canvasHeight : 0.5;
      
      // Llamar a la función de pulso del sistema modular con las coordenadas normalizadas
      triggerCenterPulse(centerX, centerY, performance.now() * MS_TO_SECONDS);
    }
    
    // Aplicar un efecto de pulso a todos los vectores temporalmente
    setAnimatedVectors(prevVectors => 
      prevVectors.map(vector => ({
        ...vector,
        length: vector.originalLength * 1.2 // Expandir inicialmente
      }))
    );
  }, []);

  // Efecto para detectar cambios en el trigger de pulso
  useEffect(() => {
    if (pulseTrigger) {
      triggerPulse();
    }
  }, [pulseTrigger, triggerPulse]);

  // Bucle principal de animación
  const animate = useCallback((timestamp: number) => {
    const currentTime = timestamp * MS_TO_SECONDS;
    const deltaTime = Math.min(MAX_DELTA_TIME, currentTime - lastFrameTimeRef.current);
    lastFrameTimeRef.current = currentTime;

    // Verificar si hay un pulso activo y su progreso
    const pulseStartTime = pulseStartTimeRef.current;
    let allPulsesCompleted = true;

    if (pulseStartTime) {
      const pulseElapsedMs = currentTime - pulseStartTime;
      const pulseDuration = 1; // 1 segundo (en segundos)

      // Determinar si el pulso ha terminado
      if (pulseElapsedMs >= pulseDuration) {
        pulseStartTimeRef.current = null;
        
        // Notificar que todos los pulsos han terminado
        if (allPulsesCompleted && onAllPulsesCompleteRef.current) {
          onAllPulsesCompleteRef.current();
        }
      } else {
        allPulsesCompleted = false;
      }
    }

    // Actualizar todos los vectores usando el sistema modular
    setAnimatedVectors(prevVectors => 
      prevVectors.map(vector => 
        updateVectorByType(vector, currentTime, settingsRef.current, prevVectors)
      )
    );

    // Continuar el ciclo de animación
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Iniciar y detener la animación
  useEffect(() => {
    // Iniciar animación si no está pausada
    if (!animationSettings.isPaused) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }

    // Limpiar al desmontar
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [animate, animationSettings.isPaused]);
  
  // Convertir los vectores animados del formato del sistema modular al formato de la interfaz de usuario
  const uiVectors = animatedVectors.map(vector => ({
    id: vector.id,
    r: 0, // Valores por defecto para propiedades de grid
    c: 0,
    baseX: vector.x,
    baseY: vector.y,
    originalX: vector.x,
    originalY: vector.y,
    initialAngle: vector.angle,
    currentAngle: vector.angle,
    lengthFactor: vector.length / (vector.originalLength || 1),
    widthFactor: 1,
    intensityFactor: 1,
    customData: vector.userData
  }));

  // Exponer la API pública del hook según el contrato de tipos
  return {
    animatedVectors: uiVectors,
    triggerPulse,
    setAnimatedVectors: (newState: UIVectorItem[] | ((prev: UIVectorItem[]) => UIVectorItem[])) => {
      // Convertir desde la interfaz UI al formato modular
      if (Array.isArray(newState)) {
        // Si es un array, convertir directamente cada elemento
        const modularVectors = newState.map(uiVector => ({
          id: uiVector.id,
          x: uiVector.baseX || 0,
          y: uiVector.baseY || 0,
          angle: uiVector.initialAngle || 0,
          length: 10,
          originalLength: 10, 
          color: '#000000',
          originalColor: '#000000',
          userData: uiVector.customData || {} as Record<string, unknown>
        }));
        setAnimatedVectors(modularVectors);
      } else {
        // Si es una función, proporcionar el estado UI actual y convertir el resultado
        setAnimatedVectors(currentModularVectors => {
          // Convertir el estado actual a formato UI para la función
          const currentUiVectors = currentModularVectors.map(modVector => ({
            id: modVector.id,
            r: 0,
            c: 0,
            baseX: modVector.x,
            baseY: modVector.y,
            originalX: modVector.x,
            originalY: modVector.y,
            initialAngle: modVector.angle,
            currentAngle: modVector.angle,
            lengthFactor: modVector.length / (modVector.originalLength || 1),
            widthFactor: 1,
            intensityFactor: 1,
            customData: modVector.userData
          }));
          
          // Llamar a la función con el estado UI
          const newUiVectors = newState(currentUiVectors);
          
          // Convertir el resultado de vuelta al formato modular
          return newUiVectors.map(uiVector => ({
            id: uiVector.id,
            x: uiVector.baseX || 0,
            y: uiVector.baseY || 0,
            angle: uiVector.initialAngle || 0,
            length: 10,
            originalLength: 10,
            color: '#000000',
            originalColor: '#000000',
            userData: uiVector.customData || {} as Record<string, unknown>
          }));
        });
      }
    }
  };
};