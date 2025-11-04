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
  ArrowRight,
  Bot,
  TrendingUp,
  Users,
  Clock,
  Star,
} from "lucide-react";
import { useLocation } from "wouter";
import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";

export default function Landing() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero Section */}
      <div
        id="hero"
        className="relative overflow-hidden border-b border-border"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              className="mb-6 bg-primary/10 text-primary hover:bg-primary/20"
              data-testid="badge-promo"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Essai gratuit 14 jours
            </Badge>

            <h1 className="text-4xl md:text-6xl font-semibold mb-6 leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              L'assistant administratif IA pour PME françaises
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Gagnez{" "}
              <span className="text-foreground font-semibold">10h/semaine</span>{" "}
              grâce à une IA qui lit, répond, planifie et archive vos emails
              automatiquement.
            </p>

            <div className="flex gap-4 justify-center flex-wrap mb-12">
              <Button
                size="lg"
                onClick={() => navigate("/subscribe")}
                data-testid="button-start-free"
                className="text-base gap-2"
              >
                Démarrer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                data-testid="button-login"
                className="text-base"
              >
                Connexion
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Installation en 2 min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Support français 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Données hébergées en France</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 
      
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider">
            Ils nous font confiance
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="font-semibold">RGPD Conforme</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6" />
              <span className="font-semibold">France Cloud</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6" />
              <span className="font-semibold">4.8/5 sur Trustpilot</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-center mb-4">
          Ils ont réussi - c'est maintenant votre tour
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Découvrez comment les PME françaises utilisent IzyInbox pour
          transformer leur gestion administrative
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <TestimonialCard
            quote="IzyInbox nous fait gagner 15h par semaine. L'IA comprend vraiment nos emails et propose des réponses pertinentes."
            author="Sophie Martin"
            role="Directrice, Cabinet d'Architecture"
            features={["IA Email", "Calendrier", "Alertes"]}
          />
          <TestimonialCard
            quote="Grâce aux alertes personnalisées, nous ne manquons plus jamais un devis urgent. ROI en moins d'un mois !"
            author="Thomas Dubois"
            role="CEO, Agence Marketing"
            features={["Alertes", "Documents", "Dashboard"]}
          />
          <TestimonialCard
            quote="L'installation a pris 5 minutes. Le support français est réactif et l'interface est intuitive."
            author="Marie Lefebvre"
            role="Gérante, Boutique E-commerce"
            features={["Multi-comptes", "Cloud Drive", "OCR"]}
          />
        </div>
      </div>
 */}
      {/* AI Features Showcase */}
      <div
        id="features"
        className="bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20 border-y border-border"
      >
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <Bot className="h-3 w-3 mr-1" />
              Powered by GPT-5
            </Badge>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Intelligence artificielle au service de votre productivité
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              IzyInbox analyse, catégorise et répond à vos emails pendant que
              vous vous concentrez sur votre cœur de métier
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <FeatureShowcase
              icon={<Sparkles className="h-8 w-8" />}
              title="Analyse IA de vos emails"
              description="L'IA lit et comprend chaque email, détecte automatiquement sa catégorie et génère des réponses adaptées au contexte."
              highlights={[
                "Catégorisation automatique",
                "Détection de sentiment et priorité",
                "Génération de réponses contextuelles",
                "Extraction automatique des données",
              ]}
            />
            <FeatureShowcase
              icon={<Search className="h-8 w-8" />}
              title="Recherche en langage naturel"
              description="Trouvez n'importe quel email en posant simplement votre question. Plus besoin de chercher pendant des heures dans votre boîte mail."
              highlights={[
                "Recherche sémantique intelligente",
                "Questions en français naturel",
                "Résultats instantanés et pertinents",
                "Recherche dans les pièces jointes",
              ]}
            />
            <FeatureShowcase
              icon={<Calendar className="h-8 w-8" />}
              title="Planification automatique"
              description="Les rendez-vous détectés dans vos emails sont automatiquement ajoutés à votre calendrier avec suggestions de préparation."
              highlights={[
                "Vues Jour/Semaine/Mois",
                "Synchronisation multi-comptes",
                "Suggestions IA de préparation",
                "Rappels intelligents",
              ]}
            />
            <FeatureShowcase
              icon={<Zap className="h-8 w-8" />}
              title="Alertes personnalisées"
              description="Créez des règles d'alerte en langage naturel. L'IA vous prévient instantanément des situations critiques pour votre activité."
              highlights={[
                "Alertes en français naturel",
                "Notifications temps réel",
                "Priorités configurables",
                "Résolution en masse",
              ]}
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <StatCard
            number="10h"
            label="Gagnées par semaine"
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            number="95%"
            label="De précision IA"
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            number="2min"
            label="Installation"
            icon={<Zap className="h-6 w-6" />}
          />
          {/* <StatCard
            number="500+"
            label="PME utilisatrices"
            icon={<Users className="h-6 w-6" />}
          /> */}
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="container mx-auto px-6 py-20 bg-muted/20">
        <h2 className="text-3xl font-semibold text-center mb-4">
          Toutes les fonctionnalités dont vous avez besoin
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Une solution complète pour gérer vos emails, documents, rendez-vous et
          bien plus encore
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Dashboard personnalisable"
            description="KPIs visuels avec drag-and-drop, statistiques en temps réel et alertes critiques"
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
            icon={<Cloud className="h-6 w-6" />}
            title="Cloud personnel"
            description="Stockage sécurisé sur Google Drive ou OneDrive avec vos propres identifiants OAuth"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Sécurité & RGPD"
            description="Chiffrement AES-256-GCM, authentification double et conformité totale"
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Gestion multi-utilisateurs"
            description="Rôles et permissions configurables pour une collaboration efficace en équipe"
          />
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary text-primary-foreground">
            Offre de lancement
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Des tarifs transparents pour toutes les tailles d'entreprise
          </h2>
          <p className="text-lg text-muted-foreground mb-3">
            Choisissez le plan adapté à vos besoins • Prélèvement le 5 de chaque
            mois
          </p>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Essai gratuit 14 jours
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
            navigate={navigate}
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
            navigate={navigate}
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
            navigate={navigate}
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
            navigate={navigate}
          />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          -20% sur engagement annuel (2 mois gratuits) • Tous les plans incluent
          14 jours d'essai gratuit
        </p>
      </div>

      {/* Final CTA */}
      <div className="relative overflow-hidden border-y border-border bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20">
        <div className="container mx-auto px-6 py-20 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Prêt à transformer votre gestion administrative ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez les centaines de PME françaises qui économisent 10h par
              semaine avec IzyInbox
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                onClick={() => navigate("/subscribe")}
                data-testid="button-final-cta"
                className="text-base gap-2"
              >
                Démarrer l'essai gratuit
                <ArrowRight className="h-4 w-4" />
              </Button>
              {/* <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/beta")}
                data-testid="button-beta-cta"
                className="text-base"
              >
                Rejoindre le programme Beta
              </Button> */}
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Déjà client ?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-primary hover:underline"
                data-testid="link-login-footer"
              >
                Connexion
              </button>
            </p>
          </div>
        </div>
      </div>

      <LandingFooter />
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
    <div
      className="p-6 rounded-md border border-border bg-card hover-elevate"
      data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureShowcase({
  icon,
  title,
  description,
  highlights,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlights: string[];
}) {
  return (
    <div
      className="p-8 rounded-lg border border-border bg-card hover-elevate"
      data-testid={`showcase-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary/10 text-primary mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-3">
        {highlights.map((highlight, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm">{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  features,
}: {
  quote: string;
  author: string;
  role: string;
  features: string[];
}) {
  return (
    <Card
      className="hover-elevate"
      data-testid={`testimonial-${author.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardHeader>
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
          ))}
        </div>
        <CardDescription className="text-base italic">
          "{quote}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-sm">{author}</p>
        <p className="text-xs text-muted-foreground mb-3">{role}</p>
        <div className="flex gap-2 flex-wrap">
          {features.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="text-center"
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-center mb-3 text-primary">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-semibold mb-2">{number}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
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
  navigate,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  plan: string;
  popular?: boolean;
  navigate: (path: string) => void;
}) {
  const handleSubscribe = () => {
    if (plan === "custom") {
      navigate("/beta");
    } else {
      navigate(`/subscribe?plan=${plan}`);
    }
  };

  return (
    <Card
      className={`flex flex-col relative hover-elevate ${popular ? "border-primary border-2" : ""}`}
      data-testid={`pricing-card-${plan}`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge
            className="bg-primary text-primary-foreground px-4 py-1"
            data-testid="badge-popular"
          >
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
          {plan === "custom" ? "Nous contacter" : "Sélectionner"}
        </Button>
      </CardFooter>
    </Card>
  );
}
