// Mock para mantener compatibilidad con LeftControlPanel
'use client';

import React from 'react';
import { LeftControlPanelWithStore } from './LeftControlPanelWithStore';

/**
 * @deprecated Use LeftControlPanelWithStore instead.
 */
export const LeftControlPanel = (props: any) => {
  console.warn(
    'DEPRECATED: LeftControlPanel ha sido reemplazado por LeftControlPanelWithStore. ' +
    'Este es un mock para mantener compatibilidad.'
  );
  
  return <LeftControlPanelWithStore />;
};

export default LeftControlPanel;