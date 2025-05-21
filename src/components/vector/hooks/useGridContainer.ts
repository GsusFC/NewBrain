import { useState, useRef, useEffect, useCallback } from 'react';

export function useGridContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateOptimalGrid = useCallback((aspectRatio: string, spacing: number, customRatio?: { width: number; height: number }) => {
    if (!containerRef.current) return { rows: 10, cols: 10 };

    const container = containerRef.current.getBoundingClientRect();
    const { width, height } = container;
    let targetCols = 10;
    let targetRows = 10;

    // Lu00f3gica de cu00e1lculo basada en el aspect ratio
    switch (aspectRatio) {
      case '1:1': {
        const size = Math.min(width, height) * 0.9; // 90% del tamau00f1o disponible
        targetCols = Math.floor(size / spacing);
        targetRows = targetCols;
        break;
      }
      case '16:9': {
        const targetHeight = (width * 9) / 16;
        if (targetHeight > height * 0.9) {
          const newWidth = (height * 16) / 9 * 0.9;
          targetCols = Math.floor(newWidth / spacing);
        } else {
          targetCols = Math.floor((width * 0.9) / spacing);
        }
        targetRows = Math.floor((targetCols * 9) / 16);
        break;
      }
      case 'custom': {
        if (customRatio) {
          const ratio = customRatio.width / customRatio.height;
          const containerRatio = width / height;
          
          if (ratio > containerRatio) {
            // Limitado por ancho
            targetCols = Math.floor((width * 0.9) / spacing);
            targetRows = Math.floor(targetCols / ratio);
          } else {
            // Limitado por alto
            targetRows = Math.floor((height * 0.9) / spacing);
            targetCols = Math.floor(targetRows * ratio);
          }
        }
        break;
      }
      default: // 'auto'
        targetCols = Math.floor((width * 0.9) / spacing);
        targetRows = Math.floor((height * 0.9) / spacing);
    }

    // Asegurar valores mu00ednimos
    targetCols = Math.max(1, targetCols);
    targetRows = Math.max(1, targetRows);

    return { rows: targetRows, cols: targetCols };
  }, []);

  // Efecto para manejar el redimensionamiento
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Actualizar tamau00f1o inicial
    updateSize();

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return {
    containerRef,
    containerSize,
    calculateOptimalGrid,
    isCalculating
  };
}