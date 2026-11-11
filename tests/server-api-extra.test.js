import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createApp } from '../src/server/app.js';
import { createAdminSessionStore, MAX_ADMIN_SESSIONS } from '../src/server/auth.js';
import { createRateLimiter, MAX_RATE_KEYS } from '../src/server/rate-limit.js';
import { escapeCsvCell, maskPhone } from '../src/server/csv.js';
import { runInTransaction } from '../src/server/db.js';

function createTempStaticDir(baseDir) {
  const staticDir = path.join(baseDir, 'static');
  fs.mkdirSync(path.join(staticDir, 'styles'), { recursive: true });
  fs.mkdirSync(path.join(staticDir, 'js'), { recursive: true });
  fs.mkdirSync(path.join(staticDir, 'icons'), { recursive: true });
  fs.writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><html><body>AgriCircle</body></html>');
  fs.writeFileSync(path.join(staticDir, 'manifest.webmanifest'), '{"name":"AgriCircle"}');
  fs.writeFileSync(path.join(staticDir, 'sw.js'), 'export const version = 1;\n');
  return staticDir;
}

async function startExtraApp(options = {}) {
  const tempDir = options.tempDir || fs.mkdtempSync(path.join(os.tmpdir(), 'khkt-extra-'));
  const staticDir = options.staticDir || createTempStaticDir(tempDir);
  const dbPath = options.dbPath || path.join(tempDir, 'extra.db');
  const app = await createApp({
    dbPath,
    adminPin: 'adminPin' in options ? options.adminPin : '123456',
    staticDir,
    sharedDir: path.resolve('src/shared'),
    leafletDistDir: path.resolve('node_modules/leaflet/dist'),
    now: options.now
  });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const port = app.server.address().port;
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

function sendRawBytes(port, payloadBuffer) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const chunks = [];
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Raw socket timeout'));
    }, 5000);
    socket.on('connect', () => {
      socket.write(payloadBuffer);
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

test('Option B session store caps at 64 sessions, evicts expired first then oldest, and HTTP 65th login evicts 1st', { timeout: 15000 }, async () => {
  let fakeNow = 1_750_000_000_000;
  const store = createAdminSessionStore({ now: () => fakeNow });

  const shortBatch = [];
  for (let i = 0; i < 10; i += 1) {
    shortBatch.push(store.createSession().token);
  }
  fakeNow += 2 * 3600 * 1000;
  const freshBatch = [];
  for (let i = 0; i < 54; i += 1) {
    freshBatch.push(store.createSession().token);
  }
  assert.equal(store.size(), MAX_ADMIN_SESSIONS);

  fakeNow += 2 * 3600 * 1000 + 1;
  const extraA = store.createSession().token;
  assert.equal(store.size(), 55);
  for (const expiredToken of shortBatch) {
    assert.equal(store.verifySession(expiredToken), false);
  }
  for (const validToken of freshBatch) {
    assert.equal(store.verifySession(validToken), true);
  }
  assert.equal(store.verifySession(extraA), true);

  while (store.size() < MAX_ADMIN_SESSIONS) {
    store.createSession();
  }
  assert.equal(store.size(), 64);
  const oldestSurvivor = freshBatch[0];
  assert.equal(store.verifySession(oldestSurvivor), true);
  const overflowToken = store.createSession().token;
  assert.equal(store.size(), 64);
  assert.equal(store.verifySession(oldestSurvivor), false);
  assert.equal(store.verifySession(freshBatch[1]), true);
  assert.equal(store.verifySession(overflowToken), true);
  assert.equal(store.revokeSession(overflowToken), true);
  assert.equal(store.verifySession(overflowToken), false);
  store.clear();

  let httpNow = 1_750_000_000_000;
  const ctx = await startExtraApp({ adminPin: '123456', now: () => httpNow });
  try {
    const cookies = [];
    for (let i = 0; i < 65; i += 1) {
      if (i > 0 && i % 5 === 0) {
        httpNow += 16 * 60 * 1000;
      }
      const res = await fetch(`${ctx.baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin: '123456' })
      });
      assert.equal(res.status, 200);
      const setCookie = res.headers.getSetCookie()[0];
      cookies.push(setCookie.split(';')[0].trim());
    }

    const firstRes = await fetch(`${ctx.baseUrl}/api/admin/listings`, {
      headers: { cookie: cookies[0] }
    });
    assert.equal(firstRes.status, 401);

    const secondRes = await fetch(`${ctx.baseUrl}/api/admin/listings`, {
      headers: { cookie: cookies[1] }
    });
    assert.equal(secondRes.status, 200);

    const lastRes = await fetch(`${ctx.baseUrl}/api/admin/listings`, {
      headers: { cookie: cookies[64] }
    });
    assert.equal(lastRes.status, 200);
  } finally {
    await ctx.cleanup();
  }
});

test('Report endpoint safely handles raw UTF-8 emoji voter cookie and ASCII forged cookie fallback', { timeout: 15000 }, async () => {
  const ctx = await startExtraApp();
  try {
    const createRes = await fetch(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'rom-ra',
        offerType: 'free',
        priceNote: '',
        rawQuantity: 2,
        rawUnit: 'cong_nam_bo',
        lat: 10.0452,
        lng: 105.7469,
        locationNote: 'Gan cho',
        contactName: 'Chu Ba',
        contactPhone: '0912345678',
        isProxyPost: false,
        expiryDays: 3,
        clientRequestId: 'extra_req_voter_0001'
      })
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();

    const body = '{}';
    const rawEmojiReq = Buffer.from(
      `POST /api/listings/${created.listing.id}/report HTTP/1.1\r\nHost: 127.0.0.1:${ctx.port}\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nCookie: khkt_voter=bad.🎉\r\nConnection: close\r\n\r\n${body}`,
      'utf8'
    );
    const rawEmojiRes = await sendRawBytes(ctx.port, rawEmojiReq);
    assert.equal(rawEmojiRes.status, 200);

    const asciiRes = await fetch(`${ctx.baseUrl}/api/listings/${created.listing.id}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'khkt_voter=bad.short' },
      body: '{}'
    });
    assert.equal(asciiRes.status, 429);
  } finally {
    await ctx.cleanup();
  }
});

test('Rate limiter bounds keys to 4096 with expired-first eviction and cleans interval on close', () => {
  let fakeNow = 1_750_000_000_000;
  const limiter = createRateLimiter({ now: () => fakeNow });
  try {
    for (let i = 0; i < 100; i += 1) {
      limiter.record(`exp:${i}`, 1000);
    }
    fakeNow += 2000;
    for (let i = 0; i < MAX_RATE_KEYS - 50; i += 1) {
      limiter.record(`live:${i}`, 60_000);
    }
    assert.equal(limiter.size(), MAX_RATE_KEYS - 50);

    for (let i = 0; i < 60; i += 1) {
      limiter.record(`over:${i}`, 60_000);
    }
    assert.equal(limiter.size(), MAX_RATE_KEYS);
    assert.equal(limiter.check('live:0', 1, 60_000).allowed, true);
    assert.equal(limiter.check('over:59', 1, 60_000).allowed, false);
  } finally {
    limiter.close();
  }
  assert.equal(limiter.size(), 0);
});

test('Public GET /api/listings filters by radius, category, offerType and rejects malformed queries', { timeout: 15000 }, async () => {
  const ctx = await startExtraApp();
  try {
    await fetch(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'rom-ra',
        offerType: 'free',
        rawQuantity: 100,
        rawUnit: 'kg',
        lat: 10.0452,
        lng: 105.7469,
        contactName: 'A',
        contactPhone: '0911111111',
        expiryDays: 3,
        clientRequestId: 'filter_test_item_0001'
      })
    });
    await fetch(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'than-bap',
        offerType: 'sell',
        rawQuantity: 50,
        rawUnit: 'kg',
        lat: 10.5000,
        lng: 105.7469,
        contactName: 'B',
        contactPhone: '0922222222',
        expiryDays: 3,
        clientRequestId: 'filter_test_item_0002'
      })
    });

    const radiusFiltered = await (
      await fetch(`${ctx.baseUrl}/api/listings?lat=10.0452&lng=105.7469&radiusKm=5&category=rom-ra&offerType=free&limit=10`)
    ).json();
    assert.equal(radiusFiltered.listings.length, 1);
    assert.equal(radiusFiltered.listings[0].category, 'rom-ra');

    for (const badQuery of [
      '?limit=12abc',
      '?limit=0',
      '?lat=10.0',
      '?lat=abc&lng=105.7',
      '?radiusKm=-5',
      '?category=unknown',
      '?offerType=trade'
    ]) {
      const res = await fetch(`${ctx.baseUrl}/api/listings${badQuery}`);
      assert.equal(res.status, 400, badQuery);
    }
  } finally {
    await ctx.cleanup();
  }
});

