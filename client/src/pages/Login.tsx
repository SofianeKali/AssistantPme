import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Lock, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingFooter } from "@/components/LandingFooter";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/local/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erreur de connexion",
          description: error.message || "Email ou mot de passe incorrect",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Connexion réussie",
        description: "Redirection en cours...",
      });

      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 p-4 pt-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-pink-400/10 dark:from-blue-600/10 dark:to-pink-600/10 pointer-events-none" />
        <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div
              className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center"
              data-testid="img-logo"
            >
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            Bienvenue sur IzyInbox
          </CardTitle>
          <CardDescription>
            Connectez-vous avec vos identifiants
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="votre@email.com"
                          className="pl-10"
                          disabled={isLoading}
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          disabled={isLoading}
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? (
                  "Connexion en cours..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/api/login")}
            disabled={isLoading}
            data-testid="button-replit-auth"
          >
            Connexion avec Replit
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Une gestion intteligente de vos emails au service de votre
            productivité.
          </p>
        </CardFooter>
        </Card>
      </div>
      <LandingFooter />
    </>
  );
}
