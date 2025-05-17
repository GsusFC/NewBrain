import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ButtonGroupProps {
  options: {
    value: string
    label: string
  }[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: "sm" | "default"
}

export function ButtonGroup({
  options,
  value,
  onChange,
  className,
  size = "default"
}: ButtonGroupProps) {
  return (
    <div 
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label="Opciones de selección"
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <Button
            key={option.value}
            variant={isSelected ? "default" : "outline"}
            size={size}
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
            className={cn(
              "flex-1 min-w-[80px] transition-all duration-200 relative overflow-hidden",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/70",
              isSelected
                ? "bg-white/10 hover:bg-white/20 border-border"
                : "bg-white/5 hover:bg-white/10 border-border/50"
            )}
          >
            <span className="relative z-10">
              {option.label}
            </span>
            {isSelected && (
              <span className="absolute inset-0 bg-primary/5" />
            )}
          </Button>
        );
      })}
    </div>
  )
}
