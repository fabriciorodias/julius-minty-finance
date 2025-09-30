import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { OriginCard, OriginCardContent, OriginCardLabel, OriginCardValue } from "./origin-card";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  glass?: boolean;
  textured?: "blue-gray" | "earth" | "ocean" | "mint";
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    className, 
    label, 
    value, 
    icon: Icon, 
    iconColor = "text-primary",
    trend,
    description,
    glass,
    textured,
    ...props 
  }, ref) => {
    return (
      <OriginCard
        ref={ref}
        glass={glass}
        textured={textured}
        className={cn("hover-lift-origin", className)}
        {...props}
      >
        <OriginCardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <OriginCardLabel className={textured ? "text-white/80" : ""}>
                {label}
              </OriginCardLabel>
              <OriginCardValue className={textured ? "text-white" : ""}>
                {value}
              </OriginCardValue>
              {description && (
                <p className={cn(
                  "text-sm",
                  textured ? "text-white/70" : "text-muted-foreground"
                )}>
                  {description}
                </p>
              )}
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600",
                  textured && "text-white"
                )}>
                  <span>{trend.isPositive ? "↑" : "↓"}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {Icon && (
              <div className={cn(
                "rounded-xl p-3",
                textured ? "bg-white/20" : "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-6 w-6",
                  textured ? "text-white" : iconColor
                )} />
              </div>
            )}
          </div>
        </OriginCardContent>
      </OriginCard>
    );
  }
);
MetricCard.displayName = "MetricCard";

export { MetricCard };
