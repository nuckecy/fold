/**
 * Detect language of text content (H17).
 * Simple heuristic-based detection for EN/DE.
 * In production, use a proper language detection library or API.
 */
export function detectLanguage(text: string): string | null {
  if (!text || text.length < 10) return null;

  const lower = text.toLowerCase();

  // German indicators
  const germanWords = [
    "und", "der", "die", "das", "ist", "nicht", "ich", "ein", "eine",
    "mit", "auf", "von", "sie", "wir", "haben", "werden", "aber",
    "nach", "auch", "nur", "schon", "noch", "kann", "wenn",
    "strasse", "straße", "gebetsanliegen", "gemeinde", "kirche",
  ];

  // English indicators
  const englishWords = [
    "the", "and", "is", "are", "was", "not", "have", "has",
    "with", "from", "this", "that", "for", "but", "they",
    "will", "can", "would", "could", "should", "been",
    "church", "prayer", "request", "street", "road",
  ];

  const words = lower.split(/\s+/);
  let germanScore = 0;
  let englishScore = 0;

  for (const word of words) {
    if (germanWords.includes(word)) germanScore++;
    if (englishWords.includes(word)) englishScore++;
  }

  // Check for German-specific characters
  if (/[äöüß]/i.test(text)) germanScore += 3;

  if (germanScore > englishScore && germanScore >= 2) return "de";
  if (englishScore > germanScore && englishScore >= 2) return "en";

  return null;
}

/**
 * Check if detected language matches event languages (H18).
 */
export function isLanguageMismatch(
  detectedLang: string | null,
  primaryLang: string,
  secondaryLang?: string | null
): boolean {
  if (!detectedLang) return false;
  if (detectedLang === primaryLang) return false;
  if (secondaryLang && detectedLang === secondaryLang) return false;
  return true;
}
