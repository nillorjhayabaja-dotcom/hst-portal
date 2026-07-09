import { ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AccessDenied({ module }: { module?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="grid size-20 place-items-center rounded-3xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-10" />
      </div>
      <p className="mt-6 font-display text-6xl font-bold text-foreground">403</p>
      <h1 className="mt-2 font-display text-xl font-semibold text-foreground">Access Denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You do not have permission to access {module ? <b>{module}</b> : "this module"}. Your role
        does not include this module in its access matrix.
      </p>
      <Button asChild className="mt-6">
        <Link to="/app/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
