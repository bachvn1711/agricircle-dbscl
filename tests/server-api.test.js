import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { createApp } from '../src/server/app.js';

function createTempStaticDir(baseDir) {
  const staticDir = path.join(baseDir, 'static');
  fs.mkdirSync(path.join(staticDir, 'styles'), { recursive: true });
  fs.mkdirSync(path.join(staticDir, 'js'), { recursive: true });
  fs.mkdirSync(path.join(staticDir, 'icons'), { recursive: true });
  fs.writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><html><body>AgriCircle</body></html>');
  fs.writeFileSync(path.join(staticDir, 'manifest.webmanifest'), '{"name":"AgriCircle"}');
  fs.writeFileSync(path.join(staticDir, 'sw.js'), 'export const version = 1;\n');
  fs.writeFileSync(path.join(staticDir, 'styles', 'app.css'), 'body { font-size: 16px; }\n');
  fs.writeFileSync(path.join(staticDir, 'js', 'app.js'), 'export const boot = true;\n');
  fs.writeFileSync(path.join(staticDir, 'js', 'app.js.map'), '{"version":3}');
  fs.writeFileSync(path.join(staticDir, 'icons', 'icon-192.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  fs.writeFileSync(path.join(staticDir, 'secret.txt'), 'TOP_SECRET');
  return staticDir;
}

async function startTestApp(options = {}) {
  const tempDir = options.tempDir || fs.mkdtempSync(path.join(os.tmpdir(), 'khkt-api-'));
  const staticDir = options.staticDir || createTempStaticDir(tempDir);
  const dbPath = options.dbPath || path.join(tempDir, 'nested', 'sub', 'test.db');
  const app = await createApp({
    dbPath,
    adminPin: 'adminPin' in options ? options.adminPin : '123456',
    staticDir,
    sharedDir: path.resolve('src/shared'),
    leafletDistDir: path.resolve('node_modules/leaflet/dist'),
    now: options.now
  });
  if (!app.server.listening) {
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  }
  const address = app.server.address();
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;
  async function cleanup(removeDir = !options.keepDir) {
    try {
      await app.close();
    } finally {
      if (removeDir) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }
  return { app, tempDir, staticDir, dbPath, port, baseUrl, cleanup };
}

async function resolveDomainIds() {
  let congUnit = 'cong-nam-bo';
  let romCategory = 'rom-ra';
  let kgUnit = 'kg';
  for (const rel of ['../src/shared/units.js', '../src/shared/crops.js']) {
    try {
      const mod = await import(rel);
      for (const [exportName, val] of Object.entries(mod)) {
        const list = Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : []);
        for (const item of list) {
          if (item && typeof item === 'object' && typeof item.id === 'string') {
            if (/cong/i.test(item.id) || (/unit/i.test(exportName) && (item.areaM2 === 1000 || item.m2 === 1000))) {
              congUnit = item.id;
            }
            if (item.id === 'kg') {
              kgUnit = item.id;
            }
            if (/rom/i.test(item.id)) {
              romCategory = item.id;
            }
          }
        }
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          for (const key of Object.keys(val)) {
            if (/cong/i.test(key)) {
              congUnit = key;
            }
            if (/rom/i.test(key)) {
              romCategory = key;
            }
          }
        }
      }
    } catch {
    }
  }
  return { congUnit, romCategory, kgUnit };
}

async function httpJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (body !== undefined && typeof body !== 'string') {
    body = JSON.stringify(body);
    if (!headers['content-type']) {
      headers['content-type'] = 'application/json';
    }
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, status: res.status, headers: res.headers, text, json };
}

function sendRawHttp(port, requestHead, body = '') {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const chunks = [];
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Raw HTTP timeout'));
    }, 5000);
    socket.on('connect', () => {
      socket.write(requestHead + body);
    });
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('end', () => {
      clearTimeout(timer);
      const raw = Buffer.concat(chunks).toString('utf8');
      const match = /^HTTP\/\d\.\d\s+(\d{3})/.exec(raw);
      resolve({ status: match ? Number(match[1]) : 0, raw });
    });
    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function extractCookiePair(res, cookieName) {
  const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  for (const line of cookies) {
    const pair = line.split(';')[0].trim();
    if (pair.startsWith(`${cookieName}=`)) {
      return { pair, line };
    }
  }
  return null;
}

function extractListings(json) {
  return Array.isArray(json) ? json : (json?.listings || []);
}

function extractCrops(json) {
  return Array.isArray(json) ? json : (json?.crops || []);
}

function extractCreatedListing(json) {
  const item = json?.listing || json || {};
  return {
    id: item.id ?? json?.id,
    shortCode: json?.shortCode ?? item.shortCode,
    estimatedKg: item.estimatedKg ?? json?.estimatedKg,
    rawVoiceText: item.rawVoiceText ?? json?.rawVoiceText,
    isProxyPost: item.isProxyPost ?? json?.isProxyPost
  };
}

function assertNoListingSecrets(item) {
  assert.equal('shortCode' in item, false);
  assert.equal('short_code' in item, false);
  assert.equal('clientRequestId' in item, false);
  assert.equal('client_request_id' in item, false);
}

let reqCounter = 0;
function nextRequestId(prefix = 'req_test_item') {
  reqCounter += 1;
  return `${prefix}_${String(reqCounter).padStart(8, '0')}`;
}

