// Mock para mantener compatibilidad con el contexto antiguo
import React, { createContext, useContext } from 'react';

// Contexto por defecto para compatibilidad
const defaultContext = {
  settings: {},
  updateSettings: () => {},
  resetSettings: () => {}
};

// Crear el contexto
const VectorControlContext = createContext(defaultContext);

/**
 * @deprecated Use los hooks de Zustand en vez de este contexto.
 */
export function useVectorControl() {
  console.warn(
    'DEPRECATED: useVectorControl ha sido reemplazado por useVectorGridStore. ' +
    'Este es un mock para mantener compatibilidad.'
  );
  
  return useContext(VectorControlContext);
}

/**
 * @deprecated Use los componentes que utilizan el store en lugar de este provider.
 */
export const VectorControlProvider = ({ children }: { children: React.ReactNode }) => {
  console.warn(
    'DEPRECATED: VectorControlProvider ha sido reemplazado por componentes que usan useVectorGridStore. ' +
    'Este es un mock para mantener compatibilidad.'
  );
  
  return (
    <VectorControlContext.Provider value={defaultContext}>
      {children}
    </VectorControlContext.Provider>
  );
};