import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configuration de l'application</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Paramètres à venir</p></CardContent>
      </Card>
    </div>
  );
}
