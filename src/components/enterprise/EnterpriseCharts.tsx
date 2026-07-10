// Enterprise Charts - Reusable chart components (Bar, Line, Pie, Area, KPI Charts)
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface Series {
  name: string;
  data: DataPoint[];
  color?: string;
}

// Simple SVG bar chart
function BarChartInner({
  data,
  height = 200,
  showLabels = true,
  className,
}: {
  data: DataPoint[];
  height?: number;
  showLabels?: boolean;
  className?: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.min(60, 100 / data.length - 2));

  return (
    <div className={cn("flex items-end gap-1", className)} style={{ height }}>
      {data.map((point, i) => {
        const pct = (point.value / maxValue) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
            {showLabels && (
              <span className="text-[10px] font-medium text-muted-foreground">{point.value}</span>
            )}
            <div
              className="w-full rounded-t transition-all duration-500 hover:opacity-80"
              style={{
                height: `${pct}%`,
                backgroundColor: point.color ?? "hsl(var(--primary))",
                minHeight: 4,
                maxWidth: barWidth,
              }}
            />
            {showLabels && (
              <span className="text-[9px] text-muted-foreground/70 truncate max-w-full text-center">
                {point.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple SVG line chart
function LineChartInner({
  data,
  height = 200,
  className,
}: {
  data: DataPoint[];
  height?: number;
  className?: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;
  const width = 100;
  const stepX = width / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: ((maxValue - d.value) / range) * 100,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} 100`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="hsl(var(--primary))"
            className="hover:r-3 transition-all"
          />
        ))}
      </svg>
      {/* Labels */}
      <div className="mt-1 flex justify-between px-0">
        {data
          .filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)
          .map((d, i) => (
            <span key={i} className="text-[9px] text-muted-foreground/70">
              {d.label}
            </span>
          ))}
      </div>
    </div>
  );
}

// Simple SVG pie chart
function PieChartInner({
  data,
  size = 160,
  className,
}: {
  data: DataPoint[];
  size?: number;
  className?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
    "hsl(var(--destructive))",
  ];
  let cumulativePercent = 0;

  const slices = data.map((d, i) => {
    const percent = d.value / total;
    const startAngle = cumulativePercent * 360;
    const endAngle = (cumulativePercent + percent) * 360;
    cumulativePercent += percent;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = Math.cos(startRad);
    const y1 = Math.sin(startRad);
    const x2 = Math.cos(endRad);
    const y2 = Math.sin(endRad);

    const largeArc = percent > 0.5 ? 1 : 0;

    return {
      path: `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: d.color ?? colors[i % colors.length],
      percent: (percent * 100).toFixed(1),
      label: d.label,
    };
  });

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <svg viewBox="-1 -1 2 2" className="shrink-0" style={{ width: size, height: size }}>
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            stroke="hsl(var(--background))"
            strokeWidth="0.02"
          />
        ))}
      </svg>
      <div className="space-y-1.5">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="font-medium text-foreground">{slice.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple SVG area chart
function AreaChartInner({
  data,
  height = 200,
  className,
}: {
  data: DataPoint[];
  height?: number;
  className?: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const stepX = width / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: ((maxValue - d.value) / maxValue) * 100,
  }));

  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} 100`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGradient)" />
        <path
          d={lineD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between">
        {data
          .filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)
          .map((d, i) => (
            <span key={i} className="text-[9px] text-muted-foreground/70">
              {d.label}
            </span>
          ))}
      </div>
    </div>
  );
}

// Loading skeleton
function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
        ))}
      </div>
    </div>
  );
}

// Chart card wrapper
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  height?: number;
  action?: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  children,
  loading,
  className,
  height,
  action,
}: ChartCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {loading ? <ChartSkeleton height={height ?? 200} /> : children}
    </Card>
  );
}

// Exported chart components
interface BarChartProps {
  data: DataPoint[];
  height?: number;
  showLabels?: boolean;
  className?: string;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}
export function BarChart({
  data,
  height,
  showLabels,
  className,
  loading,
  title,
  subtitle,
}: BarChartProps) {
  if (title || subtitle) {
    return (
      <ChartCard title={title ?? ""} subtitle={subtitle} loading={loading} height={height}>
        <BarChartInner data={data} height={height} showLabels={showLabels} className={className} />
      </ChartCard>
    );
  }
  if (loading) return <ChartSkeleton height={height} />;
  return (
    <BarChartInner data={data} height={height} showLabels={showLabels} className={className} />
  );
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}
export function LineChart({ data, height, className, loading, title, subtitle }: LineChartProps) {
  const content = <LineChartInner data={data} height={height} className={className} />;
  if (title || subtitle)
    return (
      <ChartCard title={title ?? ""} subtitle={subtitle} loading={loading} height={height}>
        {content}
      </ChartCard>
    );
  if (loading) return <ChartSkeleton height={height} />;
  return content;
}

interface PieChartProps {
  data: DataPoint[];
  size?: number;
  className?: string;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}
export function PieChart({ data, size, className, loading, title, subtitle }: PieChartProps) {
  const content = <PieChartInner data={data} size={size} className={className} />;
  if (title || subtitle)
    return (
      <ChartCard title={title ?? ""} subtitle={subtitle} loading={loading}>
        {content}
      </ChartCard>
    );
  if (loading) return <ChartSkeleton height={size ?? 160} />;
  return content;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}
export function AreaChart({ data, height, className, loading, title, subtitle }: AreaChartProps) {
  const content = <AreaChartInner data={data} height={height} className={className} />;
  if (title || subtitle)
    return (
      <ChartCard title={title ?? ""} subtitle={subtitle} loading={loading} height={height}>
        {content}
      </ChartCard>
    );
  if (loading) return <ChartSkeleton height={height} />;
  return content;
}

interface MultiSeriesChartProps {
  series: Series[];
  height?: number;
  className?: string;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}
export function MultiBarChart({
  series,
  height = 200,
  className,
  loading,
  title,
  subtitle,
}: MultiSeriesChartProps) {
  const maxValue = Math.max(...series.flatMap((s) => s.data.map((d) => d.value)), 1);

  const content = (
    <div className={cn("flex items-end gap-2", className)} style={{ height }}>
      {series[0]?.data.map((_, idx) => (
        <div key={idx} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
          <div className="flex w-full gap-0.5 justify-center">
            {series.map((s, si) => {
              const pct = ((s.data[idx]?.value ?? 0) / maxValue) * 100;
              return (
                <div
                  key={si}
                  className="rounded-t transition-all duration-500 hover:opacity-80"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: s.color ?? "hsl(var(--primary))",
                    minHeight: 4,
                    width: `${100 / series.length - 2}%`,
                    maxWidth: 20,
                  }}
                  title={`${s.name}: ${s.data[idx]?.value ?? 0}`}
                />
              );
            })}
          </div>
          <span className="text-[9px] text-muted-foreground/70">
            {series[0]?.data[idx]?.label ?? ""}
          </span>
        </div>
      ))}
    </div>
  );

  if (title || subtitle)
    return (
      <ChartCard title={title ?? ""} subtitle={subtitle} loading={loading} height={height}>
        {content}
      </ChartCard>
    );
  if (loading) return <ChartSkeleton height={height} />;
  return content;
}
