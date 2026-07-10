// Enterprise Dialogs - Reusable confirmation, delete, approve, reject, return, and logout dialogs
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Undo2, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note?: string) => void;
  loading?: boolean;
}

interface ConfirmDialogProps extends BaseDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "warning" | "success";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    default: { icon: null, button: "" },
    destructive: {
      icon: Trash2,
      button: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    },
    warning: {
      icon: AlertTriangle,
      button: "bg-warning hover:bg-warning/90 text-warning-foreground",
    },
    success: {
      icon: CheckCircle,
      button: "bg-success hover:bg-success/90 text-success-foreground",
    },
  };

  const v = variantStyles[variant];
  const Icon = v.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          {Icon && (
            <div className="mb-2 grid size-10 place-items-center rounded-full bg-muted">
              <Icon
                className={cn(
                  "size-5",
                  variant === "destructive" && "text-destructive",
                  variant === "warning" && "text-warning-foreground",
                  variant === "success" && "text-success",
                )}
              />
            </div>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={v.button}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Pre-configured dialogs
export function DeleteDialog(props: BaseDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      title="Delete item"
      description="Are you sure you want to delete this item? This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
    />
  );
}

export function ApproveDialog(props: BaseDialogProps & { onConfirm: (note?: string) => void }) {
  const [note, setNote] = useState("");

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-full bg-success/10">
            <CheckCircle className="size-5 text-success" />
          </div>
          <AlertDialogTitle>Approve Request</AlertDialogTitle>
          <AlertDialogDescription>
            This action will approve the request and move it to the next step in the workflow.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="Add an approval note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={() => {
              props.onConfirm(note);
              setNote("");
            }}
            disabled={props.loading}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            {props.loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Approve
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RejectDialog(props: BaseDialogProps & { onConfirm: (note?: string) => void }) {
  const [note, setNote] = useState("");

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-full bg-destructive/10">
            <XCircle className="size-5 text-destructive" />
          </div>
          <AlertDialogTitle>Reject Request</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for rejection. This will be shared with the requester.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="Reason for rejection (required)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px] text-sm"
            required
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={() => {
              if (!note.trim()) return;
              props.onConfirm(note);
              setNote("");
            }}
            disabled={props.loading || !note.trim()}
            variant="destructive"
          >
            {props.loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Reject
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReturnDialog(props: BaseDialogProps & { onConfirm: (note?: string) => void }) {
  const [note, setNote] = useState("");

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-full bg-warning/20">
            <Undo2 className="size-5 text-warning-foreground" />
          </div>
          <AlertDialogTitle>Return Request</AlertDialogTitle>
          <AlertDialogDescription>
            Return this request to the previous step with revision notes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="Revision notes (required)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px] text-sm"
            required
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={() => {
              if (!note.trim()) return;
              props.onConfirm(note);
              setNote("");
            }}
            disabled={props.loading || !note.trim()}
            className="bg-warning hover:bg-warning/90 text-warning-foreground"
          >
            {props.loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Return
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LogoutDialog(props: BaseDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      title="Sign out"
      description="Are you sure you want to sign out? You'll need to log in again to access the portal."
      confirmLabel="Sign out"
      variant="destructive"
    />
  );
}
