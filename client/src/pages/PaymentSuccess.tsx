import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isTrial = searchParams.get('trial') === 'true';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isTrial ? 'Essai gratuit activé !' : 'Paiement réussi !'}
          </CardTitle>
          <CardDescription>
            {isTrial 
              ? 'Votre essai gratuit de 14 jours a démarré avec succès'
              : 'Votre souscription a été confirmée avec succès'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  Vérifiez votre boîte email
                </p>
                <p className="text-sm text-muted-foreground">
                  Nous venons de vous envoyer vos identifiants de connexion par email.
                  Vous pourrez vous connecter à IzyInbox dès réception.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Compte administrateur créé
            </p>
            {isTrial ? (
              <>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Essai gratuit de 14 jours sans carte bancaire
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Accès complet à toutes les fonctionnalités
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Prélèvement automatique configuré pour le 5 de chaque mois
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Email de bienvenue envoyé avec vos identifiants
                </p>
              </>
            )}
          </div>

          <div className="pt-4 space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate('/login')}
              data-testid="button-go-login"
            >
              Se connecter maintenant
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/')}
              data-testid="button-back-home"
            >
              Retour à l'accueil
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Si vous ne recevez pas l'email dans les 5 minutes, vérifiez vos spams
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
