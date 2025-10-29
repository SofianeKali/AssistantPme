import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  Settings,
  Tag,
  Bell,
  CheckSquare,
  Users,
  LogOut,
  ChevronUp,
  User,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoUrl from "../assets/logo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";

interface SidebarCounts {
  unprocessedEmails: number;
  unresolvedAlerts: number;
  tasksNew: number;
  tasksInProgress: number;
  upcomingAppointments: number;
  documentsInUnprocessedEmails: number;
}

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
    title: "Alertes",
    url: "/alerts",
    icon: Bell,
    testId: "sidebar-alerts",
  },
  {
    title: "Tâches",
    url: "/tasks",
    icon: CheckSquare,
    testId: "sidebar-tasks",
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
  const isMobile = useIsMobile();
  
  // Fetch sidebar counts
  const { data: counts } = useQuery<SidebarCounts>({
    queryKey: ['/api/sidebar/counts'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Filter config menu items based on user role
  const filteredConfigMenuItems = configMenuItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'admin';
    }
    return true;
  });

  // Helper function to get badge count for each menu item
  const getBadgeCount = (url: string): number | null => {
    if (!counts) return null;
    
    switch (url) {
      case '/emails':
        return counts.unprocessedEmails || null;
      case '/alerts':
        return counts.unresolvedAlerts || null;
      case '/tasks':
        return (counts.tasksNew + counts.tasksInProgress) || null;
      case '/calendar':
        return counts.upcomingAppointments || null;
      case '/documents':
        return counts.documentsInUnprocessedEmails || null;
      default:
        return null;
    }
  };

  // Helper function to get badge text for tasks (shows both counts)
  const getTasksBadgeText = (): string | null => {
    if (!counts) return null;
    const { tasksNew, tasksInProgress } = counts;
    if (tasksNew === 0 && tasksInProgress === 0) return null;
    if (tasksNew > 0 && tasksInProgress > 0) {
      return `${tasksNew}+${tasksInProgress}`;
    }
    return String(tasksNew + tasksInProgress);
  };

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

  // Don't render sidebar on mobile - use MobileBottomNav instead
  if (isMobile) {
    return null;
  }

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
            <span className="text-xs text-muted-foreground">Automatisation Intelligentes</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const badgeCount = getBadgeCount(item.url);
                const isTasksMenu = item.url === '/tasks';
                const tasksBadgeText = isTasksMenu ? getTasksBadgeText() : null;
                const showBadge = isTasksMenu ? tasksBadgeText !== null : badgeCount !== null && badgeCount > 0;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        {showBadge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto text-xs"
                            data-testid={`badge-count-${item.url.slice(1)}`}
                          >
                            {isTasksMenu ? tasksBadgeText : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-2 hover-elevate"
              data-testid="button-user-menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium truncate" data-testid="text-user-name">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </div>
                <div className="text-xs text-muted-foreground" data-testid="text-user-role">
                  {getUserRole()}
                </div>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Nom</span>
                </div>
                <div className="font-medium text-sm" data-testid="text-user-fullname">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : "Non renseigné"}
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Email</span>
                </div>
                <div className="font-medium text-sm truncate" data-testid="text-user-email">
                  {user?.email}
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Rôle</span>
                </div>
                <div className="font-medium text-sm" data-testid="text-user-role-detail">
                  {getUserRole()}
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => (window.location.href = "/api/logout")}
              className="text-destructive focus:text-destructive cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
