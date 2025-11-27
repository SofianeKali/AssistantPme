import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Calendrier</h1>
        <p className="text-sm text-muted-foreground">Gestion de vos rendez-vous</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Calendrier</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Calendrier à venir</p></CardContent>
      </Card>
    </div>
  );
}
