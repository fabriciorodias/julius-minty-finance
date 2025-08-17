
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "sidebar" | "header";
  collapsed?: boolean;
  className?: string;
}

export function BrandLogo({ variant = "sidebar", collapsed = false, className }: BrandLogoProps) {
  const isHeader = variant === "header";
  
  return (
    <div className={cn(
      "flex items-center gap-3",
      isHeader && "gap-2",
      className
    )}>
      {/* Logo Icon */}
      <div className={cn(
        "rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm transition-all duration-200",
        isHeader 
          ? "w-8 h-8 bg-white/10 border border-white/20 shadow-sm" 
          : "w-10 h-10 bg-white/20 border border-white/30 shadow-lg",
      )}>
        <span className={cn(
          "material-icons text-white transition-all duration-200",
          isHeader ? "text-lg" : "text-xl"
        )}>
          account_balance_wallet
        </span>
      </div>
      
      {/* Brand Text */}
      {(!collapsed || isHeader) && (
        <div className="flex flex-col">
          <h1 className={cn(
            "font-bold text-white drop-shadow-sm transition-all duration-200",
            isHeader ? "text-lg" : "text-xl"
          )}>
            Julius
          </h1>
          {!isHeader && (
            <p className="text-xs text-white/80 leading-tight">
              Planejamento Financeiro
            </p>
          )}
        </div>
      )}
    </div>
  );
}
