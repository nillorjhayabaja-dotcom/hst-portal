import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";
import { Header } from "./Header";
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
    <div className="flex min-h-screen flex-col bg-muted/30">
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

      <div className="flex flex-1 flex-col lg:pl-64">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-background/50 px-6 py-4">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-center text-xs text-muted-foreground/60 sm:flex-row">
            <p>© {new Date().getFullYear()} HST Enterprise Portal. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>v1.0.0</span>
              <span>·</span>
              <span>Powered by HST Corp</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
