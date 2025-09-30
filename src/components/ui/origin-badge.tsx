import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const originBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold origin-transition-fast",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20",
        success: "bg-green-500/10 text-green-700 border border-green-500/20",
        warning: "bg-orange-500/10 text-orange-700 border border-orange-500/20",
        danger: "bg-red-500/10 text-red-700 border border-red-500/20",
        info: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
        neutral: "bg-secondary text-secondary-foreground border border-border",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-xs px-3 py-1",
        lg: "text-sm px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface OriginBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof originBadgeVariants> {
  icon?: React.ReactNode;
}

function OriginBadge({ 
  className, 
  variant, 
  size, 
  icon, 
  children, 
  ...props 
}: OriginBadgeProps) {
  return (
    <div 
      className={cn(originBadgeVariants({ variant, size }), className)} 
      {...props}
    >
      {icon}
      {children}
    </div>
  );
}

export { OriginBadge, originBadgeVariants };
