"use client"

import * as React from "react"
import { Popover as HeadlessPopover, Transition } from "@headlessui/react"
import { cn } from "@/lib/utils"

/**
 * Componente Popover raíz que contiene el estado y la lógica del popover.
 * Reemplaza la implementación de Radix UI con Headless UI.
 */
const Popover = HeadlessPopover

/**
 * Componente que actúa como disparador del popover.
 * Normalmente es un botón que, al hacer clic, abre o cierra el popover.
 */
const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof HeadlessPopover.Button>,
  React.ComponentPropsWithoutRef<typeof HeadlessPopover.Button>
>(({ className, ...props }, ref) => (
  <HeadlessPopover.Button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center outline-none",
      className
    )}
    {...props}
  />
))
PopoverTrigger.displayName = "PopoverTrigger"

/**
 * Interfaz para las propiedades del contenido del popover
 */
interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number
  align?: "start" | "center" | "end"
  onClose?: () => void
}

/**
 * Componente que contiene el contenido del popover que se muestra cuando está abierto.
 */
const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 4, onClose, ...props }, ref) => (
  <HeadlessPopover.Panel static>
    {({ open, close }) => (
      <Transition
        show={open}
        as="div"
        className="transition-wrapper"
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div
          ref={ref}
          className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            className,
            {
              "mr-2": align === "start",
              "ml-2": align === "end",
            }
          )}
          style={{
            marginTop: sideOffset,
          }}
          {...props}
        />
      </Transition>
    )}
  </HeadlessPopover.Panel>
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
