import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useVectorGridStore } from '../../store/improved/vectorGridStore';
import { shallow } from 'zustand/shallow';

// Importamos selectores individuales para acceder a valores concretos sin re-renders innecesarios
const selectAnimationType = (state) => state.animationType;
const selectEasingFactor = (state) => state.easingFactor;
const selectTimeScale = (state) => state.timeScale;
const selectIsPaused = (state) => state.isPaused;
const selectAnimationProps = (state) => state.animationProps;
const selectMousePosition = (state) => state.mousePosition;
import type {
  AnimatedVectorItem as UIVectorItem,
  UseVectorAnimationReturn
} from '../types';

// Importar sistema centralizado de animaciones
import type {
  AnimatedVectorItem,
  AnimationSettings as ModularAnimationSettings,
} from '../animations/animationTypes';

import {
  updateVectorByType,
  getDefaultPropsForType,
  createCenterPulseManager
} from '../animations';

// --- Constantes ---
const DEFAULT_EASING_FACTOR = 0.05;
const MAX_DELTA_TIME = 0.1;
const MS_TO_SECONDS = 0.001;

/**
 * Hook optimizado para la animación de vectores que utiliza el store centralizado
 * Esta versión elimina los ciclos de renderizado y mejora notablemente el rendimiento
 * 
 * @param initialVectors Vector items iniciales
 * @param dimensions Dimensiones del contenedor
 * @param onPulseComplete Callback para cuando se completa un pulso
 * @param onAllPulsesComplete Callback para cuando se completan todos los pulsos
 * @returns Objeto con vectores animados y funciones para manejar la animación
 */
