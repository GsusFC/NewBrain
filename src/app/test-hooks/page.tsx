'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Importamos dinámicamente nuestro componente para asegurar que solo se renderiza en el cliente
const VectorGridWithHooks = dynamic(
  () => import('@/components/vector/examples/VectorGridWithHooks'),
  { ssr: false }
);

/**
 * Página de prueba para validar la implementación con hooks selectores
 * Esta página permite probar la arquitectura optimizada con Zustand
 * y verificar que se han resuelto los problemas de ciclos de renderizado.
 */
export default function TestHooksPage() {
  return (
    <>
      {/* Barra de navegación para volver a la página principal */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center px-3 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            ← Volver
          </Link>
          <h1 className="text-lg font-semibold">
            VectorGrid con Hooks Selectores (Prueba)
          </h1>
        </div>
        
        <div className="text-sm bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">
          Versión optimizada con arquitectura de selectores
        </div>
      </div>

      {/* Espacio para compensar la barra fija */}
      <div className="h-12"></div>

      {/* Renderizamos el componente de prueba */}
      <VectorGridWithHooks />

      {/* Herramientas de depuración */}
      <div className="fixed bottom-2 left-2 p-2 bg-black/80 rounded text-white text-xs flex flex-col space-y-1">
        <div id="render-stats">Renders: inicializando...</div>
        <div id="fps-counter">FPS: calculando...</div>
        <div id="memory-usage">Memoria: midiendo...</div>
      </div>
      
      {/* Script para monitorear el rendimiento */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Monitoreo de rendimiento
            let renderCount = 0;
            let lastFrameTime = performance.now();
            let frames = 0;
            let fps = 0;
            
            // Elementos de UI para mostrar estadísticas
            const renderStats = document.getElementById('render-stats');
            const fpsCounter = document.getElementById('fps-counter');
            const memoryUsage = document.getElementById('memory-usage');
            
            // Función para actualizar estadísticas
            function updateStats() {
              if (renderStats) renderStats.textContent = 'Renders: ' + renderCount;
              if (fpsCounter) fpsCounter.textContent = 'FPS: ' + fps.toFixed(1);
              if (memoryUsage && performance.memory) {
                const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                memoryUsage.textContent = 'Memoria: ' + memoryMB.toFixed(1) + ' MB';
              }
              requestAnimationFrame(updateStats);
            }
            
            // Iniciar monitoreo de FPS
            function measureFPS(timestamp) {
              frames++;
              const elapsed = timestamp - lastFrameTime;
              
              if (elapsed >= 1000) {
                fps = frames * 1000 / elapsed;
                frames = 0;
                lastFrameTime = timestamp;
              }
              
              requestAnimationFrame(measureFPS);
            }
            
            // Crear un MutationObserver para detectar renderizados
            const observer = new MutationObserver(() => {
              renderCount++;
            });
            
            // Iniciar observación después de cargar la página
            window.addEventListener('load', () => {
              const vectorGrid = document.querySelector('[aria-label="Animación de vectores"]');
              if (vectorGrid) {
                observer.observe(vectorGrid, { 
                  childList: true, 
                  subtree: true,
                  attributes: true
                });
              }
              
              requestAnimationFrame(updateStats);
              requestAnimationFrame(measureFPS);
            });
          `,
        }}
      />
    </>
  );
}
