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
