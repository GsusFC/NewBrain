// Mock para mantener compatibilidad con useGridContainer
// Redirige al nuevo hook en la ubicaciu00f3n actual
import { useRef } from 'react';

/**
 * @deprecated Este hook ha sido movido a src/components/vector/core/hooks/useGridContainer.ts
 */
export function useGridContainer() {
  console.warn(
    'DEPRECATED: useGridContainer ha sido movido a /components/vector/core/hooks/useGridContainer.ts' +
    'Este es un mock para mantener compatibilidad.'
  );
  
  return {
    containerRef: useRef(null),
    dimensions: { width: 0, height: 0 }
  };
}