"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

type ToggleGroupContextValue = {
  type: 'single' | 'multiple';
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  disabled?: boolean;
};

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext() {
  const context = React.useContext(ToggleGroupContext);
  if (!context) {
    throw new Error('ToggleGroupItem must be used within a ToggleGroup');
  }
  return context;
}

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      className,
      type = 'single',
      value = type === 'single' ? '' : [],
      onValueChange = () => {},
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const contextValue = React.useMemo(
      () => ({
        type,
        value,
        onValueChange,
        disabled,
      }),
      [type, value, onValueChange, disabled]
    );

    return (
      <ToggleGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn('flex items-center justify-center gap-1', className)}
          role="group"
          data-type={type}
          data-state={Array.isArray(value) ? value.join(' ') : value}
          data-disabled={disabled ? '' : undefined}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);
ToggleGroup.displayName = 'ToggleGroup';

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, value, disabled: itemDisabled, children, icon: Icon, ...props }, ref) => {
    const context = useToggleGroupContext();
    const isSelected = context.type === 'single' 
      ? context.value === value 
      : Array.isArray(context.value) && context.value.includes(value);
    const disabled = itemDisabled || context.disabled;

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      if (context.type === 'single') {
        context.onValueChange(isSelected ? '' : value);
      } else {
        const currentValue = Array.isArray(context.value) ? [...context.value] : [];
        const newValue = isSelected
          ? currentValue.filter(v => v !== value)
          : [...currentValue, value];
        context.onValueChange(newValue);
      }

      props.onClick?.(e);
    }, [context, disabled, isSelected, props, value]);

    return (
      <button
        ref={ref}
        type="button"
        role={context.type === 'single' ? 'radio' : 'checkbox'}
        aria-checked={isSelected}
        data-state={isSelected ? 'on' : 'off'}
        data-disabled={disabled ? '' : undefined}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          isSelected && 'bg-accent text-accent-foreground',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {Icon && <Icon className={cn('mr-2 h-4 w-4', children ? '' : 'm-0')} />}
        {children}
      </button>
    );
  }
);
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };