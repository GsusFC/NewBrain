'use client';

import React from 'react';
import Link from 'next/link';
import VectorPlaygroundWithStore from '@/components/vector/VectorPlaygroundWithStore';

/**
 * Página para probar la implementación con arquitectura mejorada de centrado
 */
export default function ImprovedGridPage() {
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
            VectorGrid con Centrado Mejorado
          </h1>
        </div>
        
        <div className="text-sm bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">
          Nueva arquitectura de centrado preciso
        </div>
      </div>

      {/* Espacio para compensar la barra fija */}
      <div className="h-12"></div>

      {/* Renderizamos el componente mejorado */}
      <VectorPlaygroundWithStore />
    </>
  );
}
