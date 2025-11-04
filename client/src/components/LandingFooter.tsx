import { useLocation } from "wouter";
import { Mail, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";

export function LandingFooter() {
  const [, navigate] = useLocation();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* À propos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">À propos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              IzyInbox est l'assistant administratif intelligent qui aide les PME françaises 
              à gagner du temps grâce à l'IA.
            </p>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">I</span>
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                IzyInbox
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection("hero")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-accueil"
                >
                  Accueil
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-fonctionnalites"
                >
                  Fonctionnalités
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-tarifs"
                >
                  Tarifs
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/contact")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-contact"
                >
                  Nous contacter
                </button>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate("/login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-connexion"
                >
                  Connexion
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/subscribe")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-subscribe"
                >
                  S'inscrire
                </button>
              </li>
              <li>
                <span className="text-sm text-muted-foreground cursor-not-allowed">
                  Mentions légales
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground cursor-not-allowed">
                  Politique de confidentialité
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground cursor-not-allowed">
                  CGU/CGV
                </span>
              </li>
            </ul>
          </div>

          {/* Contact & Réseaux sociaux */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Nous suivre</h3>
            <div className="space-y-3 mb-4">
              <a 
                href="mailto:hello@izyinbox.fr" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="footer-email"
              >
                <Mail className="h-4 w-4" />
                hello@izyinbox.fr
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com/company/izyinbox"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-md bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                data-testid="social-linkedin"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/izyinbox"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-md bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                data-testid="social-twitter"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/izyinbox"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-md bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                data-testid="social-facebook"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/izyinbox"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-md bg-accent hover:bg-accent/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                data-testid="social-instagram"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} IzyInbox. Tous droits réservés.
            </p>
            <p className="text-sm text-muted-foreground">
              Fait avec ❤️ en France
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
