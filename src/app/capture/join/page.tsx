"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function JoinSessionPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div style={{ background: "var(--fold-bg)", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader title="Join session" back="/capture" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-5)", padding: "0 var(--fold-space-5)" }}>
        {error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--fold-space-4)", paddingTop: "var(--fold-space-10)", textAlign: "center" }}>
            <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>{error}</p>
            <Button onClick={() => { setError(""); startCamera(); }}>Try again</Button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)", textAlign: "center" }}>
              Point your camera at the QR code to join a scanning session.
            </p>

            {/* Camera viewfinder */}
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: 320,
              aspectRatio: "1",
              borderRadius: "var(--fold-radius-md)",
              overflow: "hidden",
              background: "#000",
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Scan overlay frame */}
              <div style={{
                position: "absolute",
                inset: "15%",
                border: "2px solid var(--fold-accent)",
                borderRadius: "var(--fold-radius-sm)",
                pointerEvents: "none",
              }} />
            </div>

            {scanning && (
              <p style={{ fontSize: "var(--fold-type-caption)", color: "var(--fold-text-tertiary)" }}>
                Scanning...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
