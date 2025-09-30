import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { NotionCard, NotionCardContent } from "./notion-card";

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
    ...props 
  }, ref) => {
    return (
      <NotionCard
        ref={ref}
        variant="muted"
        className={cn("transition-all duration-200 hover:shadow-md", className)}
        {...props}
      >
        <NotionCardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground font-medium">
                {label}
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  <span>{trend.isPositive ? "↑" : "↓"}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {Icon && (
              <div className="rounded-xl p-3 bg-primary/10">
                <Icon className={cn("h-6 w-6", iconColor)} />
              </div>
            )}
          </div>
        </NotionCardContent>
      </NotionCard>
    );
  }
);
MetricCard.displayName = "MetricCard";

export { MetricCard };
