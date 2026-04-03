/**
 * Validate AI extraction response against expected schema (N15).
 * Rejects malformed or suspicious outputs.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedFields: Record<string, { value: string; confidence: string }>;
}

export function validateExtractionResponse(
  response: unknown,
  expectedFieldNames: string[]
): ValidationResult {
  const errors: string[] = [];
  const sanitizedFields: Record<string, { value: string; confidence: string }> = {};

  if (!response || typeof response !== "object") {
    return { valid: false, errors: ["Response is not an object"], sanitizedFields };
  }

  const fields = (response as any).fields;
  if (!fields || typeof fields !== "object") {
    return { valid: false, errors: ["Missing 'fields' property"], sanitizedFields };
  }

  for (const [fieldName, data] of Object.entries(fields)) {
    // Only accept expected field names
    if (!expectedFieldNames.includes(fieldName)) {
      errors.push(`Unexpected field: ${fieldName}`);
      continue;
    }

    if (!data || typeof data !== "object") {
      errors.push(`Invalid data for field: ${fieldName}`);
      continue;
    }

    const { value, confidence } = data as any;

    // Validate value is a string
    if (value !== undefined && typeof value !== "string") {
      errors.push(`Non-string value for field: ${fieldName}`);
      continue;
    }

    // Validate confidence level
    const validConfidence = ["high", "medium", "low"];
    const sanitizedConfidence = validConfidence.includes(confidence)
      ? confidence
      : "low";

    // Sanitize value: strip potential injection patterns
    const sanitizedValue = typeof value === "string"
      ? value
          .replace(/<script[^>]*>.*?<\/script>/gi, "") // Strip script tags
          .replace(/javascript:/gi, "") // Strip JS protocol
          .replace(/on\w+\s*=/gi, "") // Strip event handlers
          .trim()
          .slice(0, 1000) // Max 1000 chars per field
      : "";

    sanitizedFields[fieldName] = {
      value: sanitizedValue,
      confidence: sanitizedConfidence,
    };
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedFields,
  };
}
