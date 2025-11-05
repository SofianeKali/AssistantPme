import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function LandingNavbar() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);

    // If we're not on the landing page, navigate to it first
    if (location !== "/") {
      navigate("/");
      // Wait for navigation and DOM update before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      // We're already on the landing page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const navItems = [
    { label: "Accueil", action: () => scrollToSection("hero") },
    { label: "Fonctionnalités", action: () => scrollToSection("features") },
    { label: "Tarifs", action: () => scrollToSection("pricing") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <img src="/assets/logo2.svg" alt="Logo IzyInbox" className="h-6 w-6" />
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/contact")}
              data-testid="nav-contact"
            >
              Nous contacter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              data-testid="nav-login"
            >
              Connexion
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/subscribe")}
              data-testid="nav-start"
            >
              Démarrer gratuitement
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                navigate("/contact");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
              data-testid="nav-mobile-contact"
            >
              Nous contacter
            </button>
            <button
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
              data-testid="nav-mobile-login"
            >
              Connexion
            </button>
            <div className="px-4 pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  navigate("/subscribe");
                  setMobileMenuOpen(false);
                }}
                data-testid="nav-mobile-start"
              >
                Démarrer gratuitement
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
