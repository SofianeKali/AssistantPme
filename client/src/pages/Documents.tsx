import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Documents() {
  const { data: documents } = useQuery({ queryKey: ["/api/documents"] });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Documents</h1>
        <p className="text-sm text-muted-foreground">Gestion de vos documents</p>
      </div>
      <Card>
        <CardContent className="pt-6"><p className="text-muted-foreground">{documents?.length || 0} documents</p></CardContent>
      </Card>
    </div>
  );
}
