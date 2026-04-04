"use client";

import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { savePendingScan, getPendingScanCount, syncPendingScans, type PendingScan } from "@/lib/offline-store";

export default function CaptureScanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
    } catch { /* camera not available */ }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); videoRef.current.srcObject = null; }
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

  // If camera not started, show pre-scan setup
  if (!cameraActive) {
    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <div className="page-header">
          <Link href={`/capture/events/${eventId}`} style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "var(--font-title)", color: "var(--text-primary)" }}>&larr;</span>
          </Link>
          <span className="title" style={{ flex: 1 }}>Scan cards</span>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={startCamera} className="btn-primary">
              Start scanning
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach((f) => uploadOrQueue(f, "gallery")); e.target.value = ""; }} style={{ display: "none" }} />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
              Upload from gallery
            </button>
          </div>

          {pendingCount > 0 && (
            <div style={{ background: "var(--info-light)", padding: 12, borderRadius: 4, fontSize: "var(--font-body-sm)", color: "var(--info)" }}>
              {pendingCount} scan{pendingCount > 1 ? "s" : ""} waiting to sync
            </div>
          )}
        </div>
      </div>
    );
  }

  // Camera viewfinder (A-19)
  return (
    <div style={{ background: "#1A1A2E", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
      {/* Video */}
      <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Viewfinder overlay */}
      <div style={{ position: "absolute", top: 226, left: 56, width: 280, height: 400, border: "2px solid rgba(255,255,255,0.3)", borderRadius: 4 }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 16px 0" }}>
        <button onClick={stopCamera} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", fontSize: "var(--font-body-lg)", fontWeight: 500, cursor: "pointer" }}>
          Done
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 9999, background: "#10B981" }} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--font-body-sm)" }}>1 scanner</span>
        </div>
        <div style={{ background: "var(--scan-accent)", padding: "4px 12px", borderRadius: 4, color: "var(--foreground-inverse)", fontSize: "var(--font-body-sm)", fontWeight: 600 }}>
          {scanCount} / {expectedCount}
        </div>
      </div>

      {/* Scan count detail */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "right", padding: "4px 16px 0" }}>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "var(--font-caption)" }}>You: {scanCount}</span>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px 32px" }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <Upload size={24} />
          <span style={{ fontSize: "var(--font-caption)" }}>Upload</span>
        </button>

        {/* Capture button */}
        <button
          onClick={capturePhoto}
          disabled={uploading}
          style={{
            width: 72,
            height: 72,
            borderRadius: 9999,
            border: "3px solid rgba(255,255,255,0.8)",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 9999, background: "rgba(255,255,255,0.9)" }} />
        </button>

        <div style={{ width: 48 }} /> {/* Spacer */}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach((f) => uploadOrQueue(f, "gallery")); e.target.value = ""; }} style={{ display: "none" }} />
    </div>
  );
}
