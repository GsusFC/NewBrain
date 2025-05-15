/**
 * Utilidades de validación para animaciones vectoriales
 * Provee funciones para verificar y asegurar la integridad de los datos
 */

/**
 * Asegura que un valor esté dentro de un rango especificado
 * @param value - Valor a verificar
 * @param min - Valor mínimo (inclusivo)
 * @param max - Valor máximo (inclusivo)
 * @returns Valor limitado al rango especificado
 */
export const ensureRange = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Verifica si un valor es un número válido (no NaN, no Infinity)
 * @param value - Valor a verificar
 * @returns true si es un número válido, false en caso contrario
 */
export const isValidNumber = (value: unknown): boolean => {
  return typeof value === 'number' && isFinite(value);
};

/**
 * Asegura que un valor sea un número válido o devuelve un valor predeterminado
 * @param value - Valor a verificar
 * @param defaultValue - Valor predeterminado a usar si value no es válido
 * @returns Value si es un número válido, defaultValue en caso contrario
 */
export const ensureNumber = (value: unknown, defaultValue: number): number => {
  return isValidNumber(value) ? (value as number) : defaultValue;
};

/**
 * Asegura que un valor sea un entero válido o devuelve un valor predeterminado
 * @param value - Valor a verificar
 * @param defaultValue - Valor predeterminado a usar si value no es un entero válido
 * @returns Value si es un entero válido, defaultValue en caso contrario
 */
export const ensureInteger = (value: unknown, defaultValue: number): number => {
  if (!isValidNumber(value)) return defaultValue;
  const numValue = value as number;
  return Number.isInteger(numValue) ? numValue : Math.round(numValue);
};

/**
 * Asegura que un objeto tenga todas las propiedades requeridas
 * @param obj - Objeto a verificar
 * @param requiredProps - Array de nombres de propiedades requeridas
 * @returns true si todas las propiedades requeridas están presentes, false en caso contrario
 */
export const hasRequiredProps = (
  obj: Record<string, unknown>,
  requiredProps: string[]
): boolean => {
  if (!obj) return false;
  return requiredProps.every((prop) => prop in obj);
};

/**
 * Asegura que un color sea válido (formato hexadecimal, rgb o nombre de color)
 * @param color - Color a verificar
 * @param defaultColor - Color predeterminado a usar si color no es válido
 * @returns Color si es válido, defaultColor en caso contrario
 */
export const ensureValidColor = (color: unknown, defaultColor: string): string => {
  if (typeof color !== 'string') return defaultColor;
  
  // Verificar formato hexadecimal (#RRGGBB o #RGB)
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  
  // Verificar formato rgb(r, g, b) o rgba(r, g, b, a)
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-1](\.\d+)?\s*\)$/;
  
  if (hexRegex.test(color) || rgbRegex.test(color) || rgbaRegex.test(color)) {
    return color;
  }
  
  // Si llegamos aquí, asumimos que el color no es válido
  return defaultColor;
};

/**
 * Comprueba si un punto está dentro de los límites del canvas
 * @param x - Coordenada X del punto
 * @param y - Coordenada Y del punto
 * @param width - Ancho del canvas
 * @param height - Alto del canvas
 * @param margin - Margen opcional (por defecto 0)
 * @returns true si el punto está dentro de los límites, false en caso contrario
 */
export const isPointInBounds = (
  x: number,
  y: number,
  width: number,
  height: number,
  margin: number = 0
): boolean => {
  return x >= margin && x <= width - margin && y >= margin && y <= height - margin;
};
