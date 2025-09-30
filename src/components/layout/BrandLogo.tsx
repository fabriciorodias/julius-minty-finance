
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
      "flex items-center gap-3 cursor-pointer transition-notion",
      isHeader && "gap-2",
      className
    )}>
      {/* Logo Icon */}
      <div className={cn(
        "rounded-md flex items-center justify-center flex-shrink-0 bg-notion-blue transition-notion",
        isHeader 
          ? "w-7 h-7" 
          : "w-9 h-9",
      )}>
        <span className={cn(
          "material-icons text-white",
          isHeader ? "text-base" : "text-lg"
        )}>
          account_balance_wallet
        </span>
      </div>
      
      {/* Brand Text */}
      {(!collapsed || isHeader) && (
        <div className="flex flex-col">
          <h1 className={cn(
            "font-semibold text-notion-gray-900 transition-notion",
            isHeader ? "text-notion-body" : "text-notion-h3"
          )}>
            Julius
          </h1>
          {!isHeader && (
            <p className="text-notion-caption text-notion-gray-600 leading-tight">
              Planejamento Financeiro
            </p>
          )}
        </div>
      )}
    </div>
  );
}
