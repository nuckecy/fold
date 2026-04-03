import { createHash } from "crypto";

// Simple in-memory cache for translations
// In production, use Redis for persistence
const translationCache = new Map<string, string>();

function cacheKey(text: string, targetLang: string): string {
  const hash = createHash("md5").update(text).digest("hex");
  return `${targetLang}:${hash}`;
}

/**
 * Translate text using DeepL API (free tier).
 * Results are cached to avoid duplicate API calls (I7).
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  const key = cacheKey(text, targetLang);
  const cached = translationCache.get(key);
  if (cached) return cached;

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.log(`[DEEPL] No API key. Would translate to ${targetLang}: "${text.slice(0, 50)}..."`);
    return text; // Return original in dev mode
  }

  // DeepL free tier uses api-free.deepl.com
  const baseUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";

  const res = await fetch(`${baseUrl}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang.toUpperCase(),
      source_lang: sourceLang?.toUpperCase(),
      preserve_formatting: true,
    }),
  });

  if (!res.ok) {
    console.error(`[DEEPL] Translation failed: ${await res.text()}`);
    return text;
  }

  const data = await res.json();
  const translated = data.translations?.[0]?.text || text;

  translationCache.set(key, translated);
  return translated;
}

/**
 * Translate field labels from one language to another (C3).
 * Preserves merge field syntax like {{field_name}}.
 */
export async function translateFieldLabels(
  labels: Record<string, string>,
  targetLang: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...labels };

  // Find a source language to translate from
  const sourceLang = Object.keys(labels).find((l) => l !== targetLang);
  if (!sourceLang || !labels[sourceLang]) return result;

  result[targetLang] = await translateText(labels[sourceLang], targetLang, sourceLang);
  return result;
}

/**
 * Translate an email template body (I5).
 * Preserves merge fields ({{...}}) during translation.
 */
export async function translateTemplateContent(
  subject: string,
  body: string,
  targetLang: string,
  sourceLang?: string
): Promise<{ subject: string; body: string }> {
  // Extract merge fields and replace with placeholders
  const mergeFieldPattern = /\{\{[^}]+\}\}/g;
  const mergeFields: string[] = [];

  const bodyWithPlaceholders = body.replace(mergeFieldPattern, (match) => {
    mergeFields.push(match);
    return `__MERGE_${mergeFields.length - 1}__`;
  });

  const subjectMergeFields: string[] = [];
  const subjectWithPlaceholders = subject.replace(mergeFieldPattern, (match) => {
    subjectMergeFields.push(match);
    return `__SMERGE_${subjectMergeFields.length - 1}__`;
  });

  // Translate
  const translatedBody = await translateText(bodyWithPlaceholders, targetLang, sourceLang);
  const translatedSubject = await translateText(subjectWithPlaceholders, targetLang, sourceLang);

  // Restore merge fields
  let finalBody = translatedBody;
  mergeFields.forEach((field, i) => {
    finalBody = finalBody.replace(`__MERGE_${i}__`, field);
  });

  let finalSubject = translatedSubject;
  subjectMergeFields.forEach((field, i) => {
    finalSubject = finalSubject.replace(`__SMERGE_${i}__`, field);
  });

  return { subject: finalSubject, body: finalBody };
}
