import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";
import { Header } from "./Header";
import { RoleSwitcher } from "./RoleSwitcher";
import { AppLogo } from "./AppLogo";

export function AppLayout() {
  const { user, ready } = useAuth();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (hydrated && ready && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [hydrated, ready, user, navigate]);

  if (!hydrated || !ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse">
          <AppLogo variant="light" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border p-0">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <RoleSwitcher />
    </div>
  );
}
