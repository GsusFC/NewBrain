"use client"

import * as React from "react"
import { Listbox, Transition } from "@headlessui/react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SelectProps {
  /** Valor seleccionado actual */
  value: string
  /** Callback cuando cambia la selección */
  onChange: (value: string) => void
  /** Si el select está deshabilitado */
  disabled?: boolean
  /** Contenido del select */
  children: React.ReactNode
  /** Clase personalizada */
  className?: string
}

/**
 * Componente Select principal usando Listbox de Headless UI
 */
const Select = React.forwardRef<
  HTMLDivElement,
  SelectProps
>(({ value, onChange, disabled, children, ...props }, ref) => {
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div ref={ref} className="relative" data-slot="select" {...props}>
        {children}
      </div>
    </Listbox>
  )
})
Select.displayName = "Select"

/**
 * Agrupador de elementos del select
 */
const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(className)}
    data-slot="select-group"
    {...props}
  />
))
SelectGroup.displayName = "SelectGroup"

/**
 * Componente para mostrar el valor seleccionado
 */
const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block truncate", className)}
    data-slot="select-value"
    {...props}
  />
))
SelectValue.displayName = "SelectValue"

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tamaño del trigger */
  size?: "sm" | "default"
  /** Clase personalizada */
  className?: string
  /** Contenido del trigger */
  children?: React.ReactNode
}

/**
 * Botón que activa el menú desplegable
 */
const SELECT_TRIGGER_BASE_CLASSES = [
  'border-input',
  'data-[placeholder]:text-muted-foreground',
  '[&_svg:not([class*="text-"])]:text-muted-foreground',
  'focus-visible:border-ring',
  'focus-visible:ring-ring/50',
  'aria-invalid:ring-destructive/20',
  'dark:aria-invalid:ring-destructive/40',
  'aria-invalid:border-destructive',
  'dark:bg-input/30',
  'dark:hover:bg-input/50',
  'flex',
  'w-fit',
  'items-center',
  'justify-between',
  'gap-2',
  'rounded-md',
  'border',
  'bg-transparent',
  'px-3',
  'py-2',
  'text-sm',
  'whitespace-nowrap',
  'shadow-xs',
  'transition-[color,box-shadow]',
  'outline-none',
  'focus-visible:ring-[3px]',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
  'data-[size=default]:h-9',
  'data-[size=sm]:h-8'
].join(' ')

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, size = "default", children, ...props }, ref) => (
  <Listbox.Button
    ref={ref}
    data-slot="select-trigger"
    data-size={size}
    className={cn(SELECT_TRIGGER_BASE_CLASSES, className)}
    {...props}
  >
    {({ value }) => (
      <>
        {children || value}
        <ChevronDownIcon className="size-4 opacity-50 ml-2" />
      </>
    )}
  </Listbox.Button>
))
SelectTrigger.displayName = "SelectTrigger"

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** La posición del menú desplegable */
  position?: 'popper'
  /** Clase personalizada */
  className?: string
  /** Contenido del menú */
  children?: React.ReactNode
}

/**
 * Contenedor del menú desplegable
 */
const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps
>(({ className, children, position = "popper", ...props }, ref) => (
  <Transition
    as={React.Fragment}
    leave="transition ease-in duration-100"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    <Listbox.Options
      ref={ref}
      data-slot="select-content"
      className={cn(
        "bg-popover text-popover-foreground absolute z-50 max-h-60 min-w-[8rem] overflow-auto rounded-md border shadow-md p-1 mt-1 outline-none",
        position === "popper" && "translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </Listbox.Options>
  </Transition>
))
SelectContent.displayName = "SelectContent"

/**
 * Etiqueta para los grupos de opciones
 */
export interface SelectLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Clase personalizada */
  className?: string
  /** Contenido de la etiqueta */
  children?: React.ReactNode
}

const SelectLabel = React.forwardRef<HTMLLabelElement, SelectLabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    data-slot="select-label"
    className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

/**
 * Elemento individual del select
 */
export interface SelectItemProps extends Omit<React.ComponentPropsWithoutRef<typeof Listbox.Option>, 'children'> {
  /** Clase personalizada */
  className?: string
  /** Contenido del ítem */
  children?: React.ReactNode
  /** Valor del ítem */
  value: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(({ className, children, ...props }, ref) => (
  <Listbox.Option
    ref={ref}
    data-slot="select-item"
    className={({ active }) =>
      cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        active && "bg-accent text-accent-foreground",
        className
      )
    }
    {...props}
  >
    {({ selected }) => (
      <>
        <span className="block truncate">{children}</span>
        {selected ? (
          <span className="absolute right-2 flex size-3.5 items-center justify-center">
            <CheckIcon className="size-4" />
          </span>
        ) : null}
      </>
    )}
  </Listbox.Option>
))
SelectItem.displayName = "SelectItem"

/**
 * Separador visual entre grupos de opciones
 */
export interface SelectSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clase personalizada */
  className?: string
}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="select-separator"
    className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

export interface SelectScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Clase personalizada */
  className?: string
}

export type SelectScrollUpButtonProps = SelectScrollButtonProps
export type SelectScrollDownButtonProps = SelectScrollButtonProps

const SelectScrollUpButton = React.forwardRef<HTMLButtonElement, SelectScrollButtonProps>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("block truncate", className)}
    data-slot="select-scroll-up-button"
    {...props}
  />
))
SelectScrollUpButton.displayName = "SelectScrollUpButton"

const SelectScrollDownButton = React.forwardRef<HTMLButtonElement, SelectScrollButtonProps>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn("block truncate", className)}
    data-slot="select-scroll-down-button"
    {...props}
  />
))
SelectScrollDownButton.displayName = "SelectScrollDownButton"

// Re-exportar los componentes
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
