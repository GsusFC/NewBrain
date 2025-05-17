/**
 * Animación de comportamiento en bandada (Flocking)
 * Implementa las reglas de bandada de Craig Reynolds (separación, alineación, cohesión)
 * para simular movimientos orgánicos de grupos como pájaros o peces
 */

import { AnimatedVectorItem, AnimationSettings, FlockingProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerp, lerpAngle } from '../utils/interpolation';
import { fixPrecision } from '@/utils/precision';
import { SpatialGrid } from './SpatialGrid';

// Estado interno para cada vector en la animación flocking
interface FlockingState {
  velocityX: number;
  velocityY: number;
}

// Mapa para almacenar el estado de cada vector
const flockingStates = new Map<string, FlockingState>();

// Variable global para la cuadrícula espacial
let spatialGrid: SpatialGrid | null = null;
let lastPerceptionRadius = 0;
let lastCanvasWidth = 0;
let lastCanvasHeight = 0;
let lastFrameTime = 0;
const GRID_UPDATE_INTERVAL = 100; // ms entre actualizaciones de la cuadrícula

interface UpdateSpatialGridParams {
  allVectors?: AnimatedVectorItem[];
  perceptionRadius: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Actualiza la cuadrícula espacial utilizada para la detección de vecinos
 */
function updateSpatialGrid({
  allVectors,
  perceptionRadius,
  canvasWidth,
  canvasHeight
}: UpdateSpatialGridParams): void {
  if (!allVectors?.length) return;
  
  const now = Date.now();
  const needsGridUpdate = !spatialGrid || 
    perceptionRadius !== lastPerceptionRadius ||
    (now - lastFrameTime > GRID_UPDATE_INTERVAL && 
     (lastCanvasWidth !== canvasWidth || lastCanvasHeight !== canvasHeight));
  
  if (needsGridUpdate) {
    // Reconstruir la cuadrícula espacial si es necesario
    spatialGrid = new SpatialGrid(perceptionRadius * 2, canvasWidth, canvasHeight);
    allVectors.forEach(v => spatialGrid!.insert(v));
    lastPerceptionRadius = perceptionRadius;
    lastCanvasWidth = canvasWidth;
    lastCanvasHeight = canvasHeight;
    lastFrameTime = now;
  } else {
    // Actualizar solo los vectores que han cambiado de celda
    allVectors.forEach(v => spatialGrid!.update(v));
  }
}

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
  const defaultProps = getDefaultPropsForType('flocking');
  const {
    perceptionRadius = 100,
    maxSpeed = 2.0,
    separationForce = 0.05,
    alignmentForce = 0.05,
    cohesionForce = 0.01,
    targetSeekingForce = 0.01,
    targetX = 0.5,
    targetY = 0.5
  } = { ...defaultProps, ...props } as FlockingProps;

  // Inicializar o recuperar el estado del vector
  if (!flockingStates.has(item.id)) {
    // Si es un nuevo vector, inicializar con velocidad aleatoria
    const randomAngle = Math.random() * Math.PI * 2;
    flockingStates.set(item.id, {
      velocityX: Math.cos(randomAngle) * maxSpeed * 0.1,
      velocityY: Math.sin(randomAngle) * maxSpeed * 0.1
    });
  }
  
  // Obtener el estado actual del vector
  const state = flockingStates.get(item.id)!;
  
  // Obtener dimensiones del canvas con valores predeterminados
  const canvasWidth = settings.canvasWidth || 1000;
  const canvasHeight = settings.canvasHeight || 1000;
  
  // Actualizar la cuadrícula espacial si es necesario
  updateSpatialGrid({
    allVectors,
    perceptionRadius,
    canvasWidth,
    canvasHeight
  });
  
  // Encontrar vecinos usando la cuadrícula espacial
  const neighbors = spatialGrid.query(item.baseX, item.baseY, perceptionRadius)
    .filter(neighbor => neighbor.id !== item.id);
  
