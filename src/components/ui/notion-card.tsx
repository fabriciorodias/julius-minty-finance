import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const notionCardVariants = cva(
  "rounded-lg transition-notion",
  {
    variants: {
      variant: {
        default: "bg-white border border-notion-gray-200 shadow-notion-sm",
        muted: "bg-notion-gray-25 border border-notion-gray-200",
        hoverable: "bg-white border border-notion-gray-200 shadow-notion-sm hover:shadow-notion-md cursor-pointer",
        interactive: "bg-white border border-notion-gray-200 shadow-notion-sm hover:shadow-notion-md hover:border-notion-gray-300 cursor-pointer",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)

export interface NotionCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notionCardVariants> {}

const NotionCard = React.forwardRef<HTMLDivElement, NotionCardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(notionCardVariants({ variant, padding }), className)}
      {...props}
    />
  )
)
NotionCard.displayName = "NotionCard"

const NotionCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
NotionCardHeader.displayName = "NotionCardHeader"

const NotionCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-notion-h3 text-notion-gray-900 leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
NotionCardTitle.displayName = "NotionCardTitle"

const NotionCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-notion-body-sm text-notion-gray-500", className)}
    {...props}
  />
))
NotionCardDescription.displayName = "NotionCardDescription"

const NotionCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-4", className)} {...props} />
))
NotionCardContent.displayName = "NotionCardContent"

const NotionCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-notion-gray-200", className)}
    {...props}
  />
))
NotionCardFooter.displayName = "NotionCardFooter"

export {
  NotionCard,
  NotionCardHeader,
  NotionCardFooter,
  NotionCardTitle,
  NotionCardDescription,
  NotionCardContent,
}
