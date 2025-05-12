'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VectorColorValue } from '@/components/vector/core/types';

interface SimpleColorControlProps {
  value: VectorColorValue;
  onChange: (value: VectorColorValue) => void;
  disabled?: boolean;
}

/**
 * Versión simplificada del selector de color que muestra opciones directamente
 */
export function SimpleColorControl({ 
  value, 
  onChange, 
  disabled = false 
}: SimpleColorControlProps) {
  const isFunction = typeof value === 'function';
  const effectiveValue = isFunction ? '#4a80f5' : value;
  
  const isGradient = typeof effectiveValue !== 'string';
  
  // Estado para el color sólido
  const [solidColor, setSolidColor] = useState(
    typeof effectiveValue === 'string' ? effectiveValue : '#4a80f5'
  );
  
  // Colores predefinidos para selección rápida
  const presetColors = [
    '#4a80f5', // Azul (color por defecto)
    '#f54a80', // Rosa
    '#4af580', // Verde menta
    '#f5804a', // Naranja
    '#804af5', // Púrpura
    '#f5f54a', // Amarillo
    '#4af5f5', // Cian
    '#ffffff', // Blanco
    '#000000', // Negro
  ];
  
  // Manejar cambio de color
  const handleColorChange = useCallback((color: string) => {
    setSolidColor(color);
    onChange(color);
  }, [onChange]);

  // Estilo para preview del color actual
  const colorPreviewStyle = {
    backgroundColor: typeof effectiveValue === 'string' ? effectiveValue : 'linear-gradient(to right, #f00, #00f)'
  };

  return (
    <div className="space-y-2">
      {/* Entrada y previsualización de color */}
      <div className="flex gap-2 items-center">
        <div 
          className="w-8 h-8 rounded border border-border shadow-inner" 
          style={colorPreviewStyle}
        />
        
        <Input
          type="text"
          value={typeof effectiveValue === 'string' ? effectiveValue : 'Gradiente'}
          onChange={(e) => {
            if (!isGradient) {
              handleColorChange(e.target.value);
            }
          }}
          className="flex-1 font-mono text-xs"
          disabled={disabled || isGradient}
        />

        {!isGradient && (
          <div className="w-8 h-8 overflow-hidden rounded border">
            <input 
              type="color"
              value={solidColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-12 cursor-pointer"
              style={{ margin: '-2px 0 0 -2px' }}
              disabled={disabled}
            />
          </div>
        )}
      </div>
      
      {/* Colores rápidos */}
      <div className="flex flex-wrap gap-1">
        {presetColors.map((color, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleColorChange(color)}
            className="w-6 h-6 rounded-md border border-input hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            aria-label={`Seleccionar ${color}`}
            disabled={disabled}
          />
        ))}
      </div>
      
      {isGradient && (
        <div className="text-xs text-center text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onChange('#4a80f5')}
            disabled={disabled}
          >
            Convertir a color sólido
          </Button>
        </div>
      )}
    </div>
  );
}
