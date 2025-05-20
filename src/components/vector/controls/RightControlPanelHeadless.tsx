'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { ButtonGroup } from '@/components/ui/button-group';
import { Disclosure, Transition, Switch } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { 
  useGridSettings, 
  useVectorSettings
} from '../store/improved/hooks';
import { VectorShape } from '../core/types';

/**
 * Panel de control derecho completamente integrado con la arquitectura Zustand
 * Implementa componentes de Headless UI para mejorar la accesibilidad
 * y la estructura del panel de control.
 */
export function RightControlPanelHeadless() {
  // Acceso directo al estado a través de hooks selectores
  const { gridSettings, setGridSettings } = useGridSettings();
  const { vectorSettings, setVectorSettings } = useVectorSettings();
  
  // Extraer valores del store para facilitar el acceso
  const { userSvg } = gridSettings || {};
  const {
    vectorLength = 30,
    vectorWidth = 2,
    vectorColor = '#ffffff',
    vectorShape = 'arrow',
    strokeLinecap = 'round',
    rotationOrigin = 'start',
  } = vectorSettings || {};
  
  // Handler para cambios en propiedades de vectores
  const handleVectorChange = useCallback((
    property: string,
    value: unknown
  ) => {
    setVectorSettings({
      ...vectorSettings,
      [property]: value
    });
  }, [vectorSettings, setVectorSettings]);
  
  // Handler para cambios en propiedades con slider - EXACT COPY FROM ORIGINAL
  const handleVectorSliderChange = useCallback((
    property: string,
    values: number[]
  ) => {
    if (values && values.length > 0) {
      setVectorSettings({
        ...vectorSettings,
        [property]: values[0]
      });
    }
  }, [vectorSettings, setVectorSettings]);
  
  // Estado local para el modo automático de grid
  const [autoMode, setAutoMode] = useState(true);
  
  // Manejador para el cambio de modo automático
  const handleAutoModeChange = useCallback((isAuto: boolean) => {
    setAutoMode(isAuto);
  }, []);

  // Componente wrapper para SliderWithInput que maneja la etiqueta externamente - EXACT COPY FROM ORIGINAL
  const LabeledSlider = ({
    label,
    value,
    onValueChange,
    ...props
  }: {
    label: string;
    value: number[];
    onValueChange: (values: number[]) => void;
    className?: string;
    inputClassName?: string;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    disabled?: boolean;
  }) => (
    <div className="space-y-3">
      <Label className="font-medium text-xs">{label}</Label>
      <SliderWithInput 
        value={value} 
        onValueChange={onValueChange}
        {...props}
      />
    </div>
  );

  // Componente para controlar dimensiones del grid (filas/columnas)
  const GridDimensionControl = ({ 
    label, 
    value, 
    onChange, 
    disabled = false,
    max = 50 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void; 
    disabled?: boolean;
    max?: number; 
  }) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-medium text-xs">{label}</Label>
          {disabled ? (
            <span className="text-xs text-muted-foreground">
              Auto ({value} calculado)
            </span>
          ) : (
            <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded">
              {value}
            </span>
          )}
        </div>
        
        <SliderWithInput 
          value={[value]} 
          onValueChange={([val]) => onChange(val)} 
          min={1} 
          max={max} 
          step={1}
          precision={0}
          disabled={disabled}
          className="mt-1"
          inputClassName="w-16 text-sm"
        />
      </div>
    );
  };

  // Usamos directamente ButtonGroup que sabemos que funciona
  
  // Renderizado memoizado para evitar renders innecesarios
  const renderContent = useMemo(() => (
    <div className="p-4 space-y-6 h-full overflow-y-auto custom-scrollbar">
      {/* Sección de Configuración del Grid */}
      <div>
        <Disclosure defaultOpen>
          {({ open }) => (
            <div className="disclosure-wrapper rounded-lg bg-card/50 overflow-hidden">
              <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left focus:outline-none focus-visible:ring focus-visible:ring-primary">
                <h3 className="text-base font-semibold tracking-tight">Configuración del Grid</h3>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    open ? "transform rotate-180" : ""
                  )}
                  aria-hidden="true"
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel>
                  <div>
                    <Separator className="my-0" />
                    <div className="space-y-4 p-4">
                      {/* Modo Auto/Manual */}
                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-md">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Modo de Configuración</Label>
                          <p className="text-xs text-muted-foreground">
                            {autoMode ? 'Automático' : 'Manual'}
                          </p>
                        </div>
                        <Switch
                          checked={!autoMode}
                          onChange={checked => handleAutoModeChange(!checked)}
                          className={cn(
                            !autoMode ? 'bg-primary' : 'bg-card',
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                          )}
                        >
                          <span className="sr-only">
                            {autoMode ? 'Cambiar a modo manual' : 'Cambiar a modo automático'}
                          </span>
                          <span
                            className={cn(
                              !autoMode ? 'translate-x-6' : 'translate-x-1',
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                            )}
                          />
                        </Switch>
                      </div>

                      {/* Controles de Grid */}
                      <div className="space-y-4">
                        <GridDimensionControl
                          label="Filas"
                          value={gridSettings?.rows || 10}
                          disabled={autoMode}
                          onChange={(val) => setGridSettings({ ...gridSettings, rows: val })}
                        />
                        
                        <GridDimensionControl
                          label="Columnas"
                          value={gridSettings?.cols || 10}
                          disabled={autoMode}
                          onChange={(val) => setGridSettings({ ...gridSettings, cols: val })}
                        />
                        
                        <LabeledSlider
                          label="Espaciado entre celdas"
                          value={[gridSettings?.spacing || 8]} 
                          onValueChange={([val]) => setGridSettings({ ...gridSettings, spacing: val })}
                          min={0}
                          max={50}
                          step={1}
                          precision={0}
                          disabled={autoMode}
                          className="mt-1"
                          inputClassName="w-16 text-sm"
                        />
                        
                        <LabeledSlider
                          label="Margen del grid"
                          value={[gridSettings?.margin || 0]}
                          onValueChange={([val]) => setGridSettings({ ...gridSettings, margin: val })}
                          min={0}
                          max={100}
                          step={1}
                          precision={0}
                          disabled={autoMode}
                          className="mt-1"
                          inputClassName="w-16 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>
      
      {/* Sección de Ajustes Avanzados */}
      <div>
        <Disclosure>
          {({ open }) => (
            <div className="disclosure-wrapper rounded-lg bg-card/50 overflow-hidden">
              <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left focus:outline-none focus-visible:ring focus-visible:ring-primary">
                <h3 className="text-base font-semibold tracking-tight">Ajustes Avanzados</h3>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    open ? "transform rotate-180" : ""
                  )}
                  aria-hidden="true"
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel>
                  <div>
                    <Separator className="my-0" />
                    <div className="p-4 space-y-4">
                      <div className="p-3 bg-slate-800/20 rounded-md">
                        <h4 className="text-sm font-medium mb-2">Opciones Avanzadas</h4>
                        <p className="text-xs text-gray-400">
                          En esta sección se agregarán opciones avanzadas de visualización en el futuro.
                        </p>
                      </div>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>

      {/* Sección de Apariencia de Vectores */}
      <div>
        <Disclosure defaultOpen>
          {({ open }) => (
            <div className="disclosure-wrapper rounded-lg bg-card/50 overflow-hidden">
              <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left focus:outline-none focus-visible:ring focus-visible:ring-primary">
                <h3 className="text-base font-semibold tracking-tight">Apariencia de Vectores</h3>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    open ? "transform rotate-180" : ""
                  )}
                  aria-hidden="true"
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel>
                  <div>
                    <Separator className="my-0" />
                    <div className="p-4 space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label className="font-medium text-xs">Forma del Vector</Label>
                          <ButtonGroup
                            options={[
                              { label: 'Línea', value: 'line' },
                              { label: 'Flecha', value: 'arrow' },
                              { label: 'Punto', value: 'dot' },
                              { label: 'Triángulo', value: 'triangle' },
                              { label: 'Semicírculo', value: 'semicircle' },
                            ]}
                            value={vectorShape}
                            onChange={(value) => setVectorSettings({ ...vectorSettings, vectorShape: value as VectorShape })}
                          />
                        </div>

                        {vectorShape === 'userSvg' && (
                          <div className="p-3 border rounded-md space-y-2 mt-2 border-border">
                            <Label>Código SVG del Usuario</Label>
                            <Textarea 
                              value={userSvg || ''} 
                              onChange={e => setGridSettings({
                                ...gridSettings,
                                userSvg: e.target.value
                              })} 
                              placeholder="<svg viewBox='0 0 10 10'><path d='...' fill='currentColor'/></svg>" 
                              rows={5}
                            />
                          </div>
                        )}

                        <LabeledSlider 
                          label="Longitud (px)"
                          value={[typeof vectorLength === 'number' ? vectorLength : 30]} 
                          max={600} 
                          min={1} 
                          step={1} 
                          precision={0} 
                          onValueChange={(val) => handleVectorSliderChange('vectorLength', val)}
                        />
                        
                        <LabeledSlider 
                          label="Ancho del trazo (px)"
                          value={[typeof vectorWidth === 'number' ? vectorWidth : 2]} 
                          max={20} 
                          min={0.5} 
                          step={0.5} 
                          precision={1} 
                          onValueChange={(val) => handleVectorSliderChange('vectorWidth', val)}
                        />
                        
                        <div className="space-y-3">
                          <Label className="font-medium text-xs">Color del Vector</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="color" 
                              value={typeof vectorColor === 'string' ? vectorColor : '#ffffff'} 
                              onChange={(e) => handleVectorChange('vectorColor', e.target.value)} 
                              className="h-10 w-12 p-1" 
                              disabled={typeof vectorColor !== 'string'}
                            />
                            <Input 
                              type="text" 
                              value={typeof vectorColor === 'string' ? vectorColor : '(Complejo)'} 
                              onChange={(e) => handleVectorChange('vectorColor', e.target.value)} 
                              placeholder="#ffffff" 
                              className="flex-1" 
                              disabled={typeof vectorColor !== 'string'}
                            />
                          </div>
                          {typeof vectorColor !== 'string' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Color definido por función o gradiente.
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label className="font-medium text-xs">Terminación de trazo</Label>
                          <ButtonGroup
                            value={strokeLinecap}
                            onChange={(value) => handleVectorChange('strokeLinecap', value)}
                            options={[
                              { value: 'round', label: 'Redonda' },
                              { value: 'butt', label: 'Plana' },
                              { value: 'square', label: 'Cuadrada' }
                            ]}
                            size="sm"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="font-medium text-xs">Punto de rotación</Label>
                          <ButtonGroup
                            value={rotationOrigin}
                            onChange={(value) => handleVectorChange('rotationOrigin', value)}
                            options={[
                              { value: 'start', label: 'Inicio' },
                              { value: 'center', label: 'Centro' },
                              { value: 'end', label: 'Final' }
                            ]}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>
    </div>
  ), [
    gridSettings, 
    vectorLength,
    vectorWidth,
    vectorColor,
    vectorShape,
    strokeLinecap,
    rotationOrigin,
    userSvg,
    setGridSettings,
    setVectorSettings,
    vectorSettings,
    handleVectorChange,
    handleVectorSliderChange,
    autoMode,
    handleAutoModeChange
  ]);

  return renderContent;
}
