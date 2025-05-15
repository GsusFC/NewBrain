"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ColorPicker } from "./color-picker";
import { GradientStop } from "../vector/core/color-types";

interface GradientPickerProps {
  angle: number;
  stops: GradientStop[];
  onAngleChange: (angle: number) => void;
  onStopsChange: (stops: GradientStop[]) => void;
  disabled?: boolean;
  className?: string;
}

export function GradientPicker({
  angle,
  stops,
  onAngleChange,
  onStopsChange,
  disabled = false,
  className,
}: GradientPickerProps) {
  // Referencia para el contenedor del gradiente
  const gradientContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Estado para el arrastre de marcadores
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);
  
  // Ordenar stops por posición
  const sortedStops = React.useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  );

  // Estilo para la previsualización del gradiente
  const gradientStyle = React.useMemo(() => {
    const stopString = sortedStops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ");
    return {
      background: `linear-gradient(${angle}deg, ${stopString})`,
    };
  }, [sortedStops, angle]);

  // Manejadores para el arrastre de marcadores
  const handleMarkerDragStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (draggingIndex === null || !gradientContainerRef.current) return;

      const container = gradientContainerRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

      const newStops = [...sortedStops];
      newStops[draggingIndex] = {
        ...newStops[draggingIndex],
        position: Math.round(position),
      };
      onStopsChange(newStops);
    },
    [draggingIndex, sortedStops, onStopsChange]
  );

  const handleMouseUp = React.useCallback(() => {
    setDraggingIndex(null);
  }, []);

  // Añadir/eliminar event listeners para el arrastre
  React.useEffect(() => {
    if (draggingIndex !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingIndex, handleMouseMove, handleMouseUp]);

  // Manejadores para actualizar el gradiente
  const updateStop = (index: number, field: "color" | "position", value: string | number) => {
    const newStops = [...stops];
    newStops[index] = {
      ...newStops[index],
      [field]: value,
    };
    onStopsChange(newStops);
  };

  const addStop = () => {
    if (stops.length >= 5) return;
    const lastStop = sortedStops[sortedStops.length - 1];
    const newPosition = Math.min(100, lastStop.position + 20);
    onStopsChange([...stops, { color: lastStop.color, position: newPosition }]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    onStopsChange(stops.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-4">
        <div>
          <Label>Ángulo</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[0, 45, 90, 135].map((deg) => (
              <Button
                key={deg}
                variant={angle === deg ? "default" : "outline"}
                className="p-0 h-8"
                onClick={() => onAngleChange(deg)}
                disabled={disabled}
              >
                {deg}°
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Previsualización</Label>
          <div
            ref={gradientContainerRef}
            className="relative h-8 rounded"
            style={gradientStyle}
          >
            {sortedStops.map((stop, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5",
                  "flex items-center justify-center",
                  draggingIndex === index
                    ? "cursor-grabbing z-20"
                    : "cursor-grab hover:z-10"
                )}
                style={{
                  left: `${stop.position}%`,
                }}
                onMouseDown={(e) => handleMarkerDragStart(index, e)}
                disabled={disabled}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: stop.color }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Paradas de color</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addStop}
            disabled={disabled || stops.length >= 5}
          >
            Añadir
          </Button>
        </div>

        {sortedStops.map((stop, index) => (
          <div key={index} className="flex gap-2 items-start">
            <ColorPicker
              color={stop.color}
              onChange={(color) => updateStop(index, "color", color)}
              disabled={disabled}
              className="flex-1"
            />
            <div className="w-20">
              <Input
                type="number"
                min={0}
                max={100}
                value={stop.position}
                onChange={(e) =>
                  updateStop(index, "position", parseInt(e.target.value, 10))
                }
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={disabled}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeStop(index)}
              disabled={disabled || stops.length <= 2}
              className="px-2 h-10"
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
