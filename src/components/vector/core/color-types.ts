/**
 * Tipos para el manejo avanzado de colores en VectorGrid
 */

// Importar los tipos necesarios
import type { AnimatedVectorItem, GradientConfig as CoreGradientConfig } from './types';

// Re-exportar los tipos del sistema para mantener compatibilidad
export type { VectorColorValue } from './types';

// Tipos de gradiente disponibles
export type GradientType = 'linear' | 'radial';

// Parada de color en el selector de UI (más simple que el del sistema)
export interface GradientStop {
  color: string;
  position: number; // 0-100
}

// Versión UI-friendly de GradientConfig para el selector de color
export interface ColorControlGradient {
  type: GradientType;
  angle: number; // Para gradientes lineales (0-360)
  stops: GradientStop[];
}

// Paleta de colores predefinida
export interface ColorPalette {
  name: string;
  colors: string[];
  getColor?: (item: AnimatedVectorItem, colors: string[]) => string;
}

// Tipo que representa un valor de color para el control de UI
export type ColorValue = string | ColorControlGradient;

// Paletas predefinidas para uso común
export const PREDEFINED_PALETTES: ColorPalette[] = [
  { 
    name: "Azules", 
    colors: ["#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"] 
  },
  { 
    name: "Verdes", 
    colors: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"] 
  },
  { 
    name: "Neón", 
    colors: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF69B4"] 
  },
  { 
    name: "Cálidos", 
    colors: ["#ff4d00", "#ff8400", "#ffb700", "#ffd000"] 
  },
];

/**
 * Convierte un ColorControlGradient (UI-friendly) a un GradientConfig (compatible con el sistema)
 */
export function convertToSystemGradient(gradient: ColorControlGradient): CoreGradientConfig {
  // Convertir stops de formato UI (position: 0-100) a formato sistema (offset: 0-1)
  const stops = gradient.stops.map(stop => ({
    offset: stop.position / 100,
    color: stop.color,
    opacity: 1
  }));

  // Calcular coordenadas basadas en el ángulo (para gradientes lineales)
  // Para simplificar, usamos valores predeterminados para gradiente radial
  const coords = gradient.type === 'linear' 
    ? calculateLinearCoords(gradient.angle)
    : { cx: 0.5, cy: 0.5, r: 0.5, fx: 0.5, fy: 0.5 };

  return {
    type: gradient.type,
    stops,
    coords,
    units: 'objectBoundingBox'
  };
}

/**
 * Convierte un GradientConfig (del sistema) a un ColorControlGradient (UI-friendly)
 */
export function convertFromSystemGradient(gradient: CoreGradientConfig): ColorControlGradient {
  // Convertir stops de formato sistema (offset: 0-1) a formato UI (position: 0-100)
  const stops = gradient.stops.map(stop => ({
    color: stop.color,
    position: stop.offset * 100
  }));

  // Calcular ángulo basado en coordenadas (para gradientes lineales)
  // Por defecto usamos 90 grados para radiales
  const angle = gradient.type === 'linear' 
    ? calculateAngleFromCoords(gradient.coords)
    : 90;

  return {
    type: gradient.type,
    angle,
    stops
  };
}

/**
 * Calcula las coordenadas para un gradiente lineal basado en un ángulo
 */
function calculateLinearCoords(angle: number): CoreGradientConfig['coords'] {
  // Normalizar el ángulo a 0-360
  const normalizedAngle = angle % 360;
  const radians = (normalizedAngle * Math.PI) / 180;
  
  // Calcular los puntos finales
  let x1 = 0.5 - 0.5 * Math.cos(radians);
  let y1 = 0.5 - 0.5 * Math.sin(radians);
  let x2 = 0.5 + 0.5 * Math.cos(radians);
  let y2 = 0.5 + 0.5 * Math.sin(radians);
  
  // Limitar a un rango válido (0-1)
  x1 = Math.max(0, Math.min(1, x1));
  y1 = Math.max(0, Math.min(1, y1));
  x2 = Math.max(0, Math.min(1, x2));
  y2 = Math.max(0, Math.min(1, y2));
  
  return { x1, y1, x2, y2 };
}

/**
 * Calcula el ángulo a partir de las coordenadas de un gradiente lineal
 */
function calculateAngleFromCoords(coords: CoreGradientConfig['coords']): number {
  // Valores por defecto si no hay coordenadas
  const x1 = coords.x1 !== undefined ? Number(coords.x1) : 0;
  const y1 = coords.y1 !== undefined ? Number(coords.y1) : 0;
  const x2 = coords.x2 !== undefined ? Number(coords.x2) : 1;
  const y2 = coords.y2 !== undefined ? Number(coords.y2) : 0;
  
  // Calcular el ángulo en radianes y convertir a grados
  const angle = Math.atan2(y2 - y1, x2 - x1);
  let degrees = (angle * 180) / Math.PI;
  
  // Normalizar a 0-360
  degrees = (degrees + 360) % 360;
  
  return degrees;
}

// Funciones para calcular ángulos de color en HSL
export function getHueFromDegrees(degrees: number): number {
  return degrees % 360;
}
