'use client';

import React from 'react';
import { useVectorControl } from './VectorControlContext';
import {
  SliderControl,
  SelectControl,
  SwitchControl,
  ColorPicker,
  ResetButton,
} from './VectorControlComponents';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

export function VectorControlPanel() {
  const { settings, updateSettings, resetSettings } = useVectorControl();

  return (
    <div className="w-80 h-full bg-sidebar text-sidebar-foreground p-4 overflow-y-auto border-r border-sidebar-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Propiedades</h2>
        <ResetButton onClick={resetSettings} className="w-auto" />
      </div>

      <Accordion type="single" collapsible defaultValue="geometry" className="space-y-4">
        {/* Sección de Geometría */}
        <AccordionItem value="geometry" className="border-b border-sidebar-border pb-2">
          <AccordionTrigger className="py-2 hover:no-underline font-medium">
            Geometría
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <SliderControl
              label="Longitud base"
              value={settings.baseLength}
              onChange={(value) => updateSettings({ baseLength: value })}
              min={10}
              max={100}
              step={5}
            />

            <SliderControl
              label="Grosor"
              value={settings.baseWidth}
              onChange={(value) => updateSettings({ baseWidth: value })}
              min={0.5}
              max={10}
              step={0.5}
            />

            <SelectControl
              label="Forma"
              value={settings.shape}
              onChange={(value) => updateSettings({ shape: value as any })}
              options={[
                { value: 'line', label: 'Línea' },
                { value: 'arrow', label: 'Flecha' },
                { value: 'dot', label: 'Punto' },
                { value: 'custom', label: 'Personalizado' },
              ]}
            />

            <SelectControl
              label="Origen de rotación"
              value={settings.rotationOrigin}
              onChange={(value) => updateSettings({ rotationOrigin: value as any })}
              options={[
                { value: 'start', label: 'Inicio' },
                { value: 'center', label: 'Centro' },
                { value: 'end', label: 'Final' },
              ]}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Sección de Apariencia */}
        <AccordionItem value="appearance" className="border-b border-sidebar-border pb-2">
          <AccordionTrigger className="py-2 hover:no-underline font-medium">
            Apariencia
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <ColorPicker
              label="Color"
              value={settings.color}
              onChange={(value) => updateSettings({ color: value })}
            />

            <SelectControl
              label="Estilo de línea"
              value={settings.strokeLinecap}
              onChange={(value) => updateSettings({ strokeLinecap: value as any })}
              options={[
                { value: 'butt', label: 'Plano' },
                { value: 'round', label: 'Redondeado' },
                { value: 'square', label: 'Cuadrado' },
              ]}
            />

            <SliderControl
              label="Opacidad"
              value={settings.opacity}
              onChange={(value) => updateSettings({ opacity: value })}
              min={0}
              max={1}
              step={0.1}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Sección de Comportamiento */}
        <AccordionItem value="behavior" className="border-b border-sidebar-border pb-2">
          <AccordionTrigger className="py-2 hover:no-underline font-medium">
            Comportamiento
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <SwitchControl
              label="Interactividad"
              checked={settings.interactionEnabled}
              onCheckedChange={(checked) => updateSettings({ interactionEnabled: checked })}
            />

            <SwitchControl
              label="Culling espacial"
              checked={settings.cullingEnabled}
              onCheckedChange={(checked) => updateSettings({ cullingEnabled: checked })}
            />

            <SwitchControl
              label="Modo debug"
              checked={settings.debugMode}
              onCheckedChange={(checked) => updateSettings({ debugMode: checked })}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Separator className="my-6 bg-sidebar-border" />
      
      <div className="text-xs text-sidebar-foreground/50 text-center">
        <p>VectorGrid Controls v1.0</p>
        <p className="mt-1">Configuración de propiedades estáticas</p>
      </div>
    </div>
  );
}
