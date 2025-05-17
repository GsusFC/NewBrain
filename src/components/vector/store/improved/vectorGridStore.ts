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
    rows: 12,
    cols: 18,
    spacing: 0.5,
    margin: 10,
  },
  vectorSettings: {
    vectorLength: 10,
    vectorWidth: 1.5,
    vectorColor: '#3498db',
    strokeLinecap: 'round',
    vectorShape: 'line',
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
  
  // Métodos para actualizar Grid Settings
  setGridSettings: (settings: Partial<GridSettings>) => void;
  
  // Métodos para actualizar Vector Settings
  setVectorSettings: (settings: Partial<VectorSettings>) => void;
  
  // Métodos para actualizar Aspect Ratio
  setAspectRatio: (aspectRatio: AspectRatioOption, customAspectRatio?: { width: number; height: number }) => void;
  
  // Métodos para actualizar Animation Settings
  setAnimationType: (type: AnimationType) => void;
  setAnimationProps: (props: Partial<AnimationProps>) => void;
  setEasingFactor: (factor: number) => void;
  setTimeScale: (scale: number) => void;
  setDynamicLengthEnabled: (enabled: boolean) => void;
  setDynamicWidthEnabled: (enabled: boolean) => void;
  setDynamicIntensity: (intensity: number) => void;
  togglePause: () => void;
  
  // Métodos para actualizar Render Settings
  toggleRenderer: () => void;
  setThrottleMs: (ms: number) => void;
  setBackgroundColor: (color: string) => void;
  
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

// Crear el store con Zustand
export const useVectorGridStore = create<VectorGridStore>((set, get) => ({
  // Estado inicial
  ...INITIAL_STATE,
  
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
  
  setEasingFactor: (factor) => set({ easingFactor: factor }),
  
  setTimeScale: (scale) => set({ timeScale: scale }),
  
  setDynamicLengthEnabled: (enabled) => set({ dynamicLengthEnabled: enabled }),
  
  setDynamicWidthEnabled: (enabled) => set({ dynamicWidthEnabled: enabled }),
  
  setDynamicIntensity: (intensity) => set({ dynamicIntensity: intensity }),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  // Métodos para actualizar Render Settings
  toggleRenderer: () => set((state) => ({ renderAsCanvas: !state.renderAsCanvas })),
  
  setThrottleMs: (ms) => set({ throttleMs: ms }),
  
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  
  // Método para actualizar Mouse Position
  setMousePosition: (position) => set({ mousePosition: position }),
  
  // Métodos de utilidad
  updateProps: (props) => set(props),
  
  updateAnimationSettings: (settings) => set(settings),
  
  triggerPulse: () => {
    console.log('Pulse triggered via store');
    // Esta función sería un puente hacia la implementación real de pulso
  },
  
  resetToDefaults: () => set(INITIAL_STATE),
  
  getExportableState: () => {
    const state = get();
    const exportable: VectorGridProps = {};
    
    // Filtramos solo las propiedades que son parte de VectorGridProps
    Object.keys(state).forEach(key => {
      const typedKey = key as keyof VectorGridStore;
      if (typeof state[typedKey] !== 'function' && typedKey !== 'mousePosition') {
        (exportable as any)[typedKey] = state[typedKey];
      }
    });
    
    return exportable;
  },
}));

// Selector helper para optimizar rendimiento
export const useVectorGridSelector = <T>(selector: (state: VectorGridStore) => T) => 
  useVectorGridStore(selector);
