import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const notionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-notion-body-sm font-medium transition-notion focus-ring-notion disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-notion-blue text-white hover:bg-notion-blue-hover shadow-notion-sm",
        secondary: "bg-notion-gray-100 text-notion-gray-900 hover:bg-notion-gray-200",
        ghost: "text-notion-gray-700 hover:bg-notion-gray-100",
        danger: "bg-notion-danger text-white hover:bg-notion-danger-hover shadow-notion-sm",
        outline: "border border-notion-gray-300 bg-white text-notion-gray-700 hover:bg-notion-gray-50",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface NotionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof notionButtonVariants> {
  asChild?: boolean
}

const NotionButton = React.forwardRef<HTMLButtonElement, NotionButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(notionButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NotionButton.displayName = "NotionButton"

export { NotionButton, notionButtonVariants }
