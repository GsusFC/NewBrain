'use client';

import React, { useState } from 'react';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { Label } from '@/components/ui/label';

/**
 * Componente de prueba para verificar el funcionamiento de SliderWithInput
 * en un entorno controlado y simple.
 */
export function TestSlider() {
  // Estado interno para el slider
  const [sliderValue, setSliderValue] = useState<number[]>([50]);
  
  // Función para manejar cambios en el slider
  const handleSliderChange = (newValues: number[]) => {
    console.log('Slider cambió a:', newValues);
    setSliderValue(newValues);
  };
  
  return (
    <div className="p-6 space-y-8 max-w-md mx-auto">
      <div>
        <h2 className="text-xl font-bold mb-4">Test Slider</h2>
        <p className="text-sm text-gray-500 mb-6">
          Este es un slider de prueba para diagnosticar problemas.
          Valor actual: {sliderValue[0]}
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Slider de prueba</Label>
            <SliderWithInput
              value={sliderValue}
              onValueChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              precision={0}
              className="w-full"
            />
          </div>
          
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                currentValue: sliderValue,
                type: typeof sliderValue,
                isArray: Array.isArray(sliderValue)
              }, null, 2)}
            </pre>
          </div>
          
          <button 
            onClick={() => setSliderValue([75])}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Establecer a 75
          </button>
        </div>
      </div>
    </div>
  );
}
