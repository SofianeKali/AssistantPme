import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  Settings,
  Tag,
  Bell,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const mainMenuItems = [
  {
    title: "Tableau de bord",
    url: "/",
    icon: LayoutDashboard,
    testId: "sidebar-dashboard",
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
    testId: "sidebar-emails",
  },
  {
    title: "Calendrier",
    url: "/calendar",
    icon: Calendar,
    testId: "sidebar-calendar",
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    testId: "sidebar-documents",
  },
  {
    title: "Alertes",
    url: "/alerts",
    icon: Bell,
    testId: "sidebar-alerts",
  },
];

const configMenuItems = [
  {
    title: "Étiquettes",
    url: "/tags",
    icon: Tag,
    testId: "sidebar-tags",
  },
  {
    title: "Utilisateurs",
    url: "/users",
    icon: Users,
    testId: "sidebar-users",
  },
  {
    title: "Configuration",
    url: "/settings",
    icon: Settings,
    testId: "sidebar-settings",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getUserRole = () => {
    if (user?.role === "gerant") return "Gérant";
    if (user?.role === "administrateur") return "Administrateur";
    return "Collaborateur";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Assistant Admin</span>
            <span className="text-xs text-muted-foreground">Intelligent PME</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email}
            </div>
            <div className="text-xs text-muted-foreground">{getUserRole()}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (window.location.href = "/api/logout")}
            data-testid="button-logout"
            className="h-8 w-8"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
