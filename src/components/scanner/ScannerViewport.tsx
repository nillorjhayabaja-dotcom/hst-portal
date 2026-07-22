import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ID = "hst-enterprise-security-scanner";

interface CameraDevice {
  id: string;
  label: string;
  facing: "environment" | "user";
}

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

export interface ScannerAPI {
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  restart: () => Promise<void>;
  toggleFlash: () => Promise<boolean>;
  switchCamera: () => Promise<string | null>;
  getCameraInfo: () => { label: string; facing: "environment" | "user" } | null;
  stop: () => Promise<void>;
}

interface ScannerViewportProps {
  isOpen: boolean;
  onScanSuccess: (decodedText: string) => void;
  onScanError: (error: string) => void;
  preferredCameraId: string | null;
}

function isDesktopEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 1024px)").matches;
}

function resolveCameraConfig(
  devices: CameraDevice[],
  preferredCameraId: string | null,
): string | { facingMode: { ideal: "environment" | "user" } } {
  const desktop = isDesktopEnvironment();

  console.info("[QR]", "Camera diagnostics:", {
    isDesktop: desktop,
    cameraCount: devices.length,
    cameras: devices.map((d) => ({
      id: d.id,
      label: d.label,
      facing: d.facing,
    })),
    preferredCameraId,
  });

  // If a specific camera ID is preferred, use it (only if it's non-empty)
  if (preferredCameraId && preferredCameraId.trim().length > 0) {
    console.info("[QR]", "Using preferred camera ID:", preferredCameraId);
    return preferredCameraId;
  }

  // DESKTOP STRATEGY: never use facingMode
  // Use the first available camera with a deviceId
  if (desktop) {
    if (devices.length > 0) {
      // Prefer user-facing (built-in webcam) over rear for desktop
      const userCam = devices.find((d) => d.facing === "user");
      const chosen = userCam || devices[0];
      // Defensive: ensure the device ID is non-empty
      if (chosen.id && chosen.id.trim().length > 0) {
        console.info("[QR]", "Desktop using deviceId:", {
          id: chosen.id,
          label: chosen.label,
          facing: chosen.facing,
        });
        return chosen.id;
      }
      // Fallback if chosen device has empty ID
      console.info("[QR]", "Desktop: chosen device has empty ID, trying generic constraint");
      return { facingMode: { ideal: "user" as const } };
    }
    // No cameras detected at all - this will trigger permission prompt
    // Use a generic constraint that works with most webcams
    console.info("[QR]", "Desktop: no cameras found, trying generic constraint");
    return { facingMode: { ideal: "user" as const } };
  }

  // MOBILE STRATEGY: prefer environment (rear) camera
  if (devices.length > 0) {
    const envCam = devices.find((d) => d.facing === "environment");
    // Only use deviceId if it's non-empty; otherwise fall through to facingMode
    if (envCam && envCam.id && envCam.id.trim().length > 0) {
      console.info("[QR]", "Mobile using rear camera deviceId:", {
        id: envCam.id,
        label: envCam.label,
      });
      return envCam.id;
    }
    // Fallback: use first camera with a valid deviceId
    const firstValid = devices.find((d) => d.id && d.id.trim().length > 0);
    if (firstValid) {
      console.info("[QR]", "Mobile using first valid camera deviceId:", {
        id: firstValid.id,
        label: firstValid.label,
      });
      return firstValid.id;
    }
  }
  console.info("[QR]", "Mobile using facingMode: environment");
  return { facingMode: { ideal: "environment" as const } };
}

/**
 * ScannerViewport
 *
 * ARCHITECTURAL RULES:
 * - Wrapped in React.memo() to prevent re-renders from parent state changes.
 * - Only receives: isOpen, onScanSuccess, onScanError, preferredCameraId.
 * - No clock values, no status polling, no connection state, no derived parent state.
 * - Creates exactly ONE Html5Qrcode instance per modal open.
 * - Creates exactly ONE MediaStream per modal open.
 * - Never recreates the scanner during normal operation.
 * - Pauses on QR detection, resumes only if verification fails.
 * - Stops exactly once on modal close.
 * - Desktop: NEVER uses facingMode, ALWAYS uses deviceId.
 * - Mobile: prefers facingMode: "environment", falls back to deviceId.
 */
