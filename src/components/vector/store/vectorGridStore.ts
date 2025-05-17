import { create } from 'zustand';
import { getDefaultPropsForType } from '../core/animations';
import type { AnimationType, AnimationProps, AspectRatioOption, VectorGridProps, GridSettings, VectorSettings, VectorShape, StrokeLinecap, RotationOrigin, VectorColorValue } from '../core/types';
import type { GridDimensions } from '@/hooks/vector/useGridDimensions';

// Tipo para posición del mouse
interface MousePosition {
  x: number | null;
  y: number | null;
}

// Tipo para dimensiones del grid guardadas en el store
interface GridDimensionsState {
  width: number;
  height: number;
  effectiveWidth: number;
  effectiveHeight: number;
  offsetX: number;
  offsetY: number;
}

// Los valores iniciales, copiados de VectorPlayground.tsx
const INITIAL_STATE: VectorGridProps = {
  gridSettings: {
    rows: 12,
    cols: 18,
    spacing: 30,
    margin: 20
  },
  vectorSettings: {
    vectorShape: 'arrow',
    vectorLength: 24,
    vectorWidth: 4,
    vectorColor: '#3b82f6',
    strokeLinecap: 'round',
    rotationOrigin: 'center'
  },
  backgroundColor: '#0a0a0a', // Valor oscuro equivalente a bg-background
  animationType: 'smoothWaves',
  animationProps: {
    waveFrequency: 0.00025,
    waveAmplitude: 30
  },
  easingFactor: 0.1,
  timeScale: 1.0,
  dynamicLengthEnabled: true,
  dynamicWidthEnabled: false,
  dynamicIntensity: 0.7,
  renderAsCanvas: true,
  throttleMs: 16,
  isPaused: false,
  aspectRatio: 'auto',
  customAspectRatio: { width: 16, height: 9 }
};

// Interface para acciones del store
interface VectorGridActions {
  // Acciones para grid settings
  updateGridDimensions: (dimensions: GridDimensionsState) => void;
}

// Interfaz del store que extiende VectorGridProps para incluir acciones
interface VectorGridState extends VectorGridProps {
  // Acciones para GridSettings
  setGridSettings: (settings: Partial<GridSettings>) => void;
  
  // Acciones para VectorSettings
  setVectorSettings: (settings: Partial<VectorSettings>) => void;
  setVectorShape: (shape: VectorShape) => void;
  setVectorLength: (length: number) => void;
  setVectorWidth: (width: number) => void;
  setVectorColor: (color: VectorColorValue) => void;
  setStrokeLinecap: (linecap: StrokeLinecap) => void;
  setRotationOrigin: (origin: RotationOrigin) => void;
  
  // Acciones para AspectRatio
  setAspectRatio: (ratio: AspectRatioOption, customRatio?: { width: number; height: number }) => void;
  
  // Acciones para Animación
  setAnimationType: (type: AnimationType) => void;
  updateAnimationProps: (props: Partial<AnimationProps>) => void;
  setEasingFactor: (factor: number) => void;
  setTimeScale: (scale: number) => void;
  setDynamicLengthEnabled: (enabled: boolean) => void;
  setDynamicWidthEnabled: (enabled: boolean) => void;
  setDynamicIntensity: (intensity: number) => void;
  togglePause: () => void;
  
  // Acciones para Renderizado
  toggleRenderer: () => void;
  setThrottleMs: (ms: number) => void;
  
  // Actualizaciones por lotes
  updateProps: (props: Partial<VectorGridProps>) => void;
  updateAnimationSettings: (settings: Partial<Pick<VectorGridProps, 
    'animationType' | 'animationProps' | 'easingFactor' | 'timeScale' | 
    'dynamicLengthEnabled' | 'dynamicWidthEnabled' | 'dynamicIntensity' | 'isPaused'>>) => void;
  
  // Utilidades
  triggerPulse: () => void;
  getExportableState: () => VectorGridProps;
  resetToDefaults: () => void;
  
  // Acción para actualizar la posición del mouse
  setMousePosition: (position: MousePosition) => void;
  mousePosition: MousePosition;
  
  // Dimensiones del grid con offsets para centrado
  gridDimensions: GridDimensionsState;
  updateGridDimensions: (dimensions: GridDimensionsState) => void;
}

