import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Bell, Mail, BarChart3, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ["/api/dashboard/stats"] });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover-elevate">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-blue-600" />Tâches</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.taskCount || 0}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover-elevate">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-red-600" />Alertes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.alertCount || 0}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 hover-elevate">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-purple-600" />Emails</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.emailCount || 0}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}
