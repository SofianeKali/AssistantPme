import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  Bell,
  Settings,
  Menu,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    testId: "mobile-nav-dashboard",
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
    testId: "mobile-nav-emails",
  },
  {
    title: "Calendrier",
    url: "/calendar",
    icon: Calendar,
    testId: "mobile-nav-calendar",
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    testId: "mobile-nav-documents",
  },
  {
    title: "Plus",
    url: "#",
    icon: Menu,
    testId: "mobile-nav-more",
    isMenu: true,
  },
];

const moreMenuItems = [
  {
    title: "Alertes",
    url: "/alerts",
    icon: Bell,
    testId: "mobile-menu-alerts",
  },
  {
    title: "Configuration",
    url: "/settings",
    icon: Settings,
    testId: "mobile-menu-settings",
    adminOnly: true,
  },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredMoreItems = moreMenuItems.filter((item) => {
    if (item.adminOnly) {
      return user?.role === "admin";
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

  const handleNavClick = (item: any) => {
    if (item.isMenu) {
      setIsMenuOpen(true);
    }
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border md:hidden"
        data-testid="mobile-bottom-nav"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const isActive = item.isMenu ? false : location === item.url;
            const Icon = item.icon;

            if (item.isMenu) {
              return (
                <button
                  key={item.title}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                    "hover-elevate active-elevate-2",
                    "text-muted-foreground"
                  )}
                  data-testid={item.testId}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.title}</span>
                </button>
              );
            }

            return (
              <Link key={item.title} href={item.url}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] cursor-pointer",
                    "hover-elevate active-elevate-2",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  )}
                  data-testid={item.testId}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.profileImageUrl || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getUserRole()}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              {filteredMoreItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.url;

                return (
                  <Link key={item.title} href={item.url}>
                    <div
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer",
                        "hover-elevate active-elevate-2",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-foreground"
                      )}
                      data-testid={item.testId}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Separator />

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => (window.location.href = "/api/logout")}
              data-testid="mobile-button-logout"
            >
              Déconnexion
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
