'use client';

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SliderField } from '@/components/ui/slider-field';
import { 
  AnimationType,
  DirectionalFlowProps,
  FlockingProps,
  VortexProps,
  MouseInteractionProps
} from '../core/animations';

// Tipo base con propiedades comunes a todas las animaciones
interface BaseAnimationProps extends Record<string, unknown> {
  intervalMs?: number;
  transitionDurationFactor?: number;
}

// Mapa de tipos específicos para cada animación
interface AnimationSpecificPropsMap {
  directionalFlow: DirectionalFlowProps;
  vortex: VortexProps;
  flocking: FlockingProps;
  mouseInteraction: MouseInteractionProps;
  randomLoop: { intervalMs: number; transitionDurationFactor: number };
  none: {};
  smoothWaves: {};
  seaWaves: {};
  perlinFlow: {};
  lissajous: {};
  centerPulse: {};
}

// Tipo que combina las propiedades específicas con las comunes
type AnimationProps<T extends AnimationType = AnimationType> = AnimationSpecificPropsMap[T] & BaseAnimationProps;

// Tipo unión que incluye todas las animaciones
type AnimationPropsUnion = {
  [K in AnimationType]: AnimationProps<K>;
}[AnimationType];

interface AnimationSelectorProps {
  value: {
    animationType: AnimationType;
    animationProps: AnimationPropsUnion;
  };
  onChange: (value: {
    animationType: AnimationType;
    animationProps: AnimationPropsUnion;
  }) => void;
}

