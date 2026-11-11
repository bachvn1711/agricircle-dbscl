import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_CROPS, getCropById } from '../shared/crops.js';
import { CO2_KG_PER_KG_DIVERTED, convertToKg } from '../shared/units.js';
import {
  CROCKFORD_BASE32_ALPHABET,
  MAX_ACTIVE_LISTINGS_PER_PHONE,
  MAX_KG_LIMIT,
  isPlainObject,
  validateAdminPatchListing,
  validateCollectBody
} from '../shared/validation.js';

const DAY_MS = 86_400_000;
const METRIC_RETENTION_MS = 30 * DAY_MS;
const PUBLIC_LISTING_COLUMNS =
  'id, category, offer_type, price_note, raw_quantity, raw_unit, estimated_kg, lat, lng, location_note, contact_name, contact_phone, is_proxy_post, raw_voice_text, status, report_count, created_at, expires_at, collected_at, actual_kg_collected';

export function serializeListing(row) {
  return {
    id: row.id,
    category: row.category,
    offerType: row.offer_type,
    priceNote: row.price_note,
    rawQuantity: row.raw_quantity,
    rawUnit: row.raw_unit,
    estimatedKg: row.estimated_kg,
    lat: row.lat,
    lng: row.lng,
    locationNote: row.location_note,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    isProxyPost: Boolean(row.is_proxy_post),
    rawVoiceText: row.raw_voice_text,
    status: row.status,
    reportCount: row.report_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    collectedAt: row.collected_at,
    actualKgCollected: row.actual_kg_collected
  };
}

export function runInTransaction(db, fn) {
  if (db.isTransaction) {
    return fn();
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    if (db.isTransaction) {
      db.exec('COMMIT');
    }
    return result;
  } catch (err) {
    if (db.isTransaction) {
      try {
        db.exec('ROLLBACK');
      } catch {
      }
    }
    throw err;
  }
}

function generateShortCode() {
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += CROCKFORD_BASE32_ALPHABET[crypto.randomInt(0, CROCKFORD_BASE32_ALPHABET.length)];
  }
  return code;
}

export function verifyShortCode(providedRaw, expectedCode) {
  if (typeof providedRaw !== 'string' || typeof expectedCode !== 'string') {
    return false;
  }
  const normalized = providedRaw.trim().toUpperCase();
  if (!/^[0-9A-HJKMNP-TV-Z]{4}$/.test(normalized)) {
    return false;
  }
  const providedBuf = Buffer.from(normalized, 'utf8');
  const expectedBuf = Buffer.from(expectedCode, 'utf8');
  if (providedBuf.byteLength !== 4 || expectedBuf.byteLength !== 4) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

function parseNonNegativeIntString(raw) {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return 0;
  }
  const val = Number(raw);
  return Number.isSafeInteger(val) ? val : 0;
}

