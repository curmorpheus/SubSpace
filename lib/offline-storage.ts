/**
 * Offline Storage for Form Submissions
 * Uses IndexedDB to queue submissions when offline
 */

const DB_NAME = "SubSpaceOfflineDB";
const DB_VERSION = 1;
const SUBMISSIONS_STORE = "pending_submissions";

interface PendingSubmission {
  id: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(SUBMISSIONS_STORE)) {
        const objectStore = db.createObjectStore(SUBMISSIONS_STORE, {
          keyPath: "id",
        });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Save a submission to IndexedDB for later upload
 */
export async function queueSubmission(payload: any): Promise<string> {
  const db = await openDB();
  const id = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const submission: PendingSubmission = {
    id,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SUBMISSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SUBMISSIONS_STORE);
    const request = store.add(submission);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending submissions
 */
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SUBMISSIONS_STORE], "readonly");
    const store = transaction.objectStore(SUBMISSIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a submission from the queue (after successful upload)
 */
export async function removeSubmission(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SUBMISSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SUBMISSIONS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update retry count for a submission
 */
export async function incrementRetryCount(id: string): Promise<void> {
  const db = await openDB();

  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([SUBMISSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SUBMISSIONS_STORE);

    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const submission = getRequest.result;
      if (submission) {
        submission.retryCount += 1;
        const updateRequest = store.put(submission);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Get count of pending submissions
 */
export async function getPendingCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SUBMISSIONS_STORE], "readonly");
    const store = transaction.objectStore(SUBMISSIONS_STORE);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Process all pending submissions
 */
export async function processPendingSubmissions(
  onSuccess?: (id: string) => void,
  onError?: (id: string, error: Error) => void
): Promise<{ succeeded: number; failed: number }> {
  const pending = await getPendingSubmissions();
  let succeeded = 0;
  let failed = 0;

  for (const submission of pending) {
    try {
      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission.payload),
      });

      if (response.ok) {
        await removeSubmission(submission.id);
        succeeded++;
        onSuccess?.(submission.id);
      } else {
        await incrementRetryCount(submission.id);
        failed++;
        onError?.(submission.id, new Error(`HTTP ${response.status}`));
      }
    } catch (error) {
      await incrementRetryCount(submission.id);
      failed++;
      onError?.(submission.id, error as Error);
    }
  }

  return { succeeded, failed };
}
