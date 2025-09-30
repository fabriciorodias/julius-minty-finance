
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
import { BrandLogo } from "@/components/layout/BrandLogo";

const mainMenuItems = [
  {
    title: "Projeções",
    url: "/projecoes",
    icon: "timeline"
  },
  {
    title: "Panorama",
    url: "/dashboard",
    icon: "dashboard"
  },
  {
    title: "Investimentos",
    url: "/investimentos",
    icon: "trending_up"
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
    title: "Lançamentos Recorrentes",
    url: "/lancamentos/recorrentes",
    icon: "repeat"
  },
  {
    title: "Contas",
    url: "/contas",
    icon: "account_balance"
  }
];

const settingsMenuItems = [
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: "settings"
  },
  {
    title: "Ferramentas",
    url: "/ferramentas",
    icon: "build"
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
            `flex items-start w-full px-3 py-3 rounded-xl transition-all duration-300 min-h-[48px] relative overflow-hidden hover-scale ${
              isActive
                ? "liquid-glass-primary text-white shadow-xl font-semibold border border-white/30 backdrop-blur-md"
                : "text-white/90 hover:bg-white/20 hover:text-white hover:shadow-lg hover:backdrop-blur-md"
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
    <Sidebar collapsible="icon" className="border-r-0 glass-origin backdrop-blur-2xl">
      {/* Enhanced gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-primary/5 to-black/20 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent pointer-events-none z-0" />
      
      <SidebarHeader className="p-6 border-b border-white/30 relative z-10 backdrop-blur-lg shadow-lg">
        <BrandLogo collapsed={isCollapsed} />
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 relative z-10">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map((item, index) => (
                <div key={item.title} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                  {renderMenuItem(item)}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-6 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {settingsMenuItems.map((item, index) => (
                <div key={item.title} className="animate-fade-in" style={{ animationDelay: `${(mainMenuItems.length + index) * 30}ms` }}>
                  {renderMenuItem(item)}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
