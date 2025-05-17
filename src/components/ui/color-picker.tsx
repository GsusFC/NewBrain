"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  presetColors?: string[];
}

export function ColorPicker({
  color,
  onChange,
  disabled = false,
  className,
  label,
  presetColors = [
    "var(--primary)",
    "#f54a80", // Rosa
    "#4af580", // Verde
    "#f5804a", // Naranja
    "#804af5", // Púrpura
    "#4a80f5", // Azul
    "#f5f54a", // Amarillo
    "#4af5f5", // Cian
    "#c0c0c0", // Plateado (mejor que blanco puro para tema oscuro)
    "#303030", // Gris oscuro (mejor que negro puro para tema oscuro)
  ],
}: ColorPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !color && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded-md ring-1 ring-inset ring-border transition-colors duration-200"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1">{color}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="shrink-0">
                <div className="w-9 h-9 overflow-hidden rounded-md ring-1 ring-inset ring-border shadow-sm hover:ring-primary/50 transition-colors duration-200">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-11 h-11 cursor-pointer"
                    style={{ margin: "-2px 0 0 -2px" }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 pt-2">
              {presetColors.map((presetColor, index) => (
                <Button
                  key={`${presetColor}-${index}`}
                  variant="outline"
                  className="w-full p-0 aspect-square transition-all duration-200 hover:scale-110 hover:shadow-md"
                  onClick={() => onChange(presetColor)}
                >
                  <div
                    className="w-full h-full rounded-sm transition-colors duration-150"
                    style={{ backgroundColor: presetColor }}
                  />
                  <span className="sr-only">Elegir color {presetColor}</span>
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
