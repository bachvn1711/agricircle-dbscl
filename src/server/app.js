import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { getCropById, isValidByproductCategory } from '../shared/crops.js';
import { isValidCoordinates, sortByDistance } from '../shared/geo.js';
import { isValidAdminPin, isPlainObject, validateCalcFlush, validateCreateListing, validateCropUpdate } from '../shared/validation.js';
import {
  ADMIN_COOKIE_NAME,
  VOTER_COOKIE_NAME,
  buildAdminClearCookie,
  buildAdminSetCookie,
  buildVoterSetCookie,
  createAdminSessionStore,
  extractClientIp,
  hashVoterIdentity,
  mintVoterCookieValue,
  parseCookies,
  verifyAdminPin,
  verifyVoterCookieValue
} from './auth.js';
import { buildListingsCsv } from './csv.js';
import {
  adminPatchListing,
  collectListing,
  createListing,
  flushCalculationMetric,
  getAdminListings,
  getCookieHmacSecret,
  getCropsWithOverrides,
  getCsvExportSnapshot,
  getImpactMetrics,
  getPublicListings,
  openDatabase,
  reportListing,
  updateCropOverride
} from './db.js';
import { createRateLimiter } from './rate-limit.js';
import {
  createRouteTable,
  isAdminGuardPath,
  matchApiRoute,
  matchStaticAsset,
  normalizeRequestPathname,
  parseCanonicalListingId
} from './router.js';

const MAX_BODY_BYTES = 32 * 1024;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const POSITIVE_INT_QUERY_REGEX = /^[1-9]\d{0,4}$/;
const FLOAT_QUERY_REGEX = /^-?\d+(?:\.\d+)?$/;

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(body, 'utf8'),
    ...extraHeaders
  });
  res.end(body);
}

function sendError(res, status, message, extraHeaders = {}) {
  sendJson(res, status, { error: message }, extraHeaders);
}

function readJsonBody(req, { allowEmpty = false } = {}) {
  return new Promise((resolve) => {
    const rawContentType = req.headers['content-type'];
    if (typeof rawContentType === 'string') {
      const mime = rawContentType.split(';')[0].trim().toLowerCase();
      if (mime !== 'application/json') {
        resolve({ ok: false, status: 415, error: 'Định dạng dữ liệu yêu cầu phải là application/json' });
        return;
      }
    } else if (!allowEmpty) {
      resolve({ ok: false, status: 415, error: 'Định dạng dữ liệu yêu cầu phải là application/json' });
      return;
    }

    const contentLengthHeader = req.headers['content-length'];
    if (typeof contentLengthHeader === 'string' && /^\d+$/.test(contentLengthHeader.trim())) {
      const declared = Number(contentLengthHeader.trim());
      if (declared > MAX_BODY_BYTES) {
        req.resume();
        resolve({ ok: false, status: 413, error: 'Dữ liệu gửi lên vượt quá giới hạn 32 KB', closeConnection: true });
        return;
      }
    }

    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    function finish(result) {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    }

    req.on('data', (chunk) => {
      if (settled) {
        return;
      }
      totalBytes += chunk.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        req.pause();
        finish({ ok: false, status: 413, error: 'Dữ liệu gửi lên vượt quá giới hạn 32 KB', closeConnection: true });
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) {
        return;
      }
      if (totalBytes === 0) {
        if (allowEmpty) {
          finish({ ok: true, value: {} });
          return;
        }
        finish({ ok: false, status: 400, error: 'Thiếu dữ liệu JSON trong thân yêu cầu' });
        return;
      }
      const raw = Buffer.concat(chunks, totalBytes).toString('utf8');
      try {
        const parsed = JSON.parse(raw);
        finish({ ok: true, value: parsed });
      } catch {
        finish({ ok: false, status: 400, error: 'Dữ liệu JSON không hợp lệ' });
      }
    });

    req.on('aborted', () => {
      finish({ ok: false, status: 400, error: 'Kết nối gửi dữ liệu bị gián đoạn' });
    });

    req.on('error', () => {
      finish({ ok: false, status: 400, error: 'Không thể đọc dữ liệu yêu cầu' });
    });
  });
}

