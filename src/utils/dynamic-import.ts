/**
 * Utilidades para gestionar importaciones dinámicas seguras
 * Evita problemas de hidratación al estandarizar cómo se importan los componentes
 */

import dynamic from 'next/dynamic';
import type { ComponentType, ReactNode } from 'react';
import type { DynamicOptions, Loader, LoaderMap, LoadableGeneratedOptions } from 'next/dynamic';

/**
 * Crea una importación dinámica con SSR deshabilitado
 * Garantiza que el componente sólo se renderice en el cliente
 * 
 * @param importFn - Función que importa el componente
 * @param options - Opciones adicionales para dynamic import
 * @returns Componente dinámico
 */
export function createClientComponent<P>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    loading?: () => ReactNode;
    ssr?: boolean;
    suspense?: boolean;
  } = {}
) {
  return dynamic(importFn, {
    ssr: false, // Siempre false para evitar problemas de hidratación
    ...options,
  } as DynamicOptions<P>);
}

/**
 * Helper que envuelve componentes en la importación dinámica segura
 * Para usarse en páginas que requieren cálculos matemáticos precisos
 * 
 * @example
 * ```tsx
 * const SafeVectorGrid = importSafely(() => import('@/components/vector/VectorGrid'));
 * ```
 */
export function importSafely<P>(importFn: () => Promise<{ default: ComponentType<P> }>) {
  return createClientComponent(importFn);
}
