"use client"

import * as React from "react"
import { Disclosure, Transition } from "@headlessui/react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface AccordionProps {
  type?: "single" | "multiple"
  collapsible?: boolean
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  className?: string
  children: React.ReactNode
}

/**
 * Componente principal Accordion usando Headless UI
 */
const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", collapsible = false, defaultValue, value, onValueChange, className, children, ...props }, ref) => {
    // Determinamos si el componente está controlado
    const isControlled = value !== undefined;
    
    // Estado para manejar los elementos abiertos en modo no controlado
    const [internalOpenItems, setInternalOpenItems] = React.useState<string[]>(() => {
      if (defaultValue) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });
    
    // Usar el valor controlado si está disponible, o el estado interno si no
    const openItems = isControlled 
      ? (Array.isArray(value) ? value : [value].filter(Boolean))
      : internalOpenItems;

    // Manejar el cambio de valor usando useCallback para evitar recreaciones innecesarias
    const handleValueChange = React.useCallback((itemValue: string, isOpen: boolean) => {
      let newOpenItems: string[];

      if (type === "single") {
        // En modo "single", solo puede haber un item abierto o ninguno (si es collapsible)
        newOpenItems = isOpen ? [itemValue] : (collapsible ? [] : [openItems[0] || itemValue]);
      } else {
        // En modo "multiple", puede haber múltiples items abiertos
        if (isOpen) {
          // Usamos Set para evitar duplicados
          newOpenItems = Array.from(new Set([...openItems, itemValue]));
        } else {
          newOpenItems = openItems.filter(item => item !== itemValue);
        }
      }

      // Solo actualizamos el estado interno en modo no controlado
      if (!isControlled) {
        setInternalOpenItems(newOpenItems);
      }

      // Siempre notificamos al componente padre sobre el cambio
      if (onValueChange) {
        onValueChange(type === "single" ? newOpenItems[0] || "" : newOpenItems);
      }
    }, [type, collapsible, openItems, isControlled, onValueChange]);

    // Comprobar si un ítem está abierto
    const isItemOpen = (itemValue: string) => {
      return openItems.includes(itemValue);
    };

    // Renderizar los hijos con el contexto adecuado
    const accordionItems = React.Children.map(children, (child) => {
      if (!React.isValidElement(child) || child.type !== AccordionItem) {
        return child;
      }

      const itemValue = child.props.value || "";
      const isOpen = isItemOpen(itemValue);

      return React.cloneElement(child, {
        open: isOpen,
        onOpenChange: (open: boolean) => handleValueChange(itemValue, open),
      });
    });

    return (
      <div ref={ref} className={className} {...props}>
        {accordionItems}
      </div>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Componente individual del Accordion
 */
const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, open, onOpenChange, value, children, ...props }, ref) => {
    return (
      <Disclosure
        as="div"
        ref={ref}
        open={open}
        onChange={onOpenChange}
        className={cn("border-b", className)}
        {...props}
      >
        {({ open }) => (
          <React.Fragment>
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return null;
              
              if (child.type === AccordionTrigger) {
                return React.cloneElement(child, { open });
              }
              
              if (child.type === AccordionContent) {
                return React.cloneElement(child, { open });
              }
              
              return child;
            })}
          </React.Fragment>
        )}
      </Disclosure>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  open?: boolean
}

/**
 * Componente trigger del Accordion
 */
const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, open, ...props }, ref) => {
    return (
      <Disclosure.Button
        ref={ref}
        className={cn(
          "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </Disclosure.Button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
}

/**
 * Componente de contenido del Accordion
 */
const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, open, ...props }, ref) => {
    return (
      <Transition
        show={open}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Disclosure.Panel 
          static
          className="text-sm overflow-hidden"
        >
          <div 
            ref={ref}
            className={cn("pb-4 pt-0", className)}
            {...props}
          >
            {children}
          </div>
        </Disclosure.Panel>
      </Transition>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