function parsePositiveIntQuery(raw, maxVal, fallback) {
  if (raw === null || raw === '') {
    return { ok: true, value: fallback };
  }
  if (!POSITIVE_INT_QUERY_REGEX.test(raw)) {
    return { ok: false };
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return { ok: false };
  }
  return { ok: true, value: Math.min(parsed, maxVal) };
}

function parseFloatQuery(raw) {
  if (raw === null || raw === '') {
    return { ok: true, value: null };
  }
  if (!FLOAT_QUERY_REGEX.test(raw)) {
    return { ok: false };
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return { ok: false };
  }
  return { ok: true, value: parsed };
}

function parsePublicListingsQuery(search) {
  const params = new URLSearchParams(search);

  const limitRes = parsePositiveIntQuery(params.get('limit'), 200, 200);
  if (!limitRes.ok) {
    return { ok: false, error: 'Tham số limit không hợp lệ' };
  }

  const latParam = params.get('lat');
  const lngParam = params.get('lng');
  const hasLat = latParam !== null && latParam !== '';
  const hasLng = lngParam !== null && lngParam !== '';
  let origin = null;
  if (hasLat || hasLng) {
    if (!hasLat || !hasLng) {
      return { ok: false, error: 'Cần cung cấp đủ cả vĩ độ và kinh độ' };
    }
    const latRes = parseFloatQuery(latParam);
    const lngRes = parseFloatQuery(lngParam);
    if (!latRes.ok || !lngRes.ok || !isValidCoordinates(latRes.value, lngRes.value)) {
      return { ok: false, error: 'Tọa độ lọc không hợp lệ' };
    }
    origin = { lat: latRes.value, lng: lngRes.value };
  }

  const radiusParam = params.get('radiusKm');
  let radiusKm = null;
  if (radiusParam !== null && radiusParam !== '' && radiusParam !== 'all') {
    const radiusRes = parseFloatQuery(radiusParam);
    if (!radiusRes.ok || radiusRes.value === null || !(radiusRes.value > 0 && radiusRes.value <= 10_000)) {
      return { ok: false, error: 'Bán kính lọc không hợp lệ' };
    }
    radiusKm = radiusRes.value;
  }

  const categoryParam = params.get('category');
  let category = null;
  if (categoryParam !== null && categoryParam !== '' && categoryParam !== 'all') {
    if (!isValidByproductCategory(categoryParam)) {
      return { ok: false, error: 'Nhóm phụ phẩm không hợp lệ' };
    }
    category = categoryParam;
  }

  const offerParam = params.get('offerType');
  let offerType = null;
  if (offerParam !== null && offerParam !== '' && offerParam !== 'all') {
    if (offerParam !== 'free' && offerParam !== 'sell') {
      return { ok: false, error: 'Hình thức đăng không hợp lệ' };
    }
    offerType = offerParam;
  }

  return {
    ok: true,
    value: {
      limit: limitRes.value,
      origin,
      radiusKm,
      category,
      offerType
    }
  };
}

