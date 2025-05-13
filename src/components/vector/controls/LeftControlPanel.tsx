// src/components/vector/controls/LeftControlPanel.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { VectorGridProps, AnimationType, AnimationProps } from '../core/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

  // Usar useRef para almacenar currentProps.animationProps y evitar recreación de callbacks
  const animationPropsRef = React.useRef(currentProps.animationProps || {});
  // Actualizar la ref solo cuando cambian las props externas
  React.useEffect(() => {
    animationPropsRef.current = currentProps.animationProps || {};
  }, [currentProps.animationProps]);

  const [localAnimationProps, setLocalAnimationProps] = useState(currentProps.animationProps || {});

  // Memorizar estos callbacks con dependencias mínimas para evitar recreaciones
  const handleAnimationPropChange = useCallback((propName: keyof AnimationProps, value: number) => {
    const newAnimationProps = {
      ...animationPropsRef.current,
      [propName]: value,
    };
    onAnimationSettingsChange({ animationProps: newAnimationProps });
    setLocalAnimationProps(prev => ({...prev, [propName]: value}));
  }, [onAnimationSettingsChange]);

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
          <div className="relative">
            <select
              id="animationTypeSelect"
              value={animationType}
              onChange={(e) => handleAnimationTypeChange(e.target.value as AnimationType)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="none">Ninguna</option>
              <option value="smoothWaves">Olas Suaves</option>
              <option value="mouseInteraction">Interacción Ratón</option>
              <option value="centerPulse">Pulso Central</option>
              <option value="tangenteClasica">Tangente Clásica</option>
              {/* ... más tipos ... */}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
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
                    defaultValue={[1000]} 
                    value={[typeof currentProps.animationProps?.pulse === 'object' && 
                           currentProps.animationProps.pulse !== null && 
                           'pulseDuration' in currentProps.animationProps.pulse ? 
                           Number(currentProps.animationProps.pulse.pulseDuration) : 1000]} 
                    min={100} 
                    max={5000} 
                    step={50} 
                    precision={0}
                    onValueChange={val => {
                      // Usar un enfoque más seguro para la actualización
                      const currentAnimProps = currentProps.animationProps || {};
                      const currentPulse = typeof currentAnimProps.pulse === 'object' ? 
                                           {...currentAnimProps.pulse} : {};
                      
                      onPropsChange({
                        animationProps: {
                          ...currentAnimProps,
                          pulse: {
                            ...currentPulse,
                            pulseDuration: val[0]
                          }
                        }
                      });
                    }} 
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
                  <div className="relative">
                    <select
                      id="effectType"
                      value={(currentProps.animationProps?.effectType as string | undefined) ?? 'attract'}
                      onChange={(e) => onPropsChange({
                        animationProps: {
                          ...currentProps.animationProps,
                          effectType: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    >
                      <option value="attract">Atracción</option>
                      <option value="repel">Repulsión</option>
                      <option value="align">Alineación</option>
                      <option value="swirl">Remolino</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
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
