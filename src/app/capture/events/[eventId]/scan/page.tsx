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

export default function CaptureScanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    fetch(`/api/events/${eventId}/scans`)
      .then((r) => r.json())
      .then((d) => setScanCount(d.total || 0))
      .catch(() => {});
    if (typeof indexedDB !== "undefined") {
      getPendingScanCount().then(setPendingCount).catch(() => {});
    }
    setIsOnline(navigator.onLine);
    const on = () => { setIsOnline(true); handleSync(); };
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [eventId]);

  async function handleSync() {
    const result = await syncPendingScans();
    setScanCount((c) => c + result.synced);
    setPendingCount(await getPendingScanCount());
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
    } catch { setCameraError("Camera not available. Use gallery upload."); }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob(async (blob) => {
      if (!blob) return;
      await uploadOrQueue(new File([blob], `cap-${Date.now()}.jpg`, { type: "image/jpeg" }), "camera");
    }, "image/jpeg", 0.9);
  }

  async function uploadOrQueue(file: File, source: string) {
    if (!isOnline) {
      await savePendingScan({ id: crypto.randomUUID(), eventId: eventId!, imageBlob: file, sourceDetail: source, capturedAt: Date.now(), retryCount: 0 });
      setPendingCount((c) => c + 1); setScanCount((c) => c + 1);
      showFlash("Saved offline"); return;
    }
    setUploading(true);
    const fd = new FormData(); fd.append("image", file); fd.append("sourceDetail", source);
    try {
      const res = await fetch(`/api/events/${eventId}/scans`, { method: "POST", body: fd });
      if (res.ok) { setScanCount((c) => c + 1); showFlash("Captured"); }
      else { await savePendingScan({ id: crypto.randomUUID(), eventId: eventId!, imageBlob: file, sourceDetail: source, capturedAt: Date.now(), retryCount: 0 }); setPendingCount((c) => c + 1); setScanCount((c) => c + 1); showFlash("Saved offline"); }
    } catch { await savePendingScan({ id: crypto.randomUUID(), eventId: eventId!, imageBlob: file, sourceDetail: source, capturedAt: Date.now(), retryCount: 0 }); setPendingCount((c) => c + 1); setScanCount((c) => c + 1); showFlash("Saved offline"); }
    setUploading(false);
  }

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 1500); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/capture/events/${eventId}`} className="text-sm text-neutral-500">&larr; Back</Link>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">{scanCount}</div>
          <div className="text-xs text-neutral-500">scans</div>
        </div>
      </div>

      {!isOnline && <div className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">Offline mode — scans saved locally</div>}
      {pendingCount > 0 && <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{pendingCount} pending sync {isOnline && <button onClick={handleSync} className="underline ml-1">Sync now</button>}</div>}
      {flash && <div className="rounded-xl bg-green-50 p-3 text-sm text-center text-green-700 dark:bg-green-900/20 dark:text-green-400">{flash}</div>}
      {cameraError && <div className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">{cameraError}</div>}

      {cameraActive ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border-2 border-white/40 rounded-xl" />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <button onClick={capturePhoto} disabled={uploading} className="flex-1 rounded-xl bg-neutral-900 py-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900">
              {uploading ? "Saving..." : "Capture"}
            </button>
            <button onClick={stopCamera} className="rounded-xl border border-neutral-300 px-6 py-4 text-sm dark:border-neutral-700">Stop</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={startCamera} className="w-full rounded-xl border-2 border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
            <div className="text-lg font-medium">Open Camera</div>
            <div className="text-sm text-neutral-500 mt-1">Tap to scan cards</div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach((f) => uploadOrQueue(f, "gallery")); e.target.value = ""; }} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border border-neutral-300 p-4 text-center text-sm dark:border-neutral-700">
            Upload from gallery
          </button>
        </div>
      )}
    </div>
  );
}
