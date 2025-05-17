'use client';

import React, { useEffect, useRef } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  className = "fixed bottom-2 left-2 p-2 bg-black/80 rounded text-white text-xs flex flex-col space-y-1"
}) => {
  // Inicializar el monitor de rendimiento
  usePerformanceMonitor();
  
  const fpsRef = useRef<HTMLDivElement>(null);
  const fpsCounterRef = useRef<HTMLDivElement>(null);
  const memoryUsageRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef<HTMLDivElement>(null);
  
  // Actualizar referencias a los elementos del DOM
  useEffect(() => {
    fpsCounterRef.current = document.getElementById('fps-counter') as HTMLDivElement;
    memoryUsageRef.current = document.getElementById('memory-usage') as HTMLDivElement;
    renderCountRef.current = document.getElementById('render-count') as HTMLDivElement;
  }, []);
  
  // Cambiar el color del FPS basado en su valor
  useEffect(() => {
    if (!fpsRef.current || !fpsCounterRef.current) return;
    
    const fpsText = fpsCounterRef.current.textContent || '';
    const fpsMatch = fpsText.match(/FPS: (\d+)/);
    
    if (fpsMatch) {
      const fps = parseInt(fpsMatch[1], 10);
      
      if (fps < 30) {
        fpsRef.current.classList.add('text-red-400');
        fpsRef.current.classList.remove('text-green-400', 'text-yellow-400');
      } else if (fps < 50) {
        fpsRef.current.classList.add('text-yellow-400');
        fpsRef.current.classList.remove('text-green-400', 'text-red-400');
      } else {
        fpsRef.current.classList.add('text-green-400');
        fpsRef.current.classList.remove('text-yellow-400', 'text-red-400');
      }
    }
  }, [fpsCounterRef.current?.textContent]);

  return (
    <div className={className}>
      <div id="render-stats" ref={renderCountRef}>
        Renderizados: 0
      </div>
      <div id="fps-counter" ref={fpsRef}>
        FPS: 0
      </div>
      <div id="memory-usage" ref={memoryUsageRef}>
        Memoria: 0 MB
      </div>
    </div>
  );
};
