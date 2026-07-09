// Enterprise Core Framework Types
// Shared types for all enterprise components

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: string;
  color: string;
  to?: string;
}

export interface SearchResult {
  id: string;
  type: "module" | "employee" | "request" | "department" | "control-number";
  label: string;
  description: string;
  icon: string;
  to?: string;
  badge?: string;
}

export interface CommentItem {
  id: string;
  author: string;
  authorInitials: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  attachments: AttachmentItem[];
  replies: CommentItem[];
  mentions: string[];
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  status: string;
  actor: string;
  role: string;
  date: string;
  note?: string;
  icon: string;
  completed: boolean;
  current: boolean;
  rejected: boolean;
}

export interface DialogConfig {
  open: boolean;
  title: string;
  description: string;
  variant: "default" | "destructive" | "warning" | "success";
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ExportConfig {
  filename: string;
  sheets?: { name: string; data: Record<string, unknown>[] }[];
  data?: Record<string, unknown>[];
}

export interface ColumnDef<T = Record<string, unknown>> {
  id: string;
  header: string;
  accessorKey: keyof T | string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterState {
  column: string;
  value: string;
  operator: "contains" | "equals" | "startsWith" | "endsWith" | "gt" | "lt";
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: { label: string; value: number }[];
  color: string;
}