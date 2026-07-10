import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  User as UserIcon,
  Settings,
  HelpCircle,
  Info,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/rbac/roles";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "@/components/enterprise/GlobalSearch";
import { NotificationCenter } from "@/components/enterprise/NotificationCenter";
import { LogoutDialog } from "@/components/enterprise/EnterpriseDialogs";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  if (!user) return null;
  const role = ROLES[user.role];

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  const cycleTheme = () => {
    const modes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIdx = modes.indexOf(mode);
    const next = modes[(currentIdx + 1) % modes.length];
    setMode(next);
    toast.success(`Theme: ${next.charAt(0).toUpperCase() + next.slice(1)}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile}>
        <Menu className="size-5" />
      </Button>

      {/* Global Search */}
      <div className="hidden md:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Mobile Search - opens command palette */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
          }}
        >
          <Search className="size-5" />
        </Button>

        <ThemeToggle />

        {/* Notification Center */}
        <NotificationCenter />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-accent/50">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground">
                {user.avatarInitials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold leading-tight text-foreground">
                  {user.name}
                </span>
                <span className="block text-[10px] leading-tight text-muted-foreground">
                  {role.shortName}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                {user.title} · {user.department}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="cursor-pointer">
                  <UserIcon className="mr-2 size-4" />
                  My Profile
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/dashboard" className="cursor-pointer">
                  <Settings className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={cycleTheme}>
                <Palette className="mr-2 size-4" />
                Theme: {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => toast.info("HST Enterprise Portal v1.0.0")}>
                <Info className="mr-2 size-4" />
                About
                <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer">
                  <HelpCircle className="mr-2 size-4" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowLogout(true)}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog open={showLogout} onOpenChange={setShowLogout} onConfirm={handleLogout} />
    </header>
  );
}
