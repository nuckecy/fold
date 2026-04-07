"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Phase = "join" | "scanning";

export default function ScannerJoinPage() {
  const { code } = useParams<{ code: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("join");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/scan/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, email }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to join"); return; }
    setEventId(data.eventId);
    setPhase("scanning");
  }

  const [cameraError, setCameraError] = useState("");

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not available. HTTPS is required for camera access.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); };
        setCameraActive(true);
      }
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Check permissions or use gallery upload.");
      }
    }
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      const fd = new FormData(); fd.append("image", new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" })); fd.append("sourceDetail", `scanner_${email}`);
      const res = await fetch(`/api/events/${eventId}/scans`, { method: "POST", body: fd });
      if (res.ok) setScanCount((c) => c + 1);
      setUploading(false);
    }, "image/jpeg", 0.9);
  }

  // Join phase
  if (phase === "join") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--fold-bg)", padding: "0 var(--fold-space-5)" }}>
        <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-4)", padding: "var(--fold-space-10) 0" }}>
          <h1 style={{ fontSize: "var(--fold-type-title1)", fontWeight: 700, color: "var(--fold-accent)", letterSpacing: "-0.03em" }}>Fold</h1>
          <h2 style={{ fontSize: "var(--fold-type-headline)", fontWeight: 600, color: "var(--fold-text-primary)" }}>Join scanning session</h2>

          <div style={{ width: "100%", background: "var(--fold-bg-secondary)", borderRadius: "var(--fold-radius-md)", padding: "var(--fold-space-5)" }}>
            <div style={{ fontSize: "var(--fold-type-headline)", fontWeight: 600, color: "var(--fold-text-primary)" }}>Event</div>
            <div style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)", marginTop: "var(--fold-space-1)" }}>Code: {code}</div>
          </div>

          {error && <div style={{ width: "100%", background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>{error}</div>}

          <form onSubmit={handleJoin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--fold-space-4)" }}>
            <Input label="Your email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Button type="submit" loading={loading}>Join session</Button>
          </form>

          <p style={{ fontSize: "var(--fold-type-footnote)", color: "var(--fold-text-secondary)", textAlign: "center" }}>
            You will only have access to scan cards for this event
          </p>
        </div>
      </div>
    );
  }

  // Scanning phase
  return (
    <div style={{ background: "#1A1A2E", height: "100vh", position: "relative", display: "flex", flexDirection: "column" }}>
      {cameraActive ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ position: "absolute", top: "28%", left: "14%", right: "14%", bottom: "30%", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "var(--fold-radius-sm)" }} />

          <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", padding: "52px var(--fold-space-4) 0" }}>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "var(--fold-type-headline)", fontWeight: 500 }}>Fold Scanner</span>
            <div style={{ background: "var(--fold-info)", padding: "var(--fold-space-1) var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", color: "var(--fold-text-inverse)", fontSize: "var(--fold-type-subhead)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {scanCount}
            </div>
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 0 48px" }}>
            <button onClick={capturePhoto} disabled={uploading} style={{ width: 72, height: 72, borderRadius: "var(--fold-radius-full)", border: "3px solid rgba(255,255,255,0.8)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "var(--fold-radius-full)", background: "rgba(255,255,255,0.9)" }} />
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--fold-space-4)", padding: "var(--fold-space-8)" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--fold-type-headline)" }}>Ready to scan</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--fold-type-subhead)", textAlign: "center" }}>Scanning as {email}</p>
          {cameraError && (
            <div style={{ background: "rgba(192,57,43,0.15)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "#E74C3C", textAlign: "center" }}>
              {cameraError}
            </div>
          )}
          <button onClick={startCamera} style={{ padding: "var(--fold-space-3) var(--fold-space-8)", background: "var(--fold-info)", color: "var(--fold-text-inverse)", border: "none", borderRadius: "var(--fold-radius-md)", fontSize: "var(--fold-type-headline)", fontWeight: 500, cursor: "pointer" }}>
            Open camera
          </button>
        </div>
      )}
    </div>
  );
}
