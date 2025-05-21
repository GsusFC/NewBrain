import { create } from 'zustand';
import type {
  AnimationType,
  AnimationProps,
  AspectRatioOption,
  VectorGridProps,
  GridSettings,
  VectorSettings
} from '../../core/types';
import { getDefaultPropsForType } from '../../core/animations';

// Tipo para la posición del mouse
interface MousePosition {
  x: number | null;
  y: number | null;
}

// Valores iniciales
const INITIAL_STATE: VectorGridProps & { mousePosition: MousePosition } = {
  gridSettings: {
    rows: 10,
    cols: 15,
    spacing: 18,
    margin: 20,
  },
  vectorSettings: {
    vectorLength: 30,
    vectorWidth: 2.5,
    vectorColor: '#3498db',
    strokeLinecap: 'round',
    vectorShape: 'arrow',
    rotationOrigin: 'center',
  },
  animationType: 'smoothWaves',
  animationProps: {
    waveFrequency: 1,
    waveAmplitude: 0.8,
    patternScale: 1
  },
  easingFactor: 0.05,
  timeScale: 1,
  dynamicLengthEnabled: false,
  dynamicWidthEnabled: false,
  dynamicIntensity: 0.5,
  isPaused: false,
  renderAsCanvas: false,
  throttleMs: 1000 / 60, // 60 FPS por defecto
  backgroundColor: 'transparent',
  aspectRatio: '16:9',
  customAspectRatio: { width: 16, height: 9 },
  // Valor inicial para la posición del mouse
  mousePosition: { x: null, y: null }
};

// Definimos el tipo para nuestro store
interface VectorGridStore extends VectorGridProps {
  // Propiedades adicionales (no presentes en VectorGridProps)
  mousePosition: MousePosition;
  
  // Grid Dimensions (nuevo)
  gridDimensions: {
    effectiveWidth: number;
    effectiveHeight: number;
    offsetX: number;
    offsetY: number;
  };
  
  // Métodos para actualizar Grid Settings
  setGridSettings: (settings: Partial<GridSettings>) => void;
  
  // Métodos para actualizar Vector Settings
  setVectorSettings: (settings: Partial<VectorSettings>) => void;
  
  // Métodos para actualizar Aspect Ratio
  setAspectRatio: (aspectRatio: AspectRatioOption, customAspectRatio?: { width: number; height: number }) => void;
  
  // Métodos para actualizar Animation Settings
  setAnimationType: (type: AnimationType) => void;
  setAnimationProps: (props: Partial<AnimationProps>) => void;
  updateAnimationProps: (props: Partial<AnimationProps>) => void; // Alias para setAnimationProps
  setEasingFactor: (factor: number) => void;
  setTimeScale: (scale: number) => void;
  setDynamicLengthEnabled: (enabled: boolean) => void;
  setDynamicWidthEnabled: (enabled: boolean) => void;
  setDynamicIntensity: (intensity: number) => void;
  togglePause: () => void;
  
  // Métodos para actualizar Render Settings
  toggleRenderer: () => void;
  setRenderAsCanvas: (value: boolean) => void;
  setRendererMode: (renderer: 'svg' | 'canvas') => void;
  setThrottleMs: (ms: number) => void;
  setBackgroundColor: (color: string) => void;
  
  // Métodos para actualizar Grid Dimensions
  updateGridDimensions: (dimensions: { effectiveWidth: number; effectiveHeight: number; offsetX: number; offsetY: number }) => void;
  
  // Métodos para actualizar Mouse Position
  setMousePosition: (position: MousePosition) => void;
  
  // Métodos de utilidad
  updateProps: (props: Partial<VectorGridProps>) => void;
  updateAnimationSettings: (settings: Partial<{
    animationType: AnimationType;
    animationProps: AnimationProps;
    easingFactor: number;
    timeScale: number;
  }>) => void;
  triggerPulse: () => void;
  resetToDefaults: () => void;
  getExportableState: () => VectorGridProps;
}

// Dimensiones iniciales del grid
const initialGridDimensions = {
  effectiveWidth: 0,
  effectiveHeight: 0,
  offsetX: 0,
  offsetY: 0
};

