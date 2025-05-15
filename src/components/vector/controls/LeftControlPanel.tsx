// src/components/vector/controls/LeftControlPanel.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { VectorGridProps, AnimationType, AnimationProps } from '../core/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from '@/components/ui/checkbox';
import { SliderWithInput } from "../controls/VectorControlComponents";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { debounce } from 'lodash';

interface LeftControlPanelProps {
  currentProps: VectorGridProps;
  onPropsChange: (newValues: Partial<VectorGridProps>) => void; // Añadido para permitir actualizaciones generales
  onAnimationSettingsChange: (newAnimationSettings: Partial<Pick<VectorGridProps, 'animationType' | 'animationProps' | 'easingFactor' | 'timeScale' | 'dynamicLengthEnabled' | 'dynamicWidthEnabled' | 'dynamicIntensity' | 'isPaused'>>) => void;
  onTriggerPulse: () => void;
  onExportConfig?: () => void; // Opcional por si aún no se implementa
}

export const LeftControlPanel = ({ 
  currentProps, 
  onPropsChange,
  onAnimationSettingsChange, 
  onTriggerPulse, 
  onExportConfig 
}: LeftControlPanelProps) => {
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
    let defaultProps = {};
    
    // Propiedades por defecto según el tipo de animación
    switch (value) {
      case 'lissajous':
        defaultProps = {
          xFrequency: 1.0,
          yFrequency: 2.0,
          xAmplitude: 20,
          yAmplitude: 20,
          phaseOffset: 0,
          timeSpeed: 1.0
        };
        break;
        
      case 'seaWaves':
        defaultProps = {
          baseFrequency: 0.0004,
          baseAmplitude: 25,
          rippleFrequency: 0.001,
          rippleAmplitude: 10,
          choppiness: 0.3,
          spatialFactor: 0.01
        };
        break;
        
      case 'perlinFlow':
        defaultProps = {
          noiseScale: 0.005,
          timeEvolutionSpeed: 0.0002,
          angleMultiplier: 360
        };
        break;
        
      case 'tangenteClasica':
        defaultProps = {
          frequency: 0.0005,
          amplitude: 30,
          baseAngle: 0,
          spatialScale: 0.01,
          curvature: 0.5
        };
        break;
        
      case 'geometricPattern':
        defaultProps = {
          pattern: 'spiral',
          rotationSpeed: 0.0001,
          intensity: 1.0,
          centerX: undefined,
          centerY: undefined
        };
        break;
        
      case 'directionalFlow':
        defaultProps = {
          flowAngle: 0,
          flowSpeed: 1.0,
          turbulence: 0
        };
        break;
        
      case 'vortex':
        defaultProps = {
          strength: 0.05,
          radiusFalloff: 2,
          swirlDirection: 'clockwise'
        };
        break;
        
      case 'flocking':
        defaultProps = {
          perceptionRadius: 50,
          maxSpeed: 0.5,
          separationForce: 1.5,
          alignmentForce: 1.0,
          cohesionForce: 1.0,
          targetSeekingForce: 0
        };
        break;
        
      // Para otras animaciones, mantener las props existentes o vacío
      default:
        break;
    }
    
    // Actualizar con el nuevo tipo de animación y las propiedades por defecto
    onAnimationSettingsChange({ 
      animationType: value,
      animationProps: defaultProps
    });
    
    // Actualizar también el estado local
    setLocalAnimationProps(defaultProps);
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
              className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring appearance-none"
            >
              <option value="none">Ninguna</option>
              <option value="smoothWaves">Olas Suaves</option>
              <option value="mouseInteraction">Interacción Ratón</option>
              <option value="centerPulse">Pulso Central</option>
              <option value="directionalFlow">Flujo Direccional</option>
              <option value="vortex">Vórtice</option>
              <option value="flocking">Bandada</option>
              <option value="staticAngle">Ángulo Estático</option>
              <option value="randomLoop">Bucle Aleatorio</option>
              {/* Nuevas animaciones implementadas */}
              <option value="lissajous">Lissajous</option>
              <option value="seaWaves">Olas Marinas</option>
              <option value="perlinFlow">Flujo Perlin</option>
              <option value="tangenteClasica">Tangente Clásica</option>
              <option value="geometricPattern">Patrón Geométrico</option>
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
                
                {/* Control para activar el modo continuo */}
                <div className="flex items-center space-x-2 p-2 border border-slate-600/40 rounded bg-slate-800/40 hover:bg-slate-700/40">
                  <Checkbox
                    id="continuousModeToggle"
                    checked={!!currentProps.animationProps?.continuousMode}
                    onCheckedChange={(checked) => {
                      // Crear copia local para evitar errores de referencia
                      const currentAnimProps = {...(currentProps.animationProps || {})};
                      
                      // Asegurar que tenemos valores predeterminados para modo continuo
                      if (checked) {
                        currentAnimProps.continuousMode = true;
                        currentAnimProps.pulseInterval = currentAnimProps.pulseInterval || 2000;
                        currentAnimProps.maxActivePulses = currentAnimProps.maxActivePulses || 3;
                        currentAnimProps.fadeOutFactor = currentAnimProps.fadeOutFactor || 0.8;
                      } else {
                        currentAnimProps.continuousMode = false;
                      }
                      
                      onAnimationSettingsChange({ animationProps: currentAnimProps });
                    }}
                  />
                  <Label 
                    htmlFor="continuousModeToggle"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Modo Continuo
                  </Label>
                </div>
                
                {/* Controles que solo aparecen en modo continuo */}
                {!!currentProps.animationProps?.continuousMode && (
                  <div className="space-y-3 border border-slate-600/40 rounded bg-slate-800/40 p-2 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="pulseInterval">
                        Intervalo entre pulsos (ms)
                      </Label>
                      <SliderWithInput 
                        id="pulseInterval" 
                        value={[Number(currentProps.animationProps?.pulseInterval || 2000)]} 
                        min={500} 
                        max={10000} 
                        step={100} 
                        precision={0}
                        onValueChange={val => {
                          // Crear copia profunda para evitar mutaciones no deseadas
                          const currentAnimProps = {...(currentProps.animationProps || {})};
                          
                          // Actualizar el valor y mantener otros valores
                          currentAnimProps.pulseInterval = val[0];
                          
                          // Enviar todos los cambios juntos
                          onAnimationSettingsChange({ animationProps: currentAnimProps });
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxActivePulses">
                        Máx. Pulsos Simultáneos
                      </Label>
                      <SliderWithInput 
                        id="maxActivePulses" 
                        value={[Number(currentProps.animationProps?.maxActivePulses || 3)]} 
                        min={1} 
                        max={10} 
                        step={1} 
                        precision={0}
                        onValueChange={val => {
                          // Crear copia profunda para evitar mutaciones no deseadas
                          const currentAnimProps = {...(currentProps.animationProps || {})};
                          
                          // Actualizar el valor y mantener otros valores
                          currentAnimProps.maxActivePulses = val[0];
                          
                          // Enviar todos los cambios juntos
                          onAnimationSettingsChange({ animationProps: currentAnimProps });
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fadeOutFactor">
                        Factor de desvanecimiento
                      </Label>
                      <SliderWithInput 
                        id="fadeOutFactor" 
                        value={[Number(currentProps.animationProps?.fadeOutFactor || 0.8)]} 
                        min={0.1} 
                        max={1.0} 
                        step={0.1} 
                        precision={1}
                        onValueChange={val => {
                          const updatedAnimProps: Record<string, unknown> = {
                            ...currentProps.animationProps,
                            fadeOutFactor: val[0]
                          };
                          onAnimationSettingsChange({
                            animationProps: updatedAnimProps
                          });
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fadeOutFactor">
                        Factor de Atenuación
                      </Label>
                      <SliderWithInput 
                        id="fadeOutFactor" 
                        defaultValue={[0.8]} 
                        value={[Number(currentProps.animationProps?.fadeOutFactor || 0.8)]} 
                        min={0.1} 
                        max={1} 
                        step={0.05} 
                        precision={2}
                        onValueChange={val => {
                          const currentAnimProps = currentProps.animationProps || {};
                          // Usamos onPropsChange ya que fadeOutFactor no está en el tipo de onAnimationSettingsChange
                          onPropsChange({
                            animationProps: {
                              ...currentAnimProps,
                              fadeOutFactor: val[0]
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Parámetros generales del pulso */}
                <div className="space-y-2">
                  <Label htmlFor="pulseDur">
                    Duración de pulso (ms)
                  </Label>
                  <SliderWithInput 
                    id="pulseDur" 
                    defaultValue={[1000]} 
                    value={[Number(currentProps.animationProps?.pulseDuration || 1000)]} 
                    min={100} 
                    max={5000} 
                    step={50} 
                    precision={0}
                    onValueChange={val => {
                      const currentAnimProps = currentProps.animationProps || {};
                      onPropsChange({
                        animationProps: {
                          ...currentAnimProps,
                          pulseDuration: val[0]
                        }
                      });
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLengthFactor">
                    Intensidad del pulso
                  </Label>
                  <SliderWithInput 
                    id="maxLengthFactor" 
                    defaultValue={[2]} 
                    value={[Number(currentProps.animationProps?.maxLengthFactor || 2)]} 
                    min={1} 
                    max={10} 
                    step={0.1} 
                    precision={1}
                    onValueChange={val => {
                      const currentAnimProps = currentProps.animationProps || {};
                      onPropsChange({
                        animationProps: {
                          ...currentAnimProps,
                          maxLengthFactor: val[0]
                        }
                      });
                    }}
                  />
                </div>  
              </div>
            )}
            
            {/* Parámetros de Interacción con Ratón */}
            {animationType === 'mouseInteraction' && (
              <div className="space-y-4">
                {/* Radio de interacción */}
                <div className="space-y-2">
                  <Label htmlFor="interactionRadius">
                    Radio de interacción
                  </Label>
                  <SliderWithInput 
                    id="interactionRadius" 
                    value={[(currentProps.animationProps?.interactionRadius as number | undefined) ?? 150]} 
                    min={50} 
                    max={500} 
                    step={10} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('interactionRadius', val[0])} 
                  />
                </div>
                
                {/* Tipo de efecto */}
                <div className="space-y-2">
                  <Label htmlFor="effectType">Tipo de efecto</Label>
                  <select
                    id="effectType"
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                    value={(currentProps.animationProps?.effectType as string | undefined) ?? 'attract'}
                    onChange={(e) => onAnimationSettingsChange({ 
                      animationProps: {
                        ...currentProps.animationProps,
                        effectType: e.target.value
                      }
                    })}
                  >
                    <option value="attract">Atracción</option>
                    <option value="repel">Repulsión</option>
                    <option value="align">Alineación</option>
                    <option value="swirl">Remolino</option>
                  </select>
                </div>
                
                {/* Fuerza del efecto */}
                <div className="space-y-2">
                  <Label htmlFor="effectStrength">
                    Fuerza del efecto
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
            
            {/* CONTROLES PARA LISSAJOUS */}
            {animationType === 'lissajous' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="xFrequency">Frecuencia X</Label>
                  <SliderWithInput 
                    id="xFrequency" 
                    value={[currentProps.animationProps?.xFrequency as number || 1.0]} 
                    min={0.1} 
                    max={5.0} 
                    step={0.1} 
                    precision={1}
                    onValueChange={(val) => debouncedAnimationPropChange('xFrequency', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yFrequency">Frecuencia Y</Label>
                  <SliderWithInput 
                    id="yFrequency" 
                    value={[currentProps.animationProps?.yFrequency as number || 2.0]} 
                    min={0.1} 
                    max={5.0} 
                    step={0.1} 
                    precision={1}
                    onValueChange={(val) => debouncedAnimationPropChange('yFrequency', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="xAmplitude">Amplitud X</Label>
                  <SliderWithInput 
                    id="xAmplitude" 
                    value={[currentProps.animationProps?.xAmplitude as number || 20]} 
                    min={0} 
                    max={50} 
                    step={1} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('xAmplitude', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yAmplitude">Amplitud Y</Label>
                  <SliderWithInput 
                    id="yAmplitude" 
                    value={[currentProps.animationProps?.yAmplitude as number || 20]} 
                    min={0} 
                    max={50} 
                    step={1} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('yAmplitude', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phaseOffset">Desfase</Label>
                  <SliderWithInput 
                    id="phaseOffset" 
                    value={[currentProps.animationProps?.phaseOffset as number || 0]} 
                    min={0} 
                    max={6.28} 
                    step={0.1} 
                    precision={2}
                    onValueChange={(val) => debouncedAnimationPropChange('phaseOffset', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeSpeed">Velocidad</Label>
                  <SliderWithInput 
                    id="timeSpeed" 
                    value={[currentProps.animationProps?.timeSpeed as number || 1.0]} 
                    min={0.1} 
                    max={5.0} 
                    step={0.1} 
                    precision={1}
                    onValueChange={(val) => debouncedAnimationPropChange('timeSpeed', val[0])} 
                  />
                </div>
              </div>
            )}
            
            {/* CONTROLES PARA SEAWAVES (OLAS MARINAS) */}
            {animationType === 'seaWaves' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseFrequency">Frecuencia base</Label>
                  <SliderWithInput 
                    id="baseFrequency" 
                    value={[currentProps.animationProps?.baseFrequency as number || 0.0004]} 
                    min={0.0001} 
                    max={0.001} 
                    step={0.0001} 
                    precision={5}
                    onValueChange={(val) => debouncedAnimationPropChange('baseFrequency', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseAmplitude">Amplitud base</Label>
                  <SliderWithInput 
                    id="baseAmplitude" 
                    value={[currentProps.animationProps?.baseAmplitude as number || 25]} 
                    min={1} 
                    max={50} 
                    step={1} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('baseAmplitude', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rippleFrequency">Frecuencia ondulación</Label>
                  <SliderWithInput 
                    id="rippleFrequency" 
                    value={[currentProps.animationProps?.rippleFrequency as number || 0.001]} 
                    min={0.0001} 
                    max={0.005} 
                    step={0.0001} 
                    precision={5}
                    onValueChange={(val) => debouncedAnimationPropChange('rippleFrequency', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rippleAmplitude">Amplitud ondulación</Label>
                  <SliderWithInput 
                    id="rippleAmplitude" 
                    value={[currentProps.animationProps?.rippleAmplitude as number || 10]} 
                    min={1} 
                    max={30} 
                    step={1} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('rippleAmplitude', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="choppiness">Asimetría (crestas)</Label>
                  <SliderWithInput 
                    id="choppiness" 
                    value={[currentProps.animationProps?.choppiness as number || 0.3]} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    precision={2}
                    onValueChange={(val) => debouncedAnimationPropChange('choppiness', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spatialFactor">Factor espacial</Label>
                  <SliderWithInput 
                    id="spatialFactor" 
                    value={[currentProps.animationProps?.spatialFactor as number || 0.01]} 
                    min={0.001} 
                    max={0.1} 
                    step={0.001} 
                    precision={3}
                    onValueChange={(val) => debouncedAnimationPropChange('spatialFactor', val[0])} 
                  />
                </div>
              </div>
            )}
            
            {/* CONTROLES PARA PERLINFLOW */}
            {animationType === 'perlinFlow' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="noiseScale">Escala de ruido</Label>
                  <SliderWithInput 
                    id="noiseScale" 
                    value={[currentProps.animationProps?.noiseScale as number || 0.005]} 
                    min={0.001} 
                    max={0.05} 
                    step={0.001} 
                    precision={4}
                    onValueChange={(val) => debouncedAnimationPropChange('noiseScale', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeEvolutionSpeed">Velocidad evolución</Label>
                  <SliderWithInput 
                    id="timeEvolutionSpeed" 
                    value={[currentProps.animationProps?.timeEvolutionSpeed as number || 0.0002]} 
                    min={0.0001} 
                    max={0.001} 
                    step={0.0001} 
                    precision={5}
                    onValueChange={(val) => debouncedAnimationPropChange('timeEvolutionSpeed', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="angleMultiplier">Multiplicador de ángulo</Label>
                  <SliderWithInput 
                    id="angleMultiplier" 
                    value={[currentProps.animationProps?.angleMultiplier as number || 360]} 
                    min={10} 
                    max={360} 
                    step={10} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('angleMultiplier', val[0])} 
                  />
                </div>
              </div>
            )}
            
            {/* CONTROLES PARA TANGENTE CLÁSICA */}
            {animationType === 'tangenteClasica' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <SliderWithInput 
                    id="frequency" 
                    value={[currentProps.animationProps?.frequency as number || 0.0005]} 
                    min={0.0001} 
                    max={0.001} 
                    step={0.0001} 
                    precision={5}
                    onValueChange={(val) => debouncedAnimationPropChange('frequency', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amplitude">Amplitud</Label>
                  <SliderWithInput 
                    id="amplitude" 
                    value={[currentProps.animationProps?.amplitude as number || 30]} 
                    min={5} 
                    max={90} 
                    step={1} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('amplitude', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseAngle">Ángulo base</Label>
                  <SliderWithInput 
                    id="baseAngle" 
                    value={[currentProps.animationProps?.baseAngle as number || 0]} 
                    min={0} 
                    max={360} 
                    step={1} 
                    precision={0}
                    onValueChange={(val) => debouncedAnimationPropChange('baseAngle', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spatialScale">Escala espacial</Label>
                  <SliderWithInput 
                    id="spatialScale" 
                    value={[currentProps.animationProps?.spatialScale as number || 0.01]} 
                    min={0.001} 
                    max={0.1} 
                    step={0.001} 
                    precision={3}
                    onValueChange={(val) => debouncedAnimationPropChange('spatialScale', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="curvature">Curvatura</Label>
                  <SliderWithInput 
                    id="curvature" 
                    value={[currentProps.animationProps?.curvature as number || 0.5]} 
                    min={0.1} 
                    max={2.0} 
                    step={0.1} 
                    precision={1}
                    onValueChange={(val) => debouncedAnimationPropChange('curvature', val[0])} 
                  />
                </div>
              </div>
            )}
            
            {/* CONTROLES PARA PATRÓN GEOMÉTRICO */}
            {animationType === 'geometricPattern' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Tipo de patrón</Label>
                  <select
                    id="pattern"
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                    value={(currentProps.animationProps?.pattern as string) || 'spiral'}
                    onChange={(e) => onAnimationSettingsChange({ 
                      animationProps: {
                        ...currentProps.animationProps,
                        pattern: e.target.value
                      }
                    })}
                  >
                    <option value="spiral">Espiral</option>
                    <option value="concentric">Concéntrico</option>
                    <option value="radial">Radial</option>
                    <option value="grid">Cuadrícula</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rotationSpeed">Velocidad de rotación</Label>
                  <SliderWithInput 
                    id="rotationSpeed" 
                    value={[currentProps.animationProps?.rotationSpeed as number || 0.0001]} 
                    min={0.00001} 
                    max={0.001} 
                    step={0.00001} 
                    precision={6}
                    onValueChange={(val) => debouncedAnimationPropChange('rotationSpeed', val[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="intensity">Intensidad</Label>
                  <SliderWithInput 
                    id="intensity" 
                    value={[currentProps.animationProps?.intensity as number || 1.0]} 
                    min={0.1} 
                    max={5.0} 
                    step={0.1} 
                    precision={1}
                    onValueChange={(val) => debouncedAnimationPropChange('intensity', val[0])} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Efectos Dinámicos Generales */}
        <Card>
          <CardHeader>
            <CardTitle>Efectos Dinámicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          
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
        </CardContent>
        </Card>

        {/* Exportación */}
        <Card>
          <CardHeader>
            <CardTitle>Exportación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
        </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
