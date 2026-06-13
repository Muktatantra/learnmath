import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'sync');

// Avoid visually-ambiguous characters (0/O, 1/I/L) for hand-typed codes.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_GROUP = `[${CODE_ALPHABET}]{5}`;
export const CODE_PATTERN = new RegExp(`^${CODE_GROUP}-${CODE_GROUP}$`);

fs.mkdirSync(DATA_DIR, { recursive: true });

function randomGroup() {
  let group = '';
  for (const byte of crypto.randomBytes(5)) {
    group += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return group;
}

// Codes are used to build file paths, so reject anything that doesn't match
// CODE_PATTERN before touching the filesystem (prevents path traversal).
function filePathForCode(code) {
  if (!CODE_PATTERN.test(code)) {
    throw new Error('Invalid sync code');
  }
  return path.join(DATA_DIR, `${code}.json`);
}

export function generateCode() {
  let code;
  do {
    code = `${randomGroup()}-${randomGroup()}`;
  } while (fs.existsSync(filePathForCode(code)));
  return code;
}

export function readProgress(code) {
  try {
    const raw = fs.readFileSync(filePathForCode(code), 'utf8');
    return JSON.parse(raw).progress;
  } catch {
    return null;
  }
}

export function writeProgress(code, progress) {
  const filePath = filePathForCode(code);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify({ progress, updatedAt: new Date().toISOString() }));
  fs.renameSync(tmpPath, filePath);
}
