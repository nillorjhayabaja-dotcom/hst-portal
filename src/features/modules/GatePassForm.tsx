// Gate Pass Form - Create a new gate pass request with auto-generated control number
import { useState, useEffect } from "react";
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
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setPurpose("");
      setDestination("");
      setNotes("");
      setDepartmentId("");
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
              label="Departure Time"
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
