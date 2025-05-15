/**
 * Utilidades de interpolación para animaciones vectoriales
 * Funciones para crear transiciones suaves entre valores
 */

/**
 * Interpolación lineal entre dos valores
 * @param a - Valor inicial
 * @param b - Valor final
 * @param t - Factor de interpolación (0-1)
 * @returns Valor interpolado
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Interpolación bilineal (2D)
 * @param x1y1 - Valor en la esquina superior izquierda
 * @param x2y1 - Valor en la esquina superior derecha
 * @param x1y2 - Valor en la esquina inferior izquierda
 * @param x2y2 - Valor en la esquina inferior derecha
 * @param x - Coordenada X normalizada (0-1)
 * @param y - Coordenada Y normalizada (0-1)
 * @returns Valor interpolado
 */
export const bilerp = (
  x1y1: number,
  x2y1: number,
  x1y2: number,
  x2y2: number,
  x: number,
  y: number
): number => {
  const top = lerp(x1y1, x2y1, x);
  const bottom = lerp(x1y2, x2y2, x);
  return lerp(top, bottom, y);
};

/**
 * Normaliza un valor dentro de un rango específico
 * @param value - Valor a normalizar
 * @param min - Valor mínimo del rango
 * @param max - Valor máximo del rango
 * @returns Valor normalizado (0-1)
 */
export const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

/**
 * Mapea un valor de un rango a otro
 * @param value - Valor a mapear
 * @param fromMin - Valor mínimo del rango origen
 * @param fromMax - Valor máximo del rango origen
 * @param toMin - Valor mínimo del rango destino
 * @param toMax - Valor máximo del rango destino
 * @returns Valor mapeado
 */
export const mapRange = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number => {
  const normalized = normalize(value, fromMin, fromMax);
  return lerp(toMin, toMax, normalized);
};

/**
 * Interpola entre ángulos (en radianes) tomando el camino más corto
 * @param a - Ángulo inicial (radianes)
 * @param b - Ángulo final (radianes)
 * @param t - Factor de interpolación (0-1)
 * @returns Ángulo interpolado (radianes)
 */
export const lerpAngle = (a: number, b: number, t: number): number => {
  const TWO_PI = 2 * Math.PI;
  
  // Normalizar ángulos a [0, 2π)
  a = ((a % TWO_PI) + TWO_PI) % TWO_PI;
  b = ((b % TWO_PI) + TWO_PI) % TWO_PI;
  
  // Determinar el camino más corto
  let delta = b - a;
  
  if (delta > Math.PI) {
    delta -= TWO_PI;
  } else if (delta < -Math.PI) {
    delta += TWO_PI;
  }
  
  return ((a + delta * t) % TWO_PI + TWO_PI) % TWO_PI;
};

/**
 * Interpola colores en formato hexadecimal
 * @param colorA - Color inicial (formato hex: #RRGGBB)
 * @param colorB - Color final (formato hex: #RRGGBB)
 * @param t - Factor de interpolación (0-1)
 * @returns Color interpolado (formato hex: #RRGGBB)
 */
export const lerpColor = (colorA: string, colorB: string, t: number): string => {
  // Extraer componentes RGB
  const rA = parseInt(colorA.slice(1, 3), 16);
  const gA = parseInt(colorA.slice(3, 5), 16);
  const bA = parseInt(colorA.slice(5, 7), 16);
  
  const rB = parseInt(colorB.slice(1, 3), 16);
  const gB = parseInt(colorB.slice(3, 5), 16);
  const bB = parseInt(colorB.slice(5, 7), 16);
  
  // Interpolar cada componente
  const r = Math.round(lerp(rA, rB, t));
  const g = Math.round(lerp(gA, gB, t));
  const b = Math.round(lerp(bA, bB, t));
  
  // Convertir a formato hexadecimal
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
