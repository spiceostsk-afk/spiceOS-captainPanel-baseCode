import { openDB } from 'idb';

/**
 * offlineQueue — a persistent (IndexedDB) outbox of actions that couldn't
 * reach Supabase because the network was down. Survives page reloads/tablet
 * restarts. Nothing in here ever expires on its own; it's drained by
 * RestaurantContext's sync loop once the connection comes back.
 */

const DB_NAME = 'captain_panel_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_actions';

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure-context/older browsers (some POS tablets run
  // plain http on a local network where crypto.randomUUID is unavailable).
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * Queue an action for later replay.
 * @param {string} type - one of the known action types in offlineSync.js
 * @param {object} payload - everything the replay function needs; should be
 *   self-contained (don't rely on live React state still being around later)
 */
export async function enqueueAction(type, payload) {
  const db = await getDb();
  const record = {
    id: makeId(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };
  await db.put(STORE_NAME, record);
  return record;
}

export async function getQueuedActions() {
  const db = await getDb();
  const all = await db.getAllFromIndex(STORE_NAME, 'createdAt');
  return all;
}

export async function removeQueuedAction(id) {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function recordAttemptFailure(id, errorMessage) {
  const db = await getDb();
  const record = await db.get(STORE_NAME, id);
  if (record) {
    record.attempts += 1;
    record.lastError = errorMessage;
    await db.put(STORE_NAME, record);
  }
}

export async function queueCount() {
  const db = await getDb();
  return db.count(STORE_NAME);
}

export async function clearQueue() {
  const db = await getDb();
  await db.clear(STORE_NAME);
}
