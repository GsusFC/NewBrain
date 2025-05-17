"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-card/80 p-1",
      "text-muted-foreground border border-border/30",
      "transition-colors duration-200 ease-in-out",
      "shadow-sm",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium",
      "transition-all duration-300 ease-in-out",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
      "disabled:pointer-events-none disabled:opacity-50",
      "hover:bg-accent/10 hover:text-foreground",
      "data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 rounded-md",
      "transition-all duration-300 ease-in-out",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
      "data-[state=inactive]:opacity-0 data-[state=active]:animate-in data-[state=inactive]:animate-out",
      "data-[state=inactive]:fade-out-0 data-[state=active]:fade-in-0 data-[state=active]:transform-gpu",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
