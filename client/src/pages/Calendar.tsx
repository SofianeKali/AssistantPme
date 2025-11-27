import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CalendarIcon className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Calendrier
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mt-1">Gestion de vos rendez-vous et événements</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" />Calendrier</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Calendrier à venir</p></CardContent>
      </Card>
    </div>
  );
}
