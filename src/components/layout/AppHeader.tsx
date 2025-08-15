
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const pageTitle: Record<string, string> = {
  "/dashboard": "Dashboards",
  "/planos": "Meus Planos",
  "/planejamento": "Planejamento e Controle",
  "/lancamentos": "Lançamentos",
  "/investimentos": "Investimentos",
  "/entidades": "Gerenciar Entidades",
  "/tutoriais": "Tutoriais",
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

      <div className="flex items-center">
        <Avatar className="h-8 w-8 bg-primary-foreground bg-opacity-20">
          <AvatarFallback className="bg-transparent text-primary-foreground text-sm font-medium">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
