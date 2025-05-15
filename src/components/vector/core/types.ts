import React from 'react'; // Necesario para React.RefObject y React.ReactNode
import type { AnimationType as ImportedAnimationType } from './animations/animationTypes'; // Importar AnimationType

export type AnimationType = ImportedAnimationType; // Re-exportar AnimationType

// --- Tipos Reutilizables ---

// Define los tipos de forma de vector soportados
export type VectorShape =
  | 'line'
  | 'arrow'
  | 'dot'
  | 'triangle'
  | 'semicircle'
  | 'curve'
  | 'custom'
  | 'userSvg';

// Tipos exportados para renderers
export type StrokeLinecap = 'butt' | 'round' | 'square';
export type RotationOrigin = 'start' | 'center' | 'end';

// Define las opciones de relación de aspecto soportadas
export type AspectRatioOption =
  | 'auto'        // Se adapta al contenedor padre (anteriormente 'container')
  | '1:1'         // Cuadrado
  | '2:1'         // Doble ancho que alto
  | '16:9'        // Formato panorámico
  | 'custom';     // Relación de aspecto personalizada definida por el usuario

// Propiedades específicas para las animaciones
export interface AnimationProps {
  waveFrequency?: number;
  waveAmplitude?: number;
  baseAngle?: number;
  patternScale?: number;
  speed?: number; // Ejemplo: para 'centerPulse'
  duration?: number; // Ejemplo: para 'centerPulse'
  // Agrega aquí otras propiedades comunes de animación que necesites
  [key: string]: unknown; // Permite propiedades adicionales dinámicas
}

// Define la configuración para degradados de color
export interface GradientConfig { // `export`
  type: 'linear' | 'radial';
  stops: Array<{ offset: number; color: string; opacity?: number }>;
  coords: {
    x1?: string | number; y1?: string | number; x2?: string | number; y2?: string | number;
    cx?: string | number; cy?: string | number; r?: string | number;
    fx?: string | number; fy?: string | number;
  };
  units?: 'userSpaceOnUse' | 'objectBoundingBox';
}

// Estructura de Datos del Vector (Estado Animado)
export interface AnimatedVectorItem { // `export`
  id: string;
  r: number;
  c: number;
  baseX: number;
  baseY: number;
  initialAngle: number;
  currentAngle: number;
  lengthFactor: number;
  widthFactor: number;
  intensityFactor?: number; // Añadido para efectos de intensidad (ej. color, opacidad)
  previousAngle?: number;
  targetAngle?: number;
  animationState?: Record<string, unknown>;
  flockId?: number;
  customData?: unknown;
}

// Define el tipo complejo para el color del vector
export type VectorColorValue = // `export`
  | string
  | ((item: AnimatedVectorItem, frame: number, totalFrames: number, timestamp: number) => string)
  | GradientConfig;

// Propiedades para la Función Custom Renderer
export interface VectorRenderProps { // `export`
  item: AnimatedVectorItem;
  dimensions: { width: number; height: number };
  baseVectorLength: number;
  baseVectorColor: VectorColorValue;
  baseVectorWidth: number;
  baseStrokeLinecap?: 'butt' | 'round' | 'square';
  baseVectorShape: VectorShape;
  baseRotationOrigin: 'start' | 'center' | 'end';
  actualLength: number;
  actualStrokeWidth: number;
  getRotationOffset: (origin: 'start' | 'center' | 'end', length: number) => number;
  // ctx?: CanvasRenderingContext2D; // Opcional para Canvas
}

// Interfaz de Props para el Componente VectorGrid
export interface GridSettings { // Asegurarse que contenga todas las props de DEFAULT_GRID_SETTINGS
  rows?: number;
  cols?: number;
  spacing?: number;
  margin?: number;
  vectorsPerFlock?: number; // Nueva propiedad para agrupar vectores
  userSvg?: string;
  userSvgPreserveAspectRatio?: string;
}

export interface VectorSettings { // Asegurarse que contenga todas las props de DEFAULT_VECTOR_SETTINGS
  vectorLength?: number | ((item: AnimatedVectorItem) => number); // Permitir función
  vectorColor?: VectorColorValue;
  vectorWidth?: number | ((item: AnimatedVectorItem) => number); // Permitir función
  strokeLinecap?: 'butt' | 'round' | 'square';
  vectorShape?: VectorShape;
  rotationOrigin?: 'start' | 'center' | 'end'; 
  initialRotation?: number | ((item: AnimatedVectorItem) => number); // Añadido initialRotation
}

