import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-chat text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-chat-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-chat-primary text-white shadow hover:bg-chat-secondary",
        destructive:
          "bg-chat-error text-white shadow-sm hover:bg-chat-error/90",
        outline:
          "border border-chat-border bg-background shadow-sm hover:bg-chat-accent/10 hover:text-chat-primary hover:border-chat-primary",
        secondary:
          "bg-chat-secondary text-white shadow-sm hover:bg-chat-secondary/80",
        ghost: "hover:bg-chat-accent/10 hover:text-chat-primary",
        link: "text-chat-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-chat px-3 text-sm",
        lg: "h-12 rounded-chat px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
