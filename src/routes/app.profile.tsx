import { createFileRoute } from "@tanstack/react-router";
import { Mail, Building2, Briefcase, BadgeCheck, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/rbac/roles";
import { MODULES } from "@/navigation/nav";
import { PERMISSIONS } from "@/rbac/permissions";
import type { ModuleId } from "@/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  const role = ROLES[user.role];
  const modules = Object.entries(PERMISSIONS[user.role]) as [ModuleId, string[]][];

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Account details and access permissions"
        crumbs={[{ label: "Home", to: "/app/dashboard" }, { label: "Profile" }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-8 text-center">
            <span className="grid size-24 place-items-center rounded-3xl bg-gradient-brand text-2xl font-bold text-primary-foreground">
              {user.avatarInitials}
            </span>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.title}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BadgeCheck className="size-3.5" /> {role.name} · Level {role.level}
            </span>

            <div className="mt-6 w-full space-y-3 border-t border-border pt-6 text-left text-sm">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <span className="truncate text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="size-4 text-muted-foreground" />
                <span className="text-foreground">{user.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="text-foreground">{user.department}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="size-4 text-muted-foreground" />
                <span className="text-foreground">{role.purpose}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Access Permissions (RBAC)</CardTitle>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {modules.map(([mod, actions]) => (
                <div
                  key={mod}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <span className="text-sm font-medium text-foreground">{MODULES[mod].label}</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {actions.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary ring-1 ring-primary/20"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
