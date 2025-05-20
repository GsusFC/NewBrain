'use client';

import React from 'react';

interface DebugOverlayProps {
  containerWidth: number;
  containerHeight: number;
  animationType: string;
  throttleMs: number;
  isPaused: boolean;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  containerWidth,
  containerHeight,
  animationType,
  throttleMs,
  isPaused
}) => {
  // Solo renderizar en modo desarrollo
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-2 right-2 text-xs bg-black/80 text-white px-2 py-1 rounded pointer-events-none">
      <div>Contenedor: {Math.round(containerWidth)}×{Math.round(containerHeight)}</div>
      <div>Animación: {animationType}</div>
      <div>FPS: {throttleMs ? (1000 / throttleMs).toFixed(1) : '60'}</div>
      <div>Estado: {isPaused ? 'Pausado' : 'Reproduciendo'}</div>
    </div>
  );
};
