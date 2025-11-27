import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card><CardHeader><CardTitle>404</CardTitle></CardHeader><CardContent><p>Page non trouvée</p></CardContent></Card>
    </div>
  );
}
