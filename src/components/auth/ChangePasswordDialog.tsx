import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { userManagementApi } from "@/services/user-management-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, AlertTriangle } from "lucide-react";

export function ChangePasswordDialog() {
  const { user, mustChangePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Show dialog when mustChangePassword is true and user is logged in
    if (mustChangePassword && user && !initialized) {
      setOpen(true);
      setInitialized(true);
    }
  }, [mustChangePassword, user, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setSubmitting(true);
      await userManagementApi.changePassword(user.id, currentPassword, newPassword);
      
      toast.success("Password changed successfully. Please log in with your new password.");
      
      // Clear the mustChangePassword flag
      localStorage.removeItem("hst.auth.mustChangePassword");
      
      // Logout and redirect to login
      await logout();
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Allow skipping but log the action
    toast.warning("You should change your password as soon as possible");
    setOpen(false);
    setInitialized(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if:
      // 1. User explicitly clicks "Skip for Now" (handleSkip sets open to false directly)
      // 2. Password was successfully changed (handleSubmit logs out and redirects)
      // 3. mustChangePassword is no longer true
      // Never allow closing while mustChangePassword is true and not submitting
      if (!isOpen && mustChangePassword && !submitting) {
        // Force the dialog to stay open
        setOpen(true);
        return;
      }
      setOpen(isOpen);
    }}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => {
          // Completely prevent closing by clicking outside when password change is required
          if (mustChangePassword) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Completely prevent closing with Escape key when password change is required
          if (mustChangePassword) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent any outside interaction from closing the dialog
          if (mustChangePassword) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Change Your Password</DialogTitle>
              <DialogDescription>
                Your password has been reset by the administrator. You must change it before continuing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current Password (Default: Admin@12345)</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-9"
                placeholder="Enter current password"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9"
                placeholder="Enter new password"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={submitting}
            >
              Skip for Now
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Changing Password…" : "Change Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
