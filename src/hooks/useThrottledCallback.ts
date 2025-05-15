import { useRef, useCallback } from 'react';

/**
 * Hook personalizado que aplica throttle a una función callback
 * Limita la frecuencia con la que se ejecuta la función original
 * 
 * @param callback - Función original a la que se aplicará throttle
 * @param delay - Tiempo mínimo (en ms) entre ejecuciones consecutivas
 * @returns Función con throttle aplicado
 */
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T, 
  delay: number
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current > delay) {
      lastCall.current = now;
      callback(...args);
    }
  }, [callback, delay]);
}
