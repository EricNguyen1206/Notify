import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-chat border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-chat-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-chat-primary text-white shadow hover:bg-chat-secondary",
        secondary:
          "border-transparent bg-chat-secondary text-white hover:bg-chat-secondary/80",
        destructive:
          "border-transparent bg-chat-error text-white shadow hover:bg-chat-error/90",
        outline: "text-foreground border-chat-border hover:bg-chat-accent/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
