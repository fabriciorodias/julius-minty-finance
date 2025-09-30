
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
    <header className="h-12 border-b border-notion-gray-200 bg-white shadow-notion-sm">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="p-1.5 hover:bg-notion-gray-100 rounded-md transition-notion text-notion-gray-700" />
          
          {/* Logo for mobile/collapsed state */}
          <div className="md:hidden">
            <BrandLogo variant="header" />
          </div>
          
          {/* Page title */}
          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-notion-gray-300 hidden md:block" />
            <h2 className="text-notion-body font-semibold text-notion-gray-900">
              {currentTitle}
            </h2>
          </div>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
