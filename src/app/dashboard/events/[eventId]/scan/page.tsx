"use client";

import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  savePendingScan,
  getPendingScanCount,
  syncPendingScans,
  type PendingScan,
} from "@/lib/offline-store";

type Phase = "setup" | "scanning" | "done";

export default function ScanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [expectedCount, setExpectedCount] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Fetch current scan count and pending count
  useEffect(() => {
    fetch(`/api/events/${eventId}/scans`)
      .then((res) => res.json())
      .then((data) => setScanCount(data.total || 0))
      .catch(() => {});

    if (typeof window !== "undefined" && "indexedDB" in window) {
      getPendingScanCount().then(setPendingCount).catch(() => {});
    }
  }, [eventId]);

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Auto-sync pending scans when online
  async function handleSync() {
    setSyncing(true);
    const result = await syncPendingScans();
    setScanCount((c) => c + result.synced);
    const remaining = await getPendingScanCount();
    setPendingCount(remaining);
    setSyncing(false);
    if (result.synced > 0) {
      setLastUpload(`Synced ${result.synced} offline scan${result.synced > 1 ? "s" : ""}`);
      setTimeout(() => setLastUpload(null), 3000);
    }
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        "Could not access camera. Please check your browser permissions and try again, or use gallery upload instead."
      );
    }
  }

  // Attach stream to video element AFTER it renders
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); };
    }
  }, [cameraActive]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        await uploadOrQueue(file, "camera");
      },
      "image/jpeg",
      0.9
    );
  }

  async function uploadOrQueue(file: File, source: string) {
    if (!isOnline) {
      // Save to IndexedDB for later sync
      const scan: PendingScan = {
        id: crypto.randomUUID(),
        eventId: eventId!,
        imageBlob: file,
        sourceDetail: source,
        capturedAt: Date.now(),
        retryCount: 0,
      };
      await savePendingScan(scan);
      setPendingCount((c) => c + 1);
      setScanCount((c) => c + 1);
      setLastUpload("Saved offline (will sync when online)");
      setTimeout(() => setLastUpload(null), 2000);
      return;
    }

    setUploading(true);
    setLastUpload(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("sourceDetail", source);

    try {
      const res = await fetch(`/api/events/${eventId}/scans`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setScanCount((c) => c + 1);
        setLastUpload("Scan captured");
        setTimeout(() => setLastUpload(null), 2000);
      } else {
        // Network error — save offline
        const scan: PendingScan = {
          id: crypto.randomUUID(),
          eventId: eventId!,
          imageBlob: file,
          sourceDetail: source,
          capturedAt: Date.now(),
          retryCount: 0,
        };
        await savePendingScan(scan);
        setPendingCount((c) => c + 1);
        setScanCount((c) => c + 1);
        setLastUpload("Upload failed — saved offline");
        setTimeout(() => setLastUpload(null), 3000);
      }
    } catch {
      const scan: PendingScan = {
        id: crypto.randomUUID(),
        eventId: eventId!,
        imageBlob: file,
        sourceDetail: source,
        capturedAt: Date.now(),
        retryCount: 0,
      };
      await savePendingScan(scan);
      setPendingCount((c) => c + 1);
      setScanCount((c) => c + 1);
      setLastUpload("Network error — saved offline");
      setTimeout(() => setLastUpload(null), 3000);
    }

    setUploading(false);
  }

  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    handleFiles(Array.from(files));
    e.target.value = "";
  }

  async function handleFiles(files: File[]) {
    for (const file of files) {
      const source = files.length > 1 ? "batch_upload" : "gallery";
      await uploadOrQueue(file, source);
    }
  }

  const expected = expectedCount ? parseInt(expectedCount) : null;
  const progress =
    expected && expected > 0 ? Math.min(100, (scanCount / expected) * 100) : null;

  // Setup phase — ask for expected card count
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href={`/dashboard/events/${eventId}`}
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            &larr; Back to event
          </Link>
          <h1 className="text-2xl font-bold mt-2">Scan Cards</h1>
        </div>

        <div className="max-w-sm space-y-4">
          <div>
            <label
              htmlFor="expectedCount"
              className="block text-sm font-medium mb-1"
            >
              How many cards do you need to scan? (optional)
            </label>
            <input
              id="expectedCount"
              type="number"
              min="1"
              value={expectedCount}
              onChange={(e) => setExpectedCount(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
              placeholder="e.g. 25"
            />
            <p className="text-xs text-neutral-500 mt-1">
              This helps track your progress. You can skip this step.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPhase("scanning")}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Start scanning
            </button>
            <button
              onClick={() => {
                setExpectedCount("");
                setPhase("scanning");
              }}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scanning phase
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          &larr; Back to event
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold">Scan Cards</h1>
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums">
              {scanCount}
              {expected ? (
                <span className="text-lg text-neutral-400 font-normal">
                  /{expected}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-neutral-500">scans captured</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress >= 100
                  ? "bg-green-500"
                  : "bg-neutral-900 dark:bg-neutral-100"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-neutral-500">
            {progress >= 100
              ? "All expected cards scanned!"
              : `${Math.round(progress)}% complete`}
          </div>
        </div>
      )}

      {/* Online/offline indicator */}
      {!isOnline && (
        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          You are offline. Scans will be saved locally and synced when you reconnect.
        </div>
      )}

      {/* Pending sync indicator */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          <span>
            {pendingCount} scan{pendingCount > 1 ? "s" : ""} waiting to sync
          </span>
          {isOnline && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-xs font-medium underline"
            >
              {syncing ? "Syncing..." : "Sync now"}
            </button>
          )}
        </div>
      )}

      {/* Status messages */}
      {lastUpload && (
        <div
          className={`rounded-md p-3 text-sm ${
            lastUpload.includes("Error") || lastUpload.includes("failed")
              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              : lastUpload.includes("offline")
                ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          }`}
        >
          {lastUpload}
        </div>
      )}

      {cameraError && (
        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          {cameraError}
        </div>
      )}

      {/* Camera view */}
      {cameraActive ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border-2 border-white/40 rounded-lg" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                Align card within the frame
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              disabled={uploading}
              className="flex-1 rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {uploading ? "Saving..." : "Capture"}
            </button>
            <button
              onClick={stopCamera}
              className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            className="w-full rounded-lg border-2 border-dashed border-neutral-300 p-8 text-center hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          >
            <div className="text-lg font-medium">Open Camera</div>
            <div className="text-sm text-neutral-500 mt-1">
              Capture registration cards using your device camera
            </div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-neutral-500">or</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-lg border-2 border-dashed border-neutral-300 p-8 text-center hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          >
            <div className="text-lg font-medium">
              {uploading ? "Uploading..." : "Upload from Gallery"}
            </div>
            <div className="text-sm text-neutral-500 mt-1">
              Select one or more images from your device
            </div>
          </button>
        </div>
      )}

      {/* Done button */}
      <button
        onClick={() => stopCamera()}
        className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <Link href={`/dashboard/events/${eventId}`}>
          Finish scanning ({scanCount} captured)
        </Link>
      </button>
    </div>
  );
}
