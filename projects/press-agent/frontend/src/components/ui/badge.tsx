import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-foreground text-background",
    secondary: "border-transparent bg-muted text-foreground",
    destructive: "border-transparent bg-red-500/10 text-red-500",
    outline: "text-foreground border",
    success: "border-transparent bg-green-500/10 text-green-500",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
