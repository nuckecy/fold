/**
 * Image validation service — screens uploads before storage and AI extraction.
 *
 * Layer 1: File size and dimension checks (free, instant)
 * Layer 2: AI pre-screening with Gemini (cheap, fast — ~10 tokens)
 * Layer 3: Post-extraction validation (reject if zero useful data extracted)
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 10 * 1024; // 10KB — too small to be a real card photo

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Layer 1: Basic file validation (no API calls)
 */
export function validateFileBasics(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, reason: "Image is too large (max 10MB)" };
  }
  if (file.size < MIN_FILE_SIZE) {
    return { valid: false, reason: "Image is too small — ensure the card is clearly visible" };
  }
  return { valid: true };
}

/**
 * Layer 2: AI pre-screening — asks Gemini if the image contains a registration card.
 * Uses minimal tokens (~20 input + ~5 output). Returns in <1 second.
 */
export async function preScreenImage(
  imageBase64: string,
  mimeType: string
): Promise<ValidationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // No API key — skip pre-screening, allow upload
    return { valid: true };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Does this image contain a handwritten form, registration card, or document with personal information (name, email, phone, address)? Answer ONLY with a JSON object: {"is_document": true} or {"is_document": false, "reason": "brief description of what you see instead"}`,
                },
                {
                  inlineData: { mimeType, data: imageBase64 },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 50,
          },
        }),
      }
    );

    if (!res.ok) {
      // API error — allow upload (don't block on screening failure)
      console.error("[pre-screen] Gemini API error:", res.status);
      return { valid: true };
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const parsed = JSON.parse(text);
      if (parsed.is_document === false) {
        return {
          valid: false,
          reason: parsed.reason || "This does not appear to be a registration card. Please capture a card with handwritten information.",
        };
      }
      return { valid: true };
    } catch {
      // Can't parse response — allow upload
      return { valid: true };
    }
  } catch (err) {
    // Network error — allow upload
    console.error("[pre-screen] Network error:", err);
    return { valid: true };
  }
}

/**
 * Layer 3: Post-extraction validation — checks if any meaningful data was extracted.
 * Returns false if all fields are empty (the image was probably not a card).
 */
export function validateExtractionResults(
  fields: Record<string, { value: string; confidence: string }>
): ValidationResult {
  const values = Object.values(fields);

  if (values.length === 0) {
    return { valid: false, reason: "No data could be extracted from this image" };
  }

  const nonEmptyValues = values.filter((v) => v.value && v.value.trim().length > 0);

  if (nonEmptyValues.length === 0) {
    return { valid: false, reason: "No readable information found on this card" };
  }

  return { valid: true };
}
