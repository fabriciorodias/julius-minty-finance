
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

  const renderMenuItem = (item: typeof mainMenuItems[0]) => {
    const active = isActive(item.url);
    
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            className={({ isActive }) =>
              `flex items-center w-full px-2.5 py-2 rounded-lg transition-all ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <span className={`material-icons text-lg flex-shrink-0 transition-all ${
              active ? "text-white" : "text-gray-500"
            }`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="text-sm ml-3">{item.title}</span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-white/10"
      style={{ backgroundColor: '#1F2937' }}
    >
      <SidebarHeader 
        className="p-3 border-b border-white/10"
        style={{ backgroundColor: '#1F2937' }}
      >
        <BrandLogo collapsed={isCollapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4" style={{ backgroundColor: '#1F2937' }}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainMenuItems.map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-3 mx-2 h-px bg-white/10" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {settingsMenuItems.map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
