const RECEIPTS_STORAGE_KEY = 'khkt_short_code_receipts';
const CALC_QUEUE_STORAGE_KEY = 'khkt_offline_calc_queue';
const PENDING_POST_STORAGE_KEY = 'khkt_pending_post';
const FARMER_PROFILE_STORAGE_KEY = 'khkt_farmer_profile';
const REGION_STORAGE_KEY = 'khkt_selected_region_v2';

const MAX_RECEIPTS = 50;
const MAX_CALC_BATCH_DELTA = 500;
const STRICT_NUMBER_REGEX = /^-?\d+(?:\.\d+)?$/;
const STRICT_INT_REGEX = /^-?\d+$/;
const VN_PHONE_REGEX = /^0\d{9}$/;
const VI_NUMBER_FORMATTERS = new Map();

function getViNumberFormatter(maxFractionDigits) {
  if (!VI_NUMBER_FORMATTERS.has(maxFractionDigits)) {
    VI_NUMBER_FORMATTERS.set(
      maxFractionDigits,
      new Intl.NumberFormat('vi-VN', { maximumFractionDigits: maxFractionDigits })
    );
  }
  return VI_NUMBER_FORMATTERS.get(maxFractionDigits);
}

export function formatViNumber(value, maxFractionDigits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0';
  }
  return getViNumberFormatter(maxFractionDigits).format(value);
}

export function formatVnd(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0 đ';
  }
  return `${formatViNumber(Math.round(value), 0)} đ`;
}

export function isSafeVnPhone(phone) {
  return typeof phone === 'string' && VN_PHONE_REGEX.test(phone.trim());
}

export function buildTelHref(phone) {
  return isSafeVnPhone(phone) ? `tel:${phone.trim()}` : null;
}

export function buildZaloHref(phone) {
  return isSafeVnPhone(phone) ? `https://zalo.me/${phone.trim()}` : null;
}

export function buildDirectionsHref(lat, lng) {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function formatRemainingTime(expiresAt, nowMs = Date.now()) {
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) {
    return '';
  }
  const diffMs = expiresAt - nowMs;
  if (diffMs <= 0) {
    return 'Đã hết hạn';
  }
  const hours = Math.ceil(diffMs / 3600000);
  if (hours < 24) {
    return `Còn ${hours} giờ`;
  }
  const days = Math.ceil(diffMs / 86400000);
  return `Còn ${days} ngày`;
}

