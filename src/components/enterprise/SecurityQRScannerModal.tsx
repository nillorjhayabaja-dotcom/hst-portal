import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Flashlight,
  LoaderCircle,
  MonitorSmartphone,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  UserCircle2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { gatePassApi } from "@/services/gate-pass-api";

interface SecurityQRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess?: () => void;
}

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

interface CameraDevice {
  id: string;
  label: string;
  facing: "environment" | "user";
}

interface ScanResult {
  controlNumber: string;
  status: string;
  releasedAt?: string;
  releasedBy?: string;
  employeeName?: string;
  department?: string;
  destination?: string;
  purpose?: string;
  vehicle?: string;
  plateNumber?: string;
  driver?: string;
  message?: string;
  verificationCode?: string;
}

type ScannerState =
  | "scanner"
  | "loading"
  | "success"
  | "released"
  | "error"
  | "offline"
  | "permission";

const SCANNER_ID = "hst-enterprise-security-scanner";

const STATUS_COPY: Record<ScannerState, string> = {
  scanner: "Ready to Scan",
  loading: "Verifying...",
  success: "Verification Completed",
  released: "Already Verified",
  error: "Invalid QR",
  offline: "Offline",
  permission: "Camera Required",
};

export function SecurityQRScannerModal({
  open,
  onClose,
  onScanSuccess,
}: SecurityQRScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerStartingRef = useRef(false);
  const scannerStoppingRef = useRef(false);
  const scanLockRef = useRef(false);
  const scannerInitializedRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const activeScannerSessionRef = useRef<string | null>(null);
  const scannerPausedRef = useRef(false);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);
  const scannerMountRef = useRef<HTMLDivElement | null>(null);

  const [scannerState, setScannerState] =
    useState<ScannerState>("scanner");
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">(
    "environment",
  );
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isDesktop =
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false;

  const scannerConfig = {
    fps: 10,
    aspectRatio: isDesktop ? 1.6 : 1,
    rememberLastUsedCamera: true,
    showTorchButtonIfSupported: false,
  };

  // Use a separate lightweight timer that does NOT trigger React re-renders
  // for the clock display. Instead, we update the DOM directly.
  const clockDisplayRef = useRef<HTMLDivElement>(null);
  const clockDateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date();
      // Update React state only for components that need it
      setCurrentTime(now);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const vibrateSuccess = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([120, 80, 120]);
    }
  }, []);

  const playSuccessSound = useCallback(() => {
    // Disabled because browser media lifecycle cleanup
    // during rapid scanner teardown causes persistent
    // AbortError spam in Chromium-based browsers.
  }, []);

  const stopActiveStream = useCallback(() => {
    if (!streamRef.current) {
      return;
    }

    streamRef.current.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (trackError) {
        console.warn("Track stop warning", trackError);
      }
    });

    streamRef.current = null;
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerStoppingRef.current) {
      return;
    }

    scannerStoppingRef.current = true;

    try {
      const scanner = scannerRef.current;

      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch {
          // html5-qrcode teardown race condition
        }

        try {
          await scanner.clear();
        } catch {
          // html5-qrcode cleanup instability
        }
      }

      stopActiveStream();

      scannerRef.current = null;
    } catch (error) {
      console.error("Failed to stop scanner", error);
    } finally {
      scannerStartingRef.current = false;
      scannerStoppingRef.current = false;

      if (mountedRef.current) {
        setIsScanning(false);
        setFlashEnabled(false);
      }
    }
  }, [stopActiveStream]);

  const loadAvailableCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => {
        const isRear =
          /back|rear|environment|wide|telephoto/i.test(device.label);

        return {
          id: device.deviceId,
          label: device.label || "Camera",
          facing: isRear ? "environment" : "user",
        } satisfies CameraDevice;
      });

    setCameraDevices(videoDevices);

    return videoDevices;
  }, []);

  const ensureCameraPermission = useCallback(async () => {
    if (!window.isSecureContext) {
      throw new Error("HTTPS_REQUIRED");
    }

    if (streamRef.current?.active) {
      return streamRef.current;
    }

    stopActiveStream();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: {
          ideal: cameraFacing,
        },
        width: {
          ideal: 1920,
        },
        height: {
          ideal: 1080,
        },
      },
    });

    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        if (!mountedRef.current) {
          return;
        }

        setIsScanning(false);

        if (
          open &&
          !scannerStoppingRef.current &&
          !scannerStartingRef.current
        ) {
          window.setTimeout(() => {
            scannerInitializedRef.current = false;
            setScanResult(null);
            setScannerState("scanner");
          }, 150);
        }
      };
    });

    streamRef.current = stream;

    return stream;
  }, [cameraFacing, open, stopActiveStream]);

  const restartScanner = useCallback(async () => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
    }

    setScanResult(null);
    setCameraError(null);
    setScannerState("scanner");

    scannerPausedRef.current = false;

    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.resume();
        setIsScanning(true);
        return;
      } catch {
        // fallback to full restart
      }
    }

    await stopScanner();

    restartTimeoutRef.current = window.setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }

      scannerInitializedRef.current = false;
      setIsScanning(false);
    }, 180);
  }, [stopScanner]);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (!decodedText || scanLockRef.current) {
        return;
      }

      if (!navigator.onLine) {
        setScannerState("offline");
        setCameraError(
          "Internet connection unavailable. Reconnect and retry verification.",
        );
        return;
      }

      scanLockRef.current = true;

      try {
        setScannerState("loading");

        scannerPausedRef.current = true;

        try {
          await scannerRef.current?.pause(true);
        } catch {
          // ignore pause transition instability
        }

        const startedAt = performance.now();

        const result = await gatePassApi.scanAndRelease(decodedText);

        const duration = (
          (performance.now() - startedAt) /
          1000
        ).toFixed(2);

        const verificationStatus = result?.verification?.status;
        const alreadyReleased =
          verificationStatus === "released" ||
          result?.code === "ALREADY_RELEASED";

        playSuccessSound();
        vibrateSuccess();

        setScanResult({
          controlNumber: result.request.controlNumber,
          status: verificationStatus,
          releasedAt: result.verification.releasedAt,
          releasedBy:
            result.verification?.releasedBy ||
            result.request.requester?.displayName,
          employeeName: result.request.requester?.displayName,
          department:
            result.request.department?.name || "Unknown Department",
          destination: result.gatePass?.destination || "N/A",
          purpose: result.gatePass?.purpose || "N/A",
          vehicle:
            result.gatePass?.transportationMode ||
            "Assigned Transportation",
          plateNumber:
            result.gatePass?.vehiclePlate || "Not Assigned",
          driver:
            result.gatePass?.driverName || "Not Assigned",
          message:
            result.message ||
            (alreadyReleased
              ? "This Gate Pass has already been released by Security."
              : "Gate Pass released successfully."),
          verificationCode: result.code,
        });

        setScannerState(
          alreadyReleased ? "released" : "success",
        );

        if (alreadyReleased) {
          toast.success("Gate Pass already verified and released.");
          // Keep scan lock engaged for already-released QRs so the
          // scanner does not re-process the same QR. The user must
          // press "Restart Scanner" to start fresh.
          scanLockRef.current = true;
          return;
        } else {
          toast.success(
            `Gate Pass released successfully in ${duration}s.`,
          );

          onScanSuccess?.();
        }
      } catch (error: any) {
        console.error("Verification failed", error);

        const message =
          error?.message ||
          "Unable to verify Gate Pass. Please scan again.";

        setCameraError(message);

        setScanResult({
          controlNumber: "Unknown",
          status: "error",
          message,
          verificationCode: error?.code,
        });

        setScannerState("error");

        toast.error(message);

        scanLockRef.current = true;
        return;
      }

      scanLockRef.current = false;
    },
    [
      onScanSuccess,
      playSuccessSound,
      stopScanner,
      vibrateSuccess,
    ],
  );

  const startScanner = useCallback(async () => {
    if (
      scannerStartingRef.current ||
      scannerStoppingRef.current ||
      isScanning ||
      !open
    ) {
      return;
    }

    scannerStartingRef.current = true;

    try {
      setCameraError(null);
      setScannerState("scanner");

      if (scannerRef.current?.isScanning || streamRef.current?.active) {
        return;
      }

      await ensureCameraPermission();

      const availableCameras = await loadAvailableCameras();

      const preferredCamera =
        availableCameras.find((camera) =>
          cameraFacing === "environment"
            ? camera.facing === "environment"
            : camera.facing === "user",
        ) || availableCameras[0];

      // Use the stable container ref instead of querying the DOM
      // This avoids issues where React re-renders replace the container
      const scannerContainer = scannerContainerRef.current;

      if (!scannerContainer) {
        throw new Error("Scanner container unavailable.");
      }

      const scannerSessionId = crypto.randomUUID();

      activeScannerSessionRef.current = scannerSessionId;

      const scanner = new Html5Qrcode(SCANNER_ID, {
        verbose: false,
      });

      scannerRef.current = scanner;

      scannerPausedRef.current = false;

      await scanner.start(
        selectedCameraId || preferredCamera?.id || {
          facingMode: {
            ideal: cameraFacing,
          },
        },
        scannerConfig,
        (decodedText) => {
          void handleScan(decodedText);
        },
        () => undefined,
      );

      if (preferredCamera?.id && !selectedCameraId) {
        setSelectedCameraId(preferredCamera.id);
      }

      if (
        mountedRef.current &&
        activeScannerSessionRef.current === scannerSessionId
      ) {
        setIsScanning(true);
      }
    } catch (error: any) {
      console.error("Scanner initialization failed", error);

      // Ignore AbortError — this happens when the component re-renders
      // and the video element gets detached during play(). It's harmless
      // and the scanner will be restarted.
      if (
        error?.name === "AbortError" ||
        error?.message?.includes("play() request was interrupted")
      ) {
        console.warn(
          "Scanner AbortError (expected during lifecycle transitions):",
          error.message,
        );
        scannerStartingRef.current = false;
        return;
      }

      if (!navigator.onLine) {
        setScannerState("offline");
        setCameraError("No internet connection available.");
      } else {
        setScannerState("permission");

        setCameraError(
          error?.message === "HTTPS_REQUIRED"
            ? "Camera requires HTTPS secure context."
            : "Allow camera permission to scan Gate Passes.",
        );
      }
    } finally {
      scannerStartingRef.current = false;
    }
  }, [
    cameraFacing,
    ensureCameraPermission,
    handleScan,
    isScanning,
    loadAvailableCameras,
    open,
    scannerConfig,
    selectedCameraId,
    stopScanner,
  ]);

  const toggleFlash = useCallback(async () => {
    try {
      const capabilities =
        scannerRef.current?.getRunningTrackCapabilities() as
          | TorchCapabilities
          | undefined;

      if (!capabilities?.torch) {
        toast.error("Flashlight unavailable on this device.");
        return;
      }

      await scannerRef.current?.applyVideoConstraints({
        advanced: [
          {
            torch: !flashEnabled,
          } as TorchConstraintSet,
        ],
      });

      setFlashEnabled((prev) => !prev);
    } catch (error) {
      console.error("Flash toggle failed", error);
    }
  }, [flashEnabled]);

  const switchCamera = useCallback(async () => {
    if (!cameraDevices.length) {
      return;
    }

    await stopScanner();

    const currentIndex = cameraDevices.findIndex(
      (camera) => camera.id === selectedCameraId,
    );

    const nextCamera =
      cameraDevices[(currentIndex + 1) % cameraDevices.length];

    setSelectedCameraId(nextCamera.id);
    setCameraFacing(nextCamera.facing);

    setTimeout(() => {
      startScanner().catch(() => undefined);
    }, 150);
  }, [cameraDevices, selectedCameraId, startScanner, stopScanner]);

  // Stable scanner container: create a div outside React's rendering
  // so that React re-renders don't detach the video element.
  useEffect(() => {
    const mountPoint = scannerMountRef.current;
    if (!mountPoint) return;

    // Create the scanner container once and keep it stable
    if (!scannerContainerRef.current) {
      const container = document.createElement("div");
      container.id = SCANNER_ID;
      container.className =
        "h-full min-h-[62vh] w-full overflow-hidden rounded-[2rem]";
      mountPoint.appendChild(container);
      scannerContainerRef.current = container;
    }

    return () => {
      // Clean up the container when the component unmounts
      if (scannerContainerRef.current && scannerContainerRef.current.parentNode) {
        scannerContainerRef.current.parentNode.removeChild(scannerContainerRef.current);
      }
      scannerContainerRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    mountedRef.current = true;

    if (!open) {
      activeScannerSessionRef.current = null;
      scannerInitializedRef.current = false;
      stopScanner().catch(() => undefined);
      return;
    }

    if (
      !scannerInitializedRef.current &&
      !scannerStartingRef.current &&
      !isScanning &&
      !scannerPausedRef.current
    ) {
      scannerInitializedRef.current = true;
      startScanner().catch(() => undefined);
    }

    return () => {
      mountedRef.current = false;
      activeScannerSessionRef.current = null;
      scannerInitializedRef.current = false;

      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }

      stopScanner().catch(() => undefined);
    };
  }, [isScanning, open, startScanner, stopScanner]);

  useEffect(() => {
    // Auto-restart scanner only for a fresh successful scan.
    // Do NOT auto-restart when released — re-scanning the same
    // already-released QR would trigger ALREADY_RELEASED again,
    // causing the infinite error loop. The user must manually
    // press Restart or close the scanner.
    if (scannerState !== "success") {
      return;
    }

    setCountdown(3);

    const interval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          restartScanner().catch(() => undefined);

          return 3;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restartScanner, scannerState]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!open) {
        return;
      }

      if (event.key.toLowerCase() === "f") {
        toggleFlash().catch(() => undefined);
      }

      if (event.key.toLowerCase() === "r") {
        restartScanner().catch(() => undefined);
      }

      if (event.key.toLowerCase() === "c") {
        switchCamera().catch(() => undefined);
      }

      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [onClose, open, restartScanner, switchCamera, toggleFlash]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-[#020202] text-white">
      <style>
        {`
          .scanner-line {
            animation: scannerLine 2.5s linear infinite;
          }

          .scanner-corner {
            animation: scannerPulse 1.6s ease-in-out infinite;
          }

          @keyframes scannerLine {
            0% {
              transform: translateY(-180px);
            }

            100% {
              transform: translateY(180px);
            }
          }

          @keyframes scannerPulse {
            0%,100% {
              opacity: 0.7;
            }

            50% {
              opacity: 1;
            }
          }
        `}
      </style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.15),transparent_45%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-2xl lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-amber-400" />
                <div>
                  <h1 className="text-2xl font-bold">
                    Security QR Scanner
                  </h1>
                  <p className="text-sm text-zinc-400">
                    Security Gate Pass Verification
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs lg:flex lg:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-zinc-500">Current Date</div>
                <div className="mt-1 font-semibold">
                  {currentTime.toLocaleDateString()}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-zinc-500">Current Time</div>
                <div className="mt-1 font-semibold">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <div className="text-zinc-400">Live Status</div>
                <div className="mt-1 flex items-center gap-2 font-semibold text-emerald-300">
                  <Wifi className="h-4 w-4" />
                  Connected
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-zinc-500">Connected Camera</div>
                <div className="mt-1 truncate font-semibold">
                  {cameraDevices.find(
                    (camera) => camera.id === selectedCameraId,
                  )?.label || "Initializing Camera"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex flex-[0_0_60%] flex-col p-4 lg:p-6">
            <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
              {/* 
                IMPORTANT: The scanner container (#hst-enterprise-security-scanner) 
                is created and managed via a ref outside of React's rendering tree.
                This prevents React re-renders from detaching the video element
                that html5-qrcode creates internally, which was causing the
                "play() request was interrupted because the media was removed
                from the document" AbortError.
              */}
              <div
                ref={scannerMountRef}
                className="h-full min-h-[62vh] w-full overflow-hidden rounded-[2rem]"
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
                  {isDesktop
                    ? "Desktop Security Checkpoint"
                    : "Mobile Security Scan"}
                </span>
              </div>

              <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/70 px-6 py-3 backdrop-blur-xl">
                <ScanLine className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-semibold">
                  {STATUS_COPY[scannerState]}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button
                type="button"
                onClick={toggleFlash}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold transition hover:border-amber-400/50 hover:bg-amber-400/10"
              >
                <Flashlight className="h-5 w-5 text-amber-400" />
                🔦 Flash
              </button>

              <button
                type="button"
                onClick={switchCamera}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
              >
                <Camera className="h-5 w-5 text-cyan-300" />
                📷 Camera
              </button>

              <button
                type="button"
                onClick={() => restartScanner().catch(() => undefined)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold transition hover:border-emerald-400/50 hover:bg-emerald-400/10"
              >
                <RefreshCw className="h-5 w-5 text-emerald-300" />
                🔄 Restart
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold transition hover:bg-red-500/20"
              >
                <CameraOff className="h-5 w-5 text-red-300" />
                ❌ Close
              </button>
            </div>
          </div>

          <div className="flex flex-[0_0_40%] flex-col border-t border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl lg:border-l lg:border-t-0 lg:p-6">
            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                    Verification Panel
                  </div>

                  <h2 className="mt-2 text-2xl font-bold">
                    Security Release Workflow
                  </h2>
                </div>

                <div
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                    scannerState === "success" ||
                    scannerState === "released"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : scannerState === "loading"
                        ? "bg-amber-500/20 text-amber-300"
                        : scannerState === "error"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-cyan-500/20 text-cyan-300"
                  }`}
                >
                  {STATUS_COPY[scannerState]}
                </div>
              </div>

              {!scanResult && scannerState === "scanner" ? (
                <div className="mt-10 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-black/20 px-8 py-14 text-center">
                  <QrPlaceholder />
                  <h3 className="mt-5 text-xl font-semibold">
                    Waiting for QR Code...
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-zinc-400">
                    Position the employee gate pass QR inside the scanning
                    frame to begin automated verification and release.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <InfoRow
                    icon={ShieldCheck}
                    label="Control Number"
                    value={scanResult?.controlNumber}
                  />
                  <InfoRow
                    icon={UserCircle2}
                    label="Employee"
                    value={scanResult?.employeeName}
                  />
                  <InfoRow
                    icon={CheckCheck}
                    label="Department"
                    value={scanResult?.department}
                  />
                  <InfoRow
                    icon={Clock3}
                    label="Purpose"
                    value={scanResult?.purpose}
                  />
                  <InfoRow
                    icon={MonitorSmartphone}
                    label="Destination"
                    value={scanResult?.destination}
                  />
                  <InfoRow
                    icon={Camera}
                    label="Vehicle"
                    value={scanResult?.vehicle}
                  />
                  <InfoRow
                    icon={Camera}
                    label="Plate Number"
                    value={scanResult?.plateNumber}
                  />
                  <InfoRow
                    icon={UserCircle2}
                    label="Driver"
                    value={scanResult?.driver}
                  />
                  <InfoRow
                    icon={Clock3}
                    label="Release Time"
                    value={
                      scanResult?.releasedAt
                        ? new Date(
                            scanResult.releasedAt,
                          ).toLocaleString()
                        : "-"
                    }
                  />
                </div>
              )}

              {scannerState === "loading" && (
                <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                  <div className="flex items-center gap-4">
                    <LoaderCircle className="h-8 w-8 animate-spin text-amber-300" />
                    <div>
                      <div className="font-semibold">
                        Verifying Gate Pass
                      </div>
                      <div className="text-sm text-zinc-400">
                        Checking approval workflow and release status.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(scannerState === "success" ||
                scannerState === "released") &&
                scanResult && (
                <div className="mt-6 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
                    <CheckCircle2 className="h-14 w-14 text-emerald-300" />
                  </div>

                  <h3 className="mt-5 text-3xl font-bold text-emerald-300">
                    {scannerState === "released"
                      ? "Already Verified"
                      : "Released Successfully"}
                  </h3>

                  <div className="mt-3 text-lg font-medium">
                    {scanResult.employeeName}
                  </div>

                  <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-black/20 px-4 py-3 text-sm text-emerald-100">
                    {scanResult.message}
                  </div>

                  <div className="mt-1 text-sm text-zinc-300">
                    {scanResult.controlNumber}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                       <div className="text-xs uppercase text-zinc-500">
                         Released By
                       </div>
                       <div className="mt-1 font-semibold">
                         {scanResult.releasedBy || "Security Officer"}
                       </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase text-zinc-500">
                        Auto Restart
                      </div>
                      <div className="mt-1 font-semibold">
                        {countdown}s
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(scannerState === "error" ||
                scannerState === "offline" ||
                scannerState === "permission") && (
                <div className="mt-6 rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6">
                  <div className="flex items-start gap-4">
                    {scannerState === "offline" ? (
                      <WifiOff className="h-10 w-10 text-orange-300" />
                    ) : scannerState === "permission" ? (
                      <Smartphone className="h-10 w-10 text-amber-300" />
                    ) : (
                      <AlertTriangle className="h-10 w-10 text-red-300" />
                    )}

                    <div>
                      <div className="text-xl font-semibold">
                        {scannerState === "offline"
                          ? "Offline"
                          : scannerState === "permission"
                            ? "Camera Permission Required"
                            : "Verification Failed"}
                      </div>

                      <div className="mt-2 text-sm text-zinc-300">
                        {cameraError}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      restartScanner().catch(() => undefined)
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-4 text-sm font-semibold transition hover:bg-white/20"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Restart Scanner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/70 backdrop-blur-xl transition hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          <Icon className="h-5 w-5 text-amber-300" />
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            {label}
          </div>
          <div className="mt-1 font-medium text-white">
            {value || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function QrPlaceholder() {
  return (
    <div className="relative h-32 w-32 rounded-[2rem] border border-white/10 bg-black/30">
      <div className="absolute left-0 top-0 h-10 w-10 rounded-tl-[2rem] border-l-4 border-t-4 border-amber-400" />
      <div className="absolute right-0 top-0 h-10 w-10 rounded-tr-[2rem] border-r-4 border-t-4 border-amber-400" />
      <div className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-[2rem] border-b-4 border-l-4 border-amber-400" />
      <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-[2rem] border-b-4 border-r-4 border-amber-400" />
    </div>
  );
}