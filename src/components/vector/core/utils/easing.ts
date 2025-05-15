/**
 * Funciones de easing para animaciones
 * Estas funciones modifican la velocidad de transición a lo largo del tiempo
 * para crear efectos más naturales y visualmente atractivos
 */

/**
 * Función lineal (sin easing)
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const linear = (t: number): number => {
  return t;
};

/**
 * Easing cuadrático de entrada (aceleración)
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInQuad = (t: number): number => {
  return t * t;
};

/**
 * Easing cuadrático de salida (desaceleración)
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeOutQuad = (t: number): number => {
  return t * (2 - t);
};

/**
 * Easing cuadrático de entrada/salida
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

/**
 * Easing cúbico de entrada
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInCubic = (t: number): number => {
  return t * t * t;
};

/**
 * Easing cúbico de salida
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeOutCubic = (t: number): number => {
  return (--t) * t * t + 1;
};

/**
 * Easing cúbico de entrada/salida
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};

/**
 * Easing sinusoidal de entrada
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInSine = (t: number): number => {
  return 1 - Math.cos(t * Math.PI / 2);
};

/**
 * Easing sinusoidal de salida
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeOutSine = (t: number): number => {
  return Math.sin(t * Math.PI / 2);
};

/**
 * Easing sinusoidal de entrada/salida
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInOutSine = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2;
};

/**
 * Easing elástico de entrada
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  
  return t === 0
    ? 0
    : t === 1
    ? 1
    : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};

/**
 * Easing elástico de salida
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/**
 * Easing elástico de entrada/salida
 * @param t - Tiempo normalizado (0-1)
 * @returns Valor de progreso (0-1)
 */
export const easeInOutElastic = (t: number): number => {
  const c5 = (2 * Math.PI) / 4.5;
  
  return t === 0
    ? 0
    : t === 1
    ? 1
    : t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
};
