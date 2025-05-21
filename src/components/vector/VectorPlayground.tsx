// Mock para mantener compatibilidad y redireccionar hacia VectorPlaygroundWithStore
'use client';

import React from 'react';
import { VectorPlaygroundWithStore } from './VectorPlaygroundWithStore';

/**
 * @deprecated Use VectorPlaygroundWithStore component instead.
 * Este es un componente legacy para mantener retrocompatibilidad.
 */
export const VectorPlayground = (props: any) => {
  console.warn(
    'DEPRECATED: VectorPlayground has been replaced by VectorPlaygroundWithStore. ' +
    'Este es un mock para mantener compatibilidad.'
  );
  
  return <VectorPlaygroundWithStore {...props} />;
};

export default VectorPlayground;