function buildListingPayload(ids, overrides = {}) {
  return {
    category: ids.romCategory,
    offerType: 'free',
    priceNote: '',
    rawQuantity: 2,
    rawUnit: ids.congUnit,
    lat: 10.0452,
    lng: 105.7469,
    locationNote: 'Gan dinh lang Binh Thuy',
    contactName: 'Chu Tu',
    contactPhone: '0912345678',
    isProxyPost: false,
    expiryDays: 3,
    clientRequestId: nextRequestId(),
    ...overrides
  };
}

async function loginAdmin(baseUrl, pin = '123456') {
  const login = await httpJson(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    body: { pin }
  });
  assert.equal(login.status, 200);
  const cookie = extractCookiePair(login.res, 'khkt_admin') || (() => {
    const cookies = login.res.headers.getSetCookie();
    assert.ok(cookies.length > 0);
    return { pair: cookies[0].split(';')[0].trim(), line: cookies[0] };
  })();
  return cookie;
}

test('R1 R10 R14 static allowlist serves /, shared, leaflet, blocks traversal and .map, creates nested db dir, sets khkt_voter cookie, and configures HTTP timeouts', { timeout: 15000 }, async () => {
  const ctx = await startTestApp();
  try {
    assert.equal(fs.existsSync(ctx.dbPath), true);
    assert.equal(ctx.app.server.headersTimeout, 10000);
    assert.equal(ctx.app.server.requestTimeout, 15000);

    const rootRes = await fetch(`${ctx.baseUrl}/`);
    assert.equal(rootRes.status, 200);
    assert.match(rootRes.headers.get('content-type') || '', /text\/html/i);
    assert.equal(rootRes.headers.get('x-content-type-options'), 'nosniff');
    assert.match(rootRes.headers.get('cache-control') || '', /no-cache/i);
    const voterCookie = extractCookiePair(rootRes, 'khkt_voter');
    assert.ok(voterCookie);
    assert.match(voterCookie.line, /httponly/i);
    assert.match(voterCookie.line, /samesite=lax/i);

    const forgedRoot = await fetch(`${ctx.baseUrl}/`, {
      headers: { cookie: 'khkt_voter=tampered.value' }
    });
    assert.equal(forgedRoot.status, 200);
    const refreshedCookie = extractCookiePair(forgedRoot, 'khkt_voter');
    assert.ok(refreshedCookie);
    assert.notEqual(refreshedCookie.pair, 'khkt_voter=tampered.value');

    for (const assetPath of [
      '/manifest.webmanifest',
      '/sw.js',
      '/styles/app.css',
      '/js/app.js',
      '/icons/icon-192.svg',
      '/shared/pricing.js',
      '/vendor/leaflet/leaflet.js',
      '/vendor/leaflet/leaflet.css',
      '/vendor/leaflet/images/marker-icon.png'
    ]) {
      const assetRes = await fetch(`${ctx.baseUrl}${assetPath}`);
      assert.equal(assetRes.status, 200, assetPath);
      assert.equal(assetRes.headers.get('x-content-type-options'), 'nosniff');
    }

    for (const blockedPath of [
      '/js/app.js.map',
      '/vendor/leaflet/leaflet.js.map',
      '/secret.txt'
    ]) {
      const blockedRes = await fetch(`${ctx.baseUrl}${blockedPath}`);
      assert.ok(blockedRes.status === 403 || blockedRes.status === 404, blockedPath);
    }

    for (const traversalPath of [
      '/js/../../package.json',
      '/shared/../server/app.js',
      '/vendor/leaflet/../../package.json'
    ]) {
      const raw = await sendRawHttp(
        ctx.port,
        `GET ${traversalPath} HTTP/1.1\r\nHost: 127.0.0.1:${ctx.port}\r\nConnection: close\r\n\r\n`
      );
      assert.ok([400, 403, 404].includes(raw.status), traversalPath);
    }

    const health = await httpJson(`${ctx.baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal(health.json?.ok, true);
    assert.match(health.headers.get('cache-control') || '', /no-store/i);

    const cropsRes = await httpJson(`${ctx.baseUrl}/api/crops`);
    assert.equal(cropsRes.status, 200);
    assert.match(cropsRes.headers.get('cache-control') || '', /no-store/i);
    const crops = extractCrops(cropsRes.json);
    assert.ok(crops.length >= 8);
    const tomato = crops.find((c) => c.id === 'ca-chua');
    assert.ok(tomato);
    assert.equal(typeof tomato.icon, 'string');
    assert.equal(typeof tomato.dailyDecayRate, 'number');
    assert.equal(typeof tomato.maxShelfLifeDays, 'number');
    assert.equal(typeof tomato.referencePriceVnd, 'number');
    assert.equal(typeof tomato.sourceNote, 'string');
  } finally {
    await ctx.cleanup();
  }
});

test('R2 R10 POST /api/listings computes 2 cong rom-ra = 1111 kg, stores rawVoiceText, hides secrets, sorts Haversine, enforces idempotency, 5-active cap, and input bounds', { timeout: 15000 }, async () => {
  let fakeNow = 1_750_000_000_000;
  const ctx = await startTestApp({ now: () => fakeNow });
  try {
    const ids = await resolveDomainIds();
    const createRes = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, {
        estimatedKg: 99999,
        rawVoiceText: 'Toi co 2 cong rom ra o gan dinh lang',
        isProxyPost: true,
        locationNote: "'; DROP TABLE listings; --",
        lat: 10.1000,
        lng: 105.8000
      })
    });
    assert.ok(createRes.status === 200 || createRes.status === 201);
    const created = extractCreatedListing(createRes.json);
    assert.ok(Number.isSafeInteger(created.id) && created.id > 0);
    assert.match(created.shortCode, /^[0-9A-HJKMNP-TV-Z]{4}$/);
    assert.equal(created.estimatedKg, 1111);
    assert.equal(created.rawVoiceText, 'Toi co 2 cong rom ra o gan dinh lang');
    assert.equal(created.isProxyPost, true);

    const nearRes = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, {
        contactPhone: '0987654321',
        rawQuantity: 100,
        rawUnit: ids.kgUnit,
        lat: 10.0452,
        lng: 105.7469,
        locationNote: 'Ngay cho Noi'
      })
    });
    assert.ok(nearRes.status === 200 || nearRes.status === 201);
    const nearCreated = extractCreatedListing(nearRes.json);

    const listRes = await httpJson(`${ctx.baseUrl}/api/listings?lat=10.0452&lng=105.7469`);
    assert.equal(listRes.status, 200);
    assert.match(listRes.headers.get('cache-control') || '', /no-store/i);
    const feed = extractListings(listRes.json);
    assert.equal(feed.length, 2);
    assert.equal(feed[0].id, nearCreated.id);
    assert.equal(feed[1].id, created.id);
    assert.equal(feed[1].estimatedKg, 1111);
    assert.equal(feed[1].locationNote, "'; DROP TABLE listings; --");
    assert.equal(feed[1].rawVoiceText, 'Toi co 2 cong rom ra o gan dinh lang');
    assertNoListingSecrets(feed[0]);
    assertNoListingSecrets(feed[1]);

    const sharedReqId = nextRequestId('idem_shared_key');
    const [idemA, idemB] = await Promise.all([
      httpJson(`${ctx.baseUrl}/api/listings`, {
        method: 'POST',
        body: buildListingPayload(ids, { contactPhone: '0911111111', clientRequestId: sharedReqId })
      }),
      httpJson(`${ctx.baseUrl}/api/listings`, {
        method: 'POST',
        body: buildListingPayload(ids, { contactPhone: '0911111111', clientRequestId: sharedReqId })
      })
    ]);
    assert.ok([200, 201].includes(idemA.status));
    assert.ok([200, 201].includes(idemB.status));
    const parsedIdemA = extractCreatedListing(idemA.json);
    const parsedIdemB = extractCreatedListing(idemB.json);
    assert.equal(parsedIdemA.id, parsedIdemB.id);
    assert.equal(parsedIdemA.shortCode, parsedIdemB.shortCode);

    const diffPhoneSameReq = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0922222222', clientRequestId: sharedReqId })
    });
    assert.ok([200, 201].includes(diffPhoneSameReq.status));
    assert.notEqual(extractCreatedListing(diffPhoneSameReq.json).id, parsedIdemA.id);

    const cappedPhone = '0912345001';
    const expiringPost = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: cappedPhone, expiryDays: 1 })
    });
    assert.ok([200, 201].includes(expiringPost.status));
    fakeNow += 25 * 3600 * 1000;

    const sevenPosts = await Promise.all(
      Array.from({ length: 7 }, () =>
        httpJson(`${ctx.baseUrl}/api/listings`, {
          method: 'POST',
          body: buildListingPayload(ids, { contactPhone: cappedPhone, expiryDays: 3 })
        })
      )
    );
    const createdCount = sevenPosts.filter((r) => r.status === 200 || r.status === 201).length;
    const conflictCount = sevenPosts.filter((r) => r.status === 409).length;
    assert.equal(createdCount, 5);
    assert.equal(conflictCount, 2);

    const oversized = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { locationNote: 'a'.repeat(33 * 1024) })
    });
    assert.equal(oversized.status, 413);

    for (const badBody of ['null', '[]', '{bad-json']) {
      const res = await httpJson(`${ctx.baseUrl}/api/listings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: badBody
      });
      assert.equal(res.status, 400);
    }

    for (const badPhone of ['1234567890', '091234567', '09123456789', '091234567a']) {
      const res = await httpJson(`${ctx.baseUrl}/api/listings`, {
        method: 'POST',
        body: buildListingPayload(ids, { contactPhone: badPhone })
      });
      assert.equal(res.status, 400);
    }

    const longVoice = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { rawVoiceText: 'a'.repeat(501) })
    });
    assert.equal(longVoice.status, 400);

    for (const badFields of [
      { expiryDays: 0 },
      { expiryDays: 15 },
      { rawQuantity: 0 },
      { rawQuantity: 10001 }
    ]) {
      const res = await httpJson(`${ctx.baseUrl}/api/listings`, {
        method: 'POST',
        body: buildListingPayload(ids, badFields)
      });
      assert.equal(res.status, 400);
    }
  } finally {
    await ctx.cleanup();
  }
});

