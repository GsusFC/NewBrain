/**
 * Animación de comportamiento en bandada (Flocking)
 * Implementa las reglas de bandada de Craig Reynolds (separación, alineación, cohesión)
 * para simular movimientos orgánicos de grupos como pájaros o peces
 */

import { AnimatedVectorItem, AnimationSettings, FlockingProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { distance, angleToPoint } from '../utils/math';
import { lerp, lerpAngle } from '../utils/interpolation';

// Estado interno para cada vector en la animación flocking
interface FlockingState {
  velocityX: number;
  velocityY: number;
  lastNeighborIds: string[];
}

// Mapa para almacenar el estado de cada vector
const flockingStates = new Map<string, FlockingState>();

/**
 * Actualiza un vector según la animación de flocking
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de flocking
 * @param settings - Configuración general de la animación
 * @param allVectors - Todos los vectores (necesario para interacciones entre vectores)
 * @returns Vector actualizado
 */
export const updateFlocking = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<FlockingProps>,
  settings: AnimationSettings,
  allVectors?: AnimatedVectorItem[]
): AnimatedVectorItem => {
  // Si no hay otros vectores, no podemos calcular comportamiento de bandada
  if (!allVectors || allVectors.length <= 1) {
    return item;
  }

  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<FlockingProps>('flocking');
  const {
    perceptionRadius = defaultProps.perceptionRadius || 100,
    maxSpeed = defaultProps.maxSpeed || 2.0,
    separationForce = defaultProps.separationForce || 0.05,
    alignmentForce = defaultProps.alignmentForce || 0.05,
    cohesionForce = defaultProps.cohesionForce || 0.01,
    targetSeekingForce = defaultProps.targetSeekingForce || 0.01,
    targetX = defaultProps.targetX || 0.5,
    targetY = defaultProps.targetY || 0.5
  } = props;

  // Inicializar o recuperar el estado del vector
  if (!flockingStates.has(item.id)) {
    // Si es un nuevo vector, inicializar con velocidad aleatoria
    const randomAngle = Math.random() * Math.PI * 2;
    flockingStates.set(item.id, {
      velocityX: Math.cos(randomAngle) * maxSpeed * 0.1,
      velocityY: Math.sin(randomAngle) * maxSpeed * 0.1,
      lastNeighborIds: []
    });
  }
  
  // Obtener el estado actual del vector
  const state = flockingStates.get(item.id)!;
  
  // Encontrar vecinos dentro del radio de percepción
  const neighbors = allVectors.filter(neighbor => 
    neighbor.id !== item.id && 
    distance(item.x, item.y, neighbor.x, neighbor.y) < perceptionRadius
  );
  
  // Actualizar lista de vecinos
  state.lastNeighborIds = neighbors.map(n => n.id);
  
  // Si no hay vecinos, solo aplicar la búsqueda de objetivo
  if (neighbors.length === 0) {
    // Calcular fuerza hacia el objetivo global
    const targetAbsX = settings.canvasWidth * targetX;
    const targetAbsY = settings.canvasHeight * targetY;
    
    const toTargetX = targetAbsX - item.x;
    const toTargetY = targetAbsY - item.y;
    
    // Normalizar la fuerza
    const targetDist = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);
    if (targetDist > 0) {
      const seekX = toTargetX / targetDist * maxSpeed;
      const seekY = toTargetY / targetDist * maxSpeed;
      
      // Aplicar fuerza de búsqueda de objetivo
      state.velocityX += (seekX - state.velocityX) * targetSeekingForce;
      state.velocityY += (seekY - state.velocityY) * targetSeekingForce;
    }
  } else {
    // Inicializar vectores para las tres reglas
    let separationX = 0;
    let separationY = 0;
    
    let alignmentX = 0;
    let alignmentY = 0;
    
    let cohesionX = 0;
    let cohesionY = 0;
    
    // Calcular cohorte para cohesión
    let avgX = 0;
    let avgY = 0;
    
    // Procesar cada vecino
    for (const neighbor of neighbors) {
      // Calcular vector de separación (alejarse de vecinos cercanos)
      const dx = item.x - neighbor.x;
      const dy = item.y - neighbor.y;
      
      const d = Math.sqrt(dx * dx + dy * dy);
      
      // Si están demasiado cerca, aplicar fuerza de separación inversamente proporcional a la distancia
      if (d > 0 && d < perceptionRadius * 0.5) {
        const repulsionFactor = 1 / d;
        separationX += dx * repulsionFactor;
        separationY += dy * repulsionFactor;
      }
      
      // Obtener el estado del vecino para alineación
      const neighborState = flockingStates.get(neighbor.id);
      if (neighborState) {
        // Sumar velocidades para alineación (matching velocity)
        alignmentX += neighborState.velocityX;
        alignmentY += neighborState.velocityY;
      }
      
      // Sumar posiciones para cohesión (volar hacia el centro del grupo)
      avgX += neighbor.x;
      avgY += neighbor.y;
    }
    
    // Normalizar el vector de alineación
    if (neighbors.length > 0) {
      alignmentX /= neighbors.length;
      alignmentY /= neighbors.length;
      
      // Calcular el centro de masa para cohesión
      avgX /= neighbors.length;
      avgY /= neighbors.length;
      
      // Vector hacia el centro de masa
      cohesionX = avgX - item.x;
      cohesionY = avgY - item.y;
    }
    
    // Normalizar los vectores de fuerza
    const normalizeVector = (x: number, y: number, scale: number = 1): [number, number] => {
      const length = Math.sqrt(x * x + y * y);
      if (length > 0) {
        return [(x / length) * scale, (y / length) * scale];
      }
      return [0, 0];
    };
    
    // Normalizar las fuerzas
    const [normSepX, normSepY] = normalizeVector(separationX, separationY, maxSpeed);
    const [normAliX, normAliY] = normalizeVector(alignmentX, alignmentY, maxSpeed);
    const [normCohX, normCohY] = normalizeVector(cohesionX, cohesionY, maxSpeed);
    
    // Añadir también la fuerza de búsqueda de objetivo global
    const targetAbsX = settings.canvasWidth * targetX;
    const targetAbsY = settings.canvasHeight * targetY;
    
    const toTargetX = targetAbsX - item.x;
    const toTargetY = targetAbsY - item.y;
    
    // Normalizar la fuerza de búsqueda de objetivo
    const [normTarX, normTarY] = normalizeVector(toTargetX, toTargetY, maxSpeed);
    
    // Calcular aceleración combinando todas las fuerzas
    const steeringX = 
      normSepX * separationForce + 
      normAliX * alignmentForce + 
      normCohX * cohesionForce +
      normTarX * targetSeekingForce;
      
    const steeringY = 
      normSepY * separationForce + 
      normAliY * alignmentForce + 
      normCohY * cohesionForce +
      normTarY * targetSeekingForce;
    
    // Aplicar aceleración a la velocidad actual
    state.velocityX += steeringX;
    state.velocityY += steeringY;
  }
  
  // Limitar la velocidad máxima
  const speed = Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY);
  if (speed > maxSpeed) {
    state.velocityX = (state.velocityX / speed) * maxSpeed;
    state.velocityY = (state.velocityY / speed) * maxSpeed;
  }
  
  // Calcular el ángulo basado en la dirección de la velocidad
  const targetAngle = Math.atan2(state.velocityY, state.velocityX);
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerpAngle(item.angle, targetAngle, 0.2);
  }
  
  // Calcular factor de longitud basado en la velocidad
  // Los vectores son más largos cuando se mueven más rápido
  const speedFactor = speed / maxSpeed;
  const targetLength = item.originalLength * (0.8 + speedFactor * 0.4);
  
  // Aplicar transición suave a la longitud si está habilitado
  let newLength = targetLength;
  if (settings.lengthTransition) {
    newLength = lerp(item.length, targetLength, 0.2);
  }
  
  // Limpiar estados viejos para evitar fugas de memoria
  if (settings.type !== 'flocking' && flockingStates.size > 0) {
    flockingStates.clear();
  }
  
  return {
    ...item,
    angle: newAngle,
    length: newLength
  };
};
