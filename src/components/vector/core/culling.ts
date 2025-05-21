/**
 * Sistema de culling optimizado para VectorGrid
 * Implementa algoritmos eficientes para detectar qué vectores están dentro del viewport
 * y evitar el renderizado innecesario de aquellos que no son visibles
 */

import type { AnimatedVectorItem } from './types';
import { fixPrecision } from '@/utils/precision';
import { 
  DEFAULT_BASE_VECTOR_LENGTH, 
  DEFAULT_BASE_VECTOR_WIDTH,
  DEFAULT_CULLING_PADDING,
  LOD_DISTANCE_THRESHOLD_FACTOR,
  MIN_LOD_FACTOR
} from './constants';

export interface CullingOptions {
  /** Longitud base de los vectores en píxeles */
  baseVectorLength?: number;
  /** Ancho base de los vectores en píxeles */
  baseVectorWidth?: number;
  /** Padding adicional para evitar cortes bruscos en los bordes */
  padding?: number;
  /** Umbral para aplicar LOD como factor del tamaño de la pantalla (0-1) */
  lodThresholdFactor?: number;
  /** Factor mínimo de LOD (0-1) */
  minLodFactor?: number;
  /** Habilita/deshabilita el nivel de detalle */
  enableLOD?: boolean;
  /** Usa un quadtree para optimización espacial */
  useQuadtree?: boolean;
}

/**
 * Determina si un vector debe ser renderizado basado en su posición y dimensiones
 * @param vector - El vector a evaluar
 * @param viewportWidth - Ancho del viewport
 * @param viewportHeight - Alto del viewport
 * @param padding - Padding adicional para evitar cortes bruscos (por defecto 50px)
 * @returns true si el vector debe renderizarse, false si debe ocultarse
 */
/**
 * Determina si un vector debe ser renderizado basado en su posición y dimensiones
 */
export const isVectorVisible = (
  vector: AnimatedVectorItem,
  viewportWidth: number,
  viewportHeight: number,
  options: CullingOptions = {}
): boolean => {
  // Obtener valores de las opciones o usar valores por defecto
  const {
    baseVectorLength = DEFAULT_BASE_VECTOR_LENGTH,
    baseVectorWidth = DEFAULT_BASE_VECTOR_WIDTH,
    padding = DEFAULT_CULLING_PADDING
  } = options;
  
  // Pre-calcular y truncar valores que se usan múltiples veces
  const vpW = Math.trunc(viewportWidth);
  const vpH = Math.trunc(viewportHeight);
  const pad = Math.trunc(padding);
  const pad2 = pad * 2;
  
  // Calcular dimensiones del viewport con padding una sola vez
  const paddedVpW = vpW + pad2;
  const paddedVpH = vpH + pad2;
  
  // Obtener posición base del vector (sin redondear aún)
  const x = vector.baseX;
  const y = vector.baseY;
  
  // Calcular dimensiones del vector
  const length = baseVectorLength * (vector.lengthFactor || 1);
  const width = baseVectorWidth * (vector.widthFactor || 1);
  
  // Calcular ángulo y extremos del vector
  const angleRad = vector.currentAngle;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  const endX = x + cosAngle * length;
  const endY = y + sinAngle * length;
  
  // Radio de detección basado en el ancho del vector (mínimo 10px)
  const detectionRadius = Math.max(width * 0.5, 10);
  const detectionWithPadding = detectionRadius + pad;
  
  // Calcular límites del bounding box del vector
  const minX = Math.min(x, endX) - detectionWithPadding;
  const maxX = Math.max(x, endX) + detectionWithPadding;
  const minY = Math.min(y, endY) - detectionWithPadding;
  const maxY = Math.max(y, endY) + detectionWithPadding;
  
  // Optimización: verificar si el punto inicial está dentro del viewport con margen
  if (x >= -pad && x <= vpW + pad && y >= -pad && y <= vpH + pad) {
    return true;
  }
  
  // Verificar si el bounding box del vector está completamente fuera del viewport
  return !(maxX < 0 || minX > paddedVpW || maxY < 0 || minY > paddedVpH);
};

/**
 * Filtra una lista de vectores para incluir solo los visibles
 * @param vectors - Lista de vectores a filtrar
 * @param viewportWidth - Ancho del viewport en píxeles
 * @param viewportHeight - Alto del viewport en píxeles
 * @param options - Opciones de configuración para el culling
 * @returns Lista filtrada de vectores visibles
 */
/**
 * Filtra vectores visibles con optimizaciones de rendimiento
 */
export const filterVisibleVectors = (
  vectors: AnimatedVectorItem[],
  viewportWidth: number,
  viewportHeight: number,
  options: CullingOptions = {}
): AnimatedVectorItem[] => {
  // Pre-redondear las dimensiones del viewport una sola vez
  const vpW = Math.trunc(viewportWidth);
  const vpH = Math.trunc(viewportHeight);
  
  // Crear una versión de las opciones con los valores redondeados
  const processedOptions = {
    ...options,
    padding: options.padding ? Math.trunc(options.padding) : DEFAULT_CULLING_PADDING
  };
  
  // Aplicar filtro de visibilidad
  return vectors.filter(vector => isVectorVisible(vector, vpW, vpH, processedOptions));
};

