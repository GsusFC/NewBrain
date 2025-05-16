/**
 * Utilidades matemáticas para el manejo de vectores
 */

/**
 * Asegura que un valor sea un número seguro, devolviendo un valor por defecto si no lo es
 * @param value Valor a verificar
 * @param defaultValue Valor por defecto si el valor no es un número
 * @returns Número seguro
 */
export const ensureSafeNumber = (value: unknown, defaultValue: number = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

/**
 * Limita un valor entre un mínimo y un máximo
 * @param value Valor a limitar
 * @param min Valor mínimo
 * @param max Valor máximo
 * @returns Valor limitado
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Interpola linealmente entre dos valores
 * @param a Valor inicial
 * @param b Valor final
 * @param t Factor de interpolación (0-1)
 * @returns Valor interpolado
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Calcula la distancia euclidiana entre dos puntos 2D
 * @param x1 Coordenada x del primer punto
 * @param y1 Coordenada y del primer punto
 * @param x2 Coordenada x del segundo punto
 * @param y2 Coordenada y del segundo punto
 * @returns Distancia entre los puntos
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Convierte grados a radianes
 * @param degrees Ángulo en grados
 * @returns Ángulo en radianes
 */
export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convierte radianes a grados
 * @param radians Ángulo en radianes
 * @returns Ángulo en grados
 */
export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};