// Crear el store con Zustand
export const useVectorGridStore = create<VectorGridState>((set, get) => ({
  // Estado inicial
  ...INITIAL_STATE,
  mousePosition: { x: null, y: null },
  
  // Dimensiones del grid con valores iniciales
  gridDimensions: {
    width: 0,
    height: 0,
    effectiveWidth: 0,
    effectiveHeight: 0,
    offsetX: 0,
    offsetY: 0,
  },
  
  // Acciones para GridSettings
  setGridSettings: (settings) => 
    set((state) => ({
      gridSettings: { ...state.gridSettings, ...settings }
    })),
  
  // Acciones para VectorSettings
  setVectorSettings: (settings) => 
    set((state) => ({
      vectorSettings: { ...state.vectorSettings, ...settings }
    })),
  
  setVectorShape: (shape) => 
    set((state) => ({
      vectorSettings: { ...state.vectorSettings, vectorShape: shape }
    })),
  
  setVectorLength: (length) => 
    set((state) => ({
      vectorSettings: { ...state.vectorSettings, vectorLength: length }
    })),
  
  setVectorWidth: (width) => 
    set((state) => ({
      vectorSettings: { ...state.vectorSettings, vectorWidth: width }
    })),
  
  setVectorColor: (color) => 
    set((state) => ({
      vectorSettings: { ...state.vectorSettings, vectorColor: color }
    })),
  
  setStrokeLinecap: (linecap) => 
    set((state) => ({
      vectorSettings: { ...state.vectorSettings, strokeLinecap: linecap }
    })),
  
  setRotationOrigin: (origin) => 
    set((state) => ({
      vectorSettings: { ...state.vectorSettings, rotationOrigin: origin }
    })),
  
  // Acciones para AspectRatio
  setAspectRatio: (ratio, customRatio) => 
    set({ 
      aspectRatio: ratio, 
      customAspectRatio: customRatio 
    }),
  
  // Acciones para Animación
  setAnimationType: (type) => 
    set({ 
      animationType: type, 
      animationProps: getDefaultPropsForType(type) 
    }),
  
  updateAnimationProps: (props) => 
    set((state) => ({ 
      animationProps: { ...state.animationProps, ...props } 
    })),
  
  setEasingFactor: (factor) => set({ easingFactor: factor }),
  
  setTimeScale: (scale) => set({ timeScale: scale }),
  
  setDynamicLengthEnabled: (enabled) => set({ dynamicLengthEnabled: enabled }),
  
  setDynamicWidthEnabled: (enabled) => set({ dynamicWidthEnabled: enabled }),
  
  setDynamicIntensity: (intensity) => set({ dynamicIntensity: intensity }),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  // Acciones para Renderizado
  toggleRenderer: () => set((state) => ({ 
    renderAsCanvas: !state.renderAsCanvas 
  })),
  
  setThrottleMs: (ms) => set({ throttleMs: ms }),
  
  // Actualizaciones por lotes
  updateProps: (props) => set(props),
  
  updateAnimationSettings: (settings) => set(settings),
  
  // Utilidades
  triggerPulse: () => {
    console.log('Pulse triggered via store');
    // Esta función sería un puente hacia la implementación real de pulso
  },
  
  getExportableState: () => {
    // Retorna una copia limpia del estado actual
    const state = get();
    
    // Filtramos las propiedades que son funciones (acciones)
    const exportable: VectorGridProps = {};
    
    Object.keys(state).forEach(key => {
      const typedKey = key as keyof VectorGridState;
      if (typeof state[typedKey] !== 'function') {
        (exportable as any)[typedKey] = state[typedKey];
      }
    });
    
    return exportable;
  },
  
  resetToDefaults: () => set(INITIAL_STATE),
  
  // Actualizar dimensiones del grid
  updateGridDimensions: (dimensions) => set((state) => ({
    gridDimensions: {
      ...state.gridDimensions,
      ...dimensions
    }
  })),
  
  // Actualizar posición del ratón
  setMousePosition: (position) => set({ mousePosition: position })
}));

// Selector helper para optimizar rendimiento
export const useVectorGridSelector = <T>(selector: (state: VectorGridState) => T) => 
  useVectorGridStore(selector);
