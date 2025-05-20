import { ReactNode } from 'react';
import { AnimatedVectorItem, VectorShape, StrokeLinecap, GradientConfig as CoreGradientConfig } from '../core/types';

export type RendererMode = 'svg' | 'canvas' | 'auto';
export type RotationOrigin = 'start' | 'center' | 'end'; 

// Usar el mismo tipo que en core/types.ts pero sin 'userSvg' que es específico del SVGRenderer
export type VectorShapeType = Exclude<VectorShape, 'userSvg'> | 'custom';

// Redefine el tipo de gradiente compatible con ambos renderizadores
export interface GradientConfig extends Omit<CoreGradientConfig, 'coords'> {
  // Mantener compatibilidad pero haciendo coords opcional
  coords?: CoreGradientConfig['coords'];
}

// Información de frame para animaciones
export interface FrameInfo {
  timestamp: number;
  frameCount?: number;
  deltaTime?: number;
  totalFrames?: number;
}

// Metadatos del vector para renderizado
export interface VectorRenderMetadata {
  isHovered: boolean;
  isSelected: boolean;
}

// Props para renderizado personalizado
export interface CustomRenderProps {
  item: AnimatedVectorItem;
  length: number;
  width: number;
  metadata: VectorRenderMetadata;
}

// Props comunes para ambos renderizadores
export interface VectorRendererProps {
  // Propiedades esenciales
  vectors: AnimatedVectorItem[];
  width: number;
  height: number;
  
  // Opciones de renderizado
  renderMode?: RendererMode;
  backgroundColor?: string;
  
  // Propiedades de vector base
  baseVectorLength: number | ((item: AnimatedVectorItem) => number);
  baseVectorColor: string | GradientConfig | ((item: AnimatedVectorItem, frameCount: number, totalFrames: number, timestamp: number) => string);
  baseVectorWidth: number | ((item: AnimatedVectorItem) => number);
  baseStrokeLinecap?: StrokeLinecap;
  baseVectorShape?: VectorShapeType;
  baseRotationOrigin?: RotationOrigin;
  
  // SVG personalizado
  userSvgString?: string;
  userSvgPreserveAspectRatio?: string;
  
  // Interacción
  onVectorClick?: (item: AnimatedVectorItem, event: React.MouseEvent) => void;
  onVectorHover?: (item: AnimatedVectorItem | null, event: React.MouseEvent) => void;
  interactionEnabled?: boolean;
  
  // Optimización
  cullingEnabled?: boolean;
  
  // Depuración
  debugMode?: boolean;
  
  // Animación
  frameInfo?: FrameInfo;
  
  // Renderizador personalizado (opcional)
  customRenderer?: (renderProps: CustomRenderProps, ctx?: CanvasRenderingContext2D) => void;
}
