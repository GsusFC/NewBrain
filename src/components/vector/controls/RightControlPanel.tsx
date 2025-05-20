// Panel ultra minimalista
'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useGridSettings, useVectorSettings } from '../store/improved/hooks';

/**
 * Panel extremadamente simple sin SliderWithInput para evitar problemas
 */
export const RightControlPanel = () => {
  // Estado global
  const { gridSettings, setGridSettings } = useGridSettings();
  const { vectorSettings, setVectorSettings } = useVectorSettings();
  
  // Al menos estos controles simples deberían funcionar
  return (
    <div className="p-6 space-y-6 bg-card">
      <div>
        <h2 className="text-xl font-bold mb-4">Panel ultra minimalista</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Esta versión usa solo controles primitivos para asegurar su funcionamiento.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Filas</Label>
          <Input 
            type="number"
            value={gridSettings?.rows || 10}
            onChange={e => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                setGridSettings({ ...gridSettings, rows: value });
              }
            }}
            min={1}
            max={50}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Columnas</Label>
          <Input 
            type="number"
            value={gridSettings?.cols || 10}
            onChange={e => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                setGridSettings({ ...gridSettings, cols: value });
              }
            }}
            min={1}
            max={50}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Longitud del vector</Label>
          <Input 
            type="number"
            value={typeof vectorSettings?.vectorLength === 'number' ? vectorSettings.vectorLength : 30}
            onChange={e => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                setVectorSettings({ ...vectorSettings, vectorLength: value });
              }
            }}
            min={1}
            max={600}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Ancho del vector</Label>
          <Input 
            type="number"
            value={typeof vectorSettings?.vectorWidth === 'number' ? vectorSettings.vectorWidth : 2}
            step={0.5}
            onChange={e => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                setVectorSettings({ ...vectorSettings, vectorWidth: value });
              }
            }}
            min={0.5}
            max={20}
          />
        </div>
      </div>
    </div>
  );
};

export default RightControlPanel;