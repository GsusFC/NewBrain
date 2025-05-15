/**
 * Utilidades matemáticas para animaciones vectoriales
 * Funciones matemáticas puras para cálculos comunes
 */

/**
 * Convierte grados a radianes
 * @param degrees - Ángulo en grados
 * @returns Ángulo en radianes
 */
export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convierte radianes a grados
 * @param radians - Ángulo en radianes
 * @returns Ángulo en grados
 */
export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Normaliza un ángulo en radianes al rango [0, 2π)
 * @param radians - Ángulo en radianes
 * @returns Ángulo normalizado en radianes
 */
export const normalizeRadians = (radians: number): number => {
  const TWO_PI = 2 * Math.PI;
  return ((radians % TWO_PI) + TWO_PI) % TWO_PI;
};

/**
 * Normaliza un ángulo en grados al rango [0, 360)
 * @param degrees - Ángulo en grados
 * @returns Ángulo normalizado en grados
 */
export const normalizeDegrees = (degrees: number): number => {
  return ((degrees % 360) + 360) % 360;
};

/**
 * Calcula la distancia entre dos puntos
 * @param x1 - Coordenada X del primer punto
 * @param y1 - Coordenada Y del primer punto
 * @param x2 - Coordenada X del segundo punto
 * @param y2 - Coordenada Y del segundo punto
 * @returns Distancia euclidiana entre los puntos
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calcula el ángulo entre dos puntos en radianes
 * @param x1 - Coordenada X del punto inicial
 * @param y1 - Coordenada Y del punto inicial
 * @param x2 - Coordenada X del punto destino
 * @param y2 - Coordenada Y del punto destino
 * @returns Ángulo en radianes
 */
export const angleToPoint = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

/**
 * Calcula una onda sinusoidal en función de tiempo y posición
 * @param x - Posición X
 * @param y - Posición Y
 * @param t - Tiempo
 * @param freq - Frecuencia
 * @param amp - Amplitud
 * @returns Valor de la onda
 */
export const calculateWave = (x: number, y: number, t: number, freq: number, amp: number): number => {
  return Math.sin(x * freq + t) * Math.cos(y * freq + t) * amp;
};

/**
 * Genera un valor aleatorio dentro de un rango
 * @param min - Valor mínimo (inclusivo)
 * @param max - Valor máximo (exclusivo)
 * @returns Valor aleatorio dentro del rango
 */
export const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

/**
 * Genera un entero aleatorio dentro de un rango
 * @param min - Valor mínimo (inclusivo)
 * @param max - Valor máximo (inclusivo)
 * @returns Entero aleatorio dentro del rango
 */
export const randomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Calcula un punto en una curva Lissajous en función del tiempo
 * @param t - Parámetro de tiempo (0-1)
 * @param xFreq - Frecuencia X
 * @param yFreq - Frecuencia Y
 * @param xAmp - Amplitud X
 * @param yAmp - Amplitud Y
 * @param phaseOffset - Desfase (en radianes)
 * @returns Coordenadas {x, y} del punto en la curva
 */
export const lissajousPoint = (
  t: number, 
  xFreq: number, 
  yFreq: number, 
  xAmp: number, 
  yAmp: number, 
  phaseOffset: number
): { x: number, y: number } => {
  return {
    x: Math.sin(t * xFreq + phaseOffset) * xAmp,
    y: Math.sin(t * yFreq) * yAmp
  };
};
