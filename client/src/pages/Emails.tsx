import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Emails() {
  const { data: emails } = useQuery({ queryKey: ["/api/emails"] });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Emails</h1>
        <p className="text-sm text-muted-foreground">Gestion de vos emails</p>
      </div>
      <Card>
        <CardContent className="pt-6"><p className="text-muted-foreground">{emails?.length || 0} emails</p></CardContent>
      </Card>
    </div>
  );
}
