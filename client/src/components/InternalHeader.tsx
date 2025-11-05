import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoUrl from "../assets/logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

export function InternalHeader() {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 gap-4">
        {/* Left: Sidebar trigger + Logo */}
        <div className="flex items-center gap-3">
          {!isMobile && <SidebarTrigger data-testid="button-sidebar-toggle" />}
        </div>

        {/* Right: Theme toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
