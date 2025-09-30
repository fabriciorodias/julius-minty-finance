import * as React from "react";
import { cn } from "@/lib/utils";

export interface OriginCardProps extends React.HTMLAttributes<HTMLDivElement> {
  textured?: "blue-gray" | "earth" | "ocean" | "mint";
  glass?: boolean;
  hover?: boolean;
}

const OriginCard = React.forwardRef<HTMLDivElement, OriginCardProps>(
  ({ className, textured, glass, hover, ...props }, ref) => {
    const baseClasses = "rounded-2xl shadow-origin origin-transition";
    
    const textureClass = textured ? `bg-texture-${textured} text-white` : "";
    const glassClass = glass ? "glass-card-origin" : "bg-card";
    const hoverClass = hover ? "hover-lift-origin cursor-pointer" : "";

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          textureClass || glassClass,
          hoverClass,
          className
        )}
        {...props}
      />
    );
  }
);
OriginCard.displayName = "OriginCard";

const OriginCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
));
OriginCardHeader.displayName = "OriginCardHeader";

const OriginCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-origin-title", className)}
    {...props}
  />
));
OriginCardTitle.displayName = "OriginCardTitle";

const OriginCardLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-origin-label", className)}
    {...props}
  />
));
OriginCardLabel.displayName = "OriginCardLabel";

const OriginCardValue = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-origin-value", className)}
    {...props}
  />
));
OriginCardValue.displayName = "OriginCardValue";

const OriginCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
OriginCardContent.displayName = "OriginCardContent";

const OriginCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
OriginCardFooter.displayName = "OriginCardFooter";

export {
  OriginCard,
  OriginCardHeader,
  OriginCardFooter,
  OriginCardTitle,
  OriginCardLabel,
  OriginCardValue,
  OriginCardContent,
};