export async function createApp({
  dbPath = 'data/agricircle.db',
  adminPin,
  staticDir = path.resolve('public'),
  sharedDir = path.resolve('src/shared'),
  leafletDistDir = path.resolve('node_modules/leaflet/dist'),
  now = () => Date.now()
} = {}) {
  if (typeof now !== 'function') {
    throw new TypeError('Tùy chọn now phải là một hàm');
  }
  if (typeof dbPath !== 'string' || dbPath.trim() === '') {
    throw new Error('Đường dẫn cơ sở dữ liệu dbPath không hợp lệ');
  }

  const db = openDatabase({ dbPath, now });
  let cookieHmacSecret;
  let sessionStore;
  let rateLimiter;
  try {
    cookieHmacSecret = getCookieHmacSecret(db);
    sessionStore = createAdminSessionStore({ now });
    rateLimiter = createRateLimiter({ now });
  } catch (err) {
    if (rateLimiter) {
      rateLimiter.close();
    }
    if (sessionStore) {
      sessionStore.clear();
    }
    if (db.isOpen) {
      db.close();
    }
    throw err;
  }
  const routeTable = createRouteTable();
  const staticDirs = { staticDir, sharedDir, leafletDistDir };

  let closed = false;
  let closePromise = null;

  function ensureOpen(res) {
    if (closed || !db.isOpen) {
      sendError(res, 503, 'Máy chủ đang tạm ngưng', { Connection: 'close' });
      return false;
    }
    return true;
  }

  function requireAdminConfigured(res) {
    if (!isValidAdminPin(adminPin)) {
      sendError(res, 503, 'Chưa cấu hình mã PIN quản trị hợp lệ');
      return false;
    }
    return true;
  }

  function requireAdminSession(req, res) {
    if (!requireAdminConfigured(res)) {
      return false;
    }
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.get(ADMIN_COOKIE_NAME);
    if (!sessionStore.verifySession(token)) {
      sendError(res, 401, 'Phiên quản trị không hợp lệ hoặc đã hết hạn');
      return false;
    }
    return true;
  }

  function sendBodyReadError(req, res, bodyResult) {
    if (bodyResult.closeConnection) {
      res.once('finish', () => {
        if (!req.complete) {
          req.destroy();
        }
      });
      sendError(res, bodyResult.status, bodyResult.error, { Connection: 'close' });
      return;
    }
    sendError(res, bodyResult.status, bodyResult.error);
  }

  async function handleAdminLogin(req, res, clientIp) {
    if (!requireAdminConfigured(res)) {
      return;
    }
    const bodyResult = await readJsonBody(req);
    if (!ensureOpen(res)) {
      return;
    }
    if (!bodyResult.ok) {
      sendBodyReadError(req, res, bodyResult);
      return;
    }
    if (!isPlainObject(bodyResult.value) || typeof bodyResult.value.pin !== 'string') {
      sendError(res, 400, 'Mã PIN phải là chuỗi ký tự');
      return;
    }

    const limitRes = rateLimiter.consume(`admin_login:${clientIp}`, 5, FIFTEEN_MINUTES_MS);
    if (!limitRes.allowed) {
      sendError(res, 429, 'Nhập sai mã PIN quá nhiều lần, vui lòng thử lại sau 15 phút', {
        'Retry-After': String(limitRes.retryAfterSeconds)
      });
      return;
    }

    if (!verifyAdminPin(bodyResult.value.pin, adminPin)) {
      sendError(res, 401, 'Mã PIN quản trị không đúng');
      return;
    }

    const session = sessionStore.createSession();
    sendJson(
      res,
      200,
      { ok: true },
      {
        'Set-Cookie': buildAdminSetCookie(session.token, Boolean(req.socket?.encrypted))
      }
    );
  }

  function handleAdminLogout(req, res) {
    if (!requireAdminConfigured(res)) {
      return;
    }
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.get(ADMIN_COOKIE_NAME);
    if (token) {
      sessionStore.revokeSession(token);
    }
    sendJson(
      res,
      200,
      { ok: true },
      {
        'Set-Cookie': buildAdminClearCookie(Boolean(req.socket?.encrypted))
      }
    );
  }

  function handleAdminGetListings(req, res, search) {
    if (!requireAdminSession(req, res)) {
      return;
    }
    const params = new URLSearchParams(search);
    const limitRes = parsePositiveIntQuery(params.get('limit'), 200, 200);
    if (!limitRes.ok) {
      sendError(res, 400, 'Tham số limit không hợp lệ');
      return;
    }
    const listings = getAdminListings(db, limitRes.value);
    sendJson(res, 200, { listings });
  }

  async function handleAdminPatchListing(req, res, routeParams) {
    if (!requireAdminSession(req, res)) {
      return;
    }
    const idNum = parseCanonicalListingId(routeParams.id);
    if (idNum === null) {
      sendError(res, 404, 'Không tìm thấy tin đăng');
      return;
    }
    const bodyResult = await readJsonBody(req);
    if (!ensureOpen(res)) {
      return;
    }
    if (!bodyResult.ok) {
      sendBodyReadError(req, res, bodyResult);
      return;
    }
    const result = adminPatchListing(db, {
      idNum,
      rawBody: bodyResult.value,
      currentNow: now()
    });
    if (!result.ok) {
      sendError(res, result.status, result.error);
      return;
    }
    sendJson(res, 200, { listing: result.listing });
  }

  async function handleAdminPatchCrop(req, res, routeParams) {
    if (!requireAdminSession(req, res)) {
      return;
    }
    const cropId = routeParams.id;
    const bodyResult = await readJsonBody(req);
    if (!ensureOpen(res)) {
      return;
    }
    if (!bodyResult.ok) {
      sendBodyReadError(req, res, bodyResult);
      return;
    }
    if (!getCropById(cropId)) {
      sendError(res, 404, 'Không tìm thấy loại nông sản này');
      return;
    }
    const validated = validateCropUpdate(bodyResult.value);
    if (!validated.ok) {
      sendError(res, 400, validated.error);
      return;
    }
    const result = updateCropOverride(db, cropId, validated.value, now());
    if (!result.ok) {
      sendError(res, result.status, result.error);
      return;
    }
    sendJson(res, 200, { crop: result.crop });
  }

  function handleAdminExportCsv(req, res) {
    if (!requireAdminSession(req, res)) {
      return;
    }
    const snapshot = getCsvExportSnapshot(db, now());
    const csvText = buildListingsCsv(snapshot.rows, snapshot.impact);
    const body = Buffer.from(csvText, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="agricircle-listings.csv"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Length': body.byteLength
    });
    res.end(body);
  }

  async function handleRequest(req, res) {
    if (closed) {
      sendError(res, 503, 'Máy chủ đang tạm ngưng', { Connection: 'close' });
      return;
    }

    const method = (req.method || 'GET').toUpperCase();
    const norm = normalizeRequestPathname(req.url);
    if (!norm.ok) {
      sendError(res, norm.status, norm.error);
      return;
    }

    const { pathname, guardPath, search } = norm;
    const clientIp = extractClientIp(req);

    if (isAdminGuardPath(guardPath)) {
      if (!requireAdminConfigured(res)) {
        return;
      }
      const isExemptLogin = method === 'POST' && pathname === '/api/admin/login';
      const isExemptLogout = method === 'POST' && pathname === '/api/admin/logout';
      if (!isExemptLogin && !isExemptLogout && !requireAdminSession(req, res)) {
        return;
      }
    }

    const apiMatch = matchApiRoute(routeTable, method, pathname);
    if (apiMatch) {
      switch (apiMatch.name) {
        case 'health':
          sendJson(res, 200, { ok: true, now: now() });
          return;

        case 'getCrops':
          sendJson(res, 200, { crops: getCropsWithOverrides(db) });
          return;

        case 'getListings': {
          const parsedQuery = parsePublicListingsQuery(search);
          if (!parsedQuery.ok) {
            sendError(res, 400, parsedQuery.error);
            return;
          }
          const { limit, origin, radiusKm, category, offerType } = parsedQuery.value;
          const items = getPublicListings(db, { category, offerType }, now());
          let sorted = sortByDistance(items, origin?.lat, origin?.lng);
          if (origin && radiusKm !== null) {
            sorted = sorted.filter((item) => item.distanceKm !== null && item.distanceKm <= radiusKm);
          }
          sendJson(res, 200, { listings: sorted.slice(0, limit) });
          return;
        }

        case 'createListing': {
          const limitRes = rateLimiter.consume(`create_listing:${clientIp}`, 60, FIFTEEN_MINUTES_MS);
          if (!limitRes.allowed) {
            sendError(res, 429, 'Thao tác đăng tin quá nhanh, vui lòng thử lại sau ít phút', {
              'Retry-After': String(limitRes.retryAfterSeconds)
            });
            return;
          }
          const bodyResult = await readJsonBody(req);
          if (!ensureOpen(res)) {
            return;
          }
          if (!bodyResult.ok) {
            sendBodyReadError(req, res, bodyResult);
            return;
          }
          const validated = validateCreateListing(bodyResult.value);
          if (!validated.ok) {
            sendError(res, 400, validated.error);
            return;
          }
          const result = createListing(db, validated.value, now());
          if (!result.ok) {
            sendError(res, result.status, result.error);
            return;
          }
          sendJson(res, result.status, {
            listing: result.listing,
            shortCode: result.shortCode
          });
          return;
        }

        case 'collectListing': {
          const ipLimit = rateLimiter.consume(`collect_ip:${clientIp}`, 60, FIFTEEN_MINUTES_MS);
          if (!ipLimit.allowed) {
            sendError(res, 429, 'Thao tác quá nhanh, vui lòng thử lại sau ít phút', {
              'Retry-After': String(ipLimit.retryAfterSeconds)
            });
            return;
          }
          const idNum = parseCanonicalListingId(apiMatch.params.id);
          if (idNum === null) {
            sendError(res, 404, 'Không tìm thấy tin đăng');
            return;
          }
          const bodyResult = await readJsonBody(req);
          if (!ensureOpen(res)) {
            return;
          }
          if (!bodyResult.ok) {
            sendBodyReadError(req, res, bodyResult);
            return;
          }
          if (!isPlainObject(bodyResult.value)) {
            sendError(res, 400, 'Dữ liệu xác nhận thu gom không hợp lệ');
            return;
          }

          const collectKey = `collect_fail:${JSON.stringify([clientIp, idNum])}`;
          const result = collectListing(db, {
            idNum,
            rawBody: bodyResult.value,
            currentNow: now(),
            isBlocked: () => !rateLimiter.check(collectKey, 5, FIFTEEN_MINUTES_MS).allowed
          });
          if (!result.ok) {
            if (result.recordFailure) {
              rateLimiter.record(collectKey, FIFTEEN_MINUTES_MS);
            }
            sendError(res, result.status, result.error);
            return;
          }
          sendJson(res, 200, { listing: result.listing });
          return;
        }

        case 'reportListing': {
          const ipLimit = rateLimiter.consume(`report_ip:${clientIp}`, 60, FIFTEEN_MINUTES_MS);
          if (!ipLimit.allowed) {
            sendError(res, 429, 'Thao tác báo cáo quá nhanh, vui lòng thử lại sau ít phút', {
              'Retry-After': String(ipLimit.retryAfterSeconds)
            });
            return;
          }
          const idNum = parseCanonicalListingId(apiMatch.params.id);
          if (idNum === null) {
            sendError(res, 404, 'Không tìm thấy tin đăng');
            return;
          }
          const bodyResult = await readJsonBody(req, { allowEmpty: true });
          if (!ensureOpen(res)) {
            return;
          }
          if (!bodyResult.ok) {
            sendBodyReadError(req, res, bodyResult);
            return;
          }
          if (!isPlainObject(bodyResult.value)) {
            sendError(res, 400, 'Dữ liệu báo cáo tin đăng không hợp lệ');
            return;
          }

          const reportKey = `report_key:${JSON.stringify([clientIp, idNum])}`;
          const cookies = parseCookies(req.headers.cookie);
          const voterToken = verifyVoterCookieValue(cookies.get(VOTER_COOKIE_NAME), cookieHmacSecret);
          const voterHash = hashVoterIdentity({ voterToken, clientIp });

          const result = reportListing(db, {
            idNum,
            voterHash,
            currentNow: now(),
            checkRateSlot: () => rateLimiter.check(reportKey, 1, FIFTEEN_MINUTES_MS),
            recordRateSlot: () => rateLimiter.record(reportKey, FIFTEEN_MINUTES_MS)
          });
          if (!result.ok) {
            const extraHeaders = result.retryAfterSeconds ? { 'Retry-After': String(result.retryAfterSeconds) } : undefined;
            sendError(res, result.status, result.error, extraHeaders);
            return;
          }
          sendJson(res, 200, { listing: result.listing });
          return;
        }

        case 'flushCalcMetric': {
          const bodyResult = await readJsonBody(req);
          if (!ensureOpen(res)) {
            return;
          }
          if (!bodyResult.ok) {
            sendBodyReadError(req, res, bodyResult);
            return;
          }
          const limitRes = rateLimiter.consume(`calc_flush:${clientIp}`, 120, FIFTEEN_MINUTES_MS);
          if (!limitRes.allowed) {
            sendError(res, 429, 'Gửi đồng bộ quá nhanh, vui lòng thử lại sau ít phút', {
              'Retry-After': String(limitRes.retryAfterSeconds)
            });
            return;
          }
          const validated = validateCalcFlush(bodyResult.value);
          if (!validated.ok) {
            sendError(res, 400, validated.error);
            return;
          }
          const result = flushCalculationMetric(db, validated.value, now());
          sendJson(res, 200, result);
          return;
        }

        case 'getImpact':
          sendJson(res, 200, getImpactMetrics(db, now()));
          return;

        case 'adminLogin':
          await handleAdminLogin(req, res, clientIp);
          return;

        case 'adminLogout':
          handleAdminLogout(req, res);
          return;

        case 'adminGetListings':
          handleAdminGetListings(req, res, search);
          return;

        case 'adminPatchListing':
          await handleAdminPatchListing(req, res, apiMatch.params);
          return;

        case 'adminPatchCrop':
          await handleAdminPatchCrop(req, res, apiMatch.params);
          return;

        case 'adminExportCsv':
          handleAdminExportCsv(req, res);
          return;

        default:
          break;
      }
    }

    if (method === 'GET' || method === 'HEAD') {
      const staticMatch = matchStaticAsset(routeTable, pathname, staticDirs);
      if (staticMatch && staticMatch.asset) {
        let data;
        try {
          data = fs.readFileSync(staticMatch.asset.filePath);
        } catch {
          sendError(res, 404, 'Không tìm thấy tài nguyên yêu cầu');
          return;
        }
        const headers = {
          'Content-Type': staticMatch.asset.contentType,
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'Content-Length': data.byteLength
        };
        if (staticMatch.isRoot) {
          const cookies = parseCookies(req.headers.cookie);
          const existingVoter = verifyVoterCookieValue(cookies.get(VOTER_COOKIE_NAME), cookieHmacSecret);
          if (!existingVoter) {
            const freshVoter = mintVoterCookieValue(cookieHmacSecret);
            headers['Set-Cookie'] = buildVoterSetCookie(freshVoter, Boolean(req.socket?.encrypted));
          }
        }
        res.writeHead(200, headers);
        res.end(method === 'HEAD' ? undefined : data);
        return;
      }
    }

    sendError(res, 404, 'Không tìm thấy tài nguyên yêu cầu');
  }

  const server = http.createServer((req, res) => {
    Promise.resolve(handleRequest(req, res)).catch(() => {
      if (!res.headersSent) {
        sendError(res, 500, 'Lỗi máy chủ nội bộ');
      } else {
        res.destroy();
      }
    });
  });

  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  async function close() {
    if (closePromise) {
      return closePromise;
    }
    closePromise = (async () => {
      closed = true;
      if (server.listening) {
        if (typeof server.closeIdleConnections === 'function') {
          server.closeIdleConnections();
        }
        await new Promise((resolve) => {
          server.close(() => resolve());
        });
      }
      rateLimiter.close();
      sessionStore.clear();
      if (db.isOpen) {
        db.close();
      }
    })();
    return closePromise;
  }

  return { server, db, close };
}
