/**
 * Animación de interacción con el ratón (Mouse Interaction)
 * Permite que los vectores reaccionen a la posición del ratón
 */

import { AnimatedVectorItem, AnimationSettings, MouseInteractionProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { distance, angleToPoint } from '../utils/math';
import { lerp } from '../utils/interpolation';
import { ensureRange } from '../utils/validation';
import { fixPrecision } from '@/utils/precision';

// Para detección temprana de problemas según TDD
const EPSILON = 1e-6; // Tolerancia para comparaciones de punto flotante

const assert = (condition: boolean, message: string): void => {
  if (!condition && process.env.NODE_ENV !== 'production') {
    console.error(`[Assertion Error] ${message}`);
  }
};

// Función para comparar números de punto flotante con tolerancia
const floatEquals = (a: number, b: number, epsilon = EPSILON): boolean => 
  Math.abs(a - b) < epsilon;

// Función para verificar si un valor está dentro de un rango con tolerancia
const inRange = (value: number, min: number, max: number, epsilon = EPSILON): boolean => 
  value >= min - epsilon && value <= max + epsilon;

/**
 * Actualiza un vector según la interacción con el ratón
 * @param item - Vector a actualizar
 * @param currentTime - Tiempo actual en milisegundos
 * @param props - Propiedades específicas de la interacción con el ratón
 * @param settings - Configuración general de la animación
 * @returns Vector actualizado
 */
export const updateMouseInteraction = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<MouseInteractionProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Si no hay posición del ratón, mantener el vector sin cambios
  if (settings.mouseX === null || settings.mouseY === null) {
    return item;
  }

  // Get default props with proper type safety
  const defaultProps = getDefaultPropsForType('mouseInteraction');
  const {
    interactionRadius = defaultProps.interactionRadius,
    effectType = defaultProps.effectType,
    effectStrength = defaultProps.effectStrength,
    falloffFactor = defaultProps.falloffFactor
  } = { ...defaultProps, ...props };

  // Asegurar que tenemos coordenadas válidas para evitar NaN
  assert(typeof settings.mouseX === 'number' && typeof settings.mouseY === 'number', 
         'Las coordenadas del ratón deben ser números válidos');
         
  // Calcular la distancia entre el vector y el ratón (sin precisión fija para rendimiento)
  const rawDist = distance(item.baseX, item.baseY, settings.mouseX, settings.mouseY);
  
  // Si está fuera del radio de interacción, mantener el vector sin cambios
  if (rawDist > interactionRadius + EPSILON) {
    return item;
  }
  
  // Calcular la intensidad del efecto basada en la distancia
  // Cuanto más cerca esté el ratón, más fuerte será el efecto
  const normalizedDist = rawDist / interactionRadius;
  const effectIntensity = Math.pow(1 - Math.max(0, Math.min(1, normalizedDist)), falloffFactor) * effectStrength;
  
  // Verificar que la intensidad está en un rango válido con tolerancia para punto flotante
  assert(
    inRange(effectIntensity, 0, effectStrength),
    `La intensidad del efecto (${effectIntensity.toFixed(6)}) debe estar entre 0 y ${effectStrength}`
  );
  
  // Variables para almacenar los valores calculados (sin precisión fija para rendimiento)
  let targetAngle = item.currentAngle || 0;
  let newLengthFactor = item.lengthFactor || 1.0;
  
  // Calcular el ángulo al ratón una sola vez si es necesario
  let angleToMouse: number | null = null;
  
  // Aplicar el efecto según el tipo seleccionado
  switch (effectType) {
    case 'attract':
      // Atraer: Los vectores apuntan hacia el ratón
      targetAngle = angleToPoint(item.baseX, item.baseY, settings.mouseX, settings.mouseY);
      // Aumentar longitud cuando están cerca del ratón
      newLengthFactor = 1 + effectIntensity * 0.5;
      break;
      
    case 'repel':
      // Repeler: Los vectores apuntan en dirección opuesta al ratón
      targetAngle = angleToPoint(item.baseX, item.baseY, settings.mouseX, settings.mouseY) + Math.PI;
      // Aumentar longitud cuando están cerca del ratón
      newLengthFactor = 1 + effectIntensity * 0.5;
      break;
      
    case 'rotate':
      // Rotar: Los vectores giran alrededor formando un remolino
      angleToMouse = angleToPoint(item.baseX, item.baseY, settings.mouseX, settings.mouseY);
      // Calcular ángulo perpendicular (tangencial) para efecto de remolino
      targetAngle = angleToMouse + Math.PI / 2;
      newLengthFactor = 1 + effectIntensity * 0.3;
      break;
  }
  
  // Normalizar el ángulo al rango [-π, π]
  targetAngle = ((targetAngle % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  
  // Verificar que los ángulos están normalizados correctamente
  assert(targetAngle >= -Math.PI * 2 && targetAngle <= Math.PI * 2, 
         `El ángulo objetivo (${targetAngle}) debe estar en un rango válido`);
  
  // Aplicar la rotación al vector con interpolación para una transición suave
  const currentAngle = item.currentAngle || 0;
  let angleDiff = targetAngle - currentAngle;
  
  // Ajustar el ángulo para tomar el camino más corto
  angleDiff = ((angleDiff + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  
  // Aplicar interpolación para una transición suave
  const rotationSpeed = 0.1; // Velocidad de rotación (ajustable)
  const newAngle = currentAngle + angleDiff * rotationSpeed;
  
  // Aplicar el factor de longitud con interpolación suave
  const currentLengthFactor = item.lengthFactor || 1.0;
  const lengthDiff = newLengthFactor - currentLengthFactor;
  
  // Calcular y limitar el factor de longitud final en un solo paso
  const finalLengthFactor = ensureRange(
    currentLengthFactor + lengthDiff * 0.1, 
    0.5, 
    1.5
  );
  
  // Mantener el factor de ancho existente
  const newWidthFactor = item.widthFactor || 1.0;
  
  // Aplicar los cambios al vector (la precisión se aplicará al guardar en el store)
  return {
    ...item,
    currentAngle: newAngle,
    lengthFactor: finalLengthFactor,
    // Los valores base y actuales se mantienen sin cambios para evitar cálculos innecesarios
    // La precisión se aplicará solo cuando sea necesario (ej. al guardar en el store o renderizar)
  };
};
