# Sistema de Animaciones VectorGrid

## Índice
1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Flujo de Datos](#flujo-de-datos)
5. [Implementación de una Nueva Animación](#implementación-de-una-nueva-animación)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

## Introducción

El sistema de animaciones de VectorGrid ha sido completamente refactorizado para seguir un enfoque modular y desacoplado. Esta nueva arquitectura permite:

- **Aislamiento de estado**: Cada instancia de animación mantiene su propio estado, evitando conflictos entre diferentes componentes.
- **Extensibilidad**: Facilita la adición de nuevos tipos de animación sin modificar el núcleo.
- **Tipado estricto**: Utiliza TypeScript para garantizar la integridad de los datos en todo el sistema.
- **Rendimiento optimizado**: Minimiza las re-renderizaciones y operaciones costosas.

## Arquitectura General

El sistema sigue un patrón de fábrica + estrategia donde:

1. Cada tipo de animación se implementa como un módulo independiente
2. El hook principal `useVectorAnimation` actúa como orquestador
3. La conversión entre tipos `UIVectorItem` y `AnimatedVectorItem` garantiza la compatibilidad
4. Cada animación puede tener su propio gestor de estado (como el `CenterPulseManager`)

```
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  useVectorAnimation │────▶│ AnimationStrategy   │
│  (Orquestador)      │     │ (Implementaciones)  │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
           ▲                            │
           │                            │
           │                            ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  Componente UI      │     │  Estado de          │
│  (VectorGrid)       │     │  Animación          │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
```

## Estructura de Archivos

```
src/components/vector/core/
├── animations/
│   ├── index.ts                # Punto de entrada y exportaciones
│   ├── animationTypes.ts       # Definiciones de tipos comunes
│   ├── defaultProps.ts         # Valores predeterminados para cada animación
│   ├── centerPulse.ts          # Implementación de animación de pulso
│   ├── advancedAnimations.ts   # Otras implementaciones de animación
│   └── ... (otras animaciones)
├── utils/
│   ├── math.ts                 # Funciones matemáticas auxiliares
│   ├── interpolation.ts        # Funciones de interpolación
│   └── validation.ts           # Utilidades de validación
├── types.ts                    # Definiciones de tipos para la interfaz UI
├── useVectorAnimation.ts       # Hook principal de animación
└── ... (otros archivos)
```

## Flujo de Datos

1. **Inicialización**:
   - El componente o hook usuario proporciona vectores iniciales y configuración
   - `useVectorAnimation` convierte estos a formato interno (`AnimatedVectorItem`)
   - Se inicializan gestores específicos (ej: `pulseManagerRef`)

2. **Ciclo de Animación**:
   - El hook configura un loop de animación usando `requestAnimationFrame`
   - En cada frame, se calculan los deltas de tiempo
   - Se actualiza cada vector según el tipo de animación seleccionado
   - Los vectores actualizados se convierten de vuelta al formato UI

3. **Interacción**:
   - Eventos externos (como clicks) pueden disparar efectos (ej: pulsos)
   - Los gestores específicos (como `CenterPulseManager`) manejan estos eventos
   - El sistema propaga los cambios a través del estado de animación

## Implementación de una Nueva Animación

Para crear una nueva animación, sigue estos pasos:

### 1. Definir tipos específicos

En `animationTypes.ts`, añade:

```typescript
// Definir tipo de animación
export const NUEVA_ANIMACION = 'nuevaAnimacion' as const;

// Añadir a la unión de tipos existente
export type AnimationType = 
  | typeof WAVE 
  | typeof CENTER_PULSE
  // ... otros tipos existentes
  | typeof NUEVA_ANIMACION;

// Definir propiedades específicas
export interface NuevaAnimacionProps {
  propiedad1: number;
  propiedad2: string;
  // ... otras propiedades específicas
}
```

### 2. Implementar función de actualización

Crea un nuevo archivo, por ejemplo `nuevaAnimacion.ts`:

```typescript
import { AnimatedVectorItem, AnimationSettings, NuevaAnimacionProps } from './animationTypes';
import { getDefaultPropsForType } from './defaultProps';

/**
 * Actualiza un vector según la nueva animación
 */
export const updateNuevaAnimacion = (
  item: AnimatedVectorItem,
  currentTime: number,
  props: Partial<NuevaAnimacionProps>,
  settings: AnimationSettings
): AnimatedVectorItem => {
  // Obtener propiedades con valores predeterminados
  const defaultProps = getDefaultPropsForType<NuevaAnimacionProps>('nuevaAnimacion');
  const {
    propiedad1 = defaultProps.propiedad1 || 0,
    propiedad2 = defaultProps.propiedad2 || 'default',
  } = props;
  
  // Lógica de animación
  // ...
  
  // Retornar vector actualizado
  return {
    ...item,
    // Propiedades modificadas
  };
};
```

### 3. Agregar valores predeterminados

En `defaultProps.ts`, añade:

```typescript
export const defaultPropsMap = {
  // ... otros tipos
  nuevaAnimacion: {
    propiedad1: 1.0,
    propiedad2: 'valor-predeterminado',
  } as NuevaAnimacionProps,
};
```

### 4. Registrar la animación en el sistema

En `animations/index.ts`, importa y exporta la nueva animación:

```typescript
import { updateNuevaAnimacion } from './nuevaAnimacion';

// ... otras exportaciones

// Exportar la nueva función de actualización
export { updateNuevaAnimacion };

// Actualizar el mapa de tipos a funciones
export const updateVectorByType = (
  type: AnimationType,
  item: AnimatedVectorItem,
  time: number,
  animationProps: any,
  settings: AnimationSettings
): AnimatedVectorItem => {
  switch (type) {
    // ... casos existentes
    case 'nuevaAnimacion':
      return updateNuevaAnimacion(item, time, animationProps, settings);
    default:
      return item;
  }
};
```

## Ejemplos Prácticos

### Ejemplo: Usar el sistema con la animación de pulso

```typescript
import { useVectorAnimation } from './core/useVectorAnimation';
import { CENTER_PULSE } from './core/animations/animationTypes';

const MiComponente = () => {
  const { animatedVectors, triggerPulse } = useVectorAnimation({
    initialVectors: [...],
    dimensions: { width, height },
    animationSettings: {
      animationType: CENTER_PULSE,
      animationProps: {
        pulseDuration: 1000,
        maxLengthFactor: 1.5
      }
    }
  });
  
  const handleClick = (e) => {
    // Disparar un pulso en las coordenadas del click
    triggerPulse(e.clientX, e.clientY);
  };
  
  return (
    <div onClick={handleClick}>
      {/* Renderizar vectores animados */}
    </div>
  );
};
```

### Ejemplo: Implementar un manager de estado personalizado

Similar al `CenterPulseManager`, puedes crear un gestor para tu animación:

```typescript
export interface MiAnimacionManager {
  iniciarEfecto: (param1: number, param2: string) => void;
  actualizarVector: (/* parámetros */) => AnimatedVectorItem;
  limpiarEstado: () => void;
}

export const createMiAnimacionManager = (): MiAnimacionManager => {
  // Estado local encapsulado
  let estadoInterno = { /* ... */ };
  
  // Métodos de gestión
  const iniciarEfecto = (/* ... */) => { /* ... */ };
  const actualizarVector = (/* ... */) => { /* ... */ };
  const limpiarEstado = () => { /* ... */ };
  
  return {
    iniciarEfecto,
    actualizarVector,
    limpiarEstado
  };
};
```

## Preguntas Frecuentes

### ¿Por qué usar una arquitectura modular?

La modularidad permite que cada animación sea independiente, facilitando:
- Pruebas unitarias aisladas
- Desarrollo en paralelo
- Extensibilidad sin modificar el código existente
- Depuración simplificada

### ¿Cómo manejar animaciones complejas con estado?

Para animaciones que requieren mantener estado entre frames:

1. Crea un gestor dedicado (como `CenterPulseManager`)
2. Encapsula el estado dentro del gestor
3. Proporciona métodos para interactuar con el estado
4. Usa una referencia (`useRef`) en el hook principal para preservar el gestor entre renders

### ¿Debo modificar `useVectorAnimation` para cada nueva animación?

No. El sistema está diseñado para ser extensible sin modificar el hook principal. Solo necesitas:
1. Implementar la función de actualización de la animación
2. Registrarla en el sistema a través de `updateVectorByType`
3. Definir los tipos necesarios
4. Establecer valores predeterminados

---

*Documentación generada para el equipo de desarrollo, mayo 2025.*
