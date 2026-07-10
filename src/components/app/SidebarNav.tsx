import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { getGroupedNav } from "@/navigation/nav";
import { ROLES } from "@/rbac/roles";
import { AppLogo } from "./AppLogo";
import { ModuleIcon } from "./ModuleIcon";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!user) return null;

  const groups = getGroupedNav(user.role);
  const role = ROLES[user.role];

  const isActive = (to: string) =>
    to === "/app/dashboard" ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex h-full flex-col bg-gradient-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <AppLogo />
      </div>

      <div className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            {user.avatarInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">{role.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {groups.map((g) => (
          <div key={g.group} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {g.group}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item.to);
                return (
                  <li key={item.module}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <ModuleIcon name={item.icon} className="size-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[10px] text-sidebar-foreground/40">HST Enterprise Portal · v1.0.0</p>
      </div>
    </div>
  );
}
