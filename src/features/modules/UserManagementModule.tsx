import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userManagementApi, type UserListItem, type UserDetail, type UserSummary, type UserFilters, type Role, type Department, type Position } from "@/services/user-management-api";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserX,
  UserCog,
  ShieldAlert,
  KeyRound,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  Download,
  FileSpreadsheet,
  LogOut,
  Eye,
  Edit,
  Trash2,
  Clock,
  Activity,
  Calendar,
  Hash,
  Mail,
  Building2,
  Briefcase,
  BadgeCheck,
  Lock,
  Unlock,
  Monitor,
  Smartphone,
  Globe,
  Shield,
  Settings,
  FileText,
  History,
  Fingerprint,
  ChevronRight,
  MoreVertical,
  Wifi,
  WifiOff,
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogIn,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================================
// ENTERPRISE USER MANAGEMENT CONSOLE
// ============================================================================

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  inactive: { label: "Inactive", className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20" },
  locked: { label: "Locked", className: "bg-red-500/15 text-red-300 border-red-500/20" },
  suspended: { label: "Suspended", className: "bg-orange-500/15 text-orange-300 border-orange-500/20" },
  online: { label: "Online", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  offline: { label: "Offline", className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20" },
  idle: { label: "Idle", className: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20" },
  "Temporary Password": { label: "Temporary", className: "bg-amber-500/15 text-amber-300 border-amber-500/20" },
  "Reset Required": { label: "Reset Required", className: "bg-red-500/15 text-red-300 border-red-500/20" },
  "Never Logged In": { label: "Never Logged In", className: "bg-gray-500/15 text-gray-300 border-gray-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE_MAP[status] || { label: status, className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20" };
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>{config.label}</span>;
}

function OnlineIndicator({ isOnline, onlineStatus }: { isOnline: boolean; onlineStatus: string }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-500",
    offline: "bg-zinc-500",
    idle: "bg-yellow-500",
    locked: "bg-red-500",
  };
  const color = colors[onlineStatus] || (isOnline ? "bg-emerald-500" : "bg-zinc-500");
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs capitalize">{onlineStatus}</span>
    </div>
  );
}

export function UserManagementModule() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roles, setRoles] = useState<Role[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const filters: UserFilters = { page: pagination.page, pageSize: pagination.pageSize };
      if (searchQuery) filters.search = searchQuery;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (roleFilter !== "all") filters.role = roleFilter;

      const [summaryData, usersData] = await Promise.all([
        userManagementApi.getDashboardSummary(),
        userManagementApi.getUsers(filters),
      ]);
      setSummary(summaryData);
      setUsers(usersData.data);
      setPagination((prev) => ({ ...prev, ...usersData.pagination }));
    } catch (err: any) {
      toast.error(err.message || "Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchQuery, statusFilter, roleFilter]);

  const fetchRoles = useCallback(async () => {
    try {
      const r = await userManagementApi.getRoles();
      setRoles(r);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, [fetchData, fetchRoles]);

  const handleRowClick = async (row: UserListItem) => {
    try {
      setLoading(true);
      const detail = await userManagementApi.getUserById(row.id);
      setSelectedUser(detail);
      setDrawerOpen(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      resolve(window.confirm(`Are you sure you want to reset the password for ${user.displayName}?\n\nThe password will be reset to: Admin@12345\n\nThe user will be required to change it on their next login.`));
    });

    if (!confirmed) return;

    try {
      const result = await userManagementApi.resetPassword(userId);
      toast.success(result.message || "Password has been reset to default. User must change on next login.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    }
  };

  const handleToggleActive = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const action = user.isActive ? "deactivate" : "activate";
    const confirmed = await new Promise<boolean>((resolve) => {
      resolve(window.confirm(`Are you sure you want to ${action} ${user.displayName}?${!user.isActive ? '\n\nThis will allow the user to log in again.' : '\n\nThe user will be logged out immediately and will not be able to access the system.'}`));
    });

    if (!confirmed) return;

    try {
      const result = await userManagementApi.toggleActive(userId);
      toast.success(result.message || "Account status updated");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update account status");
    }
  };

  const handleForceLogout = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      resolve(window.confirm(`Are you sure you want to force logout ${user.displayName}?\n\nThis will terminate all active sessions and the user will be logged out immediately.`));
    });

    if (!confirmed) return;

    try {
      const result = await userManagementApi.forceLogout(userId);
      toast.success(result.message || "User has been force logged out");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to force logout user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      resolve(window.confirm(`Are you sure you want to DELETE ${user.displayName}?\n\nThis action cannot be undone. All user data will be permanently removed.`));
    });

    if (!confirmed) return;

    try {
      const result = await userManagementApi.deleteUser(userId);
      toast.success(result.message || "User has been deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleRefresh = () => {
    fetchData();
    if (selectedUser) {
      userManagementApi.getUserById(selectedUser.id).then(setSelectedUser).catch(() => {});
    }
  };

  const columns: Column<UserListItem>[] = [
    {
      id: "employeeId",
      header: "Employee ID",
      accessorKey: "employeeId",
      sortable: true,
      width: "130px",
      cell: (_, row) => <span className="font-mono text-xs font-medium">{row.employeeId}</span>,
    },
    {
      id: "displayName",
      header: "Full Name",
      accessorKey: "displayName",
      sortable: true,
      filterable: true,
      cell: (_, row) => <span className="font-medium">{row.displayName}</span>,
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
      cell: (_, row) => <span className="text-xs">{row.email}</span>,
    },
    {
      id: "department",
      header: "Department",
      accessorKey: "department",
      sortable: true,
      cell: (_, row) => <span>{row.department || "—"}</span>,
    },
    {
      id: "position",
      header: "Position",
      accessorKey: "position",
      sortable: true,
      cell: (_, row) => <span>{row.position || "—"}</span>,
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      sortable: true,
      cell: (_, row) =>
        row.role ? (
          <Badge variant="outline" className="text-xs font-medium">
            {row.role.shortName || row.role.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isActive",
      sortable: true,
      width: "110px",
      cell: (_, row) => {
        if (row.isLocked) return <StatusBadge status="locked" />;
        if (!row.isActive) return <StatusBadge status="inactive" />;
        return <StatusBadge status="active" />;
      },
    },
    {
      id: "onlineStatus",
      header: "Online",
      accessorKey: "isOnline",
      sortable: true,
      width: "110px",
      cell: (_, row) => <OnlineIndicator isOnline={row.isOnline} onlineStatus={row.onlineStatus} />,
    },
    {
      id: "lastLoginAt",
      header: "Last Login",
      accessorKey: "lastLoginAt",
      sortable: true,
      width: "160px",
      cell: (_, row) =>
        row.lastLoginAt ? (
          <span className="text-xs">{new Date(row.lastLoginAt).toLocaleString()}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Never</span>
        ),
    },
    {
      id: "lastActivityAt",
      header: "Last Activity",
      accessorKey: "lastActivityAt",
      sortable: true,
      width: "160px",
      cell: (_, row) =>
        row.lastActivityAt ? (
          <span className="text-xs">{new Date(row.lastActivityAt).toLocaleString()}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "passwordStatus",
      header: "Password Status",
      accessorKey: "passwordStatus",
      sortable: true,
      width: "140px",
      cell: (_, row) => <StatusBadge status={row.passwordStatus} />,
    },
    {
      id: "createdAt",
      header: "Created",
      accessorKey: "createdAt",
      sortable: true,
      width: "120px",
      cell: (_, row) => <span className="text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      id: "createdBy",
      header: "Created By",
      accessorKey: "createdBy",
      sortable: true,
      cell: (_, row) => <span className="text-xs">{row.createdBy || "—"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "id",
      width: "280px",
      cell: (_, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); handleRowClick(row); }} title="View Details">
            <Eye className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); handleToggleActive(row.id); }} title={row.isActive ? "Deactivate" : "Activate"}>
            {row.isActive ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); handleResetPassword(row.id); }} title="Reset Password">
            <KeyRound className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); handleForceLogout(row.id); }} title="Force Logout">
            <LogOut className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const summaryCards = summary ? (
    <>
      <UniversalKpiCard label="Total Users" value={summary.totalUsers} icon={Users} tone="primary" />
      <UniversalKpiCard label="Active" value={summary.activeUsers} icon={UserCheck} tone="success" />
      <UniversalKpiCard label="Inactive" value={summary.inactiveUsers} icon={UserX} tone="danger" />
      <UniversalKpiCard label="Online" value={summary.onlineUsers} icon={Activity} tone="success" />
      <UniversalKpiCard label="Offline" value={summary.offlineUsers} icon={UserX} tone="info" />
      <UniversalKpiCard label="Locked" value={summary.lockedAccounts} icon={Lock} tone="danger" />
      <UniversalKpiCard label="Temp Password" value={summary.temporaryPasswordUsers} icon={KeyRound} tone="warning" />
      <UniversalKpiCard label="Expiring Soon" value={summary.passwordExpiringSoon} icon={AlertTriangle} tone="warning" />
      <UniversalKpiCard label="Failed Today" value={summary.failedLoginAttemptsToday} icon={ShieldAlert} tone="danger" />
      <UniversalKpiCard label="New This Month" value={summary.newUsersThisMonth} icon={Calendar} tone="primary" />
    </>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards || Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-24">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.shortName || r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="size-4" />
            Create User
          </Button>
        </div>
      </div>

      <EnterpriseDataTable<UserListItem>
        title="User Management"
        data={users}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        searchable={false}
        exportable
        exportExcelOnly
        filename="user-management"
        pageSize={pagination.pageSize}
        onRowClick={handleRowClick}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="size-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs">Create a new user account to get started</p>
          </div>
        }
      />

      {/* Enterprise User Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="p-0 w-full sm:max-w-[45vw] lg:max-w-[40vw] xl:max-w-[40vw]">
          {selectedUser && <EnterpriseUserDetail user={selectedUser} onAction={handleRefresh} />}
        </SheetContent>
      </Sheet>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        roles={roles}
        onSuccess={() => { fetchData(); setShowCreateDialog(false); }}
      />
    </div>
  );
}

// ============================================================================
// ENTERPRISE USER DETAIL DRAWER
// ============================================================================

function EnterpriseUserDetail({ user, onAction }: { user: UserDetail; onAction: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAction = async (action: string, callback: () => Promise<any>) => {
    setActionLoading(action);
    try {
      await callback();
      onAction();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Determine applicable status badges
  const statusBadges = [];
  if (user.isLocked) statusBadges.push({ label: "Locked", icon: Lock, variant: "destructive" as const });
  if (user.passwordResetRequired) statusBadges.push({ label: "Reset Required", icon: KeyRound, variant: "warning" as const });
  if (user.mustChangePassword) statusBadges.push({ label: "First Login", icon: AlertCircle, variant: "warning" as const });
  if (user.isActive && !statusBadges.some(b => b.variant === "destructive")) {
    statusBadges.push({ label: "Active", icon: CheckCircle2, variant: "success" as const });
  }
  if (user.isOnline) {
    statusBadges.push({ label: "Online", icon: Wifi, variant: "success" as const });
  } else if (!user.isLocked && !statusBadges.some(b => b.label === "Online")) {
    statusBadges.push({ label: "Offline", icon: WifiOff, variant: "muted" as const });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Compact Enterprise Header - 120-140px */}
      <div className="shrink-0 border-b border-border bg-card">
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-foreground truncate leading-tight">
                    {user.displayName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono font-medium text-primary">{user.employeeId}</span>
                    <span>·</span>
                    <span>{user.role?.name || "Employee"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{user.employee?.department || user.department || "—"}</span>
                    <span>·</span>
                    <span>{user.employee?.position || user.position || "—"}</span>
                    <span>·</span>
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {/* Status Badges - Top Right */}
                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                  {statusBadges.map((badge, idx) => (
                  <Badge
                    key={idx}
                    variant="default"
                    className={`h-6 px-2 text-[10px] font-semibold gap-1 ${
                      badge.variant === "warning" 
                        ? "bg-warning/15 text-warning border-warning/20" 
                        : badge.variant === "success" 
                        ? "bg-success/15 text-success border-success/20"
                        : badge.variant === "destructive"
                        ? "bg-destructive/15 text-destructive border-destructive/20"
                        : "bg-muted/15 text-muted-foreground border-muted/20"
                    }`}
                  >
                      <badge.icon className="size-3" />
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Toolbar */}
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-1 overflow-x-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => handleAction("edit user", () => Promise.resolve())}
                  >
                    <Edit className="size-3.5" />
                    <span className="text-xs font-medium">Edit</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit User</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => handleAction("reset password", () => userManagementApi.resetPassword(user.id))}
                    disabled={actionLoading === "reset password"}
                  >
                    <KeyRound className="size-3.5" />
                    <span className="text-xs font-medium">Reset Password</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Password</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => handleAction("force logout", () => userManagementApi.forceLogout(user.id))}
                    disabled={actionLoading === "force logout"}
                  >
                    <LogOut className="size-3.5" />
                    <span className="text-xs font-medium">Force Logout</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Force Logout</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 gap-1.5 ${user.isActive ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-success hover:text-success hover:bg-success/10"}`}
                    onClick={() => handleAction("toggle active", () => userManagementApi.toggleActive(user.id))}
                    disabled={actionLoading === "toggle active"}
                  >
                    {user.isActive ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                    <span className="text-xs font-medium">{user.isActive ? "Deactivate" : "Activate"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{user.isActive ? "Deactivate" : "Activate"} User</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 gap-1.5 ${user.isLocked ? "text-success hover:text-success hover:bg-success/10" : "text-destructive hover:text-destructive hover:bg-destructive/10"}`}
                    onClick={() => handleAction("toggle lock", () => userManagementApi.toggleLock(user.id))}
                    disabled={actionLoading === "toggle lock"}
                  >
                    {user.isLocked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
                    <span className="text-xs font-medium">{user.isLocked ? "Unlock" : "Lock"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{user.isLocked ? "Unlock" : "Lock"} Account</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="text-xs font-medium">Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete User</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="shrink-0 border-b border-border bg-background sticky top-0 z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
            <TabsTrigger value="overview" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <UserCog className="size-4" />
              <span className="text-xs font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="auth" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Fingerprint className="size-4" />
              <span className="text-xs font-medium">Authentication</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Monitor className="size-4" />
              <span className="text-xs font-medium">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Shield className="size-4" />
              <span className="text-xs font-medium">Permissions</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Activity className="size-4" />
              <span className="text-xs font-medium">Activity Logs</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Overview Tab */}
          {activeTab === "overview" && <OverviewTab user={user} />}

          {/* Authentication Tab */}
          {activeTab === "auth" && <AuthenticationTab user={user} onAction={onAction} />}

          {/* Sessions Tab */}
          {activeTab === "sessions" && <SessionsTab userId={user.id} onAction={onAction} />}

          {/* Permissions Tab */}
          {activeTab === "permissions" && <PermissionsTab user={user} />}

          {/* Activity Logs Tab */}
          {activeTab === "activity" && <ActivityLogsTab userId={user.id} />}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{user.displayName}</strong>? This action cannot be undone. All user data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction("delete", () => userManagementApi.deleteUser(user.id))}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB - Clean Enterprise Sections
// ============================================================================

function OverviewTab({ user }: { user: UserDetail }) {
  return (
    <div className="space-y-4">
      {/* Identity Section */}
      <Section title="Identity" icon={BadgeCheck}>
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Employee ID" value={user.employeeId} mono />
          <InfoField label="Full Name" value={user.displayName} />
          <InfoField label="Department" value={user.employee?.department || user.department || "—"} />
          <InfoField label="Position" value={user.employee?.position || user.position || "—"} />
          <InfoField label="Email" value={user.email} />
          <InfoField label="Role" value={user.role?.name || "—"} />
          <InfoField label="Supervisor" value={user.employee?.supervisor ? `${user.employee.supervisor.firstName} ${user.employee.supervisor.lastName}` : "—"} />
        </div>
      </Section>

      {/* Account Section */}
      <Section title="Account" icon={Shield}>
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Status" value={user.isActive ? "Active" : "Inactive"} status={user.isActive ? "success" : "danger"} />
          <InfoField label="Created Date" value={new Date(user.createdAt).toLocaleDateString()} />
          <InfoField label="Created By" value={user.createdBy || "System"} />
          <InfoField label="Updated Date" value={new Date(user.updatedAt).toLocaleDateString()} />
          <InfoField label="Updated By" value={user.updatedBy || "—"} />
          <InfoField label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"} />
          <InfoField label="Last Activity" value={user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleString() : "—"} />
          <InfoField label="Password Status" value={user.passwordStatus} status={user.passwordStatus === "Changed" ? "success" : "warning"} />
          <InfoField label="Email Verified" value="Yes" status="success" />
          <InfoField label="Force Password Change" value={user.mustChangePassword ? "Yes" : "No"} status={user.mustChangePassword ? "warning" : "muted"} />
        </div>
      </Section>

      {/* Organization Section */}
      <Section title="Organization" icon={Building2}>
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Department" value={user.employee?.department || user.department || "—"} />
          <InfoField label="Supervisor" value={user.employee?.supervisor ? `${user.employee.supervisor.firstName} ${user.employee.supervisor.lastName}` : "—"} />
        </div>
      </Section>
    </div>
  );
}

// ============================================================================
// AUTHENTICATION TAB
// ============================================================================

function AuthenticationTab({ user, onAction }: { user: UserDetail; onAction: () => void }) {
  return (
    <div className="space-y-4">
      <Section title="Password Information" icon={KeyRound}>
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Password Status" value={user.passwordStatus} status={user.passwordStatus === "Changed" ? "success" : "warning"} />
          <InfoField label="Password Changed" value={user.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleDateString() : "Never"} />
          <InfoField label="Password Age" value={user.passwordChangedAt ? `${Math.floor((Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24))} days` : "N/A"} />
          <InfoField label="Password Reset Required" value={user.passwordResetRequired ? "Yes" : "No"} status={user.passwordResetRequired ? "warning" : "muted"} />
          <InfoField label="Failed Login Attempts" value={String(user.loginAttempts)} status={user.loginAttempts > 3 ? "warning" : "muted"} />
          <InfoField label="Account Locked" value={user.isLocked ? "Yes" : "No"} status={user.isLocked ? "danger" : "success"} />
          <InfoField label="Default Password Used" value={user.defaultPasswordUsed ? "Yes" : "No"} status={user.defaultPasswordUsed ? "warning" : "muted"} />
          <InfoField label="MFA Enabled" value="No" status="muted" />
          <InfoField label="Last Reset" value={user.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleString() : "Never"} />
          <InfoField label="Reset By" value={user.updatedBy || "System"} />
        </div>
      </Section>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => userManagementApi.resetPassword(user.id).then(() => { toast.success("Password reset"); onAction(); }).catch((e) => toast.error(e.message))}
          className="gap-2"
        >
          <KeyRound className="size-3.5" />
          Reset Password
        </Button>
        <Button
          size="sm"
          variant={user.isActive ? "destructive" : "default"}
          onClick={() => userManagementApi.toggleActive(user.id).then(() => { toast.success("Status updated"); onAction(); }).catch((e) => toast.error(e.message))}
        >
          {user.isActive ? <UserX className="size-3.5 mr-1.5" /> : <UserCheck className="size-3.5 mr-1.5" />}
          {user.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => userManagementApi.toggleLock(user.id).then(() => { toast.success(user.isLocked ? "Unlocked" : "Locked"); onAction(); }).catch((e) => toast.error(e.message))}
        >
          {user.isLocked ? <Unlock className="size-3.5 mr-1.5" /> : <Lock className="size-3.5 mr-1.5" />}
          {user.isLocked ? "Unlock" : "Lock"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => userManagementApi.forceLogout(user.id).then(() => { toast.success("Force logged out"); onAction(); }).catch((e) => toast.error(e.message))}
        >
          <LogOut className="size-3.5 mr-1.5" />
          Force Logout
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// SESSIONS TAB
// ============================================================================

function SessionsTab({ userId, onAction }: { userId: string; onAction?: () => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userManagementApi.getUserSessions(userId).then(setSessions).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (sessions.length === 0) return <EmptyState icon={Monitor} message="No active sessions" />;

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session.id} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-0.5">
                  {session.device?.toLowerCase().includes("android") || session.device?.toLowerCase().includes("ios") ? (
                    <Smartphone className="size-5 text-muted-foreground" />
                  ) : (
                    <Monitor className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground mb-0.5">Device</div>
                      <div className="font-medium text-foreground">{session.device || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Browser</div>
                      <div className="font-medium text-foreground">{session.browser || "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Operating System</div>
                      <div className="font-medium text-foreground">{session.os || "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">IP Address</div>
                      <div className="font-medium text-foreground font-mono">{session.ipAddress || "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Location</div>
                      <div className="font-medium text-foreground">{session.location || "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Login Time</div>
                      <div className="font-medium text-foreground">{new Date(session.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Last Activity</div>
                      <div className="font-medium text-foreground">{new Date(session.lastActivity).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Status</div>
                      <Badge variant={session.isActive ? "default" : "outline"} className={`text-[10px] ${session.isActive ? "bg-success/15 text-success border-success/20" : ""}`}>
                        {session.isActive ? "Active" : "Logged Out"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              {session.isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs shrink-0"
                  onClick={() => userManagementApi.forceLogout(userId).then(() => { toast.success("Session terminated"); onAction?.(); }).catch((e) => toast.error(e.message))}
                >
                  <LogOut className="size-3.5 mr-1.5" />
                  Terminate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// PERMISSIONS TAB
// ============================================================================

function PermissionsTab({ user }: { user: UserDetail }) {
  const permissions = user.role?.permissions || [];

  if (permissions.length === 0) {
    return <EmptyState icon={Shield} message="No permissions assigned" />;
  }

  // Group permissions by module
  const grouped = permissions.reduce((acc, perm: any) => {
    const module = perm.moduleId || "Other";
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, any[]>);

  const moduleLabels: Record<string, string> = {
    dashboard: "Dashboard",
    gate_pass: "Gate Pass",
    leave: "Leave",
    visitors: "Visitors",
    vehicles: "Vehicles",
    item_pass: "Item Pass",
    food_request_slip: "Food Request Slip",
    purchase_request: "Purchase Request",
    reports: "Reports",
    administration: "Administration",
    audit_logs: "Audit Logs",
  };

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([module, perms]) => (
        <Card key={module} className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Shield className="size-4 text-primary" />
              {moduleLabels[module] || module.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(perms as any[]).map((perm: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">{perm.scope || "Global"}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {perm.actions.map((action: string) => (
                      <Badge
                        key={action}
                        variant="outline"
                        className="bg-muted/50 text-foreground border-border hover:border-primary hover:text-primary transition-colors text-[10px] font-medium"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// ACTIVITY LOGS TAB - Professional Timeline
// ============================================================================

function ActivityLogsTab({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userManagementApi.getAuditLogs(userId).then((d) => setLogs(d.data)).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (logs.length === 0) return <EmptyState icon={Activity} message="No activity logs" />;

  // Group logs by date
  const grouped = logs.reduce((acc, log: any) => {
    const date = new Date(log.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  const getActivityIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("login")) return <LogIn className="size-4" />;
    if (actionLower.includes("logout")) return <LogOut className="size-4" />;
    if (actionLower.includes("update") || actionLower.includes("edit")) return <Edit className="size-4" />;
    if (actionLower.includes("password") || actionLower.includes("reset")) return <KeyRound className="size-4" />;
    if (actionLower.includes("role") || actionLower.includes("permission")) return <Shield className="size-4" />;
    if (actionLower.includes("delete")) return <Trash2 className="size-4" />;
    if (actionLower.includes("create")) return <Plus className="size-4" />;
    return <Activity className="size-4" />;
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateLogs]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{date}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            {(dateLogs as any[]).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="mt-0.5 shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    {getActivityIcon(log.action)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {log.actorName || "System"}
                        {log.reason && <span className="text-muted-foreground/80"> · Reason: {log.reason}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoField({ label, value, mono, status }: { label: string; value: string; mono?: boolean; status?: "success" | "warning" | "danger" | "muted" }) {
  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    muted: "text-muted-foreground",
  };

  return (
    <div>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-sm font-medium ${mono ? "font-mono" : ""} ${status ? statusColors[status] : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Icon className="size-12 mb-3 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ============================================================================
// CREATE USER DIALOG (Unchanged)
// ============================================================================

function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSuccess: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingOptions(true);
      Promise.all([
        userManagementApi.getDepartments(),
      ])
        .then(([depts]) => {
          setDepartments(depts);
        })
        .catch((err) => toast.error(err.message))
        .finally(() => setLoadingOptions(false));
    }
  }, [open]);

  useEffect(() => {
    if (departmentId) {
      userManagementApi.getPositions(departmentId)
        .then(setPositions)
        .catch(() => setPositions([]));
      setPositionId("");
    } else {
      setPositions([]);
      setPositionId("");
    }
  }, [departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !displayName || !email || selectedRoleIds.length === 0) {
      toast.error("Please fill in all required fields and select a role");
      return;
    }
    try {
      setSubmitting(true);
      await userManagementApi.createUser({
        employeeId,
        displayName,
        email,
        roleIds: selectedRoleIds,
        departmentId: departmentId || undefined,
        positionId: positionId || undefined,
      });
      toast.success("User account created successfully. Default password: Admin@12345");
      setEmployeeId("");
      setDisplayName("");
      setEmail("");
      setSelectedRoleIds([]);
      setDepartmentId("");
      setPositionId("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create User Account</DialogTitle>
          <DialogDescription>
            Create a new system account. The user will receive default password Admin@12345 and must change it on first login.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID *</Label>
            <Input id="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP-001" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name *</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Juan Dela Cruz" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. juan@company.com" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="department" disabled={loadingOptions}>
                  <SelectValue placeholder={loadingOptions ? "Loading..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={positionId} onValueChange={setPositionId} disabled={!departmentId || positions.length === 0}>
                <SelectTrigger id="position">
                  <SelectValue placeholder={!departmentId ? "Select dept first" : "Select position"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No position</SelectItem>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role *</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge
                  key={r.id}
                  variant={selectedRoleIds.includes(r.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedRoleIds.includes(r.id)) {
                      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== r.id));
                    } else {
                      setSelectedRoleIds([...selectedRoleIds, r.id]);
                    }
                  }}
                >
                  {r.shortName || r.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Account"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}