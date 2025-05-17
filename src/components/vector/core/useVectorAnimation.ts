import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  AnimatedVectorItem as UIVectorItem,
  UseVectorAnimationProps,
  UseVectorAnimationReturn,
  AnimationSettings as UIAnimationSettings
} from './types';

// Importar sistema centralizado de animaciones
import type {
  AnimationType,
  AnimatedVectorItem,
  AnimationSettings as ModularAnimationSettings,
} from './animations/animationTypes';

import {
  updateVectorByType,
  getDefaultPropsForType,
  createCenterPulseManager
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
  // Crear un gestor de pulsos único para esta instancia
  const pulseManagerRef = useRef(createCenterPulseManager());
  
  // Referencias para la animación
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now() * MS_TO_SECONDS);
  const pulseStartTimeRef = useRef<number | null>(null);
  const onPulseCompleteRef = useRef(onPulseComplete);
  const onAllPulsesCompleteRef = useRef(onAllPulsesComplete);
  const frameCounterRef = useRef(0);
  const mousePosRef = useRef(mousePosition);
  
  // Referencia para almacenar el estado actual de los vectores sin provocar re-renders
  const animatedVectorsRef = useRef<AnimatedVectorItem[]>([]);

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
  
  // Actualizar configuración de animación cuando cambian las props
  useEffect(() => {
    // Crear un objeto base con las propiedades estándar
    const newSettings = {
      ...settingsRef.current,
      type: animationSettings.animationType || 'smoothWaves',
      baseSpeed: animationSettings.timeScale || 1.0,
      canvasWidth: dimensions?.width || 800,
      canvasHeight: dimensions?.height || 600,
      isMouseDown: false
    };
    
    // Actualizar la referencia utilizando asignación de índice para evitar errores de tipo
    settingsRef.current = newSettings;
    
    // Usar índice para asignar la propiedad resetOnTypeChange
    (settingsRef.current as any).resetOnTypeChange = 
      typeof animationSettings.resetOnTypeChange !== 'undefined' 
        ? animationSettings.resetOnTypeChange 
        : true;
    
    // No provocamos un re-render al cambiar la configuración
  }, [animationSettings, dimensions]);
  
  // Actualizar la referencia de la posición del ratón por separado
  useEffect(() => {
    mousePosRef.current = mousePosition;
  }, [mousePosition]);

  // Función para activar un pulso
  const triggerPulse = useCallback((centerX: number, centerY: number) => {
    const currentTime = performance.now();
    pulseManagerRef.current.triggerPulse(centerX, centerY, currentTime);
    pulseStartTimeRef.current = currentTime * MS_TO_SECONDS;
  }, []);

  // Activar pulso cuando cambia pulseTrigger
  useEffect(() => {
    if (pulseTrigger) {
      // Usar la posición del ratón si está disponible, si no, el centro del contenedor
      const x = mousePosition?.x ?? 0.5;
      const y = mousePosition?.y ?? 0.5;
      triggerPulse(x, y);
    }
  }, [pulseTrigger, triggerPulse, mousePosition]);
  
  // Bucle principal de animación optimizado
  const animate = useCallback((timestamp: number) => {
    if (!animationFrameIdRef.current) return;
    
    // Tiempo actual en milisegundos
    const currentTime = performance.now();
    
    // Delta time en milisegundos (limitar para evitar saltos grandes)
    const deltaTime = Math.min(currentTime - lastFrameTimeRef.current, MAX_DELTA_TIME * 1000);
    
    // Actualizar tiempo del último frame
    lastFrameTimeRef.current = currentTime;
    
    // Actualizar la posición del mouse desde la referencia actualizada
    const currentMousePos = mousePosRef.current;
    if (currentMousePos) {
      settingsRef.current.mouseX = currentMousePos.x;
      settingsRef.current.mouseY = currentMousePos.y;
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
      updateVectorByType(
        vector, 
        currentTime, 
        settingsRef.current, 
        animatedVectorsRef.current
      )
    );
    
    // Actualizar el tiempo en la configuración para mantener la consistencia
    settingsRef.current.deltaTime = deltaTime;
    
    // Actualizar la referencia
    animatedVectorsRef.current = updatedVectors;
    
    // Actualizar el estado con limitación de frecuencia usando un contador de frames
    frameCounterRef.current = (frameCounterRef.current + 1) % 3; // Actualizar cada 3 frames (~50ms a 60fps)
    
    if (frameCounterRef.current === 0) {
      // Usar el setter funcional para evitar dependencia del estado actual
      setAnimatedVectors(prev => {
        // Si no hay cambios significativos, mantener el estado anterior
        // para evitar renders innecesarios
        const hasChanges = prev.some((v, i) => 
          v.angle !== updatedVectors[i]?.angle || 
          v.length !== updatedVectors[i]?.length
        );
        return hasChanges ? updatedVectors : prev;
      });
    }

    // Continuar el ciclo de animación si el componente sigue montado
    if (animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Iniciar y detener la animación
  useEffect(() => {
    // Solo iniciamos la animación cuando el componente se monta o cuando
    // cambia isPaused, NUNCA cuando animate cambie (ya que nunca debería cambiar)
    if (!animationSettings.isPaused) {
      // Limpiar cualquier animación previa para evitar duplicados
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Iniciar nueva animación
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else if (animationFrameIdRef.current !== null) {
      // Detener la animación si está pausada
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    // Limpiar al desmontar
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [animationSettings.isPaused]); // Solo dependemos de isPaused, no de animate
  
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

  // Función para convertir de AnimatedVectorItem a UIVectorItem
  const toUIVector = useCallback((modVector: AnimatedVectorItem): UIVectorItem => ({
    id: modVector.id,
    r: 0,
    c: 0,
    baseX: modVector.x,
    baseY: modVector.y,
    originalX: modVector.x,
    originalY: modVector.y,
    initialAngle: modVector.angle,
    currentAngle: modVector.angle,
    lengthFactor: 1,
    widthFactor: 1,
    customData: modVector.userData
  }), []);

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
      const currentUiVectors = animatedVectorsRef.current.map(toUIVector);
      const newUiVectors = newState(currentUiVectors);
      const newModularVectors = newUiVectors.map(toAnimatedVector);
      
      // Actualizar la referencia
      animatedVectorsRef.current = newModularVectors;
      
      // Y luego el estado con menos frecuencia
      setAnimatedVectors(newModularVectors);
    }
  }, [toAnimatedVector, toUIVector, setAnimatedVectors]);

  // Exponer la API pública del hook según el contrato de tipos
  return {
    animatedVectors: uiVectors,
    triggerPulse,
    setAnimatedVectors: setUIAnimatedVectors
  };
};