import type { ObjectiveAnswers } from './types';

const DB_NAME = 'ycoj-ui';
const STORE_NAME = 'objective-drafts';
const DB_VERSION = 1;

type DraftRecord = {
  id: string;
  answers: ObjectiveAnswers;
  updatedAt: number;
};

const writeChains = new Map<string, Promise<void>>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined' || !indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
}

export async function getDraft(id: string): Promise<ObjectiveAnswers | null> {
  const db = await openDB();
  return await new Promise<ObjectiveAnswers | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const result = req.result as DraftRecord | undefined;
      resolve(result ? result.answers : null);
    };
    req.onerror = () => reject(req.error);
  });
}

function enqueueWrite(
  id: string,
  makeRequest: (store: IDBObjectStore) => IDBRequest
): Promise<void> {
  const prev = writeChains.get(id) ?? Promise.resolve();
  let resolveChain!: () => void;
  let rejectChain!: (reason: unknown) => void;
  const next = new Promise<void>((resolve, reject) => {
    resolveChain = resolve;
    rejectChain = reject;
  });
  const chained = prev
    .catch(() => {})
    .then(async () => {
      try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = makeRequest(store);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        resolveChain();
      } catch (e) {
        rejectChain(e);
      }
    });

  writeChains.set(id, next);
  chained.catch(() => {});
  return next;
}

export function saveDraft(
  id: string,
  answers: ObjectiveAnswers
): Promise<void> {
  const record: DraftRecord = {
    id,
    answers,
    updatedAt: Date.now(),
  };
  return enqueueWrite(id, (store) => store.put(record));
}

export function clearDraft(id: string): Promise<void> {
  return enqueueWrite(id, (store) => store.delete(id));
}

export function __resetWriteChains() {
  writeChains.clear();
}
