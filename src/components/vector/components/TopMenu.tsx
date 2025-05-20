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
  const { renderAsCanvas, setRenderAsCanvas, throttleMs } = useRenderSettings();
  const { isPaused, togglePause } = useAnimationSettings();

  return (
    <div 
      className="flex justify-between items-center w-full p-2 bg-black/50 rounded-md mb-2"
      style={{ maxWidth: effectiveWidth }}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={renderAsCanvas} 
            onCheckedChange={setRenderAsCanvas} 
            id="canvas-mode"
          />
          <Label htmlFor="canvas-mode">Modo Canvas</Label>
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
