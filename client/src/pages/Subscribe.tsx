import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, ArrowLeft } from "lucide-react";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  throw new Error('Missing VITE_STRIPE_PUBLIC_KEY environment variable');
}
const stripePromise = loadStripe(stripePublicKey);

const subscriptionSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  plan: z.enum(['starter', 'professional', 'enterprise']),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: 59,
    users: '1-5',
    emails: '500/mois',
  },
  professional: {
    name: 'Professional',
    price: 149,
    users: '5-20',
    emails: '2 000/mois',
  },
  enterprise: {
    name: 'Enterprise',
    price: 399,
    users: '20-100',
    emails: 'Illimité',
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
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Erreur de paiement",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du paiement",
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
            'Confirmer le paiement'
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé par Stripe • Prélèvement automatique le 5 de chaque mois
      </p>
    </form>
  );
}

export default function Subscribe() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  
  // Get plan from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const selectedPlan = searchParams.get('plan') || 'professional';

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      plan: selectedPlan as 'starter' | 'professional' | 'enterprise',
    },
  });

  const plan = form.watch('plan');
  const planDetails = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS];

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsCreating(true);
    try {
      const response = await apiRequest('POST', '/api/create-subscription', data);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la création de l\'abonnement');
      }

      setClientSecret(result.clientSecret);
      setStep('payment');

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

  const handleBack = () => {
    setStep('info');
    setClientSecret('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Souscrire à IzyInbox</h1>
          <p className="text-muted-foreground">
            Automatisez votre gestion administrative dès aujourd'hui
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(['starter', 'professional', 'enterprise'] as const).map((p) => (
            <Card
              key={p}
              className={`cursor-pointer transition-all ${
                plan === p ? 'border-primary ring-2 ring-primary' : ''
              }`}
              onClick={() => form.setValue('plan', p)}
              data-testid={`card-plan-${p}`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{PLAN_DETAILS[p].name}</CardTitle>
                <div className="text-2xl font-semibold">{PLAN_DETAILS[p].price}€/mois</div>
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
              {step === 'info' ? 'Vos informations' : 'Paiement sécurisé'}
            </CardTitle>
            <CardDescription>
              {step === 'info'
                ? 'Complétez vos informations pour créer votre compte'
                : `Finalisez votre souscription au plan ${planDetails.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'info' ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email professionnel</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Plan {planDetails.name}</span>
                      <span className="text-2xl font-semibold">{planDetails.price}€/mois</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Premier prélèvement aujourd'hui, puis le 5 de chaque mois
                    </p>
                    <Button
                      type="submit"
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
                        'Continuer vers le paiement'
                      )}
                    </Button>
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
            onClick={() => navigate('/')}
            data-testid="button-back-home"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
