# Sistema de Animaciones Avanzadas para VectorGrid

## Tipos de Animación y Propiedades

A continuación se detallan los tipos de animación a implementar, junto con sus propiedades configurables y características específicas.

| `animationType` | Descripción | `animationProps` Esperadas |
|----------------|-------------|----------------------------|
| `none` | Sin animación. Los vectores mantienen su `initialAngle`. | `{}` |
| `staticAngle` | Todos los vectores apuntan a un ángulo fijo. | `angle: number` (ej. 45) |
| `randomStatic` | Cada vector tiene un ángulo aleatorio fijo (ya cubierto por `initialAngle`). | `{}` (se basa en `initialAngle`) |
| `randomLoop` | Cada vector cambia a un nuevo ángulo aleatorio a intervalos. | `intervalMs: number` (ej. 2000)<br>`transitionDurationFactor: number` (ej. 0.5) |
| `smoothWaves` | Ondas suaves que se propagan por la cuadrícula. | `waveFrequency: number` (0.0005)<br>`waveAmplitude: number` (45)<br>`waveSpeed: number` (0.01)<br>`baseAngle: number` (0)<br>`patternScale: number` (0.015)<br>`timeScale: number` (1.0)<br>`waveType: 'circular' \| 'linear' \| 'diagonal'` |
| `seaWaves` | Simulación más caótica de olas marinas con múltiples componentes. | `baseFrequency: number` (0.001)<br>`baseAmplitude: number` (30)<br>`rippleFrequency: number` (0.002)<br>`rippleAmplitude: number` (15)<br>`choppiness: number` (0-1)<br>`spatialFactor: number` (0.01) |
| `perlinFlow` | Movimiento fluido basado en ruido Perlin/Simplex. | `noiseScale: number` (0.02)<br>`timeEvolutionSpeed: number` (0.0005)<br>`angleMultiplier: number` (360) |
| `mouseInteraction` | Vectores reaccionan a la posición del ratón. | `interactionRadius: number` (150)<br>`effectType: 'attract' \| 'repel' \| 'align' \| 'swirl'` |
| `centerPulse` | Onda expansiva desde el centro. | Props de `applyPulseToVector`:<br>`pulseDuration: number`<br>`maxAngleOffset: number`<br> etc. |
| `directionalFlow` | Todos los vectores fluyen en una dirección, con alguna variación. | `flowAngle: number` (0-360)<br>`flowSpeed: number` (1.0)<br>`turbulence: number` (0-1) |
| `flocking` | Simulación de comportamiento de bandada (separación, alineación, cohesión). | `perceptionRadius: number` (50)<br>`maxSpeed: number`<br>`separationForce: number` (1.5)<br>`alignmentForce: number` (1.0)<br>`cohesionForce: number` (1.0) |
| `geometricPattern` | Genera patrones geométricos estáticos o que evolucionan lentamente. | `patternType: 'radial' \| 'spiral' \| 'grid'` |
| `tangenteClasica` | Rotación tangencial alrededor del centro. | `rotationSpeed: number` (0.0003)<br>`direction: 'clockwise' \| 'counterclockwise'` |
| `lissajous` | Ángulos basados en curvas de Lissajous. | `xFrequency: number` (2)<br>`yFrequency: number` (3)<br>`xAmplitude: number` (90)<br>`yAmplitude: number` (90)<br>`phaseOffset: number` (Math.PI/2)<br>`timeSpeed: number` (0.001) |
| `vortex` | Los vectores giran alrededor de un punto (o el ratón). | `vortexCenterX?: number`<br>`vortexCenterY?: number`<br>`strength: number` (0.05)<br>`radiusFalloff: number` (2)<br>`swirlDirection: 'clockwise' \| 'counterclockwise'` |

## Estructura de Implementación

Para implementar este sistema de animaciones avanzadas, seguiremos la siguiente estructura:

### 1. Interfaces de TypeScript Específicas

Para cada tipo de animación, definiremos una interfaz específica:

```typescript
// Ejemplo para 'directionalFlow'
interface DirectionalFlowProps {
  flowAngle?: number;
  flowSpeed?: number;
  turbulence?: number;
}
```

### 2. Funciones Auxiliares Modulares

Cada tipo de animación tendrá su propia función auxiliar para calcular el ángulo objetivo:

```typescript
const calculateTargetAngle_DirectionalFlow = (
  item: AnimatedVectorItem,
  timestamp: number,
  props: DirectionalFlowProps,
): number => {
  const { flowAngle = 0, turbulence = 0 } = props;
  let angle = flowAngle;
  
  if (turbulence > 0) {
    const noise = (Math.sin(item.baseX * 0.1) + Math.cos(item.baseY * 0.1)) * turbulence * 45;
    angle += noise;
  }
  
  return angle;
};
```

### 3. Gestión del Estado de Animación

El objeto `animationState` de cada vector se utilizará para mantener información específica de la animación:

```typescript
// Para 'randomLoop'
item.animationState = {
  nextRandomTime: timestamp + intervalMs,
  targetAngle: Math.random() * 360
};
```

### 4. Plan de Implementación

1. **Fase 1**: Implementar animaciones básicas:
   - Verificar y mejorar la implementación actual de `smoothWaves`
   - Implementar `directionalFlow`
   - Implementar `tangenteClasica`

2. **Fase 2**: Implementar animaciones interactivas:
   - Mejorar `mouseInteraction` con tipos de efecto
   - Implementar `vortex`

3. **Fase 3**: Implementar animaciones complejas:
   - Implementar `flocking` (con optimización de búsqueda de vecinos)
   - Implementar `perlinFlow` (usando una librería de ruido)
   - Implementar `lissajous`

4. **Fase 4**: Implementar animaciones especiales:
   - Implementar `seaWaves`
   - Implementar `geometricPattern`

## Consideraciones Técnicas

1. **Rendimiento**: 
   - Las animaciones deben ser eficientes y usar `deltaTime` para independencia del framerate
   - Optimizar cálculos costosos (como encontrar vecinos en `flocking`)

2. **Modularidad**:
   - Dividir las funciones de animación complejas en archivos separados
   - Crear un mecanismo de registro de animaciones para facilitar la adición de nuevas

3. **Extensibilidad**:
   - Diseñar el sistema para facilitar la adición de nuevos tipos de animación
   - Permitir la combinación de efectos (p.ej., aplicar pulso sobre una animación base)
