// Verification Portal - Security Guard QR Verification Page
import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Clock, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { gatePassApi } from "@/services/gate-pass-api";

interface VerificationData {
  gatePass: any;
  request: any;
  verification: any;
}

export const Route = createFileRoute("/verify/$token")({
  component: VerifyPage,
});

function VerifyPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken(token);
    }
  }, [token]);

  const validateToken = async (verificationToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await gatePassApi.verifyQRToken(verificationToken);
      setData(result.data);
    } catch (err: any) {
      const message = err?.message || "Invalid QR code";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!token || !user) return;

    try {
      setReleasing(true);
      const timeOut = new Date().toISOString();

      await gatePassApi.confirmQRVerification(token, {
        timeOut,
        kmReadingStart: 0,
        kmReadingEnd: 0,
        withMeal: false,
        mealAmount: 0,
      });

      toast.success("Gate pass released successfully");
      // Refresh data
      await validateToken(token);
    } catch (err: any) {
      toast.error(err?.message || "Failed to release gate pass");
    } finally {
      setReleasing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    toast.info("PDF download coming soon");
  };

  const handleLogin = () => {
    navigate({ to: "/" });
  };

  // Check if user has permission to release
  const canRelease = user && (
    user.role?.toLowerCase() === "security" ||
    user.role?.toLowerCase() === "super_admin" ||
    user.role?.toLowerCase() === "admin"
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium">Validating QR Code...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-6 h-6" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error || "Invalid QR code"}</p>
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  Please log in to access the verification portal.
                </p>
              </div>
            )}
            <Button onClick={handleLogin} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { gatePass, request, verification } = data;
  const isReleased = verification.status === "released";
  const isExpired = verification.status === "expired";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                HS TECHNOLOGIES (PHILS.), INC.
              </h1>
              <p className="text-lg font-semibold text-gray-700">Gate Pass Verification Portal</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Control Number</p>
              <p className="text-2xl font-mono font-bold text-red-600">{request.controlNumber}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <Badge
            variant={isReleased ? "default" : isExpired ? "destructive" : "secondary"}
            className="text-sm px-4 py-2"
          >
            {isReleased ? "Released" : isExpired ? "Expired" : "Ready for Verification"}
          </Badge>
        </div>

        {/* Gate Pass Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gate Pass Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Employee</label>
                <p className="text-gray-900 font-medium">
                  {request.requester.employees?.firstName} {request.requester.employees?.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-900">{request.department?.name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Destination</label>
                <p className="text-gray-900">{gatePass.destination || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Purpose</label>
                <p className="text-gray-900">{gatePass.purpose}</p>
              </div>
              {gatePass.vehicle && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vehicle</label>
                    <p className="text-gray-900">
                      {gatePass.vehicle.brand} {gatePass.vehicle.model} ({gatePass.vehicle.plateNumber})
                    </p>
                  </div>
                  {gatePass.driverName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Driver</label>
                      <p className="text-gray-900">{gatePass.driverName}</p>
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Expected Return</label>
                <p className="text-gray-900">
                  {gatePass.expectedReturn ? new Date(gatePass.expectedReturn).toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Scan Count</label>
                <p className="text-gray-900">{verification.scanCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Approval Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.steps?.map((step: any) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {step.status === "approved" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : step.status === "current" ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{step.name}</p>
                    <p className="text-sm text-gray-600">
                      {step.actor?.displayName || "Pending"} • {step.role?.name}
                    </p>
                    {step.actedAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(step.actedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {!isReleased && !isExpired && (
          <Card>
            <CardHeader>
              <CardTitle>Security Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canRelease ? (
                <>
                  <Button
                    onClick={handleRelease}
                    disabled={releasing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {releasing ? "Releasing..." : "Release Gate Pass"}
                  </Button>
                  <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" className="flex-1">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    {user
                      ? "You do not have permission to release gate passes. Please contact your administrator."
                      : "Please log in with your security credentials to release this gate pass."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Released Info */}
        {isReleased && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold text-green-900">Gate Pass Released</p>
                  <p className="text-sm text-green-700">
                    Released on {verification.releasedAt?.toLocaleString()}
                  </p>
                  {verification.remarks && (
                    <p className="text-sm text-green-700 mt-1">Remarks: {verification.remarks}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Electronically Generated by HST Enterprise Portal</p>
          <p>Verification Token: {token?.substring(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
}