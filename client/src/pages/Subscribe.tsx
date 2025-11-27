import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Subscribe() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Abonnement</h1>
      <Card><CardContent className="pt-6"><p className="text-muted-foreground">Plans d'abonnement à venir</p></CardContent></Card>
    </div>
  );
}
