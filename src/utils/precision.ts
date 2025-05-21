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
  transform: { x?: number; y?: number; angle?: number; [key: string]: unknown },
  decimals = 5
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...transform };
  
  // Ajustar precisión para propiedades numéricas
  Object.keys(transform).forEach(key => {
    if (typeof transform[key] === 'number') {
      result[key] = fixPrecision(transform[key] as number, decimals);
    } else {
      // Mantener el valor original si no es un número y es una clave definida
      // Esto asegura que las propiedades no numéricas se transfieran correctamente
      // y que el tipo 'unknown' se maneje explícitamente si es necesario fuera de esta función.
      if (transform[key] !== undefined) { // Asegurarse de que la propiedad existe
        result[key] = transform[key];
      }
    }
  });
  
  return result;
};
