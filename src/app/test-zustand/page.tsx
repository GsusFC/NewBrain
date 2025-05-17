'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Importamos dinámicamente nuestro componente para asegurar que solo se renderiza en el cliente
const VectorGridWithZustand = dynamic(
  () => import('@/components/vector/examples/VectorGridWithZustand'),
  { ssr: false }
);

/**
 * Página de prueba para validar la implementación de Zustand
 * Esta página permite probar la nueva arquitectura de forma aislada
 * y compararla con la implementación original.
 */
export default function TestZustandPage() {
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
            VectorGrid con Zustand (Prueba)
          </h1>
        </div>
        
        <div className="text-sm bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">
          Versión estable con arquitectura mejorada
        </div>
      </div>

      {/* Espacio para compensar la barra fija */}
      <div className="h-12"></div>

      {/* Renderizamos el componente de prueba */}
      <VectorGridWithZustand />

      {/* Contador de renderizados (para depuración) */}
      <div id="render-counter" className="fixed bottom-2 right-2 text-xs bg-black/80 text-white px-2 py-1 rounded">
        Renderizados: inicializando...
      </div>
      
      {/* Script de seguimiento de renderizados */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Script para contar renderizados
            let renderCount = 0;
            const counter = document.getElementById('render-counter');
            
            // Crear un MutationObserver para detectar cambios en el DOM
            const observer = new MutationObserver(() => {
              renderCount++;
              if (counter) {
                counter.textContent = 'Renderizados: ' + renderCount;
              }
            });
            
            // Iniciar observación después de cargar la página
            window.addEventListener('load', () => {
              const vectorGrid = document.querySelector('[aria-label="Animación de vectores"]');
              if (vectorGrid && counter) {
                observer.observe(vectorGrid, { 
                  childList: true,
                  subtree: true,
                  attributes: true
                });
                counter.textContent = 'Renderizados: 0';
              }
            });
          `,
        }}
      />
    </>
  );
}
