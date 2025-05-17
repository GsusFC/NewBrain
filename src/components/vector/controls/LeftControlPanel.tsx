'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { VectorGridProps, AnimationType, AnimationProps } from '../core/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from '@/components/ui/checkbox';
import { SliderWithInput } from "../controls/VectorControlComponents";
import { Separator } from '@/components/ui/separator';
import { debounce } from 'lodash';

interface LeftControlPanelProps {
  currentProps: VectorGridProps;
  onPropsChange: (newValues: Partial<VectorGridProps>) => void;
  onAnimationSettingsChange: (newAnimationSettings: Partial<Pick<VectorGridProps, 'animationType' | 'animationProps' | 'easingFactor' | 'timeScale' | 'dynamicLengthEnabled' | 'dynamicWidthEnabled' | 'dynamicIntensity' | 'isPaused'>>) => void;
  onTriggerPulse: () => void;
  onExportConfig?: () => void;
}

export const LeftControlPanel = React.memo(({ 
  currentProps, 
  onPropsChange,
  onAnimationSettingsChange, 
  onTriggerPulse, 
  onExportConfig 
}: LeftControlPanelProps) => {
  const { 
    animationType = 'none',
    easingFactor = 0.1, 
    timeScale = 1.0, 
    dynamicLengthEnabled = false, 
    dynamicWidthEnabled = false, 
    dynamicIntensity = 0.5
  } = currentProps;

  // Usar useRef para almacenar currentProps.animationProps y evitar recreación de callbacks
  const animationPropsRef = useRef(currentProps.animationProps || {});
  
  // Actualizar la ref solo cuando cambian las props externas
  useEffect(() => {
    animationPropsRef.current = currentProps.animationProps || {};
  }, [currentProps.animationProps]);

  const [localAnimationProps, setLocalAnimationProps] = useState(currentProps.animationProps || {});

  // Memorizar estos callbacks con dependencias mínimas para evitar recreaciones
  const handleAnimationPropChange = useCallback(<T extends keyof AnimationProps>(
    propName: T, 
    value: AnimationProps[T]
  ) => {
    const newAnimationProps = {
      ...animationPropsRef.current,
      [propName]: value,
    };
    onAnimationSettingsChange({ animationProps: newAnimationProps });
    setLocalAnimationProps(prev => ({...prev, [propName]: value}));
  }, [onAnimationSettingsChange]);

  const handleAnimationTypeChange = useCallback((value: AnimationType) => {
    // Import the default props for the selected animation type
    import('../core/animations/defaultProps').then(({ getDefaultPropsForType }) => {
      // Get the default props for the selected animation type
      const defaultProps = { ...getDefaultPropsForType(value) } as AnimationProps;
      
      // Update with the new animation type and default properties
      onAnimationSettingsChange({ 
        animationType: value,
        animationProps: defaultProps
      });
      
      // Also update the local state
      setLocalAnimationProps(defaultProps);
    });
  }, [onAnimationSettingsChange]);

  const debouncedAnimationPropChange = useMemo(
    () => debounce(
      <T extends keyof AnimationProps>(
        propName: T, 
        value: AnimationProps[T]
      ) => {
        const newAnimationProps = {
          ...animationPropsRef.current,
          [propName]: value,
        };
        onAnimationSettingsChange({ animationProps: newAnimationProps });
        setLocalAnimationProps(prev => ({...prev, [propName]: value}));
      },
      200
    ) as <T extends keyof AnimationProps>(
      propName: T, 
      value: AnimationProps[T]
    ) => void, 
    [onAnimationSettingsChange]
  );

  // Función para manejar el cambio de tipo de animación
  const handleTypeChange = useCallback((value: string) => {
    handleAnimationTypeChange(value as AnimationType);
  }, [handleAnimationTypeChange]);

  return (
    <div className="relative overflow-y-auto h-full custom-scrollbar" data-component-name="LeftControlPanel">
      <div className="p-4 space-y-6">
        <h3 className="text-xl font-semibold tracking-tight text-center">Animación y Efectos</h3>
        <Separator />

        {/* Tipo de Animación */}
        <div className="space-y-4">
          <h4 className="font-medium text-xs">Tipo de Animación</h4>
          <div className="relative">
            <select
              id="animationTypeSelect"
              value={animationType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring appearance-none"
            >
              <option value="none">Ninguna</option>
              <option value="smoothWaves">Ondas Suaves</option>
              <option value="seaWaves">Olas de Mar</option>
              <option value="lissajous">Lissajous</option>
              <option value="perlinFlow">Flujo Perlin</option>
              <option value="randomLoop">Bucle Aleatorio</option>
              <option value="centerPulse">Pulso Central</option>
              <option value="directionalFlow">Flujo Direccional</option>
              <option value="vortex">Vórtice</option>
              <option value="flocking">Agrupamiento</option>
              <option value="mouseInteraction">Interacción con Ratón</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Efectos Dinámicos */}
        <div className="space-y-4">
          <h4 className="font-medium text-xs">Efectos Dinámicos</h4>

          <div className="space-y-2">
            <Label htmlFor="easingFactorRange" className="text-xs font-medium">Suavizado</Label>
            <SliderWithInput
              id="easingFactorRange"
              value={[easingFactor]}
              min={0.01}
              max={1}
              step={0.01}
              precision={2}
              onValueChange={(val) => onAnimationSettingsChange({ easingFactor: val[0] })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeScaleRange" className="text-xs font-medium">Escala de Tiempo</Label>
            <SliderWithInput
              id="timeScaleRange"
              value={[timeScale]}
              min={0.1}
              max={5}
              step={0.1}
              precision={1}
              onValueChange={(val) => onAnimationSettingsChange({ timeScale: val[0] })}
            />
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="dynLen"
              checked={dynamicLengthEnabled}
              onCheckedChange={(c) => onAnimationSettingsChange({ dynamicLengthEnabled: !!c })}
            />
            <Label htmlFor="dynLen" className="text-xs font-medium">Longitud Dinámica</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dynWid"
              checked={dynamicWidthEnabled}
              onCheckedChange={(c) => onAnimationSettingsChange({ dynamicWidthEnabled: !!c })}
            />
            <Label htmlFor="dynWid" className="text-xs font-medium">Grosor Dinámico</Label>
          </div>

          {(dynamicLengthEnabled || dynamicWidthEnabled) && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="dynInt" className="text-xs font-medium">Intensidad Dinámica</Label>
              <SliderWithInput
                id="dynInt"
                value={[dynamicIntensity]}
                min={0}
                max={5}
                step={0.1}
                precision={1}
                onValueChange={(val) => onAnimationSettingsChange({ dynamicIntensity: val[0] })}
              />
            </div>
          )}
        </div>

        {/* Exportación */}
        <div className="space-y-4">
          <h4 className="font-medium text-xs">Exportación</h4>
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-muted"
              onClick={onExportConfig}
            >
              Exportar Configuración
            </Button>
            <Button className="w-full bg-muted" variant="outline">Descargar SVG Estático</Button>
            <Button className="w-full bg-muted" variant="outline">Descargar SVG Animado (Bucle)</Button>
          </div>
        </div>
      </div>
    </div>
  );
});

LeftControlPanel.displayName = 'LeftControlPanel';

export default LeftControlPanel;
