import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  Coffee,
  Flashlight,
  Gauge,
  LoaderCircle,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Timer,
  UserCircle2,
  Wifi,
  WifiOff,
  X,
  BadgeCheck,
  Hash,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { gatePassApi } from "@/services/gate-pass-api";
import ScannerViewport, {
  type ScannerAPI,
} from "@/components/scanner/ScannerViewport";

interface SecurityQRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess?: () => void;
}

interface ScanResult {
  controlNumber: string;
  status: string;
  releasedAt?: string;
  releasedBy?: string;
  employeeName?: string;
  employeeNumber?: string;
  department?: string;
  position?: string;
  destination?: string;
  purpose?: string;
  expectedReturn?: string;
  workflowStatus?: string;
  requestStatus?: string;
  message?: string;
  verificationCode?: string;
  // Return process fields
  timeOut?: string;
  timeIn?: string;
  tripDuration?: number;
  isOutsideCalabarzon?: boolean;
  obMealEligible?: boolean;
}

type ScannerState =
  | "scanner"
  | "loading"
  | "verified"   // QR verified, showing form
  | "released"
  | "return_mode"
  | "return_completed"
  | "error"
  | "offline"
  | "permission"
  | "qr_expired"       // QR CODE EXPIRED
  | "qr_already_used"  // QR CODE ALREADY USED / COMPLETED
  | "already_released"; // Already released by security

const STATUS_COPY: Record<ScannerState, string> = {
  scanner: "Ready to Scan",
  loading: "Verifying...",
  verified: "QR Verified — Fill Release Form",
  released: "Released Successfully",
  return_mode: "Return Mode",
  return_completed: "Return Completed",
  error: "Invalid QR",
  offline: "Offline",
  permission: "Camera Required",
  qr_expired: "QR CODE EXPIRED",
  qr_already_used: "QR CODE ALREADY USED",
  already_released: "Already Released",
};

