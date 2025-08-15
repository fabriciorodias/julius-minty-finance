
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
            `flex items-start w-full px-3 py-3 rounded-lg mint-transition min-h-[48px] ${
              isActive
                ? "bg-white bg-opacity-20 text-white shadow-sm font-medium"
                : "text-white text-opacity-90 hover:bg-white hover:bg-opacity-10 hover:text-white"
            }`
          }
        >
          <span className="material-icons text-xl mr-3 mt-0.5 flex-shrink-0">
            {item.icon}
          </span>
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full min-h-[24px]">
              <span className="text-sm font-medium leading-tight flex-1 pr-2">{item.title}</span>
              <span className="material-icons text-sm flex-shrink-0 opacity-60">
                construction
              </span>
            </div>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r-0 bg-mint-primary`}>
      <SidebarHeader className="p-6 border-b border-white border-opacity-20">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-white text-xl">
              account_balance_wallet
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white">Julius</h1>
              <p className="text-xs text-white opacity-80">Planejamento Financeiro</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-6 bg-white opacity-20" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
