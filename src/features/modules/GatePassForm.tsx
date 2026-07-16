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
  const [expectedReturn, setExpectedReturn] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setPurpose("");
      setDestination("");
      setExpectedReturn(undefined);
      setNotes("");
      setErrors({});
    }
  }, [open]);

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
        expectedReturn: expectedReturn?.toISOString(),
        notes: notes || undefined,
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
            <FormInput
              label="Destination"
              placeholder="e.g. Makati City"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              error={errors.destination}
              required
            />
          </FormRow>

          <FormTextarea
            label="Notes / Description"
            placeholder="Additional details about this request..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <FormSection
            title="Return Information"
            description="Expected return schedule for this request"
          />

          <FormDatePicker
            label="Expected Return"
            value={expectedReturn}
            onChange={setExpectedReturn}
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