test('Startup prunes metric_flushes older than 30 days while preserving totalPriceCalculations', { timeout: 15000 }, async () => {
  let fakeNow = 1_750_000_000_000;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'khkt-prune-'));
  const dbPath = path.join(tempDir, 'prune.db');
  const staticDir = createTempStaticDir(tempDir);

  let ctx = await startExtraApp({ tempDir, dbPath, staticDir, keepDir: true, now: () => fakeNow });
  try {
    const flushRes = await fetch(`${ctx.baseUrl}/api/metrics/calculation`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ delta: 42, clientRequestId: 'prune_batch_req_0001' })
    });
    assert.equal(flushRes.status, 200);
    await ctx.cleanup(false);

    fakeNow += 31 * 86_400_000;
    ctx = await startExtraApp({ tempDir, dbPath, staticDir, keepDir: true, now: () => fakeNow });

    const remainingRows = ctx.app.db.prepare('SELECT COUNT(*) AS cnt FROM metric_flushes').get().cnt;
    assert.equal(remainingRows, 0);

    const impactRes = await fetch(`${ctx.baseUrl}/api/impact`);
    const impact = await impactRes.json();
    assert.equal(impact.totalPriceCalculations, 42);
  } finally {
    await ctx.cleanup(false);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Chunked payload > 32KB without Content-Length returns 413 and CSV escapes consecutive CR formulas', { timeout: 15000 }, async () => {
  assert.equal(maskPhone('12345'), '***');
  const escaped = escapeCsvCell('\r\r=CMD()\n\t+SUM()');
  assert.equal(/[\r\n]=CMD\(\)/.test(escaped), false);
  assert.equal(escaped.includes("'=CMD()"), true);
  assert.equal(escaped.includes("'\t+SUM()"), true);

  const ctx = await startExtraApp();
  try {
    const big = 'a'.repeat(34 * 1024);
    const chunkHex = Buffer.byteLength(big).toString(16);
    const rawChunked = Buffer.from(
      `POST /api/listings HTTP/1.1\r\nHost: 127.0.0.1:${ctx.port}\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n${chunkHex}\r\n${big}\r\n0\r\n\r\n`,
      'utf8'
    );
    const res = await sendRawBytes(ctx.port, rawChunked);
    assert.equal(res.status, 413);

    let threw = false;
    try {
      runInTransaction(ctx.app.db, () => {
        ctx.app.db.prepare('INSERT INTO server_meta (key, value) VALUES (?, ?)').run('tx_test', '1');
        throw new Error('forced rollback');
      });
    } catch {
      threw = true;
    }
    assert.equal(threw, true);
    assert.equal(ctx.app.db.isTransaction, false);
    const row = ctx.app.db.prepare('SELECT value FROM server_meta WHERE key = ?').get('tx_test');
    assert.equal(row, undefined);
  } finally {
    await ctx.cleanup();
  }
});

