/**
 * Animación de bucle aleatorio (Random Loop)
 * Crea cambios de dirección aleatorios suaves a intervalos periódicos
 */

import { AnimatedVectorItem, AnimationSettings, RandomLoopProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { lerpAngle } from '../utils/interpolation';
import { randomRange } from '../utils/math';
import { fixPrecision } from '@/utils/precision';

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

  // Calcular duración de transición basada en el factor y el intervalo con precisión controlada
  const transitionDuration = fixPrecision(intervalMs * transitionDurationFactor, 0);
  
  // Inicializar o recuperar el estado del vector
  if (!randomLoopStates.has(item.id)) {
    // Si es un nuevo vector, inicializar con valores aleatorios
    // Usamos currentAngle que es la propiedad correcta en la definición actualizada
    const initialAngle = fixPrecision(item.currentAngle || 0, 6);
    randomLoopStates.set(item.id, {
      nextChangeTime: fixPrecision(currentTime + intervalMs, 0),
      targetAngle: initialAngle,
      previousAngle: initialAngle,
      transitionStartTime: currentTime
    });
  }
  
  // Obtener el estado actual del vector
  const state = randomLoopStates.get(item.id)!;
  
  // Verificar si es tiempo de cambiar a un nuevo ángulo objetivo con precisión controlada
  if (currentTime >= state.nextChangeTime) {
    // Guardar el ángulo anterior con precisión controlada
    state.previousAngle = fixPrecision(state.targetAngle, 6);
    
    // Generar un nuevo ángulo objetivo aleatorio con precisión controlada
    // Añadir un offset aleatorio de hasta PI/2 (45 grados) en cualquier dirección
    const angleOffset = fixPrecision(randomRange(-Math.PI / 2, Math.PI / 2), 6);
    state.targetAngle = fixPrecision(state.targetAngle + angleOffset, 6);
    
    // Programar el próximo cambio con precisión controlada
    state.nextChangeTime = fixPrecision(currentTime + intervalMs, 0);
    state.transitionStartTime = currentTime;
  }
  
  // Calcular el progreso de la transición actual (0-1) con precisión controlada
  const timeSinceTransitionStart = fixPrecision(currentTime - state.transitionStartTime, 0);
  const transitionProgress = fixPrecision(Math.min(timeSinceTransitionStart / transitionDuration, 1), 4);
  
  // Aplicar una función de suavizado para la transición (ease-in-out) con precisión controlada
  const smoothProgress = transitionProgress < 0.5
    ? fixPrecision(2 * transitionProgress * transitionProgress, 4)
    : fixPrecision(-1 + (4 - 2 * transitionProgress) * transitionProgress, 4);
  
  // Interpolar entre el ángulo anterior y el objetivo con precisión controlada
  const newAngle = fixPrecision(lerpAngle(
    state.previousAngle,
    state.targetAngle,
    smoothProgress
  ), 6);
  
  // Calcular factor de longitud basado en la fase de transición con precisión controlada
  // Durante la transición, los vectores son ligeramente más cortos
  const newLengthFactor = fixPrecision(1 - Math.sin(smoothProgress * Math.PI) * 0.2, 4);
  
  // Obtener el factor de longitud actual con un valor predeterminado seguro
  const currentLengthFactor = fixPrecision(item.lengthFactor || 1.0, 4);
  
  // Aplicar transición suave al factor de longitud
  let finalLengthFactor = newLengthFactor;
  if (settings.lengthTransition) {
    finalLengthFactor = fixPrecision(lerpAngle(currentLengthFactor, newLengthFactor, 0.2), 4);
  }
  
  // Mantener el factor de ancho existente con precisión controlada
  const newWidthFactor = fixPrecision(item.widthFactor || 1.0, 4);
  
  // Limpiar estados viejos para evitar fugas de memoria
  if (settings.type !== 'randomLoop' && randomLoopStates.size > 0) {
    randomLoopStates.clear();
  }
  
  return {
    ...item,
    currentAngle: newAngle,                       // Actualizar el ángulo actual con precisión
    targetAngle: fixPrecision(state.targetAngle, 6),  // Guardar el ángulo objetivo con precisión
    previousAngle: fixPrecision(state.previousAngle, 6),  // Guardar el ángulo anterior con precisión
    lengthFactor: finalLengthFactor,              // Actualizar el factor de longitud con precisión
    widthFactor: newWidthFactor                   // Mantener el factor de ancho con precisión
  };
};