  // Usar las dimensiones del canvas ya obtenidas anteriormente
  // Si no hay vecinos, solo aplicar la búsqueda de objetivo
  if (neighbors.length === 0) {
    // Calcular fuerza hacia el objetivo global con precisión controlada
    const targetAbsX = fixPrecision(canvasWidth * targetX, 2);
    const targetAbsY = fixPrecision(canvasHeight * targetY, 2);
    
    const toTargetX = fixPrecision(targetAbsX - item.baseX, 2);
    const toTargetY = fixPrecision(targetAbsY - item.baseY, 2);
    
    // Normalizar la fuerza con precisión controlada
    const targetDist = fixPrecision(Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY), 4);
    if (targetDist > 0) {
      const seekX = fixPrecision(toTargetX / targetDist * maxSpeed, 4);
      const seekY = fixPrecision(toTargetY / targetDist * maxSpeed, 4);
      
      // Aplicar fuerza de búsqueda de objetivo con precisión controlada
      state.velocityX = fixPrecision(state.velocityX + (seekX - state.velocityX) * targetSeekingForce, 4);
      state.velocityY = fixPrecision(state.velocityY + (seekY - state.velocityY) * targetSeekingForce, 4);
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
      const dx = fixPrecision(item.baseX - neighbor.baseX, 2);
      const dy = fixPrecision(item.baseY - neighbor.baseY, 2);
      
      const d = fixPrecision(Math.sqrt(dx * dx + dy * dy), 4);
      
      // Si están demasiado cerca, aplicar fuerza de separación inversamente proporcional a la distancia
      if (d > 0 && d < perceptionRadius * 0.5) {
        const repulsionFactor = fixPrecision(1 / d, 4);
        separationX = fixPrecision(separationX + dx * repulsionFactor, 4);
        separationY = fixPrecision(separationY + dy * repulsionFactor, 4);
      }
      
      // Obtener el estado del vecino para alineación
      const neighborState = flockingStates.get(neighbor.id);
      if (neighborState) {
        // Sumar velocidades para alineación (matching velocity)
        alignmentX += neighborState.velocityX;
        alignmentY += neighborState.velocityY;
      }
      
      // Sumar posiciones para cohesión (volar hacia el centro del grupo)
      avgX = fixPrecision(avgX + neighbor.baseX, 2);
      avgY = fixPrecision(avgY + neighbor.baseY, 2);
    }
    
    // Normalizar el vector de alineación con precisión controlada
    if (neighbors.length > 0) {
      alignmentX = fixPrecision(alignmentX / neighbors.length, 4);
      alignmentY = fixPrecision(alignmentY / neighbors.length, 4);
      
      // Calcular el centro de masa para cohesión con precisión controlada
      avgX = fixPrecision(avgX / neighbors.length, 2);
      avgY = fixPrecision(avgY / neighbors.length, 2);
      
      // Vector hacia el centro de masa con precisión controlada
      cohesionX = fixPrecision(avgX - item.baseX, 2);
      cohesionY = fixPrecision(avgY - item.baseY, 2);
    }
    
    // Normalizar los vectores de fuerza con precisión controlada
    const normalizeVector = (x: number, y: number, scale: number = 1): [number, number] => {
      const length = fixPrecision(Math.sqrt(x * x + y * y), 4);
      if (length > 0) {
        return [fixPrecision((x / length) * scale, 4), fixPrecision((y / length) * scale, 4)];
      }
      return [0, 0];
    };
    
    // Normalizar las fuerzas
    const [normSepX, normSepY] = normalizeVector(separationX, separationY, maxSpeed);
    const [normAliX, normAliY] = normalizeVector(alignmentX, alignmentY, maxSpeed);
    const [normCohX, normCohY] = normalizeVector(cohesionX, cohesionY, maxSpeed);
    
