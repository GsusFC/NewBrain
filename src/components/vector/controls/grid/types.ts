export interface GridSettings {
  rows?: number;
  cols?: number;
  margin?: number;
  spacing?: number;
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
  density?: number;
  baseRows?: number;
  targetDensity?: number;
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
  
  // Callback opcional para notificar cambios en aspectRatio (si aplica)
  onAspectRatioChange?: (ratio: AspectRatioOption, customRatio?: CustomAspectRatio) => void;
}
