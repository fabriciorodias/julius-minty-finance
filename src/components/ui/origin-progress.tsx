import * as React from "react";
import { cn } from "@/lib/utils";

export interface OriginProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  gradient?: "blue" | "green" | "orange" | "red";
  size?: "sm" | "md" | "lg";
}

const gradientClasses = {
  blue: "bg-gradient-to-r from-blue-500 to-blue-600",
  green: "bg-gradient-to-r from-green-500 to-green-600",
  orange: "bg-gradient-to-r from-orange-500 to-orange-600",
  red: "bg-gradient-to-r from-red-500 to-red-600",
};

const sizeClasses = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

const OriginProgress = React.forwardRef<HTMLDivElement, OriginProgressProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    showLabel, 
    showPercentage, 
    label,
    gradient = "blue",
    size = "md",
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.round((value / max) * 100), 100);
    const isOverBudget = percentage > 100;

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {(showLabel || showPercentage) && (
          <div className="flex items-center justify-between text-sm">
            {showLabel && label && (
              <span className="text-origin-label">{label}</span>
            )}
            {showPercentage && (
              <span className={cn(
                "font-semibold",
                isOverBudget ? "text-destructive" : "text-foreground"
              )}>
                {percentage}%
              </span>
            )}
          </div>
        )}
        <div className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeClasses[size]
        )}>
          <div
            className={cn(
              "h-full origin-transition rounded-full",
              isOverBudget ? gradientClasses.red : gradientClasses[gradient]
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  }
);
OriginProgress.displayName = "OriginProgress";

export { OriginProgress };
