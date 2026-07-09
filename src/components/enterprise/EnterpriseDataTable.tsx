// Enterprise Data Table - Universal reusable table with search, sort, filter, pagination, export, column visibility, bulk actions
import { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Download,
  Printer,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Trash2,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { exportToExcel, exportToPDF, printTable } from "@/services/export-service";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  id: string;
  header: string;
  accessorKey: keyof T | string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EnterpriseDataTableProps<T extends Record<string, any>> {
  title?: string;
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  loading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    action: (selected: string[]) => void;
    variant?: "default" | "destructive" | "outline";
  }[];
  emptyState?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  filename?: string;
  onRowClick?: (row: T) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EnterpriseDataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  keyExtractor,
  pageSize = 10,
  loading = false,
  selectable = false,
  onSelectionChange,
  bulkActions,
  emptyState,
  searchable = true,
  searchPlaceholder = "Search records...",
  exportable = true,
  filename = "export",
  onRowClick,
}: EnterpriseDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter((c) => !c.hidden).map((c) => c.id),
  );

  // Filter visible columns
  const displayColumns = columns.filter((c) => visibleColumns.includes(c.id));

  // Search filter
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.accessorKey as keyof T];
        return val != null && String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn as keyof T];
      const bVal = b[sortColumn as keyof T];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
    setPage(0);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      onSelectionChange?.(next);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allIds = pagedData.map(keyExtractor);
      const allSelected = allIds.every((id) => prev.includes(id));
      const next = allSelected ? prev.filter((s) => !allIds.includes(s)) : [...prev, ...allIds.filter((id) => !prev.includes(id))];
      onSelectionChange?.(next);
      return next;
    });
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId) ? prev.filter((c) => c !== columnId) : [...prev, columnId],
    );
  };

  const handleExportExcel = useCallback(() => {
    const cols = displayColumns.map((c) => ({ key: c.accessorKey as string, header: c.header }));
    exportToExcel({ filename, columns: cols, data: filteredData as Record<string, unknown>[] });
  }, [displayColumns, filename, filteredData]);

  const handleExportPDF = useCallback(() => {
    const cols = displayColumns.map((c) => ({ key: c.accessorKey as string, header: c.header }));
    exportToPDF({ filename, columns: cols, data: filteredData as Record<string, unknown>[] });
  }, [displayColumns, filename, filteredData]);

  const handlePrint = useCallback(() => {
    printTable(title ?? filename);
  }, [title, filename]);

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) return <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />;
    return sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-lg border border-border">
          <div className="border-b border-border p-4">
            <div className="flex gap-4">
              {columns.slice(0, 5).map((c) => (
                <Skeleton key={c.id} className="h-4 flex-1" />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-border p-4">
              <div className="flex gap-4">
                {columns.slice(0, 5).map((c) => (
                  <Skeleton key={c.id} className="h-4 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk actions */}
          {selectable && selected.length > 0 && bulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {selected.length} selected
              </span>
              {bulkActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant ?? "outline"}
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => action.action(selected)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Eye className="size-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={visibleColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                  className="text-xs"
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          {exportable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Download className="size-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleExportExcel} className="text-xs gap-2">
                  <FileSpreadsheet className="size-3.5" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="text-xs gap-2">
                  <FileText className="size-3.5" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePrint} className="text-xs gap-2">
                  <Printer className="size-3.5" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={pagedData.length > 0 && pagedData.every((r) => selected.includes(keyExtractor(r)))}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
              )}
              {displayColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && getSortIcon(col.id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12"
                >
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Search className="size-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No records found</p>
                      <p className="text-xs text-muted-foreground/60">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              pagedData.map((row) => {
                const id = keyExtractor(row);
                const isSelected = selected.includes(id);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      isSelected && "bg-primary/5",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(id)}
                        />
                      </td>
                    )}
                    {displayColumns.map((col) => {
                      const value = row[col.accessorKey as keyof T];
                      return (
                        <td key={col.id} className="px-4 py-3 text-sm">
                          {col.cell ? col.cell(value, row) : <span className="text-foreground">{String(value ?? "")}</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, sortedData.length)} of{" "}
            {sortedData.length} records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                if (pageNum >= totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}