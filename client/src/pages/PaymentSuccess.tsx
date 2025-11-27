import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccess() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-green-600" />Paiement réussi</CardTitle></CardHeader><CardContent><p>Merci pour votre inscription</p></CardContent></Card>
    </div>
  );
}
