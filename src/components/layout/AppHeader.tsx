
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
    <header className="h-16 border-b border-julius-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center">
        <SidebarTrigger className="mr-4 p-2 hover:bg-julius-secondary rounded-lg julius-transition" />
        <h2 className="text-xl font-semibold text-julius-primary">{currentTitle}</h2>
      </div>

      <div className="flex items-center">
        <Avatar className="h-8 w-8 bg-julius-accent">
          <AvatarFallback className="bg-julius-accent text-julius-accent-foreground text-sm font-medium">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
