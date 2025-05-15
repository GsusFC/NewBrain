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
}

const SliderWithLabel = React.forwardRef<HTMLDivElement, SliderWithLabelProps>(
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
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
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

SliderWithLabel.displayName = "SliderWithLabel";

export { SliderWithLabel };
