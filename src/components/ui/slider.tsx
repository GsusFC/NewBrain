"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

// Versión optimizada para evitar bucles de actualización
interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
}

const SliderComponent = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, value = [0], onValueChange, onValueCommit, ...props }, ref) => {
  // Estado interno controlado para prevenir bucles de actualización
  const [internalValue, setInternalValue] = React.useState(value || [0]);
  const isInternalChangeRef = React.useRef(false);

  // Sincronizar el valor interno cuando cambia el valor de prop, solo si no es un cambio interno
  React.useEffect(() => {
    const currentValue = Array.isArray(value) ? value : [0];
    if (!isInternalChangeRef.current && JSON.stringify(currentValue) !== JSON.stringify(internalValue)) {
      setInternalValue(currentValue);
    }
    isInternalChangeRef.current = false;
  }, [value, internalValue]);

  // Store timeout ID in a ref for cleanup
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Controlled change handler
  const handleValueChange = React.useCallback((newValue: number[]) => {
    isInternalChangeRef.current = true;
    setInternalValue(newValue);

    if (onValueChange) {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Use setTimeout to decouple from the current render cycle
      timeoutRef.current = setTimeout(() => {
        onValueChange(newValue);
      }, 0);
    }
  }, [onValueChange]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={internalValue}
      onValueChange={handleValueChange}
      onValueCommit={onValueCommit}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative h-2 w-full grow overflow-hidden rounded-full bg-gray-600",
          "transition-colors duration-200 ease-in-out"
        )}
      >
        <SliderPrimitive.Range className={cn(
          "absolute h-full bg-primary/90",
          "transition-all duration-200 ease-out"
        )} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-lg",
          "transition-all duration-150 ease-out",
          "hover:bg-primary/10 hover:scale-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "data-[dragging=true]:bg-primary/80 data-[dragging=true]:border-primary/90 data-[dragging=true]:scale-110",
          "active:scale-110 active:duration-100"
        )}
      />
    </SliderPrimitive.Root>
  );
});

// Optimized with memoization to prevent unnecessary re-renders
const Slider = React.memo(
  SliderComponent,
  (prevProps, nextProps) => {
    // Compare relevant props that affect rendering
    if (prevProps.disabled !== nextProps.disabled) return false;
    if (prevProps.min !== nextProps.min) return false;
    if (prevProps.max !== nextProps.max) return false;
    if (prevProps.step !== nextProps.step) return false;
    if (prevProps.orientation !== nextProps.orientation) return false;
    if (prevProps.dir !== nextProps.dir) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.style !== nextProps.style) return false;
    
    // Deep comparison of value array
    const prevValue = prevProps.value || [];
    const nextValue = nextProps.value || [];
    if (prevValue.length !== nextValue.length) return false;
    for (let i = 0; i < prevValue.length; i++) {
      if (prevValue[i] !== nextValue[i]) return false;
    }
    
    // Check if any other props have changed
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    // Skip internal React props and already compared props
    const skipProps = new Set([
      'value', 'onValueChange', 'onValueCommit', 'children',
      'ref', 'key', 'disabled', 'min', 'max', 'step', 
      'orientation', 'dir', 'className', 'style'
    ]);
    
    for (const key of prevKeys) {
      if (!skipProps.has(key) && prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  }
);

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
