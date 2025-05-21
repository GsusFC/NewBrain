/**
 * Utilidades para la manipulación de colores en VectorGrid
 * 
 * Este módulo proporciona funciones para trabajar con colores,
 * incluyendo conversiones, cálculos de contraste y manipulación
 * de gradientes.
 */

// Función para convertir hex a RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Eliminar el # si existe
  hex = hex.replace(/^#/, '');
  
  // Manejar formato abreviado #RGB
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Convertir a valores RGB
  const bigint = parseInt(hex, 16);
  
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

// Función para convertir RGB a Hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Calcular el brillo percibido de un color (0-255)
export function perceivedBrightness(r: number, g: number, b: number): number {
  // Fórmula para calcular luminancia percibida
  return (r * 0.299 + g * 0.587 + b * 0.114);
}

// Calcular el contraste entre dos colores (ratio)
export function calculateContrast(rgb1: {r: number, g: number, b: number}, rgb2: {r: number, g: number, b: number}): number {
  const lum1 = perceivedBrightness(rgb1.r, rgb1.g, rgb1.b) / 255;
  const lum2 = perceivedBrightness(rgb2.r, rgb2.g, rgb2.b) / 255;
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Asegura suficiente contraste del color contra el fondo
 * @param color - Color original
 * @param background - Color de fondo
 * @returns Color con mejor contraste si es necesario
 */
export function ensureContrastColor(color: string, background = '#000000'): string {
  // Si no es un color en formato hex o es currentColor, devolver sin cambios
  if (!color || color === 'currentColor' || !color.startsWith('#')) {
    return color;
  }
  
  // Convertir a RGB para cálculos
  const colorRgb = hexToRgb(color);
  const bgRgb = hexToRgb(background);
  
  // Calcular contraste actual
  const contrast = calculateContrast(colorRgb, bgRgb);
  
  // Si el contraste es suficiente (> 3:1), mantener el color original
  if (contrast >= 3) {
    return color;
  }
  
  // Si el contraste es insuficiente, ajustar el color
  const bgBrightness = perceivedBrightness(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Decidir si aclarar u oscurecer basado en el brillo del fondo
  if (bgBrightness > 128) {
    // Fondo claro, oscurecer el color
    const adjustedR = Math.max(0, colorRgb.r - 80);
    const adjustedG = Math.max(0, colorRgb.g - 80);
    const adjustedB = Math.max(0, colorRgb.b - 80);
    return rgbToHex(adjustedR, adjustedG, adjustedB);
  } else {
    // Fondo oscuro, aclarar el color
    const adjustedR = Math.min(255, colorRgb.r + 80);
    const adjustedG = Math.min(255, colorRgb.g + 80);
    const adjustedB = Math.min(255, colorRgb.b + 80);
    return rgbToHex(adjustedR, adjustedG, adjustedB);
  }
}

/**
 * Genera un ID único para un gradiente basado en sus propiedades
 * @param prefix - Prefijo para el ID
 * @param config - Configuración del gradiente
 * @returns ID único
 */
export function getGradientId(prefix: string, config: Record<string, unknown>): string {
  // Crear una representación de cadena simple de la configuración
  const configStr = JSON.stringify(config);
  
  // Generar un hash simple
  let hash = 0;
  for (let i = 0; i < configStr.length; i++) {
    const char = configStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  
  // Crear ID con el prefijo y el hash
  return `${prefix}-${Math.abs(hash).toString(16).substring(0, 8)}`;
}

/**
 * Obtiene el color más adecuado para texto sobre un fondo específico
 * @param backgroundColor - Color de fondo en formato hex
 * @returns Color para texto (blanco o negro)
 */
export function getTextColorForBackground(backgroundColor: string): string {
  // Por defecto negro para valores inválidos
  if (!backgroundColor || !backgroundColor.startsWith('#')) {
    return '#000000';
  }
  
  const rgb = hexToRgb(backgroundColor);
  const brightness = perceivedBrightness(rgb.r, rgb.g, rgb.b);
  
  // Usar texto negro para fondos claros, blanco para fondos oscuros
  return brightness > 128 ? '#000000' : '#ffffff';
}

/**
 * Ajusta la opacidad de un color hex
 * @param color - Color hex
 * @param opacity - Valor de opacidad (0-1)
 * @returns Color con opacidad ajustada
 */
export function adjustOpacity(color: string, opacity: number): string {
  if (!color || !color.startsWith('#')) {
    return color;
  }
  
  const rgb = hexToRgb(color);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}
