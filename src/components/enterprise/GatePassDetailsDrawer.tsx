// Gate Pass Details Drawer - HST Workflow specific drawer with sequential approval
import { useState, useEffect } from "react";
import {
  UniversalDrawer,
  type DrawerTab,
} from "@/components/enterprise/UniversalDrawer";
import { UniversalTimeline } from "@/components/enterprise/UniversalTimeline";
import { CommentSection } from "@/components/enterprise/CommentSection";
import { AttachmentSection } from "@/components/enterprise/AttachmentSection";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { ApprovalSignatureDialog } from "@/components/enterprise/ApprovalSignatureDialog";
import {
  RejectDialog,
  ReturnDialog,
} from "@/components/enterprise/EnterpriseDialogs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { gatePassApi, type GatePass, type WorkflowStatus } from "@/services/gate-pass-api";
import { toast } from "sonner";
import {
  User,
  Building2,
  Hash,
  CalendarDays,
  Clock,
  MapPin,
  Car,
  Truck,
  QrCode,
  Download,
  Shield,
  CheckCircle,
  Printer,
} from "lucide-react";
import {
  getEmployeeDisplayName,
  getDepartmentName,
} from "@/utils/display";
import type { CommentItem as EnterpriseComment } from "@/types/enterprise";

interface GatePassDetailsDrawerProps {
  gatePass: GatePass;
  workflowStatus: WorkflowStatus | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function GatePassDetailsDrawer({
  gatePass,
  workflowStatus,
  open,
  onClose,
  onRefresh,
}: GatePassDetailsDrawerProps) {
  const { user } = useAuth();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Get user's role name
  const userRoleName = user?.role?.toLowerCase() || '';

  // Fetch comments and attachments on open
  useEffect(() => {
    if (open && workflowStatus) {
      fetchComments();
      fetchAttachments();
    }
  }, [open, workflowStatus?.requestId]);

  const fetchComments = async () => {
    if (!workflowStatus) return;
    try {
      const result = await gatePassApi.getComments(
        'approval_request',
        workflowStatus.requestId
      );
      setComments(Array.isArray(result) ? result : []);
    } catch {
      setComments([]);
    }
  };

  const fetchAttachments = async () => {
    if (!workflowStatus) return;
    try {
      const result = await gatePassApi.getAttachments(
        'approval_request',
        workflowStatus.requestId
      );
      setAttachments(Array.isArray(result) ? result : []);
    } catch {
      setAttachments([]);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!workflowStatus) return;
    try {
      await gatePassApi.addComment(
        'approval_request',
        workflowStatus.requestId,
        content
      );
      await fetchComments();
      toast.success("Comment added");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add comment");
    }
  };

  // Determine who the current approver is
  const getCurrentStepInfo = () => {
    if (!workflowStatus) return null;
    const currentStep = workflowStatus.steps?.find(
      (s: any) => s.status === 'current'
    );
    return currentStep || null;
  };

  // Normalize role name for comparison (remove spaces, hyphens, underscores, lowercase)
  const normalizeRole = (role: string): string => {
    return role.toLowerCase().replace(/[\s_-]/g, '');
  };

  // Check if user is super admin - comprehensive check
  const isSuperAdmin = (): boolean => {
    const normalized = normalizeRole(userRoleName);
    const nameIncludesAdmin = user?.name?.toLowerCase().includes('administrator') ?? false;
    const titleIncludesAdmin = user?.title?.toLowerCase().includes('administrator') ?? false;
    return (
      normalized === 'super_admin' ||
      normalized === 'superadmin' ||
      normalized === 'admin' ||
      normalized === 'administrator' ||
      nameIncludesAdmin ||
      titleIncludesAdmin
    );
  };

  // Check if current user is the current approver based on role
  const isCurrentApprover = (): boolean => {
    if (!user || !workflowStatus || !userRoleName) return false;

    const currentStep = getCurrentStepInfo();
    if (!currentStep) return false;

    // Super Admin can approve any step
    if (isSuperAdmin()) return true;

    // Get the role name required for this step and normalize both for comparison
    const stepRoleName = normalizeRole(currentStep.role?.name || '');

    // Check if user's role matches the step's required role (normalized)
    return normalizeRole(userRoleName) === stepRoleName;
  };

  // Check if user is the requestor
  const isRequestor = (): boolean => {
    if (!user || !workflowStatus) return false;
    return workflowStatus.gatePass?.requester?.id === user.id;
  };

  // Check if user has security role
  const isSecurity = (): boolean => {
    return userRoleName === 'security';
  };

  // Current step status text
  const getStepStatusText = (): string | null => {
    const currentStep = getCurrentStepInfo();
    if (!currentStep) return null;

    const roleName = currentStep.role?.name || 'approver';
    return `Waiting for ${roleName} Approval`;
  };

  // Determine which step endpoint to call based on current step name
  const getStepActionEndpoint = (stepName: string): 'recommend' | 'noted' | 'gado_approve' | 'approve' => {
    const name = stepName.toLowerCase();
    if (name.includes('recommend')) return 'recommend';
    if (name.includes('noted')) return 'noted';
    if (name.includes('approve') || name.includes('approved')) return 'gado_approve';
    return 'approve';
  };

  // Handle approve action
  const handleApprove = async (note?: string, signature?: File) => {
    if (!user || !workflowStatus) return;
    setLoading(true);
    try {
      const currentStep = getCurrentStepInfo();
      if (!currentStep) {
        toast.error("No pending approval step found");
        return;
      }

      const actionEndpoint = getStepActionEndpoint(currentStep.name || '');

      switch (actionEndpoint) {
        case 'recommend':
          await gatePassApi.recommend(workflowStatus.requestId, note, signature);
          break;
        case 'noted':
          await gatePassApi.noted(workflowStatus.requestId, note, signature);
          break;
        case 'gado_approve':
          await gatePassApi.gadoApprove(workflowStatus.requestId, note, signature);
          break;
        default:
          await gatePassApi.approve(workflowStatus.requestId, note, signature);
      }

      toast.success("Approved successfully");
      setShowApprove(false);
      onRefresh();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error?.message || "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason?: string) => {
    if (!user || !workflowStatus || !reason) return;
    setLoading(true);
    try {
      await gatePassApi.reject(workflowStatus.requestId, reason);
      toast.success("Gate pass rejected");
      setShowReject(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (note?: string) => {
    if (!user || !workflowStatus || !note) return;
    setLoading(true);
    try {
      await gatePassApi.returnRequest(workflowStatus.requestId, note);
      toast.success("Gate pass returned for revision");
      setShowReturn(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to return");
    } finally {
      setLoading(false);
    }
  };

  // Build HST workflow timeline from workflow status
  const buildTimelineEvents = () => {
    if (!workflowStatus) return [];

    const steps = workflowStatus.steps || [];
    const actions = workflowStatus.actions || [];
    const status = workflowStatus.status;

    const events: Array<{
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
    }> = [
      {
        id: 'submitted',
        status: 'Request Submitted',
        actor: gatePass.requester?.displayName || 'Requester',
        role: 'Requester',
        date: new Date(gatePass.createdAt).toLocaleString(),
        note: undefined,
        icon: 'Send',
        completed: true,
        current: false,
        rejected: false,
      },
    ];

    // Map workflow steps to timeline events
    steps.forEach((step: any) => {
      const action = actions.find(
        (a: any) => a.stepId === step.id || a.metadata?.stepName === step.name
      );

      const isCompleted = step.status === 'approved' || step.status === 'completed';
      const isCurrent = step.status === 'current';
      const isRejected = step.status === 'rejected';

      events.push({
        id: step.id || `step-${step.stepOrder}`,
        status: step.name,
        actor: step.actor?.displayName || action?.actor?.displayName || '',
        role: step.role?.name || '',
        date: step.actedAt
          ? new Date(step.actedAt).toLocaleString()
          : action?.createdAt
          ? new Date(action.createdAt).toLocaleString()
          : '',
        note: step.note || action?.note || undefined,
        icon: isCompleted ? 'CheckCircle' : isRejected ? 'XCircle' : 'Clock',
        completed: isCompleted,
        current: isCurrent,
        rejected: isRejected,
      });
    });

    // Add post-approval steps
    if (status === 'approved' || status === 'released' || status === 'completed') {
      // QR Generated step
      events.push({
        id: 'qr_generated',
        status: 'QR Generated',
        actor: 'System',
        role: '',
        date: gatePass.qrGeneratedAt
          ? new Date(gatePass.qrGeneratedAt).toLocaleString()
          : gatePass.qrCode
          ? new Date(gatePass.updatedAt).toLocaleString()
          : new Date().toLocaleString(),
        note: gatePass.qrCode ? 'Secure QR token generated' : undefined,
        icon: 'CheckCircle',
        completed: !!gatePass.qrCode,
        current: !gatePass.qrCode && status === 'approved',
        rejected: false,
      });

      // Waiting for Security Scan step
      if (gatePass.qrCode && !gatePass.isUsed) {
        events.push({
          id: 'waiting_scan',
          status: 'Waiting for Security Scan',
          actor: '',
          role: '',
          date: gatePass.qrGeneratedAt
            ? new Date(gatePass.qrGeneratedAt).toLocaleString()
            : new Date().toLocaleString(),
          note: 'Present QR code to security guard',
          icon: 'Clock',
          completed: false,
          current: true,
          rejected: false,
        });
      }

      // Security Verified step
      if (gatePass.isUsed || status === 'completed') {
        events.push({
          id: 'security_verified',
          status: 'Security Verified',
          actor: gatePass.verifiedBy || 'Security Guard',
          role: 'Security',
          date: gatePass.verifiedAt
            ? new Date(gatePass.verifiedAt).toLocaleString()
            : gatePass.completedAt
            ? new Date(gatePass.completedAt).toLocaleString()
            : '',
          note: 'Exit verified by security',
          icon: 'CheckCircle',
          completed: true,
          current: false,
          rejected: false,
        });
      }

      // Completed step
      if (status === 'completed') {
        events.push({
          id: 'completed',
          status: 'Completed',
          actor: 'System',
          role: '',
          date: gatePass.completedAt
            ? new Date(gatePass.completedAt).toLocaleString()
            : new Date().toLocaleString(),
          note: 'Gate pass successfully completed',
          icon: 'CheckCircle',
          completed: true,
          current: false,
          rejected: false,
        });
      }
    }

    return events;
  };

  // Build the tabs
  const getTabs = (): DrawerTab[] => {
    const timelineEvents = buildTimelineEvents();

    // Format comments for CommentSection
    const formattedComments: EnterpriseComment[] = comments.map((c: any) => ({
      id: c.id,
      author: c.author?.displayName || 'Unknown',
      authorInitials: (c.author?.displayName?.charAt(0) || 'U').toUpperCase(),
      authorAvatar: c.author?.avatarUrl,
      content: c.content,
      createdAt: c.createdAt,
      attachments: [],
      replies: [],
      mentions: [],
    }));

    // Format attachments for AttachmentSection
    const formattedAttachments = attachments.map((a: any) => ({
      id: a.id,
      name: a.fileName,
      size: a.fileSize?.toString() || '0',
      type: a.mimeType,
      url: a.storagePath,
      uploadedBy: a.uploadedBy || 'System',
      uploadedAt: a.createdAt,
    }));

    const tabs: DrawerTab[] = [
      {
        id: "overview",
        label: "Overview",
        content: (
          <div className="space-y-4">
            {/* Gate Pass Fields */}
            <div className="grid grid-cols-2 gap-3">
              <DetailField
                icon={Hash}
                label="Control Number"
                value={gatePass.controlNumber}
              />
              <DetailField
                icon={User}
                label="Requester"
                value={getEmployeeDisplayName(gatePass.requester)}
              />
              <DetailField
                icon={Building2}
                label="Department"
                value={getDepartmentName(gatePass.department)}
              />
              <DetailField
                icon={CalendarDays}
                label="Date Requested"
                value={new Date(gatePass.createdAt).toLocaleDateString()}
              />
              <DetailField
                icon={MapPin}
                label="Destination"
                value={gatePass.destination || "N/A"}
              />
              <DetailField
                icon={Car}
                label="Transportation"
                value={gatePass.transportation || "N/A"}
              />
              {gatePass.vehicle && (
                <DetailField
                  icon={Truck}
                  label="Vehicle"
                  value={`${gatePass.vehicle.plateNumber}${gatePass.vehicle.brand ? ` (${gatePass.vehicle.brand})` : ''}`}
                />
              )}
              {gatePass.driverName && (
                <DetailField
                  icon={User}
                  label="Driver"
                  value={gatePass.driverName}
                />
              )}
              <DetailField
                icon={Clock}
                label="Expected Return"
                value={
                  gatePass.expectedReturn
                    ? new Date(gatePass.expectedReturn).toLocaleDateString()
                    : "N/A"
                }
              />
            </div>

            <Separator />
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Purpose</h4>
              <p className="text-sm text-muted-foreground">{gatePass.purpose}</p>
            </div>

            <Separator />
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Status</h4>
              <StatusBadgeEnhanced status={gatePass.status} size="md" />
            </div>

            {/* QR Code - only after GAD approval */}
            {gatePass.qrCode && (
              <>
                <Separator />
                <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <QrCode className="size-5" />
                    Gate Pass QR Code - Show this to Security Guard
                  </h4>
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <img
                        src={`data:image/png;base64,${gatePass.qrCode}`}
                        alt="Gate Pass QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Present this QR code to the Security Guard at the gate
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Control Number: <span className="font-mono font-bold">{gatePass.controlNumber}</span>
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `${gatePass.controlNumber}-qr.png`;
                            link.href = `data:image/png;base64,${gatePass.qrCode}`;
                            link.click();
                          }}
                        >
                          <Download className="size-4" />
                          Download QR Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.print()}
                        >
                          <Printer className="size-4" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Approval Controls - Only for current approver (not requestor, not security) */}
            {!isRequestor() && !isSecurity() && (
              <>
                <Separator />
                {isCurrentApprover() || isSuperAdmin() ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Approval Actions</h4>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowReturn(true)}
                        variant="outline"
                        className="flex-1"
                        disabled={loading}
                      >
                        Return
                      </Button>
                      <Button
                        onClick={() => setShowReject(true)}
                        variant="destructive"
                        className="flex-1"
                        disabled={loading}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => setShowApprove(true)}
                        className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                        disabled={loading}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/30 p-4 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {getStepStatusText() || 'No action required'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Security can release */}
            {isSecurity() && gatePass.status === 'approved' && !gatePass.securityReleasedAt && (
              <>
                <Separator />
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    QR scan and release is available in the Guard Portal
                  </p>
                </div>
              </>
            )}
          </div>
        ),
      },
      {
        id: "timeline",
        label: "Timeline",
        badge: timelineEvents.filter((e) => e.current).length,
        content: <UniversalTimeline events={timelineEvents} />,
      },
      {
        id: "comments",
        label: "Comments",
        badge: comments.length,
        content: (
          <CommentSection
            comments={formattedComments}
            onAddComment={handleAddComment}
          />
        ),
      },
      {
        id: "attachments",
        label: "Attachments",
        badge: attachments.length,
        content: (
          <div className="space-y-4">
            {formattedAttachments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attachments yet. Attachments will appear after approval.
              </p>
            ) : (
              <AttachmentSection
                attachments={formattedAttachments}
                readonly
              />
            )}
          </div>
        ),
      },
      // QR Code tab - visible only when approved by GAD
      ...(workflowStatus?.status === 'approved' || workflowStatus?.status === 'released' || workflowStatus?.status === 'completed' ? [{
        id: "qr-code",
        label: "QR Code",
        content: (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg">
              {gatePass.qrCode ? (
                <>
                  <img
                    src={`data:image/png;base64,${gatePass.qrCode}`}
                    alt="Gate Pass QR Code"
                    className="w-64 h-64 border-4 border-foreground/20 rounded-lg p-2 bg-white"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Present this QR Code to the Security Guard before leaving the company premises.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `${gatePass.controlNumber}-qr.png`;
                        link.href = `data:image/png;base64,${gatePass.qrCode}`;
                        link.click();
                      }}
                    >
                      <Download className="size-4" />
                      Download QR Code
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">QR Code not yet generated</p>
                </div>
              )}
            </div>
          </div>
        ),
      }] : []),
      // Scan QR tab - visible only to security role
      ...(isSecurity() ? [{
        id: "scan-qr",
        label: "Scan QR",
        content: (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Scan the QR code from the employee's gate pass to verify and complete the exit process.
              </p>
            </div>
            <QRScannerSection gatePass={gatePass} onRefresh={onRefresh} />
          </div>
        ),
      }] : []),
    ];

    return tabs;
  };

  return (
    <>
      <UniversalDrawer
        open={open}
        onClose={onClose}
        title={gatePass.controlNumber}
        description={`${gatePass.purpose}`}
        tabs={getTabs()}
      />

      <ApprovalSignatureDialog
        open={showApprove}
        onOpenChange={setShowApprove}
        onConfirm={async (note: string, signature: File) => {
          await handleApprove(note, signature);
        }}
        loading={loading}
      />
      <RejectDialog
        open={showReject}
        onOpenChange={setShowReject}
        onConfirm={handleReject}
        loading={loading}
      />
      <ReturnDialog
        open={showReturn}
        onOpenChange={setShowReturn}
        onConfirm={handleReturn}
        loading={loading}
      />
    </>
  );
}

function DetailField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value || 'N/A'}</p>
    </div>
  );
}

