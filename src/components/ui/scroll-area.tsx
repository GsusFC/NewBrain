"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

// Versión optimizada de ScrollArea para evitar ciclos infinitos de actualización
const ScrollAreaComponent = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  // Preparamos el contenido con React.useMemo para evitar renderizados innecesarios
  const content = React.useMemo(() => children, [children]);
  
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {content}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});

// Versión optimizada del ScrollBar con memoización para evitar renderizados innecesarios
const ScrollBarComponent = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => {
  // Cachear los cálculos de clase para evitar recrear objetos en cada render
  const scrollbarClassName = React.useMemo(() => {
    return cn(
      "flex touch-none select-none transition-colors hover:bg-accent/10",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    );
  }, [orientation, className]);
  
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      {...props}
      ref={ref}
      orientation={orientation}
      className={scrollbarClassName}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb 
        className="relative flex-1 rounded-full bg-primary/40 hover:bg-primary/60 transition-colors duration-150" 
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
});

// Memoizar los componentes para evitar re-renderizados innecesarios
const ScrollBar = React.memo(ScrollBarComponent);
const ScrollArea = React.memo(ScrollAreaComponent);

ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export { ScrollArea, ScrollBar }
