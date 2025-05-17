import { 
  DirectionalFlowProps, 
  VortexProps,
  AnimationCalculation,
  FlockingProps,
  FlockingAnimationState,
  type AnimatedVectorItem,
  type VectorDimensions
} from './animationTypes';
import { fixPrecision } from '@/utils/precision';

// Para detección temprana de problemas según TDD
const assert = (condition: boolean, message: string): void => {
  if (!condition && process.env.NODE_ENV !== 'production') {
    console.error(`[Assertion Error] ${message}`);
  }
};

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
  
  // Establecer ángulo base con precisión controlada
  let angle = fixPrecision(flowAngle, 6);
  
  if (turbulence > 0) {
    // Añadir un pequeño ruido pseudoaleatorio basado en la posición del vector
    // para que no todos los vectores tengan la misma turbulencia exacta
    const seed = fixPrecision(item.baseX * 0.12 + item.baseY * 0.15, 4);
    const timeComponent = fixPrecision(timestamp * 0.001, 4);
    const sinValue = fixPrecision(Math.sin(seed + timeComponent), 4);
    const normalizedNoise = fixPrecision(sinValue * 0.5 + 0.5, 4);
    const noise = fixPrecision(normalizedNoise * turbulence * 45, 4);
    const turbulenceOffset = fixPrecision(turbulence * 22.5, 4);
    
    // Centrar el ruido alrededor de flowAngle con precisión controlada
    angle = fixPrecision(angle + noise - turbulenceOffset, 6);
    
    // Verificar que el ángulo está en un rango válido
    assert(isFinite(angle), `Ángulo con valor no válido: ${angle}`);
  }
  
  return { angle: angle };
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
  
  // Determinar el centro del vórtice con precisión controlada
  const centerX = fixPrecision(vortexCenterX !== undefined ? vortexCenterX : dimensions.width / 2, 2);
  const centerY = fixPrecision(vortexCenterY !== undefined ? vortexCenterY : dimensions.height / 2, 2);
  
  // Calcular la dirección al centro del vórtice con precisión controlada
  const dx = fixPrecision(item.baseX - centerX, 2);
  const dy = fixPrecision(item.baseY - centerY, 2);
  
  // Distancia al centro del vórtice con precisión controlada
  const distance = fixPrecision(Math.sqrt(dx * dx + dy * dy), 4);
  
  // Verificar que la distancia sea válida
  assert(isFinite(distance), `Distancia con valor no válido: ${distance}`);
  
  // Evitar división por cero
  if (distance === 0) {
    return {
      angle: fixPrecision(item.currentAngle || 0, 6),
      lengthFactor: 1 // Factor neutro para mantener consistencia en los renderizadores
    };
  }
  
  // Calcular la fuerza del vórtice basada en la distancia con precisión controlada
  const radiusFactor = fixPrecision(radiusFalloff / 10, 4);
  const denominator = fixPrecision(Math.pow(distance, radiusFactor), 4);
  const swirl = fixPrecision(strength / denominator, 4);
  
  // Calcular el ángulo tangencial al centro con precisión controlada
  // Nota: Mantenemos el resultado en radianes para mayor precisión
  const baseAngleRad = fixPrecision(Math.atan2(dy, dx), 6);
  const baseAngle = fixPrecision(baseAngleRad * (180 / Math.PI), 4);
  
  // Añadir o restar 90 grados dependiendo de la dirección del remolino
  const tangentOffset = swirlDirection === 'clockwise' ? 90 : -90;
  const angle = fixPrecision(baseAngle + tangentOffset, 4);
  
  // Factor de longitud inverso a la distancia con precisión controlada
  const lengthFactor = fixPrecision(1 + (swirl * 2), 4);
  
  // Verificar que los valores calculados son válidos
  assert(isFinite(angle), `Ángulo con valor no válido: ${angle}`);
  assert(isFinite(lengthFactor) && lengthFactor > 0, `Factor de longitud no válido: ${lengthFactor}`);
  
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
  
  // Inicializar el estado de animación si no existe, con precisión controlada
  if (!item.animationState) {
    // Convertir ángulo a radianes para mayor precisión
    const angleRad = fixPrecision((item.currentAngle || 0) * (Math.PI / 180), 6);
    const velocityX = fixPrecision(Math.cos(angleRad) * 0.1, 4);
    const velocityY = fixPrecision(Math.sin(angleRad) * 0.1, 4);
    
    // Crear el estado con el tipo correcto
    const initialState: FlockingAnimationState = {
      velocityX,
      velocityY,
      lastNeighborIds: []
    };
    
    // Asignar el estado tipado
    item.animationState = initialState as unknown as Record<string, unknown>;
  }
  
  // Obtenemos el estado actual y lo tratamos como FlockingAnimationState para facilitar el acceso
  // Primero verificamos que el estado contenga las propiedades necesarias
  assert(item.animationState && 
         typeof item.animationState.velocityX === 'number' && 
         typeof item.animationState.velocityY === 'number',
         'El estado de animación debe contener velocityX y velocityY como números');
         
  // Convertir el estado de animación al tipo correcto con validación
  const state = item.animationState as unknown as FlockingAnimationState;
  
  // Validar que las propiedades requeridas existen y son del tipo correcto
  if (state === undefined || state === null) {
    throw new Error('El estado de animación no está definido');
  }
  
  if (typeof state.velocityX !== 'number' || typeof state.velocityY !== 'number') {
    throw new Error('El estado de animación no tiene las propiedades velocityX o velocityY correctamente definidas');
  }
  
  // Asegurar precisión en los valores de velocidad
  state.velocityX = fixPrecision(state.velocityX, 4);
  state.velocityY = fixPrecision(state.velocityY, 4);
  
  // Inicializar lastNeighborIds si no existe
  if (!state.lastNeighborIds) {
    state.lastNeighborIds = [];
  }
  
  // Encontrar vectores vecinos dentro del radio de percepción
  const neighbors: AnimatedVectorItem[] = [];
  for (const other of allVectors) {
    if (other.id === item.id) continue;
    
    // Solo considerar vectores del mismo flockId si está definido
    if (item.flockId !== undefined && other.flockId !== item.flockId) continue;
    
    // Calcular distancia con precisión controlada
    const dx = fixPrecision(other.baseX - item.baseX, 2);
    const dy = fixPrecision(other.baseY - item.baseY, 2);
    const distSq = fixPrecision(dx * dx + dy * dy, 4);
    
    // Usar el cuadrado de la distancia para comparaciones por eficiencia
    const radiusSq = fixPrecision(perceptionRadius * perceptionRadius, 4);
    
    if (distSq < radiusSq) {
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
      // Cálculo de separación con precisión controlada
      const dx = fixPrecision(item.baseX - other.baseX, 2);
      const dy = fixPrecision(item.baseY - other.baseY, 2);
      const dist = fixPrecision(Math.sqrt(dx * dx + dy * dy), 4);
      
      if (dist > 0) {
        // La fuerza es inversamente proporcional a la distancia
        const factor = fixPrecision(separationForce / dist, 4);
        separationX = fixPrecision(separationX + dx * factor, 4);
        separationY = fixPrecision(separationY + dy * factor, 4);
      }
    }
  }
  
  if (neighbors.length > 0) {
    // 2. Alineación: alinearse con la dirección promedio de los vecinos
    if (alignmentForce > 0) {
      let avgVelX = 0, avgVelY = 0;
      
      for (const other of neighbors) {
        // Usar el ángulo actual como dirección con precisión controlada
        const angleRad = fixPrecision((other.currentAngle || 0) * (Math.PI / 180), 6);
        avgVelX = fixPrecision(avgVelX + Math.cos(angleRad), 4);
        avgVelY = fixPrecision(avgVelY + Math.sin(angleRad), 4);
      }
      
      // Calcular alineación promedio con precisión controlada
      avgVelX = fixPrecision(avgVelX / neighbors.length, 4);
      avgVelY = fixPrecision(avgVelY / neighbors.length, 4);
      
      alignmentX = fixPrecision(avgVelX * alignmentForce, 4);
      alignmentY = fixPrecision(avgVelY * alignmentForce, 4);
    }
    
    // 3. Cohesión: moverse hacia el centro de masa de los vecinos
    if (cohesionForce > 0) {
      let centerX = 0, centerY = 0;
      
      for (const other of neighbors) {
        // Acumular posiciones con precisión controlada
        centerX = fixPrecision(centerX + other.baseX, 2);
        centerY = fixPrecision(centerY + other.baseY, 2);
      }
      
      // Calcular centro de masa con precisión controlada
      centerX = fixPrecision(centerX / neighbors.length, 2);
      centerY = fixPrecision(centerY / neighbors.length, 2);
      
      // Calcular fuerza de cohesión con precisión controlada
      const cohesionScale = fixPrecision(cohesionForce * 0.01, 4);
      cohesionX = fixPrecision((centerX - item.baseX) * cohesionScale, 4);
      cohesionY = fixPrecision((centerY - item.baseY) * cohesionScale, 4);
    }
  }
  
  // 4. Buscar objetivo (opcional)
  if (targetSeekingForce && targetX !== undefined && targetY !== undefined) {
    // Calcular fuerza de búsqueda de objetivo con precisión controlada
    const dx = fixPrecision(targetX - item.baseX, 2);
    const dy = fixPrecision(targetY - item.baseY, 2);
    const dist = fixPrecision(Math.sqrt(dx * dx + dy * dy), 4);
    
    if (dist > 0) {
      const seekScale = fixPrecision(targetSeekingForce * 0.01, 4);
      targetX_force = fixPrecision(dx * seekScale, 4);
      targetY_force = fixPrecision(dy * seekScale, 4);
    }
  }
  
  // Actualizar velocidad basada en las fuerzas con precisión controlada
  const totalForceX = fixPrecision(separationX + alignmentX + cohesionX + targetX_force, 4);
  const totalForceY = fixPrecision(separationY + alignmentY + cohesionY + targetY_force, 4);
  
  // Actualizar las velocidades directamente en el estado
  state.velocityX = fixPrecision(state.velocityX + totalForceX, 4);
  state.velocityY = fixPrecision(state.velocityY + totalForceY, 4);
  
  // Verificar que la velocidad es válida
  assert(isFinite(state.velocityX) && isFinite(state.velocityY), 
         `Velocidad con valores no válidos: (${state.velocityX}, ${state.velocityY})`);
  
  // Limitar velocidad máxima con precisión controlada
  const velX = state.velocityX;
  const velY = state.velocityY;
  
  let speedSq = fixPrecision(velX * velX + velY * velY, 4);
  let speed = fixPrecision(Math.sqrt(speedSq), 4);
  
  if (speed > maxSpeed) {
    const factor = fixPrecision(maxSpeed / speed, 4);
    state.velocityX = fixPrecision(velX * factor, 4);
    state.velocityY = fixPrecision(velY * factor, 4);
    
    // Recalcular la velocidad después de aplicar el límite
    speedSq = fixPrecision(state.velocityX * state.velocityX + state.velocityY * state.velocityY, 4);
    speed = fixPrecision(Math.sqrt(speedSq), 4);
  }
  
  // Calcular el nuevo ángulo basado en la velocidad con precisión controlada
  const angleRad = fixPrecision(Math.atan2(state.velocityY, state.velocityX), 6);
  const angle = fixPrecision(angleRad * (180 / Math.PI), 4);
  
  // El factor de longitud basado en la velocidad con precisión controlada
  const speedRatio = fixPrecision(speed / maxSpeed, 4);
  const lengthFactor = fixPrecision(1 + speedRatio * 0.5, 4);
  
  // Verificar que los valores calculados son válidos
  assert(isFinite(angle), `Ángulo con valor no válido: ${angle}`);
  assert(isFinite(lengthFactor) && lengthFactor > 0, `Factor de longitud no válido: ${lengthFactor}`);
  
  return {
    angle,
    lengthFactor
  };
};