const ScannerViewport = React.memo(
  forwardRef<ScannerAPI, ScannerViewportProps>(function ScannerViewport(
    { isOpen, onScanSuccess, onScanError, preferredCameraId },
    ref,
  ) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isRunningRef = useRef(false);
    const isPausedRef = useRef(false);
    const isStoppingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mountRef = useRef<HTMLDivElement | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const flashEnabledRef = useRef(false);
    const cameraDevicesRef = useRef<CameraDevice[]>([]);
    const selectedCameraIdRef = useRef<string | null>(null);
    const cameraLabelRef = useRef<string>("Initializing Camera");
    const cameraFacingRef = useRef<"environment" | "user">("environment");
    const startAttemptedRef = useRef(false);

    // Stable callbacks that never change
    const onScanSuccessRef = useRef(onScanSuccess);
    onScanSuccessRef.current = onScanSuccess;
    const onScanErrorRef = useRef(onScanError);
    onScanErrorRef.current = onScanError;

    // Extract MediaStream from the video element after scanner starts.
    // This avoids the need to monkey-patch getUserMedia.
    const captureStreamFromVideo = useCallback((): MediaStream | null => {
      try {
        const container = document.getElementById(SCANNER_ID);
        if (!container) return null;
        const video = container.querySelector("video");
        if (!video) return null;
        const stream = video.srcObject as MediaStream | null;
        if (stream && stream.active) {
          return stream;
        }
        return null;
      } catch {
        return null;
      }
    }, []);

    const stopActiveStream = useCallback(() => {
      if (!streamRef.current) return;
      console.info("[QR]", "MediaStream tracks released");
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }, []);

    const clearScanner = useCallback(async () => {
      const scanner = scannerRef.current;
      if (!scanner) return;

      try {
        if (scanner.isScanning) {
          await scanner.stop();
          console.info("[QR]", "Scanner stopped");
        }
      } catch {
        // html5-qrcode teardown race condition
      }

      try {
        await scanner.clear();
        console.info("[QR]", "Scanner cleared");
      } catch {
        // html5-qrcode cleanup instability
      }
    }, []);

    const stopScanner = useCallback(async () => {
      if (isStoppingRef.current) return;
      isStoppingRef.current = true;

      console.info("[QR]", "Scanner stop requested");

      try {
        await clearScanner();
      } catch (err) {
        console.error("[QR]", "Scanner stop error", err);
      }

      stopActiveStream();
      scannerRef.current = null;
      isRunningRef.current = false;
      isPausedRef.current = false;
      isStoppingRef.current = false;
      sessionIdRef.current = null;
      startAttemptedRef.current = false;

      console.info("[QR]", "Scanner fully stopped");
    }, [clearScanner, stopActiveStream]);

    const loadAvailableCameras = useCallback(async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        console.warn("[QR]", "enumerateDevices not available");
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .filter((device) => !!device.deviceId) // Exclude empty device IDs (pre-permission)
        .map((device) => {
          const isRear = /back|rear|environment|wide|telephoto/i.test(
            device.label,
          );
          return {
            id: device.deviceId,
            label: device.label || "Camera",
            facing: isRear ? "environment" : "user",
          } as CameraDevice;
        });

      console.info("[QR]", "Available cameras:", {
        count: videoDevices.length,
        totalVideoInputs: devices.filter((d) => d.kind === "videoinput").length,
        devices: videoDevices.map((d) => ({
          id: d.id.substring(0, 12) + "...",
          label: d.label,
          facing: d.facing,
        })),
      });

      // If we got empty results (no valid deviceIds), try getUserMedia to trigger permission
      if (videoDevices.length === 0) {
        console.info("[QR]", "No cameras with valid IDs, triggering permission prompt");
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
          // Stop it immediately - we just needed permission
          tempStream.getTracks().forEach((t) => t.stop());
          // Re-enumerate now that permission is granted
          const devicesWithPerm = await navigator.mediaDevices.enumerateDevices();
          const videoDevicesWithPerm = devicesWithPerm
            .filter((device) => device.kind === "videoinput")
            .filter((device) => !!device.deviceId)
            .map((device) => {
              const isRear = /back|rear|environment|wide|telephoto/i.test(
                device.label,
              );
              return {
                id: device.deviceId,
                label: device.label || "Camera",
                facing: isRear ? "environment" : "user",
              } as CameraDevice;
            });
          if (videoDevicesWithPerm.length > 0) {
            cameraDevicesRef.current = videoDevicesWithPerm;
            console.info("[QR]", "Cameras found after permission:", {
              count: videoDevicesWithPerm.length,
            });
            return videoDevicesWithPerm;
          }
        } catch {
          console.warn("[QR]", "getUserMedia permission prompt failed");
        }
      }

      cameraDevicesRef.current = videoDevices;
      return videoDevices;
    }, []);

    const startScanner = useCallback(async () => {
      // Singleton guard: prevent duplicate initialization
      if (isRunningRef.current) {
        console.info("[QR]", "Scanner already running, skipping start");
        return;
      }
      if (isStoppingRef.current) {
        console.info("[QR]", "Scanner currently stopping, skipping start");
        return;
      }
      if (!isOpen) {
        console.info("[QR]", "Modal not open, skipping start");
        return;
      }
      if (startAttemptedRef.current) {
        console.info("[QR]", "Start already attempted this session, skipping");
        return;
      }

      startAttemptedRef.current = true;

      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;

      console.info("[QR]", "Scanner instance created");

      // Verify container exists and has dimensions
      const container = document.getElementById(SCANNER_ID);
      if (!container) {
        const errMsg = "Scanner container not found in DOM";
        console.error("[QR]", errMsg);
        onScanErrorRef.current(errMsg);
        startAttemptedRef.current = false;
        return;
      }

      const rect = container.getBoundingClientRect();
      console.info("[QR]", "Container dimensions:", {
        width: rect.width,
        height: rect.height,
      });
      if (rect.width === 0 || rect.height === 0) {
        const errMsg = "Scanner container has zero dimensions";
        console.error("[QR]", errMsg, rect);
        onScanErrorRef.current(errMsg);
        startAttemptedRef.current = false;
        return;
      }

      // Check camera permission state
      try {
        const permStatus = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        console.info("[QR]", "Camera permission state:", permStatus.state);
        if (permStatus.state === "denied") {
          const errMsg =
            "Camera permission denied. Please enable camera access in browser settings.";
          console.error("[QR]", errMsg);
          onScanErrorRef.current(errMsg);
          startAttemptedRef.current = false;
          return;
        }
      } catch {
        // permissions.query("camera") not supported in all browsers
        console.info("[QR]", "Camera permission API not available, proceeding");
      }

      const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
      scannerRef.current = scanner;

      console.info("[QR]", "Scanner start requested");

      // Enumerate cameras for diagnostics and config resolution
      const devices = await loadAvailableCameras();
      const cameraConfig = resolveCameraConfig(devices, preferredCameraId);

      console.info("[QR]", "Using camera config:", {
        config:
          typeof cameraConfig === "string"
            ? `deviceId: ${cameraConfig.substring(0, 12)}...`
            : cameraConfig,
        desktop: isDesktopEnvironment(),
      });

      try {
        const config = {
          fps: 10,
          aspectRatio: isDesktopEnvironment() ? 1.6 : 1,
        };

        await scanner.start(
          cameraConfig as any,
          config,
          (decodedText) => {
            // QR detected callback
            if (isPausedRef.current || isStoppingRef.current) return;
            console.info("[QR]", "QR detected");
            onScanSuccessRef.current(decodedText);
          },
          () => {
            // Continuous scan error callback - not critical
          },
        );

        // Verify session is still valid
        if (sessionIdRef.current !== sessionId) {
          console.info("[QR]", "Session invalidated during start, stopping");
          await stopScanner();
          return;
        }

        // Capture the MediaStream from the video element
        const capturedStream = captureStreamFromVideo();
        if (capturedStream) {
          streamRef.current = capturedStream;
          console.info("[QR]", "Camera stream acquired");
          capturedStream.getVideoTracks().forEach((track) => {
            track.onended = () => {
              console.info("[QR]", "Camera stream ended externally");
            };
          });

          // Update camera label from the active track
          const videoTrack = capturedStream.getVideoTracks()[0];
          if (videoTrack) {
            const label = videoTrack.label || "Camera";
            cameraLabelRef.current = label;
            const isRear = /back|rear|environment|wide|telephoto/i.test(label);
            cameraFacingRef.current = isRear ? "environment" : "user";
          }
        } else {
          console.warn("[QR]", "Could not capture MediaStream from video element");
        }

        isRunningRef.current = true;
        console.info("[QR]", "Scanner started successfully");
      } catch (err: unknown) {
        // Comprehensive error logging
        console.error("[QR] ===== SCANNER START FAILED =====");
        console.error("[QR] Error details:", {
          type: typeof err,
          isError: err instanceof Error,
          value: err,
          stringValue: String(err),
          name: err instanceof Error ? err.name : typeof err,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });

        scannerRef.current = null;
        isRunningRef.current = false;
        sessionIdRef.current = null;
        startAttemptedRef.current = false;

        // Handle AbortError (video element detached during play())
        if (
          (err instanceof Error &&
            (err.name === "AbortError" ||
              err.message?.includes("play() request was interrupted"))) ||
          (typeof err === "string" &&
            (err.includes("AbortError") ||
              err.includes("play() request was interrupted")))
        ) {
          console.warn(
            "[QR]",
            "Scanner AbortError (expected during lifecycle transitions)",
          );
          return;
        }

        // Extract meaningful error message
        let errorMessage = "Failed to start camera";
        if (err instanceof Error) {
          errorMessage = err.message || errorMessage;
        } else if (typeof err === "string") {
          errorMessage = err;
        } else if (err && typeof err === "object") {
          const obj = err as Record<string, unknown>;
          errorMessage =
            (obj.message as string) ||
            (obj.error as string) ||
            String(err) ||
            errorMessage;
        }

        console.error("[QR]", "Scanner start failed:", errorMessage);
        onScanErrorRef.current(errorMessage);
      }
    }, [
      isOpen,
      preferredCameraId,
      stopScanner,
      loadAvailableCameras,
      captureStreamFromVideo,
    ]);

    // Exposed API via ref
    const pause = useCallback(async () => {
      if (!scannerRef.current || !isRunningRef.current || isPausedRef.current)
        return;
      isPausedRef.current = true;
      console.info("[QR]", "Scanner paused");
      try {
        await scannerRef.current.pause(true);
      } catch {
        // ignore
      }
    }, []);

    const resume = useCallback(async () => {
      if (!scannerRef.current || !isPausedRef.current) return;
      console.info("[QR]", "Scanner resumed");
      try {
        await scannerRef.current.resume();
        isPausedRef.current = false;
      } catch {
        isPausedRef.current = false;
      }
    }, []);

    const restart = useCallback(async () => {
      console.info("[QR]", "Scanner restart requested");
      if (isPausedRef.current) {
        await resume();
      }
      isPausedRef.current = false;
    }, [resume]);

    const toggleFlash = useCallback(async (): Promise<boolean> => {
      try {
        const capabilities = scannerRef.current?.getRunningTrackCapabilities() as
          | TorchCapabilities
          | undefined;
        if (!capabilities?.torch) {
          console.warn("[QR]", "Flash unavailable");
          return false;
        }
        const newState = !flashEnabledRef.current;
        await scannerRef.current?.applyVideoConstraints({
          advanced: [{ torch: newState } as TorchConstraintSet],
        });
        flashEnabledRef.current = newState;
        console.info("[QR]", "Flash toggled:", newState);
        return newState;
      } catch (err) {
        console.error("[QR]", "Flash toggle failed", err);
        return false;
      }
    }, []);

    const switchCamera = useCallback(async (): Promise<string | null> => {
      const devices = cameraDevicesRef.current;
      if (!devices.length) {
        console.warn("[QR]", "No cameras available to switch");
        return null;
      }

      console.info("[QR]", "Camera switch requested");

      // Stop current scanner
      await clearScanner();
      stopActiveStream();

      const currentIndex = devices.findIndex(
        (c) => c.id === selectedCameraIdRef.current,
      );
      const nextCamera = devices[(currentIndex + 1) % devices.length];

      selectedCameraIdRef.current = nextCamera.id;
      cameraFacingRef.current = nextCamera.facing;
      cameraLabelRef.current = nextCamera.label;

      // Re-start with the new camera
      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(SCANNER_ID, { verbose: false });
      }

      console.info("[QR]", "Switching to camera:", {
        id: nextCamera.id.substring(0, 12) + "...",
        label: nextCamera.label,
        facing: nextCamera.facing,
      });

      try {
        await scannerRef.current.start(
          nextCamera.id,
          {
            fps: 10,
            aspectRatio: isDesktopEnvironment() ? 1.6 : 1,
          },
          (decodedText) => {
            if (isPausedRef.current || isStoppingRef.current) return;
            console.info("[QR]", "QR detected");
            onScanSuccessRef.current(decodedText);
          },
          () => undefined,
        );

        // Capture new stream
        const capturedStream = captureStreamFromVideo();
        if (capturedStream) {
          streamRef.current = capturedStream;
        }

        if (sessionIdRef.current === sessionId) {
          isRunningRef.current = true;
          isPausedRef.current = false;
          console.info("[QR]", "Camera switched successfully");
        }
      } catch (err: unknown) {
        console.error("[QR]", "Camera switch failed:", err);
      }

      return nextCamera.label;
    }, [clearScanner, stopActiveStream, captureStreamFromVideo]);

    const getCameraInfo = useCallback((): {
      label: string;
      facing: "environment" | "user";
    } | null => {
      if (!cameraLabelRef.current) return null;
      return {
        label: cameraLabelRef.current,
        facing: cameraFacingRef.current,
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        pause,
        resume,
        restart,
        toggleFlash,
        switchCamera,
        getCameraInfo,
        stop: stopScanner,
      }),
      [
        pause,
        resume,
        restart,
        toggleFlash,
        switchCamera,
        getCameraInfo,
        stopScanner,
      ],
    );

    // Create stable container outside React rendering tree
    useEffect(() => {
      const mountPoint = mountRef.current;
      if (!mountPoint) return;

      if (!containerRef.current) {
        const container = document.createElement("div");
        container.id = SCANNER_ID;
        container.className =
          "h-full min-h-[62vh] w-full overflow-hidden rounded-[2rem]";
        mountPoint.appendChild(container);
        containerRef.current = container;
        console.info("[QR]", "Component mounted");
      }

      return () => {
        console.info("[QR]", "Component unmounted");
        if (containerRef.current && containerRef.current.parentNode) {
          containerRef.current.parentNode.removeChild(containerRef.current);
        }
        containerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Main lifecycle: start on open, stop on close
    useEffect(() => {
      if (isOpen) {
        console.info("[QR]", "Modal opened, starting scanner");
        // Use a microtask delay to ensure the container is laid out
        // This prevents race conditions with React StrictMode double-mount
        const frameId = requestAnimationFrame(() => {
          startScanner();
        });
        return () => {
          cancelAnimationFrame(frameId);
          console.info("[QR]", "Modal closing, stopping scanner");
          stopScanner();
        };
      } else {
        console.info("[QR]", "Modal closed, stopping scanner");
        stopScanner();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
      <div
        ref={mountRef}
        className="h-full min-h-[62vh] w-full overflow-hidden rounded-[2rem]"
      />
    );
  }),
);

export default ScannerViewport;