export function createEl(tag, options = {}, ...children) {
  const node = document.createElement(tag);
  if (options && typeof options === 'object') {
    if (typeof options.className === 'string' && options.className !== '') {
      node.className = options.className;
    }
    if (typeof options.id === 'string' && options.id !== '') {
      node.id = options.id;
    }
    if (typeof options.type === 'string') {
      node.type = options.type;
    }
    if (typeof options.text === 'string') {
      node.textContent = options.text;
    }
    if (options.attrs && typeof options.attrs === 'object') {
      for (const [k, v] of Object.entries(options.attrs)) {
        if (v !== null && v !== undefined && v !== false) {
          node.setAttribute(k, v === true ? '' : String(v));
        }
      }
    }
    if (options.dataset && typeof options.dataset === 'object') {
      for (const [k, v] of Object.entries(options.dataset)) {
        if (v !== null && v !== undefined) {
          node.dataset[k] = String(v);
        }
      }
    }
    if (typeof options.onClick === 'function') {
      node.addEventListener('click', options.onClick);
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) {
      continue;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      node.appendChild(document.createTextNode(String(child)));
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function getBrowserStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

export function readLocalJsonSafe(storage, key, fallback) {
  if (!storage || typeof storage.getItem !== 'function' || typeof key !== 'string') {
    return fallback;
  }
  let raw;
  try {
    raw = storage.getItem(key);
  } catch {
    return fallback;
  }
  if (typeof raw !== 'string' || raw.trim() === '') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function writeLocalJsonSafe(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function' || typeof key !== 'string') {
    return false;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeLocalKeySafe(storage, key) {
  if (!storage || typeof storage.removeItem !== 'function' || typeof key !== 'string') {
    return false;
  }
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function generateClientRequestId(prefix = 'req') {
  const safePrefix = /^[A-Za-z0-9_-]{1,12}$/.test(prefix) ? prefix : 'req';
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `${safePrefix}_${hex}`;
}

export function parseStrictNumber(raw) {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw !== 'string') {
    return null;
  }
  const normalized = raw.trim().replace(/,/g, '.');
  if (!STRICT_NUMBER_REGEX.test(normalized)) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseStrictInt(raw) {
  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) ? raw : null;
  }
  if (typeof raw !== 'string') {
    return null;
  }
  const normalized = raw.trim();
  if (!STRICT_INT_REGEX.test(normalized)) {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function getShortCodeReceipts(storage) {
  const raw = readLocalJsonSafe(storage, RECEIPTS_STORAGE_KEY, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item) => isPlainRecord(item) && typeof item.shortCode === 'string' && item.shortCode.length > 0);
}

export function saveShortCodeReceipt(storage, receipt) {
  const current = getShortCodeReceipts(storage);
  if (!isPlainRecord(receipt) || typeof receipt.shortCode !== 'string' || receipt.shortCode.trim() === '') {
    return current;
  }
  const filtered = current.filter((item) => item.shortCode !== receipt.shortCode);
  filtered.push({ ...receipt });
  const capped = filtered.length > MAX_RECEIPTS ? filtered.slice(filtered.length - MAX_RECEIPTS) : filtered;
  writeLocalJsonSafe(storage, RECEIPTS_STORAGE_KEY, capped);
  return capped;
}

function normalizeCalcQueue(raw) {
  if (!isPlainRecord(raw)) {
    return { openDelta: 0, sealedBatches: [] };
  }
  const openDelta =
    typeof raw.openDelta === 'number' && Number.isSafeInteger(raw.openDelta) && raw.openDelta > 0
      ? raw.openDelta
      : 0;
  const sealedBatches = Array.isArray(raw.sealedBatches)
    ? raw.sealedBatches
        .filter(
          (batch) =>
            isPlainRecord(batch) &&
            typeof batch.batchId === 'string' &&
            batch.batchId.length > 0 &&
            typeof batch.delta === 'number' &&
            Number.isSafeInteger(batch.delta) &&
            batch.delta >= 1 &&
            batch.delta <= MAX_CALC_BATCH_DELTA
        )
        .map((batch) => ({ batchId: batch.batchId, delta: batch.delta }))
    : [];
  return { openDelta, sealedBatches };
}

export function readCalcQueue(storage) {
  return normalizeCalcQueue(readLocalJsonSafe(storage, CALC_QUEUE_STORAGE_KEY, null));
}

export function getPendingCalcCount(storage) {
  const queue = readCalcQueue(storage);
  let total = queue.openDelta;
  for (const batch of queue.sealedBatches) {
    total += batch.delta;
  }
  return total;
}

export function enqueueOfflineCalc(storage, delta = 1) {
  const current = readCalcQueue(storage);
  if (typeof delta !== 'number' || !Number.isSafeInteger(delta) || delta <= 0) {
    return current;
  }
  const next = {
    openDelta: current.openDelta + delta,
    sealedBatches: current.sealedBatches
  };
  writeLocalJsonSafe(storage, CALC_QUEUE_STORAGE_KEY, next);
  return next;
}

export function sealCalcBatches(storage, makeBatchId) {
  const current = readCalcQueue(storage);
  if (current.openDelta <= 0) {
    return current;
  }
  const nextBatches = [...current.sealedBatches];
  let remaining = current.openDelta;
  while (remaining > 0) {
    const chunk = Math.min(MAX_CALC_BATCH_DELTA, remaining);
    const batchId = typeof makeBatchId === 'function' ? makeBatchId() : generateClientRequestId('calc');
    nextBatches.push({ batchId, delta: chunk });
    remaining -= chunk;
  }
  const next = {
    openDelta: 0,
    sealedBatches: nextBatches
  };
  writeLocalJsonSafe(storage, CALC_QUEUE_STORAGE_KEY, next);
  return next;
}

export function ackCalcBatch(storage, batchId) {
  const current = readCalcQueue(storage);
  if (typeof batchId !== 'string' || batchId === '') {
    return current;
  }
  const nextBatches = current.sealedBatches.filter((batch) => batch.batchId !== batchId);
  if (nextBatches.length === current.sealedBatches.length) {
    return current;
  }
  const next = {
    openDelta: current.openDelta,
    sealedBatches: nextBatches
  };
  writeLocalJsonSafe(storage, CALC_QUEUE_STORAGE_KEY, next);
  return next;
}

export function savePendingPost(storage, draft) {
  if (!isPlainRecord(draft)) {
    return null;
  }
  const copy = { ...draft };
  writeLocalJsonSafe(storage, PENDING_POST_STORAGE_KEY, copy);
  return copy;
}

export function readPendingPost(storage) {
  const raw = readLocalJsonSafe(storage, PENDING_POST_STORAGE_KEY, null);
  return isPlainRecord(raw) ? raw : null;
}

export function clearPendingPost(storage) {
  removeLocalKeySafe(storage, PENDING_POST_STORAGE_KEY);
}

export function readFarmerProfile(storage) {
  const raw = readLocalJsonSafe(storage, FARMER_PROFILE_STORAGE_KEY, null);
  if (!isPlainRecord(raw)) {
    return { contactName: '', contactPhone: '' };
  }
  return {
    contactName: typeof raw.contactName === 'string' ? raw.contactName : '',
    contactPhone: typeof raw.contactPhone === 'string' ? raw.contactPhone : ''
  };
}

export function saveFarmerProfile(storage, profile) {
  if (!isPlainRecord(profile)) {
    return readFarmerProfile(storage);
  }
  const current = readFarmerProfile(storage);
  const next = {
    contactName: typeof profile.contactName === 'string' ? profile.contactName.trim() : current.contactName,
    contactPhone: typeof profile.contactPhone === 'string' ? profile.contactPhone.trim() : current.contactPhone
  };
  writeLocalJsonSafe(storage, FARMER_PROFILE_STORAGE_KEY, next);
  return next;
}

export function readSelectedRegionId(storage, isValidRegion = null, defaultRegionId = 'xuan_duong') {
  const raw = readLocalJsonSafe(storage, REGION_STORAGE_KEY, defaultRegionId);
  if (typeof isValidRegion === 'function') {
    return isValidRegion(raw) ? raw : defaultRegionId;
  }
  return typeof raw === 'string' && raw.length > 0 ? raw : defaultRegionId;
}

export function saveSelectedRegionId(storage, regionId, isValidRegion = null, defaultRegionId = 'xuan_duong') {
  if (typeof isValidRegion === 'function' && !isValidRegion(regionId)) {
    return readSelectedRegionId(storage, isValidRegion, defaultRegionId);
  }
  if (typeof regionId !== 'string' || regionId.length === 0) {
    return readSelectedRegionId(storage, isValidRegion, defaultRegionId);
  }
  writeLocalJsonSafe(storage, REGION_STORAGE_KEY, regionId);
  return regionId;
}
