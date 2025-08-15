
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/layout/UserMenu";

const pageTitle: Record<string, string> = {
  "/dashboard": "Dashboards",
  "/planos": "Meus Planos",
  "/planejamento": "Planejamento e Controle",
  "/lancamentos": "Lançamentos",
  "/investimentos": "Investimentos",
  "/entidades": "Gerenciar Entidades",
  "/tutoriais": "Tutoriais",
  "/profile": "Meu Perfil",
  "/": "Dashboard"
};

export function AppHeader() {
  const location = useLocation();
  const currentTitle = pageTitle[location.pathname] || "Julius";

  return (
    <header className="h-16 border-b border-sidebar-border bg-primary flex items-center justify-between px-6">
      <div className="flex items-center">
        <SidebarTrigger className="mr-4 p-2 hover:bg-primary-foreground hover:bg-opacity-10 rounded-lg mint-transition text-primary-foreground" />
        <h2 className="text-xl font-semibold text-primary-foreground">{currentTitle}</h2>
      </div>

      <UserMenu />
    </header>
  );
}
