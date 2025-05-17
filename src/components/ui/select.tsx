"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from "lucide-react"
import { 
  Select as HeadlessSelect,
  SelectGroup as HeadlessSelectGroup,
  SelectValue as HeadlessSelectValue,
  SelectTrigger as HeadlessSelectTrigger,
  SelectContent as HeadlessSelectContent,
  SelectLabel as HeadlessSelectLabel,
  SelectItem as HeadlessSelectItem,
  SelectSeparator as HeadlessSelectSeparator,
  SelectScrollUpButton as HeadlessSelectScrollUpButton,
  SelectScrollDownButton as HeadlessSelectScrollDownButton
} from "./select-headless"
import { cn } from "@/lib/utils"

// Definir tipos locales
type SelectBaseProps = {
  className?: string
  children?: React.ReactNode
}

interface SelectProps extends SelectBaseProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

interface SelectTriggerProps extends SelectBaseProps {
  size?: "sm" | "default"
  disabled?: boolean
}

interface SelectContentProps extends SelectBaseProps {
  position?: 'popper' | 'item-aligned' | null
}

interface SelectLabelProps extends SelectBaseProps {}

interface SelectItemProps extends SelectBaseProps {
  value: string
  disabled?: boolean
}

interface SelectSeparatorProps extends SelectBaseProps {}

interface SelectScrollButtonProps extends SelectBaseProps {}

/**
 * Componente Select con estilos predefinidos
 */
const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, children, className, disabled, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <HeadlessSelect 
        as="div"
        ref={ref}
        value={value}
        onChange={onValueChange}
        disabled={disabled}
        className="w-full"
        data-slot="select"
        {...props}
      >
        {children}
      </HeadlessSelect>
    </div>
  )
)
Select.displayName = "Select"

/**
 * Grupo de opciones del select
 */
const SelectGroup = React.forwardRef<HTMLDivElement, SelectBaseProps>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref}
      className={cn("p-1", className)}
      data-slot="select-group"
      {...props}
    />
  )
)
SelectGroup.displayName = "SelectGroup"

/**
 * Valor seleccionado en el trigger
 */
const SelectValue = React.forwardRef<HTMLSpanElement, SelectBaseProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("block truncate text-left", className)}
      data-slot="select-value"
      {...props}
    />
  )
)
SelectValue.displayName = "SelectValue"

/**
 * Botón que activa el menú desplegable
 */
const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, size = "default", children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="select-trigger"
      data-size={size}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm",
        "whitespace-nowrap shadow-sm outline-none transition-all duration-250 ease-in-out text-left",
        "data-[placeholder]:text-muted-foreground",
        "focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30",
        "hover:border-primary/40 hover:bg-card/95",
        "aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[size=default]:h-9 data-[size=sm]:h-8",
        className
      )}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
      <ChevronDownIcon className="size-4 opacity-50 ml-2 flex-shrink-0" />
    </button>
  )
)
SelectTrigger.displayName = "SelectTrigger"

/**
 * Contenido desplegable del select
 */
const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position = "popper", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-1",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      data-slot="select-content"
      {...props}
    >
      <div className="max-h-[--radix-select-content-available-height] overflow-y-auto">
        {children}
      </div>
    </div>
  )
)
SelectContent.displayName = "SelectContent"

/**
 * Etiqueta para grupos de opciones
 */
const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "py-1.5 pl-8 pr-2 text-sm font-semibold text-muted-foreground",
        className
      )}
      data-slot="select-label"
      {...props}
    />
  )
)
SelectLabel.displayName = "SelectLabel"

/**
 * Elemento individual del menú desplegable
 */
const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => (
    <div
      ref={ref}
      role="option"
      aria-selected="false"
      aria-disabled={disabled}
      data-value={value}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "hover:bg-accent/50",
        className
      )}
      data-slot="select-item"
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <CheckIcon className="h-4 w-4 opacity-0 group-data-[selected]:opacity-100" />
      </span>
      <span className="block truncate">
        {children}
      </span>
    </div>
  )
)
SelectItem.displayName = "SelectItem"

/**
 * Separador visual entre grupos de opciones
 */
const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      data-slot="select-separator"
      role="separator"
      {...props}
    />
  )
)
SelectSeparator.displayName = "SelectSeparator"

/**
 * Botón de desplazamiento hacia arriba
 */
const SelectScrollUpButton = React.forwardRef<HTMLButtonElement, SelectScrollButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      type="button"
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        "hover:text-foreground transition-colors",
        className
      )}
      data-slot="select-scroll-up-button"
      {...props}
    >
      <ChevronUpIcon className="h-4 w-4" />
    </button>
  )
)
SelectScrollUpButton.displayName = "SelectScrollUpButton"

/**
 * Botón de desplazamiento hacia abajo
 */
const SelectScrollDownButton = React.forwardRef<HTMLButtonElement, SelectScrollButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      type="button"
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        "hover:text-foreground transition-colors",
        className
      )}
      data-slot="select-scroll-down-button"
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4" />
    </button>
  )
)
SelectScrollDownButton.displayName = "SelectScrollDownButton"

// Exportar componentes
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

// Exportar tipos
export type {
  SelectProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectLabelProps,
  SelectItemProps,
  SelectSeparatorProps,
  SelectScrollButtonProps,
}
