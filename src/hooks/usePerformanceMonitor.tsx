import { useEffect, useRef } from 'react';

/**
 * Hook para monitorear el rendimiento de un componente
 * Muestra FPS, uso de memoria y cuenta de renderizado
 */
export const usePerformanceMonitor = () => {
  const renderCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const framesRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // Efecto para configurar el monitor de rendimiento
  useEffect(() => {
    // Referencias a los elementos del DOM
    let fpsElement: HTMLElement | null = null;
    let memoryElement: HTMLElement | null = null;
    let renderElement: HTMLElement | null = null;

    // Función para medir FPS
    const measureFPS = (timestamp: number) => {
      framesRef.current++;
      const elapsed = timestamp - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        fpsRef.current = Math.round(framesRef.current * 1000 / elapsed);
        framesRef.current = 0;
        lastTimeRef.current = timestamp;
        
        if (!fpsElement) {
          fpsElement = document.getElementById('fps-counter');
        }
        if (fpsElement) {
          fpsElement.textContent = `FPS: ${fpsRef.current}`;
        }
      }
      
      rafIdRef.current = requestAnimationFrame(measureFPS);
    };

    // Función para medir memoria
    const measureMemory = () => {
      if (window.performance && (window.performance as any).memory) {
        const memoryMB = Math.round((window.performance as any).memory.usedJSHeapSize / (1024 * 1024));
        
        if (!memoryElement) {
          memoryElement = document.getElementById('memory-usage');
        }
        if (memoryElement) {
          memoryElement.textContent = `Memoria: ${memoryMB} MB`;
        }
      }
      
      timeoutIdRef.current = setTimeout(measureMemory, 1000);
    };

    // Configurar el observador de mutaciones
    observerRef.current = new MutationObserver(() => {
      renderCountRef.current++;
      
      if (!renderElement) {
        renderElement = document.getElementById('render-count');
      }
      if (renderElement) {
        renderElement.textContent = `Renderizados: ${renderCountRef.current}`;
      }
    });

    // Iniciar monitoreo
    const vectorgrid = document.querySelector('[aria-label="Animación de vectores"]');
    if (vectorgrid) {
      observerRef.current.observe(vectorgrid, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    // Iniciar mediciones
    rafIdRef.current = requestAnimationFrame(measureFPS);
    timeoutIdRef.current = setTimeout(measureMemory, 1000);

    // Limpieza al desmontar
    return () => {
      // Cancelar animación
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Limpiar timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      
      // Desconectar el observador
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // Solo se ejecuta una vez al montar

  return null; // Este hook no renderiza nada
};
