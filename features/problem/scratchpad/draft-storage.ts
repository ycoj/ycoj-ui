const DB_NAME = 'ycoj-scratchpad';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

export type ScratchpadDraft = {
  id: string;
  code: string;
  language: string;
  updatedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB is blocked'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

export async function getScratchpadDraft(
  id: string
): Promise<ScratchpadDraft | null> {
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .get(id);
    request.onsuccess = () =>
      resolve((request.result as ScratchpadDraft | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveScratchpadDraft(
  draft: Omit<ScratchpadDraft, 'updatedAt'>
): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .put({ ...draft, updatedAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
