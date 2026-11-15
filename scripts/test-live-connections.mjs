import path from 'node:path';
import fs from 'node:fs';
import { createApp } from '../src/server/app.js';

const testDbDir = path.resolve(import.meta.dirname, '../data');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}
const testDbPath = path.resolve(testDbDir, `live-test-${Date.now()}.db`);

const app = await createApp({
  dbPath: testDbPath,
  adminPin: '202600',
  staticDir: path.resolve(import.meta.dirname, '../public'),
  sharedDir: path.resolve(import.meta.dirname, '../src/shared'),
  leafletDistDir: path.resolve(import.meta.dirname, '../node_modules/leaflet/dist')
});

await new Promise((resolve) => {
  app.server.listen(0, '127.0.0.1', () => {
    resolve();
  });
});

const address = app.server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
console.log(`Live test server running on ${baseUrl}`);

let passed = 0;
let failed = 0;

async function request(urlPath, options = {}) {
  const url = `${baseUrl}${urlPath}`;
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
  }
  return { status: response.status, headers: response.headers, text, json };
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

try {
  console.log('\n--- 1. Testing Web & Static Assets Connections ---');
  const rHome = await request('/');
  assert(rHome.status === 200 && rHome.text.includes('AgriCircle'), 'GET / returns 200 with HTML title');

  const rCss = await request('/styles/app.css');
  assert(rCss.status === 200 && rCss.headers.get('content-type')?.includes('text/css'), 'GET /styles/app.css returns 200 text/css');

  const rJs = await request('/js/app.js');
  assert(rJs.status === 200 && rJs.headers.get('content-type')?.includes('javascript'), 'GET /js/app.js returns 200 javascript');

  const rManifest = await request('/manifest.webmanifest');
  assert(rManifest.status === 200 && Boolean(rManifest.json?.short_name), 'GET /manifest.webmanifest returns valid PWA manifest');

  const rSw = await request('/sw.js');
  assert(rSw.status === 200 && rSw.headers.get('content-type')?.includes('javascript'), 'GET /sw.js returns 200 javascript');

  const rLeafletCss = await request('/vendor/leaflet/leaflet.css');
  assert(rLeafletCss.status === 200, 'GET /vendor/leaflet/leaflet.css returns 200');

  const rLeafletJs = await request('/vendor/leaflet/leaflet.js');
  assert(rLeafletJs.status === 200, 'GET /vendor/leaflet/leaflet.js returns 200');

  console.log('\n--- 2. Testing API Data Flow & Endpoints ---');
  const rInitialListings = await request('/api/listings');
  assert(rInitialListings.status === 200 && Array.isArray(rInitialListings.json?.listings), 'GET /api/listings returns 200 and listings array');

  const newListingPayload = {
    category: 'rom-ra',
    rawQuantity: 2,
    rawUnit: 'cong_nam_bo',
    offerType: 'free',
    lat: 10.725,
    lng: 106.985,
    contactName: 'Bác Ba Cẩm Đường',
    contactPhone: '0912345678',
    accessRoad: 'truck',
    moistureState: 'dry',
    locationNote: 'Gần cầu Suối Cả, ruộng sau đình',
    clientRequestId: 'req-live-post-00000000001'
  };

  const rCreate = await request('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newListingPayload)
  });
  assert(rCreate.status === 201 && rCreate.json?.shortCode?.length === 4, 'POST /api/listings creates listing and returns 4-digit shortCode');
  const createdListing = rCreate.json?.listing;
  const shortCode = rCreate.json?.shortCode;

  assert(
    createdListing?.accessRoad === 'truck' && createdListing?.moistureState === 'dry',
    'Created listing matches accessRoad=truck and moistureState=dry'
  );

  const rListAfterCreate = await request('/api/listings');
  const foundInList = rListAfterCreate.json?.listings?.find((item) => item.id === createdListing?.id);
  assert(Boolean(foundInList), 'Newly created listing appears in public GET /api/listings');

  const rCollect = await request(`/api/listings/${createdListing.id}/collect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shortCode: shortCode,
      actualKgCollected: 1111
    })
  });
  assert(rCollect.status === 200 && rCollect.json?.listing?.status === 'collected', 'POST /api/listings/:id/collect completes collection with status=collected');

  const rListAfterCollect = await request('/api/listings');
  const stillInPublicList = rListAfterCollect.json?.listings?.find((item) => item.id === createdListing?.id);
  assert(!stillInPublicList, 'Collected listing is automatically removed from public map listings');

  const rCalcSync = await request('/api/metrics/calculation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta: 5, clientRequestId: 'req-live-calc-00000000001' })
  });
  assert(rCalcSync.status === 200 && rCalcSync.json?.ok === true, 'POST /api/metrics/calculation records offline calculations');

  const rImpact = await request('/api/impact');
  assert(
    rImpact.status === 200 &&
    typeof rImpact.json?.totalKgDiverted === 'number' &&
    rImpact.json?.totalKgDiverted >= 1111,
    'GET /api/impact returns updated environmental impact metrics'
  );

  console.log('\n--- 3. Testing Security & Defensive Edge Connections ---');
  const rSecurityCT = await request('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(newListingPayload)
  });
  assert(rSecurityCT.status === 415, 'Reject non-application/json payload with HTTP 415');

  const rTraversal = await request('/..%2fpackage.json');
  assert(rTraversal.status === 403 || rTraversal.status === 404, 'Block path traversal URL attempts');

  console.log('\n======================================================');
  console.log(`LIVE CONNECTION TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');
} finally {
  await app.close();
  try {
    fs.unlinkSync(testDbPath);
    if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
    if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
  } catch {
  }
}

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
