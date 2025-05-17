export interface GridSettings {
  rows?: number;
  cols?: number;
  margin?: number;
  spacing?: number;
  /**
   * La densidad controla el número base de filas cuando se usa
   * en conjunto con un aspect ratio específico
   */
  density?: number;
  /**
   * Indica si los valores fueron establecidos manualmente
   * y no deben ser sobrescritos por recálculos automáticos
   */
  userDefined?: boolean;
}

export type AspectRatioOption = 'auto' | '1:1' | '16:9' | '2:1' | 'custom';

export interface CustomAspectRatio {
  width: number;
  height: number;
}

// Opciones para el calculador de aspect ratio
export interface CalculatorOptions {
  containerWidth?: number;
  containerHeight?: number;
  spacing?: number;
  margin?: number;
  /** Padding interno opcional para añadir espacio dentro de los márgenes */
  padding?: number;
  /** Aspect ratio seleccionado */
  aspectRatio?: AspectRatioOption;
  /** Densidad base (número aproximado de filas) */
  density?: number;
  /** Filas base para el cálculo */
  baseRows?: number;
  /** Densidad objetivo para el grid */
  targetDensity?: number;
  /** Flag para indicar cálculo exacto vs ajustado */
  exact?: boolean;
}

// Modos de gestión del grid
export type GridManagementMode = 'autoAdjust' | 'userDefined' | 'densityBased';

// Configuración expandida para el grid
export interface GridConfig extends GridSettings {
  /** Modo de gestión del grid */
  mode?: GridManagementMode;
  /** Aspect ratio seleccionado */
  aspectRatio?: AspectRatioOption;
  /** Ratio personalizado si aspectRatio es 'custom' */
  customRatio?: CustomAspectRatio;
}

// Interfaz común para los tres controles
export interface GridControlProps {
  // Props comunes
  initialSettings?: GridSettings;
  onChange: (settings: GridSettings) => void;
  
  // Props específicas que cada módulo puede usar o ignorar
  initialAspectRatio?: AspectRatioOption;
  initialCustomRatio?: CustomAspectRatio;
  backgroundColor?: string;
  
  // Nueva propiedad para densidad
  initialDensity?: number;
  
  // Nuevas propiedades para modo de gestión
  gridManagementMode?: GridManagementMode;
  onModeChange?: (mode: GridManagementMode) => void;
  
  // Callback opcional para notificar cambios en aspectRatio (si aplica)
  onAspectRatioChange?: (ratio: AspectRatioOption, customRatio?: CustomAspectRatio) => void;
  
  // Callback opcional para notificar cambios en densidad
  onDensityChange?: (density: number) => void;
}
