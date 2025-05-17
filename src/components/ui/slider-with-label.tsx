"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SliderWithLabelProps {
  label: string;
  value: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: () => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  minLabel?: string;
  maxLabel?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  "aria-label"?: string;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

const SliderWithLabelComponent = React.forwardRef<HTMLDivElement, SliderWithLabelProps>(
  (
    {
      label,
      value,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      className,
      minLabel,
      maxLabel,
      showValue = true,
      formatValue = (val) => val.toString(),
      disabled = false,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      props.onPointerDown?.(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      props.onPointerUp?.(e);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
      props.onPointerLeave?.(e);
    };

    return (
      <div 
        ref={ref} 
        className={cn("space-y-2", className)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <div className="flex justify-between items-center">
          <Label htmlFor={label}>{label}</Label>
          {showValue && (
            <span className="text-sm text-muted-foreground">
              {formatValue(value[0])}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {minLabel && (
            <span className="text-sm text-muted-foreground">{minLabel}</span>
          )}
          <Slider
            id={label}
            min={min}
            max={max}
            step={step}
            value={value}
            onValueChange={onValueChange}
            onValueCommit={onValueCommit}
            className="flex-1"
            disabled={disabled}
            aria-label={ariaLabel}
            {...props}
          />
          {maxLabel && (
            <span className="text-sm text-muted-foreground">{maxLabel}</span>
          )}
        </div>
      </div>
    );
  }
);

SliderWithLabelComponent.displayName = "SliderWithLabel";

// Función de comparación personalizada para React.memo
const areEqual = (prevProps: SliderWithLabelProps, nextProps: SliderWithLabelProps) => {
  // Comparar valores primitivos directamente
  if (prevProps.label !== nextProps.label) return false;
  if (prevProps.min !== nextProps.min) return false;
  if (prevProps.max !== nextProps.max) return false;
  if (prevProps.step !== nextProps.step) return false;
  if (prevProps.disabled !== nextProps.disabled) return false;
  if (prevProps.showValue !== nextProps.showValue) return false;
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps.minLabel !== nextProps.minLabel) return false;
  if (prevProps.maxLabel !== nextProps.maxLabel) return false;
  
  // Comparar arrays de valores
  if (prevProps.value.length !== nextProps.value.length) return false;
  for (let i = 0; i < prevProps.value.length; i++) {
    if (prevProps.value[i] !== nextProps.value[i]) return false;
  }
  
  // Si llegamos aquí, las props son iguales
  return true;
};

const SliderWithLabel = React.memo(SliderWithLabelComponent, areEqual);
SliderWithLabel.displayName = "SliderWithLabel";

export { SliderWithLabel };
