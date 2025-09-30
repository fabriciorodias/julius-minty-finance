
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
              `flex items-center w-full px-2.5 py-2 rounded-lg transition-notion ${
                isActive
                  ? "bg-notion-gray-100 text-notion-gray-900 font-medium shadow-notion-sm"
                  : "text-notion-gray-600 hover:bg-notion-gray-100 hover:text-notion-gray-900"
              }`
            }
          >
            <span className={`material-icons text-lg flex-shrink-0 transition-notion ${
              active ? "text-notion-gray-900" : "text-notion-gray-500"
            }`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="text-notion-body-sm ml-3">{item.title}</span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-notion-gray-200 bg-notion-gray-50">
      <SidebarHeader className="p-3 border-b border-notion-gray-200">
        <BrandLogo collapsed={isCollapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainMenuItems.map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-3" />

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
