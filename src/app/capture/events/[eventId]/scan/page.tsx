"use client";

import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { Upload, X, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { checkImageQuality } from "@/lib/image-quality";

type ScanPhase = "setup" | "camera" | "preview";

export default function CaptureScanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<ScanPhase>("setup");
  const [scanCount, setScanCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [extractionResult, setExtractionResult] = useState<Record<string, { value: string; confidence: string }> | null>(null);
  const [processingStatus, setProcessingStatus] = useState<"" | "uploading" | "extracting" | "done">("");

  // Fetch existing scan count
  useEffect(() => {
    fetch(`/api/events/${eventId}/scans`)
      .then((r) => r.json())
      .then((d) => setScanCount(Number(d.total) || 0))
      .catch(() => {});
  }, [eventId]);

  // ─── Camera controls ──────────────────────────────────────────────

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not available. HTTPS is required for camera access.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setPhase("camera");
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Please check permissions or use gallery upload.");
      }
    }
  }

  // Attach stream after video element renders
  useEffect(() => {
    if (phase === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); };
    }
  }, [phase]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPhase("setup");
  }

  // ─── Capture ──────────────────────────────────────────────────────

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);

    // ─── Client-side quality check (instant, free) ───────────────
    const quality = checkImageQuality(c);
    if (!quality.pass) {
      setUploadError(quality.reason || "Image quality too low.");
      // Brief flash of the error, then auto-dismiss after 2s
      setTimeout(() => setUploadError(""), 2500);
      return; // Don't proceed to preview — stay on camera
    }

    // Generate preview URL
    const dataUrl = c.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(dataUrl);

    // Generate blob for upload
    c.toBlob((blob) => {
      if (blob) setCapturedBlob(blob);
    }, "image/jpeg", 0.92);

    // Pause the live feed (keep stream alive for retake)
    v.pause();
    setUploadError("");
    setPhase("preview");
  }

  // ─── Retake ───────────────────────────────────────────────────────

  function retake() {
    setPreviewUrl(null);
    setCapturedBlob(null);
    setUploadError("");
    // Resume the video
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play();
    }
    setPhase("camera");
  }

  // ─── Confirm & Upload ─────────────────────────────────────────────

  function goBackToCamera() {
    setExtractionResult(null);
    setPreviewUrl(null);
    setCapturedBlob(null);
    setProcessingStatus("");
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play();
    }
    setPhase("camera");
  }

  async function confirmAndUpload() {
    if (!capturedBlob) return;
    setUploading(true);
    setUploadError("");
    setProcessingStatus("uploading");

    const file = new File([capturedBlob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
    const fd = new FormData();
    fd.append("image", file);
    fd.append("sourceDetail", "camera");

    try {
      // Step 1: Upload to R2 (fast)
      const uploadRes = await fetch(`/api/events/${eventId}/scans`, { method: "POST", body: fd });
      const uploadData = await uploadRes.json().catch(() => ({}));

      if (uploadData.rejected) {
        setUploadError(uploadData.error || "This image was rejected.");
        setUploading(false);
        setProcessingStatus("");
        return;
      }

      if (!uploadRes.ok) {
        setUploadError(uploadData.error || "Upload failed. Try again.");
        setUploading(false);
        setProcessingStatus("");
        return;
      }

      setScanCount((c) => c + 1);
      setProcessingStatus("extracting");

      // Step 2: Trigger AI extraction (separate call)
      try {
        const extractRes = await fetch(`/api/events/${eventId}/scans/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId: uploadData.recordId || uploadData.id }),
        });
        const extractData = await extractRes.json().catch(() => ({}));

        if (extractData.rejected) {
          // AI found no useful data — record was deleted
          setScanCount((c) => Math.max(0, c - 1));
          setUploadError(extractData.error || "No readable data found on this card.");
          setUploading(false);
          setProcessingStatus("");
          return;
        }

        if (extractData.fields) {
          setExtractionResult(extractData.fields);
          setUploading(false);
          setProcessingStatus("done");
          // Auto-advance after showing results
          setTimeout(() => goBackToCamera(), 2500);
          return;
        }
      } catch {
        // Extraction failed but upload succeeded — that's fine
        console.log("Extraction request failed, record saved as captured");
      }

      // Upload OK, extraction skipped or failed — go back to camera
      setUploading(false);
      setProcessingStatus("");
      goBackToCamera();
    } catch {
      setUploadError("Network error. Check your connection and try again.");
      setUploading(false);
      setProcessingStatus("");
    }
  }

  // ─── Gallery upload ───────────────────────────────────────────────

  async function handleGalleryUpload(files: FileList) {
    for (const file of Array.from(files)) {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("sourceDetail", "gallery");
      try {
        const res = await fetch(`/api/events/${eventId}/scans`, { method: "POST", body: fd });
        if (res.ok) setScanCount((c) => c + 1);
      } catch {}
      setUploading(false);
    }
  }

  // ═══ SETUP PHASE ══════════════════════════════════════════════════

  if (phase === "setup") {
    return (
      <div style={{ background: "var(--fold-bg-grouped)", minHeight: "100%" }}>
        <PageHeader title="Scan cards" back={`/capture/events/${eventId}`} />

        <div style={{ padding: "var(--fold-space-6) var(--fold-space-5)", display: "flex", flexDirection: "column", gap: "var(--fold-space-3)" }}>
          {cameraError && (
            <div style={{ background: "var(--fold-error-light)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "var(--fold-error)" }}>
              {cameraError}
            </div>
          )}

          {scanCount > 0 && (
            <div style={{ textAlign: "center", padding: "var(--fold-space-2) 0", fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>
              {scanCount} card{scanCount !== 1 ? "s" : ""} captured
            </div>
          )}

          <Button onClick={startCamera}>Start scanning</Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => { if (e.target.files) handleGalleryUpload(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Upload from gallery
          </Button>
        </div>
      </div>
    );
  }

  // ═══ PREVIEW PHASE ════════════════════════════════════════════════

  if (phase === "preview" && previewUrl) {
    return (
      <div style={{ background: "#1A1A2E", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
        {/* Captured image preview */}
        <img
          src={previewUrl}
          alt="Captured card"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Overlay gradient for readability */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, rgba(0,0,0,0.7))", zIndex: 5 }} />

        {/* Top bar */}
        <div style={{ position: "relative", zIndex: 10, padding: "52px var(--fold-space-5) 0" }}>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "var(--fold-type-subhead)", fontWeight: 500 }}>
            {processingStatus === "uploading" ? "Uploading..." : processingStatus === "extracting" ? "Reading card..." : processingStatus === "done" ? "Done" : "Review capture"}
          </span>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div style={{ position: "relative", zIndex: 10, margin: "var(--fold-space-3) var(--fold-space-5) 0", background: "rgba(192,57,43,0.9)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "#fff" }}>
            {uploadError}
          </div>
        )}

        {/* Extraction results overlay */}
        {extractionResult && (
          <div style={{ position: "relative", zIndex: 10, margin: "var(--fold-space-3) var(--fold-space-5) 0", background: "rgba(0,0,0,0.75)", padding: "var(--fold-space-4)", borderRadius: "var(--fold-radius-md)", backdropFilter: "blur(8px)" }}>
            <div style={{ fontSize: "var(--fold-type-caption)", color: "var(--fold-accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--fold-space-2)" }}>
              Extracted
            </div>
            {Object.entries(extractionResult).map(([key, data]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "var(--fold-space-1) 0" }}>
                <span style={{ fontSize: "var(--fold-type-footnote)", color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{key.replace("_", " ")}</span>
                <span style={{ fontSize: "var(--fold-type-subhead)", color: data.value ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                  {data.value || "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "0 var(--fold-space-5) var(--fold-space-8)" }}>
          {/* Status text */}
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "var(--fold-type-footnote)", textAlign: "center", marginBottom: "var(--fold-space-4)" }}>
            {processingStatus === "uploading" ? "Saving image..." : processingStatus === "extracting" ? "AI is reading the card..." : processingStatus === "done" ? "Extraction complete" : "Is the card clearly visible and within frame?"}
          </p>

          {/* Progress bar during upload */}
          {uploading && (
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.2)", marginBottom: "var(--fold-space-4)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: "var(--fold-accent)", width: "100%", animation: "progress 1.5s ease-in-out infinite" }} />
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--fold-space-4)", justifyContent: "center" }}>
            {/* Retake */}
            <button
              onClick={retake}
              disabled={uploading}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-1)",
                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.9)",
                opacity: uploading ? 0.4 : 1,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "var(--fold-radius-full)", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RotateCcw size={22} />
              </div>
              <span style={{ fontSize: "var(--fold-type-caption)", fontWeight: 500 }}>Retake</span>
            </button>

            {/* Confirm */}
            <button
              onClick={confirmAndUpload}
              disabled={uploading}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-1)",
                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.9)",
                opacity: uploading ? 0.4 : 1,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "var(--fold-radius-full)", background: "var(--fold-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={24} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: "var(--fold-type-caption)", fontWeight: 500 }}>Confirm</span>
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }

  // ═══ CAMERA PHASE ═════════════════════════════════════════════════

  return (
    <div style={{ background: "#1A1A2E", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Viewfinder rectangle */}
      <div style={{ position: "absolute", top: "20%", left: "8%", right: "8%", bottom: "30%", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "var(--fold-radius-md)", pointerEvents: "none" }} />

      {/* Corner markers */}
      <div style={{ position: "absolute", top: "20%", left: "8%", width: 24, height: 24, borderTop: "3px solid var(--fold-accent)", borderLeft: "3px solid var(--fold-accent)", borderRadius: "2px 0 0 0" }} />
      <div style={{ position: "absolute", top: "20%", right: "8%", width: 24, height: 24, borderTop: "3px solid var(--fold-accent)", borderRight: "3px solid var(--fold-accent)", borderRadius: "0 2px 0 0" }} />
      <div style={{ position: "absolute", bottom: "30%", left: "8%", width: 24, height: 24, borderBottom: "3px solid var(--fold-accent)", borderLeft: "3px solid var(--fold-accent)", borderRadius: "0 0 0 2px" }} />
      <div style={{ position: "absolute", bottom: "30%", right: "8%", width: 24, height: 24, borderBottom: "3px solid var(--fold-accent)", borderRight: "3px solid var(--fold-accent)", borderRadius: "0 0 2px 0" }} />

      {/* Hint text or quality error */}
      <div style={{ position: "absolute", top: "15%", left: 0, right: 0, textAlign: "center", zIndex: 10, padding: "0 var(--fold-space-5)" }}>
        {uploadError ? (
          <div style={{ background: "rgba(192,57,43,0.9)", padding: "var(--fold-space-3)", borderRadius: "var(--fold-radius-sm)", fontSize: "var(--fold-type-subhead)", color: "#fff", animation: "fadeIn 200ms ease-out" }}>
            {uploadError}
          </div>
        ) : (
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "var(--fold-type-footnote)", fontWeight: 500 }}>
            Align the card within the frame
          </span>
        )}
      </div>

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px var(--fold-space-5) 0" }}>
        <button onClick={stopCamera} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", cursor: "pointer", padding: "var(--fold-space-2)" }}>
          <X size={24} />
        </button>
        <div style={{ background: "rgba(0,0,0,0.5)", padding: "var(--fold-space-1) var(--fold-space-3)", borderRadius: "var(--fold-radius-full)", color: "#fff", fontSize: "var(--fold-type-subhead)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {scanCount} captured
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 0 var(--fold-space-10)" }}>
        {/* Shutter button */}
        <button
          onClick={capturePhoto}
          style={{
            width: 72, height: 72, borderRadius: "var(--fold-radius-full)",
            border: "4px solid rgba(255,255,255,0.8)", background: "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 100ms ease",
          }}
          onPointerDown={(e) => { (e.target as HTMLElement).style.transform = "scale(0.92)"; }}
          onPointerUp={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: "var(--fold-radius-full)", background: "rgba(255,255,255,0.95)" }} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => { if (e.target.files) handleGalleryUpload(e.target.files); e.target.value = ""; }}
        style={{ display: "none" }}
      />
    </div>
  );
}