test('R6 R10 POST /api/listings/:id/collect enforces canonical :id, ASCII byteLen auth before expiry/kg, 429 lockout, kg cap, and Promise.all race', { timeout: 15000 }, async () => {
  let fakeNow = 1_750_000_000_000;
  const ctx = await startTestApp({ now: () => fakeNow });
  try {
    const ids = await resolveDomainIds();
    const res1 = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0911111001', expiryDays: 1 })
    });
    const l1 = extractCreatedListing(res1.json);

    const res2 = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0911111002', rawQuantity: 100, rawUnit: ids.kgUnit, expiryDays: 3 })
    });
    const l2 = extractCreatedListing(res2.json);

    const res3 = await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0911111003', rawQuantity: 100, rawUnit: ids.kgUnit, expiryDays: 3 })
    });
    const l3 = extractCreatedListing(res3.json);

    for (const badId of ['01', '001', '+1', '1.0', '0', 'abc', '99999']) {
      const r = await httpJson(`${ctx.baseUrl}/api/listings/${encodeURIComponent(badId)}/collect`, {
        method: 'POST',
        body: { shortCode: 'ZZZZ' }
      });
      assert.equal(r.status, 404, badId);
    }

    for (const badAuthBody of [
      { contactPhone: '0911111002' },
      { shortCode: '123đ' },
      { shortCode: '🎉🎉' }
    ]) {
      const r = await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
        method: 'POST',
        body: badAuthBody
      });
      assert.equal(r.status, 403);
    }

    const wrongCodeBadKg = await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
      method: 'POST',
      body: { shortCode: 'ZZZZ', actualKgCollected: -5 }
    });
    assert.equal(wrongCodeBadKg.status, 403);

    const fifthWrong = await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
      method: 'POST',
      body: { shortCode: 'ZZZZ' }
    });
    assert.equal(fifthWrong.status, 403);

    const lockedAttempt = await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
      method: 'POST',
      body: { shortCode: l2.shortCode, actualKgCollected: 100 }
    });
    assert.equal(lockedAttempt.status, 429);

    fakeNow += 16 * 60 * 1000;
    fakeNow += 25 * 3600 * 1000;

    const expiredWrongCode = await httpJson(`${ctx.baseUrl}/api/listings/${l1.id}/collect`, {
      method: 'POST',
      body: { shortCode: 'ZZZZ' }
    });
    assert.equal(expiredWrongCode.status, 403);

    const expiredPhoneOnly = await httpJson(`${ctx.baseUrl}/api/listings/${l1.id}/collect`, {
      method: 'POST',
      body: { contactPhone: '0911111001' }
    });
    assert.equal(expiredPhoneOnly.status, 403);

    const expiredValidCode = await httpJson(`${ctx.baseUrl}/api/listings/${l1.id}/collect`, {
      method: 'POST',
      body: { shortCode: l1.shortCode, actualKgCollected: 100 }
    });
    assert.equal(expiredValidCode.status, 409);

    for (let i = 0; i < 6; i += 1) {
      const badKg = await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
        method: 'POST',
        body: { shortCode: l2.shortCode, actualKgCollected: i === 0 ? 0 : 501 }
      });
      assert.equal(badKg.status, 400);
    }

    const [winRes, loseRes] = await Promise.all([
      httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
        method: 'POST',
        body: { shortCode: l2.shortCode, actualKgCollected: 500 }
      }),
      httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
        method: 'POST',
        body: { shortCode: l2.shortCode, actualKgCollected: 500 }
      })
    ]);
    const statuses = [winRes.status, loseRes.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [200, 409]);

    const defaultKgCollect = await httpJson(`${ctx.baseUrl}/api/listings/${l3.id}/collect`, {
      method: 'POST',
      body: { shortCode: l3.shortCode }
    });
    assert.equal(defaultKgCollect.status, 200);
  } finally {
    await ctx.cleanup();
  }
});