export function openDatabase({ dbPath, now }) {
  const isMemory = dbPath === ':memory:' || dbPath.startsWith('file::memory:');
  if (!isMemory) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA busy_timeout = 5000');
    if (!isMemory) {
      db.exec('PRAGMA journal_mode = WAL');
    }
    db.exec('PRAGMA synchronous = NORMAL');
    db.exec('PRAGMA foreign_keys = 1');

    db.exec(`
      CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_code TEXT NOT NULL,
        category TEXT NOT NULL,
        offer_type TEXT NOT NULL CHECK (offer_type IN ('free', 'sell')),
        price_note TEXT NOT NULL DEFAULT '',
        raw_quantity REAL NOT NULL,
        raw_unit TEXT NOT NULL,
        estimated_kg REAL NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        location_note TEXT NOT NULL DEFAULT '',
        contact_name TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        is_proxy_post INTEGER NOT NULL DEFAULT 0 CHECK (is_proxy_post IN (0, 1)),
        raw_voice_text TEXT NOT NULL DEFAULT '',
        client_request_id TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'collected', 'hidden', 'reported')),
        report_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        collected_at INTEGER,
        actual_kg_collected REAL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_phone_req
        ON listings (contact_phone, client_request_id)
        WHERE client_request_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_listings_status_expires
        ON listings (status, expires_at);
      CREATE INDEX IF NOT EXISTS idx_listings_phone_status_expires
        ON listings (contact_phone, status, expires_at);

      CREATE TABLE IF NOT EXISTS listing_reports (
        listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        voter_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (listing_id, voter_hash)
      );

      CREATE TABLE IF NOT EXISTS crop_overrides (
        crop_id TEXT PRIMARY KEY,
        daily_decay_rate REAL NOT NULL,
        max_shelf_life_days INTEGER NOT NULL,
        reference_price_vnd INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metric_flushes (
        client_request_id TEXT PRIMARY KEY,
        delta INTEGER NOT NULL CHECK (delta >= 1 AND delta <= 500),
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS server_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    runInTransaction(db, () => {
      const hmacSecret = crypto.randomBytes(32).toString('hex');
      db.prepare('INSERT OR IGNORE INTO server_meta (key, value) VALUES (?, ?)').run(
        'cookie_hmac_secret',
        hmacSecret
      );
      db.prepare('INSERT OR IGNORE INTO server_meta (key, value) VALUES (?, ?)').run(
        'calc_total_archived',
        '0'
      );

      const cutoff = now() - METRIC_RETENTION_MS;
      const prunedRow = db
        .prepare('SELECT COALESCE(SUM(delta), 0) AS pruned_sum FROM metric_flushes WHERE created_at < ?')
        .get(cutoff);
      if (prunedRow && prunedRow.pruned_sum > 0) {
        const archivedRow = db
          .prepare('SELECT value FROM server_meta WHERE key = ?')
          .get('calc_total_archived');
        const archived = parseNonNegativeIntString(archivedRow?.value);
        db.prepare('UPDATE server_meta SET value = ? WHERE key = ?').run(
          String(archived + prunedRow.pruned_sum),
          'calc_total_archived'
        );
        db.prepare('DELETE FROM metric_flushes WHERE created_at < ?').run(cutoff);
      }
    });

    return db;
  } catch (err) {
    if (db.isOpen) {
      db.close();
    }
    throw err;
  }
}

export function getCookieHmacSecret(db) {
  const row = db.prepare('SELECT value FROM server_meta WHERE key = ?').get('cookie_hmac_secret');
  return row ? row.value : '';
}

export function getCropsWithOverrides(db) {
  const rows = db
    .prepare('SELECT crop_id, daily_decay_rate, max_shelf_life_days, reference_price_vnd FROM crop_overrides')
    .all();
  const overrides = new Map(rows.map((r) => [r.crop_id, r]));
  return DEFAULT_CROPS.map((crop) => {
    const ov = overrides.get(crop.id);
    if (!ov) {
      return { ...crop };
    }
    return {
      ...crop,
      dailyDecayRate: ov.daily_decay_rate,
      maxShelfLifeDays: ov.max_shelf_life_days,
      referencePriceVnd: ov.reference_price_vnd
    };
  });
}

export function updateCropOverride(db, cropId, patch, currentNow) {
  const baseCrop = getCropById(cropId);
  if (!baseCrop) {
    return { ok: false, status: 404, error: 'Không tìm thấy loại nông sản này' };
  }

  return runInTransaction(db, () => {
    const existing = db
      .prepare('SELECT daily_decay_rate, max_shelf_life_days, reference_price_vnd FROM crop_overrides WHERE crop_id = ?')
      .get(cropId);

    const dailyDecayRate = Object.hasOwn(patch, 'dailyDecayRate')
      ? patch.dailyDecayRate
      : (existing ? existing.daily_decay_rate : baseCrop.dailyDecayRate);
    const maxShelfLifeDays = Object.hasOwn(patch, 'maxShelfLifeDays')
      ? patch.maxShelfLifeDays
      : (existing ? existing.max_shelf_life_days : baseCrop.maxShelfLifeDays);
    const referencePriceVnd = Object.hasOwn(patch, 'referencePriceVnd')
      ? patch.referencePriceVnd
      : (existing ? existing.reference_price_vnd : baseCrop.referencePriceVnd);

    db.prepare(`
      INSERT INTO crop_overrides (crop_id, daily_decay_rate, max_shelf_life_days, reference_price_vnd, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(crop_id) DO UPDATE SET
        daily_decay_rate = excluded.daily_decay_rate,
        max_shelf_life_days = excluded.max_shelf_life_days,
        reference_price_vnd = excluded.reference_price_vnd,
        updated_at = excluded.updated_at
    `).run(cropId, dailyDecayRate, maxShelfLifeDays, referencePriceVnd, currentNow);

    return {
      ok: true,
      status: 200,
      crop: {
        ...baseCrop,
        dailyDecayRate,
        maxShelfLifeDays,
        referencePriceVnd
      }
    };
  });
}

export function getPublicListings(db, filters, currentNow) {
  const conditions = ["status = 'active'", 'expires_at > ?'];
  const params = [currentNow];

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.offerType) {
    conditions.push('offer_type = ?');
    params.push(filters.offerType);
  }

  const sql = `SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT 1000`;
  const rows = db.prepare(sql).all(...params);
  return rows.map(serializeListing);
}

export function getAdminListings(db, limit) {
  const sql = `
    SELECT ${PUBLIC_LISTING_COLUMNS}
    FROM listings
    ORDER BY
      CASE status
        WHEN 'reported' THEN 0
        WHEN 'active' THEN 1
        WHEN 'hidden' THEN 2
        ELSE 3
      END,
      report_count DESC,
      created_at DESC,
      id DESC
    LIMIT ?
  `;
  const rows = db.prepare(sql).all(limit);
  return rows.map(serializeListing);
}

export function createListing(db, data, currentNow) {
  return runInTransaction(db, () => {
    if (data.clientRequestId !== null) {
      const existing = db
        .prepare(`SELECT ${PUBLIC_LISTING_COLUMNS}, short_code FROM listings WHERE contact_phone = ? AND client_request_id = ?`)
        .get(data.contactPhone, data.clientRequestId);
      if (existing) {
        return {
          ok: true,
          status: 200,
          listing: serializeListing(existing),
          shortCode: existing.short_code
        };
      }
    }

    const activeCountRow = db
      .prepare("SELECT COUNT(*) AS cnt FROM listings WHERE contact_phone = ? AND status = 'active' AND expires_at > ?")
      .get(data.contactPhone, currentNow);
    if (activeCountRow && activeCountRow.cnt >= MAX_ACTIVE_LISTINGS_PER_PHONE) {
      return {
        ok: false,
        status: 409,
        error: 'Số điện thoại này đã đạt tối đa 5 tin đang mở'
      };
    }

    const shortCode = generateShortCode();
    const expiresAt = currentNow + data.expiryDays * DAY_MS;

    const info = db.prepare(`
      INSERT INTO listings (
        short_code, category, offer_type, price_note, raw_quantity, raw_unit,
        estimated_kg, lat, lng, location_note, contact_name, contact_phone,
        is_proxy_post, raw_voice_text, client_request_id, status, report_count,
        created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?)
    `).run(
      shortCode,
      data.category,
      data.offerType,
      data.priceNote,
      data.rawQuantity,
      data.rawUnit,
      data.estimatedKg,
      data.lat,
      data.lng,
      data.locationNote,
      data.contactName,
      data.contactPhone,
      data.isProxyPost ? 1 : 0,
      data.rawVoiceText,
      data.clientRequestId,
      currentNow,
      expiresAt
    );

    const inserted = db
      .prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE id = ?`)
      .get(Number(info.lastInsertRowid));

    return {
      ok: true,
      status: 201,
      listing: serializeListing(inserted),
      shortCode
    };
  });
}

