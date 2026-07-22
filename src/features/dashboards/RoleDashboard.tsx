import {
  Users,
  FileClock,
  CheckCircle2,
  Activity,
  TrendingUp,
  Factory,
  Building2,
  ClipboardList,
  DoorOpen,
  Car,
  CalendarDays,
  UserCheck,
  ShoppingCart,
  Utensils,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";
import type { RoleId } from "@/types";
import { StatCard } from "@/components/app/StatCard";
import { TrendChart, RequestPie, DeptBar, PieLegend } from "./charts";
import { RecentRequests, ApprovalQueueCard, QuickActions, ActivityFeed } from "./widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardOverview, useDashboardMetrics } from "@/services/dashboard-hooks";

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid gap-6 lg:grid-cols-3">{children}</div>;
}

export function RoleDashboard({ role }: { role: RoleId }) {
  const { data: overview } = useDashboardOverview();
  const { data: metrics } = useDashboardMetrics();
  
  const stats = overview || {
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    pendingGatePasses: 0,
    approvedGatePasses: 0,
    rejectedGatePasses: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    pendingPurchaseRequests: 0,
    pendingMRFs: 0,
    visitorsToday: 0,
    vehiclesInUse: 0,
    assetsAssigned: 0,
    unreadNotifications: 0,
    pendingApprovals: 0,
  };

  switch (role) {
    case "super_admin":
    case "admin":
      return (
        <>
          <StatGrid>
            <StatCard
              label="Total Employees"
              value={String(stats.totalEmployees)}
              icon={Users}
              tone="primary"
              hint="active employees"
            />
            <StatCard
              label="Pending Approvals"
              value={String(stats.pendingApprovals)}
              icon={FileClock}
              tone="warning"
              hint="across modules"
            />
            <StatCard
              label="Approved Today"
              value={String(metrics?.approvedToday || 0)}
              icon={CheckCircle2}
              tone="success"
              trend={metrics?.approvalRate ? { value: `${metrics.approvalRate}%`, up: true } : undefined}
            />
            <StatCard
              label="Unread Notifications"
              value={String(stats.unreadNotifications)}
              icon={Activity}
              tone="info"
              hint="alerts"
            />
          </StatGrid>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendChart title="Requests vs Approvals" />
            </div>
            <div className="space-y-4">
              <RequestPie />
              <PieLegend />
            </div>
          </div>
          <TwoCol>
            <div className="lg:col-span-2">
              <ApprovalQueueCard />
            </div>
            <ActivityFeed />
          </TwoCol>
          <div className="mt-6">
            <QuickActions
              actions={[
                { label: "Manage Users", icon: ShieldCheck, to: "/app/m/users" },
                { label: "Departments", icon: Building2, to: "/app/m/departments" },
                { label: "Approvals", icon: CheckCircle2, to: "/app/m/approvals" },
                { label: "Reports", icon: TrendingUp, to: "/app/m/reports" },
              ]}
            />
          </div>
        </>
      );

    case "executive":
      return (
        <>
          <StatGrid>
            <StatCard
              label="Total Requests"
              value={String(metrics?.totalRequests || 0)}
              icon={Factory}
              tone="success"
              hint="all time"
            />
            <StatCard
              label="Pending Approvals"
              value={String(stats.pendingApprovals)}
              icon={ClipboardList}
              tone="primary"
            />
            <StatCard label="Approval Rate" value={`${metrics?.approvalRate || 0}%`} icon={CheckCircle2} tone="info" />
            <StatCard label="Departments" value={String(stats.totalDepartments || 0)} icon={Building2} tone="accent" hint="active" />
          </StatGrid>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendChart title="Company Performance Trends" />
            </div>
            <div className="space-y-4">
              <RequestPie title="Request Distribution" />
              <PieLegend />
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <DeptBar title="Department Performance" />
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Approval Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Gate Pass", pct: 88 },
                  { label: "Leave", pct: 94 },
                  { label: "MRF", pct: 76 },
                  { label: "Purchase Request", pct: 82 },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">{r.label}</span>
                      <span className="font-semibold text-muted-foreground">{r.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-brand"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      );

    case "manager":
      return (
        <>
          <StatGrid>
            <StatCard label="Department Staff" value={String(stats.totalEmployees || 0)} icon={Users} tone="primary" />
            <StatCard label="Pending Requests" value={String(stats.pendingApprovals || 0)} icon={FileClock} tone="warning" />
            <StatCard
              label="Approved Today"
              value={String(metrics?.approvedToday || 0)}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Rejected Today"
              value={String(metrics?.rejectedToday || 0)}
              icon={TrendingUp}
              tone="info"
            />
          </StatGrid>
          <TwoCol>
            <div className="lg:col-span-2">
              <ApprovalQueueCard title="Pending Team Requests" />
            </div>
            <ActivityFeed title="Team Activity" />
          </TwoCol>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <DeptBar title="Team Performance" />
            <RecentRequests
              title="Department Requests"
              filter={(r) => r.department === "Production"}
            />
          </div>
        </>
      );

    case "supervisor":
      return (
        <>
          <StatGrid>
            <StatCard label="Team Members" value={String(stats.totalEmployees || 0)} icon={Users} tone="primary" />
            <StatCard label="Pending Approvals" value={String(stats.pendingApprovals || 0)} icon={FileClock} tone="warning" />
            <StatCard label="Approved Today" value={String(metrics?.approvedToday || 0)} icon={CheckCircle2} tone="success" />
            <StatCard label="On Leave" value={String(stats.pendingLeaves || 0)} icon={CalendarDays} tone="info" />
          </StatGrid>
          <TwoCol>
            <div className="lg:col-span-2">
              <ApprovalQueueCard title="Recommendation Queue" />
            </div>
            <ActivityFeed title="Recent Requests" />
          </TwoCol>
        </>
      );

    case "hr":
      return (
        <>
          <StatGrid>
            <StatCard label="Total Employees" value={String(stats.totalEmployees || 0)} icon={Users} tone="primary" />
            <StatCard label="On Leave" value={String(stats.pendingLeaves || 0)} icon={CalendarDays} tone="warning" />
            <StatCard label="Pending Leave" value={String(stats.pendingLeaves || 0)} icon={FileClock} tone="info" />
            <StatCard label="Visitors Today" value={String(stats.visitorsToday || 0)} icon={UserCheck} tone="accent" />
          </StatGrid>
          <TwoCol>
            <div className="lg:col-span-2">
              <RecentRequests title="Leave Requests" filter={(r) => r.type === "Leave"} />
            </div>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">Open Enrollment</p>
                  <p className="text-xs text-muted-foreground">HMO enrollment closes July 20.</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">Safety Training</p>
                  <p className="text-xs text-muted-foreground">Mandatory session July 15, 9 AM.</p>
                </div>
              </CardContent>
            </Card>
          </TwoCol>
        </>
      );

    case "gad":
      return (
        <>
          <StatGrid>
            <StatCard label="Gate Pass Queue" value={String(stats.pendingGatePasses || 0)} icon={DoorOpen} tone="warning" />
            <StatCard label="Vehicles In Use" value={String(stats.vehiclesInUse || 0)} icon={Car} tone="primary" />
            <StatCard
              label="Assets Assigned"
              value={String(stats.assetsAssigned || 0)}
              icon={Utensils}
              tone="info"
              hint="active"
            />
            <StatCard label="Approved Today" value={String(metrics?.approvedToday || 0)} icon={CheckCircle2} tone="success" />
          </StatGrid>
          <TwoCol>
            <div className="lg:col-span-2">
              <ApprovalQueueCard title="Gate Pass — Final Approval Queue" />
            </div>
            <QuickActions
              actions={[
                { label: "Gate Pass", icon: DoorOpen, to: "/app/m/gate-pass" },
                { label: "Vehicles", icon: Car, to: "/app/m/vehicles" },
                { label: "Reports", icon: TrendingUp, to: "/app/m/reports" },
                { label: "Notifications", icon: FileClock, to: "/app/notifications" },
              ]}
            />
          </TwoCol>
        </>
      );

    case "security":
      return (
        <>
          <StatGrid>
            <StatCard
              label="Approved Gate Pass"
              value={String(stats.approvedGatePasses || 0)}
              icon={DoorOpen}
              tone="success"
              hint="today"
            />
            <StatCard label="Rejected Gate Pass" value={String(stats.rejectedGatePasses || 0)} icon={LogOut} tone="warning" />
            <StatCard label="Pending Gate Pass" value={String(stats.pendingGatePasses || 0)} icon={LogIn} tone="info" />
            <StatCard label="Visitors Today" value={String(stats.visitorsToday || 0)} icon={UserCheck} tone="primary" />
          </StatGrid>
          <TwoCol>
            <div className="lg:col-span-2">
              <RecentRequests title="Today's Gate Pass" filter={(r) => r.type === "Gate Pass"} />
            </div>
            <QuickActions
              actions={[
                { label: "Gate Pass", icon: DoorOpen, to: "/app/m/gate-pass" },
                { label: "Visitors", icon: UserCheck, to: "/app/m/visitors" },
                { label: "Vehicles", icon: Car, to: "/app/m/vehicles" },
                { label: "Alerts", icon: ShieldCheck, to: "/app/notifications" },
              ]}
            />
          </TwoCol>
        </>
      );

    case "employee":
    default:
      return (
        <>
          <StatGrid>
            <StatCard label="My Requests" value={String(metrics?.totalRequests || 0)} icon={ClipboardList} tone="primary" />
            <StatCard label="Pending" value={String(stats.pendingApprovals || 0)} icon={FileClock} tone="warning" />
            <StatCard label="Approved" value={String(metrics?.approvedToday || 0)} icon={CheckCircle2} tone="success" />
            <StatCard label="Notifications" value={String(stats.unreadNotifications || 0)} icon={Activity} tone="info" hint="unread" />
          </StatGrid>
          <div className="mt-6">
            <QuickActions
              actions={[
                { label: "New Gate Pass", icon: DoorOpen, to: "/app/m/gate-pass" },
                { label: "Request Leave", icon: CalendarDays, to: "/app/m/leave" },
                { label: "Purchase Request", icon: ShoppingCart, to: "/app/m/purchase-request" },
                { label: "Visitors", icon: UserCheck, to: "/app/m/visitors" },
              ]}
            />
          </div>
          <TwoCol>
            <div className="lg:col-span-2">
              <RecentRequests
                title="My Recent Requests"
                filter={(r) => r.requester === "Liza Mendoza" || r.department === "Production"}
              />
            </div>
            <ActivityFeed title="Notifications" />
          </TwoCol>
        </>
      );
  }
}
