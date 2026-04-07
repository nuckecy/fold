import { db } from "@/db";
import { fldAiExtractionRequests, fldEvtFieldSchemas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";

interface ExtractionResult {
  success: boolean;
  fields: Record<string, { value: string; confidence: "high" | "medium" | "low" }>;
  provider: string;
  tokensUsed?: number;
  latencyMs: number;
  error?: string;
}

interface FieldSchema {
  fieldName: string;
  fieldType: string;
  fieldLabels: Record<string, string>;
}

function buildPrompt(fields: FieldSchema[]): string {
  const fieldDescriptions = fields
    .map((f) => {
      const labels = Object.entries(f.fieldLabels as Record<string, string>)
        .map(([lang, label]) => `${lang.toUpperCase()}: "${label}"`)
        .join(", ");
      return `- "${f.fieldName}" (type: ${f.fieldType}) — Labels: ${labels}`;
    })
    .join("\n");

  return `You are extracting handwritten data from a scanned registration card.

Extract the following fields from the image. The form may be in any of the listed languages.

Fields to extract:
${fieldDescriptions}

Return a JSON object with this exact structure:
{
  "fields": {
    "<fieldName>": { "value": "<extracted value>", "confidence": "high|medium|low" }
  }
}

Rules:
- Return empty string for value if the field is not found or illegible
- Use "low" confidence for uncertain readings
- Do not invent or guess data that is not visible
- Normalize phone numbers to include country code if visible
- Normalize email addresses to lowercase`;
}

async function extractWithGemini(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const start = Date.now();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const error = await res.text();
    return {
      success: false,
      fields: {},
      provider: "gemini-2.5-flash",
      latencyMs,
      error,
    };
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const tokensUsed =
    (data.usageMetadata?.promptTokenCount || 0) +
    (data.usageMetadata?.candidatesTokenCount || 0);

  try {
    const parsed = JSON.parse(text);
    return {
      success: true,
      fields: parsed.fields || {},
      provider: "gemini-2.5-flash",
      tokensUsed,
      latencyMs,
    };
  } catch {
    return {
      success: false,
      fields: {},
      provider: "gemini-2.5-flash",
      tokensUsed,
      latencyMs,
      error: "Failed to parse AI response",
    };
  }
}

async function extractWithClaude(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<ExtractionResult> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("CLAUDE_API_KEY not set");

  const start = Date.now();

  const mediaType = mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const error = await res.text();
    return {
      success: false,
      fields: {},
      provider: "claude-sonnet",
      latencyMs,
      error,
    };
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  const tokensUsed =
    (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  try {
    // Extract JSON from response (Claude may wrap in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || text);
    return {
      success: true,
      fields: parsed.fields || {},
      provider: "claude-sonnet",
      tokensUsed,
      latencyMs,
    };
  } catch {
    return {
      success: false,
      fields: {},
      provider: "claude-sonnet",
      tokensUsed,
      latencyMs,
      error: "Failed to parse AI response",
    };
  }
}

export async function extractFromImage(
  recordId: string,
  eventId: string,
  imagePath: string
): Promise<ExtractionResult> {
  // Fetch field schema for this event
  const fields = await db
    .select()
    .from(fldEvtFieldSchemas)
    .where(eq(fldEvtFieldSchemas.eventId, eventId));

  if (fields.length === 0) {
    return {
      success: false,
      fields: {},
      provider: "none",
      latencyMs: 0,
      error: "No field schema configured for this event",
    };
  }

  const prompt = buildPrompt(
    fields.map((f) => ({
      fieldName: f.fieldName,
      fieldType: f.fieldType,
      fieldLabels: (f.fieldLabels as Record<string, string>) || {},
    }))
  );

  // Read image — supports both URLs (R2) and local paths
  let imageBuffer: Buffer;
  if (imagePath.startsWith("http")) {
    const res = await fetch(imagePath);
    imageBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    const fullPath = join(process.cwd(), imagePath);
    imageBuffer = await readFile(fullPath);
  }
  const imageBase64 = imageBuffer.toString("base64");
  const mimeType = imagePath.endsWith(".png")
    ? "image/png"
    : imagePath.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

  const primaryProvider = process.env.AI_PRIMARY_PROVIDER || "gemini";

  // Try primary provider
  let result: ExtractionResult;
  if (primaryProvider === "gemini") {
    result = await extractWithGemini(imageBase64, mimeType, prompt);
  } else {
    result = await extractWithClaude(imageBase64, mimeType, prompt);
  }

  // Log the request
  await db.insert(fldAiExtractionRequests).values({
    recordId,
    providerUsed: result.provider,
    requestTokens: result.tokensUsed ? Math.floor(result.tokensUsed * 0.8) : null,
    responseTokens: result.tokensUsed ? Math.floor(result.tokensUsed * 0.2) : null,
    latencyMs: result.latencyMs,
    status: result.success ? "success" : "failed",
    costEstimate: result.tokensUsed
      ? (result.tokensUsed * 0.00001).toFixed(6)
      : null,
    errorMessage: result.error,
  });

  // Fallback to secondary provider on failure
  if (!result.success && process.env.AI_FALLBACK_PROVIDER) {
    const fallbackProvider = process.env.AI_FALLBACK_PROVIDER;
    let fallbackResult: ExtractionResult;

    if (fallbackProvider === "claude") {
      fallbackResult = await extractWithClaude(imageBase64, mimeType, prompt);
    } else {
      fallbackResult = await extractWithGemini(imageBase64, mimeType, prompt);
    }

    // Log fallback request
    await db.insert(fldAiExtractionRequests).values({
      recordId,
      providerUsed: fallbackResult.provider,
      requestTokens: fallbackResult.tokensUsed
        ? Math.floor(fallbackResult.tokensUsed * 0.8)
        : null,
      responseTokens: fallbackResult.tokensUsed
        ? Math.floor(fallbackResult.tokensUsed * 0.2)
        : null,
      latencyMs: fallbackResult.latencyMs,
      status: fallbackResult.success
        ? "fallback_triggered"
        : "failed",
      costEstimate: fallbackResult.tokensUsed
        ? (fallbackResult.tokensUsed * 0.00001).toFixed(6)
        : null,
      errorMessage: fallbackResult.error,
    });

    if (fallbackResult.success) {
      return fallbackResult;
    }
  }

  return result;
}
