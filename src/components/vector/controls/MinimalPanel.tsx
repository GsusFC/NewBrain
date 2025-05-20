'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { ButtonGroup } from '@/components/ui/button-group';
import { useGridSettings, useVectorSettings } from '../store/improved/hooks';
import { VectorShape } from '../core/types';

/**
 * Panel derecho absolutamente mínimo usando los mismos componentes que el original
 */
export function MinimalPanel() {
  // Hooks para estado
  const { gridSettings, setGridSettings } = useGridSettings();
  const { vectorSettings, setVectorSettings } = useVectorSettings();
  
  // Control de filas simplificado
  const handleRowsChange = (newRows: number) => {
    setGridSettings({
      ...gridSettings,
      rows: newRows
    });
  };
  
  // Control de vector length simplificado
  const handleVectorLengthChange = (values: number[]) => {
    if (values && values.length > 0) {
      setVectorSettings({
        ...vectorSettings,
        vectorLength: values[0]
      });
    }
  };
  
  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Panel Minimal</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Esta es una versión absolutamente minimal para probar soluciones.
        </p>
      </div>
      
      <div className="space-y-4 p-4 bg-slate-800/20 rounded-lg">
        <Label>Filas</Label>
        <Input
          type="number"
          value={gridSettings?.rows || 10}
          onChange={(e) => handleRowsChange(parseInt(e.target.value) || 10)}
          min={1}
          max={50}
          className="w-full"
        />
        
        <Separator className="my-4" />
        
        <Label>Longitud del Vector</Label>
        <SliderWithInput
          value={[typeof vectorSettings?.vectorLength === 'number' ? vectorSettings.vectorLength : 30]}
          onValueChange={handleVectorLengthChange}
          min={1}
          max={600}
          step={1}
          precision={0}
        />
        
        <Separator className="my-4" />
        
        <Label>Forma del Vector</Label>
        <ButtonGroup
          options={[
            { label: 'Línea', value: 'line' },
            { label: 'Flecha', value: 'arrow' },
            { label: 'Punto', value: 'dot' }
          ]}
          value={vectorSettings?.vectorShape || 'arrow'}
          onChange={(value) => setVectorSettings({ 
            ...vectorSettings, 
            vectorShape: value as VectorShape 
          })}
        />
      </div>
    </div>
  );
}
