/**
 * Utilidades de culling para VectorGrid
 * 
 * Este módulo proporciona funciones para optimizar el renderizado
 * mediante técnicas de culling (eliminación de elementos fuera de pantalla).
 */

import { AnimatedVectorItem } from '../core/types';

/**
 * Interfaz para los límites del viewport
 */
export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calcula el padding adaptativo según la longitud base del vector
 * @param baseLength - Longitud base del vector o vectores a considerar
 * @param minPadding - Padding mínimo (por defecto 150px)
 * @returns Valor de padding adaptativo
 */
export function calculateAdaptivePadding(
  baseLength: number | AnimatedVectorItem[],
  minPadding = 150
): number {
  // Si es un array de vectores, extraemos la longitud máxima
  if (Array.isArray(baseLength)) {
    if (baseLength.length === 0) return minPadding;
    
    // Encontrar la longitud máxima entre todos los vectores
    const maxLength = Math.max(
      ...baseLength.map(v => typeof v.length === 'number' ? v.length : 0)
    );
    
    return Math.max(minPadding, maxLength * 3);
  }
  
  // Si es un número, aplicamos el factor directamente
  return Math.max(minPadding, baseLength * 3);
}

/**
 * Aplica culling a una lista de vectores para filtrar aquellos fuera del viewport
 * @param vectors - Lista de vectores a filtrar
 * @param width - Ancho del viewport
 * @param height - Alto del viewport
 * @param padding - Padding opcional o longitud base para calcular padding adaptativo
 * @returns Lista filtrada de vectores
 */
export function applyCulling(
  vectors: AnimatedVectorItem[], 
  width: number, 
  height: number, 
  padding?: number | AnimatedVectorItem[]
): AnimatedVectorItem[] {
  if (!vectors || vectors.length === 0 || width <= 0 || height <= 0) {
    return [];
  }
  
  // Determinar padding (adaptativo o fijo)
  const actualPadding = padding !== undefined
    ? (typeof padding === 'number' ? padding : calculateAdaptivePadding(padding))
    : 150;
  
  // Definir los límites de visualización con padding
  const bounds: ViewportBounds = {
    minX: -actualPadding,
    minY: -actualPadding,
    maxX: width + actualPadding,
    maxY: height + actualPadding
  };
  
  // Filtrar vectores dentro de los límites
  return vectors.filter(vector => {
    if (!vector) return false;
    
    const { x, y } = vector;
    
    return (
      x >= bounds.minX && 
      x <= bounds.maxX && 
      y >= bounds.minY && 
      y <= bounds.maxY
    );
  });
}

/**
 * Verifica si un vector está dentro de los límites especificados
 * @param vector - Vector a verificar
 * @param bounds - Límites del viewport
 * @returns true si el vector está dentro de los límites
 */
export function isVectorInBounds(
  vector: AnimatedVectorItem,
  bounds: ViewportBounds
): boolean {
  const { x, y } = vector;
  
  return (
    x >= bounds.minX && 
    x <= bounds.maxX && 
    y >= bounds.minY && 
    y <= bounds.maxY
  );
}
