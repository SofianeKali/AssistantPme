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
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="IzyInbox" className="h-8 w-8" />
            {!isMobile && (
              <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                IzyInbox
              </span>
            )}
          </div>
        </div>

        {/* Right: Theme toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
