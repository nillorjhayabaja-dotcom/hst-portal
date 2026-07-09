import logo from "@/assets/hst-logo.png";
import { cn } from "@/lib/utils";

export function AppLogo({
  size = 36,
  showText = true,
  variant = "dark",
  className,
}: {
  size?: number;
  showText?: boolean;
  variant?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo}
        alt="HST Enterprise Portal logo"
        width={size}
        height={size}
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className="leading-tight">
          <p
            className={cn(
              "font-display text-sm font-bold tracking-tight",
              variant === "light" ? "text-white" : "text-sidebar-foreground",
            )}
          >
            HST Enterprise
          </p>
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-widest",
              variant === "light" ? "text-white/60" : "text-sidebar-foreground/55",
            )}
          >
            ERP Portal
          </p>
        </div>
      )}
    </div>
  );
}
