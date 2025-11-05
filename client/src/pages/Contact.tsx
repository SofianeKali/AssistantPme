import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { useLocation } from "wouter";
import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";

const contactSchema = z.object({
  firstName: z.string().min(2, "Prénom requis (min. 2 caractères)"),
  lastName: z.string().min(2, "Nom requis (min. 2 caractères)"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(3, "Objet requis (min. 3 caractères)"),
  message: z.string().min(20, "Message requis (min. 20 caractères)"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      // Simuler l'envoi (à remplacer par vraie API)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Message de contact:", data);

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

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
    <>
      <LandingNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 pt-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-pink-400/10 dark:from-blue-600/10 dark:to-pink-600/10 pointer-events-none" />
        {/* Header */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-6 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <MessageSquare className="h-4 w-4" />
                Nous contacter
              </div>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                Une question ? Parlons-en !
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Notre équipe est à votre écoute pour répondre à toutes vos
                questions sur IzyInbox et vous accompagner dans votre projet.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-semibold mb-6">
                  Contactez-nous directement
                </h2>

                <div className="space-y-6">
                  <ContactInfoCard
                    icon={<Mail className="h-6 w-6" />}
                    title="Email"
                    info="contact@izyinbox.fr"
                    subInfo="Réponse sous 24h"
                    action="mailto:contact@izyinbox.fr"
                  />
                  <ContactInfoCard
                    icon={<Phone className="h-6 w-6" />}
                    title="Téléphone"
                    info="+33 1 23 45 67 89"
                    subInfo="Lun-Ven, 9h-18h"
                    action="tel:+33123456789"
                  />
                  <ContactInfoCard
                    icon={<MapPin className="h-6 w-6" />}
                    title="Adresse"
                    info="Paris, France"
                    subInfo="Siège social"
                  />
                  <ContactInfoCard
                    icon={<Clock className="h-6 w-6" />}
                    title="Horaires"
                    info="Lundi - Vendredi"
                    subInfo="9h00 - 18h00"
                  />
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-card border border-border rounded-md p-6">
                <h3 className="font-semibold mb-4 text-lg">Liens rapides</h3>
                <div className="space-y-3">
                  <QuickLink
                    text="Découvrir les tarifs"
                    onClick={() => navigate("/subscribe")}
                  />
                  <QuickLink
                    text="Commencer l'essai gratuit"
                    onClick={() => navigate("/subscribe")}
                  />
                  <QuickLink
                    text="Se connecter"
                    onClick={() => navigate("/login")}
                  />
                  <QuickLink
                    text="Retour à l'accueil"
                    onClick={() => navigate("/")}
                  />
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-accent/20 rounded-md p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold">Réponse rapide garantie</div>
                    <div className="text-sm text-muted-foreground">
                      Sous 24h en semaine
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notre équipe s'engage à vous répondre dans les meilleurs
                  délais. Vos données sont traitées en toute confidentialité
                  (RGPD).
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-card border border-border rounded-md p-8 shadow-sm sticky top-6">
              <h2 className="text-2xl font-semibold mb-6">
                Envoyez-nous un message
              </h2>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
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
                        <FormLabel>Email *</FormLabel>
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
                        <FormLabel>Téléphone (optionnel)</FormLabel>
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
                        <FormLabel>Entreprise (optionnel)</FormLabel>
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
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objet *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Demande d'information"
                            {...field}
                            data-testid="input-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre demande ou vos questions..."
                            rows={4}
                            {...field}
                            data-testid="input-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-accent/20 rounded-md p-4 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 inline mr-2 text-primary" />
                    Vos données sont traitées de manière confidentielle et
                    sécurisée (RGPD).
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-base"
                    disabled={form.formState.isSubmitting}
                    data-testid="button-submit-contact"
                  >
                    {form.formState.isSubmitting ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        Envoyer le message
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
      <LandingFooter />
    </>
  );
}

function ContactInfoCard({
  icon,
  title,
  info,
  subInfo,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  info: string;
  subInfo: string;
  action?: string;
}) {
  const content = (
    <div className="flex gap-4 p-4 rounded-md border border-border bg-card/50 hover-elevate">
      <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm font-medium">{info}</p>
        <p className="text-xs text-muted-foreground">{subInfo}</p>
      </div>
    </div>
  );

  if (action) {
    return (
      <a href={action} className="block">
        {content}
      </a>
    );
  }

  return content;
}

function QuickLink({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-primary hover:underline w-full text-left"
      data-testid={`link-${text.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CheckCircle2 className="h-4 w-4" />
      {text}
    </button>
  );
}
