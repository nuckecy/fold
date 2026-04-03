const DB_NAME = "fold_offline";
const DB_VERSION = 1;
const STORE_NAME = "pending_scans";

export interface PendingScan {
  id: string;
  eventId: string;
  imageBlob: Blob;
  sourceDetail: string;
  capturedAt: number;
  retryCount: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePendingScan(scan: PendingScan): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(scan);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingScans(): Promise<PendingScan[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingScanCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingScan(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncPendingScans(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await getPendingScans();
  let synced = 0;
  let failed = 0;

  for (const scan of pending) {
    try {
      const formData = new FormData();
      formData.append(
        "image",
        new File([scan.imageBlob], `offline-${scan.id}.jpg`, {
          type: scan.imageBlob.type,
        })
      );
      formData.append("sourceDetail", scan.sourceDetail);

      const res = await fetch(`/api/events/${scan.eventId}/scans`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await removePendingScan(scan.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
