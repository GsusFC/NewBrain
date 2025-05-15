/**
 * Animación de interacción con el ratón (Mouse Interaction)
 * Permite que los vectores reaccionen a la posición del ratón
 */

import { AnimatedVectorItem, AnimationSettings, MouseInteractionProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';
import { distance, angleToPoint } from '../utils/math';
import { lerp } from '../utils/interpolation';
import { ensureRange } from '../utils/validation';

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

  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<MouseInteractionProps>('mouseInteraction');
  const {
    interactionRadius = defaultProps.interactionRadius || 150,
    effectType = defaultProps.effectType || 'attract',
    effectStrength = defaultProps.effectStrength || 1.0,
    falloffFactor = defaultProps.falloffFactor || 0.5
  } = props;

  // Calcular la distancia entre el vector y el ratón
  const dist = distance(item.x, item.y, settings.mouseX, settings.mouseY);
  
  // Si está fuera del radio de interacción, mantener el vector sin cambios
  if (dist > interactionRadius) {
    return item;
  }
  
  // Calcular la intensidad del efecto basada en la distancia
  // Cuanto más cerca esté el ratón, más fuerte será el efecto
  const normalizedDist = dist / interactionRadius;
  const effectIntensity = Math.pow(1 - normalizedDist, falloffFactor) * effectStrength;
  
  // Variables para almacenar los valores calculados
  let targetAngle = item.angle;
  let targetLength = item.originalLength;
  
  // Aplicar el efecto según el tipo seleccionado
  switch (effectType) {
    case 'attract':
      // Atraer: Los vectores apuntan hacia el ratón
      targetAngle = angleToPoint(item.x, item.y, settings.mouseX, settings.mouseY);
      // Aumentar longitud cuando están cerca del ratón
      targetLength = item.originalLength * (1 + effectIntensity * 0.5);
      break;
      
    case 'repel':
      // Repeler: Los vectores apuntan en dirección opuesta al ratón
      targetAngle = angleToPoint(item.x, item.y, settings.mouseX, settings.mouseY) + Math.PI;
      // Aumentar longitud cuando están cerca del ratón
      targetLength = item.originalLength * (1 + effectIntensity * 0.5);
      break;
      
    case 'rotate':
      // Rotar: Los vectores giran alrededor formando un remolino
      const angleToMouse = angleToPoint(item.x, item.y, settings.mouseX, settings.mouseY);
      // Calcular ángulo perpendicular (tangencial) para efecto de remolino
      targetAngle = angleToMouse + Math.PI / 2;
      targetLength = item.originalLength * (1 + effectIntensity * 0.3);
      break;
  }
  
  // Aplicar transición suave al ángulo si está habilitado
  let newAngle = targetAngle;
  if (settings.angleTransition) {
    newAngle = lerp(item.angle, targetAngle, 0.2 * effectIntensity);
  }
  
  // Aplicar transición suave a la longitud si está habilitado
  let newLength = targetLength;
  if (settings.lengthTransition) {
    newLength = lerp(item.length, targetLength, 0.2 * effectIntensity);
  }
  
  // Limitar la longitud para evitar valores extremos
  newLength = ensureRange(newLength, item.originalLength * 0.5, item.originalLength * 1.5);
  
  return {
    ...item,
    angle: newAngle,
    length: newLength
  };
};
