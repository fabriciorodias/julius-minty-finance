
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
    title: "Panorama",
    url: "/dashboard",
    icon: "dashboard"
  },
  {
    title: "Planos e Metas",
    url: "/planos",
    icon: "flag"
  },
  {
    title: "Orçamento",
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
  },
  {
    title: "Ferramentas",
    url: "/ferramentas",
    icon: "build"
  }
];

const settingsMenuItems = [
  {
    title: "Ajustes",
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
            `flex items-start w-full px-3 py-3 rounded-xl mint-transition min-h-[48px] relative overflow-hidden ${
              isActive
                ? "bg-white bg-opacity-25 text-white shadow-lg font-medium border border-white border-opacity-20"
                : "text-white text-opacity-90 hover:bg-white hover:bg-opacity-15 hover:text-white hover:shadow-md"
            }`
          }
        >
          <span className="material-icons text-xl mr-3 mt-0.5 flex-shrink-0 relative z-10">
            {item.icon}
          </span>
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full min-h-[24px] relative z-10">
              <span className="text-sm font-medium leading-tight flex-1 pr-2">{item.title}</span>
            </div>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r-0 mint-gradient-green relative overflow-hidden`}>
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none" />
      
      <SidebarHeader className="p-6 border-b border-white border-opacity-20 relative z-10">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-sm border border-white border-opacity-30">
            <span className="material-icons text-white text-xl">
              account_balance_wallet
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white drop-shadow-sm">Julius</h1>
              <p className="text-xs text-white opacity-80">Planejamento Financeiro</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 relative z-10">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-6 bg-white opacity-20" />

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
