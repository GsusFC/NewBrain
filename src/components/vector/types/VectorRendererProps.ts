
import { AnimatedVectorItem, VectorShape, StrokeLinecap, GradientConfig as CoreGradientConfig, VectorRenderProps } from '../core/types';
import React from 'react'; // Necesario para React.JSX.Element

export type RendererMode = 'svg' | 'canvas' | 'auto';
export type RotationOrigin = 'start' | 'center' | 'end'; 

// Se utiliza CoreGradientConfig directamente de '../core/types' donde 'coords' es requerida.
// La lógica de adaptación en VectorRenderer.tsx maneja la compatibilidad para props entrantes.

// Información de frame para animaciones
export interface FrameInfo {
  timestamp: number;
  frameCount?: number;
  deltaTime?: number;
  totalFrames?: number;
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
  baseVectorColor: string | CoreGradientConfig | ((item: AnimatedVectorItem, frameCount: number, totalFrames: number, timestamp: number) => string);
  baseVectorWidth: number | ((item: AnimatedVectorItem) => number);
  baseStrokeLinecap?: StrokeLinecap;
  baseVectorShape?: VectorShape;
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
  customRenderer?: (renderProps: VectorRenderProps) => React.JSX.Element;
}
