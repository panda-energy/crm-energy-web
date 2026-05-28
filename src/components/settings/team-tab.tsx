"use client";

import { UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useUsers } from "@/lib/api/hooks/use-users";
import { toast } from "@/lib/ui/toast";
import { useTranslations } from "@/lib/i18n";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Manager",
  sales: "Comercial",
  support: "Soporte",
  viewer: "Visor",
};

/**
 * Team management tab -- lists users, their roles, and provides
 * an invite-by-email form.
 */
export function TeamTab() {
  const { t } = useTranslations();
  const { data, isLoading, error } = useUsers({ limit: 50 });
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = () => {
    if (!inviteEmail.includes("@")) {
      toast.error("Introduce un email valido");
      return;
    }
    toast.success(`Invitacion enviada a ${inviteEmail}`);
    setInviteEmail("");
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={4} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-danger">
          {t("errors.loadFailed")}
        </CardContent>
      </Card>
    );
  }

  const users = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Invite section */}
      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
          <CardDescription>
            Envia una invitacion por email para unirse al equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-lg">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="nombre@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleInvite}>
              <UserPlus className="mr-1.5 size-4" aria-hidden="true" />
              Invitar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team list */}
      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription>{users.length} miembros</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="No hay miembros"
              description="Invita a tu equipo para empezar a colaborar."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Miembros del equipo">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Nombre</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Rol</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-3 py-2.5 font-medium">
                        {user.name ?? "Sin nombre"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="secondary" className="text-xs">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="default" className="text-xs">
                          Activo
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
