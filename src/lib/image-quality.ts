/**
 * Client-side image quality checks — runs on the canvas immediately after capture.
 * No network calls, no API costs. Instant feedback.
 */

interface QualityResult {
  pass: boolean;
  reason?: string;
}

/**
 * Analyze a canvas element for image quality issues.
 * Returns pass/fail with a human-readable reason.
 */
export function checkImageQuality(canvas: HTMLCanvasElement): QualityResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { pass: true };

  // Sample a region in the center (where the card should be)
  const w = canvas.width;
  const h = canvas.height;
  const sampleX = Math.floor(w * 0.15);
  const sampleY = Math.floor(h * 0.2);
  const sampleW = Math.floor(w * 0.7);
  const sampleH = Math.floor(h * 0.5);

  const imageData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
  const pixels = imageData.data;
  const totalPixels = sampleW * sampleH;

  // ─── Check 1: Too dark ────────────────────────────────────────────
  let totalBrightness = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    totalBrightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
  }
  const avgBrightness = totalBrightness / totalPixels;

  if (avgBrightness < 30) {
    return { pass: false, reason: "Image is too dark. Please ensure good lighting and try again." };
  }

  // ─── Check 2: Too bright / overexposed ────────────────────────────
  if (avgBrightness > 245) {
    return { pass: false, reason: "Image is overexposed. Avoid direct light on the card." };
  }

  // ─── Check 3: Low variance = uniform color (blank wall, sky, etc) ─
  let sumSqDiff = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    sumSqDiff += (brightness - avgBrightness) ** 2;
  }
  const variance = sumSqDiff / totalPixels;

  if (variance < 50) {
    return { pass: false, reason: "The image appears blank or uniform. Please capture a card with text." };
  }

  // ─── Check 4: Blur detection (edge contrast) ─────────────────────
  // Sample horizontal edges using Sobel-like differences
  let edgeSum = 0;
  let edgeCount = 0;
  const stride = sampleW * 4;

  // Sample every 4th pixel for performance
  for (let y = 1; y < sampleH - 1; y += 4) {
    for (let x = 1; x < sampleW - 1; x += 4) {
      const idx = (y * sampleW + x) * 4;
      const left = (pixels[idx - 4] + pixels[idx - 3] + pixels[idx - 2]) / 3;
      const right = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
      const above = (pixels[idx - stride] + pixels[idx - stride + 1] + pixels[idx - stride + 2]) / 3;
      const below = (pixels[idx + stride] + pixels[idx + stride + 1] + pixels[idx + stride + 2]) / 3;

      const gx = Math.abs(right - left);
      const gy = Math.abs(below - above);
      edgeSum += Math.sqrt(gx * gx + gy * gy);
      edgeCount++;
    }
  }
  const avgEdge = edgeCount > 0 ? edgeSum / edgeCount : 0;

  if (avgEdge < 3) {
    return { pass: false, reason: "The image appears blurry. Hold the camera steady and ensure the card is in focus." };
  }

  // ─── Check 5: Skin tone detection (selfie check) ─────────────────
  // Count pixels that match common skin tone ranges
  let skinPixels = 0;
  for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Skin tone heuristic (works across skin colors)
    const isSkin =
      r > 60 && g > 40 && b > 20 &&
      r > g && r > b &&
      Math.abs(r - g) > 15 &&
      r - b > 15;

    if (isSkin) skinPixels++;
  }

  const skinRatio = skinPixels / (totalPixels / 4);
  if (skinRatio > 0.45) {
    return { pass: false, reason: "This looks like a selfie or close-up of skin. Please capture a registration card instead." };
  }

  return { pass: true };
}

/**
 * Real-time text detection for live camera feed.
 * Analyzes a canvas frame for handwriting/text presence.
 * Runs at ~10fps, must complete in <50ms.
 */
export interface TextDetectionResult {
  confidence: number; // 0-1
  hasText: boolean;    // confidence > 0.6
  isReady: boolean;    // confidence > 0.8 (auto-capture threshold)
}

