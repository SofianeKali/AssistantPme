import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  Settings,
  Tag,
  Bell,
  Users,
  LogOut,
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
import logoUrl from "../assets/izyinbox-logo.png";

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
    adminOnly: true, // Only admins can manage tags
  },
  {
    title: "Utilisateurs",
    url: "/users",
    icon: Users,
    testId: "sidebar-users",
    adminOnly: true, // Only show to admin users
  },
  {
    title: "Configuration",
    url: "/settings",
    icon: Settings,
    testId: "sidebar-settings",
    adminOnly: true, // Only show to admin users
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Filter config menu items based on user role
  const filteredConfigMenuItems = configMenuItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'admin';
    }
    return true;
  });

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getUserRole = () => {
    if (user?.role === "admin") return "Administrateur";
    return "Utilisateur";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src={logoUrl} 
            alt="IzyInbox Logo" 
            className="h-10 w-10 rounded-md object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">IzyInbox</span>
            <span className="text-xs text-muted-foreground">Smart Automation</span>
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
              {filteredConfigMenuItems.map((item) => (
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
