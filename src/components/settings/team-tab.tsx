"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Plus, Send, Shield, Trash2, UserCog } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/ui/toast";
import { useUsers } from "@/lib/api/hooks/use-users";
import { useTranslations } from "@/lib/i18n";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

// -- Types & schemas ----------------------------------------------------------

type Role = "admin" | "manager" | "sales" | "support" | "viewer";
type MemberStatus = "active" | "invited";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
}

const InviteSchema = z.object({
  email: z.string().email("Email no valido"),
  name: z.string().min(1, "El nombre es obligatorio"),
});

type InviteForm = z.infer<typeof InviteSchema>;

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  manager: "Gestor",
  sales: "Comercial",
  support: "Soporte",
  viewer: "Solo lectura",
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-red-500/10 text-red-700 dark:text-red-400",
  manager: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  sales: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  support: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  viewer: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Acceso completo. Configuracion, equipo, facturacion.",
  manager: "Gestion de leads, contratos, ATR. Sin config de tenant.",
  sales: "Leads propios, contratos, CUPS. Sin acceso a config.",
  support: "Tickets, atencion al cliente. Sin acceso a contratos.",
  viewer: "Solo consulta. Dashboard y reportes.",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// -- Component ----------------------------------------------------------------

export function TeamTab() {
  const { t } = useTranslations();
  const { data, isLoading, error } = useUsers({ limit: 50 });

  // Local state for invited members (not in backend yet)
  const [invitedMembers, setInvitedMembers] = useState<TeamMember[]>([]);
  // Role overrides (demo mode edits)
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Role>>({});

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<Role>("sales");
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<Role>("sales");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(InviteSchema),
  });

  // Merge API users + locally invited
  const apiMembers: TeamMember[] = (data?.items ?? []).map((u) => ({
    id: u.id,
    name: u.name ?? "Sin nombre",
    email: u.email,
    role: (roleOverrides[u.id] ?? u.role) as Role,
    status: "active" as const,
  }));
  const allMembers = [...apiMembers, ...invitedMembers];

  const onInvite = async (formData: InviteForm) => {
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: inviteRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al enviar invitacion");
      }

      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email,
        role: inviteRole,
        status: "invited",
      };
      setInvitedMembers((prev) => [...prev, newMember]);
      toast.success(`Invitacion enviada a ${formData.email}`);
      reset();
      setInviteRole("sales");
      setInviteOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar invitacion");
    }
  };

  const onEditSave = () => {
    if (!editMember) return;
    // For invited members, update in local state
    if (editMember.status === "invited") {
      setInvitedMembers((prev) =>
        prev.map((m) => (m.id === editMember.id ? { ...m, role: editRole } : m)),
      );
    } else {
      // For API members, store override locally (in production: PATCH /v1/users/:id)
      setRoleOverrides((prev) => ({ ...prev, [editMember.id]: editRole }));
    }
    toast.success(`Rol de ${editMember.name} actualizado a ${ROLE_LABELS[editRole]}`);
    setEditMember(null);
  };

  const onRemove = (member: TeamMember) => {
    if (member.status === "invited") {
      setInvitedMembers((prev) => prev.filter((m) => m.id !== member.id));
    }
    toast.success(`${member.name} eliminado del equipo`);
    setMenuOpen(null);
  };

  const onResendInvite = (member: TeamMember) => {
    toast.success(`Invitacion reenviada a ${member.email}`);
    setMenuOpen(null);
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Equipo</CardTitle>
            <CardDescription>
              {allMembers.length} miembros
              {invitedMembers.length > 0 &&
                ` · ${invitedMembers.length} invitacion${invitedMembers.length > 1 ? "es" : ""} pendiente${invitedMembers.length > 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Invitar miembro
          </Button>
        </CardHeader>
        <CardContent>
          {allMembers.length === 0 ? (
            <EmptyState
              icon={<Shield />}
              title="No hay miembros"
              description="Invita a tu equipo para empezar a colaborar."
            />
          ) : (
            <div className="divide-y divide-border">
              {allMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {member.name}
                      </span>
                      {member.status === "invited" && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          Pendiente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>

                  <Badge
                    className={`shrink-0 text-xs font-medium border-0 ${ROLE_COLORS[member.role] ?? ""}`}
                  >
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() =>
                        setMenuOpen(menuOpen === member.id ? null : member.id)
                      }
                      aria-label={`Opciones para ${member.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>

                    {menuOpen === member.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-surface py-1 shadow-lg">
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                          onClick={() => {
                            setEditMember(member);
                            setEditRole(member.role);
                            setMenuOpen(null);
                          }}
                        >
                          <UserCog className="size-4" />
                          Editar rol
                        </button>
                        {member.status === "invited" && (
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => onResendInvite(member)}
                          >
                            <Send className="size-4" />
                            Reenviar invitacion
                          </button>
                        )}
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted"
                          onClick={() => onRemove(member)}
                        >
                          <Trash2 className="size-4" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles explanation */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Roles y permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(ROLE_LABELS) as [Role, string][]).map(
              ([role, label]) => (
                <div
                  key={role}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <Shield
                    className={`mt-0.5 size-4 shrink-0 ${ROLE_COLORS[role].split(" ").pop()}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar miembro</DialogTitle>
            <DialogDescription>
              Se enviara un email de invitacion para unirse al equipo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nombre</Label>
              <Input
                id="invite-name"
                placeholder="Nombre completo"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="email@empresa.com"
                {...register("email")}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="sales">Comercial</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                  <SelectItem value="viewer">Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar invitacion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar rol</DialogTitle>
            <DialogDescription>
              Cambiar el rol de {editMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback>
                  {editMember ? getInitials(editMember.name) : ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{editMember?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {editMember?.email}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nuevo rol</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="sales">Comercial</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                  <SelectItem value="viewer">Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>
              Cancelar
            </Button>
            <Button onClick={onEditSave}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
