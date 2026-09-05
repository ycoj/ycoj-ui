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

const DRAFT_DATABASE_VERSION = 1;

// Every IndexedDB database/store owned by this module. The three databases
// predate this registry and keep their names so drafts written by older
// clients stay readable; do not rename them without a data migration.
export const DRAFT_DATABASES = {
  preliminary: {
    dbName: 'ycoj-ui-preliminary',
    storeName: 'preliminary-drafts',
  },
  objective: { dbName: 'ycoj-ui', storeName: 'objective-drafts' },
  scratchpad: { dbName: 'ycoj-scratchpad', storeName: 'drafts' },
} as const;

const openRequests = new Map<string, Promise<IDBDatabase>>();

// Canonical opener owning all draft stores: caches one connection per
// database and creates the store on upgrade. Draft accessors must go through
// here instead of opening IndexedDB directly.
export function openYcojDb(
  dbName: string,
  storeName: string
): Promise<IDBDatabase> {
  const key = `${dbName}::${storeName}`;
  const cached = openRequests.get(key);
  if (cached) return cached;
  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined' || !indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    try {
      const req = indexedDB.open(dbName, DRAFT_DATABASE_VERSION);
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
  promise.catch(() => {
    openRequests.delete(key);
  });
  openRequests.set(key, promise);
  return promise;
}

// Thin accessor over openYcojDb for one draft store. Migration semantics are
// unchanged: records written before the value envelope existed are read via
// options.migrate, and the next save rewrites them into the envelope.
export function makeDraftStorage<T>(
  dbName: string,
  storeName: string,
  options?: DraftStorageOptions<T>
): DraftStorage<T> {
  async function getDraft(id: string): Promise<T | null> {
    const db = await openYcojDb(dbName, storeName);
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
    const db = await openYcojDb(dbName, storeName);
    const record: DraftRecord<T> = {
      id,
      value,
      updatedAt: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      let requestError: unknown;
      req.onerror = () => {
        requestError = req.error;
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(
          requestError ??
            req.error ??
            tx.error ??
            new Error('IndexedDB save failed')
        );
      tx.onabort = () =>
        reject(
          requestError ??
            req.error ??
            tx.error ??
            new Error('IndexedDB save aborted')
        );
    });
  }

  async function clearDraft(id: string): Promise<void> {
    const db = await openYcojDb(dbName, storeName);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      let requestError: unknown;
      req.onerror = () => {
        requestError = req.error;
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(
          requestError ??
            req.error ??
            tx.error ??
            new Error('IndexedDB clear failed')
        );
      tx.onabort = () =>
        reject(
          requestError ??
            req.error ??
            tx.error ??
            new Error('IndexedDB clear aborted')
        );
    });
  }

  return { getDraft, saveDraft, clearDraft };
}
