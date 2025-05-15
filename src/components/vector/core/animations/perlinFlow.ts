/**
 * Animación de flujo Perlin (Perlin Flow)
 * Crea un patrón de flujo orgánico basado en ruido Perlin
 */

import { AnimatedVectorItem, AnimationSettings, PerlinFlowProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp } from '../utils/interpolation';

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
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  // Producto escalar entre un vector de gradiente y un vector de distancia
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
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
  const time = currentTime * 0.001 * settings.baseSpeed * timeEvolutionSpeed;
  
  // Calcular coordenadas de ruido para el vector actual
  const noiseX = item.x * noiseScale;
  const noiseY = item.y * noiseScale;
  const noiseTime = time * 0.1;
  
  // Obtener dos valores de ruido ligeramente desplazados para crear un vector de flujo
  const noise1 = perlinInstance.noise(noiseX, noiseY + noiseTime);
  const noise2 = perlinInstance.noise(noiseX + noiseTime, noiseY);
  
  // Mapear los valores de ruido (-1 a 1) a un ángulo completo (0 a 2π)
  const angleNoise = Math.atan2(noise2, noise1);
  
  // Calcular el ángulo final aplicando el multiplicador
  const targetAngle = angleNoise * angleMultiplier;
  
  // Calcular un factor de longitud basado en la magnitud del vector de flujo
  const magnitude = Math.sqrt(noise1 * noise1 + noise2 * noise2);
  const lengthFactor = 0.8 + magnitude * 0.4;
  const targetLength = item.originalLength * lengthFactor;
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerp(item.angle, targetAngle, 0.1);
  }
  
  // Aplicar transición suave a la longitud si está habilitado
  let newLength = targetLength;
  if (settings.lengthTransition) {
    newLength = lerp(item.length, targetLength, 0.1);
  }
  
  return {
    ...item,
    angle: newAngle,
    length: newLength
  };
};
