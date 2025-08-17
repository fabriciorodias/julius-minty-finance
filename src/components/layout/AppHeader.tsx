
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";

const pageTitle: Record<string, string> = {
  "/dashboard": "Panorama",
  "/planos": "Planos e Metas",
  "/planejamento": "Orçamento",
  "/lancamentos": "Lançamentos",
  "/investimentos": "Investimentos",
  "/entidades": "Ajustes",
  "/tutoriais": "Tutoriais",
  "/ferramentas": "Ferramentas",
  "/profile": "Meu Perfil",
  "/": "Panorama"
};

export function AppHeader() {
  const location = useLocation();
  const currentTitle = pageTitle[location.pathname] || "Julius";

  return (
    <header className="h-16 border-b border-sidebar-border/50 bg-gradient-to-r from-primary via-primary to-primary/95 backdrop-blur-md relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />
      
      <div className="relative z-10 h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="p-2 hover:bg-white/10 hover:backdrop-blur-sm rounded-lg mint-transition text-primary-foreground border-0 shadow-none" />
          
          {/* Logo for mobile/collapsed state */}
          <div className="md:hidden">
            <BrandLogo variant="header" />
          </div>
          
          {/* Page title */}
          <div className="flex items-center gap-3">
            <div className="w-px h-6 bg-white/20 hidden md:block" />
            <h2 className="text-xl font-semibold text-primary-foreground tracking-tight">
              {currentTitle}
            </h2>
          </div>
        </div>

        <UserMenu />
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </header>
  );
}
