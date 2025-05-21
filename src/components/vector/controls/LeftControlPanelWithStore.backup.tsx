import React, { useCallback, useMemo } from 'react';
import { useVectorGridStore } from '../store/improved/vectorGridStore';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { debounce } from 'lodash';

import {
  useAnimationSettings,
  useUpdateProps
} from '../store/improved/hooks';
import type { AnimationType } from '../core/types';

/**
 * LeftControlPanel optimizado usando la arquitectura Zustand
 * Esta versión elimina cualquier ciclo de renderizado y actualización excesiva
 */
export const LeftControlPanelWithStore: React.FC = () => {
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
    updateAnimationProps // Nombre correcto de la función
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
    // Llamamos directamente a la acción triggerPulse del store
    // Esta función está disponible en el store pero no se estaba usando
    const triggerPulse = useVectorGridStore.getState().triggerPulse;
    triggerPulse();
  }, []);
  
  // Función para exportar la configuración actual
  const handleExportConfig = useCallback(() => {
    try {
      const config = {
        animationType,
        animationProps,
        easingFactor,
        timeScale,
        dynamicSettings: {
          lengthEnabled: dynamicLengthEnabled,
          widthEnabled: dynamicWidthEnabled,
          intensity: dynamicIntensity
        }
      };
      
      // Crear un blob y descargar de forma segura
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `vector-config-${animationType}-${Date.now()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export config', error);
    }
  }, [animationType, animationProps, easingFactor, timeScale, dynamicLengthEnabled, dynamicWidthEnabled, dynamicIntensity]);

  // Función para exportar el SVG estático actual
  const handleExportSvg = useCallback(() => {
    try {
      // Buscar el elemento SVG en el DOM
      const svgElement = document.querySelector('.vector-grid-renderer svg') as SVGSVGElement | null;
      
      if (!svgElement) {
        console.error('No se encontró el elemento SVG para exportar');
        return;
      }
      
      // Clonar el SVG para no modificar el original
      const svgData = svgElement.outerHTML;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Crear un enlace para descargar el SVG
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `vector-export-${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Liberar el objeto URL
      URL.revokeObjectURL(svgUrl);
    } catch (error) {
      console.error('Error al exportar SVG:', error);
    }
  }, []);
  
  // Función para exportar un SVG animado (como una secuencia de frames)
  const handleExportAnimatedSvg = useCallback(async () => {
    try {
      // Buscar el elemento SVG en el DOM
      const svgElement = document.querySelector('.vector-grid-renderer svg') as SVGSVGElement | null;
      
      if (!svgElement) {
        console.error('No se encontró el elemento SVG para exportar');
        return;
      }
      
      // Clonar el SVG para no modificar el original
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Configurar el SVG para animación
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Añadir definiciones para la animación
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      
      // Añadir animación a cada elemento path, line, etc.
      const elementsToAnimate = svgClone.querySelectorAll('path, line, rect, circle, ellipse, polygon, polyline');
      
      elementsToAnimate.forEach((el, index) => {
        // Crear animación de opacidad para simular el bucle
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'opacity');
        animate.setAttribute('values', '0.3;1;0.3');
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        animate.setAttribute('begin', `${index * 0.1}s`);
        
        el.appendChild(animate);
      });
      
      // Convertir el SVG a string
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgClone);
      
      // Asegurar que el SVG tenga la declaración XML
      if (!svgString.includes('<?xml')) {
        svgString = '<?xml version="1.0" standalone="no"?>\n' + svgString;
      }
      
      // Crear y descargar el archivo
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `vector-animated-${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Liberar el objeto URL
      URL.revokeObjectURL(svgUrl);
      
    } catch (error) {
      console.error('Error al exportar SVG animado:', error);
    }
  }, []);
  
  // Renderizar el contenido memoizado para evitar renders innecesarios
  const renderedContent = useMemo(() => {
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
        
        case 'centerPulse': {
          return (
            <div className="space-y-4">
              <h3 className="font-medium">Exportar</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleExportConfig}
                >
                  Exportar Configuración
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleExportSvg}
                >
                  Descargar SVG Estático
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleExportAnimatedSvg}
                >
                  Descargar SVG Animado (Bucle)
                </Button>
              </div>
            </div>
          );
        }
        
        // Añade más casos para otros tipos de animación según sea necesario
        
        default:
          return null;
      }
    };
    
    return (
      <div className="p-4 space-y-6 overflow-y-auto h-full custom-scrollbar">
        <h3 className="text-xl font-semibold tracking-tight text-center">Animación y Efectos</h3>
        <Separator />

        {/* Tipo de Animación */}
        <div className="space-y-4">
          <h4 className="font-medium text-xs">Tipo de Animación</h4>
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
              <option value="randomLoop">Bucle Aleatorio</option>
              <option value="lissajous">Curvas Lissajous</option>
              <option value="seaWaves">Olas Marinas</option>
              <option value="perlinFlow">Flujo Perlin</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Controles específicos para el tipo de animación seleccionado */}
        {renderAnimationSpecificControls()}
        
        <Separator />
        
        {/* Factor de Suavizado */}
        <div className="space-y-4">
          <h4 className="font-medium text-xs">Configuración General</h4>
          
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
        </div>
        
        <Separator />
        
        {/* Efectos Dinámicos */}
        <div className="space-y-4">
          <h4 className="font-medium text-xs">Efectos Dinámicos</h4>
          
          <div className="flex items-center justify-between">
            <span className="text-xs">Longitud Dinámica</span>
            <Switch
              checked={dynamicLengthEnabled}
              onChange={(checked) => updateAnimationSettings({ dynamicLengthEnabled: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs">Ancho Dinámico</span>
            <Switch
              checked={dynamicWidthEnabled}
              onChange={(checked) => updateAnimationSettings({ dynamicWidthEnabled: checked })}
            />
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
        </div>
        
        <Separator />
        
        {/* Botones */}
        <div className="space-y-3">
          <Button
            className="w-full bg-white/5 hover:bg-white/10"
            variant="outline"
            onClick={togglePause}
          >
            {easingFactor === 0 ? "Reanudar" : "Pausar"}
          </Button>
          
          <div className="space-y-2">
            <div className="space-y-2">
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
          </div>
        </div>
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
    togglePause,
    updateAnimationSettings
  ]);
  
  return renderedContent;
};
