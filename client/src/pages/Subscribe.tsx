import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  throw new Error("Missing VITE_STRIPE_PUBLIC_KEY environment variable");
}
const stripePromise = loadStripe(stripePublicKey);

const subscriptionSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  companyName: z
    .string()
    .min(2, "La raison sociale doit contenir au moins 2 caractères"),
  companyAddress: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères"),
  email: z.string().email("Email invalide"),
  plan: z.enum(["starter", "professional", "enterprise"]),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const PLAN_DETAILS = {
  starter: {
    name: "Starter",
    price: 19,
    users: "1-5",
    emails: "500/mois",
  },
  professional: {
    name: "Professional",
    price: 39,
    users: "5-20",
    emails: "2 000/mois",
  },
  enterprise: {
    name: "Enterprise",
    price: 79,
    users: "20-100",
    emails: "Illimité",
  },
};

function CheckoutForm({ plan, onBack }: { plan: string; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log("[Stripe] Confirming payment...");
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      console.log("[Stripe] Payment result:", result);
      
      if (result.error) {
        console.error("[Stripe] Payment error details:", {
          type: result.error.type,
          code: result.error.code,
          message: result.error.message,
          decline_code: result.error.decline_code,
        });
        toast({
          title: "Erreur de paiement",
          description: result.error.message || "Le paiement a échoué",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("[Stripe] Payment exception:", err);
      console.error("[Stripe] Error details:", JSON.stringify(err, null, 2));
      toast({
        title: "Erreur",
        description: err?.message || "Une erreur est survenue lors du traitement du paiement",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-confirm-payment"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            "Confirmer le paiement"
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé par Stripe • Prélèvement automatique le 5 de chaque
        mois
      </p>
    </form>
  );
}

export default function Subscribe() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<"info" | "payment">("info");

  // Get plan from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const selectedPlan = searchParams.get("plan") || "professional";

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      companyAddress: "",
      email: "",
      plan: selectedPlan as "starter" | "professional" | "enterprise",
    },
  });

  const plan = form.watch("plan");
  const planDetails = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS];

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsCreating(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/create-subscription",
        data,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Erreur lors de la création de l'abonnement",
        );
      }

      setClientSecret(result.clientSecret);
      setStep("payment");

      toast({
        title: "Étape suivante",
        description: "Veuillez saisir vos informations de paiement",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartTrial = async () => {
    const formData = form.getValues();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.companyName ||
      !formData.companyAddress ||
      !formData.email
    ) {
      toast({
        title: "Informations manquantes",
        description:
          "Veuillez remplir toutes les informations avant de démarrer l'essai",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/start-trial", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        email: formData.email,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Erreur lors de la création de l'essai gratuit",
        );
      }

      toast({
        title: "Essai gratuit activé !",
        description: "Consultez votre email pour vos identifiants de connexion",
      });

      // Redirect to payment success with trial info
      setTimeout(() => {
        navigate("/payment-success?trial=true");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    setStep("info");
    setClientSecret("");
  };

  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 flex items-center justify-center p-6 pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-pink-400/10 dark:from-blue-600/10 dark:to-pink-600/10 pointer-events-none" />
        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              Souscrire à IzyInbox
            </h1>
            <p className="text-muted-foreground">
              Automatisez votre gestion administrative dès aujourd'hui
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(["starter", "professional", "enterprise"] as const).map((p) => (
            <Card
              key={p}
              className={`cursor-pointer transition-all ${
                plan === p ? "border-primary ring-2 ring-primary" : ""
              }`}
              onClick={() => form.setValue("plan", p)}
              data-testid={`card-plan-${p}`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {PLAN_DETAILS[p].name}
                </CardTitle>
                <div className="text-2xl font-semibold">
                  {PLAN_DETAILS[p].price}€/mois
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {PLAN_DETAILS[p].users} utilisateurs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {PLAN_DETAILS[p].emails}
                  </li>
                </ul>
              </CardContent>
            </Card>
          ))}
          </div>

          <Card>
          <CardHeader>
            <CardTitle>
              {step === "info" ? "Vos informations" : "Paiement sécurisé"}
            </CardTitle>
            <CardDescription>
              {step === "info"
                ? "Complétez vos informations pour créer votre compte"
                : `Finalisez votre souscription au plan ${planDetails.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "info" ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-firstName" />
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
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-lastName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 border-t">
                    <h3 className="text-sm font-semibold mb-3 text-foreground">
                      Informations entreprise
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Raison sociale</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Nom de votre entreprise"
                                data-testid="input-companyName"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="companyAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse de l'entreprise</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Adresse complète"
                                data-testid="input-companyAddress"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email professionnel</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t space-y-4">
                    {/* Free Trial Option */}
                    {/* <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-semibold text-primary">
                          Essai gratuit 14 jours
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Commencez dès maintenant sans carte bancaire • Aucun
                        engagement
                      </p>
                      <Button
                        type="button"
                        onClick={handleStartTrial}
                        className="w-full"
                        disabled={isCreating}
                        data-testid="button-start-trial"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Création...
                          </>
                        ) : (
                          "Démarrer l'essai gratuit"
                        )}
                      </Button>
                    </div> */}

                    {/* Divider */}
                    {/* <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Ou souscrire directement
                        </span>
                      </div>
                    </div> */}

                    {/* Paid Subscription */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">
                          Plan {planDetails.name}
                        </span>
                        <span className="text-2xl font-semibold">
                          {planDetails.price}€/mois
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Premier prélèvement aujourd'hui, puis le 5 de chaque
                        mois
                      </p>
                      <Button
                        type="submit"
                        variant="default"
                        className="w-full"
                        disabled={isCreating}
                        data-testid="button-next"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Création...
                          </>
                        ) : (
                          "Continuer vers le paiement"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm plan={plan} onBack={handleBack} />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              data-testid="button-back-home"
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
      <LandingFooter />
    </>
  );
}