    // Añadir también la fuerza de búsqueda de objetivo global con precisión controlada
    const targetAbsX = fixPrecision(canvasWidth * targetX, 2);
    const targetAbsY = fixPrecision(canvasHeight * targetY, 2);
    
    const toTargetX = fixPrecision(targetAbsX - item.baseX, 2);
    const toTargetY = fixPrecision(targetAbsY - item.baseY, 2);
    
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
  
  // Limitar la velocidad máxima con precisión controlada
  const speed = fixPrecision(Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY), 4);
  if (speed > maxSpeed) {
    state.velocityX = fixPrecision((state.velocityX / speed) * maxSpeed, 4);
    state.velocityY = fixPrecision((state.velocityY / speed) * maxSpeed, 4);
  }
  
  // Calcular el ángulo basado en la dirección de la velocidad con precisión controlada
  const targetAngle = fixPrecision(Math.atan2(state.velocityY, state.velocityX), 6);
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = fixPrecision(lerpAngle(item.currentAngle || 0, targetAngle, 0.2), 6);
  }
  
  // Calcular factor de longitud basado en la velocidad con precisión controlada
  // Los vectores son más largos cuando se mueven más rápido
  const speedFactor = fixPrecision(speed / maxSpeed, 4);
  const newLengthFactor = fixPrecision(0.8 + speedFactor * 0.4, 4);
  
  // Obtener el factor de longitud actual con un valor predeterminado seguro
  const currentLengthFactor = fixPrecision(item.lengthFactor || 1.0, 4);
  
  // Aplicar transición suave al factor de longitud si está habilitado
  let finalLengthFactor = newLengthFactor;
  if (settings.lengthTransition) {
    finalLengthFactor = fixPrecision(lerp(currentLengthFactor, newLengthFactor, 0.2), 4);
  }
  
  // Mantener el factor de ancho existente con precisión controlada
  const newWidthFactor = fixPrecision(item.widthFactor || 1.0, 4);
  
  // Limpiar estados viejos para evitar fugas de memoria
  if (settings.type !== 'flocking') {
    if (flockingStates.size > 0) {
      flockingStates.clear();
    }
    if (spatialGrid) {
      spatialGrid.clear();
      spatialGrid = null;
    }
  } else if (allVectors) {
    // Purgar estados de vectores que ya no existen
    const now = Date.now();
    const needsGridUpdate = !spatialGrid || 
      perceptionRadius !== lastPerceptionRadius ||
      (now - lastFrameTime > GRID_UPDATE_INTERVAL && 
       (lastCanvasWidth !== canvasWidth || lastCanvasHeight !== canvasHeight));
    
    if (needsGridUpdate) {
      // Reconstruir la cuadrícula espacial si es necesario
      spatialGrid = new SpatialGrid(perceptionRadius * 2, canvasWidth, canvasHeight);
      allVectors.forEach(v => spatialGrid!.insert(v));
      lastPerceptionRadius = perceptionRadius;
      lastCanvasWidth = canvasWidth;
      lastCanvasHeight = canvasHeight;
      lastFrameTime = now;
    } else {
      // Actualizar solo los vectores que han cambiado de celda
      allVectors.forEach(v => spatialGrid!.update(v));
    }
    
    // Limpiar estados de vectores que ya no existen
    const aliveIds = new Set(allVectors.map(v => v.id));
    for (const id of flockingStates.keys()) {
      if (!aliveIds.has(id)) {
        flockingStates.delete(id);
      }
    }
  }
  
  return {
    ...item,
    currentAngle: newAngle,                       // Actualizar el ángulo actual con precisión
    targetAngle: targetAngle,                     // Guardar el ángulo objetivo con precisión
    previousAngle: fixPrecision(item.currentAngle || 0, 6),   // Guardar el ángulo anterior
    lengthFactor: finalLengthFactor,              // Actualizar el factor de longitud con precisión
    widthFactor: newWidthFactor                   // Mantener el factor de ancho con precisión
  };
};
