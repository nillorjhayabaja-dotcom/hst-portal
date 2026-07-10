import { useState } from "react";
import { FlaskConical, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES, ROLE_ORDER } from "@/rbac/roles";
import type { RoleId } from "@/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const handleSwitch = (role: RoleId) => {
    switchRole(role);
    setOpen(false);
    toast.success(`Switched to ${ROLES[role].name}`, {
      description: "Menus, dashboard and permissions reloaded.",
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="h-11 gap-2 rounded-full pl-3 pr-4 shadow-elegant bg-gradient-brand text-primary-foreground hover:opacity-95">
            <FlaskConical className="size-4" />
            <span className="hidden text-xs font-semibold sm:inline">Demo Role:</span>
            <span className="text-sm font-bold">{ROLES[user.role].shortName}</span>
            <ChevronsUpDown className="size-4 opacity-80" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-72 p-2">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-foreground">Developer Role Switcher</p>
            <p className="text-[11px] text-muted-foreground">
              Instantly preview any role — no reload needed.
            </p>
          </div>
          <div className="mt-1 max-h-80 space-y-0.5 overflow-y-auto scrollbar-thin">
            {ROLE_ORDER.map((id) => {
              const r = ROLES[id];
              const active = id === user.role;
              return (
                <button
                  key={id}
                  onClick={() => handleSwitch(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50",
                    active && "bg-accent/60",
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                    L{r.level}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {r.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {r.purpose}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