export function collectListing(db, { idNum, rawBody, currentNow, isBlocked }) {
  return runInTransaction(db, () => {
    const row = db
      .prepare('SELECT id, short_code, estimated_kg, status, expires_at FROM listings WHERE id = ?')
      .get(idNum);
    if (!row) {
      return { ok: false, status: 404, error: 'Không tìm thấy tin đăng' };
    }

    if (isBlocked()) {
      return { ok: false, status: 429, error: 'Nhập sai mã xác nhận quá nhiều lần, vui lòng thử lại sau 15 phút' };
    }

    if (!verifyShortCode(rawBody.shortCode, row.short_code)) {
      return {
        ok: false,
        status: 403,
        recordFailure: true,
        error: 'Mã xác nhận 4 ký tự không đúng'
      };
    }

    if (row.status !== 'active' || row.expires_at <= currentNow) {
      return {
        ok: false,
        status: 409,
        error: 'Tin đăng không còn ở trạng thái đang mở hoặc đã hết hạn'
      };
    }

    const collectValidation = validateCollectBody({
      shortCode: row.short_code,
      actualKgCollected: rawBody.actualKgCollected
    });
    if (!collectValidation.ok) {
      return { ok: false, status: 400, error: collectValidation.error };
    }

    const maxAllowedKg = Math.min(MAX_KG_LIMIT, Math.max(500, row.estimated_kg * 3));
    const actualKg = collectValidation.value.actualKgCollected;
    if (actualKg !== null && actualKg > maxAllowedKg) {
      return {
        ok: false,
        status: 400,
        error: `Khối lượng thu gom thực tế vượt quá giới hạn cho phép (${maxAllowedKg} kg)`
      };
    }

    const updateRes = db
      .prepare(
        "UPDATE listings SET status = 'collected', collected_at = ?, actual_kg_collected = ? WHERE id = ? AND status = 'active' AND expires_at > ?"
      )
      .run(currentNow, actualKg, idNum, currentNow);
    if (updateRes.changes !== 1) {
      return {
        ok: false,
        status: 409,
        error: 'Tin đăng đã được xử lý trước đó'
      };
    }

    const updated = db
      .prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE id = ?`)
      .get(idNum);

    return {
      ok: true,
      status: 200,
      listing: serializeListing(updated)
    };
  });
}

export function reportListing(db, { idNum, voterHash, currentNow, recordRateSlot, checkRateSlot }) {
  return runInTransaction(db, () => {
    const row = db
      .prepare('SELECT id, status, expires_at FROM listings WHERE id = ?')
      .get(idNum);
    if (!row) {
      return { ok: false, status: 404, error: 'Không tìm thấy tin đăng' };
    }

    if (row.status !== 'active' || row.expires_at <= currentNow) {
      return { ok: false, status: 409, error: 'Chỉ có thể báo cáo tin đăng đang mở và còn hạn' };
    }

    if (typeof checkRateSlot === 'function') {
      const rateCheck = checkRateSlot();
      if (!rateCheck.allowed) {
        return {
          ok: false,
          status: 429,
          error: 'Bạn vừa báo cáo tin này, vui lòng thử lại sau 15 phút',
          retryAfterSeconds: rateCheck.retryAfterSeconds
        };
      }
    }

    db.prepare('INSERT OR IGNORE INTO listing_reports (listing_id, voter_hash, created_at) VALUES (?, ?, ?)').run(
      idNum,
      voterHash,
      currentNow
    );

    const countRow = db
      .prepare('SELECT COUNT(*) AS cnt FROM listing_reports WHERE listing_id = ?')
      .get(idNum);
    const reportCount = countRow ? countRow.cnt : 0;

    if (reportCount >= 3) {
      db.prepare("UPDATE listings SET report_count = ?, status = 'reported' WHERE id = ? AND status = 'active' AND expires_at > ?").run(
        reportCount,
        idNum,
        currentNow
      );
    } else {
      db.prepare("UPDATE listings SET report_count = ? WHERE id = ? AND status = 'active' AND expires_at > ?").run(
        reportCount,
        idNum,
        currentNow
      );
    }

    recordRateSlot();

    const updated = db
      .prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE id = ?`)
      .get(idNum);

    return {
      ok: true,
      status: 200,
      listing: serializeListing(updated)
    };
  });
}

