import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users as UsersIcon } from "lucide-react";

export default function Users() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "gerant":
        return <Badge className="bg-chart-1 text-primary-foreground">Gérant</Badge>;
      case "administrateur":
        return <Badge className="bg-chart-3 text-primary-foreground">Administrateur</Badge>;
      default:
        return <Badge variant="secondary">Collaborateur</Badge>;
    }
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Liste des utilisateurs de l'application
        </p>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : users && users.length > 0 ? (
          users.map((user: any) => (
            <Card key={user.id} className="p-6 hover-elevate" data-testid={`user-${user.id}`}>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.profileImageUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-base">{getUserInitials(user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                  <div className="mt-2">{getRoleBadge(user.role)}</div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Aucun utilisateur</p>
          </div>
        )}
      </div>
    </div>
  );
}
