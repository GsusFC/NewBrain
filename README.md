# VectorGrid Brain V2

Sistema avanzado para la visualización y manipulación de vectores en un grid dinámico. Implementa técnicas de optimización para una experiencia de usuario fluida y responsiva.

## Características Principales

- **Visualización de Vectores**: Renderizado eficiente con SVG y Canvas
- **Controles Deslizantes Optimizados**: Interacción fluida mediante estado local y técnicas de debounce
- **Soporte para SVG Personalizado**: Integración de SVGs definidos por el usuario
- **Animaciones Suaves**: Transiciones y cambios visuales optimizados
- **Arquitectura Escalable**: Separación de responsabilidades en componentes especializados

## Optimizaciones Implementadas

### Controles Deslizantes
- Estado local durante el arrastre para UI fluida
- Debounce de 50ms para reducir actualizaciones excesivas
- Soporte para eventos `onChangeEnd` para capturar el final del arrastre
- Validación mejorada de rangos y valores

### Renderizado de Vectores
- Implementación eficiente con SVG y Canvas
- Gestión de memoria optimizada
- Sistema de caché para vectores frecuentemente renderizados 
- Procesamiento de SVG personalizado con DOMParser

### Gestión de Estado
- Separación de estado local y global
- Actualizaciones atómicas para evitar renderizados innecesarios
- Memoización de cálculos costosos

## Tecnologías

- **React 18** con Hooks avanzados
- **TypeScript** para tipado seguro
- **Next.js 14** con App Router
- **TailwindCSS** para estilos consistentes
- **Lodash** para funciones de utilidad como debounce

## Instalación

```bash
npm install
npm run dev
```

## Uso

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Ejemplos de Vectores

El sistema permite renderizar varios tipos de vectores:
- Flechas
- Líneas
- Puntos
- Curvas
- Triángulos
- Semicírculos
- SVGs personalizados

## Rendimiento

El sistema está optimizado para mantener 60fps incluso con cientos de vectores animados simultáneamente, gracias a las técnicas de renderizado condicional, memoización y gestión eficiente de eventos UI.