export function SecurityQRScannerModal({
  open,
  onClose,
  onScanSuccess,
}: SecurityQRScannerModalProps) {
  const scannerApiRef = useRef<ScannerAPI | null>(null);
  const scanLockRef = useRef(false);
  const scanRawDataRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const countdownRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const releasingRef = useRef(false);

  const [scannerState, setScannerState] = useState<ScannerState>("scanner");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLabel, setCameraLabel] = useState("Initializing Camera");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Security Release Form state
  const [kmReadingStart, setKmReadingStart] = useState<string>('');
  const [releasePlateNumber, setReleasePlateNumber] = useState<string>('');
  const [releaseDriverName, setReleaseDriverName] = useState<string>('');
  const [securityRemarks, setSecurityRemarks] = useState<string>('');
  const [isReleasing, setIsReleasing] = useState(false);

  // Return Process Form state
  const [kmReadingEnd, setKmReadingEnd] = useState<string>('');
  const [returnRemarks, setReturnRemarks] = useState<string>('');
  const [obMealEnabled, setObMealEnabled] = useState(false);
  const [obMealAmount, setObMealAmount] = useState<string>('500');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [tripDuration, setTripDuration] = useState<number>(0);
  const [isOutsideCalabarzonDest, setIsOutsideCalabarzonDest] = useState(false);

  const isDesktop =
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false;

  // Direct DOM clock update - NEVER triggers React re-render
  const clockDisplayRef = useRef<HTMLDivElement>(null);
  const clockDateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date();
      if (clockDateRef.current) {
        clockDateRef.current.textContent = now.toLocaleDateString();
      }
      if (clockDisplayRef.current) {
        clockDisplayRef.current.textContent = now.toLocaleTimeString();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const vibrateSuccess = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([120, 80, 120]);
    }
  }, []);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      if (!decodedText || scanLockRef.current) return;

      if (!navigator.onLine) {
        setScannerState("offline");
        setCameraError("Internet connection unavailable. Reconnect and retry verification.");
        return;
      }

      scanLockRef.current = true;

      try {
        setScannerState("loading");
        await scannerApiRef.current?.pause();

        const startedAt = performance.now();

        // Step 1: Verify QR token (does NOT release the gate pass)
        const result = await gatePassApi.verifyQRToken(decodedText);

        const duration = ((performance.now() - startedAt) / 1000).toFixed(2);

        // fetchApi does: return data.data || data
        const apiData = result?.data || result;
        
        // Handle non-success responses (including completed/invalid QR)
        if (result?.error || apiData?.code === "INVALID_TOKEN" || apiData?.code === "NOT_FOUND") {
          setCameraError(apiData?.error?.message || result?.error?.message || "Invalid QR Code");
          setScanResult({
            controlNumber: "Unknown",
            status: "error",
            message: apiData?.error?.message || result?.error?.message || "Invalid QR Code",
            verificationCode: apiData?.code || result?.error?.code,
          });
          setScannerState("error");
          toast.error(apiData?.error?.message || result?.error?.message || "Invalid QR Code");
          scanLockRef.current = false;
          await scannerApiRef.current?.restart();
          return;
        }

        // CRITICAL: QR permanently invalid (completed) - immediate rejection, NO database updates
        if (apiData?.code === "ALREADY_COMPLETED") {
          setCameraError("This Gate Pass has already been completed.");
          setScanResult({
            controlNumber: apiData?.request?.controlNumber || "—",
            status: "completed",
            message: "QR CODE ALREADY USED - This Gate Pass has already been completed.",
            verificationCode: "ALREADY_COMPLETED",
          });
          setScannerState("error");
          toast.error("This Gate Pass has already been completed and QR is permanently invalid.");
          scanLockRef.current = false;
          await scannerApiRef.current?.restart();
          return;
        }

        const gatePassData = apiData?.gatePass;
        const requestData = apiData?.request;
        const verificationData = apiData?.verification;
        const apiMessage = apiData?.message;

        const verificationStatus = verificationData?.status;
        const alreadyReleased =
          verificationStatus === "released" ||
          verificationData?.releaseStatus === "released" ||
          gatePassData?.releaseStatus === "released" ||
          apiData?.code === "ALREADY_RELEASED";

        vibrateSuccess();

        // Store raw API response
        scanRawDataRef.current = apiData;

        // Extract employee info
        const requester = requestData?.requester;
        // employees is a one-to-one relation (single object), not an array
        const employee = requester?.employees;
        let employeeName = requester?.displayName;
        if (!employeeName && employee) {
          employeeName = [employee.firstName, employee.lastName].filter(Boolean).join(" ") || undefined;
        }

        // Employee Number from the employee record
        const employeeNumber = employee?.employeeNumber || requester?.employeeNumber || "";

        // Position
        const position = employee?.position?.title || requester?.position?.title;

        // Department
        let departmentName = requestData?.department?.name;
        if (!departmentName && employee) {
          departmentName = employee?.department?.name;
        }

        // Gate pass fields
        const destination = gatePassData?.destination || "";
        const purpose = gatePassData?.purpose || "N/A";
        // Expected Return is stored in backend/database only, NOT shown in UI
        const controlNumber = requestData?.controlNumber ?? "—";

        // Workflow status
        const workflowStatus = gatePassData?.releaseStatus || verificationData?.releaseStatus || "pending";
        const requestStatus = requestData?.status || "unknown";

        // Time Out comes from the original request departure time, NOT from security
        // The GatePass has `expectedReturn` for the return time
        // Departure time was set by the requestor during Gate Pass creation

        // Pre-fill plate number and driver from the transportation assignment
        const transportationAssignment = gatePassData?.transportationAssignment;
        const assignedPlate = transportationAssignment?.vehiclePlate ||
                              transportationAssignment?.vehicle?.plateNumber ||
                              gatePassData?.vehiclePlate || "";
        const assignedDriver = transportationAssignment?.driverName ||
                               gatePassData?.driverName || "";

        setScanResult({
          controlNumber,
          status: verificationStatus,
          employeeName: employeeName || "No Employee Information",
          employeeNumber,
          department: departmentName || "No Department Information",
          position: position,
          destination: destination || "N/A",
          purpose,
          workflowStatus,
          requestStatus,
          message:
            apiMessage ||
            (alreadyReleased
              ? "This Gate Pass has already been released. Scan again to process return."
              : "QR code validated successfully. Please complete the Security Release Form."),
          verificationCode: apiData?.code,
          timeOut: gatePassData?.timeOut,
        });

        // Pre-fill release form with assigned values
        setReleasePlateNumber(assignedPlate);
        setReleaseDriverName(assignedDriver);

        if (alreadyReleased) {
          // Switch to RETURN MODE
          const destOutsideCalabarzon = isOutsideCalabarzon(destination);
          const timeOutStr = gatePassData?.timeOut || verificationData?.releasedAt;
          const tripDur = timeOutStr ? calculateTripDuration(timeOutStr) : 0;
          setScannerState("return_mode");
          setTripDuration(tripDur);
          setIsOutsideCalabarzonDest(destOutsideCalabarzon);
          setObMealEnabled(destOutsideCalabarzon && tripDur >= 4);
          toast.success("Return mode activated. Complete the return form.");
          return;
        } else {
          // QR validated successfully - show the Security Release FORM
          // State is "verified" NOT "success" - we do NOT show "Released Successfully" yet
          setScannerState("verified");
          toast.success(`QR Verified in ${duration}s. Complete the release form.`);
        }
      } catch (error: any) {
        console.error("Verification failed", error);
        const message = error?.message || "Unable to verify Gate Pass. Please scan again.";
        setCameraError(message);
        setScanResult({
          controlNumber: "Unknown",
          status: "error",
          message,
          verificationCode: error?.code,
        });
        setScannerState("error");
        toast.error(message);
        return;
      }
    },
    [onScanSuccess, vibrateSuccess],
  );

  const handleScanError = useCallback((error: string) => {
    if (!navigator.onLine) {
      setScannerState("offline");
      setCameraError("No internet connection available.");
      return;
    }

    if (error === "HTTPS_REQUIRED") {
      setScannerState("permission");
      setCameraError("Camera requires HTTPS secure context.");
      return;
    }

    if (
      error.includes("cameraIdOrConfig is required") ||
      error.includes("NotAllowedError") ||
      error.includes("Permission denied")
    ) {
      setScannerState("permission");
      setCameraError(
        error.includes("cameraIdOrConfig is required")
          ? "Camera access unavailable. Please ensure a camera is connected and browser permissions are granted."
          : "Allow camera permission to scan Gate Passes.",
      );
      return;
    }

    if (error.includes("NotFoundError") || error.includes("no camera")) {
      setScannerState("permission");
      setCameraError("No camera device found. Connect a camera and try again.");
      return;
    }

    setScannerState("error");
    setCameraError(error || "Unable to access camera. Please try again.");
  }, []);

  const handleRestart = useCallback(async () => {
    console.info("[QR]", "Manual restart requested");
    setScanResult(null);
    setCameraError(null);
    setScannerState("scanner");
    setKmReadingStart('');
    setReleasePlateNumber('');
    setReleaseDriverName('');
    setSecurityRemarks('');
    setKmReadingEnd('');
    setReturnRemarks('');
    setObMealEnabled(false);
    setObMealAmount('500');
    setTripDuration(0);
    setIsOutsideCalabarzonDest(false);
    scanLockRef.current = false;
    releasingRef.current = false;
    await scannerApiRef.current?.restart();
  }, []);

  const handleToggleFlash = useCallback(async () => {
    const result = await scannerApiRef.current?.toggleFlash();
    if (result !== undefined) {
      setFlashEnabled(result);
    }
  }, []);

  const handleSwitchCamera = useCallback(async () => {
    const label = await scannerApiRef.current?.switchCamera();
    if (label) {
      setCameraLabel(label);
    }
  }, []);

  const handleReleaseEmployee = useCallback(async () => {
    if (!scanResult || !kmReadingStart) {
      toast.error('Please fill in KM Reading (Start)');
      return;
    }

    // Validate KM is numeric and greater than zero
    const kmValue = parseFloat(kmReadingStart);
    if (isNaN(kmValue) || kmValue <= 0) {
      toast.error('KM Reading must be a number greater than zero');
      return;
    }

    // Double-click guard
    if (releasingRef.current) return;
    releasingRef.current = true;

    setIsReleasing(true);
    try {
      const token = scanRawDataRef.current?.verification?.verificationToken;
      if (!token) {
        throw new Error('Verification token not found');
      }

      // Time Out is auto-generated by the server when Release is clicked
      // We do NOT send a timeOut from the client
      // The backend controller generates releasedAt = new Date() server-side
      const result = await gatePassApi.confirmQRVerification(token, {
        kmReadingStart: kmValue,
        plateNumber: releasePlateNumber || undefined,
        driverName: releaseDriverName || undefined,
        remarks: securityRemarks,
      });

      if (result.success) {
        toast.success('Employee released successfully!');

        // NOW show Released Successfully - only after the database transaction completes
        setScanResult({
          ...scanResult,
          status: 'released',
          workflowStatus: 'released',
          message: 'Employee released successfully. Gate Pass is now in Released state.',
          releasedAt: new Date().toLocaleString(),
          releasedBy: result?.data?.verification?.releasedBy || 'Security Officer',
        });
        setScannerState('released');

        // Notify parent components to refresh
        onScanSuccess?.();
      } else {
        throw new Error(result.message || 'Release failed');
      }
    } catch (error: any) {
      console.error('Release failed:', error);
      toast.error(error?.message || 'Failed to release employee. Please try again.');
    } finally {
      setIsReleasing(false);
      releasingRef.current = false;
    }
  }, [scanResult, kmReadingStart, releasePlateNumber, releaseDriverName, securityRemarks, onScanSuccess]);

  const handleProcessReturn = useCallback(async () => {
    if (!scanResult || !kmReadingEnd) {
      toast.error('Please fill in KM Reading (End)');
      return;
    }

    setIsProcessingReturn(true);
    try {
      const token = scanRawDataRef.current?.verification?.verificationToken;
      if (!token) {
        throw new Error('Verification token not found');
      }

      const result = await gatePassApi.processReturn(token, {
        kmReadingEnd: parseFloat(kmReadingEnd),
        returnRemarks: returnRemarks,
        obMealEnabled: obMealEnabled,
        obMealAmount: obMealEnabled ? parseFloat(obMealAmount) : undefined,
      });

      if (result.success) {
        toast.success('Return processed successfully!');
        setScanResult({
          ...scanResult,
          status: 'returned',
          message: `Return completed. Trip duration: ${tripDuration.toFixed(2)} hours.${obMealEnabled ? ` OB Meal: ₱${obMealAmount}` : ''}`,
        });
        setScannerState('return_completed');
        onScanSuccess?.();
      } else {
        throw new Error(result.message || 'Return processing failed');
      }
    } catch (error: any) {
      console.error('Return processing failed:', error);
      toast.error(error?.message || 'Failed to process return. Please try again.');
    } finally {
      setIsProcessingReturn(false);
    }
  }, [scanResult, kmReadingEnd, returnRemarks, obMealEnabled, obMealAmount, tripDuration, onScanSuccess]);

  // Auto-restart countdown after release/return completed
  useEffect(() => {
    if (scannerState !== "released" && scannerState !== "return_completed") return;

    setCountdown(3);
    countdownRef.current = 3;

    const interval = window.setInterval(() => {
      countdownRef.current = (countdownRef.current ?? 3) - 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 1) {
        clearInterval(interval);
        handleRestart();
      }
    }, 1000);

    countdownIntervalRef.current = interval;

    return () => clearInterval(interval);
  }, [scannerState, handleRestart]);

  // Update trip duration in real-time for return mode
  useEffect(() => {
    if (scannerState !== "return_mode" || !scanResult?.timeOut) return;

    const interval = window.setInterval(() => {
      const dur = calculateTripDuration(scanResult.timeOut!);
      setTripDuration(dur);
      if (isOutsideCalabarzonDest && dur >= 4) {
        setObMealEnabled(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [scannerState, scanResult?.timeOut, isOutsideCalabarzonDest]);

  // Keyboard shortcuts
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!open) return;

      if (event.key.toLowerCase() === "f") {
        handleToggleFlash();
      }
      if (event.key.toLowerCase() === "r") {
        handleRestart();
      }
      if (event.key.toLowerCase() === "c") {
        handleSwitchCamera();
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [open, onClose, handleRestart, handleSwitchCamera, handleToggleFlash]);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update camera label from scanner API
  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => {
      const info = scannerApiRef.current?.getCameraInfo();
      if (info) {
        setCameraLabel(info.label);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) {
    return null;
  }

  // Compute workflow status label
  const getWorkflowStatusLabel = (status?: string): string => {
    switch (status) {
      case 'pending': return 'Pending Release';
      case 'released': return 'Released';
      case 'returned': return 'Employee Returned';
      case 'completed': return 'Completed';
      default: return status || 'Pending Release';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-[#020202] text-white">
      <style>{`
        .scanner-line {
          animation: scannerLine 2.5s linear infinite;
        }
        .scanner-corner {
          animation: scannerPulse 1.6s ease-in-out infinite;
        }
        @keyframes scannerLine {
          0% { transform: translateY(-180px); }
          100% { transform: translateY(180px); }
        }
        @keyframes scannerPulse {
          0%,100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.15),transparent_45%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-2xl lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-amber-400" />
                <div>
                  <h1 className="text-2xl font-bold">Security QR Scanner</h1>
                  <p className="text-sm text-zinc-400">Security Gate Pass Verification</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs lg:flex lg:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-zinc-500">Current Date</div>
                <div ref={clockDateRef} className="mt-1 font-semibold">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-zinc-500">Current Time</div>
                <div ref={clockDisplayRef} className="mt-1 font-semibold">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <div className="text-zinc-400">Live Status</div>
                <div className="mt-1 flex items-center gap-2 font-semibold text-emerald-300">
                  <Wifi className="h-4 w-4" /> Connected
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-zinc-500">Connected Camera</div>
                <div className="mt-1 truncate font-semibold">{cameraLabel}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex flex-[0_0_60%] flex-col p-4 lg:p-6">
            <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
              <ScannerViewport
                ref={scannerApiRef}
                isOpen={open}
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                preferredCameraId={null}
              />

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
                <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.58)] lg:h-[380px] lg:w-[380px]">
                  <div className="scanner-corner absolute left-0 top-0 h-20 w-20 rounded-tl-[2rem] border-l-4 border-t-4 border-amber-400" />
                  <div className="scanner-corner absolute right-0 top-0 h-20 w-20 rounded-tr-[2rem] border-r-4 border-t-4 border-amber-400" />
                  <div className="scanner-corner absolute bottom-0 left-0 h-20 w-20 rounded-bl-[2rem] border-b-4 border-l-4 border-amber-400" />
                  <div className="scanner-corner absolute bottom-0 right-0 h-20 w-20 rounded-br-[2rem] border-b-4 border-r-4 border-amber-400" />
                  <div className="absolute left-8 right-8 top-1/2 h-[2px] overflow-hidden rounded-full bg-amber-400/20">
                    <div className="scanner-line h-full w-full bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.95)]" />
                  </div>
                </div>
              </div>

              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-xl">
                <MonitorSmartphone className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium">
                  {isDesktop ? "Desktop Security Checkpoint" : "Mobile Security Scan"}
                </span>
              </div>

              <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/70 px-6 py-3 backdrop-blur-xl">
                <ScanLine className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-semibold">{STATUS_COPY[scannerState]}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button type="button" onClick={handleToggleFlash} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold transition hover:border-amber-400/50 hover:bg-amber-400/10">
                <Flashlight className="h-5 w-5 text-amber-400" /> 🔦 Flash
              </button>
              <button type="button" onClick={handleSwitchCamera} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold transition hover:border-cyan-400/50 hover:bg-cyan-400/10">
                <Camera className="h-5 w-5 text-cyan-300" /> 📷 Camera
              </button>
              <button type="button" onClick={handleRestart} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold transition hover:border-emerald-400/50 hover:bg-emerald-400/10">
                <RefreshCw className="h-5 w-5 text-emerald-300" /> 🔄 Restart
              </button>
              <button type="button" onClick={onClose} className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold transition hover:bg-red-500/20">
                <CameraOff className="h-5 w-5 text-red-300" /> ❌ Close
              </button>
            </div>
          </div>

          <div className="flex flex-[0_0_40%] flex-col border-t border-white/10 bg-white/[0.03] backdrop-blur-2xl lg:border-l lg:border-t-0 verification-panel-container">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-xl px-4 pt-4 pb-2 lg:px-6 lg:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Verification Panel</div>
                  <h2 className="mt-1 text-xl font-bold text-white lg:text-2xl">
                    {scannerState === "return_mode" ? "Employee Return" : "Security Release"}
                  </h2>
                </div>
                <div className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                  scannerState === "verified" || scannerState === "released" || scannerState === "return_completed"
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                    : scannerState === "return_mode"
                      ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                      : scannerState === "loading"
                        ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                        : scannerState === "error"
                          ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                          : "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                }`}>
                  {STATUS_COPY[scannerState]}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-36 lg:px-6 verification-panel-scroll">
              {!scanResult && scannerState === "scanner" ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-16 text-center">
                  <QrPlaceholder />
                  <h3 className="mt-5 text-lg font-semibold text-white">Waiting for QR Code...</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
                    Position the employee's Gate Pass QR code inside the scanning frame to begin verification.
                  </p>
                </div>
              ) : scanResult ? (
                <div className="mt-4 space-y-5">
                  {/* ============================================ */}
                  {/* SECTION 1: REQUEST INFORMATION               */}
                  {/* ============================================ */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <BadgeCheck className="h-5 w-5 text-amber-400" />
                      <span className="text-base font-bold text-white uppercase tracking-wider">REQUEST INFORMATION</span>
                    </div>
                    <div className="space-y-3">
                      {/* Employee Name */}
                      <div>
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                          <UserCircle2 className="h-3 w-3" /> Employee
                        </div>
                        <div className="mt-0.5 text-xl font-bold text-white">
                          {scanResult.employeeName}
                        </div>
                      </div>
                      {/* Employee Number & Department */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Employee ID
                          </div>
                          <div className="mt-0.5 text-base font-semibold text-white font-mono">
                            {scanResult.employeeNumber || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> Department
                          </div>
                          <div className="mt-0.5 text-base font-semibold text-white">
                            {scanResult.department}
                          </div>
                        </div>
                      </div>
                      {/* Purpose & Destination */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Purpose</div>
                          <div className="mt-0.5 text-base font-semibold text-white">{scanResult.purpose}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Destination</div>
                          <div className="mt-0.5 text-base font-semibold text-white">{scanResult.destination}</div>
                        </div>
                      </div>
                      {/* Control Number */}
                      <div>
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Control Number</div>
                        <div className="mt-0.5 text-base font-semibold font-mono tracking-wider text-amber-300">
                          {scanResult.controlNumber}
                        </div>
                      </div>
                      {/* Workflow Status */}
                      <div>
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Workflow Status</div>
                        <div className="mt-0.5">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                            scanResult.workflowStatus === "released"
                              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                              : scanResult.workflowStatus === "returned"
                                ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                                : scanResult.workflowStatus === "completed"
                                  ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                                  : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                          }`}>
                            {getWorkflowStatusLabel(scanResult.workflowStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============================================ */}
                  {/* SECTION 2: SECURITY RELEASE FORM             */}
                  {/* ============================================ */}
                  {scannerState === "verified" && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <ScanLine className="h-5 w-5 text-amber-400" />
                        <span className="text-base font-bold text-white uppercase tracking-wider">SECURITY RELEASE</span>
                      </div>
                      <div className="space-y-4">
                        {/* Plate Number - editable */}
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Plate Number
                          </label>
                          <input
                            type="text"
                            value={releasePlateNumber}
                            onChange={(e) => setReleasePlateNumber(e.target.value)}
                            placeholder="Enter actual plate number"
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-lg font-semibold text-white placeholder-zinc-600 backdrop-blur-xl transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                          />
                        </div>
                        {/* Driver Name - editable */}
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Driver Name
                          </label>
                          <input
                            type="text"
                            value={releaseDriverName}
                            onChange={(e) => setReleaseDriverName(e.target.value)}
                            placeholder="Enter actual driver name"
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-lg font-semibold text-white placeholder-zinc-600 backdrop-blur-xl transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                          />
                        </div>
                        {/* KM Reading Start */}
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            KM Reading (Start)
                          </label>
                          <input
                            type="number"
                            value={kmReadingStart}
                            onChange={(e) => setKmReadingStart(e.target.value)}
                            placeholder="Enter start KM"
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-lg font-semibold text-white placeholder-zinc-600 backdrop-blur-xl transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                          />
                        </div>
                        {/* Time Out - auto generated, read-only */}
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Time Out (Auto Generated upon Release)
                          </label>
                          <div className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-lg font-semibold text-zinc-400">
                            {new Date().toLocaleString()}
                          </div>
                        </div>
                        {/* Security Remarks */}
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Security Remarks
                          </label>
                          <textarea
                            rows={2}
                            value={securityRemarks}
                            onChange={(e) => setSecurityRemarks(e.target.value)}
                            placeholder="Any observations..."
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-base text-white placeholder-zinc-600 backdrop-blur-xl transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* SECTION 3: RETURN MODE - TRIP SUMMARY        */}
                  {/* ============================================ */}
                  {scannerState === "return_mode" && (
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                        <span className="text-base font-bold text-white uppercase tracking-wider">TRIP SUMMARY</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Departure Time</span>
                          <span className="text-base font-semibold text-white">
                            {scanResult.timeOut ? new Date(scanResult.timeOut).toLocaleString() : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Arrival Time (Auto-generated)</span>
                          <span className="text-base font-semibold text-emerald-400">{new Date().toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                            <Timer className="h-4 w-4 inline mr-1" /> Trip Duration
                          </span>
                          <span className={`text-lg font-bold ${tripDuration >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {formatTripDuration(tripDuration)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                            <MapPin className="h-4 w-4 inline mr-1" /> Destination Zone
                          </span>
                          <span className={`text-base font-semibold ${isOutsideCalabarzonDest ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {isOutsideCalabarzonDest ? 'Outside CALABARZON' : 'Within CALABARZON'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                            <Coffee className="h-4 w-4 inline mr-1" /> OB Meal Eligibility
                          </span>
                          <span className={`text-base font-bold ${obMealEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {obMealEnabled ? '✅ Eligible' : 'Not Eligible'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* SECTION 4: RETURN FORM                      */}
                  {/* ============================================ */}
                  {scannerState === "return_mode" && (
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                        <span className="text-base font-bold text-white uppercase tracking-wider">RETURN FORM</span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">KM Reading (End)</label>
                          <input type="number" value={kmReadingEnd} onChange={(e) => setKmReadingEnd(e.target.value)}
                            placeholder="Enter end KM"
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-lg font-semibold text-white placeholder-zinc-600 backdrop-blur-xl transition focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">Return Remarks</label>
                          <textarea rows={2} value={returnRemarks} onChange={(e) => setReturnRemarks(e.target.value)}
                            placeholder="Any observations on return..."
                            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-base text-white placeholder-zinc-600 backdrop-blur-xl transition focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 resize-none" />
                        </div>
                        {obMealEnabled && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Coffee className="h-5 w-5 text-emerald-400" />
                              <span className="text-sm font-bold text-white uppercase tracking-wider">OB MEAL ALLOWANCE</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-zinc-300">Enable OB Meal</span>
                              <button type="button" onClick={() => setObMealEnabled(!obMealEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${obMealEnabled ? 'bg-emerald-500' : 'bg-zinc-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${obMealEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-zinc-400 uppercase tracking-wider">Amount (₱)</label>
                              <input type="number" value={obMealAmount} onChange={(e) => setObMealAmount(e.target.value)} placeholder="500"
                                className="w-full rounded-xl border border-emerald-500/20 bg-black/60 px-4 py-3 text-lg font-semibold text-emerald-300 placeholder-zinc-600 backdrop-blur-xl transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* SECTION 5: RELEASED SUCCESSFULLY - ONLY AFTER RELEASE */}
                  {/* ============================================ */}
                  {scannerState === "released" && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
                        <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-emerald-300">RELEASED SUCCESSFULLY</h3>
                      <div className="mt-3 text-lg font-semibold text-white">{scanResult.employeeName}</div>
                      <div className="mt-2 rounded-xl border border-emerald-400/20 bg-black/20 px-4 py-3 text-sm text-emerald-100">
                        {scanResult.message}
                      </div>
                      <div className="mt-1 text-sm font-mono text-zinc-400">{scanResult.controlNumber}</div>
                      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Released By</div>
                          <div className="mt-1 text-base font-semibold text-white">{scanResult.releasedBy || "Security Officer"}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Auto Restart</div>
                          <div className="mt-1 text-2xl font-bold text-amber-400">{countdown}s</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* RETURN COMPLETED                            */}
                  {/* ============================================ */}
                  {scannerState === "return_completed" && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
                        <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-emerald-300">RETURN COMPLETED</h3>
                      <div className="mt-3 text-lg font-semibold text-white">{scanResult.employeeName}</div>
                      <div className="mt-2 rounded-xl border border-emerald-400/20 bg-black/20 px-4 py-3 text-sm text-emerald-100">{scanResult.message}</div>
                      <div className="mt-1 text-sm font-mono text-zinc-400">{scanResult.controlNumber}</div>
                      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Returned By</div>
                          <div className="mt-1 text-base font-semibold text-white">{scanResult.releasedBy || "Security Officer"}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Auto Restart</div>
                          <div className="mt-1 text-2xl font-bold text-amber-400">{countdown}s</div>
                        </div>
                      </div>
                      {obMealEnabled && (
                        <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                          <div className="flex items-center justify-center gap-2 text-emerald-300">
                            <Coffee className="h-4 w-4" />
                            <span className="text-sm font-semibold">OB Meal Allowance: ₱{obMealAmount}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* LOADING STATE                               */}
                  {/* ============================================ */}
                  {scannerState === "loading" && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                      <div className="flex items-center gap-4">
                        <LoaderCircle className="h-8 w-8 animate-spin text-amber-300" />
                        <div>
                          <div className="text-base font-semibold text-white">Verifying Gate Pass</div>
                          <div className="text-sm text-zinc-400">Checking approval workflow and release status...</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* ERROR / OFFLINE / PERMISSION STATE          */}
                  {/* ============================================ */}
                  {(scannerState === "error" || scannerState === "offline" || scannerState === "permission") && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                      <div className="flex items-start gap-4">
                        {scannerState === "offline" ? (
                          <WifiOff className="h-8 w-8 shrink-0 text-orange-300" />
                        ) : scannerState === "permission" ? (
                          <Smartphone className="h-8 w-8 shrink-0 text-amber-300" />
                        ) : (
                          <AlertTriangle className="h-8 w-8 shrink-0 text-red-300" />
                        )}
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-white">
                            {scannerState === "offline" ? "Offline" : scannerState === "permission" ? "Camera Permission Required" : "Verification Failed"}
                          </div>
                          <div className="mt-1 text-sm leading-relaxed text-zinc-300">{cameraError}</div>
                        </div>
                      </div>
                      <button type="button" onClick={handleRestart} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/20 min-h-[48px]">
                        <RefreshCw className="h-4 w-4" /> Restart Scanner
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Sticky Bottom Action Bar - Only show when form is ready (verified state, not released) */}
            {scanResult && scannerState === "verified" && (
              <div className="sticky bottom-0 z-20 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl px-4 py-4 lg:px-6">
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 min-h-[48px]">
                    ✕ Cancel
                  </button>
                  <button type="button" onClick={handleReleaseEmployee} disabled={isReleasing}
                    className="flex-1 rounded-xl bg-amber-500 px-5 py-4 text-sm font-bold text-black transition hover:bg-amber-400 min-h-[48px] shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isReleasing ? '⏳ Releasing...' : '🚗 Release Employee'}
                  </button>
                  <button type="button" onClick={handleRestart} className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 min-h-[48px] min-w-[48px]" title="Restart Scan">
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Return Mode Action Bar */}
            {scanResult && scannerState === "return_mode" && (
              <div className="sticky bottom-0 z-20 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl px-4 py-4 lg:px-6">
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 min-h-[48px]">✕ Cancel</button>
                  <button type="button" onClick={handleProcessReturn} disabled={isProcessingReturn}
                    className="flex-1 rounded-xl bg-blue-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-400 min-h-[48px] shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isProcessingReturn ? '⏳ Processing...' : '🏠 Process Return'}
                  </button>
                  <button type="button" onClick={handleRestart} className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 min-h-[48px] min-w-[48px]" title="Restart Scan">
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <style>{`
              .verification-panel-container { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
              .verification-panel-scroll::-webkit-scrollbar { width: 4px; }
              .verification-panel-scroll::-webkit-scrollbar-track { background: transparent; }
              .verification-panel-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
              input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
              input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
              input[type="number"] { -moz-appearance: textfield; }
            `}</style>
          </div>
        </div>

        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function QrPlaceholder() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
      <rect x="4" y="4" width="30" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="46" y="4" width="30" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="4" y="46" width="30" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="46" y="46" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="64" y="46" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="46" y="64" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="64" y="64" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="12" y="12" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="24" y="12" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="12" y="24" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="54" y="12" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="66" y="12" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="54" y="24" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="12" y="54" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="24" y="54" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="12" y="66" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

function isOutsideCalabarzon(destination: string): boolean {
  const dest = (destination || '').toLowerCase();
  const provinces = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon'];
  return !provinces.some(province => dest.includes(province));
}

function calculateTripDuration(timeOut: string): number {
  if (!timeOut) return 0;
  const out = new Date(timeOut);
  const now = new Date();
  return (now.getTime() - out.getTime()) / (1000 * 60 * 60);
}

function formatTripDuration(hours: number): string {
  if (hours <= 0) return '0 mins';
  
  const totalMinutes = Math.round(hours * 60);
  
  if (totalMinutes < 60) {
    return `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
  }
  
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (mins === 0) {
    return `${hrs} hour${hrs !== 1 ? 's' : ''}`;
  }
  
  return `${hrs}h ${mins}m`;
}
