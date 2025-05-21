"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GridControlCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  variant?: "default" | "aspect-ratio" | "manual";
  active?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  "aspect-ratio": "border-indigo-500/30 bg-indigo-950/30",
  "manual": "border-amber-500/30 bg-amber-950/30",
  "default": "border-muted"
};

export function GridControlCard({
  title,
  variant = "default",
  active = false,
  children,
  className,
  ...props
}: GridControlCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200",
        active && "ring-2 ring-primary",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