// QR Scanner Section Component
function QRScannerSection({ gatePass, onRefresh }: { gatePass: GatePass; onRefresh: () => void }) {
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleScan = async () => {
    if (!scanInput.trim()) {
      toast.error('Please enter a QR token or control number');
      return;
    }

    setLoading(true);
    try {
      const result = await gatePassApi.verifyQRToken(scanInput.trim());
      setScanResult(result);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to verify QR code');
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!scanResult) return;

    setLoading(true);
    try {
      await gatePassApi.confirmQRVerification(scanResult.gatePass.qr_token, {
        timeOut: new Date().toISOString(),
      });
      toast.success('Gate pass verified successfully');
      setScanResult(null);
      setScanInput('');
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to confirm verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Enter QR token or scan QR code..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleScan}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {scanResult && (
        <div className="bg-white border-2 border-green-500 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">Gate Pass Verified</h3>
              <p className="text-sm text-gray-600">Control: {scanResult.request.controlNumber}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Valid
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Requester:</span>
                <p>{scanResult.request.requester.displayName}</p>
              </div>
              <div>
                <span className="font-semibold">Destination:</span>
                <p>{scanResult.gatePass.destination || 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold">Purpose:</span>
                <p>{scanResult.gatePass.purpose}</p>
              </div>
              <div>
                <span className="font-semibold">Vehicle:</span>
                <p>{scanResult.gatePass.vehicle?.plateNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmVerification}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Verify Exit
          </button>
        </div>
      )}
    </div>
  );
}
