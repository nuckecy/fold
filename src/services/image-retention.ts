import { db } from "@/db";
import { fldEvtRecords } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { unlink, access } from "fs/promises";
import { join } from "path";
import { logActivity } from "./activity-log";

/**
 * Image retention policy (N7):
 * - Archive after 30 days (clear image URL, keep record)
 * - Purge after 90 days (delete file from disk)
 */
export async function runImageRetention(): Promise<{
  archived: number;
  purged: number;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Archive: records older than 30 days with images
  const toArchive = await db
    .select()
    .from(fldEvtRecords)
    .where(
      sql`${fldEvtRecords.createdAt} < ${thirtyDaysAgo}
          AND ${fldEvtRecords.imageUrl} IS NOT NULL
          AND ${fldEvtRecords.captureMethod} = 'scan'`
    );

  let archived = 0;
  for (const record of toArchive) {
    // Move to archive path (in production, move to cold storage)
    await db
      .update(fldEvtRecords)
      .set({
        imageUrl: `archived:${record.imageUrl}`,
        updatedAt: now,
      })
      .where(eq(fldEvtRecords.id, record.id));
    archived++;
  }

  // Purge: archived records older than 90 days
  const toPurge = await db
    .select()
    .from(fldEvtRecords)
    .where(
      sql`${fldEvtRecords.createdAt} < ${ninetyDaysAgo}
          AND ${fldEvtRecords.imageUrl} LIKE 'archived:%'`
    );

  let purged = 0;
  for (const record of toPurge) {
    const originalPath = record.imageUrl?.replace("archived:", "");
    if (originalPath) {
      const fullPath = join(process.cwd(), originalPath);
      try {
        await access(fullPath);
        await unlink(fullPath);
      } catch {
        // File already deleted
      }
    }

    await db
      .update(fldEvtRecords)
      .set({ imageUrl: null, updatedAt: now })
      .where(eq(fldEvtRecords.id, record.id));
    purged++;
  }

  if (archived > 0 || purged > 0) {
    await logActivity({
      actionType: "image_retention_run",
      description: `Image retention: ${archived} archived, ${purged} purged`,
      metadata: { archived, purged },
    });
  }

  return { archived, purged };
}
