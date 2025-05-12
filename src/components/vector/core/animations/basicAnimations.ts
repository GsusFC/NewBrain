import { AnimatedVectorItem, VectorDimensions } from '../types';
import { 
  DirectionalFlowProps, 
  VortexProps,
  AnimationCalculation,
  FlockingProps,
  FlockingAnimationState
} from './animationTypes';

/**
 * Calcula el ángulo para la animación de "flujo direccional"
 * Los vectores fluyen en una dirección general con variación configurable
 */
export const calculateDirectionalFlow = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: DirectionalFlowProps,
): AnimationCalculation => {
  const { 
    flowAngle = 0, 
    flowSpeed = 1.0,
    turbulence = 0 
  } = props;
  
  let angle = flowAngle;
  
  if (turbulence > 0) {
    // Añadir un pequeño ruido pseudoaleatorio basado en la posición del vector
    // para que no todos los vectores tengan la misma turbulencia exacta
    const seed = item.baseX * 0.12 + item.baseY * 0.15;
    const noise = (Math.sin(seed + timestamp * 0.001) * 0.5 + 0.5) * turbulence * 45;
    angle += noise - (turbulence * 22.5); // Centrar el ruido alrededor de flowAngle
  }
  
  return { angle };
};

/**
 * Calcula el ángulo para la animación de "vórtice"
 * Los vectores giran alrededor de un punto central
 */
export const calculateVortex = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: VortexProps,
  dimensions: VectorDimensions
): AnimationCalculation => {
  const { 
    vortexCenterX, 
    vortexCenterY, 
    strength = 0.05, 
    radiusFalloff = 2,
    swirlDirection = 'clockwise' 
  } = props;
  
  // Determinar el centro del vórtice (usar el centro de la cuadrícula si no se especifica)
  const centerX = vortexCenterX !== undefined ? vortexCenterX : dimensions.width / 2;
  const centerY = vortexCenterY !== undefined ? vortexCenterY : dimensions.height / 2;
  
  // Calcular la dirección al centro del vórtice
  const dx = item.baseX - centerX;
  const dy = item.baseY - centerY;
  
  // Distancia al centro del vórtice
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Evitar división por cero
  if (distance === 0) return { angle: item.currentAngle };
  
  // Calcular la fuerza del vórtice basada en la distancia
  const swirl = strength / Math.pow(distance, radiusFalloff / 10);
  
  // Calcular el ángulo tangencial al centro
  const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Añadir o restar 90 grados dependiendo de la dirección del remolino
  const tangentOffset = swirlDirection === 'clockwise' ? 90 : -90;
  const angle = baseAngle + tangentOffset;
  
  // Factor de longitud inverso a la distancia (opcional)
  const lengthFactor = 1 + (swirl * 2);
  
  return { 
    angle,
    lengthFactor
  };
};

/**
 * Calcula el comportamiento de flocking (boids) para cada vector
 * Implementa las reglas de separación, alineación y cohesión
 */
export const calculateFlocking = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: FlockingProps,
  allVectors: AnimatedVectorItem[]
): AnimationCalculation => {
  const {
    perceptionRadius = 50,
    maxSpeed = 0.5,
    separationForce = 1.5,
    alignmentForce = 1.0,
    cohesionForce = 1.0,
    targetSeekingForce = 0,
    targetX,
    targetY
  } = props;
  
  // Inicializar el estado de animación si no existe
  if (!item.animationState) {
    item.animationState = {
      velocityX: Math.cos(item.currentAngle * (Math.PI / 180)) * 0.1,
      velocityY: Math.sin(item.currentAngle * (Math.PI / 180)) * 0.1
    } as FlockingAnimationState;
  }
  
  // Obtenemos el estado actual
  const state = item.animationState as FlockingAnimationState;
  
  // Encontrar vectores vecinos dentro del radio de percepción
  const neighbors: AnimatedVectorItem[] = [];
  for (const other of allVectors) {
    if (other.id === item.id) continue;
    
    // Solo considerar vectores del mismo flockId si está definido
    if (item.flockId !== undefined && other.flockId !== item.flockId) continue;
    
    const dx = other.baseX - item.baseX;
    const dy = other.baseY - item.baseY;
    const distSq = dx * dx + dy * dy;
    
    if (distSq < perceptionRadius * perceptionRadius) {
      neighbors.push(other);
    }
  }
  
  // Inicializar vectores de fuerza
  let separationX = 0, separationY = 0;
  let alignmentX = 0, alignmentY = 0;
  let cohesionX = 0, cohesionY = 0;
  let targetX_force = 0, targetY_force = 0;
  
  // 1. Separación: evitar otros boids cercanos
  if (separationForce > 0) {
    for (const other of neighbors) {
      const dx = item.baseX - other.baseX;
      const dy = item.baseY - other.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        // La fuerza es inversamente proporcional a la distancia
        const factor = separationForce / dist;
        separationX += dx * factor;
        separationY += dy * factor;
      }
    }
  }
  
  if (neighbors.length > 0) {
    // 2. Alineación: alinearse con la dirección promedio de los vecinos
    if (alignmentForce > 0) {
      let avgVelX = 0, avgVelY = 0;
      
      for (const other of neighbors) {
        // Usar el ángulo actual como dirección
        avgVelX += Math.cos(other.currentAngle * (Math.PI / 180));
        avgVelY += Math.sin(other.currentAngle * (Math.PI / 180));
      }
      
      avgVelX /= neighbors.length;
      avgVelY /= neighbors.length;
      
      alignmentX = avgVelX * alignmentForce;
      alignmentY = avgVelY * alignmentForce;
    }
    
    // 3. Cohesión: moverse hacia el centro de masa de los vecinos
    if (cohesionForce > 0) {
      let centerX = 0, centerY = 0;
      
      for (const other of neighbors) {
        centerX += other.baseX;
        centerY += other.baseY;
      }
      
      centerX /= neighbors.length;
      centerY /= neighbors.length;
      
      cohesionX = (centerX - item.baseX) * cohesionForce * 0.01;
      cohesionY = (centerY - item.baseY) * cohesionForce * 0.01;
    }
  }
  
  // 4. Buscar objetivo (opcional)
  if (targetSeekingForce && targetX !== undefined && targetY !== undefined) {
    const dx = targetX - item.baseX;
    const dy = targetY - item.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      targetX_force = dx * targetSeekingForce * 0.01;
      targetY_force = dy * targetSeekingForce * 0.01;
    }
  }
  
  // Actualizar velocidad basada en las fuerzas
  state.velocityX += separationX + alignmentX + cohesionX + targetX_force;
  state.velocityY += separationY + alignmentY + cohesionY + targetY_force;
  
  // Limitar velocidad máxima
  const speed = Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY);
  if (speed > maxSpeed) {
    state.velocityX = (state.velocityX / speed) * maxSpeed;
    state.velocityY = (state.velocityY / speed) * maxSpeed;
  }
  
  // Calcular el nuevo ángulo basado en la velocidad
  const angle = Math.atan2(state.velocityY, state.velocityX) * (180 / Math.PI);
  
  // El factor de longitud podría estar basado en la velocidad
  const lengthFactor = 1 + (speed / maxSpeed) * 0.5;
  
  return {
    angle,
    lengthFactor
  };
};
