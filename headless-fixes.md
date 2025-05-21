# Correcciones para la migración a Headless UI

## 1. Reemplazar fragmentos React por divs wrapper

En todos los archivos que usen componentes Headless UI como Disclosure, Dialog, Listbox, etc., busca:

```jsx
{({ open }) => (
  <>
    <Component.Button>
      ...
    </Component.Button>
    <Component.Panel>
      ...
    </Component.Panel>
  </>
)}
```

Y reemplázalo por:

```jsx
{({ open }) => (
  <div className="disclosure-wrapper"> {/* o un nombre de clase apropiado */}
    <Component.Button>
      ...
    </Component.Button>
    <Component.Panel>
      ...
    </Component.Panel>
  </div>
)}
```

## 2. Arreglar componentes que usan Fragmentos con wrappers DIV

Buscar en estos archivos:

- src/components/vector/controls/PanelDeControlDerecho.tsx
- src/components/vector/controls/PanelDeControlPanel.tsx
- src/components/vector/controls/RightControlPanelSimple.tsx
- src/components/vector/controls/RightCustomControlPanel.tsx

Reemplazar todos los fragmentos `<>...</>` que envuelvan componentes Headless UI con divs:

```jsx
<div className="disclosure-wrapper">...</div>
```

## 3. Problemas de accesibilidad en componentes Headless

Verificar y corregir:

- En scroll-area-headless.tsx: Los elementos con role="scrollbar" necesitan:
  - ser focusables (añadir tabIndex={0})
  - tener atributos ARIA requeridos (aria-controls, aria-valuenow)

- En select-headless.tsx: Crear asociación correcta entre labels y controles

## 4. Estandarizar la estructura de componentes Headless

Estructura recomendada:

```jsx
<HeadlessComponent>
  {(state) => (
    <div className="headless-wrapper"> {/* Contenedor real para atributos data-* */}
      <HeadlessComponent.Trigger>...</HeadlessComponent.Trigger>
      <HeadlessComponent.Content>...</HeadlessComponent.Content>
    </div>
  )}
</HeadlessComponent>
```

## 5. Consideraciones para componentes anidados

Cuando anides componentes Headless UI, asegúrate de que cada uno tenga su propio contenedor DOM:

```jsx
<Disclosure>
  {() => (
    <div className="disclosure-wrapper">
      <Disclosure.Button>...</Disclosure.Button>
      <Disclosure.Panel>
        <Switch>
          {() => (
            <div className="switch-wrapper">
              ...
            </div>
          )}
        </Switch>
      </Disclosure.Panel>
    </div>
  )}
</Disclosure>
```

## Lista de errores comunes a verificar

1. Fragmentos React con Headless UI
2. Controles sin atributos ARIA requeridos
3. Componentes interactivos que no son focusables
4. Problemas al anidar componentes Headless UI
5. Problemas con el transporte de atributos data-headlessui-state