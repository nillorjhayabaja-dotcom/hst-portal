// Approval Analytics Dashboard - Metrics, trends, and approver performance
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Users,
  BarChart3,
  FileText,
} from "lucide-react";
import { getApprovalMetrics, getApproverPerformance } from "@/services/approval-engine";
import type { ApprovalMetrics, ApproverPerformance } from "@/types/approval";
import { cn } from "@/lib/utils";

export function ApprovalDashboard() {
  const [metrics] = useState<ApprovalMetrics>(getApprovalMetrics());
  const [performance] = useState<ApproverPerformance[]>(getApproverPerformance());

  const kpiCards = [
    {
      label: "Total Requests",
      value: metrics.totalRequests,
      icon: FileText,
      tone: "primary",
    },
    {
      label: "Pending Approvals",
      value: metrics.pendingApprovals,
      icon: Clock,
      tone: "warning",
    },
    {
      label: "Approved Today",
      value: metrics.approvedToday,
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Rejected Today",
      value: metrics.rejectedToday,
      icon: XCircle,
      tone: "danger",
    },
    {
      label: "Approval Rate",
      value: `${metrics.approvalRate}%`,
      icon: TrendingUp,
      tone: "info",
    },
    {
      label: "Avg. Approval Time",
      value: `${metrics.averageApprovalTime}h`,
      icon: Clock,
      tone: "primary",
    },
  ];

  const getToneStyle = (tone: string) => {
    switch (tone) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "warning":
        return "bg-warning/15 text-warning-foreground";
      case "success":
        return "bg-success/10 text-success";
      case "danger":
        return "bg-destructive/10 text-destructive";
      case "info":
        return "bg-info/10 text-info";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">
                    {kpi.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    getToneStyle(kpi.tone),
                  )}
                >
                  <kpi.icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.monthlyTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available yet
                </p>
              ) : (
                metrics.monthlyTrend.map((month) => {
                  const total = month.submitted || 1;
                  const approvedPct = (month.approved / total) * 100;
                  return (
                    <div key={month.month}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">
                          {new Date(month.month + "-01").toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {month.submitted} submitted · {month.approved} approved · {month.rejected}{" "}
                          rejected
                        </span>
                      </div>
                      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-l-full bg-success transition-all"
                          style={{ width: `${approvedPct}%` }}
                        />
                        <div
                          className="h-full rounded-r-full bg-destructive transition-all"
                          style={{ width: `${(month.rejected / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Module */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Requests by Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.byModule).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available yet
                </p>
              ) : (
                Object.entries(metrics.byModule)
                  .sort(([, a], [, b]) => b - a)
                  .map(([module, count]) => {
                    const pct =
                      metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0;
                    return (
                      <div key={module}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize font-medium text-foreground">
                            {module.replace("-", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {count} ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-brand transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Priority */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Requests by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metrics.byPriority).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 col-span-2">
                  No data available yet
                </p>
              ) : (
                Object.entries(metrics.byPriority).map(([priority, count]) => {
                  const colors: Record<string, string> = {
                    urgent: "bg-destructive/10 text-destructive border-destructive/20",
                    high: "bg-warning/15 text-warning-foreground border-warning/20",
                    normal: "bg-primary/10 text-primary border-primary/20",
                    low: "bg-muted text-muted-foreground border-border",
                  };
                  return (
                    <div
                      key={priority}
                      className={cn("rounded-lg border p-3 text-center", colors[priority])}
                    >
                      <p className="font-display text-2xl font-bold">{count}</p>
                      <p className="mt-0.5 text-xs capitalize">{priority}</p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Department */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Requests by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.byDepartment).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available yet
                </p>
              ) : (
                Object.entries(metrics.byDepartment)
                  .sort(([, a], [, b]) => b - a)
                  .map(([dept, count]) => {
                    const pct =
                      metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0;
                    return (
                      <div key={dept}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{dept}</span>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-info transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approver Performance */}
      {performance.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Approver Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground">
                      Approver
                    </th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">
                      Decisions
                    </th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">
                      Approved
                    </th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">
                      Rejected
                    </th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">
                      Approval Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p) => (
                    <tr key={p.approverId} className="border-b border-border">
                      <td className="py-2 font-medium text-foreground">{p.approverName}</td>
                      <td className="py-2 text-center text-muted-foreground">{p.totalDecisions}</td>
                      <td className="py-2 text-center text-success">{p.approved}</td>
                      <td className="py-2 text-center text-destructive">{p.rejected}</td>
                      <td className="py-2 text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            p.totalDecisions > 0 && p.approved / p.totalDecisions > 0.7
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning-foreground",
                          )}
                        >
                          {p.totalDecisions > 0
                            ? `${Math.round((p.approved / p.totalDecisions) * 100)}%`
                            : "N/A"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