test('Admin paths fail closed on root/unknown/case variants and reject overflow unit edit', { timeout: 15000 }, async () => {
  const ctx = await startExtraApp({ adminPin: '123456' });
  try {
    for (const [method, target] of [
      ['GET', '/api/admin'],
      ['GET', '/api/admin/unknown'],
      ['POST', '/api/Admin/login'],
      ['DELETE', '/api/admin/listings/1']
    ]) {
      const res = await fetch(`${ctx.baseUrl}${target}`, { method });
      assert.equal(res.status, 401, `${method} ${target}`);
    }

    const loginRes = await fetch(`${ctx.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin: '123456' })
    });
    const cookie = loginRes.headers.getSetCookie()[0].split(';')[0].trim();

    const postRes = await fetch(`${ctx.baseUrl}/api/listings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'rom-ra',
        offerType: 'free',
        rawQuantity: 200,
        rawUnit: 'kg',
        lat: 10.0452,
        lng: 105.7469,
        contactName: 'Chu Tu',
        contactPhone: '0912345678',
        expiryDays: 3,
        clientRequestId: 'admin_edit_overflow_01'
      })
    });
    const created = await postRes.json();

    const overflowEdit = await fetch(`${ctx.baseUrl}/api/admin/listings/${created.listing.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ action: 'edit', rawUnit: 'tan' })
    });
    assert.equal(overflowEdit.status, 400);

    const restoreActive = await fetch(`${ctx.baseUrl}/api/admin/listings/${created.listing.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ action: 'restore' })
    });
    assert.equal(restoreActive.status, 409);
  } finally {
    await ctx.cleanup();
  }
});

