'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// Importamos dinámicamente el componente para garantizar renderizado en cliente
const VectorPlaygroundWithStore = dynamic(
  () => import('@/components/vector/VectorPlaygroundWithStore'),
  { ssr: false }
);

/**
 * Página para la nueva versión del VectorPlayground con arquitectura Zustand
 * Incluye herramientas de monitoreo de rendimiento para comparar con la versión original
 */
export default function NewPlaygroundPage() {
  // Inicializar el monitor de rendimiento
  usePerformanceMonitor();
  return (
    <>
      {/* Barra de navegación con comparación y enlaces */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            ← Volver
          </Link>
          <h1 className="text-lg font-semibold">
            VectorGrid 2.0 (Arquitectura Zustand)
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link 
            href="/vector-playground" 
            className="px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors text-sm"
          >
            Ver versión original
          </Link>
          
          <Link 
            href="/test-improved" 
            className="px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
          >
            Ver prueba técnica
          </Link>
          
          <div className="px-3 py-1.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded-md text-sm font-medium">
            Zustand + Hooks Selectores
          </div>
        </div>
      </div>

      {/* Espacio para compensar la barra fija */}
      <div className="h-[60px]"></div>

      {/* Componente principal */}
      <VectorPlaygroundWithStore />
      
      {/* Panel de rendimiento */}
      <div className="fixed bottom-4 left-4 p-3 bg-black/70 rounded text-white text-xs flex flex-col gap-1 max-w-[250px] backdrop-blur-sm border border-white/10">
        <div className="font-semibold text-blue-300">Monitor de Rendimiento</div>
        <div id="render-count">Renderizados: calculando...</div>
        <div id="fps-counter">FPS: midiendo...</div>
        <div id="memory-usage">Memoria: analizando...</div>
        <hr className="border-white/20 my-1" />
        <div className="text-green-300">Mejoras en esta versión:</div>
        <ul className="list-disc list-inside pl-2 text-[10px] opacity-80">
          <li>Eliminación de ciclos de renderizado</li>
          <li>Rendimiento optimizado con hooks selectores</li>
          <li>Flujo de datos unidireccional</li>
          <li>Estado centralizado con Zustand</li>
        </ul>
      </div>
      
      {/* El hook se llama al inicio del componente, no se renderiza nada */}
    </>
  );
}
