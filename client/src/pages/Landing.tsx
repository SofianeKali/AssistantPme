import { Button } from "@/components/ui/button";
import { Mail, Zap, BarChart3, Calendar, FileText, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div 
                className="h-24 w-24 rounded-md bg-primary/10 flex items-center justify-center"
                data-testid="img-logo"
              >
                <Mail className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-semibold text-foreground mb-4">
              IzyInbox
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Smart Automation
            </p>
            <p className="text-base text-muted-foreground mb-8">
              Automatisez la gestion de vos emails, devis, factures et rendez-vous grâce à l'intelligence artificielle
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                onClick={() => (window.location.href = "/login")}
                data-testid="button-login"
                className="text-base"
              >
                Connexion Email/Mot de passe
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => (window.location.href = "/api/login")}
                data-testid="button-replit-login"
                className="text-base"
              >
                Connexion avec Replit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-center mb-12">
          Fonctionnalités principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Mail className="h-6 w-6" />}
            title="Analyse intelligente des emails"
            description="Détection automatique des devis, factures et demandes de rendez-vous"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Réponses automatiques"
            description="Génération de réponses pertinentes avec validation avant envoi"
          />
          <FeatureCard
            icon={<Calendar className="h-6 w-6" />}
            title="Calendrier intelligent"
            description="Planification automatique des rendez-vous avec suggestions"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Gestion documentaire"
            description="Classification et stockage automatique des pièces jointes"
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Alertes personnalisées"
            description="Notifications pour devis sans réponse et factures impayées"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Sécurité RGPD"
            description="Protection et chiffrement de vos données sensibles"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card border-t border-border">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Prêt à simplifier votre gestion administrative ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Commencez dès maintenant et gagnez du temps précieux
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => (window.location.href = "/login")}
              data-testid="button-cta-login"
            >
              Démarrer gratuitement
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => (window.location.href = "/api/login")}
              data-testid="button-cta-replit-login"
            >
              Connexion Replit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-md border border-border bg-card hover-elevate">
      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
