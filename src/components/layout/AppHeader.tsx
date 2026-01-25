
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
  "/contas": "Contas",
  "/tutoriais": "Tutoriais",
  "/ferramentas": "Ferramentas",
  "/profile": "Meu Perfil",
  "/projecoes": "Projeções",
  "/configuracoes": "Configurações",
  "/": "Panorama"
};

export function AppHeader() {
  const location = useLocation();
  const currentTitle = pageTitle[location.pathname] || "Julius";

  return (
    <header 
      className="h-12 border-b border-white/10"
      style={{ backgroundColor: '#1F2937' }}
    >
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="p-1.5 hover:bg-white/10 rounded-md transition-all text-gray-400 hover:text-white" />
          
          {/* Logo for mobile/collapsed state */}
          <div className="md:hidden">
            <BrandLogo variant="header" />
          </div>
          
          {/* Page title */}
          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <h2 className="text-sm font-semibold text-white">
              {currentTitle}
            </h2>
          </div>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