test('R6 R10 POST /api/listings/:id/report checks 404/409 before 1/(ip,id)/15m, enforces IP rate limit, deduplicates cookies, hides at 3, and persists HMAC secret', { timeout: 15000 }, async () => {
  let fakeNow = 1_750_000_000_000;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'khkt-report-'));
  let ctx = await startTestApp({ tempDir, keepDir: true, now: () => fakeNow });
  try {
    const ids = await resolveDomainIds();
    let adminCookie = await loginAdmin(ctx.baseUrl);
    const l1 = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0912222001', expiryDays: 1 })
    })).json);
    const l2 = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0912222002', expiryDays: 3 })
    })).json);
    const l3 = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0912222003', expiryDays: 3 })
    })).json);
    const l4 = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0912222004', expiryDays: 3 })
    })).json);

    await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
      method: 'POST',
      body: { shortCode: l2.shortCode }
    });

    const c1 = extractCookiePair(await fetch(`${ctx.baseUrl}/`), 'khkt_voter').pair;
    const c2 = extractCookiePair(await fetch(`${ctx.baseUrl}/`), 'khkt_voter').pair;
    const c3 = extractCookiePair(await fetch(`${ctx.baseUrl}/`), 'khkt_voter').pair;

    for (const badId of ['01', '001', '+1', '1.0', '99999']) {
      const r = await httpJson(`${ctx.baseUrl}/api/listings/${encodeURIComponent(badId)}/report`, {
        method: 'POST',
        headers: { cookie: c1 },
        body: {}
      });
      assert.equal(r.status, 404, badId);
    }

    const repCollected = await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/report`, {
      method: 'POST',
      headers: { cookie: c1 },
      body: {}
    });
    assert.equal(repCollected.status, 409);

    await httpJson(`${ctx.baseUrl}/api/admin/listings/${l3.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { action: 'hide' }
    });
    const repHidden = await httpJson(`${ctx.baseUrl}/api/listings/${l3.id}/report`, {
      method: 'POST',
      headers: { cookie: c1 },
      body: {}
    });
    assert.equal(repHidden.status, 409);

    await httpJson(`${ctx.baseUrl}/api/admin/listings/${l3.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { action: 'restore' }
    });
    const repAfterRestore = await httpJson(`${ctx.baseUrl}/api/listings/${l3.id}/report`, {
      method: 'POST',
      headers: { cookie: c1 },
      body: {}
    });
    assert.equal(repAfterRestore.status, 200);

    fakeNow += 25 * 3600 * 1000;
    const repExpired = await httpJson(`${ctx.baseUrl}/api/listings/${l1.id}/report`, {
      method: 'POST',
      headers: { cookie: c1 },
      body: {}
    });
    assert.equal(repExpired.status, 409);

    const rep1 = await httpJson(`${ctx.baseUrl}/api/listings/${l4.id}/report`, {
      method: 'POST',
      headers: { cookie: c1 },
      body: {}
    });
    assert.equal(rep1.status, 200);

    const rep2Blocked = await httpJson(`${ctx.baseUrl}/api/listings/${l4.id}/report`, {
      method: 'POST',
      headers: { cookie: c2 },
      body: {}
    });
    assert.equal(rep2Blocked.status, 429);

    const rep3Blocked = await httpJson(`${ctx.baseUrl}/api/listings/${l4.id}/report`, {
      method: 'POST',
      headers: { cookie: c3 },
      body: {}
    });
    assert.equal(rep3Blocked.status, 429);

    fakeNow += 16 * 60 * 1000;
    const repSameVoter = await httpJson(`${ctx.baseUrl}/api/listings/${l4.id}/report`, {
      method: 'POST',
      headers: { cookie: c1 },
      body: {}
    });
    assert.equal(repSameVoter.status, 200);
    let feed = extractListings((await httpJson(`${ctx.baseUrl}/api/listings`)).json);
    assert.ok(feed.some((item) => item.id === l4.id));

    fakeNow += 16 * 60 * 1000;
    const rep2 = await httpJson(`${ctx.baseUrl}/api/listings/${l4.id}/report`, {
      method: 'POST',
      headers: { cookie: c2 },
      body: {}
    });
    assert.equal(rep2.status, 200);
    feed = extractListings((await httpJson(`${ctx.baseUrl}/api/listings`)).json);
    assert.ok(feed.some((item) => item.id === l4.id));

    await ctx.cleanup(false);
    ctx = await startTestApp({ tempDir, dbPath: ctx.dbPath, staticDir: ctx.staticDir, keepDir: true, now: () => fakeNow });

    fakeNow += 16 * 60 * 1000;
    const rep1AfterRestart = await httpJson(`${ctx.baseUrl}/api/listings/${l4.id}/report`, {
      method: 'POST',
      headers: { cookie: c1 },
      body: {}
    });
    assert.equal(rep1AfterRestart.status, 200);
    feed = extractListings((await httpJson(`${ctx.baseUrl}/api/listings`)).json);
    assert.ok(feed.some((item) => item.id === l4.id));

    fakeNow += 16 * 60 * 1000;
    const rep3 = await httpJson(`${ctx.baseUrl}/api/listings/${l4.id}/report`, {
      method: 'POST',
      headers: { cookie: c3 },
      body: {}
    });
    assert.equal(rep3.status, 200);
    feed = extractListings((await httpJson(`${ctx.baseUrl}/api/listings`)).json);
    assert.equal(feed.some((item) => item.id === l4.id), false);

    const forgedFallback = await httpJson(`${ctx.baseUrl}/api/listings/${l3.id}/report`, {
      method: 'POST',
      headers: { cookie: 'khkt_voter=bad.🎉' },
      body: {}
    });
    assert.equal(forgedFallback.status, 200);
  } finally {
    await ctx.cleanup(false);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('R10 R11 POST /api/metrics/calculation and GET /api/impact enforce bounds, 120/15m limit, chunk >500 idempotency, active expiry, and COALESCE kg', { timeout: 15000 }, async () => {
  let fakeNow = 1_750_000_000_000;
  const ctx = await startTestApp({ now: () => fakeNow });
  try {
    const ids = await resolveDomainIds();
    for (const badBody of [
      { delta: 0, clientRequestId: nextRequestId('calc_bad_request') },
      { delta: 501, clientRequestId: nextRequestId('calc_bad_request') },
      { delta: 1.5, clientRequestId: nextRequestId('calc_bad_request') },
      { delta: 10, clientRequestId: 'short' },
      null,
      []
    ]) {
      const r = await httpJson(`${ctx.baseUrl}/api/metrics/calculation`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(badBody)
      });
      assert.equal(r.status, 400);
    }

    const tooBig = await httpJson(`${ctx.baseUrl}/api/metrics/calculation`, {
      method: 'POST',
      body: { delta: 1, clientRequestId: nextRequestId('calc_big_request'), pad: 'x'.repeat(33 * 1024) }
    });
    assert.equal(tooBig.status, 413);

    const batch1Id = nextRequestId('batch_chunk_001');
    const batch2Id = nextRequestId('batch_chunk_002');
    const batch3Id = nextRequestId('batch_chunk_003');
    const batch4Id = nextRequestId('batch_chunk_004');
    for (const [batchId, delta] of [
      [batch1Id, 500],
      [batch2Id, 100],
      [batch1Id, 500],
      [batch3Id, 500],
      [batch4Id, 100]
    ]) {
      const r = await httpJson(`${ctx.baseUrl}/api/metrics/calculation`, {
        method: 'POST',
        body: { delta, clientRequestId: batchId }
      });
      assert.equal(r.status, 200);
    }

    const l1 = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0913333001', rawQuantity: 100, rawUnit: ids.kgUnit, expiryDays: 3 })
    })).json);
    const l2 = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0913333002', rawQuantity: 2, rawUnit: ids.congUnit, expiryDays: 3 })
    })).json);
    await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0913333003', rawQuantity: 100, rawUnit: ids.kgUnit, expiryDays: 1 })
    });
    await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0913333004', rawQuantity: 100, rawUnit: ids.kgUnit, expiryDays: 3 })
    });

    await httpJson(`${ctx.baseUrl}/api/listings/${l1.id}/collect`, {
      method: 'POST',
      body: { shortCode: l1.shortCode }
    });
    await httpJson(`${ctx.baseUrl}/api/listings/${l2.id}/collect`, {
      method: 'POST',
      body: { shortCode: l2.shortCode, actualKgCollected: 1200 }
    });

    fakeNow += 25 * 3600 * 1000;
    const impact = await httpJson(`${ctx.baseUrl}/api/impact`);
    assert.equal(impact.status, 200);
    assert.match(impact.headers.get('cache-control') || '', /no-store/i);
    assert.equal(impact.json.totalListings, 4);
    assert.equal(impact.json.activeListings, 1);
    assert.equal(impact.json.collectedListings, 2);
    assert.equal(impact.json.totalKgDiverted, 1300);
    assert.ok(Math.abs(impact.json.estimatedCo2SavedKg - 1898) < 0.05);
    assert.equal(impact.json.totalPriceCalculations, 1200);

    for (let i = 0; i < 120; i += 1) {
      const r = await httpJson(`${ctx.baseUrl}/api/metrics/calculation`, {
        method: 'POST',
        body: { delta: 1, clientRequestId: batch1Id }
      });
      assert.equal(r.status, 200);
    }
    const overLimit = await httpJson(`${ctx.baseUrl}/api/metrics/calculation`, {
      method: 'POST',
      body: { delta: 1, clientRequestId: batch1Id }
    });
    assert.equal(overLimit.status, 429);

    fakeNow += 16 * 60 * 1000;
    const recovered = await httpJson(`${ctx.baseUrl}/api/metrics/calculation`, {
      method: 'POST',
      body: { delta: 1, clientRequestId: batch1Id }
    });
    assert.equal(recovered.status, 200);
  } finally {
    await ctx.cleanup();
  }
});

test('R12 Admin PIN fail-closed 503, raw-path control-char/backslash/origin guards, login rate limit, 4h session TTL, and logout revocation', { timeout: 15000 }, async () => {
  const prevAdminPin = process.env.ADMIN_PIN;
  delete process.env.ADMIN_PIN;
  try {
    for (const invalidPin of [undefined, '', '12345']) {
      const failClosed = await startTestApp({ adminPin: invalidPin });
      try {
        for (const [method, endpoint, body] of [
          ['POST', '/api/admin/login', { pin: '123456' }],
          ['POST', '/api/admin/logout', {}],
          ['GET', '/api/admin/listings', undefined],
          ['PATCH', '/api/admin/listings/1', { action: 'hide' }],
          ['PATCH', '/api/admin/crops/ca-chua', { dailyDecayRate: 0.05 }],
          ['GET', '/api/admin/export.csv', undefined]
        ]) {
          const res = await httpJson(`${failClosed.baseUrl}${endpoint}`, { method, body });
          assert.equal(res.status, 503, `${String(invalidPin)} ${method} ${endpoint}`);
        }
      } finally {
        await failClosed.cleanup();
      }
    }
  } finally {
    if (prevAdminPin !== undefined) {
      process.env.ADMIN_PIN = prevAdminPin;
    }
  }

  let fakeNow = 1_750_000_000_000;
  const ctx = await startTestApp({ adminPin: '123456', now: () => fakeNow });
  try {
    for (const nonStringBody of [{ pin: 123456 }, { pin: null }, [], null]) {
      const r = await httpJson(`${ctx.baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(nonStringBody)
      });
      assert.equal(r.status, 400);
    }

    fakeNow += 16 * 60 * 1000;

    for (const [method, target] of [
      ['GET', 'http://localhost/api/admin/listings'],
      ['GET', '/api/ad%09min/listings'],
      ['GET', '/api/ad%0amin/export.csv'],
      ['PATCH', '/api/ad%0dmin/crops/ca-chua'],
      ['GET', '/api/ad%00min/listings'],
      ['GET', '/%ZZ']
    ]) {
      const raw = await sendRawHttp(
        ctx.port,
        `${method} ${target} HTTP/1.1\r\nHost: 127.0.0.1:${ctx.port}\r\nConnection: close\r\n\r\n`
      );
      assert.equal(raw.status, 400, target);
    }

    for (const bypassTarget of [
      '/api/admin%5Clistings',
      '//api/admin/listings',
      '/%61pi/admin/listings',
      '/api/Admin/listings',
      '/api/x/../admin/listings'
    ]) {
      const raw = await sendRawHttp(
        ctx.port,
        `GET ${bypassTarget} HTTP/1.1\r\nHost: 127.0.0.1:${ctx.port}\r\nConnection: close\r\n\r\n`
      );
      assert.equal(raw.status, 401, bypassTarget);
    }

    for (let i = 0; i < 5; i += 1) {
      const wrong = await httpJson(`${ctx.baseUrl}/api/admin/login`, {
        method: 'POST',
        body: { pin: 'wrong0' }
      });
      assert.equal(wrong.status, 401);
    }
    const locked = await httpJson(`${ctx.baseUrl}/api/admin/login`, {
      method: 'POST',
      body: { pin: '123456' }
    });
    assert.equal(locked.status, 429);

    fakeNow += 16 * 60 * 1000;
    const adminCookie = await loginAdmin(ctx.baseUrl, '123456');
    assert.match(adminCookie.line, /httponly/i);
    assert.match(adminCookie.line, /samesite=strict/i);

    const authTabAttack = await sendRawHttp(
      ctx.port,
      `GET /api/ad%09min/listings HTTP/1.1\r\nHost: 127.0.0.1:${ctx.port}\r\nCookie: ${adminCookie.pair}\r\nConnection: close\r\n\r\n`
    );
    assert.equal(authTabAttack.status, 400);

    const queryPctSafe = await httpJson(`${ctx.baseUrl}/api/admin/listings?q=%bad`, {
      headers: { cookie: adminCookie.pair }
    });
    assert.equal(queryPctSafe.status, 200);

    fakeNow += 4 * 3600 * 1000 + 1000;
    const expiredSession = await httpJson(`${ctx.baseUrl}/api/admin/listings`, {
      headers: { cookie: adminCookie.pair }
    });
    assert.equal(expiredSession.status, 401);

    const freshCookie = await loginAdmin(ctx.baseUrl, '123456');
    const validAfterRelogin = await httpJson(`${ctx.baseUrl}/api/admin/listings`, {
      headers: { cookie: freshCookie.pair }
    });
    assert.equal(validAfterRelogin.status, 200);

    const logoutRes = await httpJson(`${ctx.baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { cookie: freshCookie.pair },
      body: {}
    });
    assert.equal(logoutRes.status, 200);

    const replayAfterLogout = await httpJson(`${ctx.baseUrl}/api/admin/listings`, {
      headers: { cookie: freshCookie.pair }
    });
    assert.equal(replayAfterLogout.status, 401);
  } finally {
    await ctx.cleanup();
  }
});

test('R10 R12 Admin GET listings limit/sort/omits secrets, PATCH listings preconditions and restore-clears-reports, and PATCH crops bounds', { timeout: 15000 }, async () => {
  let fakeNow = 1_750_000_000_000;
  const ctx = await startTestApp({ adminPin: '123456', now: () => fakeNow });
  try {
    const ids = await resolveDomainIds();
    let adminCookie = await loginAdmin(ctx.baseUrl);

    const lActive = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0914444001', expiryDays: 3 })
    })).json);
    const lCollected = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0914444002', expiryDays: 3 })
    })).json);
    const lReported = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0914444003', expiryDays: 7 })
    })).json);
    const lExpiredHidden = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, { contactPhone: '0914444004', expiryDays: 1 })
    })).json);

    await httpJson(`${ctx.baseUrl}/api/listings/${lCollected.id}/collect`, {
      method: 'POST',
      body: { shortCode: lCollected.shortCode }
    });
    await httpJson(`${ctx.baseUrl}/api/admin/listings/${lExpiredHidden.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { action: 'hide' }
    });

    const voters = [];
    for (let i = 0; i < 3; i += 1) {
      voters.push(extractCookiePair(await fetch(`${ctx.baseUrl}/`), 'khkt_voter').pair);
    }
    for (const v of voters) {
      fakeNow += 16 * 60 * 1000;
      const r = await httpJson(`${ctx.baseUrl}/api/listings/${lReported.id}/report`, {
        method: 'POST',
        headers: { cookie: v },
        body: {}
      });
      assert.equal(r.status, 200);
    }

    fakeNow += 25 * 3600 * 1000;
    adminCookie = await loginAdmin(ctx.baseUrl);

    const limitedRes = await httpJson(`${ctx.baseUrl}/api/admin/listings?limit=2`, {
      headers: { cookie: adminCookie.pair }
    });
    assert.equal(limitedRes.status, 200);
    const limitedRows = extractListings(limitedRes.json);
    assert.equal(limitedRows.length, 2);
    assert.equal(limitedRows[0].id, lReported.id);
    assert.equal(limitedRows[0].status, 'reported');

    const cappedRes = await httpJson(`${ctx.baseUrl}/api/admin/listings?limit=500`, {
      headers: { cookie: adminCookie.pair }
    });
    assert.equal(cappedRes.status, 200);
    const allAdminRows = extractListings(cappedRes.json);
    assert.ok(allAdminRows.length <= 200);
    for (const row of allAdminRows) {
      assertNoListingSecrets(row);
    }

    for (const missingId of ['01', '99999']) {
      const r = await httpJson(`${ctx.baseUrl}/api/admin/listings/${missingId}`, {
        method: 'PATCH',
        headers: { cookie: adminCookie.pair },
        body: { action: 'hide' }
      });
      assert.equal(r.status, 404);
    }

    for (const action of ['hide', 'restore', 'edit']) {
      const body = action === 'edit' ? { action, rawQuantity: 5 } : { action };
      const r = await httpJson(`${ctx.baseUrl}/api/admin/listings/${lCollected.id}`, {
        method: 'PATCH',
        headers: { cookie: adminCookie.pair },
        body
      });
      assert.equal(r.status, 409);
    }

    const restoreExpiredNoExtend = await httpJson(`${ctx.baseUrl}/api/admin/listings/${lExpiredHidden.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { action: 'restore' }
    });
    assert.equal(restoreExpiredNoExtend.status, 409);

    const restoreExpiredExtended = await httpJson(`${ctx.baseUrl}/api/admin/listings/${lExpiredHidden.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { action: 'restore', expiryDays: 5 }
    });
    assert.equal(restoreExpiredExtended.status, 200);
    const feedAfterExtend = extractListings((await httpJson(`${ctx.baseUrl}/api/listings`)).json);
    assert.equal(feedAfterExtend.some((item) => item.id === lExpiredHidden.id), true);

    const restoreReported = await httpJson(`${ctx.baseUrl}/api/admin/listings/${lReported.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { action: 'restore' }
    });
    assert.equal(restoreReported.status, 200);
    const restoredItem = restoreReported.json?.listing || restoreReported.json;
    assert.equal(restoredItem.status, 'active');
    assert.equal(restoredItem.reportCount, 0);

    for (const v of voters) {
      fakeNow += 16 * 60 * 1000;
      const reReport = await httpJson(`${ctx.baseUrl}/api/listings/${lReported.id}/report`, {
        method: 'POST',
        headers: { cookie: v },
        body: {}
      });
      assert.equal(reReport.status, 200);
    }
    const feedAfterReReport = extractListings((await httpJson(`${ctx.baseUrl}/api/listings`)).json);
    assert.equal(feedAfterReReport.some((item) => item.id === lReported.id), false);

    const partialEdit = await httpJson(`${ctx.baseUrl}/api/admin/listings/${lActive.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { action: 'edit', rawQuantity: 4 }
    });
    assert.equal(partialEdit.status, 200);
    const editedItem = partialEdit.json?.listing || partialEdit.json;
    assert.equal(editedItem.estimatedKg, 2222);

    for (const forbidden of [
      { action: 'edit', status: 'collected' },
      { action: 'edit', shortCode: 'ABCD' },
      { action: 'edit', contactPhone: '0999999999' }
    ]) {
      const r = await httpJson(`${ctx.baseUrl}/api/admin/listings/${lActive.id}`, {
        method: 'PATCH',
        headers: { cookie: adminCookie.pair },
        body: forbidden
      });
      assert.equal(r.status, 400);
    }

    const unknownCrop = await httpJson(`${ctx.baseUrl}/api/admin/crops/unknown-crop`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { dailyDecayRate: 0.05 }
    });
    assert.equal(unknownCrop.status, 404);

    for (const badCropPatch of [
      {},
      { dailyDecayRate: -1 },
      { dailyDecayRate: 0.9 },
      { maxShelfLifeDays: 0 },
      { referencePriceVnd: 50 }
    ]) {
      const r = await httpJson(`${ctx.baseUrl}/api/admin/crops/ca-chua`, {
        method: 'PATCH',
        headers: { cookie: adminCookie.pair },
        body: badCropPatch
      });
      assert.equal(r.status, 400);
    }

    const validCropPatch = await httpJson(`${ctx.baseUrl}/api/admin/crops/ca-chua`, {
      method: 'PATCH',
      headers: { cookie: adminCookie.pair },
      body: { dailyDecayRate: 0.08, referencePriceVnd: 24000 }
    });
    assert.equal(validCropPatch.status, 200);
    const updatedCrops = extractCrops((await httpJson(`${ctx.baseUrl}/api/crops`)).json);
    const updatedTomato = updatedCrops.find((c) => c.id === 'ca-chua');
    assert.equal(updatedTomato.dailyDecayRate, 0.08);
    assert.equal(updatedTomato.referencePriceVnd, 24000);
  } finally {
    await ctx.cleanup();
  }
});