export function flushCalculationMetric(db, { delta, clientRequestId }, currentNow) {
  return runInTransaction(db, () => {
    const insertRes = db
      .prepare('INSERT OR IGNORE INTO metric_flushes (client_request_id, delta, created_at) VALUES (?, ?, ?)')
      .run(clientRequestId, delta, currentNow);
    const totalPriceCalculations = readTotalCalculations(db);
    return {
      ok: true,
      applied: insertRes.changes === 1,
      totalPriceCalculations
    };
  });
}

function readTotalCalculations(db) {
  const archivedRow = db
    .prepare('SELECT value FROM server_meta WHERE key = ?')
    .get('calc_total_archived');
  const archived = parseNonNegativeIntString(archivedRow?.value);
  const sumRow = db.prepare('SELECT COALESCE(SUM(delta), 0) AS total FROM metric_flushes').get();
  return archived + (sumRow ? sumRow.total : 0);
}

export function getImpactMetrics(db, currentNow) {
  const counts = db
    .prepare(`
      SELECT
        COUNT(*) AS total_listings,
        SUM(CASE WHEN status = 'active' AND expires_at > ? THEN 1 ELSE 0 END) AS active_listings,
        SUM(CASE WHEN status = 'collected' THEN 1 ELSE 0 END) AS collected_listings,
        COALESCE(SUM(CASE WHEN status = 'collected' THEN COALESCE(actual_kg_collected, estimated_kg) ELSE 0 END), 0) AS total_kg_diverted
      FROM listings
    `)
    .get(currentNow);

  const totalListings = counts?.total_listings ?? 0;
  const activeListings = counts?.active_listings ?? 0;
  const collectedListings = counts?.collected_listings ?? 0;
  const totalKgDiverted = counts?.total_kg_diverted ?? 0;
  const estimatedCo2SavedKg = Math.round(totalKgDiverted * CO2_KG_PER_KG_DIVERTED * 100) / 100;
  const totalPriceCalculations = readTotalCalculations(db);

  return {
    totalListings,
    activeListings,
    collectedListings,
    totalKgDiverted,
    estimatedCo2SavedKg,
    totalPriceCalculations
  };
}

