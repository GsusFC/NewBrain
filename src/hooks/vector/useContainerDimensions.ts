import { useState, useEffect, RefObject } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Hook para obtener las dimensiones de un elemento contenedor y actualizarlas
 * cuando el tamaño del elemento cambie.
 *
 * @param ref - Una referencia React (RefObject) al elemento HTML contenedor.
 * @returns Un objeto con las propiedades `width` y `height` del contenedor.
 *          Devuelve { width: 0, height: 0 } si la referencia no es válida o antes de la primera medición.
 */
export const useContainerDimensions = (ref: RefObject<HTMLElement>): Dimensions => {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current; // Capturar el elemento actual

    const getDimensions = (): Dimensions => {
      if (element) {
        return {
          width: element.offsetWidth,
          height: element.offsetHeight,
        };
      }
      return { width: 0, height: 0 };
    };

    const handleResize = () => {
      const newDimensions = getDimensions();
      // Solo actualizar si las dimensiones realmente cambiaron
      setDimensions(currentDimensions => {
        if (newDimensions.width !== currentDimensions.width || newDimensions.height !== currentDimensions.height) {
          return newDimensions;
        }
        return currentDimensions;
      });
    };

    if (element) {
      setDimensions(getDimensions()); // Establecer dimensiones iniciales

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(element);

      // Limpieza: desconectar el observer cuando el componente se desmonte o la ref cambie
      return () => {
        // No es necesario verificar 'element' aquí porque si llegamos a observe(element), element era válido.
        // ResizeObserver maneja internamente si el elemento ya no está.
        // Lo importante es llamar a unobserve y disconnect.
        resizeObserver.unobserve(element);
        resizeObserver.disconnect();
      };
    }
    // Si no hay elemento, no hacer nada. El efecto se re-ejecutará si 'ref' cambia.
    // Opcionalmente, podrías resetear las dimensiones a 0,0 si el elemento desaparece.
    // else {
    //   setDimensions({ width: 0, height: 0 });
    // }
  }, [ref]); // Volver a ejecutar el efecto si la referencia (el objeto ref) cambia

  return dimensions;
};