export function AnimationSelector({ value, onChange }: AnimationSelectorProps) {
  // Estado local para propiedades específicas de cada tipo de animación
  const [directionalProps, setDirectionalProps] = useState<DirectionalFlowProps>({
    flowAngle: 45,
    turbulence: 0.3,
    flowSpeed: 1.0
  });
  
  const [vortexProps, setVortexProps] = useState<VortexProps>({
    strength: 0.05,
    radiusFalloff: 2,
    swirlDirection: 'clockwise',
    vortexCenterX: 0.5,
    vortexCenterY: 0.5
  });
  
  const [flockingProps, setFlockingProps] = useState<FlockingProps>({
    perceptionRadius: 100,
    separationForce: 1.5,
    alignmentForce: 1.0,
    cohesionForce: 0.8,
    maxSpeed: 2.0,
    targetSeekingForce: 0.5,
    targetX: 0.5,
    targetY: 0.5
  });
  
  const [mouseInteractionProps, setMouseInteractionProps] = useState<MouseInteractionProps>({
    interactionRadius: 150,
    effectType: 'attract',
    effectStrength: 1.0,
    falloffFactor: 1.0
  });

  // Sincronizar estado local cuando cambian las props del padre
  useEffect(() => {
    if (value.animationType === 'directionalFlow') {
      setDirectionalProps(prev => ({
        ...prev,
        ...(value.animationProps as DirectionalFlowProps)
      }));
    } else if (value.animationType === 'vortex') {
      setVortexProps(prev => ({
        ...prev,
        ...(value.animationProps as VortexProps)
      }));
    } else if (value.animationType === 'flocking') {
      setFlockingProps(prev => ({
        ...prev,
        ...(value.animationProps as FlockingProps)
      }));
    } else if (value.animationType === 'mouseInteraction') {
      setMouseInteractionProps(prev => ({
        ...prev,
        ...(value.animationProps as MouseInteractionProps)
      }));
    }
  }, [value.animationType, value.animationProps]);

  // Valores por defecto para cada tipo de animación
  const DEFAULT_PROPS: Record<string, AnimationProps> = {
    directionalFlow: {
      flowAngle: 45,
      turbulence: 0.3,
      flowSpeed: 1.0
    },
    vortex: {
      strength: 0.05,
      radiusFalloff: 2,
      swirlDirection: 'clockwise',
      vortexCenterX: 0.5,
      vortexCenterY: 0.5
    },
    flocking: {
      perceptionRadius: 100,
      separationForce: 1.5,
      alignmentForce: 1.0,
      cohesionForce: 0.8,
      maxSpeed: 2.0,
      targetSeekingForce: 0.5,
      targetX: 0.5,
      targetY: 0.5
    },
    mouseInteraction: {
      interactionRadius: 150,
      effectType: 'attract',
      effectStrength: 1.0,
      falloffFactor: 1.0
    },
    randomLoop: {
      intervalMs: 2000,
      transitionDurationFactor: 0.5
    },
    // Tipos sin propiedades adicionales
    none: {},
    smoothWaves: {},
    seaWaves: {},
    perlinFlow: {},
    lissajous: {},
    centerPulse: {}
  };

  // Manejar cambio de tipo de animación
  const handleAnimationTypeChange = useCallback((type: AnimationType) => {
    // Obtener propiedades por defecto para el tipo seleccionado
    const defaultProps = DEFAULT_PROPS[type] ?? {};
    
    // Si el tipo no está en la lista de tipos conocidos, mostrar advertencia
    if (!(type in DEFAULT_PROPS)) {
      console.warn(`Tipo de animación no manejado: ${type}`);
    }
    
    // Usar las propiedades actuales del tipo si existen, de lo contrario usar las predeterminadas
    let props: AnimationProps;
    switch (type) {
      case 'directionalFlow':
        props = { ...defaultProps, ...directionalProps };
        break;
      case 'vortex':
        props = { ...defaultProps, ...vortexProps };
        break;
      case 'flocking':
        props = { ...defaultProps, ...flockingProps };
        break;
      case 'mouseInteraction':
        props = { ...defaultProps, ...mouseInteractionProps };
        break;
      case 'randomLoop':
        // Para randomLoop, mantener las propiedades específicas si existen
        props = { ...defaultProps, ...(value.animationType === 'randomLoop' ? value.animationProps : {}) };
        break;
      default:
        // Para tipos sin estado local específico, usar solo las propiedades por defecto
        props = { ...defaultProps };
    }
    
    // Notificar el cambio con las propiedades limpias
    onChange({
      animationType: type,
      animationProps: props
    });
  }, [directionalProps, vortexProps, flockingProps, mouseInteractionProps, value.animationType, value.animationProps, onChange]);

  // Actualizar propiedades según el tipo actual
  const updateAnimationProps = useCallback((props: Record<string, unknown>) => {
    const newProps = {
      ...value.animationProps,
      ...props
    };

    onChange({
      animationType: value.animationType,
      animationProps: newProps
    });

    // Actualizar también el estado local correspondiente
    switch (value.animationType) {
      case 'directionalFlow':
        setDirectionalProps(prev => ({ ...prev, ...props } as DirectionalFlowProps));
        break;
      case 'vortex':
        setVortexProps(prev => ({ ...prev, ...props } as VortexProps));
        break;
      case 'flocking':
        setFlockingProps(prev => ({ ...prev, ...props } as FlockingProps));
        break;
      case 'mouseInteraction':
        setMouseInteractionProps(prev => ({ ...prev, ...props } as MouseInteractionProps));
        break;
      default:
        // No hacer nada para otros tipos
        break;
    }
  }, [value.animationType, value.animationProps, onChange]);

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
            <SelectItem value="smoothWaves">Ondas suaves</SelectItem>
            <SelectItem value="seaWaves">Ondas marinas</SelectItem>
            <SelectItem value="directionalFlow">Flujo direccional</SelectItem>
            <SelectItem value="vortex">Vórtice</SelectItem>
            <SelectItem value="flocking">Comportamiento de bandada</SelectItem>
            <SelectItem value="mouseInteraction">Interacción con el ratón</SelectItem>
            <SelectItem value="perlinFlow">Flujo Perlin</SelectItem>
            <SelectItem value="randomLoop">Cambios aleatorios</SelectItem>
            <SelectItem value="lissajous">Curvas Lissajous</SelectItem>
            <SelectItem value="centerPulse">Pulso central</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Controles específicos según el tipo de animación */}
      {value.animationType === 'directionalFlow' && (
        <div className="space-y-3">
          <SliderField
            label="Ángulo de flujo"
            value={(directionalProps.flowAngle as number) ?? 45}
            min={0}
            max={360}
            step={5}
            unit="°"
            onChange={(value) => updateAnimationProps({ flowAngle: value })}
          />
          <SliderField
            label="Turbulencia"
            value={(directionalProps.turbulence as number) ?? 0.3}
            min={0}
            max={1}
            step={0.05}
            onChange={(value) => updateAnimationProps({ turbulence: value })}
          />
          <SliderField
            label="Velocidad de flujo"
            value={(directionalProps.flowSpeed as number) ?? 1.0}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(value) => updateAnimationProps({ flowSpeed: value })}
          />
        </div>
      )}

      {value.animationType === 'vortex' && (
        <div className="space-y-3">
          <SliderField
            label="Fuerza"
            value={(vortexProps.strength as number) ?? 0.05}
            min={0.01}
            max={0.2}
            step={0.01}
            onChange={(value) => updateAnimationProps({ strength: value })}
          />
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
          <SliderField
            label="Radio de caída"
            value={vortexProps.radiusFalloff as number || 2}
            min={1}
            max={5}
            step={0.1}
            onChange={(value) => updateAnimationProps({ radiusFalloff: value })}
          />
        </div>
      )}

      {value.animationType === 'flocking' && (
        <div className="space-y-3">
          <SliderField
            label="Radio de percepción"
            value={flockingProps.perceptionRadius as number || 100}
            min={20}
            max={200}
            step={5}
            onChange={(value) => updateAnimationProps({ perceptionRadius: value })}
          />
          <SliderField
            label="Fuerza de separación"
            value={flockingProps.separationForce as number || 1.5}
            min={0}
            max={3}
            step={0.1}
            onChange={(value) => updateAnimationProps({ separationForce: value })}
          />
          <SliderField
            label="Fuerza de cohesión"
            value={flockingProps.cohesionForce as number || 0.8}
            min={0}
            max={3}
            step={0.1}
            onChange={(value) => updateAnimationProps({ cohesionForce: value })}
          />
        </div>
      )}

      {/* Se eliminó el control para staticAngle ya que no es un tipo válido en el sistema modular */}

      {value.animationType === 'randomLoop' && (
        <div className="space-y-3">
          <SliderField
            label="Intervalo (ms)"
            value={(value.animationProps.intervalMs as number) || 2000}
            min={500}
            max={5000}
            step={100}
            onChange={(value) => updateAnimationProps({ intervalMs: value })}
          />
          <SliderField
            label="Duración de transición"
            value={(value.animationProps.transitionDurationFactor as number) || 0.5}
            min={0.1}
            max={0.9}
            step={0.05}
            onChange={(value) => updateAnimationProps({ transitionDurationFactor: value })}
          />
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
          <SliderField
            label="Radio de interacción"
            value={mouseInteractionProps.interactionRadius as number || 150}
            min={50}
            max={300}
            step={10}
            onChange={(value) => updateAnimationProps({ interactionRadius: value })}
          />
          <SliderField
            label="Fuerza del efecto"
            value={mouseInteractionProps.effectStrength as number || 1.0}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(value) => updateAnimationProps({ effectStrength: value })}
          />
          <SliderField
            label="Factor de caída"
            value={mouseInteractionProps.falloffFactor as number || 1.0}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(value) => updateAnimationProps({ falloffFactor: value })}
          />
        </div>
      )}
    </div>
  );
}