export interface VectorGridProps { // `export`
  // 1. Configuración del Contenedor y Diseño General
  width?: number;
  height?: number;
  containerFluid?: boolean;
  externalContainerRef?: React.RefObject<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  debugMode?: boolean;
  containerClassName?: string; // Considerar unificar con className
  containerStyle?: React.CSSProperties; // Considerar unificar con style
  backgroundColor?: string;
  containerRef?: React.RefObject<HTMLElement>;
  /**
   * Define la relación de aspecto a forzar para el área de renderizado.
   * Si es 'container', se adapta a las dimensiones del contenedor HTML.
   * Si es un valor predefinido (ej. '16:9'), se fuerza esa proporción.
   * Si es 'custom', se utiliza la prop `customAspectRatio`.
   * Ignorado si `width` y `height` fijas son proporcionadas.
   * @default 'container'
   */
  aspectRatio?: AspectRatioOption;
  
  /**
   * Define una relación de aspecto personalizada cuando `aspectRatio` es 'custom'.
   * Ejemplo: { width: 4, height: 3 } para un ratio de 4:3.
   * Ambos valores deben ser mayores que 0.
   */
  customAspectRatio?: { width: number; height: number };

  // 2. Configuración de la Cuadrícula (Generador)
  gridSettings?: Partial<GridSettings>; // Agrupado

  // 3. Propiedades Visuales Base de los Vectores (Renderizador)
  vectorSettings?: Partial<VectorSettings>; // Agrupado

  // 4. Control de Animación (Animador)
  animationType?: AnimationType; // Usar AnimationType re-exportada
  animationProps?: AnimationProps; // Usar el tipo AnimationProps definido
  isPaused?: boolean;
  easingFactor?: number;
  timeScale?: number;
  dynamicLengthEnabled?: boolean;
  dynamicWidthEnabled?: boolean;
  dynamicIntensity?: number;

  // 5. Rendimiento y Tecnología de Renderizado
  renderAsCanvas?: boolean;
  throttleMs?: number;

  // 6. Interacción y Callbacks
  onVectorClick?: (item: AnimatedVectorItem, event: React.MouseEvent | React.TouchEvent) => void;
  onVectorHover?: (item: AnimatedVectorItem | null, event: React.MouseEvent | React.TouchEvent) => void;
  onAnimationLoopComplete?: () => void;
  onPulseComplete?: () => void;
  onRenderFrame?: (items: AnimatedVectorItem[], timestamp: number) => void;
}

// Interfaz para la Ref del Componente VectorGrid
export interface VectorGridRef {
  triggerPulse: (vectorId?: string | string[]) => void;
  getVectors: () => AnimatedVectorItem[];
  // Podrías añadir setVectors si lo necesitas en el futuro
  // setVectors: (newVectors: AnimatedVectorItem[]) => void;
}

// Dimensiones del contenedor del grid.
export interface VectorDimensions {
  width: number;
  height: number;
}

export interface UseVectorGridProps {
  dimensions: { width: number; height: number };
  gridSettings: GridSettings;
  vectorSettings: VectorSettings;
  debugMode?: boolean; // Añadido para logs condicionales
}

export interface UseVectorGridReturn {
  initialVectors: AnimatedVectorItem[];
  calculatedCols: number;
  calculatedRows: number;
  calculatedGridWidth: number;
  calculatedGridHeight: number;
}

export interface AnimationSettings {
  animationType?: AnimationType; // Usar AnimationType re-exportada
  animationProps?: AnimationProps; // Usar el tipo AnimationProps definido
  isPaused?: boolean; // Opcional, por defecto false
  easingFactor?: number; // Opcional, por defecto un valor estándar
  timeScale?: number; // Opcional, por defecto 1
  dynamicLengthEnabled?: boolean; // Opcional, por defecto false
  dynamicWidthEnabled?: boolean; // Opcional, por defecto false
  dynamicIntensity?: number; // Opcional, por defecto 1
  throttleMs?: number; // Opcional, por defecto un valor razonable (e.g., 16ms)
}

export interface UseVectorAnimationProps {
  initialVectors: AnimatedVectorItem[];
  dimensions: { width: number; height: number };
  animationSettings: AnimationSettings;
  mousePosition?: { x: number; y: number } | null; // Opcional, no todas las animaciones lo necesitan
  pulseTrigger?: number; // Opcional, para animaciones de pulso
  containerRef?: React.RefObject<HTMLElement>; // Añadido para interacciones relativas al contenedor
  onPulseComplete?: (vectorId: string) => void; // Callback cuando un vector individual completa su pulso
  onAllPulsesComplete?: () => void; // Callback cuando todos los vectores han completado su pulso
  throttleMs?: number; // Tiempo de throttling en milisegundos (por defecto 16ms)
}

export interface UseVectorAnimationReturn {
  animatedVectors: AnimatedVectorItem[];
  setAnimatedVectors: React.Dispatch<React.SetStateAction<AnimatedVectorItem[]>>; // Para manipulación externa si es necesario
  triggerPulse: () => void; // Función para iniciar un pulso de animación
}

export interface UseContainerDimensionsArgs {
  containerRef: React.RefObject<HTMLElement>;
  aspectRatio?: AspectRatioOption;
  customAspectRatio?: { width: number; height: number };
  fixedWidth?: number;
  fixedHeight?: number;
}