/**
 * Implementa el algoritmo de quadtree para optimizar la detección espacial
 * Este es útil cuando hay muchos vectores y necesitamos una detección eficiente
 * @param vectors - Lista completa de vectores
 * @param viewportWidth - Ancho del viewport
 * @param viewportHeight - Alto del viewport
 * @returns Lista óptima de vectores visibles utilizando spatial partitioning
 */
export const getOptimizedVisibleVectors = (
  vectors: AnimatedVectorItem[],
  viewportWidth: number,
  viewportHeight: number
): AnimatedVectorItem[] => {
  // Para vectores largos, podemos necesitar una implementación más sofisticada
  // que simplemente filtrar los visibles
  
  // Por ahora, aplicamos el filtro básico, pero esto puede extenderse
  // con una implementación completa de quadtree  // 1. Filtrar vectores visibles
  const visibleVectors = filterVisibleVectors(
    vectors,
    viewportWidth,
    viewportHeight
  );
  return visibleVectors;
};

/**
 * Calcula niveles de detalle (LOD) para vectores basados en su distancia al centro
 * Vectores más lejanos pueden renderizarse con menor detalle para optimizar rendimiento
 * @param vectors - Lista de vectores a procesar
 * @param viewportWidth - Ancho del viewport
 * @param viewportHeight - Alto del viewport
 * @returns Lista de vectores con ajustes de LOD aplicados
 */
/**
 * Aplica niveles de detalle (LOD) a los vectores basados en su distancia al centro
 * @param vectors - Lista de vectores a procesar
 * @param viewportWidth - Ancho del viewport en píxeles
 * @param viewportHeight - Alto del viewport en píxeles
 * @param options - Opciones de configuración para el LOD
 * @returns Lista de vectores con ajustes de LOD aplicados
 */
export const applyLevelOfDetail = (
  vectors: AnimatedVectorItem[],
  viewportWidth: number,
  viewportHeight: number,
  options: CullingOptions = {}
): AnimatedVectorItem[] => {
  const {
    lodThresholdFactor = LOD_DISTANCE_THRESHOLD_FACTOR,
    minLodFactor = MIN_LOD_FACTOR
  } = options;
  
  // Pre-calcular valores que se usan múltiples veces
  const vpW = Math.trunc(viewportWidth);
  const vpH = Math.trunc(viewportHeight);
  
  // Calcular centro del viewport
  const centerX = vpW * 0.5;
  const centerY = vpH * 0.5;
  
  // Calcular umbral de distancia para LOD
  const distanceThreshold = Math.min(vpW, vpH) * lodThresholdFactor;
  
  return vectors.map(vector => {
    // Crear una copia profunda del vector para evitar mutaciones
    const result = {
      ...vector,
      customData: vector.customData ? JSON.parse(JSON.stringify(vector.customData)) : undefined,
      // Asegurarse de copiar cualquier otra propiedad que pueda ser un objeto
      ...(vector.animationState && { 
        animationState: { ...vector.animationState } 
      })
    };
    
    // Calcular distancia al centro con precisión controlada
    const dx = fixPrecision(vector.baseX - centerX, 2);
    const dy = fixPrecision(vector.baseY - centerY, 2);
    const distance = fixPrecision(Math.sqrt(dx * dx + dy * dy), 2);
    
    // Aplicar factor de LOD basado en la distancia
    if (distance > distanceThreshold) {
      // Para vectores lejanos, reducir el factor de ancho
      // Esto se traducirá en vectores más delgados visualmente
      // Calcular factor LOD sin usar fixPrecision en cada iteración
      const rawLodFactor = Math.max(minLodFactor, 1 - (distance - distanceThreshold) / distanceThreshold);
      const lodFactor = Math.round(rawLodFactor * 1000) / 1000; // Equivalente a toFixed(3)
      
      // Actualizar factor de ancho con precisión controlada
      const newWidthFactor = (result.widthFactor || 1) * lodFactor;
      result.widthFactor = Math.round(newWidthFactor * 1000) / 1000; // toFixed(3)
      
      // Asegurarse de que customData existe antes de modificarlo
      if (!result.customData) {
        result.customData = {};
      }
      
      // Actualizar customData sin mutar el objeto original
      result.customData = {
        ...result.customData,
        simplified: true,
        lodFactor
      };
    }
    
    return result;
  });
};

/**
 * Función principal de culling que combina todas las optimizaciones
 * @param vectors - Lista completa de vectores
 * @param viewportWidth - Ancho del viewport en píxeles
 * @param viewportHeight - Alto del viewport en píxeles
 * @param options - Opciones de configuración para el culling
 * @returns Lista optimizada de vectores a renderizar
 */
export const applyCulling = (
  vectors: AnimatedVectorItem[],
  viewportWidth: number,
  viewportHeight: number,
  options: CullingOptions & {
    /** Habilita/deshabilita el nivel de detalle */
    enableLOD?: boolean;
    /** Usa un quadtree para optimización espacial */
    useQuadtree?: boolean;
  } = {}
): AnimatedVectorItem[] => {
  const { 
    enableLOD = true, 
    padding = 50,
    useQuadtree = false
  } = options;
  
  // Primero filtrar los vectores visibles
  let result = useQuadtree
    ? getOptimizedVisibleVectors(vectors, viewportWidth, viewportHeight)
    : filterVisibleVectors(vectors, viewportWidth, viewportHeight, options);
  
  // Luego aplicar LOD si está habilitado
  if (options.enableLOD) {
    result = applyLevelOfDetail(result, viewportWidth, viewportHeight, options);
  }
  
  return result;
};
