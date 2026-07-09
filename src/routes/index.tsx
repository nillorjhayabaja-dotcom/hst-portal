import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Boxes,
  Workflow,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES, ROLE_ORDER } from "@/rbac/roles";
import type { RoleId } from "@/types";
import { AppLogo } from "@/components/app/AppLogo";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = (role: RoleId) => {
    login(role);
    toast.success(`Welcome, ${ROLES[role].demoUser.name}`, {
      description: `Signed in as ${ROLES[role].name}`,
    });
    navigate({ to: "/app/dashboard" });
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
              A secure, modular and scalable manufacturing ERP. Manage requests, approvals,
              people and operations — built to serve 1,000+ employees.
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
              Enter your credentials or choose a demo role below.
            </p>
          </div>

          <form
            className="mt-7 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn("employee");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@hst-corp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
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
                onClick={() => toast.info("Password reset is disabled in this prototype.")}
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full gap-2">
              Sign in <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Demo Users
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ROLE_ORDER.map((id) => {
              const r = ROLES[id];
              return (
                <button
                  key={id}
                  onClick={() => signIn(id)}
                  className="group flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-card"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                    {r.demoUser.avatarInitials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {r.name}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      Level {r.level}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
