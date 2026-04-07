"use client";

import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { savePendingScan, getPendingScanCount, syncPendingScans, type PendingScan } from "@/lib/offline-store";

export default function CaptureScanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [expectedCount] = useState(30);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch(`/api/events/${eventId}/scans`).then((r) => r.json()).then((d) => setScanCount(d.total || 0)).catch(() => {});
    if (typeof indexedDB !== "undefined") getPendingScanCount().then(setPendingCount).catch(() => {});
    setIsOnline(navigator.onLine);
    const on = () => { setIsOnline(true); syncPendingScans().then((r) => { setScanCount((c) => c + r.synced); getPendingScanCount().then(setPendingCount); }); };
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [eventId]);

  const [cameraError, setCameraError] = useState("");

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not available. HTTPS is required for camera access on deployed apps.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } });
      streamRef.current = stream;
      setCameraActive(true); // triggers re-render with <video> element
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Please check permissions or use gallery upload instead.");
      }
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
      setPendingCount((c) => c + 1); setScanCount((c) => c + 1); return;
    }
    setUploading(true);
    const fd = new FormData(); fd.append("image", file); fd.append("sourceDetail", source);
    try {
      const res = await fetch(`/api/events/${eventId}/scans`, { method: "POST", body: fd });
      if (res.ok) setScanCount((c) => c + 1);
    } catch { await savePendingScan({ id: crypto.randomUUID(), eventId: eventId!, imageBlob: file, sourceDetail: source, capturedAt: Date.now(), retryCount: 0 }); setPendingCount((c) => c + 1); setScanCount((c) => c + 1); }
    setUploading(false);
  }

  // Pre-scan setup
  if (!cameraActive) {
    return (
      <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
        <PageHeader title="Scan cards" back={`/capture/events/${eventId}`} />

        <div style={{ padding: "var(--fold-space-6) var(--fold-space-5)", display: "flex", flexDirection: "column", gap: "var(--fold-space-3)" }}>
          {cameraError && (
            <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
              {cameraError}
            </div>
          )}
          <Button onClick={startCamera}>Start scanning</Button>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach((f) => uploadOrQueue(f, "gallery")); e.target.value = ""; }} style={{ display: "none" }} />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Upload from gallery
          </Button>

          {pendingCount > 0 && (
            <div style={{ background: "var(--fold-info-light)", padding: "var(--fold-space-3) var(--fold-space-4)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-info)" }}>
              {pendingCount} scan{pendingCount > 1 ? "s" : ""} waiting to sync
            </div>
          )}
        </div>
      </div>
    );
  }

  // Camera viewfinder
  return (
    <div style={{ background: "#1A1A2E", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Viewfinder rectangle */}
      <div style={{ position: "absolute", top: "28%", left: "14%", right: "14%", bottom: "30%", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "var(--fold-radius-sm)" }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px var(--fold-space-4) 0" }}>
        <button onClick={stopCamera} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", fontSize: "var(--fold-type-headline)", fontWeight: 500, cursor: "pointer" }}>
          Done
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-2)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "var(--fold-radius-full)", background: "#10B981" }} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--fold-type-subhead)" }}>1 scanner</span>
        </div>
        <div style={{ background: "var(--fold-info)", padding: "var(--fold-space-1) var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", color: "var(--fold-text-inverse)", fontSize: "var(--fold-type-subhead)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {scanCount} / {expectedCount}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 var(--fold-space-8) var(--fold-space-8)" }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-1)", cursor: "pointer" }}>
          <Upload size={24} />
          <span style={{ fontSize: "var(--fold-type-caption)" }}>Upload</span>
        </button>

        <button onClick={capturePhoto} disabled={uploading} style={{ width: 72, height: 72, borderRadius: "var(--fold-radius-full)", border: "3px solid rgba(255,255,255,0.8)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: uploading ? 0.5 : 1 }}>
          <div style={{ width: 56, height: 56, borderRadius: "var(--fold-radius-full)", background: "rgba(255,255,255,0.9)" }} />
        </button>

        <div style={{ width: 48 }} />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach((f) => uploadOrQueue(f, "gallery")); e.target.value = ""; }} style={{ display: "none" }} />
    </div>
  );
}
