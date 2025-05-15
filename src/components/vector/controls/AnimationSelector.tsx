'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  AnimationType,
  DirectionalFlowProps,
  FlockingProps,
  VortexProps,
  MouseInteractionProps
} from '../core/animations';

interface AnimationSelectorProps {
  value: {
    animationType: AnimationType;
    animationProps: Record<string, unknown>;
  };
  onChange: (value: {
    animationType: AnimationType;
    animationProps: Record<string, unknown>;
  }) => void;
}

export function AnimationSelector({ value, onChange }: AnimationSelectorProps) {
  // Estado local para propiedades específicas de cada tipo de animación
  const [directionalProps, setDirectionalProps] = useState<DirectionalFlowProps>({
    flowAngle: 45,
    turbulence: 0.3,
    flowSpeed: 1.0,
  });
  
  const [vortexProps, setVortexProps] = useState<VortexProps>({
    strength: 0.05,
    radiusFalloff: 2,
    swirlDirection: 'clockwise'
  });
  
  const [flockingProps, setFlockingProps] = useState<FlockingProps>({
    perceptionRadius: 100,
    separationForce: 1.5,
    alignmentForce: 1.0,
    cohesionForce: 0.8
  });
  
  // Añadir estado para propiedades de interacción con el ratón
  const [mouseInteractionProps, setMouseInteractionProps] = useState<MouseInteractionProps>({
    interactionRadius: 150,
    effectType: 'attract',
    effectStrength: 1.0,
    falloffFactor: 1.0
  });

  // Manejar cambio de tipo de animación
  const handleAnimationTypeChange = (type: AnimationType) => {
    let props = {};
    
    // Cargar propiedades específicas según el tipo seleccionado
    switch (type) {
      case 'directionalFlow':
        props = directionalProps;
        break;
      case 'vortex':
        props = vortexProps;
        break;
      case 'flocking':
        props = flockingProps;
        break;
      case 'mouseInteraction':
        props = mouseInteractionProps;
        break;
      // Otros tipos tendrán sus propias propiedades
    }
    
    onChange({
      animationType: type,
      animationProps: props
    });
  };

  // Actualizar propiedades según el tipo actual
  const updateAnimationProps = (props: Record<string, unknown>) => {
    onChange({
      animationType: value.animationType,
      animationProps: {
        ...value.animationProps,
        ...props
      }
    });

    // Actualizar también el estado local correspondiente
    if (value.animationType === 'directionalFlow') {
      setDirectionalProps(prevProps => ({ ...prevProps, ...props }));
    } else if (value.animationType === 'vortex') {
      setVortexProps(prevProps => ({ ...prevProps, ...props }));
    } else if (value.animationType === 'flocking') {
      setFlockingProps(prevProps => ({ ...prevProps, ...props }));
    } else if (value.animationType === 'mouseInteraction') {
      setMouseInteractionProps(prevProps => ({ ...prevProps, ...props }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Animación</Label>
        <Select
          value={value.animationType}
          onValueChange={(val) => handleAnimationTypeChange(val as AnimationType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo de animación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin animación</SelectItem>
            <SelectItem value="staticAngle">Ángulo estático</SelectItem>
            <SelectItem value="smoothWaves">Ondas suaves</SelectItem>
            <SelectItem value="directionalFlow">Flujo direccional</SelectItem>
            <SelectItem value="vortex">Vórtice</SelectItem>
            <SelectItem value="flocking">Comportamiento de bandada</SelectItem>
            <SelectItem value="mouseInteraction">Interacción con el ratón</SelectItem>
            <SelectItem value="randomLoop">Cambios aleatorios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Controles específicos según el tipo de animación */}
      {value.animationType === 'directionalFlow' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Ángulo de flujo</Label>
              <span className="text-xs text-muted-foreground">{directionalProps.flowAngle}°</span>
            </div>
            <Slider
              min={0}
              max={360}
              step={5}
              value={[directionalProps.flowAngle as number || 0]}
              onValueChange={(values) => updateAnimationProps({ flowAngle: values[0] })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Turbulencia</Label>
              <span className="text-xs text-muted-foreground">{directionalProps.turbulence}</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[directionalProps.turbulence as number || 0]}
              onValueChange={(values) => updateAnimationProps({ turbulence: values[0] })}
            />
          </div>
        </div>
      )}

      {value.animationType === 'vortex' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Intensidad</Label>
              <span className="text-xs text-muted-foreground">{vortexProps.strength}</span>
            </div>
            <Slider
              min={0.01}
              max={0.2}
              step={0.01}
              value={[vortexProps.strength as number || 0.05]}
              onValueChange={(values) => updateAnimationProps({ strength: values[0] })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Select
              value={vortexProps.swirlDirection as string}
              onValueChange={(val) => updateAnimationProps({ swirlDirection: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dirección de giro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clockwise">Sentido horario</SelectItem>
                <SelectItem value="counterclockwise">Sentido antihorario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {value.animationType === 'flocking' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Radio de percepción</Label>
              <span className="text-xs text-muted-foreground">{flockingProps.perceptionRadius}px</span>
            </div>
            <Slider
              min={20}
              max={200}
              step={5}
              value={[flockingProps.perceptionRadius as number || 100]}
              onValueChange={(values) => updateAnimationProps({ perceptionRadius: values[0] })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Fuerza de separación</Label>
              <span className="text-xs text-muted-foreground">{flockingProps.separationForce}</span>
            </div>
            <Slider
              min={0}
              max={3}
              step={0.1}
              value={[flockingProps.separationForce as number || 1.5]}
              onValueChange={(values) => updateAnimationProps({ separationForce: values[0] })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Fuerza de cohesión</Label>
              <span className="text-xs text-muted-foreground">{flockingProps.cohesionForce}</span>
            </div>
            <Slider
              min={0}
              max={3}
              step={0.1}
              value={[flockingProps.cohesionForce as number || 0.8]}
              onValueChange={(values) => updateAnimationProps({ cohesionForce: values[0] })}
            />
          </div>
        </div>
      )}

      {value.animationType === 'staticAngle' && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Ángulo</Label>
            <span className="text-xs text-muted-foreground">{(value.animationProps.angle as number) || 0}°</span>
          </div>
          <Slider
            min={0}
            max={360}
            step={5}
            value={[value.animationProps.angle as number || 0]}
            onValueChange={(values) => updateAnimationProps({ angle: values[0] })}
          />
        </div>
      )}

      {value.animationType === 'randomLoop' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Intervalo (ms)</Label>
              <span className="text-xs text-muted-foreground">{(value.animationProps.intervalMs as number) || 2000}ms</span>
            </div>
            <Slider
              min={500}
              max={5000}
              step={100}
              value={[value.animationProps.intervalMs as number || 2000]}
              onValueChange={(values) => updateAnimationProps({ intervalMs: values[0] })}
            />
          </div>
        </div>
      )}

      {value.animationType === 'mouseInteraction' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tipo de efecto</Label>
            <Select
              value={mouseInteractionProps.effectType as string}
              onValueChange={(val) => updateAnimationProps({ effectType: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de interacción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attract">Atracción</SelectItem>
                <SelectItem value="repel">Repulsión</SelectItem>
                <SelectItem value="swirl">Remolino</SelectItem>
                <SelectItem value="align">Alineación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Radio de interacción</Label>
              <span className="text-xs text-muted-foreground">{mouseInteractionProps.interactionRadius}px</span>
            </div>
            <Slider
              min={50}
              max={300}
              step={10}
              value={[mouseInteractionProps.interactionRadius as number || 150]}
              onValueChange={(values) => updateAnimationProps({ interactionRadius: values[0] })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Intensidad del efecto</Label>
              <span className="text-xs text-muted-foreground">{mouseInteractionProps.effectStrength}</span>
            </div>
            <Slider
              min={0.1}
              max={3}
              step={0.1}
              value={[mouseInteractionProps.effectStrength as number || 1.0]}
              onValueChange={(values) => updateAnimationProps({ effectStrength: values[0] })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Factor de atenuación</Label>
              <span className="text-xs text-muted-foreground">{mouseInteractionProps.falloffFactor}</span>
            </div>
            <Slider
              min={0.1}
              max={3}
              step={0.1}
              value={[mouseInteractionProps.falloffFactor as number || 1.0]}
              onValueChange={(values) => updateAnimationProps({ falloffFactor: values[0] })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
