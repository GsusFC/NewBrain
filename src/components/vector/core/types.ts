import React from 'react'; // Necesario para React.RefObject y React.ReactNode

// --- Tipos Reutilizables ---

// Define los tipos de forma de vector soportados
export type VectorShape = // `export` para que pueda ser usado en otros archivos
  | 'line'
  | 'arrow'
  | 'dot'
  | 'triangle'
  | 'semicircle'
  | 'curve'
  | 'custom'
  | 'userSvg'; // Añadido para SVG de usuario

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
  animationState?: Record<string, any>;
  flockId?: number;
  customData?: any;
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
  aspectRatio?: '1:1' | '2:1' | '16:9' | 'auto'; // Movido aquí si estaba en VectorGridProps
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

  // 2. Configuración de la Cuadrícula (Generador)
  gridSettings?: Partial<GridSettings>; // Agrupado

  // 3. Propiedades Visuales Base de los Vectores (Renderizador)
  vectorSettings?: Partial<VectorSettings>; // Agrupado

  // 4. Control de Animación (Animador)
  animationType?: string;
  animationProps?: Record<string, any>;
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
  animationType?: string; // Opcional, se puede tener una animación por defecto o ninguna
  animationProps?: Record<string, any>; // Opcional
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
}