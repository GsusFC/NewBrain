/**
 * Constantes globales para el sistema de vectores
 * 
 * Este archivo centraliza las constantes que se utilizan en múltiples componentes
 * del sistema de vectores, facilitando el mantenimiento y la consistencia.
 */

/**
 * Longitud base predeterminada para los vectores en píxeles.
 * Este valor se utiliza como referencia para calcular la longitud real de los vectores
 * cuando se aplican factores de escala.
 */
export const DEFAULT_BASE_VECTOR_LENGTH = 20;

/**
 * Ancho base predeterminado para los vectores en píxeles.
 * Se utiliza como referencia para calcular el ancho real de los vectores
 * cuando se aplican factores de ancho.
 */
export const DEFAULT_BASE_VECTOR_WIDTH = 4;

/**
 * Factor de escala predeterminado para el ancho de los vectores.
 * Se utiliza como valor predeterminado cuando no se especifica un ancho personalizado.
 */
export const DEFAULT_VECTOR_WIDTH_FACTOR = 1;

/**
 * Precisión predeterminada para los cálculos de posición y tamaño.
 * Se utiliza para evitar errores de redondeo en cálculos de posición.
 */
export const DEFAULT_PRECISION = 6;

/**
 * Padding predeterminado para el culling en píxeles.
 * Se utiliza para evitar que los vectores desaparezcan abruptamente en los bordes.
 */
export const DEFAULT_CULLING_PADDING = 50;

/**
 * Umbral de distancia para aplicar niveles de detalle (LOD).
 * Porcentaje del tamaño de la pantalla a partir del cual se aplica LOD.
 */
export const LOD_DISTANCE_THRESHOLD_FACTOR = 0.4;

/**
 * Factor mínimo de LOD.
 * Valor mínimo al que se puede reducir el ancho de un vector por LOD.
 */
export const MIN_LOD_FACTOR = 0.5;
