/**
 * Animación de flujo Perlin (Perlin Flow)
 * Crea un patrón de flujo orgánico basado en ruido Perlin
 */

import { AnimatedVectorItem, AnimationSettings, PerlinFlowProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';
import { fixPrecision } from '@/utils/precision';

// Implementación simplificada de ruido Perlin para animaciones
// Basada en el algoritmo de Ken Perlin con algunas simplificaciones
class PerlinNoise {
  private perm: number[] = [];
  
  constructor(seed: number = Math.random() * 100000) {
    this.initPermutation(seed);
  }
  
  // Inicializa la tabla de permutación basada en una semilla
  private initPermutation(seed: number): void {
    const random = this.seededRandom(seed);
    this.perm = Array(512).fill(0).map((_, i) => {
      return Math.floor(random() * 256);
    });
  }
  
  // Generador de números aleatorios determinista basado en semilla
  private seededRandom(seed: number): () => number {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  // Función de suavizado para interpolación
  private fade(t: number): number {
    // Aplicar fixPrecision para evitar errores de precisión en el cálculo polinómico
    const result = t * t * t * (t * (t * 6 - 15) + 10);
    return fixPrecision(result, 6); // Alta precisión para esta función sensible
  }
  
  // Producto escalar entre un vector de gradiente y un vector de distancia
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : x;
    const result = ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    return fixPrecision(result, 4); // Precisión controlada para el gradiente
  }
  
  // Calcula el valor de ruido Perlin para un punto 2D
  public noise(x: number, y: number): number {
    // Encerrar las coordenadas en celdas
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    // Coordenadas relativas dentro de la celda
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    // Calcular factores de suavizado
    const u = this.fade(x);
    const v = this.fade(y);
    
    // Obtener índices para los gradientes
    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;
    
    // Calcular contribuciones de los vértices de la celda
    return lerp(
      lerp(this.grad(this.perm[A], x, y),
           this.grad(this.perm[B], x - 1, y), u),
      lerp(this.grad(this.perm[A + 1], x, y - 1),
           this.grad(this.perm[B + 1], x - 1, y - 1), u),
      v
    );
  }
}

// Instancia única de PerlinNoise para reutilizar
let perlinInstance: PerlinNoise | null = null;

/**
 * Actualiza un vector según la animación de flujo Perlin
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas del flujo Perlin
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updatePerlinFlow = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<PerlinFlowProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<PerlinFlowProps>('perlinFlow');
  const {
    noiseScale = defaultProps.noiseScale || 0.01,
    timeEvolutionSpeed = defaultProps.timeEvolutionSpeed || 0.5,
    angleMultiplier = defaultProps.angleMultiplier || 1.0
  } = props;

  // Inicializar o reutilizar la instancia de PerlinNoise
  if (!perlinInstance) {
    perlinInstance = new PerlinNoise(settings.seed || Math.random() * 100000);
  }
  
  // Calcular el tiempo normalizado para la animación
  const time = fixPrecision(currentTime * 0.001 * settings.baseSpeed * timeEvolutionSpeed, 4);
  
  // Calcular coordenadas de ruido para el vector actual
  // Usar baseX y baseY en lugar de x/y que no existen en AnimatedVectorItem
  const noiseX = fixPrecision((item.baseX || 0) * noiseScale, 4);
  const noiseY = fixPrecision((item.baseY || 0) * noiseScale, 4);
  const noiseTime = fixPrecision(time * 0.1, 4);
  
  // Obtener dos valores de ruido ligeramente desplazados para crear un vector de flujo
  const noise1 = perlinInstance.noise(noiseX, noiseY + noiseTime);
  const noise2 = perlinInstance.noise(noiseX + noiseTime, noiseY);
  
  // Mapear los valores de ruido (-1 a 1) a un ángulo completo (0 a 2π)
  // Fijar precisión en los valores de ruido y el ángulo resultante
  const noiseVal1 = fixPrecision(noise1, 4);
  const noiseVal2 = fixPrecision(noise2, 4);
  const angleRad = fixPrecision(Math.atan2(noiseVal2, noiseVal1), 6);
  
  // Convertir a grados, aplicar multiplicador y normalizar al rango [0, 360)
  let targetAngle = fixPrecision((angleRad * 180 / Math.PI) * angleMultiplier, 4);
  targetAngle = ((targetAngle % 360) + 360) % 360;
  
  // Calcular un factor de longitud basado en la magnitud del vector de flujo
  // Control de precisión para la magnitud y el factor de longitud
  const magnitude = fixPrecision(Math.sqrt(noiseVal1 * noiseVal1 + noiseVal2 * noiseVal2), 4);
  const newLengthFactor = fixPrecision(0.8 + magnitude * 0.4, 4);
  // Usar el factor de longitud existente en el vector
  const currentLengthFactor = fixPrecision(item.lengthFactor || 1.0, 4);
  
  // Función para interpolación de ángulos que maneja correctamente el cruce por 0/360°
  const interpolateAngles = (start: number, end: number, progress: number): number => {
    // Asegurar que los ángulos estén en el rango [0, 360)
    start = ((start % 360) + 360) % 360;
    end = ((end % 360) + 360) % 360;
    
    // Calcular la distancia más corta entre los dos ángulos
    let diff = end - start;
    if (Math.abs(diff) > 180) {
      diff = diff - (360 * Math.sign(diff));
    }
    
    // Interpolar y normalizar el resultado
    const result = start + diff * progress;
    return ((result % 360) + 360) % 360;
  };

  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition && item.currentAngle !== undefined) {
    const progress = Math.min(1.0, 0.1 * settings.baseSpeed);
    newAngle = interpolateAngles(item.currentAngle, targetAngle, progress);
  } else {
    // Usar interpolación con precisión en el ángulo actual
    newAngle = fixPrecision(lerp(item.currentAngle || 0, targetAngle, 0.1), 4);
  }
  
  // Aplicar transición suave al factor de longitud si está habilitado
  let finalLengthFactor = newLengthFactor;
  if (settings.lengthTransition) {
    // Usar interpolación con precisión en el factor de longitud
    // Usar fixPrecision para la interpolación de factores de longitud
    finalLengthFactor = fixPrecision(lerp(currentLengthFactor, newLengthFactor, 0.1), 2);
  }
  
  // Mantener el factor de ancho existente con precisión controlada
  const newWidthFactor = fixPrecision(item.widthFactor || 1, 2);

  return {
    ...item,
    currentAngle: newAngle,                     // Actualizar el ángulo actual con precisión
    targetAngle: targetAngle,                   // Guardar el ángulo objetivo con precisión
    previousAngle: fixPrecision(item.currentAngle || 0, 4), // Guardar el ángulo anterior
    lengthFactor: finalLengthFactor,            // Actualizar el factor de longitud con precisión
    widthFactor: newWidthFactor                 // Mantener el factor de ancho con precisión
  };
};