// Crear el store con Zustand
export const useVectorGridStore = create<VectorGridStore>((set, get) => ({
  // Estado inicial
  ...INITIAL_STATE,
  
  // Agregar dimensiones del grid
  gridDimensions: initialGridDimensions,
  
  // Métodos para actualizar Grid Settings
  setGridSettings: (settings) => set((state) => ({
    gridSettings: { ...state.gridSettings, ...settings }
  })),
  
  // Métodos para actualizar Vector Settings
  setVectorSettings: (settings) => set((state) => ({
    vectorSettings: { ...state.vectorSettings, ...settings }
  })),
  
  // Métodos para actualizar Aspect Ratio
  setAspectRatio: (aspectRatio, customAspectRatio) => set({
    aspectRatio,
    customAspectRatio: customAspectRatio || get().customAspectRatio
  }),
  
  // Métodos para actualizar Animation Settings
  setAnimationType: (type) => {
    const defaultProps = getDefaultPropsForType(type);
    set({
      animationType: type,
      animationProps: {
        ...get().animationProps,
        ...defaultProps
      }
    });
  },
  
  setAnimationProps: (props) => set((state) => ({
    animationProps: { ...state.animationProps, ...props }
  })),
  
  // Alias para setAnimationProps para compatibilidad
  updateAnimationProps: (props) => set((state) => ({
    animationProps: { ...state.animationProps, ...props }
  })),
  
  setEasingFactor: (factor) => set({ easingFactor: factor }),
  
  setTimeScale: (scale) => set({ timeScale: scale }),
  
  setDynamicLengthEnabled: (enabled) => set({ dynamicLengthEnabled: enabled }),
  
  setDynamicWidthEnabled: (enabled) => set({ dynamicWidthEnabled: enabled }),
  
  setDynamicIntensity: (intensity) => set({ dynamicIntensity: intensity }),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  // Métodos para actualizar Render Settings
  toggleRenderer: () => {
    // Advertencia cuando se intenta cambiar a Canvas
    if (process.env.NODE_ENV !== 'production') {
      console.warn('El renderizador Canvas ha sido desactivado. Solo se permite el uso de SVG.');
    }
    // Siempre establece renderAsCanvas a false, ignorando el estado actual
    set({ renderAsCanvas: false });
  },
  
  // Actualizar el renderizador (ignorar = siempre SVG)
  setRendererMode: (renderer: 'svg' | 'canvas') => {
    if (renderer === 'canvas' && process.env.NODE_ENV !== 'production') {
      console.warn('El renderizador Canvas ha sido desactivado. Solo se permite el uso de SVG.');
    }
    // Siempre establece renderAsCanvas a false, ignorando el valor intentado
    set({ renderAsCanvas: false });
  },
  
  setThrottleMs: (ms) => set({ throttleMs: ms }),
  
  setRenderAsCanvas: (value: boolean) => {
    // Si se intenta cambiar a true, mostrar advertencia
    if (value === true && process.env.NODE_ENV !== 'production') {
      console.warn('El renderizador Canvas ha sido desactivado. No se puede cambiar a modo Canvas.');
    }
    // Siempre establecer a false, ignorando el valor intentado
    set({ renderAsCanvas: false });
  },
  
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  
  // Método para actualizar Grid Dimensions
  updateGridDimensions: (dimensions) => set({
    gridDimensions: dimensions
  }),
  
  // Método para actualizar Mouse Position
  setMousePosition: (position) => set({ mousePosition: position }),
  
  // Métodos de utilidad
  updateProps: (props) => set(props),
  
  updateAnimationSettings: (settings) => set(settings),
  
  triggerPulse: () => {
    // console.log('Pulse triggered via store'); // Comentado para evitar lint warning
    // Esta función sería un puente hacia la implementación real de pulso
  },
  
  resetToDefaults: () => set(INITIAL_STATE),
  
  getExportableState: (): VectorGridProps => {
    const state = get();
    // Desestructurar para omitir funciones y mousePosition, el resto es el estado exportable.
    const {
      // Funciones de acción (setters, toggles, etc.) - prefijadas con _ para indicar que no se usan directamente aquí
      setGridSettings: _setGridSettings,
      setVectorSettings: _setVectorSettings,
      setAspectRatio: _setAspectRatio,
      setAnimationType: _setAnimationType,
      setAnimationProps: _setAnimationProps,
      setEasingFactor: _setEasingFactor,
      setTimeScale: _setTimeScale,
      setDynamicLengthEnabled: _setDynamicLengthEnabled,
      setDynamicWidthEnabled: _setDynamicWidthEnabled,
      setDynamicIntensity: _setDynamicIntensity,
      togglePause: _togglePause,
      toggleRenderer: _toggleRenderer,
      setRenderAsCanvas: _setRenderAsCanvas,
      setRendererMode: _setRendererMode,
      setThrottleMs: _setThrottleMs,
      setBackgroundColor: _setBackgroundColor,
      setMousePosition: _setMousePosition,
      updateProps: _updateProps,
      updateAnimationSettings: _updateAnimationSettings,
      triggerPulse: _triggerPulse,
      resetToDefaults: _resetToDefaults,
      getExportableState: _getExportableState, // la propia función
      // Propiedades no exportables
      mousePosition: _mousePosition,
      // El resto de las propiedades (VectorGridProps)
      ...exportableState
    } = state;
    
    return exportableState;
  },
}));

// Selector helper para optimizar rendimiento
export const useVectorGridSelector = <T>(selector: (state: VectorGridStore) => T) => 
  useVectorGridStore(selector);
