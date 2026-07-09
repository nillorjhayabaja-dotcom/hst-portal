import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/rbac/roles";
import { PageHeader } from "@/components/app/PageHeader";
import { RoleDashboard } from "@/features/dashboards/RoleDashboard";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  const role = ROLES[user.role];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description={`${role.name} · ${user.department}`}
        crumbs={[{ label: "Home", to: "/app/dashboard" }, { label: "Dashboard" }]}
      />
      <RoleDashboard role={user.role} />
    </>
  );
}
