import { cn } from "@/lib/utils"
import { Button } from "./button"

interface IconButtonGroupProps {
  options: {
    value: string
    icon: React.ReactNode
    tooltip: string
  }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function IconButtonGroup({
  options,
  value,
  onChange,
  className,
}: IconButtonGroupProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="icon"
          onClick={() => onChange(option.value)}
          title={option.tooltip}
          className={cn(
            "w-10 h-10 p-2 transition-all duration-200",
            value === option.value 
              ? "shadow-md ring-1 ring-primary" 
              : "hover:bg-accent/10 hover:text-primary focus-visible:ring-1 focus-visible:ring-primary/50"
          )}
          aria-pressed={value === option.value}
        >
          {option.icon}
        </Button>
      ))}
    </div>
  )
}
