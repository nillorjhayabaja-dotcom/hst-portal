import {
  LayoutDashboard,
  Bell,
  CheckCircle2,
  DoorOpen,
  CalendarDays,
  ClipboardList,
  UserCheck,
  Car,
  Package,
  ShoppingCart,
  Users,
  Building2,
  BarChart3,
  ScrollText,
  ShieldCheck,
  GitBranch,
  Hash,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Bell,
  CheckCircle2,
  DoorOpen,
  CalendarDays,
  ClipboardList,
  UserCheck,
  Car,
  Package,
  ShoppingCart,
  Users,
  Building2,
  BarChart3,
  ScrollText,
  ShieldCheck,
  GitBranch,
  Hash,
  Settings,
  User,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Package;
  return <Cmp className={className} />;
}
