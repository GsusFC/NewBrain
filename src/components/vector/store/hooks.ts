import { useVectorGridStore } from './vectorGridStore';
import type { AnimationProps, AspectRatioOption, GridSettings, VectorSettings } from '../core/types';

/**
 * Hook selector para configuraciones de animación
 * Selecciona solo las propiedades relacionadas con la animación del store
 * Esto permite que los componentes se actualicen solo cuando cambian estas propiedades específicas
 */
export const useAnimationSettings = () => useVectorGridStore(state => ({
  animationType: state.animationType,
  animationProps: state.animationProps,
  easingFactor: state.easingFactor,
  timeScale: state.timeScale,
  isPaused: state.isPaused,
  dynamicLengthEnabled: state.dynamicLengthEnabled,
  dynamicWidthEnabled: state.dynamicWidthEnabled,
  dynamicIntensity: state.dynamicIntensity,
  // Acciones
  togglePause: state.togglePause,
  updateAnimationSettings: state.updateAnimationSettings,
  setAnimationType: state.setAnimationType,
  setAnimationProps: state.setAnimationProps
}));

/**
 * Hook selector para configuraciones de la cuadrícula
 * Selecciona solo las propiedades relacionadas con la cuadrícula del store
 */
export const useGridSettings = () => useVectorGridStore(state => ({
  gridSettings: state.gridSettings,
  aspectRatio: state.aspectRatio,
  customAspectRatio: state.customAspectRatio,
  // Acciones
  setGridSettings: state.setGridSettings,
  setAspectRatio: state.setAspectRatio
}));

/**
 * Hook selector para configuraciones de vectores
 * Selecciona solo las propiedades relacionadas con los vectores del store
 */
export const useVectorSettings = () => useVectorGridStore(state => ({
  vectorSettings: state.vectorSettings,
  // Acciones
  setVectorSettings: state.setVectorSettings
}));

/**
 * Hook selector para configuraciones de renderizado
 * Selecciona solo las propiedades relacionadas con el renderizado del store
 */
export const useRenderSettings = () => useVectorGridStore(state => ({
  renderAsCanvas: state.renderAsCanvas,
  throttleMs: state.throttleMs,
  backgroundColor: state.backgroundColor,
  // Acciones
  toggleRenderer: state.toggleRenderer,
  setThrottleMs: state.setThrottleMs,
  setBackgroundColor: state.setBackgroundColor
}));

/**
 * Hook para obtener todos los valores exportables del store en formato de props para VectorGrid
 * Útil para pasar directamente todas las props al componente VectorGrid
 */
export const useExportableState = () => useVectorGridStore(state => state.getExportableState());

/**
 * Hook para actualizar múltiples propiedades en una sola acción
 */
export const useUpdateProps = () => useVectorGridStore(state => state.updateProps);

/**
 * Hook selector para propiedades de interacción del ratón
 */
export const useMouseInteraction = () => useVectorGridStore(state => ({
  mousePosition: state.mousePosition,
  // Acción
  setMousePosition: state.setMousePosition
}));