export const useVectorAnimationOptimized = (
  initialVectors: UIVectorItem[] = [],
  dimensions: { width: number; height: number },
  onPulseComplete?: () => void,
  onAllPulsesComplete?: () => void,
): UseVectorAnimationReturn => {
  // Acceso directo a valores individuales del store sin crear objetos intermedios
  // para evitar ciclos infinitos de renderizado
  const animationType = useVectorGridStore(selectAnimationType);
  const animationProps = useVectorGridStore(selectAnimationProps);
  const easingFactor = useVectorGridStore(selectEasingFactor);
  const timeScale = useVectorGridStore(selectTimeScale);
  const isPaused = useVectorGridStore(selectIsPaused);
  const mousePosition = useVectorGridStore(selectMousePosition);
  
  // Valores adicionales con acceso directo para evitar crear objetos
  const dynamicLengthEnabled = useVectorGridStore(state => state.dynamicLengthEnabled);
  const dynamicWidthEnabled = useVectorGridStore(state => state.dynamicWidthEnabled);
  const dynamicIntensity = useVectorGridStore(state => state.dynamicIntensity);
  
  // Gestor de pulsos para esta instancia
  const pulseManagerRef = useRef(createCenterPulseManager());
  
  // Referencias para la animación
  const animationFrameIdRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(performance.now() * MS_TO_SECONDS);
  const pulseStartTimeRef = useRef<number | null>(null);
  const onPulseCompleteRef = useRef(onPulseComplete);
  const onAllPulsesCompleteRef = useRef(onAllPulsesComplete);
  
  // Referencia para almacenar el estado actual de los vectores sin provocar re-renders
  const animatedVectorsRef = useRef<AnimatedVectorItem[]>([]);

  // Configuración de la animación - Ahora tomada directamente del store
  const settingsRef = useRef<ModularAnimationSettings>({
    type: animationType || 'smoothWaves',
    baseSpeed: timeScale || 1.0,
    canvasWidth: dimensions?.width || 800,
    canvasHeight: dimensions?.height || 600,
    mouseX: mousePosition?.x || null,
    mouseY: mousePosition?.y || null,
    isMouseDown: false,
    resetOnTypeChange: true
  });

  // Estado para vectores animados - convertir del formato UI al formato del sistema modular
  const [animatedVectors, setAnimatedVectors] = useState<AnimatedVectorItem[]>(() => {
    const initialModularVectors = initialVectors.map(vector => ({
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
    
    // Inicializar también la referencia
    animatedVectorsRef.current = initialModularVectors;
    
    return initialModularVectors;
  });

  // Mantener referencias actualizadas
  useEffect(() => {
    onPulseCompleteRef.current = onPulseComplete;
    onAllPulsesCompleteRef.current = onAllPulsesComplete;
  }, [onPulseComplete, onAllPulsesComplete]);
  
  // Actualizar configuración de animación cuando cambian las props en el store
  useEffect(() => {
    // Crear un objeto base con las propiedades estándar
    const newSettings = {
      ...settingsRef.current,
      type: animationType || 'smoothWaves',
      baseSpeed: timeScale || 1.0,
      canvasWidth: dimensions?.width || 800,
      canvasHeight: dimensions?.height || 600,
      mouseX: mousePosition?.x || null,
      mouseY: mousePosition?.y || null,
      isMouseDown: false
    };
    
    // Actualizar la referencia
    settingsRef.current = newSettings;
    
    // Usar índice para asignar la propiedad resetOnTypeChange
    (settingsRef.current as any).resetOnTypeChange = 
      typeof animationProps?.resetOnTypeChange !== 'undefined' 
        ? animationProps.resetOnTypeChange 
        : true;
    
    // No provocamos un re-render al cambiar la configuración
  }, [animationType, animationProps, timeScale, dimensions, mousePosition]);

  // Función para activar un pulso
  const triggerPulse = useCallback((centerX?: number, centerY?: number) => {
    const currentTime = performance.now() * MS_TO_SECONDS; // Convertir a segundos
    // Usar la posición proporcionada o el centro como valor predeterminado
    const x = centerX ?? mousePosition?.x ?? 0.5;
    const y = centerY ?? mousePosition?.y ?? 0.5;
    
    pulseManagerRef.current.triggerPulse(x, y, currentTime);
    pulseStartTimeRef.current = currentTime;
  }, [mousePosition]);

  // Bucle principal de animación optimizado
  const animate = useCallback((timestamp: number) => {
    const currentTime = timestamp * MS_TO_SECONDS;
    const deltaTime = Math.min(currentTime - lastFrameTimeRef.current, MAX_DELTA_TIME);
    lastFrameTimeRef.current = currentTime;
    
    // IMPORTANTE: No podemos confiar en el valor de isPaused del closure porque puede estar desactualizado
    // Obtenemos el valor más actualizado directamente del store
    const isPausedNow = useVectorGridStore.getState().isPaused;
    
    if (isPausedNow) {
      return;
    }
    
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
        // Usamos setTimeout para evitar llamar a la función durante el renderizado
        if (allPulsesCompleted && onAllPulsesCompleteRef.current) {
          setTimeout(() => {
            // Verificamos que la referencia todavía sea válida antes de llamarla
            if (onAllPulsesCompleteRef.current) {
              onAllPulsesCompleteRef.current();
            }
          }, 0);
        }
      } else {
        allPulsesCompleted = false;
      }
    }

    // Actualizar vectores en la referencia para evitar re-renders excesivos
    const updatedVectors = animatedVectorsRef.current.map(vector => 
      updateVectorByType(vector, currentTime, settingsRef.current, animatedVectorsRef.current)
    );
    
    // Actualizar la referencia SIEMPRE
    animatedVectorsRef.current = updatedVectors;
    
    // Actualización del contador de frames
    frameCountRef.current += 1;
    
    // Throttling de actualizaciones para mejorar rendimiento
    // Actualizamos el estado visible solo cada 5 frames
    if (frameCountRef.current % 5 === 0) {
      // Usamos requestAnimationFrame para asegurar que la actualización ocurra
      // en el siguiente ciclo de pintado
      requestAnimationFrame(() => {
        const currentRafId = animationFrameIdRef.current;
        // Verificar que el frame sigue siendo relevante
        if (currentRafId === animationFrameIdRef.current) {
          setAnimatedVectors(updatedVectors);
        }
      });
    }

    // Verificamos de nuevo si está pausado accediendo al estado más reciente
    if (!useVectorGridStore.getState().isPaused) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Iniciar y detener la animación con protección contra actualizaciones excesivas
  useEffect(() => {
    // Definir función para iniciar la animación de manera segura
    const startAnimation = () => {
      // Verificar estado actual usando getState() para tener el valor más reciente
      if (useVectorGridStore.getState().isPaused) return;
      
      // Cancelar animación previa si existe
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      // Iniciar nueva animación
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    
    // Detener animación de manera segura
    const stopAnimation = () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
    
    // Iniciar o detener según el estado de pausa
    if (!isPaused) {
      startAnimation();
    } else {
      stopAnimation();
    }
    
    // Limpiar al desmontar
    return stopAnimation;
  // Usar shallow para comparar isPaused y evitar actualizaciones innecesarias
  }, [animate, isPaused]);
  
  // Convertir los vectores animados del formato del sistema modular al formato de la interfaz de usuario
  // Usar useMemo para evitar recálculos innecesarios
  const uiVectors = useMemo(() => {
    return animatedVectors.map(vector => ({
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
  }, [animatedVectors]);

  // Función para convertir de UIVectorItem a AnimatedVectorItem
  const toAnimatedVector = useCallback((uiVector: UIVectorItem): AnimatedVectorItem => ({
    id: uiVector.id,
    x: uiVector.baseX || 0,
    y: uiVector.baseY || 0,
    angle: uiVector.initialAngle || 0,
    length: 10,
    originalLength: 10,
    color: '#000000',
    originalColor: '#000000',
    userData: { ...(uiVector.customData as Record<string, unknown> || {}) }
  }), []);

  // Función para actualizar los vectores animados (memoizada) con protección
  const setUIAnimatedVectors = useCallback((newState: UIVectorItem[] | ((prev: UIVectorItem[]) => UIVectorItem[])) => {
    // Evitar recálculos innecesarios
    if (Array.isArray(newState)) {
      // Si es un array directo, actualizar una vez
      const modularVectors = newState.map(toAnimatedVector);
      
      // IMPORTANTE: Primero actualizar la referencia
      animatedVectorsRef.current = modularVectors;
      
      // Luego el estado de manera segura con microtask
      queueMicrotask(() => {
        setAnimatedVectors(prev => {
          // Comparación optimizada para evitar el uso de JSON.stringify
          if (prev.length !== modularVectors.length) return modularVectors;
          
          // Verificar si hay algún cambio en los vectores
          for (let i = 0; i < prev.length; i++) {
            const p = prev[i];
            const m = modularVectors[i];
            
            // Solo comparamos las propiedades que pueden cambiar
            if (p.id !== m.id || 
                p.currentAngle !== m.currentAngle || 
                p.lengthFactor !== m.lengthFactor ||
                p.baseX !== m.baseX || 
                p.baseY !== m.baseY) {
              return modularVectors; // Hay cambios, actualizar
            }
          }
          return prev; // No hubo cambios, devolver estado anterior
        });
      });
    } else {
      // Si es una función, usar un enfoque más seguro
      // Calculamos los nuevos vectores fuera del ciclo de renderizado
      const currentUiVectors = [...uiVectors]; // Copia para evitar mutaciones
      const newUiVectors = newState(currentUiVectors);
      const newModularVectors = newUiVectors.map(toAnimatedVector);
      
      // Actualizar primero la referencia
      animatedVectorsRef.current = newModularVectors;
      
      // Luego actualizar el estado de manera segura
      queueMicrotask(() => {
        setAnimatedVectors(prev => {
          // Comparación optimizada para evitar el uso de JSON.stringify
          if (prev.length !== newModularVectors.length) return newModularVectors;
          
          // Verificar si hay algún cambio en los vectores
          for (let i = 0; i < prev.length; i++) {
            const p = prev[i];
            const m = newModularVectors[i];
            
            // Solo comparamos las propiedades que pueden cambiar
            if (p.id !== m.id || 
                p.currentAngle !== m.currentAngle || 
                p.lengthFactor !== m.lengthFactor ||
                p.baseX !== m.baseX || 
                p.baseY !== m.baseY) {
              return newModularVectors; // Hay cambios, actualizar
            }
          }
          return prev; // No hubo cambios, mantener estado anterior
        });
      });
    }
  }, [toAnimatedVector, uiVectors]);

  // Exponer la API pública del hook según el contrato de tipos
  return {
    animatedVectors: uiVectors,
    triggerPulse,
    setAnimatedVectors: setUIAnimatedVectors
  };
};
