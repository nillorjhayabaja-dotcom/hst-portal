import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardCharts } from "@/services/dashboard-hooks";

const AXIS = "var(--color-muted-foreground)";

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">{children}</CardContent>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  color: "var(--color-popover-foreground)",
};

export function TrendChart({ title = "Monthly Trends" }: { title?: string }) {
  const { data: charts, isLoading } = useDashboardCharts();
  const data = charts?.monthlyRequests || [];

  if (isLoading) {
    return (
      <ChartFrame title={title}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gApp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="var(--color-chart-1)"
            fill="url(#gReq)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="approved"
            stroke="var(--color-chart-3)"
            fill="url(#gApp)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function RequestPie({ title = "Requests by Type" }: { title?: string }) {
  const { data: charts, isLoading } = useDashboardCharts();
  const data = charts?.requestBreakdown || [];

  if (isLoading) {
    return (
      <ChartFrame title={title}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={3}
          >
            {data.map((d: any) => (
              <Cell key={d.key} fill={`var(--color-${d.key})`} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function DeptBar({ title = "Department Performance" }: { title?: string }) {
  const { data: charts, isLoading } = useDashboardCharts();
  const data = charts?.departmentPerformance || [];

  if (isLoading) {
    return (
      <ChartFrame title={title}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <XAxis dataKey="dept" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="var(--color-chart-2)" barSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function PieLegend() {
  const { data: charts } = useDashboardCharts();
  const data = charts?.requestBreakdown || [];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {data.map((d: any) => (
        <span key={d.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: `var(--color-${d.key})` }}
          />
          {d.name} · {d.value}%
        </span>
      ))}
    </div>
  );
}