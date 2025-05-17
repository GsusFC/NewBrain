"use client"

import * as React from "react"
import { RadioGroup } from "@headlessui/react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface ToggleGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "value" | "onChange" | "defaultValue"> {
  /** Valor actual seleccionado (controlado) */
  value?: string
  /** Valor por defecto cuando no está controlado */
  defaultValue?: string
  /** Callback que se ejecuta cuando cambia el valor seleccionado */
  onValueChange?: (value: string) => void
  /** Deshabilita todo el grupo de botones */
  disabled?: boolean
  /** Tamaño de los botones: 'sm', 'md' (por defecto) o 'lg' */
  size?: 'sm' | 'md' | 'lg'
  /** Clase CSS personalizada para el contenedor */
  className?: string
  /** Elementos hijos (ToggleGroupItem) */
  children?: React.ReactNode
}

/**
 * Componente ToggleGroup usando RadioGroup de Headless UI
 * Optimizado para un tema oscuro exclusivo
 */
const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>((
  {
    className,
    children,
    value: valueProp,
    defaultValue,
    onValueChange,
    type = "single",
    disabled,
    size = 'md',
    ...props
  },
  ref
) => {
    // Estado interno para manejar el valor seleccionado
    const [selectedValue, setSelectedValue] = React.useState<string>(
      defaultValue || ''
    );
    
    // Sincronizar estado cuando cambia el valor controlado
    React.useEffect(() => {
      if (valueProp !== undefined) {
        setSelectedValue(valueProp);
      }
    }, [valueProp]);
    
    // Manejar cambios de valor
    const handleChange = (itemValue: string) => {
      if (disabled) return;
      
      const newValue = selectedValue === itemValue ? '' : itemValue;
      
      if (valueProp === undefined) {
        setSelectedValue(newValue);
      }
      
      if (onValueChange) {
        onValueChange(newValue);
      }
    };
    
    // Verificar si un ítem está seleccionado
    const isItemSelected = (itemValue: string): boolean => 
      selectedValue === itemValue;
    
    return (
      <div 
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-card p-1",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          className
        )}
        {...props}
      >
        <RadioGroup
          as="div"
          value={selectedValue}
          onChange={handleChange}
          disabled={disabled}
          className="contents"
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child) || child.type !== ToggleGroupItem) {
              return child;
            }
            
            const childProps = child.props as ToggleGroupItemProps;
            const itemValue = childProps.value || '';
            const isDisabled = childProps.disabled !== undefined ? childProps.disabled : disabled;
            
            return (
              <RadioGroup.Option 
                key={itemValue}
                value={itemValue}
                disabled={isDisabled}
                className="contents"
              >
                {({ checked, disabled: optionDisabled }) => {
                  const itemProps = {
                    ...childProps,
                    isSelected: checked,
                    disabled: optionDisabled,
                    size: childProps.size || size,
                    'aria-pressed': checked,
                    'data-state': checked ? 'on' : 'off',
                    'data-disabled': optionDisabled || undefined
                  };
                  
                  return <ToggleGroupItem {...itemProps} />;
                }}
              </RadioGroup.Option>
            );
          })}
        </RadioGroup>
      </div>
    )
  }
)
ToggleGroup.displayName = "ToggleGroup"

/**
 * Componente ToggleGroupItem que representa un elemento individual en el grupo.
 * 
 * @param {ToggleGroupItemProps} props - Propiedades del componente.
 * @returns {JSX.Element} - El componente ToggleGroupItem.
 */
interface ToggleGroupItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Valor único que identifica esta opción */
  value: string
  /** Texto o elementos hijos del botón */
  children?: React.ReactNode
  /** Ícono opcional a mostrar junto al texto */
  icon?: LucideIcon
  /** Tamaño del botón: 'sm', 'md' (por defecto) o 'lg' */
  size?: 'sm' | 'md' | 'lg'
  /** Deshabilita este ítem específico */
  disabled?: boolean
  /** Indica si el ítem está seleccionado (controlado) */
  isSelected?: boolean
  /** Callback que se ejecuta al hacer clic en el ítem */
  onChange?: () => void
  /** Clase CSS personalizada */
  className?: string
}

/**
 * Componente ToggleGroupItem, que representa un elemento individual en el grupo
 * Adaptado para tema oscuro exclusivo
 */
interface ToggleGroupItemComponentProps extends Omit<ToggleGroupItemProps, keyof React.HTMLAttributes<HTMLDivElement>>, React.HTMLAttributes<HTMLDivElement> {
  'data-state'?: 'on' | 'off';
  'data-disabled'?: boolean | 'true' | 'false';
  'aria-pressed'?: boolean;
  className?: string;
  children?: React.ReactNode;
  onChange?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemComponentProps>(({ 
  className, 
  children, 
  value, 
  disabled, 
  isSelected, 
  onChange, 
  icon: Icon,
  size = 'md',
  ...props 
}, ref) => {
    // Mapeo de tamaños a clases de Tailwind
    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-1.5',
      lg: 'text-base px-4 py-2',
    };

    // Tamaño del icono basado en el tamaño del botón
    const iconSize = {
      sm: 14,
      md: 16,
      lg: 18,
    }[size];

    return (
      <div
        ref={ref}
        role={isSelected !== undefined ? 'radio' : 'button'}
        aria-checked={isSelected}
        aria-pressed={isSelected}
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onChange}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange?.();
          }
        }}
        data-state={isSelected ? 'on' : 'off'}
        data-disabled={disabled || undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-sm font-medium',
          'transition-all duration-300 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          'data-[state=on]:bg-primary/20 data-[state=on]:text-primary',
          'data-[state=on]:shadow-sm data-[state=on]:ring-1 data-[state=on]:ring-primary/30',
          'data-[state=off]:bg-card/80 data-[state=off]:text-muted-foreground',
          'data-[state=off]:hover:bg-accent/10 data-[state=off]:hover:text-foreground',
          'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
          'gap-2', // Espacio entre icono y texto
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {Icon && <Icon size={iconSize} className="flex-shrink-0" aria-hidden="true" />}
        {children && <span>{children}</span>}
      </div>
    )
  }
)

ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
