/**
 * Animación de bucle aleatorio (Random Loop)
 * Crea cambios de dirección aleatorios suaves a intervalos periódicos
 */

import { AnimatedVectorItem, AnimationSettings, RandomLoopProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerpAngle } from '../utils/interpolation';
import { randomRange } from '../utils/math';

// Estado interno para cada vector en la animación de bucle aleatorio
interface RandomLoopState {
  nextChangeTime: number;
  targetAngle: number;
  previousAngle: number;
  transitionStartTime: number;
}

// Mapa para almacenar el estado de cada vector
const randomLoopStates = new Map<string, RandomLoopState>();

/**
 * Actualiza un vector según la animación de bucle aleatorio
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de bucle aleatorio
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateRandomLoop = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<RandomLoopProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<RandomLoopProps>('randomLoop');
  const {
    intervalMs = defaultProps.intervalMs || 2000,
    transitionDurationFactor = defaultProps.transitionDurationFactor || 0.5
  } = props;

  // Calcular duración de transición basada en el factor y el intervalo
  const transitionDuration = intervalMs * transitionDurationFactor;
  
  // Inicializar o recuperar el estado del vector
  if (!randomLoopStates.has(item.id)) {
    // Si es un nuevo vector, inicializar con valores aleatorios
    randomLoopStates.set(item.id, {
      nextChangeTime: currentTime + intervalMs,
      targetAngle: item.angle,
      previousAngle: item.angle,
      transitionStartTime: currentTime
    });
  }
  
  // Obtener el estado actual del vector
  const state = randomLoopStates.get(item.id)!;
  
  // Verificar si es tiempo de cambiar a un nuevo ángulo objetivo
  if (currentTime >= state.nextChangeTime) {
    // Guardar el ángulo anterior
    state.previousAngle = state.targetAngle;
    
    // Generar un nuevo ángulo objetivo aleatorio
    // Añadir un offset aleatorio de hasta PI/2 (45 grados) en cualquier dirección
    const angleOffset = randomRange(-Math.PI / 2, Math.PI / 2);
    state.targetAngle = state.targetAngle + angleOffset;
    
    // Programar el próximo cambio
    state.nextChangeTime = currentTime + intervalMs;
    state.transitionStartTime = currentTime;
  }
  
  // Calcular el progreso de la transición actual (0-1)
  const timeSinceTransitionStart = currentTime - state.transitionStartTime;
  const transitionProgress = Math.min(timeSinceTransitionStart / transitionDuration, 1);
  
  // Aplicar una función de suavizado para la transición (ease-in-out)
  const smoothProgress = transitionProgress < 0.5
    ? 2 * transitionProgress * transitionProgress
    : -1 + (4 - 2 * transitionProgress) * transitionProgress;
  
  // Interpolar entre el ángulo anterior y el objetivo
  const newAngle = lerpAngle(
    state.previousAngle,
    state.targetAngle,
    smoothProgress
  );
  
  // Calcular factor de longitud basado en la fase de transición
  // Durante la transición, los vectores son ligeramente más cortos
  const lengthFactor = 1 - Math.sin(smoothProgress * Math.PI) * 0.2;
  const newLength = item.originalLength * lengthFactor;
  
  // Limpiar estados viejos para evitar fugas de memoria
  if (settings.type !== 'randomLoop' && randomLoopStates.size > 0) {
    randomLoopStates.clear();
  }
  
  return {
    ...item,
    angle: newAngle,
    length: newLength
  };
};