export function detectTextPresence(canvas: HTMLCanvasElement): TextDetectionResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { confidence: 0, hasText: false, isReady: false };

  const w = canvas.width;
  const h = canvas.height;

  // Sample the center 80% of the frame
  const sx = Math.floor(w * 0.1);
  const sy = Math.floor(h * 0.1);
  const sw = Math.floor(w * 0.8);
  const sh = Math.floor(h * 0.8);

  const imageData = ctx.getImageData(sx, sy, sw, sh);
  const pixels = imageData.data;
  const totalPixels = sw * sh;

  // ─── 1. Edge density (Sobel) ──────────────────────────────────────
  // Text/handwriting creates many sharp edges in localized clusters
  let strongEdges = 0;
  let totalEdge = 0;
  let edgeSamples = 0;
  const stride = sw * 4;
  const edgeThreshold = 25; // pixel brightness difference to count as "edge"

  for (let y = 1; y < sh - 1; y += 3) {
    for (let x = 1; x < sw - 1; x += 3) {
      const idx = (y * sw + x) * 4;
      const c = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      const r = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
      const b = (pixels[idx + stride] + pixels[idx + stride + 1] + pixels[idx + stride + 2]) / 3;

      const gx = Math.abs(r - c);
      const gy = Math.abs(b - c);
      const edge = Math.max(gx, gy);

      totalEdge += edge;
      edgeSamples++;
      if (edge > edgeThreshold) strongEdges++;
    }
  }

  const edgeDensity = edgeSamples > 0 ? strongEdges / edgeSamples : 0;
  const avgEdge = edgeSamples > 0 ? totalEdge / edgeSamples : 0;

  // ─── 2. Contrast ratio (paper + ink = high local contrast) ────────
  // Handwriting on paper: bright background with dark strokes
  let brightPixels = 0;
  let darkPixels = 0;

  for (let i = 0; i < pixels.length; i += 12) { // Every 3rd pixel
    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    if (brightness > 180) brightPixels++;
    else if (brightness < 80) darkPixels++;
  }

  const sampledPixels = totalPixels / 3;
  const brightRatio = brightPixels / sampledPixels;
  const darkRatio = darkPixels / sampledPixels;
  // Good card: lots of bright (paper) with some dark (ink)
  const contrastScore = Math.min(brightRatio * 1.2, 1) * Math.min(darkRatio * 8, 1);

  // ─── 3. Edge clustering (text has edges in horizontal bands) ──────
  // Divide frame into horizontal strips and measure edge variance
  const strips = 8;
  const stripH = Math.floor(sh / strips);
  const stripEdges: number[] = [];

  for (let s = 0; s < strips; s++) {
    let stripEdgeCount = 0;
    const yStart = s * stripH;
    const yEnd = Math.min(yStart + stripH, sh - 1);

    for (let y = yStart + 1; y < yEnd; y += 4) {
      for (let x = 1; x < sw - 1; x += 4) {
        const idx = (y * sw + x) * 4;
        const c = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        const r = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
        if (Math.abs(r - c) > edgeThreshold) stripEdgeCount++;
      }
    }
    stripEdges.push(stripEdgeCount);
  }

  // Text has uneven distribution (some strips have text, others are blank)
  const avgStripEdge = stripEdges.reduce((a, b) => a + b, 0) / strips;
  let stripVariance = 0;
  for (const se of stripEdges) {
    stripVariance += (se - avgStripEdge) ** 2;
  }
  stripVariance /= strips;
  const clusterScore = Math.min(stripVariance / (avgStripEdge * avgStripEdge + 1), 1);

  // ─── Combine scores ──────────────────────────────────────────────
  // Edge density: 0-1, higher = more edges = likely text
  // Contrast: 0-1, higher = bright paper + dark ink
  // Cluster: 0-1, higher = edges concentrated in bands (text lines)
  const edgeScore = Math.min(edgeDensity * 5, 1);

  const confidence = (edgeScore * 0.4 + contrastScore * 0.35 + clusterScore * 0.25);

  return {
    confidence,
    hasText: confidence > 0.35,
    isReady: confidence > 0.55,
  };
}
