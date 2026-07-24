// Gate Pass Form - Create a new gate pass request with auto-generated control number
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { gatePassApi } from "@/services/gate-pass-api";
import { toast } from "sonner";
import {
  FormInput,
  FormTextarea,
  FormDatePicker,
  FormRow,
  FormSection,
  FormActions,
} from "@/components/enterprise/FormFramework";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Plus, X, User, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Department list constant
const DEPARTMENT_LIST = [
  { id: 'qa', name: 'Quality Assurance (QA)', code: 'QA' },
  { id: 'engineering', name: 'Engineering', code: 'ENG' },
  { id: 'production', name: 'Production', code: 'PROD' },
  { id: 'president', name: 'President', code: 'PRES' },
  { id: 'marketing', name: 'MARKETING', code: 'MKTG' },
  { id: 'qc', name: 'QC', code: 'QC' },
  { id: 'rmwhse', name: 'RMWHSE', code: 'RMWHSE' },
  { id: 'fgwhse', name: 'FGWHSE', code: 'FGWHSE' },
  { id: 'ppic', name: 'PPIC', code: 'PPIC' },
  { id: 'cs', name: 'CS', code: 'CS' },
  { id: 'purchasing', name: 'PURCHASING', code: 'PURCH' },
  { id: 'gad-msit', name: 'GAD/MSIT', code: 'GAD/MSIT' },
  { id: 'development', name: 'DEVELOPMENT', code: 'DEV' },
  { id: 'visitor', name: 'VISITOR', code: 'VISITOR' },
];

interface CompanionEntry {
  id: string;
  fullName: string;
  employeeId?: string;
}

interface GatePassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GatePassForm({ open, onOpenChange, onSuccess }: GatePassFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");

  // Companions
  const [companions, setCompanions] = useState<CompanionEntry[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setPurpose("");
      setDestination("");
      setNotes("");
      setDepartmentId("");
      setCompanions([]);
      setErrors({});
    }
  }, [open]);

  // Auto-select user's department when form opens
  useEffect(() => {
    if (!open) return;
    
    // Auto-select user's department by matching department name
    if (user?.department && DEPARTMENT_LIST.length > 0) {
      const matchingDept = DEPARTMENT_LIST.find((d) => 
        d.name.toLowerCase() === user.department.toLowerCase() ||
        d.code.toLowerCase() === user.department.toLowerCase()
      );
      if (matchingDept) {
        setDepartmentId(matchingDept.id);
      } else {
        // Default to first department if no match found
        setDepartmentId(DEPARTMENT_LIST[0].id);
      }
    } else if (DEPARTMENT_LIST.length > 0) {
      // Default to first department if user has no department
      setDepartmentId(DEPARTMENT_LIST[0].id);
    }
  }, [open, user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!purpose.trim()) {
      newErrors.purpose = "Purpose is required";
    }
    if (!destination.trim()) {
      newErrors.destination = "Destination is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCompanion = () => {
    const newId = `companion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCompanions((prev) => [...prev, { id: newId, fullName: "" }]);
  };

  const handleRemoveCompanion = (id: string) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCompanionChange = (id: string, fullName: string, employeeId?: string) => {
    setCompanions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, fullName, employeeId } : c))
    );
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setSubmitting(true);
    try {
      const result = await gatePassApi.submit({
        purpose: purpose.trim(),
        destination: destination.trim(),
        departureTime: departureTime?.toISOString(),
        notes: notes || undefined,
        departmentId: departmentId || undefined,
      });

      // If there are companions, add them after submission
      const validCompanions = companions.filter((c) => c.fullName.trim());
      if (validCompanions.length > 0 && result.gatePassId) {
        try {
          await gatePassApi.addCompanionsBulk(
            result.gatePassId,
            validCompanions.map((c) => ({
              fullName: c.fullName.trim(),
              employeeId: c.employeeId || undefined,
            }))
          );
        } catch (compError) {
          console.error("Failed to add companions:", compError);
          // Don't block success - companions are optional
        }
      }

      toast.success("Gate pass submitted successfully", {
        description: `Control No: ${result.controlNumber}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to submit gate pass:", error);
      toast.error(error?.message || "Failed to submit gate pass");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Gate Pass</DialogTitle>
          <DialogDescription>
            Create a new gate pass request. The control number will be auto-generated upon submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Details */}
          <FormSection title="Request Details" description="Basic information about the gate pass" />

          <FormRow cols={2}>
            <FormInput
              label="Purpose"
              placeholder="e.g. Deliver equipment to supplier"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              error={errors.purpose}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_LIST.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormRow>

          <FormRow cols={2}>
            <FormInput
              label="Destination"
              placeholder="e.g. Makati City"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              error={errors.destination}
              required
            />
            <FormDatePicker
              label="Departure Date"
              value={departureTime}
              onChange={setDepartureTime}
            />
          </FormRow>

          <FormTextarea
            label="Notes / Description"
            placeholder="Additional details about this request..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Companions Section */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Companions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add employees who will be leaving together with the requester
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCompanion}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Companion
              </Button>
            </div>

            {companions.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <User className="size-8 mx-auto mb-2 opacity-40" />
                <p>No companions added yet</p>
                <p className="text-xs mt-1">Click "Add Companion" to include employees leaving together</p>
              </div>
            ) : (
              <div className="space-y-2">
                {companions.map((companion, index) => (
                  <CompanionRow
                    key={companion.id}
                    companion={companion}
                    index={index}
                    onChange={handleCompanionChange}
                    onRemove={handleRemoveCompanion}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Items notice */}
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Items & Assets</p>
              <p className="mt-1">
                Items and assets to be released will be added through the Asset module after the gate pass is created.
              </p>
            </div>
          </div>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSave={handleSubmit}
          loading={submitting}
          saveLabel={submitting ? "Submitting..." : "Submit Gate Pass"}
        />
      </DialogContent>
    </Dialog>
  );
}

// Companion Row Component with Employee Autocomplete
function CompanionRow({
  companion,
  index,
  onChange,
  onRemove,
}: {
  companion: CompanionEntry;
  index: number;
  onChange: (id: string, fullName: string, employeeId?: string) => void;
  onRemove: (id: string) => void;
}) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [inputValue, setInputValue] = useState(companion.fullName);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const results = await gatePassApi.searchEmployees(query.trim());
      setSearchResults(Array.isArray(results) ? results : []);
      setShowResults(true);
    } catch (err) {
      console.error("Employee search failed:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onChange(companion.id, value, undefined);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleSelectEmployee = (employee: any) => {
    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.displayName || employee.name || '';
    setInputValue(fullName);
    onChange(companion.id, fullName, employee.id);
    setShowResults(false);
  };

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background p-2.5">
      <div className="flex-1 relative" ref={wrapperRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search employee name or type manually..."
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {searching && (
            <div className="absolute right-2.5 top-2.5">
              <div className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
            <div className="max-h-48 overflow-y-auto py-1">
              {searchResults.map((emp: any) => {
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.displayName || emp.name || '';
                const dept = emp.department?.name || '';
                const empNum = emp.employeeNumber || '';
                return (
                  <button
                    key={emp.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => handleSelectEmployee(emp)}
                  >
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">
                      {empNum && <span>{empNum} | </span>}
                      {dept && <span>{dept}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showResults && searchResults.length === 0 && !searching && inputValue.trim().length >= 2 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg p-3 text-sm text-muted-foreground">
            No employees found. You can type a name manually.
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 size-9 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(companion.id)}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}