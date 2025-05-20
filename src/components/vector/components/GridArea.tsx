'use client';

import React, { useCallback } from 'react';
import { VectorGrid } from '../VectorGrid';
import { useMouseInteraction } from '../store/improved/hooks';
import { ErrorBoundary } from 'react-error-boundary';
import type { GridSettings, VectorSettings, VectorGridRef } from '../core/types';

interface GridAreaProps {
  containerRef: React.RefObject<HTMLDivElement>;
  vectorGridRef: React.RefObject<VectorGridRef>;
  effectiveWidth: number;
  effectiveHeight: number;
  isRecalculating: boolean;
  fade: number;
  gridSettings: GridSettings;
  vectorSettings: VectorSettings;
  animationType: string;
  animationProps: any;
  isPaused: boolean;
  easingFactor: number;
  timeScale: number;
  dynamicLengthEnabled: boolean;
  dynamicWidthEnabled: boolean;
  dynamicIntensity: number;
  renderAsCanvas: boolean;
  onVectorClick?: (id: string) => void;
}

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center w-full h-full bg-black/70 text-red-500 p-4 text-sm">
    <div>
      <h3 className="font-medium mb-2">Error al renderizar grid:</h3>
      <p className="font-mono text-xs">{error.message}</p>
    </div>
  </div>
);

export const GridArea: React.FC<GridAreaProps> = ({
  containerRef,
  vectorGridRef,
  effectiveWidth,
  effectiveHeight,
  isRecalculating,
  fade,
  gridSettings,
  vectorSettings,
  animationType,
  animationProps,
  isPaused,
  easingFactor,
  timeScale,
  dynamicLengthEnabled,
  dynamicWidthEnabled,
  dynamicIntensity,
  renderAsCanvas,
  onVectorClick,
}) => {
  const { setMousePosition } = useMouseInteraction();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    },
    [containerRef, setMousePosition]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: null, y: null });
  }, [setMousePosition]);

  return (
    <div
      className="relative h-full w-full bg-slate-900 overflow-hidden flex items-center justify-center"
      ref={containerRef}
      style={{ opacity: fade, transition: 'opacity 0.3s ease-in-out' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Grid de vectores interactivo"
    >
      {isRecalculating && (
        <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono animate-pulse z-10">
          Recalculando grid...
        </div>
      )}
      
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <VectorGrid
          ref={vectorGridRef}
          width={effectiveWidth}
          height={effectiveHeight}
          backgroundColor="#1a1a1a"
          onVectorClick={onVectorClick}
          gridSettings={gridSettings}
          vectorSettings={{
            ...vectorSettings,
            vectorColor: "#cccccc" // Aumentar contraste (antes #737373)
          }}
          animationType={animationType}
          animationProps={animationProps}
          isPaused={isPaused}
          easingFactor={easingFactor}
          timeScale={timeScale}
          dynamicLengthEnabled={dynamicLengthEnabled}
          dynamicWidthEnabled={dynamicWidthEnabled}
          dynamicIntensity={dynamicIntensity}
          renderAsCanvas={renderAsCanvas}
          debugMode={process.env.NODE_ENV === 'development'}
          cullingEnabled={true} // Habilitar culling para optimización
        />
      </ErrorBoundary>
    </div>
  );
};
