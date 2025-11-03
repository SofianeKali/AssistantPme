import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Zap,
  BarChart3,
  Calendar,
  FileText,
  Shield,
  Search,
  Cloud,
  Sparkles,
  Check,
  CheckCircle2,
} from "lucide-react";

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
            <p className="text-base text-muted-foreground mb-8">
              Gérez vos e-mails sans effort grâce à l’IA
            </p>
            <p className="text-4xl font-semibold text-foreground mb-4">
              → Gagnez 10h/semaine grâce à une IA qui lit, répond, planifie et
              archive pour vous.
            </p>
            <div className="flex gap-4 justify-center flex-wrap py-16">
              <Button
                size="lg"
                onClick={() => (window.location.href = "/login")}
                data-testid="button-login"
                className="text-base"
              >
                Connexion Email
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
            icon={<Sparkles className="h-6 w-6" />}
            title="IA GPT-5 pour vos emails"
            description="Catégorisation automatique, détection de priorité, sentiment et génération de réponses"
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Dashboard personnalisable"
            description="KPIs visuels avec drag-and-drop, statistiques en temps réel et alertes critiques"
          />
          <FeatureCard
            icon={<Search className="h-6 w-6" />}
            title="Recherche sémantique"
            description="Trouvez vos emails en langage naturel grâce à l'IA contextuelle"
          />
          <FeatureCard
            icon={<Calendar className="h-6 w-6" />}
            title="Calendrier multi-vues"
            description="Vues Jour/Semaine/Mois avec planification automatique des rendez-vous"
          />
          <FeatureCard
            icon={<Cloud className="h-6 w-6" />}
            title="Cloud personnel (Drive/OneDrive)"
            description="Stockage sécurisé de vos documents avec vos propres identifiants OAuth"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Alertes en langage naturel"
            description="Créez des règles d'alerte personnalisées simplement en parlant à l'IA"
          />
          <FeatureCard
            icon={<Mail className="h-6 w-6" />}
            title="Multi-comptes email"
            description="Gérez plusieurs comptes IMAP/SMTP avec scan automatique et configuration de fréquence"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Extraction de documents"
            description="Reconnaissance OCR et extraction de texte des PDF avec recherche full-text"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Sécurité & RGPD"
            description="Chiffrement AES-256-GCM, authentification double et conformité totale"
          />
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">
            Tarifs simples et transparents
          </h2>
          <p className="text-lg text-muted-foreground mb-3">
            Choisissez le plan adapté à votre entreprise • Prélèvement le 5 de
            chaque mois
          </p>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Essai gratuit 14 jours sans carte bancaire
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <PricingCard
            name="Starter"
            price="59"
            description="Pour les micro-entreprises"
            features={[
              "1-5 utilisateurs",
              "500 emails/mois",
              "10 000 crédits IA",
              "Support email",
              "Stockage cloud personnel",
              "Catégories personnalisées",
            ]}
            plan="starter"
          />
          <PricingCard
            name="Professional"
            price="149"
            description="Pour les PME en croissance"
            features={[
              "5-20 utilisateurs",
              "2 000 emails/mois",
              "50 000 crédits IA",
              "Support prioritaire",
              "Multi-comptes email",
              "Alertes personnalisées",
              "Intégrations avancées",
            ]}
            plan="professional"
            popular
          />
          <PricingCard
            name="Enterprise"
            price="399"
            description="Pour les grandes équipes"
            features={[
              "20-100 utilisateurs",
              "Emails illimités",
              "200 000 crédits IA",
              "Support dédié 24/7",
              "Onboarding personnalisé",
              "SLA garanti",
              "Conformité avancée",
            ]}
            plan="enterprise"
          />
          <PricingCard
            name="Custom"
            price="Sur devis"
            description="Solution sur mesure"
            features={[
              "Utilisateurs illimités",
              "Volume illimité",
              "Crédits IA personnalisés",
              "Account manager dédié",
              "Développements custom",
              "Intégration SI",
              "Formation sur site",
            ]}
            plan="custom"
          />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          -20% sur engagement annuel (2 mois gratuits) • Essai gratuit 14 jours
          sans CB
        </p>
      </div>

      {/* Beta CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-y border-border">
        <div className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Programme Beta - Places Limitées
            </div>
            <h2 className="text-3xl font-semibold mb-4">
              Rejoignez les premières PME françaises qui testent IzyInbox
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              3 mois gratuits • Support prioritaire • Influence directe sur le
              produit
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = "/beta")}
              data-testid="button-join-beta"
              className="text-base"
            >
              Rejoindre le programme Beta
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Déjà client ?</h2>
          <p className="text-muted-foreground mb-8">
            Connectez-vous à votre compte pour accéder à votre tableau de bord
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => (window.location.href = "/login")}
              data-testid="button-cta-login"
              variant="outline"
            >
              Connexion Email/Mot de passe
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

function PricingCard({
  name,
  price,
  description,
  features,
  plan,
  popular = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  plan: string;
  popular?: boolean;
}) {
  const handleSubscribe = () => {
    if (plan === "custom") {
      window.location.href = "/beta"; // Redirect custom to beta for now
    } else {
      window.location.href = `/subscribe?plan=${plan}`;
    }
  };

  return (
    <Card
      className={`flex flex-col relative ${popular ? "border-primary" : ""}`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Plus populaire
          </Badge>
        </div>
      )}
      <CardHeader className="pb-8">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          {price === "Sur devis" ? (
            <div className="text-2xl font-semibold">{price}</div>
          ) : (
            <>
              <span className="text-4xl font-semibold">{price}€</span>
              <span className="text-muted-foreground">/mois</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? "default" : "outline"}
          onClick={handleSubscribe}
          data-testid={`button-subscribe-${plan}`}
        >
          {plan === "custom" ? "Nous contacter" : "Souscrire"}
        </Button>
      </CardFooter>
    </Card>
  );
}
