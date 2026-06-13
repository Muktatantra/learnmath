const CODE_KEY = 'learnmath_sync_code';

// Mirrors the alphabet/pattern in lib/sync-store.js (server is authoritative;
// this is only for early client-side feedback before hitting the network).
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{5}-[${CODE_ALPHABET}]{5}$`);

let memoryCode = null;

export function getSyncCode() {
  try {
    return localStorage.getItem(CODE_KEY) || memoryCode;
  } catch {
    return memoryCode;
  }
}

export function setSyncCode(code) {
  memoryCode = code;
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    // memory fallback only
  }
}

export function clearSyncCode() {
  memoryCode = null;
  try {
    localStorage.removeItem(CODE_KEY);
  } catch {
    // ignore
  }
}

// Strips whitespace/punctuation, uppercases, and re-inserts the separating
// dash so users can paste/type codes loosely (e.g. "ab3d9 k7m2p").
export function normalizeCode(input) {
  const cleaned = String(input || '')
    .toUpperCase()
    .replace(new RegExp(`[^${CODE_ALPHABET}]`, 'g'), '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 10)}`;
}

export async function createSyncCode(progress) {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setSyncCode(data.code);
    return data.code;
  } catch {
    return null;
  }
}

export async function fetchRemoteProgress(code) {
  try {
    const res = await fetch(`/api/sync/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.progress;
  } catch {
    return null;
  }
}

export async function pushProgress(progress) {
  const code = getSyncCode();
  if (!code) return null;
  try {
    const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.progress;
  } catch {
    return null;
  }
}
