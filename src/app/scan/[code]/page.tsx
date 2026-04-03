"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

type Phase = "join" | "scanning";

export default function ScannerJoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

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
  const [cameraError, setCameraError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lastStatus, setLastStatus] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/scan/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to join");
      return;
    }

    setSessionToken(data.sessionToken);
    setEventId(data.eventId);
    setPhase("scanning");
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      setCameraError("Could not access camera. Use gallery upload instead.");
    }
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadScan(new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  }

  async function uploadScan(file: File) {
    setUploading(true);
    setLastStatus("");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("sourceDetail", `scanner_${email}`);

    const res = await fetch(`/api/events/${eventId}/scans`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (res.ok) {
      setScanCount((c) => c + 1);
      setLastStatus("Captured");
      setTimeout(() => setLastStatus(""), 1500);
    } else {
      setLastStatus("Upload failed");
    }
  }

  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => uploadScan(f));
    e.target.value = "";
  }

  // Join phase
  if (phase === "join") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Fold</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Join scanning session
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Code: {code}
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Your email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
                placeholder="you@example.com"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Required for scan attribution
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {loading ? "Joining..." : "Join session"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Scanning phase — minimal scanner UI (E8: capture only)
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="text-lg font-bold">Fold Scanner</div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums">{scanCount}</div>
          <div className="text-xs text-neutral-500">scans</div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {lastStatus && (
          <div className={`rounded-md p-2 text-sm text-center ${
            lastStatus === "Captured"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            {lastStatus}
          </div>
        )}

        {cameraError && (
          <div className="rounded-md bg-yellow-50 p-2 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            {cameraError}
          </div>
        )}

        {cameraActive ? (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white/40 rounded-lg" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                disabled={uploading}
                className="flex-1 rounded-md bg-neutral-900 px-4 py-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {uploading ? "Saving..." : "Capture"}
              </button>
              <button
                onClick={stopCamera}
                className="rounded-md border border-neutral-300 px-4 py-4 text-sm dark:border-neutral-700"
              >
                Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={startCamera}
              className="w-full rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center hover:bg-neutral-50 dark:border-neutral-700"
            >
              <div className="text-lg font-medium">Open Camera</div>
              <div className="text-sm text-neutral-500 mt-1">Tap to start scanning cards</div>
            </button>

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
              className="w-full rounded-lg border border-neutral-300 p-4 text-center text-sm hover:bg-neutral-50 dark:border-neutral-700"
            >
              Upload from gallery
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-200 text-center text-xs text-neutral-400 dark:border-neutral-800">
        Scanning as {email}
      </div>
    </div>
  );
}
