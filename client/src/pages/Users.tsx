import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function Users() {
  const { data: users } = useQuery({ queryKey: ["/api/users"] });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Utilisateurs</h1>
      <Card><CardContent className="pt-6"><p className="text-muted-foreground">{users?.length || 0} utilisateurs</p></CardContent></Card>
    </div>
  );
}
