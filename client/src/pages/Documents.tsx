import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, File, Download, Eye, Grid, List, FileImage, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Documents() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/documents", { type: typeFilter, search }],
  });

  const getDocTypeColor = (type: string) => {
    switch (type) {
      case "facture":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "devis":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      case "contrat":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes("pdf")) {
      return <FileText className="h-12 w-12 text-destructive" />;
    }
    if (mimeType?.includes("image")) {
      return <FileImage className="h-12 w-12 text-primary" />;
    }
    if (mimeType?.includes("word")) {
      return <FileText className="h-12 w-12 text-chart-1" />;
    }
    if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) {
      return <FileSpreadsheet className="h-12 w-12 text-chart-2" />;
    }
    return <File className="h-12 w-12 text-muted-foreground" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Gestion centralisée de tous vos documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
            className={viewMode === "list" ? "bg-muted" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
            className={viewMode === "grid" ? "bg-muted" : ""}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-document"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-document-type">
            <SelectValue placeholder="Type de document" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="facture">Factures</SelectItem>
            <SelectItem value="devis">Devis</SelectItem>
            <SelectItem value="contrat">Contrats</SelectItem>
            <SelectItem value="autre">Autres</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Display */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "h-48" : "h-20"} />
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents && documents.length > 0 ? (
            documents.map((doc: any) => (
              <Card
                key={doc.id}
                className="p-4 hover-elevate cursor-pointer"
                data-testid={`document-card-${doc.id}`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-center h-32 bg-muted rounded-md mb-3">
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium line-clamp-2 mb-2">{doc.filename}</h3>
                    {doc.documentType && (
                      <Badge variant="outline" className={`text-xs mb-2 ${getDocTypeColor(doc.documentType)}`}>
                        {doc.documentType}
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
            </div>
          )}
        </div>
      ) : (
        <Card className="divide-y divide-border">
          {documents && documents.length > 0 ? (
            documents.map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 hover-elevate cursor-pointer"
                data-testid={`document-row-${doc.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">{getFileIcon(doc.mimeType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium truncate">{doc.filename}</h3>
                      {doc.documentType && (
                        <Badge variant="outline" className={`text-xs ${getDocTypeColor(doc.documentType)}`}>
                          {doc.documentType}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(doc.createdAt), "dd MMMM yyyy", { locale: fr })} •{" "}
                      {(doc.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