test('Server CLI entrypoint validates PORT and boots cleanly on PORT=0', { timeout: 15000 }, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'khkt-cli-'));
  try {
    const badExit = await new Promise((resolve) => {
      const child = spawn(process.execPath, ['src/server/index.js'], {
        env: { ...process.env, PORT: 'abc', DB_PATH: path.join(tempDir, 'bad.db') },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill();
        resolve({ code: -1, stderr });
      }, 5000);
      child.stderr.on('data', (d) => {
        stderr += d.toString('utf8');
      });
      child.on('exit', (code) => {
        clearTimeout(timer);
        resolve({ code, stderr });
      });
    });
    assert.notEqual(badExit.code, 0);
    assert.match(badExit.stderr, /Invalid PORT/);

    const dbPath = path.join(tempDir, 'nested', 'cli.db');
    const child = spawn(process.execPath, ['src/server/index.js'], {
      env: { ...process.env, PORT: '0', HOST: '127.0.0.1', DB_PATH: dbPath, ADMIN_PIN: '123456' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    try {
      const listeningUrl = await new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
          reject(new Error(`CLI startup timeout: ${stderr}`));
        }, 8000);
        child.stderr.on('data', (d) => {
          stderr += d.toString('utf8');
        });
        child.stdout.on('data', (d) => {
          stdout += d.toString('utf8');
          const match = /http:\/\/127\.0\.0\.1:(\d+)/.exec(stdout);
          if (match) {
            clearTimeout(timer);
            resolve(match[0]);
          }
        });
        child.once('exit', (code) => {
          clearTimeout(timer);
          reject(new Error(`CLI exited prematurely (${code}): ${stderr}`));
        });
      });

      const healthRes = await fetch(`${listeningUrl}/api/health`);
      assert.equal(healthRes.status, 200);
      const adminRes = await fetch(`${listeningUrl}/api/admin/listings`);
      assert.equal(adminRes.status, 401);
    } finally {
      if (child.exitCode === null) {
        const exitWait = new Promise((resolve) => child.once('exit', resolve));
        child.kill();
        await exitWait;
      }
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
