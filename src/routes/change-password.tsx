import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { KeyRound, AlertTriangle, Eye, EyeOff, LogOut } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { userManagementApi } from "@/services/user-management-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { user, mustChangePassword, logout, ready } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (ready && !user) {
      redirect({ to: "/" });
    }
  }, [ready, user]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (newPassword.length >= 12) strength += 15;
    if (/[A-Z]/.test(newPassword)) strength += 15;
    if (/[a-z]/.test(newPassword)) strength += 15;
    if (/[0-9]/.test(newPassword)) strength += 15;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 15;
    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

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

    // Validate password requirements
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one special character");
      return;
    }

    try {
      setSubmitting(true);
      await userManagementApi.changePassword(user.id, currentPassword, newPassword);
      
      toast.success("Password changed successfully! Redirecting to dashboard...");
      
      // Clear the mustChangePassword flag
      localStorage.removeItem("hst.auth.mustChangePassword");
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate({ to: "/app/dashboard" });
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  // Show loading state while checking auth
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or doesn't need to change password, redirect
  if (!user || !mustChangePassword) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't need to change your password at this time.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: "/app/dashboard" })} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Change Your Password</CardTitle>
              <CardDescription>
                Your password has been reset by the System Administrator. For security reasons, you must create a new password before accessing the HST Enterprise Portal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password (Default: Admin@12345)</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Enter current password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password Strength</span>
                    <span className={`font-medium ${passwordStrength < 40 ? 'text-red-500' : passwordStrength < 70 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />
                </div>
              )}

              <div className="space-y-1 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-foreground">Password Requirements:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                    • Minimum 8 characters
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                    • At least one uppercase letter (A-Z)
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                    • At least one lowercase letter (a-z)
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
                    • At least one number (0-9)
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : ""}>
                    • At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={submitting}
                className="flex-1"
              >
                <LogOut className="mr-2 size-4" />
                Cancel / Logout
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || passwordStrength < 40}
                className="flex-1"
              >
                {submitting ? "Updating Password…" : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}