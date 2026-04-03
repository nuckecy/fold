import { createHmac } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "dev-secret";

export function generateUnsubscribeToken(
  recordId: string,
  eventId: string
): string {
  const data = `${recordId}:${eventId}`;
  return createHmac("sha256", SECRET).update(data).digest("hex");
}

export function verifyUnsubscribeToken(
  token: string,
  recordId: string,
  eventId: string
): boolean {
  const expected = generateUnsubscribeToken(recordId, eventId);
  return token === expected;
}

export function generateResubscribeToken(recordId: string): string {
  const data = `resub:${recordId}:${Date.now()}`;
  return createHmac("sha256", SECRET).update(data).digest("hex");
}

export function buildUnsubscribeUrl(
  recordId: string,
  eventId: string
): string {
  const token = generateUnsubscribeToken(recordId, eventId);
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/unsubscribe?record=${recordId}&event=${eventId}&token=${token}`;
}
