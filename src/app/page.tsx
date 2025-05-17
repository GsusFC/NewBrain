// src/app/page.tsx
'use client';

import dynamic from 'next/dynamic';

// Importamos VectorPlaygroundWithStore con SSR deshabilitado
const VectorPlaygroundWithStore = dynamic(
  () => import('@/components/vector/VectorPlaygroundWithStore').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Cargando VectorGrid Mejorado...</div>
      </div>
    )
  }
);

/**
 * Página principal con la implementación mejorada de VectorGrid
 * Utiliza Zustand para la gestión de estado global y mejor rendimiento
 */
export default function Page() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <VectorPlaygroundWithStore />
    </main>
  );
}
