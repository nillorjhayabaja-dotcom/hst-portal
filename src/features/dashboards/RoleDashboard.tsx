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

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid gap-6 lg:grid-cols-3">{children}</div>;
}

export function RoleDashboard({ role }: { role: RoleId }) {
  switch (role) {
    case "super_admin":
    case "admin":
      return (
        <>
          <StatGrid>
            <StatCard
              label="Total Employees"
              value="714"
              icon={Users}
              tone="primary"
              trend={{ value: "+18", up: true }}
              hint="this month"
            />
            <StatCard
              label="Pending Approvals"
              value="27"
              icon={FileClock}
              tone="warning"
              hint="across modules"
            />
            <StatCard
              label="Completed Today"
              value="142"
              icon={CheckCircle2}
              tone="success"
              trend={{ value: "+12%", up: true }}
            />
            <StatCard
              label="Users Online"
              value="63"
              icon={Activity}
              tone="info"
              hint="live sessions"
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
              label="Production Output"
              value="95%"
              icon={Factory}
              tone="success"
              trend={{ value: "+3%", up: true }}
              hint="vs target"
            />
            <StatCard
              label="Monthly Requests"
              value="590"
              icon={ClipboardList}
              tone="primary"
              trend={{ value: "+30", up: true }}
            />
            <StatCard label="Approval Rate" value="91.5%" icon={CheckCircle2} tone="info" />
            <StatCard label="Departments" value="8" icon={Building2} tone="accent" hint="active" />
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
            <StatCard label="Department Staff" value="342" icon={Users} tone="primary" />
            <StatCard label="Pending Team Requests" value="9" icon={FileClock} tone="warning" />
            <StatCard
              label="Approved This Week"
              value="41"
              icon={CheckCircle2}
              tone="success"
              trend={{ value: "+7", up: true }}
            />
            <StatCard
              label="Dept. Performance"
              value="96%"
              icon={TrendingUp}
              tone="info"
              trend={{ value: "+2%", up: true }}
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
            <StatCard label="Team Members" value="28" icon={Users} tone="primary" />
            <StatCard label="Recommendation Queue" value="6" icon={FileClock} tone="warning" />
            <StatCard label="Recommended Today" value="11" icon={CheckCircle2} tone="success" />
            <StatCard label="On Leave" value="3" icon={CalendarDays} tone="info" />
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
            <StatCard label="Total Employees" value="714" icon={Users} tone="primary" />
            <StatCard label="On Leave Today" value="18" icon={CalendarDays} tone="warning" />
            <StatCard label="Pending Leave" value="12" icon={FileClock} tone="info" />
            <StatCard label="Visitors Today" value="7" icon={UserCheck} tone="accent" />
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
            <StatCard label="Gate Pass Queue" value="14" icon={DoorOpen} tone="warning" />
            <StatCard label="Vehicles Assigned" value="9" icon={Car} tone="primary" />
            <StatCard
              label="Meal Allowance"
              value="52"
              icon={Utensils}
              tone="info"
              hint="to process"
            />
            <StatCard label="Final Approved Today" value="23" icon={CheckCircle2} tone="success" />
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
              label="Released Gate Pass"
              value="23"
              icon={DoorOpen}
              tone="success"
              hint="today"
            />
            <StatCard label="Vehicle Exits" value="11" icon={LogOut} tone="warning" />
            <StatCard label="Vehicle Entries" value="9" icon={LogIn} tone="info" />
            <StatCard label="Visitor Check-Ins" value="7" icon={UserCheck} tone="primary" />
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
            <StatCard label="My Requests" value="8" icon={ClipboardList} tone="primary" />
            <StatCard label="Pending" value="3" icon={FileClock} tone="warning" />
            <StatCard label="Approved" value="4" icon={CheckCircle2} tone="success" />
            <StatCard label="Notifications" value="2" icon={Activity} tone="info" hint="unread" />
          </StatGrid>
          <div className="mt-6">
            <QuickActions
              actions={[
                { label: "New Gate Pass", icon: DoorOpen, to: "/app/m/gate-pass" },
                { label: "Request Leave", icon: CalendarDays, to: "/app/m/leave" },
                { label: "New MRF", icon: ClipboardList, to: "/app/m/mrf" },
                { label: "Purchase Request", icon: ShoppingCart, to: "/app/m/purchase-request" },
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
