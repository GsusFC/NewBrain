import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useVectorGridStore } from '../../store/vectorGridStore';

// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // <- keep commented until used
import type {
  AnimatedVectorItem as UIVectorItem,
  UseVectorAnimationReturn
} from '../types';

// Interfaz extendida para UIVectorItem con propiedades de estilo
interface ExtendedUIVectorItem extends UIVectorItem {
  length?: number;
  originalLength?: number;
  color?: string;
  originalColor?: string;
}

// Importar sistema centralizado de animaciones
import type {
  AnimationType,
  AnimatedVectorItem as ModularVectorItem,
  AnimationSettings as ModularAnimationSettings,
} from '../animations/animationTypes';

import { updateVectorByType, createCenterPulseManager } from '../animations';

// --- Constantes ---
const DEFAULT_EASING_FACTOR = 0.05;
const MAX_DELTA_TIME = 0.1;
const MS_TO_SECONDS = 0.001;

/**
 * Hook para la animación de vectores que utiliza Zustand como fuente de verdad
 * Esta versión mejorada elimina los ciclos de renderizado y simplifica la gestión
 * del estado de la animación.
 */
export const useVectorAnimationWithStore = (
  initialVectors: UIVectorItem[] = [],
  dimensions: { width: number; height: number },
  onPulseComplete?: () => void,
  onAllPulsesComplete?: () => void,
): UseVectorAnimationReturn => {
  // Obtener el estado global relevante del store
  const {
    animationType,
    animationProps,
    easingFactor,
    timeScale,
    isPaused,
    mousePosition,
  } = useVectorGridStore(state => ({
    animationType: state.animationType,
    animationProps: state.animationProps,
    easingFactor: state.easingFactor,
    timeScale: state.timeScale,
    isPaused: state.isPaused,
    mousePosition: state.mousePosition || { x: null, y: null },
  }));

  // Crear un gestor de pulsos único para esta instancia
  const pulseManagerRef = useRef(createCenterPulseManager());
  
  // Referencias para la animación
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now() * MS_TO_SECONDS);
  const pulseStartTimeRef = useRef<number | null>(null);
  const onPulseCompleteRef = useRef(onPulseComplete);
  const onAllPulsesCompleteRef = useRef(onAllPulsesComplete);
  
  // Referencia para almacenar el estado actual de los vectores sin provocar re-renders
  const animatedVectorsRef = useRef<ModularVectorItem[]>([]);
  
  // Contador de frames para limitar actualizaciones
  const frameCounterRef = useRef(0);

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
  const [animatedVectors, setAnimatedVectors] = useState<ModularVectorItem[]>(() => {
    const initialModularVectors = initialVectors.map(vector => ({
      id: vector.id,
      r: vector.r || 0,
      c: vector.c || 0,
      baseX: vector.baseX || 0,
      baseY: vector.baseY || 0,
      originalX: vector.originalX || vector.baseX || 0,
      originalY: vector.originalY || vector.baseY || 0,
      initialAngle: vector.initialAngle || 0,
      currentAngle: vector.currentAngle || vector.initialAngle || 0,
      lengthFactor: vector.lengthFactor || 1,
      widthFactor: vector.widthFactor || 1,
      intensityFactor: vector.intensityFactor || 1,
      customData: vector.customData
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
    
    // Actualizar la referencia utilizando asignación de índice para evitar errores de tipo
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
    const currentTime = performance.now();
    // Usar la posición proporcionada o el centro como valor predeterminado
    const x = centerX ?? 0.5;
    const y = centerY ?? 0.5;
    pulseManagerRef.current.triggerPulse(x, y, currentTime);
    pulseStartTimeRef.current = currentTime * MS_TO_SECONDS;
  }, []);

  // Bucle principal de animación optimizado
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
    
    // Actualizar la referencia
    animatedVectorsRef.current = updatedVectors;
    
    // Actualizar el estado solo cada 5 frames para reducir re-renders
    frameCounterRef.current = (frameCounterRef.current + 1) % 5;
    if (frameCounterRef.current === 0) {
      setAnimatedVectors(updatedVectors);
    }

    // Continuar el ciclo de animación si no está pausado
    // Leemos directamente del store aquí para tener el valor más actualizado
    if (!useVectorGridStore.getState().isPaused) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Iniciar y detener la animación
  useEffect(() => {
    // Iniciar animación si no está pausada
    if (!isPaused) {
      // Si ya hay una animación en ejecución, la cancelamos primero
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      // Pausar la animación si isPaused es true
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    // Limpiar al desmontar
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [animate, isPaused]);
  
  // Convertir los vectores animados del formato del sistema modular al formato de la interfaz de usuario
  // Usar useMemo para evitar recálculos innecesarios
  const uiVectors = useMemo<UIVectorItem[]>(() => {
    return animatedVectors.map(vector => ({
      id: vector.id,
      r: vector.r,
      c: vector.c,
      baseX: vector.baseX,
      baseY: vector.baseY,
      originalX: vector.originalX,
      originalY: vector.originalY,
      initialAngle: vector.initialAngle,
      currentAngle: vector.currentAngle,
      lengthFactor: vector.lengthFactor,
      widthFactor: vector.widthFactor,
      intensityFactor: vector.intensityFactor || 1,
      customData: vector.customData
    }));
  }, [animatedVectors]);

  // Función para convertir de UIVectorItem a ModularVectorItem
  const toAnimatedVector = useCallback((uiVector: ExtendedUIVectorItem): ModularVectorItem => {
    // Preservar propiedades de estilo importantes en un objeto style
    const styleData = {
      length: uiVector.length ?? 10,
      originalLength: uiVector.originalLength ?? uiVector.length ?? 10,
      color: uiVector.color ?? '#000000',
      originalColor: uiVector.originalColor ?? uiVector.color ?? '#000000'
    };

    // Combinar customData existente con la información de estilo
    // Asegurarnos de que customData es un objeto antes de hacer spread
    const existingCustomData = typeof uiVector.customData === 'object' && uiVector.customData !== null
      ? uiVector.customData as Record<string, unknown>
      : {};
    
    const mergedCustomData = {
      ...existingCustomData,
      style: styleData
    };

    return {
      id: uiVector.id,
      r: uiVector.r || 0,
      c: uiVector.c || 0,
      baseX: uiVector.baseX || 0,
      baseY: uiVector.baseY || 0,
      originalX: uiVector.originalX || uiVector.baseX || 0,
      originalY: uiVector.originalY || uiVector.baseY || 0,
      initialAngle: uiVector.initialAngle || 0,
      currentAngle: uiVector.currentAngle || uiVector.initialAngle || 0,
      lengthFactor: uiVector.lengthFactor || 1,
      widthFactor: uiVector.widthFactor || 1,
      intensityFactor: uiVector.intensityFactor || 1,
      customData: mergedCustomData
    };
  }, []);

  // Función para actualizar los vectores animados (memoizada)
  const setUIAnimatedVectors = useCallback((newState: UIVectorItem[] | ((prev: UIVectorItem[]) => UIVectorItem[])) => {
    // Evitar recálculos innecesarios
    if (Array.isArray(newState)) {
      // Si es un array directo, actualizar una vez
      const modularVectors = newState.map(toAnimatedVector);
      
      // Actualizar la referencia primero
      animatedVectorsRef.current = modularVectors;
      
      // Luego el estado con menos frecuencia
      setAnimatedVectors(modularVectors);
    } else {
      // Si es una función, usar la referencia actual para el cálculo
      const currentUiVectors = uiVectors;
      const newUiVectors = newState(currentUiVectors);
      const newModularVectors = newUiVectors.map(toAnimatedVector);
      
      // Actualizar la referencia
      animatedVectorsRef.current = newModularVectors;
      
      // Y luego el estado con menos frecuencia
      setAnimatedVectors(newModularVectors);
    }
  }, [toAnimatedVector, uiVectors]);

  // Exponer la API pública del hook según el contrato de tipos
  return {
    animatedVectors: uiVectors,
    triggerPulse,
    setAnimatedVectors: setUIAnimatedVectors
  };
};
