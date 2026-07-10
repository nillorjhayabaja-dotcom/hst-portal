// Holiday Calendar - ERP Configuration
import { useState } from "react";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { getHolidays, createHoliday, deleteHoliday } from "@/services/config-engine";
import type { Holiday } from "@/types/configuration";
import { cn } from "@/lib/utils";

export function HolidayCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>(getHolidays());
  const [showCreate, setShowCreate] = useState(false);

  const refresh = () => setHolidays(getHolidays());

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createHoliday({
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      type: formData.get("type") as Holiday["type"],
      recurring: formData.get("recurring") === "true",
      description: (formData.get("description") as string) || undefined,
    });
    refresh();
    setShowCreate(false);
    form.reset();
  };

  const handleDelete = (id: string) => {
    deleteHoliday(id);
    refresh();
  };

  const typeColors: Record<string, string> = {
    regular: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    special_non_working: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    special_working: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    company_event: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  };

  const columns: Column<Holiday>[] = [
    {
      id: "name",
      header: "Holiday",
      accessorKey: "name",
      sortable: true,
      filterable: true,
      cell: (val) => <span className="font-medium">{String(val)}</span>,
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "date",
      sortable: true,
      width: "140px",
      cell: (val) => <span className="font-mono text-xs">{String(val)}</span>,
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "type",
      sortable: true,
      width: "180px",
      cell: (val) => (
        <Badge variant="secondary" className={cn("text-xs", typeColors[String(val)] || "")}>
          {String(val).replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "recurring",
      header: "Recurring",
      accessorKey: "recurring",
      width: "100px",
      cell: (val) =>
        val ? (
          <Badge variant="outline" className="text-xs text-success">
            Yes
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        ),
    },
    { id: "description", header: "Description", accessorKey: "description" },
    {
      id: "actions",
      header: "",
      accessorKey: "id",
      width: "60px",
      cell: (_, row) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Holiday Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Manage company holidays and special non-working days
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Holiday</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Holiday Name</Label>
                <Input name="name" placeholder="e.g., Christmas Day" required />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input name="date" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select name="type" defaultValue="regular">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Holiday</SelectItem>
                    <SelectItem value="special_non_working">Special Non-Working</SelectItem>
                    <SelectItem value="special_working">Special Working</SelectItem>
                    <SelectItem value="company_event">Company Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="recurring"
                  value="true"
                  id="recurring"
                  className="rounded border-border"
                />
                <Label htmlFor="recurring" className="text-sm">
                  Recurring annually
                </Label>
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Input name="description" placeholder="Additional notes..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Holiday</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <EnterpriseDataTable
            data={holidays}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchable
            searchPlaceholder="Search holidays..."
            exportable
            filename="holiday-calendar"
            emptyState={
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <CalendarDays className="size-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No holidays configured
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Add holidays for leave and SLA calculations
                  </p>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
