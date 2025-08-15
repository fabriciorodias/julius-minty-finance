
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainMenuItems = [
  {
    title: "Dashboards",
    url: "/dashboard",
    icon: "dashboard"
  },
  {
    title: "Meus Planos",
    url: "/planos",
    icon: "assignment"
  },
  {
    title: "Planejamento e Controle",
    url: "/planejamento",
    icon: "assessment"
  },
  {
    title: "Lançamentos",
    url: "/lancamentos",
    icon: "swap_horiz"
  },
  {
    title: "Investimentos",
    url: "/investimentos",
    icon: "trending_up"
  }
];

const settingsMenuItems = [
  {
    title: "Gerenciar Entidades",
    url: "/entidades",
    icon: "settings"
  },
  {
    title: "Tutoriais",
    url: "/tutoriais",
    icon: "help_outline"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const renderMenuItem = (item: typeof mainMenuItems[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={({ isActive }) =>
            `flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-200 ${
              isActive
                ? "bg-julius-accent text-julius-accent-foreground shadow-sm"
                : "text-julius-foreground hover:bg-julius-muted hover:text-julius-foreground"
            }`
          }
        >
          <span className="material-icons text-xl mr-3 text-julius-primary">
            {item.icon}
          </span>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              <span className="material-icons text-sm text-julius-muted-foreground ml-2">
                construction
              </span>
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r border-julius-border bg-julius-sidebar`}>
      <SidebarHeader className="p-6 border-b border-julius-border">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-julius-accent rounded-xl flex items-center justify-center">
            <span className="material-icons text-julius-accent-foreground text-xl">
              account_balance_wallet
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-julius-foreground">Julius</h1>
              <p className="text-xs text-julius-muted-foreground">Planejamento Financeiro</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-6 bg-julius-border" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {settingsMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
