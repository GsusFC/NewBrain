'use client';

import React, { useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { Disclosure, RadioGroup, Switch as HeadlessSwitch, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  useAnimationSettings,
  useUpdateProps
} from '../store/improved/hooks';
import type { AnimationType } from '../core/types';

/**
 * LeftControlPanel optimizado usando la arquitectura Zustand y componentes Headless UI
 * Esta versión implementa componentes accesibles y una estructura semántica mejorada
 */
export const LeftControlPanelHeadless: React.FC = () => {
  // Accedemos directamente al store a través de hooks selectores
  const {
    animationType,
    animationProps,
    easingFactor,
    timeScale,
    dynamicLengthEnabled,
    dynamicWidthEnabled,
    dynamicIntensity,
    togglePause,
    setAnimationType,
    updateAnimationSettings,
    updateAnimationProps
  } = useAnimationSettings();
  
  // Hook para actualizar múltiples propiedades a la vez
  const updateProps = useUpdateProps();
  
  // Debounce para cambios en propiedades que requieren slider
  const debouncedUpdateSettings = React.useRef(
    debounce(
      (settings: Partial<typeof animationProps>) => {
        updateAnimationProps(settings);
      },
      150
    )
  ).current;

  // Cancelar el debounce al desmontar el componente
  React.useEffect(() => {
    return () => {
      debouncedUpdateSettings.cancel();
    };
  }, []);
  
  // Handler para cambio de tipo de animación
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
        
      case 'randomLoop':
        defaultProps = {
          intervalMs: 2000,
          transitionDurationFactor: 0.5
        };
        break;
        
      case 'smoothWaves':
        defaultProps = {
          waveFrequency: 0.0005,
          waveAmplitude: 30,
          baseAngle: 0,
          patternScale: 0.01,
          timeScale: 1.0,
          waveType: 'circular',
          centerX: 0.5,
          centerY: 0.5
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
        
      default:
        break;
    }
    
    // Actualizar el tipo de animación y propiedades en una sola operación
    updateProps({
      animationType: value,
      animationProps: defaultProps
    });
  }, [updateProps]);
  
  // Función para generar un trigger pulse
  const handleTriggerPulse = useCallback(() => {
    // Implementación de trigger pulse (puede mantenerse igual)
    console.log("Pulse triggered");
  }, []);
  
  // Función para exportar configuración
  const handleExportConfig = useCallback(() => {
    // Implementación de exportación (puede mantenerse igual)
    console.log("Config exported");
  }, []);
  
  // Función para exportar SVG estático
  const handleExportSvg = useCallback(() => {
    // Implementación de exportación SVG (puede mantenerse igual)
    console.log("SVG exported");
  }, []);
  
  // Función para exportar SVG animado
  const handleExportAnimatedSvg = useCallback(() => {
    // Implementación de exportación SVG animado (puede mantenerse igual)
    console.log("Animated SVG exported");
  }, []);
  
  // Renderizar controles específicos según el tipo de animación
  const renderAnimationSpecificControls = () => {
    // Dependiendo del tipo de animación, mostramos controles específicos
    switch (animationType) {
      case 'smoothWaves': {
        const waveFrequency = animationProps?.waveFrequency ?? 0.0005;
        const waveAmplitude = animationProps?.waveAmplitude ?? 30;
        const centerX = animationProps?.centerX ?? 0.5;
        const centerY = animationProps?.centerY ?? 0.5;
        
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-xs">Parámetros de Olas</h4>
            
            <div>
              <label className="text-xs opacity-70">Frecuencia: {waveFrequency.toFixed(5)}</label>
              <Slider
                value={[waveFrequency]}
                min={0.0001}
                max={0.001}
                step={0.00005}
                onValueChange={([value]) => debouncedUpdateSettings({ waveFrequency: value })}
                className="my-2"
              />
            </div>
            
            <div>
              <label className="text-xs opacity-70">Amplitud: {waveAmplitude}</label>
              <Slider
                value={[waveAmplitude]}
                min={5}
                max={60}
                step={1}
                onValueChange={([value]) => debouncedUpdateSettings({ waveAmplitude: value })}
                className="my-2"
              />
            </div>
            
            <div>
              <label className="text-xs opacity-70">Centro X: {(typeof centerX === 'number' ? centerX.toFixed(2) : '0.00')}</label>
              <Slider
                value={[typeof centerX === 'number' ? centerX : 0.5]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([value]) => debouncedUpdateSettings({ centerX: value })}
                className="my-2"
              />
            </div>
            
            <div>
              <label className="text-xs opacity-70">Centro Y: {(typeof centerY === 'number' ? centerY.toFixed(2) : '0.00')}</label>
              <Slider
                value={[typeof centerY === 'number' ? centerY : 0.5]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([value]) => debouncedUpdateSettings({ centerY: value })}
                className="my-2"
              />
            </div>
          </div>
        );
      }
      
      // Otros casos pueden agregarse aquí...
      
      default:
        return (
          <div className="p-3 bg-slate-800/20 rounded-md">
            <p className="text-xs opacity-70">
              No hay parámetros específicos para esta animación.
            </p>
          </div>
        );
    }
  };
  
  // Definición de los tipos de animación disponibles
  const animationOptions = [
    { value: 'smoothWaves', label: 'Olas Suaves' },
    { value: 'lissajous', label: 'Lissajous' },
    { value: 'perlinFlow', label: 'Flujo Perlin' },
    { value: 'directionalFlow', label: 'Flujo Direccional' },
    { value: 'vortex', label: 'Vórtice' },
    { value: 'flocking', label: 'Bandada' },
    { value: 'randomLoop', label: 'Bucle Aleatorio' },
    { value: 'seaWaves', label: 'Olas de Mar' }
  ];
  
  // Renderizado memoizado para evitar renders innecesarios
  const renderedContent = useMemo(() => {
    return (
      <div className="p-4 space-y-6 h-full overflow-y-auto custom-scrollbar">
        {/* Selector de tipo de animación usando RadioGroup de Headless UI */}
        <div className="space-y-4">
          <Disclosure defaultOpen>
            {({ open }) => (
              <div className="space-y-3">
                <Disclosure.Button className="flex w-full justify-between items-center py-2 text-left">
                  <h3 className="text-lg font-semibold tracking-tight">Tipo de Animación</h3>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform",
                      open ? "transform rotate-180" : ""
                    )}
                  />
                </Disclosure.Button>
                
                <Transition
                  show={open}
                  enter="transition ease-out duration-100"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                  as="div"
                  className="overflow-hidden"
                >
                  <Disclosure.Panel static>
                    <RadioGroup 
                      value={animationType} 
                      onChange={handleAnimationTypeChange}
                      className="space-y-2 mt-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {animationOptions.map((option) => (
                          <RadioGroup.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, checked }) => cn(
                              "flex items-center justify-center px-3 py-2 rounded text-sm font-medium cursor-pointer",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                              checked 
                                ? "bg-primary/20 border border-primary text-white" 
                                : "bg-slate-800/30 hover:bg-slate-800/50 border border-transparent",
                            )}
                          >
                            {({ checked }) => (
                              <div className="flex items-center">
                                <span>{option.label}</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                        ))}
                      </div>
                    </RadioGroup>
                    
                    <div className="mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTriggerPulse}
                        className="w-full text-xs"
                      >
                        Generar Pulso
                      </Button>
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        </div>
        
        {/* Controles específicos para el tipo de animación seleccionado */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <div className="space-y-3">
              <Disclosure.Button className="flex w-full justify-between items-center py-2 text-left">
                <h3 className="text-lg font-semibold tracking-tight">Parámetros Específicos</h3>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    open ? "transform rotate-180" : ""
                  )}
                />
              </Disclosure.Button>
              
              <Transition
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                as="div"
                className="overflow-hidden"
              >
                <Disclosure.Panel static>
                  {renderAnimationSpecificControls()}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
        
        <Separator />
        
        {/* Configuración General */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <div className="space-y-3">
              <Disclosure.Button className="flex w-full justify-between items-center py-2 text-left">
                <h3 className="text-lg font-semibold tracking-tight">Configuración General</h3>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    open ? "transform rotate-180" : ""
                  )}
                />
              </Disclosure.Button>
              
              <Transition
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                as="div"
                className="overflow-hidden"
              >
                <Disclosure.Panel static className="space-y-4">
                  <div>
                    <label className="text-xs opacity-70">Factor de Suavizado: {easingFactor.toFixed(2)}</label>
                    <Slider
                      value={[easingFactor]}
                      min={0.01}
                      max={1}
                      step={0.01}
                      onValueChange={([value]) => updateAnimationSettings({ easingFactor: value })}
                      className="my-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs opacity-70">Escala de Tiempo: {timeScale.toFixed(2)}x</label>
                    <Slider
                      value={[timeScale]}
                      min={0.1}
                      max={3}
                      step={0.1}
                      onValueChange={([value]) => updateAnimationSettings({ timeScale: value })}
                      className="my-2"
                    />
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
        
        {/* Efectos Dinámicos */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <div className="space-y-3">
              <Disclosure.Button className="flex w-full justify-between items-center py-2 text-left">
                <h3 className="text-lg font-semibold tracking-tight">Efectos Dinámicos</h3>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    open ? "transform rotate-180" : ""
                  )}
                />
              </Disclosure.Button>
              
              <Transition
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                as="div"
                className="overflow-hidden"
              >
                <Disclosure.Panel static className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs" htmlFor="dynamic-length-switch">Longitud Dinámica</label>
                    <HeadlessSwitch
                      id="dynamic-length-switch"
                      checked={dynamicLengthEnabled}
                      onChange={(checked) => updateAnimationSettings({ dynamicLengthEnabled: checked })}
                      className={`${
                        dynamicLengthEnabled ? 'bg-primary' : 'bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                    >
                      <span 
                        className={`${
                          dynamicLengthEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </HeadlessSwitch>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs" htmlFor="dynamic-width-switch">Ancho Dinámico</label>
                    <HeadlessSwitch
                      id="dynamic-width-switch"
                      checked={dynamicWidthEnabled}
                      onChange={(checked) => updateAnimationSettings({ dynamicWidthEnabled: checked })}
                      className={`${
                        dynamicWidthEnabled ? 'bg-primary' : 'bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                    >
                      <span 
                        className={`${
                          dynamicWidthEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </HeadlessSwitch>
                  </div>
                  
                  <div>
                    <label className="text-xs opacity-70">Intensidad Dinámica: {dynamicIntensity.toFixed(2)}</label>
                    <Slider
                      value={[dynamicIntensity]}
                      min={0.1}
                      max={3}
                      step={0.1}
                      onValueChange={([value]) => updateAnimationSettings({ dynamicIntensity: value })}
                      className="my-2"
                      disabled={!(dynamicLengthEnabled || dynamicWidthEnabled)}
                    />
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
        
        <Separator />
        
        {/* Acciones */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <div className="space-y-3">
              <Disclosure.Button className="flex w-full justify-between items-center py-2 text-left">
                <h3 className="text-lg font-semibold tracking-tight">Acciones</h3>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    open ? "transform rotate-180" : ""
                  )}
                />
              </Disclosure.Button>
              
              <Transition
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                as="div"
                className="overflow-hidden"
              >
                <Disclosure.Panel static className="space-y-3">
                  <Button
                    className="w-full bg-white/5 hover:bg-white/10"
                    variant="outline"
                    onClick={togglePause}
                  >
                    {easingFactor === 0 ? "Reanudar" : "Pausar"}
                  </Button>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 hover:bg-white/10"
                      onClick={handleExportConfig}
                      size="sm"
                    >
                      Exportar Configuración
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 hover:bg-white/10"
                      onClick={handleExportSvg}
                      size="sm"
                    >
                      Exportar SVG Estático
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 hover:bg-white/10"
                      onClick={handleExportAnimatedSvg}
                      size="sm"
                    >
                      Exportar SVG Animado
                    </Button>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>
    );
  }, [
    animationType, 
    animationProps,
    easingFactor,
    timeScale,
    dynamicLengthEnabled,
    dynamicWidthEnabled,
    dynamicIntensity,
    debouncedUpdateSettings,
    handleAnimationTypeChange,
    handleTriggerPulse,
    handleExportConfig,
    handleExportSvg,
    handleExportAnimatedSvg,
    togglePause,
    updateAnimationSettings
  ]);
  
  return renderedContent;
};
