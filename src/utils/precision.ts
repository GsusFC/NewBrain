/**
 * Utilidades para gestionar la precisión numérica en visualizaciones vectoriales
 * Previene errores de hidratación causados por diferencias de precisión entre servidor y cliente
 */

/**
 * Fija la precisión decimal para valores numéricos usados en SVG
 * @param value Valor numérico a ajustar
 * @param decimals Número de decimales (por defecto 5)
 * @returns Número con precisión fija
 */
export const fixPrecision = (value: number, decimals = 5): number => {
  return Number(value.toFixed(decimals));
};

/**
 * Formatea un punto X,Y con precisión fija para uso en SVG
 * @param x Coordenada X
 * @param y Coordenada Y
 * @param decimals Número de decimales (por defecto 5)
 * @returns String formateado con las coordenadas ajustadas
 */
export const formatSvgPoint = (x: number, y: number, decimals = 5): string => {
  return `${fixPrecision(x, decimals)},${fixPrecision(y, decimals)}`;
};

/**
 * Aplica la precisión a un objeto de transformación SVG
 * @param transform Objeto con propiedades de transformación
 * @param decimals Número de decimales (por defecto 5)
 * @returns Objeto con valores de precisión fija
 */
export const fixTransformPrecision = (
  transform: { x?: number; y?: number; angle?: number; [key: string]: any },
  decimals = 5
): Record<string, any> => {
  const result: Record<string, any> = { ...transform };
  
  // Ajustar precisión para propiedades numéricas
  Object.keys(transform).forEach(key => {
    if (typeof transform[key] === 'number') {
      result[key] = fixPrecision(transform[key], decimals);
    }
  });
  
  return result;
};
