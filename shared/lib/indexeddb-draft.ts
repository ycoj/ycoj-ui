type DraftRecord<T> = {
  id: string;
  value: T;
  updatedAt: number;
};

// IndexedDB-backed per-id draft storage with get/save/clear operations.
export type DraftStorage<T> = {
  getDraft: (id: string) => Promise<T | null>;
  saveDraft: (id: string, value: T) => Promise<void>;
  clearDraft: (id: string) => Promise<void>;
};

export type DraftStorageOptions<T> = {
  // Reads records written before the value envelope existed. The next save
  // rewrites them, so each legacy draft migrates at most once.
  migrate?: (record: unknown) => T | null;
};

const DB_VERSION = 1;

export function makeDraftStorage<T>(
  dbName: string,
  storeName: string,
  options?: DraftStorageOptions<T>
): DraftStorage<T> {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined' || !indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      try {
        const req = indexedDB.open(dbName, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () =>
          reject(req.error ?? new Error('IndexedDB open failed'));
        req.onblocked = () => reject(new Error('IndexedDB blocked'));
      } catch (e) {
        reject(e);
      }
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
    return dbPromise;
  }

  async function getDraft(id: string): Promise<T | null> {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as
          (DraftRecord<T> & { [key: string]: unknown }) | undefined;
        if (!result) {
          resolve(null);
        } else if (result.value !== undefined) {
          resolve(result.value);
        } else {
          resolve(options?.migrate?.(result) ?? null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function saveDraft(id: string, value: T): Promise<void> {
    const db = await openDB();
    const record: DraftRecord<T> = {
      id,
      value,
      updatedAt: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function clearDraft(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return { getDraft, saveDraft, clearDraft };
}
