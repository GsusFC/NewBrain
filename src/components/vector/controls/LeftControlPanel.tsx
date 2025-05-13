// src/components/vector/controls/LeftControlPanel.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { VectorGridProps, AnimationType, AnimationProps } from '../core/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SliderWithInput } from "@/components/ui/slider-with-input";
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { debounce } from 'lodash';

interface LeftControlPanelProps {
  currentProps: VectorGridProps;
  onPropsChange: (newValues: Partial<VectorGridProps>) => void;
  onAnimationSettingsChange: (newAnimationSettings: Partial<Pick<VectorGridProps, 'animationType' | 'animationProps' | 'easingFactor' | 'timeScale' | 'dynamicLengthEnabled' | 'dynamicWidthEnabled' | 'dynamicIntensity' | 'isPaused'>>) => void;
  onTriggerPulse: () => void;
  onExportConfig?: () => void; // Opcional por si aún no se implementa
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({ 
  currentProps, 
  onPropsChange, 
  onAnimationSettingsChange, 
  onTriggerPulse, 
  onExportConfig 
}) => {
  const { animationType, easingFactor, timeScale, dynamicLengthEnabled, dynamicWidthEnabled, dynamicIntensity } = currentProps;

  const [localAnimationProps, setLocalAnimationProps] = useState(currentProps.animationProps || {});

  const handleAnimationPropChange = useCallback((propName: keyof AnimationProps, value: number) => {
    const newAnimationProps = {
      ...(currentProps.animationProps || {}), 
      [propName]: value,
    };
    onAnimationSettingsChange({ animationProps: newAnimationProps });
    setLocalAnimationProps(prev => ({...prev, ...newAnimationProps})); 
  }, [currentProps.animationProps, onAnimationSettingsChange]);

  const handleAnimationTypeChange = useCallback((value: AnimationType) => {
    onAnimationSettingsChange({ animationType: value });
  }, [onAnimationSettingsChange]);

  const debouncedAnimationPropChange = useMemo(
    () => debounce(handleAnimationPropChange, 200), 
    [handleAnimationPropChange]
  );

  const waveFrequency = localAnimationProps.waveFrequency ?? currentProps.animationProps?.waveFrequency ?? 0.00025;
  const waveAmplitude = localAnimationProps.waveAmplitude ?? currentProps.animationProps?.waveAmplitude ?? 30;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <h3 className="text-xl font-semibold tracking-tight text-center">Animación y Efectos</h3>
        <Separator />

        {/* Tipo de Animación */}
        <div className="space-y-4">
          <h4 className="font-medium text-base">Tipo de Animación</h4>
          <Select
            value={animationType}
            onValueChange={(value) => handleAnimationTypeChange(value as AnimationType)}
          >
            <SelectTrigger id="animationTypeSelect"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguna</SelectItem>
              <SelectItem value="smoothWaves">Olas Suaves</SelectItem>
              <SelectItem value="mouseInteraction">Interacción Ratón</SelectItem>
              <SelectItem value="centerPulse">Pulso Central</SelectItem>
              <SelectItem value="tangenteClasica">Tangente Clásica</SelectItem>
              {/* ... más tipos ... */}
            </SelectContent>
          </Select>
        </div>

        {/* Parámetros de Animación - Solo se muestran cuando hay parámetros disponibles */}
        {animationType !== 'none' && ([
          'smoothWaves', 'centerPulse', 'mouseInteraction'
        ].includes(animationType) || 
          (currentProps.animationProps && Object.keys(currentProps.animationProps).length > 0)) && (
          <div className="space-y-4">
            <h4 className="font-medium text-base">Parámetros de Animación</h4>
            
            {/* Parámetros de Olas Suaves */}
            {animationType === 'smoothWaves' && (
              <div className="space-y-3 border border-slate-700 rounded-md p-3">
                <h5 className="text-sm font-medium text-slate-300">Olas Suaves</h5>
                <div className="space-y-2">
                  <Label htmlFor="waveFreqRange">Frecuencia</Label>
                  <SliderWithInput
                    id="waveFreqRange"
                    min={0.00001}
                    max={0.0005}
                    step={0.00001}
                    precision={5}
                    value={[waveFrequency]}
                    onValueChange={(val) => debouncedAnimationPropChange('waveFrequency', val[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waveAmpRange">Amplitud</Label>
                  <SliderWithInput
                    id="waveAmpRange"
                    min={1}
                    max={180}
                    step={1}
                    precision={0}
                    value={[waveAmplitude]} 
                    onValueChange={(val) => debouncedAnimationPropChange('waveAmplitude', val[0])}
                  />
                </div>
                {/* Otros parámetros de Olas Suaves */}
              </div>
            )}
            
            {/* Parámetros de Pulso Central */}
            {animationType === 'centerPulse' && (
              <div className="space-y-3 border border-slate-700 rounded-md p-3">
                <h5 className="text-sm font-medium text-slate-300">Pulso Central</h5>
                <Button 
                  onClick={onTriggerPulse} 
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                >
                  Disparar Pulso
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="pulseDur">
                    Duración (ms)
                  </Label>
                  <SliderWithInput 
                    id="pulseDur" 
                    defaultValue={[currentProps.animationProps?.pulse?.pulseDuration || 1000]} 
                    min={100} 
                    max={5000} 
                    step={50} 
                    precision={0}
                    onValueChange={val => onPropsChange({
                      animationProps: {
                        ...currentProps.animationProps, 
                        pulse: { 
                          ...currentProps.animationProps?.pulse, 
                          pulseDuration: val[0]
                        }
                      }
                    })} 
                  />
                </div>
                {/* Otros parámetros de Pulso Central */}
              </div>
            )}
            
            {/* Parámetros de Interacción con Ratón */}
            {animationType === 'mouseInteraction' && (
              <div className="space-y-3 border border-slate-700 rounded-md p-3">
                <h5 className="text-sm font-medium text-slate-300">Interacción con Ratón</h5>
                
                {/* Radio de interacción */}
                <div className="space-y-2">
                  <Label htmlFor="interactionRadius">
                    Radio de interacción (px)
                  </Label>
                  <SliderWithInput 
                    id="interactionRadius" 
                    value={[(currentProps.animationProps?.interactionRadius as number | undefined) ?? 150]} 
                    min={50} 
                    max={300} 
                    step={5} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('interactionRadius', val[0])} 
                  />
                </div>
                
                {/* Tipo de efecto */}
                <div className="space-y-2">
                  <Label htmlFor="effectType">Tipo de efecto</Label>
                  <Select 
                    value={(currentProps.animationProps?.effectType as string | undefined) ?? 'attract'}
                    onValueChange={(value) => onPropsChange({
                      animationProps: {
                        ...currentProps.animationProps,
                        effectType: value
                      }
                    })}
                  >
                    <SelectTrigger id="effectType">
                      <SelectValue placeholder="Selecciona efecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attract">Atracción</SelectItem>
                      <SelectItem value="repel">Repulsión</SelectItem>
                      <SelectItem value="align">Alineación</SelectItem>
                      <SelectItem value="swirl">Remolino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Intensidad del efecto */}
                <div className="space-y-2">
                  <Label htmlFor="effectStrength">
                    Intensidad
                  </Label>
                  <SliderWithInput 
                    id="effectStrength" 
                    value={[(currentProps.animationProps?.effectStrength as number | undefined) ?? 1]} 
                    min={0.1} 
                    max={3} 
                    step={0.1} 
                    precision={1}
                    onValueChange={(val) => debouncedAnimationPropChange('effectStrength', val[0])} 
                  />
                </div>
                
                {/* Factor de disminución */}
                <div className="space-y-2">
                  <Label htmlFor="falloffFactor">
                    Disminución gradual
                  </Label>
                  <SliderWithInput 
                    id="falloffFactor" 
                    value={[(currentProps.animationProps?.falloffFactor as number | undefined) ?? 1]} 
                    min={0.5} 
                    max={3} 
                    step={0.1} 
                    precision={1}
                    onValueChange={(val) => debouncedAnimationPropChange('falloffFactor', val[0])} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Efectos Dinámicos Generales */}
        <div className="space-y-4">
          <h4 className="font-medium text-base">Efectos Dinámicos</h4>
          
          <div className="space-y-2">
            <Label htmlFor="easingFactorRange">Suavizado</Label>
            <SliderWithInput 
              id="easingFactorRange" 
              defaultValue={[easingFactor || 0.1]} 
              min={0.01} 
              max={1} 
              step={0.01} 
              precision={2}
              onValueChange={val => onAnimationSettingsChange({ easingFactor: val[0] })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeScaleRange">Escala de Tiempo</Label>
            <SliderWithInput 
              id="timeScaleRange" 
              defaultValue={[timeScale || 1.0]} 
              min={0.1} 
              max={5} 
              step={0.1} 
              precision={1}
              onValueChange={val => onAnimationSettingsChange({ timeScale: val[0] })} 
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox 
              id="dynLen" 
              checked={dynamicLengthEnabled} 
              onCheckedChange={c => onAnimationSettingsChange({ dynamicLengthEnabled: !!c })} 
            />
            <Label htmlFor="dynLen">Longitud Dinámica</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dynWid" 
              checked={dynamicWidthEnabled} 
              onCheckedChange={c => onAnimationSettingsChange({ dynamicWidthEnabled: !!c })} 
            />
            <Label htmlFor="dynWid">Grosor Dinámico</Label>
          </div>
          
          {(dynamicLengthEnabled || dynamicWidthEnabled) && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="dynInt">Intensidad Dinámica</Label>
              <SliderWithInput 
                id="dynInt" 
                defaultValue={[dynamicIntensity || 1.0]} 
                min={0} 
                precision={1}
                max={5} 
                step={0.1} 
                onValueChange={val => onAnimationSettingsChange({ dynamicIntensity: val[0] })} 
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Exportación */}
        <div className="space-y-3">
          <h4 className="font-medium text-base">Exportación</h4>
          <Button 
            variant="outline"
            size="sm" 
            className="w-full"
            onClick={onExportConfig} 
          >
            Exportar Configuración
          </Button>
          <Button className="w-full" variant="outline">Descargar SVG Estático</Button>
          <Button className="w-full" variant="outline">Descargar SVG Animado (Bucle)</Button>
          <Button className="w-full" variant="outline">Grabar GIF</Button>
        </div>
      </div>
    </ScrollArea>
  );
}
