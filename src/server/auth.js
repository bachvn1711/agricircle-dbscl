import crypto from 'node:crypto';
import { isValidAdminPin } from '../shared/validation.js';

export const MAX_ADMIN_SESSIONS = 64;
export const ADMIN_SESSION_TTL_MS = 4 * 60 * 60 * 1000;
export const ADMIN_COOKIE_NAME = 'khkt_admin';
export const VOTER_COOKIE_NAME = 'khkt_voter';

const TOKEN_FORMAT_REGEX = /^[A-Za-z0-9_-]{32,128}$/;
const VOTER_COOKIE_REGEX = /^([0-9a-f]{32})\.([0-9a-f]{64})$/;

function sha256Buffer(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest();
}

function sha256Hex(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export function verifyAdminPin(providedPin, configuredPin) {
  if (!isValidAdminPin(configuredPin) || typeof providedPin !== 'string') {
    return false;
  }
  const expectedDigest = sha256Buffer(configuredPin);
  const providedDigest = sha256Buffer(providedPin);
  if (expectedDigest.byteLength !== providedDigest.byteLength) {
    return false;
  }
  return crypto.timingSafeEqual(expectedDigest, providedDigest);
}

export function parseCookies(cookieHeader) {
  const jar = new Map();
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0 || cookieHeader.length > 8192) {
    return jar;
  }
  const segments = cookieHeader.split(';');
  const cap = Math.min(segments.length, 64);
  for (let i = 0; i < cap; i += 1) {
    const part = segments[i];
    const eqIndex = part.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }
    const name = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(name)) {
      continue;
    }
    jar.set(name, value);
  }
  return jar;
}

export function createAdminSessionStore({ now, maxSessions = MAX_ADMIN_SESSIONS, ttlMs = ADMIN_SESSION_TTL_MS }) {
  const sessions = new Map();

  function pruneExpired(currentNow) {
    for (const [key, entry] of sessions.entries()) {
      if (entry.expiresAt <= currentNow) {
        sessions.delete(key);
      }
    }
  }

  function createSession() {
    const currentNow = now();
    pruneExpired(currentNow);
    while (sessions.size >= maxSessions) {
      const oldestKey = sessions.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      sessions.delete(oldestKey);
    }
    const token = crypto.randomBytes(32).toString('base64url');
    const key = sha256Hex(token);
    const expiresAt = currentNow + ttlMs;
    sessions.set(key, { createdAt: currentNow, expiresAt });
    return { token, expiresAt };
  }

  function verifySession(token) {
    if (typeof token !== 'string' || !TOKEN_FORMAT_REGEX.test(token)) {
      return false;
    }
    const key = sha256Hex(token);
    const entry = sessions.get(key);
    if (!entry) {
      return false;
    }
    if (entry.expiresAt <= now()) {
      sessions.delete(key);
      return false;
    }
    return true;
  }

  function revokeSession(token) {
    if (typeof token !== 'string' || !TOKEN_FORMAT_REGEX.test(token)) {
      return false;
    }
    return sessions.delete(sha256Hex(token));
  }

  function size() {
    return sessions.size;
  }

  function clear() {
    sessions.clear();
  }

  return {
    createSession,
    verifySession,
    revokeSession,
    pruneExpired,
    size,
    clear
  };
}

export function buildAdminSetCookie(token, isEncrypted) {
  const secureFlag = isEncrypted ? '; Secure' : '';
  return `${ADMIN_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}${secureFlag}`;
}

export function buildAdminClearCookie(isEncrypted) {
  const secureFlag = isEncrypted ? '; Secure' : '';
  return `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureFlag}`;
}

export function mintVoterCookieValue(hmacSecret) {
  const token = crypto.randomBytes(16).toString('hex');
  const sig = crypto.createHmac('sha256', hmacSecret).update(token, 'utf8').digest('hex');
  return `${token}.${sig}`;
}

export function verifyVoterCookieValue(rawValue, hmacSecret) {
  if (typeof rawValue !== 'string' || typeof hmacSecret !== 'string' || hmacSecret.length === 0) {
    return null;
  }
  const match = VOTER_COOKIE_REGEX.exec(rawValue);
  if (!match) {
    return null;
  }
  const token = match[1];
  const providedSig = match[2];
  const expectedSig = crypto.createHmac('sha256', hmacSecret).update(token, 'utf8').digest('hex');
  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.byteLength !== expectedBuf.byteLength) {
    return null;
  }
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }
  return token;
}

export function buildVoterSetCookie(cookieValue, isEncrypted) {
  const secureFlag = isEncrypted ? '; Secure' : '';
  return `${VOTER_COOKIE_NAME}=${cookieValue}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secureFlag}`;
}

export function hashVoterIdentity({ voterToken, clientIp }) {
  const identity = voterToken ? `voter:${voterToken}` : `ip:${clientIp}`;
  return sha256Hex(identity);
}

export function extractClientIp(req) {
  const remote = req?.socket?.remoteAddress;
  return typeof remote === 'string' && remote.length > 0 ? remote : 'unknown';
}
