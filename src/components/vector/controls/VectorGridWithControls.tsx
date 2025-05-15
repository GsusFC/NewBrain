'use client';

import React, { useMemo } from 'react';
import { VectorGrid } from '../VectorGrid';
import type { VectorGridProps } from '../core/types';
import { VectorControlPanel } from './VectorControlPanel';
import { VectorControlProvider, useVectorControl } from './VectorControlContext';

// Componente interno que conecta el control y el grid
const VectorGridConnected = React.memo(function VectorGridConnected(props: Omit<VectorGridProps, 'baseVectorLength' | 'baseVectorWidth' | 'baseVectorColor' | 'baseVectorShape' | 'baseStrokeLinecap' | 'baseRotationOrigin' | 'debugMode' | 'interactionEnabled' | 'cullingEnabled'>) {
  const { settings } = useVectorControl();
  
  // Usar useMemo para las props derivadas
  const gridProps = useMemo(() => ({
    ...props,
    baseVectorLength: settings.baseLength,
    baseVectorWidth: settings.baseWidth,
    baseVectorColor: settings.color,
    baseVectorShape: settings.shape,
    baseStrokeLinecap: settings.strokeLinecap,
    baseRotationOrigin: settings.rotationOrigin,
    debugMode: settings.debugMode,
    interactionEnabled: settings.interactionEnabled,
    cullingEnabled: settings.cullingEnabled
  }), [props, settings]);
  
  return <VectorGrid {...gridProps} />;
});

// Componente principal que combina el panel de control y el grid
export function VectorGridWithControls(props: Omit<VectorGridProps, 'baseVectorLength' | 'baseVectorWidth' | 'baseVectorColor' | 'baseVectorShape' | 'baseStrokeLinecap' | 'baseRotationOrigin' | 'debugMode' | 'interactionEnabled' | 'cullingEnabled'>) {
  return (
    <VectorControlProvider>
      <div className="flex h-full w-full bg-background">
        <VectorControlPanel />
        <div className="flex-1 overflow-hidden">
          <VectorGridConnected {...props} />
        </div>
      </div>
    </VectorControlProvider>
  );
}
