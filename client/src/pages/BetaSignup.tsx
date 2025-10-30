import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Mail, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Shield, 
  Check,
  ArrowRight,
  Building2,
  Users,
  Zap,
  FileText,
  Calendar,
  BarChart3
} from "lucide-react";

const betaSignupSchema = z.object({
  firstName: z.string().min(2, "Prénom requis (min. 2 caractères)"),
  lastName: z.string().min(2, "Nom requis (min. 2 caractères)"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Téléphone requis (min. 10 caractères)"),
  company: z.string().min(2, "Nom de l'entreprise requis"),
  companySize: z.string().min(1, "Veuillez sélectionner une taille"),
  role: z.string().min(1, "Veuillez sélectionner un rôle"),
  painPoint: z.string().min(20, "Veuillez décrire votre défi (min. 20 caractères)"),
});

type BetaSignupForm = z.infer<typeof betaSignupSchema>;

export default function BetaSignup() {
  const { toast } = useToast();
  
  const form = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      companySize: "",
      role: "",
      painPoint: "",
    },
  });

  const onSubmit = async (data: BetaSignupForm) => {
    try {
      // Simuler l'envoi (à remplacer par vraie API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Lead Beta:", data);
      
      toast({
        title: "Inscription réussie !",
        description: "Nous vous contacterons dans les 48h pour démarrer votre période beta.",
      });
      
      // Reset form and show success
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Programme Beta - Places Limitées
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Gagnez 10h/semaine sur votre gestion administrative
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Rejoignez les <span className="font-semibold text-foreground">premières PME françaises</span> qui 
              automatisent leurs emails, factures et rendez-vous grâce à l'IA GPT-5
            </p>
            
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">3 mois gratuits</div>
                  <div className="text-sm text-muted-foreground">Accès complet</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Support prioritaire</div>
                  <div className="text-sm text-muted-foreground">Réponse &lt;4h</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Influence produit</div>
                  <div className="text-sm text-muted-foreground">Vos besoins = priorité</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Form + Stats */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left: Stats & Benefits */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-semibold mb-6">
                Pourquoi rejoindre le beta ?
              </h2>
              
              <div className="space-y-4">
                <BenefitCard
                  icon={<TrendingUp className="h-6 w-6" />}
                  title="ROI démontrable en 3 mois"
                  description="70% de réduction du temps administratif = €3 640 économisés/mois pour une PME de 30 personnes"
                />
                <BenefitCard
                  icon={<Clock className="h-6 w-6" />}
                  title="Conformité 2026 garantie"
                  description="Facturation électronique Chorus Pro intégrée - préparez-vous dès maintenant à l'obligation légale"
                />
                <BenefitCard
                  icon={<Shield className="h-6 w-6" />}
                  title="Sécurité & RGPD natif"
                  description="Données hébergées en France, chiffrement AES-256, conformité totale RGPD"
                />
                <BenefitCard
                  icon={<Sparkles className="h-6 w-6" />}
                  title="IA optimisée pour le français"
                  description="GPT-5 entraîné sur le contexte business français : devis, factures, RDV"
                />
              </div>
            </div>

            {/* Features Grid */}
            <div className="bg-card border border-border rounded-md p-6">
              <h3 className="font-semibold mb-4 text-lg">Fonctionnalités incluses</h3>
              <div className="grid grid-cols-2 gap-3">
                <FeatureItem icon={<Mail />} text="Email IA" />
                <FeatureItem icon={<FileText />} text="Documents" />
                <FeatureItem icon={<Calendar />} text="Calendrier" />
                <FeatureItem icon={<BarChart3 />} text="Dashboard KPI" />
                <FeatureItem icon={<Zap />} text="Alertes auto" />
                <FeatureItem icon={<Building2 />} text="Multi-comptes" />
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-accent/20 rounded-md p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i} 
                      className="h-10 w-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-sm font-semibold"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold">15 entreprises beta</div>
                  <div className="text-sm text-muted-foreground">déjà actives</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                "En 2 semaines, IzyInbox a traité 450 emails automatiquement. 
                Je n'ai jamais été aussi organisé !"
              </p>
              <p className="text-sm font-medium mt-2">
                — Marie L., Cabinet d'expertise comptable
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-card border border-border rounded-md p-8 shadow-sm sticky top-6">
            <h2 className="text-2xl font-semibold mb-6">
              Rejoignez le programme beta
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Jean" 
                            {...field} 
                            data-testid="input-firstname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Dupont" 
                            {...field} 
                            data-testid="input-lastname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email professionnel *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="jean.dupont@entreprise.fr" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="06 12 34 56 78" 
                          {...field} 
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nom de votre entreprise" 
                          {...field} 
                          data-testid="input-company"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille de l'entreprise *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-companysize">
                            <SelectValue placeholder="Sélectionnez..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employés</SelectItem>
                          <SelectItem value="10-50">10-50 employés</SelectItem>
                          <SelectItem value="50-100">50-100 employés</SelectItem>
                          <SelectItem value="100+">100+ employés</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Votre rôle *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Sélectionnez..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ceo">Dirigeant / CEO</SelectItem>
                          <SelectItem value="cfo">Directeur Financier / CFO</SelectItem>
                          <SelectItem value="admin">Responsable Admin / Office Manager</SelectItem>
                          <SelectItem value="it">Responsable IT</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="painPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Votre principal défi administratif *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Nous recevons 200+ emails/jour et perdons trop de temps à trier et répondre..."
                          rows={3}
                          {...field}
                          data-testid="input-painpoint"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-accent/20 rounded-md p-4 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 inline mr-2 text-primary" />
                  En soumettant ce formulaire, vous acceptez d'être contacté par notre équipe 
                  pour une démo personnalisée. Aucun engagement. Données sécurisées (RGPD).
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-base"
                  disabled={form.formState.isSubmitting}
                  data-testid="button-submit-beta"
                >
                  {form.formState.isSubmitting ? (
                    "Envoi en cours..."
                  ) : (
                    <>
                      Rejoindre le beta
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Places limitées à 50 entreprises
                </p>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Une question ? Contactez-nous
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="mailto:hello@izyinbox.fr" className="text-primary hover:underline">
              hello@izyinbox.fr
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="tel:+33123456789" className="text-primary hover:underline">
              01 23 45 67 89
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="https://linkedin.com/company/izyinbox" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-md border border-border bg-card/50 hover-elevate">
      <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}
