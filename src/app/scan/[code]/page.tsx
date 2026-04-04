"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

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
  const [sessionToken, setSessionToken] = useState("");
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
    setSessionToken(data.sessionToken);
    setEventId(data.eventId);
    setPhase("scanning");
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
    } catch { /* */ }
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

  // Join phase (S-1)
  if (phase === "join") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "0 20px" }}>
        <div style={{ width: "100%", maxWidth: 393, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 0" }}>
          <h1 style={{ fontSize: "var(--font-heading)", fontWeight: 700, color: "var(--brand)" }}>Fold</h1>
          <h2 style={{ fontSize: "var(--font-body-lg)", fontWeight: 600, color: "var(--text-primary)" }}>Join scanning session</h2>

          {/* Event card */}
          <div style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: 20 }}>
            <div style={{ fontSize: "var(--font-body-lg)", fontWeight: 600, color: "var(--text-primary)" }}>Event</div>
            <div style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)", marginTop: 4 }}>Code: {code}</div>
          </div>

          {error && <div style={{ width: "100%", background: "var(--error-light)", padding: 12, borderRadius: 4, fontSize: "var(--font-body-sm)", color: "var(--error)" }}>{error}</div>}

          <form onSubmit={handleJoin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="input-label">Your email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Joining..." : "Join session"}
            </button>
          </form>

          <p style={{ fontSize: "var(--font-caption)", color: "var(--text-secondary)", textAlign: "center" }}>
            You will only have access to scan cards for this event
          </p>
        </div>
      </div>
    );
  }

  // Scanning phase — minimal scanner UI
  return (
    <div style={{ background: "#1A1A2E", height: "100vh", position: "relative", display: "flex", flexDirection: "column" }}>
      {cameraActive ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ position: "absolute", top: 226, left: 56, width: 280, height: 400, border: "2px solid rgba(255,255,255,0.3)", borderRadius: 4 }} />

          <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", padding: "52px 16px 0" }}>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "var(--font-body-lg)", fontWeight: 500 }}>Fold Scanner</span>
            <div style={{ background: "var(--scan-accent)", padding: "4px 12px", borderRadius: 4, color: "var(--foreground-inverse)", fontSize: "var(--font-body-sm)", fontWeight: 600 }}>
              {scanCount}
            </div>
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 0 48px" }}>
            <button onClick={capturePhoto} disabled={uploading} style={{ width: 72, height: 72, borderRadius: 9999, border: "3px solid rgba(255,255,255,0.8)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 9999, background: "rgba(255,255,255,0.9)" }} />
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--font-body-lg)" }}>Ready to scan</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--font-body-sm)", textAlign: "center" }}>Scanning as {email}</p>
          <button onClick={startCamera} style={{ padding: "12px 32px", background: "var(--scan-accent)", color: "var(--foreground-inverse)", border: "none", borderRadius: 9999, fontSize: "var(--font-body-lg)", fontWeight: 500, cursor: "pointer" }}>
            Open camera
          </button>
        </div>
      )}
    </div>
  );
}
