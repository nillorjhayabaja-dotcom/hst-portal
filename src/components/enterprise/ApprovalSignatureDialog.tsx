// ApprovalSignatureDialog - Reusable dialog for approval with electronic signature
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignatureUploader } from "./SignatureUploader";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ApprovalSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string, signature: File) => Promise<void>;
  title?: string;
  description?: string;
  loading?: boolean;
}

export function ApprovalSignatureDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Approval Required",
  description = "Please upload your electronic signature to approve this request.",
  loading = false,
}: ApprovalSignatureDialogProps) {
  const [note, setNote] = useState("");
  const [signature, setSignature] = useState<File | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setNote("");
      setSignature(undefined);
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!signature) {
      toast.error("Please upload your signature");
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(note, signature);
      onOpenChange(false);
    } catch (error) {
      console.error("Approval error:", error);
      // Error is already handled by the parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      onOpenChange(false);
    }
  };

  const isConfirmDisabled = !signature || submitting || loading;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Signature Upload */}
          <div className="space-y-2">
            <Label>Electronic Signature *</Label>
            <SignatureUploader
              onSignatureSelect={setSignature}
              onSignatureClear={() => setSignature(undefined)}
              selectedSignature={signature}
              disabled={submitting || loading}
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="note">Remarks (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add any remarks or comments..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting || loading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitting || loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {(submitting || loading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}