'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRenderSettings, useAnimationSettings } from '../store/improved/hooks';
import { Button } from '@/components/ui/button';
import { PauseIcon, PlayIcon } from '@radix-ui/react-icons';

interface TopMenuProps {
  effectiveWidth: number;
}

export const TopMenu: React.FC<TopMenuProps> = ({ effectiveWidth }) => {
  // Usar setRenderAsCanvas para intentar cambiar (aunque ignorará cualquier intentos de cambiar a true)
  const { renderAsCanvas, setRenderAsCanvas, throttleMs } = useRenderSettings();
  const { isPaused, togglePause } = useAnimationSettings();

  return (
    <div 
      className="flex justify-between items-center w-full p-2 bg-muted/90 rounded-md mb-2"
      style={{ maxWidth: effectiveWidth }}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 relative group">
          <Switch 
            checked={false} 
            onChange={() => {}} 
            id="canvas-mode"
            disabled={true}
            aria-disabled="true"
          />
          <Label htmlFor="canvas-mode" className="text-xs font-medium line-through opacity-50">Modo Canvas</Label>
          <div className="absolute -top-8 left-0 bg-muted/95 text-primary-foreground text-xs p-1 rounded hidden group-hover:block z-10 w-48">
            Solo SVG disponible. El renderizador Canvas ha sido desactivado.
          </div>
        </div>

        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePause}
            title={isPaused ? "Reproducir" : "Pausar"}
            className="h-8 w-8"
            aria-label={isPaused ? "Reproducir animación" : "Pausar animación"}
          >
            {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center">
        <div className="text-xs">
          {throttleMs ? `${(1000 / throttleMs).toFixed(1)} FPS` : '60 FPS'}
        </div>
      </div>
    </div>
  );
};
