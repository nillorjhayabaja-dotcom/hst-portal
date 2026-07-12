// Guard Portal - Security personnel interface for gate pass verification
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { gatePassApi, type GatePass, type WorkflowStatus } from "@/services/gate-pass-api";
import { printGatePass, type GatePassPDFData } from "@/services/gate-pass-pdf.service";
import { QrCode, Printer, CheckCircle, XCircle, Search, Shield } from "lucide-react";

export function GuardPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [releaseData, setReleaseData] = useState({
    kmReadingStart: "",
    kmReadingEnd: "",
    withMeal: false,
    mealAmount: 0,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a QR token or control number");
      return;
    }

    setLoading(true);
    try {
      // Try to find by QR token first, then by control number
      let result;
      try {
        result = await gatePassApi.verifyQRToken(searchQuery.trim());
        // If successful, extract gate pass data
        const gatePassData = result.data?.gatePass || result;
        setGatePass(gatePassData);
        
        // Get workflow status
        const workflow = await gatePassApi.getWorkflowStatus(gatePassData.requestId);
        setWorkflowStatus(workflow);

        if (result.data?.isValid) {
          toast.success("QR Code verified successfully");
        } else {
          toast.success("Gate pass found");
        }
      } catch (qrError: any) {
        // If QR verification fails, try searching by request ID
        try {
          const gatePassData = await gatePassApi.getByRequestId(searchQuery.trim());
          setGatePass(gatePassData);
          
          const workflow = await gatePassApi.getWorkflowStatus(gatePassData.requestId);
          setWorkflowStatus(workflow);

          if (workflow.status === "released") {
            toast.info(`Gate pass was already released`);
          } else if (workflow.status !== "approved") {
            toast.warning(`Gate pass status: ${workflow.status}`);
          } else {
            toast.success("Gate pass found");
          }
        } catch (idError) {
          toast.error(qrError?.message || "Gate pass not found");
          setGatePass(null);
          setWorkflowStatus(null);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search gate pass");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyExit = async () => {
    if (!gatePass || !workflowStatus || !gatePass.qrToken) return;

    setLoading(true);
    try {
      // Use the new QR verification endpoint
      await gatePassApi.confirmQRVerification(gatePass.qrToken, {
        timeOut: new Date().toISOString(),
      });

      toast.success("Exit verified successfully - Gate pass completed");
      
      // Refresh data
      const updated = await gatePassApi.getByRequestId(gatePass.requestId);
      setGatePass(updated);
      const workflow = await gatePassApi.getWorkflowStatus(gatePass.requestId);
      setWorkflowStatus(workflow);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify exit");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!gatePass || !workflowStatus) return;

    // Extract signature information from workflow actions
    const signatures = {
      recommendedBy: workflowStatus.actions.find(a => a.action === 'approve' && 
        (a.metadata?.stepName?.toLowerCase().includes('recommend') || 
         workflowStatus.workflow.steps[0]?.name?.toLowerCase().includes('recommend'))) || 
        workflowStatus.actions[0],
      notedBy: workflowStatus.actions.find(a => a.action === 'approve' && 
        (a.metadata?.stepName?.toLowerCase().includes('noted') ||
         workflowStatus.workflow.steps[1]?.name?.toLowerCase().includes('noted'))) ||
        workflowStatus.actions[1],
      approvedBy: workflowStatus.actions.find(a => a.action === 'approve' && 
        (a.metadata?.stepName?.toLowerCase().includes('approve') ||
         workflowStatus.workflow.steps[2]?.name?.toLowerCase().includes('approve'))) ||
        workflowStatus.actions[workflowStatus.actions.length - 1],
    };

    const pdfData: GatePassPDFData = {
      controlNumber: gatePass.controlNumber,
      requester: {
        name: gatePass.requester.displayName,
        department: gatePass.department?.name || "N/A",
      },
      destination: gatePass.destination || "N/A",
      purpose: gatePass.purpose,
      transportation: gatePass.transportation || "N/A",
      isOfficialBusiness: true,
      isPersonal: false,
      withCar: !!gatePass.vehicle,
      withoutCar: !gatePass.vehicle,
      plateNumber: gatePass.vehicle?.plateNumber,
      driverName: gatePass.driverName || "",
      remarks: "",
      dateFrom: new Date(gatePass.createdAt).toLocaleDateString(),
      dateTo: new Date(gatePass.expectedReturn || gatePass.createdAt).toLocaleDateString(),
      timeFrom: new Date(gatePass.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeTo: new Date(gatePass.expectedReturn || gatePass.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recommendedBy: signatures.recommendedBy ? {
        name: signatures.recommendedBy.actor?.displayName || '',
        signature: signatures.recommendedBy.signaturePath,
        date: new Date(signatures.recommendedBy.createdAt).toLocaleString(),
      } : undefined,
      notedBy: signatures.notedBy ? {
        name: signatures.notedBy.actor?.displayName || '',
        signature: signatures.notedBy.signaturePath,
        date: new Date(signatures.notedBy.createdAt).toLocaleString(),
      } : undefined,
      approvedBy: signatures.approvedBy ? {
        name: signatures.approvedBy.actor?.displayName || '',
        signature: signatures.approvedBy.signaturePath,
        date: new Date(signatures.approvedBy.createdAt).toLocaleString(),
      } : undefined,
      qrCode: gatePass.qrCode,
      status: workflowStatus.status,
    };

    printGatePass(pdfData);
  };

  // Security can verify exit if gate pass has QR code and not yet verified
  const canVerify = gatePass && workflowStatus?.status === "approved" && gatePass.qrCode && !gatePass.isUsed;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Guard Portal</h1>
              <p className="text-sm text-gray-600">Gate Pass Verification & Release</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Control Number or scan QR code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Gate Pass Details */}
        {gatePass && workflowStatus && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`rounded-lg p-4 ${
              workflowStatus.status === 'approved' 
                ? 'bg-green-50 border-2 border-green-500' 
                : workflowStatus.status === 'released'
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-yellow-50 border-2 border-yellow-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {workflowStatus.status === 'approved' || workflowStatus.status === 'released' ? (
                    <CheckCircle className={`w-6 h-6 ${workflowStatus.status === 'released' ? 'text-blue-600' : 'text-green-600'}`} />
                  ) : (
                    <XCircle className="w-6 h-6 text-yellow-600" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">Control Number: {gatePass.controlNumber}</h3>
                    <p className="text-sm">Status: <span className="font-semibold uppercase">{workflowStatus.status}</span></p>
                  </div>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Gate Pass
                </button>
              </div>
            </div>

            {/* Gate Pass Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4 pb-2 border-b">Gate Pass Information</h3>
               
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Requester</label>
                  <p className="text-gray-900">{gatePass.requester.displayName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600">Department</label>
                  <p className="text-gray-900">{gatePass.department?.name || "N/A"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600">Destination</label>
                  <p className="text-gray-900">{gatePass.destination || "N/A"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600">Purpose</label>
                  <p className="text-gray-900">{gatePass.purpose}</p>
                </div>
                
                {gatePass.vehicle && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Vehicle</label>
                      <p className="text-gray-900">
                        {gatePass.vehicle.brand} {gatePass.vehicle.model} ({gatePass.vehicle.plateNumber})
                      </p>
                    </div>
                    
                    {gatePass.driverName && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Driver</label>
                        <p className="text-gray-900">{gatePass.driverName}</p>
                      </div>
                    )}
                  </>
                )}
                
                <div>
                  <label className="text-sm font-semibold text-gray-600">Expected Return</label>
                  <p className="text-gray-900">
                    {gatePass.expectedReturn 
                      ? new Date(gatePass.expectedReturn).toLocaleString() 
                      : "N/A"}
                  </p>
                </div>

                {gatePass.verifiedAt && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Verified At</label>
                    <p className="text-gray-900">
                      {new Date(gatePass.verifiedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {gatePass.qrCode && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">QR Code</label>
                    <div className="mt-1">
                      <img
                        src={`data:image/png;base64,${gatePass.qrCode}`}
                        alt="Gate Pass QR"
                        className="w-20 h-20 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4 pb-2 border-b">Approval Timeline</h3>
              
              <div className="space-y-3">
                {workflowStatus.workflow.steps.map((step, index) => {
                  const action = workflowStatus.actions.find((a: any) => 
                    a.metadata?.stepName === step.name || a.stepId === step.id
                  );
                  
                  return (
                    <div key={step.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        step.status === 'approved' 
                          ? 'bg-green-100 text-green-600' 
                          : step.status === 'current'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.status === 'approved' ? '✓' : step.status === 'current' ? '○' : '○'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{step.name}</p>
                            <p className="text-sm text-gray-600">{step.role?.name || ''}</p>
                          </div>
                          {step.actor && (
                            <div className="text-right">
                              <p className="text-sm font-medium">{step.actor.displayName}</p>
                              {step.actedAt && (
                                <p className="text-xs text-gray-500">
                                  {new Date(step.actedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {step.note && (
                          <p className="text-xs text-gray-500 mt-1 italic">{step.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Post-approval: Ready for Verification */}
                {(workflowStatus.status === 'approved' || workflowStatus.status === 'released') && (
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Ready for Security Verification</p>
                      <p className="text-sm text-gray-600">QR Code Generated</p>
                    </div>
                  </div>
                )}

                {/* Released step */}
                {workflowStatus.status === 'released' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Released</p>
                      <p className="text-sm text-gray-600">Security</p>
                      {gatePass.securityReleasedAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(gatePass.securityReleasedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verify Exit Form - Only for approved gate passes with QR code not yet verified */}
            {canVerify && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 pb-2 border-b">Verify Exit</h3>
                 
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Instructions:</strong> Scan the employee's QR code to verify their exit. 
                      This will mark the gate pass as completed.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        KM Reading (Start)
                      </label>
                      <input
                        type="number"
                        value={releaseData.kmReadingStart}
                        onChange={(e) => setReleaseData({ ...releaseData, kmReadingStart: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter starting KM"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        KM Reading (End)
                      </label>
                      <input
                        type="number"
                        value={releaseData.kmReadingEnd}
                        onChange={(e) => setReleaseData({ ...releaseData, kmReadingEnd: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter ending KM"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="withMeal"
                      checked={releaseData.withMeal}
                      onChange={(e) => setReleaseData({ ...releaseData, withMeal: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="withMeal" className="text-sm font-medium">
                      With OB Meal Allowance
                    </label>
                  </div>

                  {releaseData.withMeal && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Meal Allowance Amount (₱)
                      </label>
                      <input
                        type="number"
                        value={releaseData.mealAmount}
                        onChange={(e) => setReleaseData({ ...releaseData, mealAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleVerifyExit}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Verify Exit & Complete
                  </button>
                </div>
              </div>
            )}

            {/* Already Verified */}
            {gatePass.isUsed && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-bold">Exit Verified - Gate Pass Completed</p>
                    <p className="text-sm">
                      Verified on: {new Date(gatePass.verifiedAt || gatePass.completedAt || '').toLocaleString()}
                    </p>
                    {gatePass.verifiedBy && (
                      <p className="text-sm">
                        Verified by: {gatePass.verifiedBy}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!gatePass && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Instructions</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Enter the gate pass control number in the search box above</li>
              <li>Verify the gate pass details and approval status</li>
              <li>Ensure all required approvals and signatures are present</li>
              <li>Record the odometer readings and meal allowance (if applicable)</li>
              <li>Click "Release Gate Pass" to authorize exit</li>
              <li>Print the gate pass for the employee</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}