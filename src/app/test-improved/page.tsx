'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';

// Importamos dinámicamente nuestro componente para asegurar que solo se renderiza en el cliente
const VectorGridWithImproved = dynamic(
  () => import('@/components/vector/examples/VectorGridWithImproved'),
  { ssr: false }
);

/**
 * Página de prueba para validar la implementación con arquitectura mejorada de Zustand
 * Esta página incluye herramientas de depuración para monitorear el rendimiento
 */
export default function TestImprovedPage() {
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
            VectorGrid con Arquitectura Mejorada
          </h1>
        </div>
        
        <div className="text-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
          Versión estable con arquitectura optimizada de selectores
        </div>
      </div>

      {/* Espacio para compensar la barra fija */}
      <div className="h-12"></div>

      {/* Renderizamos el componente de prueba */}
      <VectorGridWithImproved />

      {/* Monitor de rendimiento usando el componente React */}
      <PerformanceMonitor selector="[aria-label='Animación de vectores']" />
    </>
  );
}
