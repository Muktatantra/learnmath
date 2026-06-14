const PLAYER_ID_KEY = 'learnmath_player_id';
const PROFILE_KEY = 'learnmath_profile';

let memoryPlayerId = null;
let memoryProfile = null;

// crypto.randomUUID() requires a secure context (HTTPS/localhost), but this
// app is often used over plain HTTP on a local network, so fall back to
// crypto.getRandomValues (no secure-context requirement) or Math.random.
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getPlayerId() {
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    if (!memoryPlayerId) memoryPlayerId = generateId();
    return memoryPlayerId;
  }
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : memoryProfile;
  } catch {
    return memoryProfile;
  }
}

export function saveProfile(profile) {
  memoryProfile = profile;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // profile just won't persist across reloads
  }
}

export function hasProfile() {
  const profile = getProfile();
  return Boolean(profile && profile.name && profile.avatar);
}