export function adminPatchListing(db, { idNum, rawBody, currentNow }) {
  if (!isPlainObject(rawBody) || typeof rawBody.action !== 'string') {
    return { ok: false, status: 400, error: 'Hành động quản trị không hợp lệ' };
  }

  const { action, ...rest } = rawBody;

  if (action === 'hide') {
    if (Object.keys(rest).length > 0) {
      return { ok: false, status: 400, error: 'Hành động ẩn tin không nhận thêm trường dữ liệu' };
    }
    return runInTransaction(db, () => {
      const row = db.prepare('SELECT id, status FROM listings WHERE id = ?').get(idNum);
      if (!row) {
        return { ok: false, status: 404, error: 'Không tìm thấy tin đăng' };
      }
      if (row.status !== 'active' && row.status !== 'reported') {
        return { ok: false, status: 409, error: 'Không thể ẩn tin ở trạng thái hiện tại' };
      }
      const res = db
        .prepare("UPDATE listings SET status = 'hidden' WHERE id = ? AND status IN ('active', 'reported')")
        .run(idNum);
      if (res.changes !== 1) {
        return { ok: false, status: 409, error: 'Trạng thái tin đăng đã thay đổi' };
      }
      const updated = db.prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE id = ?`).get(idNum);
      return { ok: true, status: 200, listing: serializeListing(updated) };
    });
  }

  if (action === 'restore') {
    const restKeys = Object.keys(rest);
    if (restKeys.some((k) => k !== 'expiryDays')) {
      return { ok: false, status: 400, error: 'Trường khôi phục tin không hợp lệ' };
    }
    let hasExpiry = false;
    let expiryDays = 0;
    if (Object.hasOwn(rest, 'expiryDays')) {
      if (
        typeof rest.expiryDays !== 'number' ||
        !Number.isInteger(rest.expiryDays) ||
        rest.expiryDays < 1 ||
        rest.expiryDays > 14
      ) {
        return { ok: false, status: 400, error: 'Số ngày hết hạn phải là số nguyên từ 1 đến 14' };
      }
      hasExpiry = true;
      expiryDays = rest.expiryDays;
    }

    return runInTransaction(db, () => {
      const row = db.prepare('SELECT id, status, expires_at FROM listings WHERE id = ?').get(idNum);
      if (!row) {
        return { ok: false, status: 404, error: 'Không tìm thấy tin đăng' };
      }
      if (row.status !== 'reported' && row.status !== 'hidden') {
        return { ok: false, status: 409, error: 'Chỉ có thể khôi phục tin bị báo cáo hoặc đã ẩn' };
      }
      let nextExpiresAt = row.expires_at;
      if (hasExpiry) {
        nextExpiresAt = currentNow + expiryDays * DAY_MS;
      } else if (row.expires_at <= currentNow) {
        return { ok: false, status: 409, error: 'Tin đã hết hạn, cần gia hạn expiryDays để khôi phục' };
      }

      db.prepare('DELETE FROM listing_reports WHERE listing_id = ?').run(idNum);
      const res = db
        .prepare(
          "UPDATE listings SET status = 'active', report_count = 0, expires_at = ? WHERE id = ? AND status IN ('reported', 'hidden')"
        )
        .run(nextExpiresAt, idNum);
      if (res.changes !== 1) {
        return { ok: false, status: 409, error: 'Trạng thái tin đăng đã thay đổi' };
      }
      const updated = db.prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE id = ?`).get(idNum);
      return { ok: true, status: 200, listing: serializeListing(updated) };
    });
  }

  if (action === 'edit') {
    const validated = validateAdminPatchListing(rest);
    if (!validated.ok) {
      return { ok: false, status: 400, error: validated.error };
    }
    const patch = validated.value;

    return runInTransaction(db, () => {
      const row = db.prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE id = ?`).get(idNum);
      if (!row) {
        return { ok: false, status: 404, error: 'Không tìm thấy tin đăng' };
      }
      if (row.status === 'collected') {
        return { ok: false, status: 409, error: 'Không thể chỉnh sửa tin đã thu gom' };
      }

      const category = Object.hasOwn(patch, 'category') ? patch.category : row.category;
      const rawQuantity = Object.hasOwn(patch, 'rawQuantity') ? patch.rawQuantity : row.raw_quantity;
      const rawUnit = Object.hasOwn(patch, 'rawUnit') ? patch.rawUnit : row.raw_unit;
      const offerType = Object.hasOwn(patch, 'offerType') ? patch.offerType : row.offer_type;
      const priceNote = Object.hasOwn(patch, 'priceNote') ? patch.priceNote : row.price_note;
      const locationNote = Object.hasOwn(patch, 'locationNote') ? patch.locationNote : row.location_note;
      const expiresAt = Object.hasOwn(patch, 'expiryDays')
        ? currentNow + patch.expiryDays * DAY_MS
        : row.expires_at;

      const estimatedKg = convertToKg({ category, rawQuantity, rawUnit });
      if (!Number.isFinite(estimatedKg) || !(estimatedKg > 0 && estimatedKg <= MAX_KG_LIMIT)) {
        return { ok: false, status: 400, error: 'Khối lượng quy đổi vượt giới hạn 100.000 kg' };
      }

      const res = db
        .prepare(`
          UPDATE listings
          SET category = ?, raw_quantity = ?, raw_unit = ?, estimated_kg = ?,
              offer_type = ?, price_note = ?, location_note = ?, expires_at = ?
          WHERE id = ? AND status != 'collected'
        `)
        .run(
          category,
          rawQuantity,
          rawUnit,
          estimatedKg,
          offerType,
          priceNote,
          locationNote,
          expiresAt,
          idNum
        );
      if (res.changes !== 1) {
        return { ok: false, status: 409, error: 'Tin đăng đã được thu gom trong lúc cập nhật' };
      }

      const updated = db.prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings WHERE id = ?`).get(idNum);
      return { ok: true, status: 200, listing: serializeListing(updated) };
    });
  }

  return { ok: false, status: 400, error: 'Hành động quản trị không được hỗ trợ' };
}

export function getCsvExportSnapshot(db, currentNow) {
  return runInTransaction(db, () => {
    const rows = db
      .prepare(`SELECT ${PUBLIC_LISTING_COLUMNS} FROM listings ORDER BY id ASC LIMIT 10000`)
      .all();
    const impact = getImpactMetrics(db, currentNow);
    return { rows, impact };
  });
}