test('R10 R12 GET /api/admin/export.csv masks phones, omits secrets, escapes multiline formulas, appends calc summary, and close cleans up', { timeout: 15000 }, async () => {
  const ctx = await startTestApp({ adminPin: '123456' });
  try {
    const ids = await resolveDomainIds();
    let adminCookie = await loginAdmin(ctx.baseUrl);
    const created = extractCreatedListing((await httpJson(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      body: buildListingPayload(ids, {
        contactPhone: '0912346789',
        contactName: '=SUM(A1)',
        offerType: 'sell',
        priceNote: '+@123',
        locationNote: '\r=CMD()\n=HYPERLINK()',
        clientRequestId: 'csv_secret_client_req_0001'
      })
    })).json);

    await httpJson(`${ctx.baseUrl}/api/metrics/calculation`, {
      method: 'POST',
      body: { delta: 12, clientRequestId: nextRequestId('csv_calc_batch') }
    });

    const csvRes = await fetch(`${ctx.baseUrl}/api/admin/export.csv`, {
      headers: { cookie: adminCookie.pair }
    });
    assert.equal(csvRes.status, 200);
    assert.match(csvRes.headers.get('content-type') || '', /text\/csv/i);
    assert.match(csvRes.headers.get('cache-control') || '', /no-store/i);
    const csv = await csvRes.text();

    assert.equal(csv.includes('0912346789'), false);
    assert.equal(csv.includes('091***6789'), true);
    assert.equal(csv.includes(created.shortCode), false);
    assert.equal(csv.includes('csv_secret_client_req_0001'), false);

    assert.equal(/[\r\n]=CMD\(\)/.test(csv), false);
    assert.equal(/[\r\n]=HYPERLINK\(\)/.test(csv), false);
    assert.equal(/(?:^|[,\r\n])"?=SUM\(A1\)/.test(csv), false);
    assert.equal(/(?:^|[,\r\n])"?\+@123/.test(csv), false);
    assert.equal(csv.includes("'=CMD()"), true);
    assert.equal(csv.includes("'=HYPERLINK()"), true);
    assert.equal(csv.includes("'=SUM(A1)"), true);
    assert.equal(csv.includes("'+@123"), true);
    assert.match(csv, /\b12\b/);

    await ctx.app.close();
    await ctx.app.close();
    assert.equal(ctx.app.server.listening, false);
  } finally {
    await ctx.cleanup();
  }
});
