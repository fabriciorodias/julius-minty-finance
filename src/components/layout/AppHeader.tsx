
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
    <header className="h-16 border-b border-white/30 glass-origin backdrop-blur-2xl relative overflow-hidden shadow-lg">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-primary/20 to-white/10 pointer-events-none" />
      
      <div className="relative z-10 h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="p-2 hover:bg-white/20 hover:backdrop-blur-md rounded-lg transition-all duration-300 text-primary-foreground border-0 shadow-none hover-scale" />
          
          {/* Logo for mobile/collapsed state */}
          <div className="md:hidden">
            <BrandLogo variant="header" />
          </div>
          
          {/* Page title */}
          <div className="flex items-center gap-3">
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/40 to-transparent hidden md:block" />
            <h2 className="text-xl font-semibold text-primary-foreground tracking-tight animate-fade-in drop-shadow-sm">
              {currentTitle}
            </h2>
          </div>
        </div>

        <UserMenu />
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent shadow-sm" />
    </header>
  );
}
