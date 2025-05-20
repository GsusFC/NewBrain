/**
 * Utilidades numéricas para VectorGrid
 * 
 * Este módulo proporciona funciones para validación, 
 * formateo y manipulación de valores numéricos de forma segura.
 */

/**
 * Asegura que un número esté dentro de los límites y con precisión controlada
 * @param value - Valor a controlar
 * @param min - Valor mínimo permitido (por defecto 0)
 * @param precision - Precisión decimal (por defecto 2)
 * @returns Número seguro y con precisión controlada
 */
export function ensureSafeNumber(value: number, min = 0, precision = 2): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return min;
  }
  const safeValue = Math.max(value, min);
  return Number(safeValue.toFixed(precision));
}

/**
 * Fija la precisión de un número
 * @param value - Valor a ajustar
 * @param precision - Precisión decimal (por defecto 2)
 * @returns Número con precisión fija
 */
export function fixPrecision(value: number, precision = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Number(value.toFixed(precision));
}

/**
 * Limita un valor a un rango específico
 * @param value - Valor a limitar
 * @param min - Valor mínimo del rango
 * @param max - Valor máximo del rango
 * @returns Valor limitado al rango
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interpola linealmente entre dos valores
 * @param a - Valor inicial
 * @param b - Valor final
 * @param t - Factor de interpolación (0-1)
 * @returns Valor interpolado
 */
export function lerp(a: number, b: number, t: number): number {
  // Asegurar que t esté en el rango [0, 1]
  const clampedT = clamp(t, 0, 1);
  return a + (b - a) * clampedT;
}

/**
 * Mapea un valor de un rango a otro
 * @param value - Valor a mapear
 * @param inMin - Mínimo del rango de entrada
 * @param inMax - Máximo del rango de entrada
 * @param outMin - Mínimo del rango de salida
 * @param outMax - Máximo del rango de salida
 * @returns Valor mapeado al nuevo rango
 */
export function mapRange(
  value: number, 
  inMin: number, 
  inMax: number, 
  outMin: number, 
  outMax: number
): number {
  // Evitar división por cero
  if (inMin === inMax) return outMin;
  
  // Calcular el valor mapeado y limitarlo al rango de salida
  const mappedValue = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  return clamp(mappedValue, outMin, outMax);
}

/**
 * Generar un número aleatorio dentro de un rango
 * @param min - Valor mínimo (inclusivo)
 * @param max - Valor máximo (exclusivo)
 * @returns Número aleatorio en el rango [min, max)
 */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Calcular el promedio de un array de números
 * @param values - Array de valores numéricos
 * @returns Promedio o 0 si el array está vacío
 */
export function average(values: number[]): number {
  if (!values.length) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Verifica si dos números son aproximadamente iguales
 * @param a - Primer número
 * @param b - Segundo número
 * @param epsilon - Tolerancia (por defecto 0.001)
 * @returns true si son aproximadamente iguales
 */
export function approximatelyEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Formatea un número para visualización con unidades opcionales
 * @param value - Valor a formatear
 * @param decimals - Número de decimales
 * @param unit - Unidad opcional (px, %, etc.)
 * @returns Cadena formateada
 */
export function formatNumber(value: number, decimals = 0, unit = ''): string {
  if (isNaN(value) || !isFinite(value)) return '0' + unit;
  return value.toFixed(decimals) + unit;
}
