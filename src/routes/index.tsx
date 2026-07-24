import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight, ShieldCheck, Boxes, Workflow, BarChart3 } from "lucide-react";

import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AppLogo } from "@/components/app/AppLogo";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
import illustration from "@/assets/login-illustration.jpg";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

const FEATURES = [
  { icon: ShieldCheck, title: "Role-Based Access", desc: "Granular RBAC across every module" },
  { icon: Boxes, title: "Modular ERP", desc: "Gate pass, leave, MRF, assets & more" },
  { icon: Workflow, title: "Approval Workflows", desc: "Multi-level routing & recommendations" },
  { icon: BarChart3, title: "Live Analytics", desc: "Executive KPIs & department insights" },
];

function LoginPage() {
  const { login, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !password) {
      toast.error("Employee ID and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      const user = await login({ identifier: employeeId, password });

      // Check if password change is required - check both state and localStorage for immediate response
      const requiresPasswordChange = mustChangePassword || localStorage.getItem("hst.auth.mustChangePassword") === "true";
      
      if (requiresPasswordChange) {
        // Redirect to change-password page
        navigate({ to: "/change-password" });
        return;
      }

      toast.success("Signed in successfully");
      navigate({ to: "/app/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-sidebar lg:flex lg:flex-col">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(${illustration})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.04_265)] via-transparent to-transparent" />
        <div className="relative z-10 flex h-full flex-col p-12">
          <AppLogo size={44} />
          <div className="mt-auto">
            <h1 className="max-w-md font-display text-4xl font-bold leading-tight text-white">
              The central portal for every HST department.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              A secure, modular and scalable manufacturing ERP. Manage requests, approvals, people
              and operations — built to serve 1,000+ employees.
            </p>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <f.icon className="size-5 text-white" />
                  <p className="mt-2.5 text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/60">{f.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs text-white/40">
              HST Enterprise Portal · Version 1.0.0 · © 2026 HST Corporation
            </p>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <AppLogo variant="dark" size={40} />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your credentials to continue.
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">Employee ID</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="HS0001-0001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox defaultChecked /> Remember me
              </label>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => toast.info("Password reset is not configured in this UI.")}
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"} <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
