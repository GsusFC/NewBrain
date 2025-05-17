import { useVectorGridStore } from '../vectorGridStore';
import type { GridDimensions } from '@/hooks/vector/useGridDimensions';

/**
 * Hook selector para configuraciones de animación
 * Selecciona solo las propiedades relacionadas con la animación del store
 * Esto permite que los componentes se actualicen solo cuando cambian estas propiedades específicas
 */
export const useAnimationSettings = () => {
  // Selectores individuales para valores primitivos
  const animationType = useVectorGridStore(state => state.animationType);
  const easingFactor = useVectorGridStore(state => state.easingFactor);
  const timeScale = useVectorGridStore(state => state.timeScale);
  const isPaused = useVectorGridStore(state => state.isPaused);
  const dynamicLengthEnabled = useVectorGridStore(state => state.dynamicLengthEnabled);
  const dynamicWidthEnabled = useVectorGridStore(state => state.dynamicWidthEnabled);
  const dynamicIntensity = useVectorGridStore(state => state.dynamicIntensity);
  
  // Objetos
  const animationProps = useVectorGridStore(state => state.animationProps);
  
  // Acciones
  const togglePause = useVectorGridStore(state => state.togglePause);
  const updateAnimationSettings = useVectorGridStore(state => state.updateAnimationSettings);
  const setAnimationType = useVectorGridStore(state => state.setAnimationType);
  const updateAnimationProps = useVectorGridStore(state => state.updateAnimationProps);
  
  // Devolver un objeto con todo
  return {
    animationType,
    animationProps,
    easingFactor,
    timeScale,
    isPaused,
    dynamicLengthEnabled,
    dynamicWidthEnabled,
    dynamicIntensity,
    togglePause,
    updateAnimationSettings,
    setAnimationType,
    updateAnimationProps
  };
};

/**
 * Hook selector para configuraciones de la cuadrícula
 * Selecciona solo las propiedades relacionadas con la cuadrícula del store
 */
export const useGridSettings = () => {
  // Seleccionar individualmente para evitar crear nuevos objetos en cada render
  const gridSettings = useVectorGridStore(state => state.gridSettings);
  const aspectRatio = useVectorGridStore(state => state.aspectRatio);
  const customAspectRatio = useVectorGridStore(state => state.customAspectRatio);
  const setGridSettings = useVectorGridStore(state => state.setGridSettings);
  const setAspectRatio = useVectorGridStore(state => state.setAspectRatio);
  
  return {
    gridSettings,
    aspectRatio,
    customAspectRatio,
    setGridSettings,
    setAspectRatio
  };
};

/**
 * Hook selector para configuraciones de vectores
 * Selecciona solo las propiedades relacionadas con los vectores del store
 */
export const useVectorSettings = () => {
  const vectorSettings = useVectorGridStore(state => state.vectorSettings);
  const setVectorSettings = useVectorGridStore(state => state.setVectorSettings);
  
  return {
    vectorSettings,
    setVectorSettings
  };
};

/**
 * Hook selector para configuraciones de renderizado
 * Selecciona solo las propiedades relacionadas con el renderizado del store
 */
export const useRenderSettings = () => {
  const renderAsCanvas = useVectorGridStore(state => state.renderAsCanvas);
  const throttleMs = useVectorGridStore(state => state.throttleMs);
  const backgroundColor = useVectorGridStore(state => state.backgroundColor);
  const toggleRenderer = useVectorGridStore(state => state.toggleRenderer);
  const setThrottleMs = useVectorGridStore(state => state.setThrottleMs);
  // Nota: setBackgroundColor no existe en el store actual
  // Si se necesita en el futuro, debe añadirse al store
  
  return {
    renderAsCanvas,
    throttleMs,
    backgroundColor,
    toggleRenderer,
    setThrottleMs
  };
};

/**
 * Hook para obtener todos los valores exportables del store en formato de props para VectorGrid
 * Útil para pasar directamente todas las props al componente VectorGrid
 */
export const useExportableState = () => {
  // Obtenemos la función pero no la ejecutamos directamente en el selector
  // para evitar crear un nuevo objeto en cada render
  const getExportableState = useVectorGridStore(state => state.getExportableState);
  
  // useVectorGridStore.getState().getExportableState() también podría funcionar sin causar re-renders
  return getExportableState();
};

/**
 * Hook para actualizar múltiples propiedades en una sola acción
 */
export const useUpdateProps = () => useVectorGridStore(state => state.updateProps);

/**
 * Hook selector para propiedades de interacción del ratón
 */
export const useMouseInteraction = () => {
  const mousePosition = useVectorGridStore(state => state.mousePosition);
  const setMousePosition = useVectorGridStore(state => state.setMousePosition);
  
  return {
    mousePosition,
    setMousePosition
  };
};

/**
 * Hook para actualizar las dimensiones del grid en el store
 */
export const useUpdateGridDimensions = () => {
  return useVectorGridStore(state => state.updateGridDimensions);
};

/**
 * Hook selector para acceder a todas las dimensiones del grid
 */
export const useGridDimensions = () => {
  return useVectorGridStore(state => state.gridDimensions);
};

/**
 * Hook selector para dimensiones efectivas del grid (ancho y alto utilizables)
 */
export const useGridEffectiveDimensions = () => {
  return useVectorGridStore(state => ({
    width: state.gridDimensions.effectiveWidth,
    height: state.gridDimensions.effectiveHeight
  }));
};

/**
 * Hook selector para offsets del grid (valores para centrado)
 */
export const useGridOffsets = () => {
  return useVectorGridStore(state => ({
    offsetX: state.gridDimensions.offsetX,
    offsetY: state.gridDimensions.offsetY
  }));
};
