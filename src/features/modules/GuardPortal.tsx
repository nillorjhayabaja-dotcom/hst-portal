// Guard Portal - Security personnel interface for gate pass verification
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { gatePassApi, type GatePass, type WorkflowStatus } from "@/services/gate-pass-api";
import { printGatePass, type GatePassPDFData } from "@/services/gate-pass-pdf.service";
import { useAuth } from "@/contexts/AuthContext";
import { QrCode, Printer, CheckCircle, XCircle, Search, Shield, Clock, Archive, Filter, ListFilter, History, RefreshCw } from "lucide-react";

type SecurityTab = "pending" | "released_today" | "completed" | "archived";

export function GuardPortal() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [activeTab, setActiveTab] = useState<SecurityTab>("pending");
  const [releasedList, setReleasedList] = useState<GatePass[]>([]);
  const [gatePassList, setGatePassList] = useState<GatePass[]>([]);
  const [showReleaseDrawer, setShowReleaseDrawer] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [releaseData, setReleaseData] = useState({
    kmReadingStart: "",
    kmReadingEnd: "",
    withMeal: false,
    mealAmount: 0,
    transportationType: "Company Vehicle",
    vehiclePlate: "",
    driverName: "",
    remarks: "",
  });

  // Load gate pass list based on active tab
  const loadGatePassList = useCallback(async () => {
    setLoading(true);
    try {
      const statusMap: Record<SecurityTab, string | undefined> = {
        pending: "approved",
        released_today: "released",
        completed: "completed",
        archived: undefined,
      };
      const status = statusMap[activeTab];
      const result = await gatePassApi.getAll({ status, pageSize: 50 });
      setGatePassList(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Failed to load gate passes:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadGatePassList();
  }, [loadGatePassList]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a QR token or control number");
      return;
    }

    setLoading(true);
    try {
      let result;
      try {
        result = await gatePassApi.verifyQRToken(searchQuery.trim());
        const gatePassData = result.data?.gatePass || result;
        setGatePass(gatePassData);
        
        const workflow = await gatePassApi.getWorkflowStatus(gatePassData.requestId);
        setWorkflowStatus(workflow);

        if (result.data?.isValid) {
          toast.success("QR Code verified successfully");
        } else {
          toast.success("Gate pass found");
        }
      } catch (qrError: any) {
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
      await gatePassApi.confirmQRVerification(gatePass.qrToken, {
        timeOut: new Date().toISOString(),
      });

      toast.success("Exit verified successfully - Gate pass completed");
      
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

  const handleReleaseEmployee = async () => {
    if (!selectedToken) {
      toast.error("No QR token to process");
      return;
    }

    // Validate vehicle fields if transportation type requires vehicle
    if (releaseData.transportationType !== "Commute") {
      if (!releaseData.vehiclePlate.trim()) {
        toast.error("Vehicle plate number is required");
        return;
      }
      if (!releaseData.driverName.trim()) {
        toast.error("Driver name is required");
        return;
      }
    }

    setScanning(true);
    try {
      const result = await gatePassApi.confirmQRVerification(selectedToken, {
        timeOut: new Date().toISOString(),
        kmReadingStart: releaseData.kmReadingStart ? Number(releaseData.kmReadingStart) : undefined,
        kmReadingEnd: releaseData.kmReadingEnd ? Number(releaseData.kmReadingEnd) : undefined,
        withMeal: releaseData.withMeal,
        mealAmount: releaseData.withMeal ? releaseData.mealAmount : undefined,
        remarks: [
          releaseData.remarks || undefined,
          `Transport: ${releaseData.transportationType}`,
          releaseData.vehiclePlate ? `Plate: ${releaseData.vehiclePlate}` : undefined,
          releaseData.driverName ? `Driver: ${releaseData.driverName}` : undefined,
        ].filter(Boolean).join(" | "),
      });

      toast.success("Employee released successfully");
      setShowReleaseDrawer(false);
      setSelectedToken("");
      setGatePass(null);
      setWorkflowStatus(null);
      loadGatePassList();
    } catch (error: any) {
      console.error("Release error:", error);
      toast.error(error?.message || "Failed to release employee");
    } finally {
      setScanning(false);
    }
  };

  const handlePrint = () => {
    if (!gatePass || !workflowStatus) return;

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

    // Build security guard name from user info instead of UUID
    const securityGuardName = user?.name || 'Security Guard';
    const securityGuardPosition = user?.title || 'Security Guard';

    const pdfData: GatePassPDFData = {
      controlNumber: gatePass.controlNumber,
      requester: {
        name: gatePass.requester.displayName,
        department: gatePass.department?.name || "N/A",
        position: gatePass.requester.position?.title,
      },
      destination: gatePass.destination || "N/A",
      purpose: gatePass.purpose,
      transportation:
        gatePass.transportationAssignment?.transportationType ||
        gatePass.transportation ||
        "N/A",
      isOfficialBusiness: true,
      isPersonal: false,
      withCar:
        gatePass.transportationAssignment?.transportationType === "Company Vehicle" ||
        !!gatePass.vehicle,
      withoutCar:
        gatePass.transportationAssignment?.transportationType === "Commute" ||
        !gatePass.vehicle,
      plateNumber:
        gatePass.transportationAssignment?.vehiclePlate ||
        gatePass.vehicle?.plateNumber,
      driverName:
        gatePass.transportationAssignment?.driverName ||
        gatePass.driverName ||
        "",
      remarks: "",
      // Departure from security release timeOut
      departureDate: gatePass.timeOut
        ? new Date(gatePass.timeOut).toLocaleDateString()
        : new Date(gatePass.createdAt).toLocaleDateString(),
      departureTime: gatePass.timeOut
        ? new Date(gatePass.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(gatePass.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      // Arrival auto-generated from timeIn
      arrivalDate: gatePass.timeIn
        ? new Date(gatePass.timeIn).toLocaleDateString()
        : undefined,
      arrivalTime: gatePass.timeIn
        ? new Date(gatePass.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined,
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
      // Security guard display name - NEVER show UUID
      releasedBy: gatePass.releasedBy || securityGuardName,
      releasedByPosition: securityGuardPosition,
      releasedDate: gatePass.releasedDate
        ? new Date(gatePass.releasedDate).toLocaleDateString()
        : (gatePass.releasedAt ? new Date(gatePass.releasedAt).toLocaleDateString() : undefined),
      releasedTime: gatePass.releasedTime
        ? new Date(gatePass.releasedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : (gatePass.releasedAt ? new Date(gatePass.releasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined),
      releasedBySignature: gatePass.releasedBySignature,
      verifiedBy: gatePass.verifiedBy || securityGuardName,
      verifiedByPosition: securityGuardPosition,
      verifiedBySignature: gatePass.verifiedBySignature,
      completedBy: gatePass.returnedBy || securityGuardName,
      completedByPosition: securityGuardPosition,
      completedBySignature: gatePass.completedBySignature,
      vehiclePlate: gatePass.vehiclePlate || gatePass.plateNumber,
      driverNameSecurity: gatePass.driverNameSecurity || gatePass.driverName,
      transportationTypeSecurity: gatePass.transportationTypeSecurity || gatePass.transportation,
      kmReadingStart: gatePass.kmReadingStart,
      kmReadingEnd: gatePass.kmReadingEnd,
      timeOut: gatePass.timeOut ? new Date(gatePass.timeOut).toLocaleString() : undefined,
      timeIn: gatePass.timeIn ? new Date(gatePass.timeIn).toLocaleString() : undefined,
      securityRemarks: gatePass.securityRemarks,
      returnRemarks: gatePass.returnRemarks,
    };

    printGatePass(pdfData);
  };

  const canVerify = gatePass && workflowStatus?.status === "approved" && gatePass.qrCode && !gatePass.isUsed;

  const tabConfig: Array<{ id: SecurityTab; label: string; icon: React.ReactNode }> = [
    { id: "pending", label: "Pending Verification", icon: <Clock className="w-4 h-4" /> },
    { id: "released_today", label: "Released Today", icon: <CheckCircle className="w-4 h-4" /> },
    { id: "completed", label: "Completed", icon: <History className="w-4 h-4" /> },
    { id: "archived", label: "Archived", icon: <Archive className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Guard Portal</h1>
              <p className="text-sm text-gray-600">Gate Pass Verification & Release</p>
            </div>
            <button
              onClick={loadGatePassList}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
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

        {/* Security History Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "pending" && gatePassList.filter(g => g.status === "approved" && !g.isUsed).length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {gatePassList.filter(g => g.status === "approved" && !g.isUsed).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content - Gate Pass List */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p>Loading gate passes...</p>
              </div>
            ) : gatePassList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ListFilter className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No gate passes found</p>
                <p className="text-sm">No records match the current filter</p>
              </div>
            ) : (
                <div className="space-y-2">
                {gatePassList.map((gp) => (
                  <div
                    key={gp.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setGatePass(gp);
                      gatePassApi.getWorkflowStatus(gp.requestId).then(setWorkflowStatus).catch(() => null);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{gp.controlNumber}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          gp.releaseStatus === "completed" || gp.isUsed
                            ? "bg-green-100 text-green-800"
                            : gp.releaseStatus === "released"
                            ? "bg-blue-100 text-blue-800"
                            : gp.releaseStatus === "returned"
                              ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {gp.releaseStatus || (gp.isUsed ? "Completed" : gp.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {gp.requester?.displayName} - {gp.destination || "N/A"}
                      </p>
                      {/* Security Release Details */}
                      {(gp.releaseStatus === "released" || gp.releaseStatus === "returned" || gp.releaseStatus === "completed") && (
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                          {gp.releasedBy && (
                            <span className="truncate max-w-[200px]">Released By: {gp.releasedBy}</span>
                          )}
                          {gp.releasedAt && (
                            <span>Released: {new Date(gp.releasedAt).toLocaleDateString()} {new Date(gp.releasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {gp.releaseStatus && (
                            <span className="font-semibold uppercase">Workflow: {gp.releaseStatus}</span>
                          )}
                        </div>
                      )}
                      {(gp.kmReadingStart !== undefined && gp.kmReadingStart !== null) && (
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                          {gp.kmReadingStart !== undefined && gp.kmReadingStart !== null && (
                            <span>KM Out: {gp.kmReadingStart}</span>
                          )}
                          {gp.vehiclePlate && (
                            <span>Plate: {gp.vehiclePlate}</span>
                          )}
                          {gp.driverNameSecurity && (
                            <span>Driver: {gp.driverNameSecurity}</span>
                          )}
                          {gp.kmReadingEnd !== undefined && gp.kmReadingEnd !== null && (
                            <span>KM In: {gp.kmReadingEnd}</span>
                          )}
                          {gp.timeOut && (
                            <span>Time Out: {new Date(gp.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {gp.timeIn && (
                            <span>Time In: {new Date(gp.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 text-right ml-4">
                      {new Date(gp.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <div className="flex gap-2">
                  {canVerify && (
                    <button
                      onClick={() => {
                        setSelectedToken(gatePass.qrToken || "");
                        setShowReleaseDrawer(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      Release Employee
                    </button>
                  )}
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print Gate Pass
                  </button>
                </div>
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
                
                {(gatePass.transportationAssignment || gatePass.vehicle) && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Transportation</label>
                      <p className="text-gray-900">
                        {gatePass.transportationAssignment?.transportationType ||
                          gatePass.transportation ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Vehicle</label>
                      <p className="text-gray-900">
                        {gatePass.transportationAssignment?.vehiclePlate ||
                          (gatePass.vehicle
                            ? `${gatePass.vehicle.brand} ${gatePass.vehicle.model} (${gatePass.vehicle.plateNumber})`
                            : "N/A")}
                      </p>
                    </div>

                    {(gatePass.transportationAssignment?.driverName ||
                      gatePass.driverName) && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Assigned Driver</label>
                        <p className="text-gray-900">
                          {gatePass.transportationAssignment?.driverName ||
                            gatePass.driverName}
                        </p>
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
                
                {/* QR Generated */}
                {(workflowStatus.status === 'approved' ||
                  workflowStatus.status === 'released' ||
                  workflowStatus.status === 'completed') && (
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-700">QR Generated</p>
                      <p className="text-sm text-gray-600">Ready for Security Verification</p>
                    </div>
                  </div>
                )}

                {/* Security Verification */}
                {(workflowStatus.status === 'released' ||
                  workflowStatus.status === 'completed') && (
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-700">Security Verification</p>
                      <p className="text-sm text-gray-600">QR successfully scanned by Security</p>
                    </div>
                  </div>
                )}

                {/* Released step */}
                {(workflowStatus.status === 'released' ||
                  workflowStatus.status === 'completed') && (
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-700">Released</p>
                      <p className="text-sm text-gray-600">Employee released by Security</p>
                      {gatePass.securityReleasedAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(gatePass.securityReleasedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Completed */}
                {(workflowStatus.status === 'completed' || gatePass.isUsed) && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-700">Workflow Completed</p>
                      <p className="text-sm text-gray-600">Gate pass workflow completed successfully</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verify Exit Form - Only for approved gate passes with QR code */}
            {canVerify && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 pb-2 border-b">Verify Exit & Release Employee</h3>
                 
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Instructions:</strong> This is the final step before releasing the employee.
                      Review the transportation assignment and add release details below.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Transportation Type
                      </label>
                      <select
                        value={releaseData.transportationType}
                        onChange={(e) => setReleaseData({ ...releaseData, transportationType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Company Vehicle">Company Vehicle</option>
                        <option value="Personal Vehicle">Personal Vehicle</option>
                        <option value="Commute">Commute</option>
                      </select>
                    </div>

                    {(releaseData.transportationType !== "Commute") && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Vehicle Plate Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={releaseData.vehiclePlate}
                            onChange={(e) => setReleaseData({ ...releaseData, vehiclePlate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. ABC-1234"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Driver Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={releaseData.driverName}
                            onChange={(e) => setReleaseData({ ...releaseData, driverName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter driver's full name"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Security Remarks (Optional)
                    </label>
                    <textarea
                      value={releaseData.remarks}
                      onChange={(e) => setReleaseData({ ...releaseData, remarks: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    onClick={() => {
                      setSelectedToken(gatePass.qrToken || "");
                      handleReleaseEmployee();
                    }}
                    disabled={scanning}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-bold"
                  >
                    <CheckCircle className="w-6 h-6" />
                    {scanning ? "Releasing..." : "Release Employee"}
                  </button>
                </div>
              </div>
            )}

            {/* Already Released banner */}
            {(gatePass.isUsed || workflowStatus.status === "released") && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800 text-lg">Already Released</p>
                    <p className="text-sm text-green-700">
                      This Gate Pass has already been released by Security.
                    </p>
                    {gatePass.securityReleasedAt && (
                      <>
                        <p className="text-sm text-green-700 mt-1">
                          Release Time: {new Date(gatePass.securityReleasedAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-green-700">
                          Control Number: {gatePass.controlNumber}
                        </p>
                      </>
                    )}
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions - Empty State */}
        {!gatePass && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Security Guard Portal</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Search gate passes by control number or scan the QR code</li>
              <li>Verify the gate pass details and approval status</li>
              <li>Review transportation assignment from Noted By</li>
              <li>Record odometer readings and meal allowance (if applicable)</li>
              <li>Click "Release Employee" to authorize exit</li>
              <li>Completed gate passes remain in the security history for auditing</li>
            </ul>
          </div>
        )}

        {/* Log Count Summary */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Showing {gatePassList.length} gate pass{gatePassList.length !== 1 ? 'es' : ''} in {activeTab.replace('_', ' ')} view
        </div>
      </div>
    </div>
  );
}