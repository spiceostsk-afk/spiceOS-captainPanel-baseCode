/**
 * Distinguishes "couldn't reach the network" from a real API/database error
 * (bad input, RLS rejection, constraint violation, etc). Only the former
 * should be queued for offline retry — the latter is a genuine failure the
 * captain needs to see and act on now.
 *
 * supabase-js wraps a raw fetch failure into an error object that *still*
 * populates `.details`/`.hint` (often just echoing the same message text) —
 * so presence-of-those-fields is NOT a reliable "this is a real Postgrest
 * error" signal. Matching on the actual wording is more robust.
 */
export function isNetworkError(err) {
  if (!err) return false;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  const haystack = [err.message, err.details, err.hint, err.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const networkPatterns = [
    'failed to fetch',
    'load failed', // Safari's wording
    'network',
    'err_internet_disconnected',
    'err_network',
    'err_name_not_resolved',
    'err_connection',
  ];

  return networkPatterns.some((pattern) => haystack.includes(pattern));
}
