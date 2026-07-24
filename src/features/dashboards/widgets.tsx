import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/StatusBadge";
import { cn } from "@/lib/utils";
import {
  getEmployeeDisplayName,
  getDepartmentName,
} from "@/utils/display";
import { useApprovalRequests } from "@/services/approval-hooks";
import { useNotifications } from "@/services/notification-hooks";
import React from 'react';

export function RecentRequests({
  title = "Recent Requests",
  filter,
  limit = 5,
  showFilters = false,
  showSearch = false,
  showPagination = false,
}: {
  title?: string;
  filter?: (r: any) => boolean;
  limit?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
}) {
  const [page, setPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedModule, setSelectedModule] = React.useState<string>('all');
  const [dateRange, setDateRange] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('newest');
  
  const pageSize = showPagination ? 10 : limit;
  
  const { data, isLoading } = useApprovalRequests({ 
    pageSize,
    page: showPagination ? page : 1,
  });
  
  const requests = data?.data || [];
  let rows = filter ? requests.filter(filter) : requests;
  
  // Apply search filter
  if (showSearch && searchQuery) {
    const query = searchQuery.toLowerCase();
    rows = rows.filter((r: any) => 
      r.controlNumber?.toLowerCase().includes(query) ||
      r.title?.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.moduleId?.toLowerCase().includes(query) ||
      r.status?.toLowerCase().includes(query)
    );
  }
  
  // Apply module filter
  if (showFilters && selectedModule !== 'all') {
    rows = rows.filter((r: any) => r.moduleId === selectedModule);
  }
  
  // Apply date range filter
  if (showFilters && dateRange !== 'all') {
    const now = new Date();
    const requestDate = (dateStr: string) => new Date(dateStr);
    
    rows = rows.filter((r: any) => {
      const created = requestDate(r.createdAt);
      switch (dateRange) {
        case 'today':
          return created.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created >= monthAgo;
        }
        case 'quarter': {
          const quarterAgo = new Date();
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          return created >= quarterAgo;
        }
        case 'year': {
          const yearAgo = new Date();
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return created >= yearAgo;
        }
        default:
          return true;
      }
    });
  }
  
  // Apply sorting
  if (showFilters && sortBy) {
    rows = [...rows].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'pending': {
          const statusOrder: Record<string, number> = { pending: 0, in_review: 1, approved: 2, rejected: 3 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        }
        case 'approved': {
          const statusOrder2: Record<string, number> = { approved: 0, pending: 1, in_review: 2, rejected: 3 };
          return (statusOrder2[a.status] || 0) - (statusOrder2[b.status] || 0);
        }
        case 'rejected': {
          const statusOrder3: Record<string, number> = { rejected: 0, pending: 1, in_review: 2, approved: 3 };
          return (statusOrder3[a.status] || 0) - (statusOrder3[b.status] || 0);
        }
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  }
  
  const totalPages = data?.totalPages || 1;
  
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/m/$moduleId" params={{ moduleId: "approvals" }}>
            View all
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <option value="all">All Requests</option>
              <option value="gate-pass">Gate Pass</option>
              <option value="leave">Leave</option>
              <option value="food-request">Food Request</option>
              <option value="visitor">Visitors</option>
              <option value="vehicle">Vehicle</option>
              <option value="item-pass">Item Pass</option>
              <option value="purchase-request">Purchase Request</option>
            </select>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="pending">Pending First</option>
              <option value="approved">Approved First</option>
              <option value="rejected">Rejected First</option>
              <option value="updated">Recently Updated</option>
            </select>
            
            {showSearch && (
              <input
                type="text"
                placeholder="Search by control #, purpose, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm min-w-[200px]"
              />
            )}
          </div>
        )}
        
        <div className="space-y-1">
          {rows.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.controlNumber} · {getEmployeeDisplayName(r.requester as any)}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
          {rows.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">No requests found</p>
              {showPagination && (
                <Button size="sm" className="mt-2">
                  Create Your First Request
                </Button>
              )}
            </div>
          )}
        </div>
        
        {showPagination && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ApprovalQueueCard({ title = "Pending Approvals" }: { title?: string }) {
  const { data, isLoading } = useApprovalRequests({ status: "pending", pageSize: 4 });
  const requests = data?.data || [];
  
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning-foreground">
          {requests.length} waiting
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((r: any) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.moduleId} · {getDepartmentName(r.department as any)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                Review
              </Button>
              <Button size="sm" className="h-7 px-2 text-xs">
                Approve
              </Button>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No pending approvals</p>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickActions({
  actions,
}: {
  actions: { label: string; icon: LucideIcon; to: string; tone?: string }[];
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="flex flex-col items-start gap-2 rounded-xl border border-border p-3.5 transition-all hover:border-primary/40 hover:shadow-card"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <a.icon className="size-4.5 size-[18px]" />
            </span>
            <span className="text-sm font-medium text-foreground">{a.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function ActivityFeed({ title = "Recent Activity" }: { title?: string }) {
  const { data, isLoading } = useNotifications({ pageSize: 5 });
  const notifications = data?.data || [];

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((n: any) => (
          <div key={n.id} className="flex gap-3">
            <span
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                n.type === "alert" && "bg-destructive",
                n.type === "approval" && "bg-warning",
                n.type === "system" && "bg-info",
                n.type === "info" && "bg-primary",
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="truncate text-xs text-muted-foreground">{n.message}</p>
              <p className="text-[11px] text-muted-foreground/70">
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}