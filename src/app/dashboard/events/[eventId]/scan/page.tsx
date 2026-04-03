"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";

export default function ScanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  // Fetch current scan count
  useEffect(() => {
    fetch(`/api/events/${eventId}/scans`)
      .then((res) => res.json())
      .then((data) => setScanCount(data.total || 0));
  }, [eventId]);

  // Start camera
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
    } catch (err) {
      setCameraError(
        "Could not access camera. Please check your browser permissions and try again, or use gallery upload instead."
      );
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  // Capture from camera
  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      await uploadImage(file, "camera");
    }, "image/jpeg", 0.9);
  }

  // Upload image
  async function uploadImage(file: File, source: string) {
    setUploading(true);
    setLastUpload(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("sourceDetail", source);

    const res = await fetch(`/api/events/${eventId}/scans`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (res.ok) {
      setScanCount((c) => c + 1);
      setLastUpload("Scan captured successfully");
      setTimeout(() => setLastUpload(null), 2000);
    } else {
      const data = await res.json();
      setLastUpload(`Error: ${data.error}`);
    }
  }

  // Gallery upload (single)
  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    handleFiles(Array.from(files));
    e.target.value = "";
  }

  // Batch upload
  async function handleFiles(files: File[]) {
    for (const file of files) {
      const source = files.length > 1 ? "batch_upload" : "gallery";
      await uploadImage(file, source);
    }
  }

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
            <div className="text-3xl font-bold tabular-nums">{scanCount}</div>
            <div className="text-xs text-neutral-500">scans captured</div>
          </div>
        </div>
      </div>

      {/* Status messages */}
      {lastUpload && (
        <div
          className={`rounded-md p-3 text-sm ${
            lastUpload.startsWith("Error")
              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
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
            {/* Alignment guide overlay */}
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
              {uploading ? "Uploading..." : "Capture"}
            </button>
            <button
              onClick={stopCamera}
              className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Stop camera
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
    </div>
  );
}
