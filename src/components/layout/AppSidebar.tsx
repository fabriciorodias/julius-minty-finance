
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
            `flex items-center w-full px-3 py-2 rounded-lg mint-transition ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          <span className="material-icons text-xl mr-3">
            {item.icon}
          </span>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              <span className="material-icons text-sm ml-2">
                construction
              </span>
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r border-sidebar-border bg-sidebar`}>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <span className="material-icons text-sidebar-foreground text-xl">
              account_balance_wallet
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-sidebar-foreground">Julius</h1>
              <p className="text-xs text-sidebar-foreground opacity-80">Planejamento Financeiro</p>
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

        <Separator className="my-6 bg-sidebar-border opacity-30" />

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
