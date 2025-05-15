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
    "#f54a80",
    "#4af580",
    "#f5804a",
    "#804af5",
    "#f5f54a",
    "#4af5f5",
    "#ffffff",
    "#000000",
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
                className="h-4 w-4 rounded ring-1 ring-inset ring-slate-900/10"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1">{color}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
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
                <div className="w-8 h-8 overflow-hidden rounded-md ring-1 ring-inset ring-slate-900/10">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 cursor-pointer"
                    style={{ margin: "-2px 0 0 -2px" }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {presetColors.map((presetColor, index) => (
                <Button
                  key={`${presetColor}-${index}`}
                  variant="outline"
                  className="w-full p-0 aspect-square"
                  onClick={() => onChange(presetColor)}
                >
                  <div
                    className="w-full h-full rounded-sm"
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
