import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Sparkles, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md px-6">
        <Card className="border-border">
          <CardContent className="pt-12 pb-8 px-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <h1 className="text-2xl font-semibold text-foreground mb-3" data-testid="text-login-title">
                Assistant Administratif Intelligent
              </h1>
              
              <p className="text-sm text-muted-foreground" data-testid="text-login-description">
                Automatisez la gestion de vos emails, devis, factures et rendez-vous grâce à l'IA
              </p>
            </div>

            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full text-base"
                onClick={() => (window.location.href = "/api/login")}
                data-testid="button-login"
              >
                <Lock className="h-4 w-4 mr-2" />
                Se connecter avec Replit
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground px-4" data-testid="text-security-info">
                <Sparkles className="h-3 w-3 flex-shrink-0" />
                <span>Connexion sécurisée via OpenID Connect</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border" data-testid="container-features">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div data-testid="feature-ai">
                  <div className="text-lg font-semibold text-foreground">IA</div>
                  <div className="text-xs text-muted-foreground">Analyse GPT</div>
                </div>
                <div data-testid="feature-auto">
                  <div className="text-lg font-semibold text-foreground">Auto</div>
                  <div className="text-xs text-muted-foreground">Réponses</div>
                </div>
                <div data-testid="feature-247">
                  <div className="text-lg font-semibold text-foreground">24/7</div>
                  <div className="text-xs text-muted-foreground">Surveillance</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6" data-testid="text-rgpd-notice">
          Vos données sont protégées conformément au RGPD
        </p>
      </div>
    </div>
  );
}
