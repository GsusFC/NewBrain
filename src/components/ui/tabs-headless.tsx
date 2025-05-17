"use client"

import * as React from "react"
import { Tab } from "@headlessui/react"
import { cn } from "@/lib/utils"

// Shared styles for tab components
const tabBaseStyles = {
  trigger: "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  content: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  list: "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
} as const

/**
 * Main Tabs component using Headless UI
 */
interface TabsContextValue {
  selectedValue: string
  setSelectedValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

interface TabItem {
  value: string
  label: React.ReactNode
  disabled?: boolean
  className?: string
}

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs = ({ 
  defaultValue = '', 
  value: valueProp, 
  onValueChange, 
  children, 
  className 
}: TabsProps) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue)
  
  // Handle controlled/uncontrolled component behavior
  const value = valueProp !== undefined ? valueProp : selectedValue
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (valueProp === undefined) {
      setSelectedValue(newValue)
    }
    onValueChange?.(newValue)
  }, [onValueChange, valueProp])
  
  const contextValue = React.useMemo(() => ({
    selectedValue: value,
    setSelectedValue: handleValueChange
  }), [value, handleValueChange])
  
  // Convert children to array for processing
  const childrenArray = React.Children.toArray(children)
  // Find TabsList and TabsContent with proper typing
  const tabsList = React.useMemo(() => 
    childrenArray.find(
      (child): child is React.ReactElement<{children: React.ReactNode, className?: string}> => 
        React.isValidElement(child) && child.type === TabsList
    ),
    [childrenArray]
  )
  
  const tabsContent = React.useMemo(() => 
    childrenArray.filter((child): child is React.ReactElement<{value: string, children: React.ReactNode}> => 
      React.isValidElement(child) && child.type === TabsContent
    ),
    [childrenArray]
  )
  
  // Extract tabs from TabsList with proper typing
  const tabs = React.useMemo<TabItem[]>(() => 
    React.Children.toArray(tabsList?.props?.children || [])
      .filter((child): child is React.ReactElement<{value: string, disabled?: boolean, className?: string}> => 
        React.isValidElement(child) && child.type === TabsTrigger
      )
      .map((tab, index) => ({
        value: tab.props.value || String(index),
        label: tab.props.children,
        disabled: tab.props.disabled,
        className: tab.props.className
      })),
    [tabsList?.props?.children]
  )
  
  // Calculate default selected index safely
  const foundIndex = tabs.findIndex(tab => tab.value === defaultValue)
  const defaultIndex = foundIndex !== -1 ? foundIndex : 0
  
  // State to handle controlled selection
  const [selectedIndex, setSelectedIndex] = React.useState(defaultIndex)

  // Manejar el cambio de tab usando useCallback para prevenir recreaciones innecesarias
  const handleChange = React.useCallback((index: number) => {
    setSelectedIndex(index)
    if (onValueChange) {
      onValueChange(tabs[index]?.value || String(index))
    }
  }, [onValueChange, tabs])

  // Update selected index when external value changes
  React.useEffect(() => {
    if (value !== undefined) {
      const index = tabs.findIndex(tab => tab.value === value)
      if (index !== -1) {
        setSelectedIndex(index)
      }
    }
  }, [value, tabs])

  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={handleChange} className={className}>
      {tabsList && (
        <Tab.List className={tabsList.props.className}>
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              className={({ selected }: { selected: boolean }) => 
                cn(
                  'px-4 py-2 text-sm font-medium rounded-md',
                  selected 
                    ? 'bg-background text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </Tab.List>
      )}
      
      <div className="mt-4">
        <Tab.Panels>
          {tabsContent.map((content, index) => (
            <Tab.Panel key={content.props.value || index}>
              <TabsContent value={content.props.value}>
                {content.props.children}
              </TabsContent>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </div>
    </Tab.Group>
  )
}

/**
 * Contenedor para los triggers de las pestañas
 */
const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(tabBaseStyles.list, className)}
    {...props}
  />
))
TabsList.displayName = "TabsList"

/**
 * Botón para activar una pestaña específica
 */
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => (
    <button
      ref={ref}
      value={value}
      className={cn(tabBaseStyles.trigger, className)}
      {...props}
    />
  )
)
TabsTrigger.displayName = "TabsTrigger"

/**
 * Contenido de una pestaña
 */
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      data-value={value}
      className={cn(tabBaseStyles.content, className)}
      {...props}
    />
  )
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
