import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  readLocalJsonSafe,
  saveShortCodeReceipt,
  getShortCodeReceipts,
  enqueueOfflineCalc,
  sealCalcBatches,
  ackCalcBatch,
  savePendingPost,
  readPendingPost,
  clearPendingPost
} from '../public/js/state.js';
import {
  classifyCacheRoute,
  purgeOldCaches
} from '../public/js/sw-routes.js';

function createMockStorage(initial = {}, options = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      if (options.throwOnGet) {
        const err = new Error('Storage access denied');
        err.name = 'SecurityError';
        throw err;
      }
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (options.throwOnSet) {
        const err = new Error('Storage write denied');
        err.name = options.setErrorName || 'SecurityError';
        throw err;
      }
      store.set(key, String(value));
    },
    removeItem(key) {
      if (options.throwOnRemove) {
        const err = new Error('Storage remove denied');
        err.name = 'SecurityError';
        throw err;
      }
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
    }
  };
}

function createMockCacheStorage(initialNames = []) {
  const caches = new Set(initialNames);
  const deleted = [];
  return {
    async keys() {
      await Promise.resolve();
      return [...caches];
    },
    async delete(name) {
      await Promise.resolve();
      deleted.push(name);
      return caches.delete(name);
    },
    remaining() {
      return [...caches];
    },
    deletedKeys() {
      return [...deleted];
    }
  };
}

describe('pwa-screens client state and sw-routes', () => {
  it('readLocalJsonSafe returns fallback on missing key, corrupt JSON, null storage, and SecurityError [R2, R11]', () => {
    const fallback = { openDelta: 0, sealedBatches: [] };
    const emptyStorage = createMockStorage();
    assert.deepEqual(readLocalJsonSafe(emptyStorage, 'missing_key', fallback), fallback);

    const corruptStorage = createMockStorage({ bad_key: '{not valid json' });
    assert.deepEqual(readLocalJsonSafe(corruptStorage, 'bad_key', fallback), fallback);

    const blankStorage = createMockStorage({ blank_key: '' });
    assert.deepEqual(readLocalJsonSafe(blankStorage, 'blank_key', fallback), fallback);

    const blockedStorage = createMockStorage({ ok_key: '{"a":1}' }, { throwOnGet: true });
    assert.deepEqual(readLocalJsonSafe(blockedStorage, 'ok_key', fallback), fallback);

    assert.deepEqual(readLocalJsonSafe(null, 'any_key', fallback), fallback);

    const validStorage = createMockStorage({ ok_key: '{"count":3,"items":["a"]}' });
    assert.deepEqual(readLocalJsonSafe(validStorage, 'ok_key', fallback), {
      count: 3,
      items: ['a']
    });
  });

  it('saveShortCodeReceipt and getShortCodeReceipts enforce FIFO cap of 50 and handle throwing storage safely [R2]', () => {
    assert.deepEqual(getShortCodeReceipts(createMockStorage()), []);
    assert.deepEqual(
      getShortCodeReceipts(createMockStorage({}, { throwOnGet: true })),
      []
    );

    const storage = createMockStorage();
    for (let i = 1; i <= 55; i += 1) {
      saveShortCodeReceipt(storage, {
        id: i,
        shortCode: `P${String(i).padStart(3, '0')}`,
        category: 'rom_ra',
        rawQuantity: 2,
        rawUnit: 'cong_nam_bo',
        estimatedKg: 1111,
        offerType: 'free',
        createdAt: 1700000000000 + i
      });
    }

    const saved = getShortCodeReceipts(storage);
    assert.equal(saved.length, 50);
    const savedCodes = new Set(saved.map((item) => item.shortCode));
    assert.equal(savedCodes.size, 50);
    for (let i = 1; i <= 5; i += 1) {
      assert.equal(savedCodes.has(`P${String(i).padStart(3, '0')}`), false);
    }
    for (let i = 6; i <= 55; i += 1) {
      assert.equal(savedCodes.has(`P${String(i).padStart(3, '0')}`), true);
    }

    const throwingSetStorage = createMockStorage(storage.dump(), {
      throwOnSet: true,
      setErrorName: 'QuotaExceededError'
    });
    assert.doesNotThrow(() => {
      saveShortCodeReceipt(throwingSetStorage, {
        id: 99,
        shortCode: 'P099',
        category: 'rom_ra'
      });
    });
    assert.equal(getShortCodeReceipts(throwingSetStorage).length, 50);
  });

  it('enqueueOfflineCalc, sealCalcBatches, and ackCalcBatch preserve pendingDelta=1200 across [500, 500, 200] batches and concurrent enqueue [R10, R11]', () => {
    const storage = createMockStorage();
    let seq = 0;
    const makeBatchId = () => `calc_batch_${String(++seq).padStart(6, '0')}`;

    const enqueued = enqueueOfflineCalc(storage, 1200);
    assert.equal(enqueued.openDelta, 1200);
    assert.deepEqual(enqueued.sealedBatches, []);

    const sealed = sealCalcBatches(storage, makeBatchId);
    assert.equal(sealed.openDelta, 0);
    assert.deepEqual(sealed.sealedBatches, [
      { batchId: 'calc_batch_000001', delta: 500 },
      { batchId: 'calc_batch_000002', delta: 500 },
      { batchId: 'calc_batch_000003', delta: 200 }
    ]);

    const concurrent = enqueueOfflineCalc(storage);
    assert.equal(concurrent.openDelta, 1);
    assert.deepEqual(concurrent.sealedBatches, [
      { batchId: 'calc_batch_000001', delta: 500 },
      { batchId: 'calc_batch_000002', delta: 500 },
      { batchId: 'calc_batch_000003', delta: 200 }
    ]);

    const afterAck1 = ackCalcBatch(storage, 'calc_batch_000001');
    assert.equal(afterAck1.openDelta, 1);
    assert.deepEqual(afterAck1.sealedBatches, [
      { batchId: 'calc_batch_000002', delta: 500 },
      { batchId: 'calc_batch_000003', delta: 200 }
    ]);

    const afterDuplicateAck = ackCalcBatch(storage, 'calc_batch_000001');
    assert.equal(afterDuplicateAck.openDelta, 1);
    assert.deepEqual(afterDuplicateAck.sealedBatches, [
      { batchId: 'calc_batch_000002', delta: 500 },
      { batchId: 'calc_batch_000003', delta: 200 }
    ]);

    const afterUnknownAck = ackCalcBatch(storage, 'nonexistent_batch_id');
    assert.equal(afterUnknownAck.openDelta, 1);
    assert.equal(afterUnknownAck.sealedBatches.length, 2);

    const afterSecondSeal = sealCalcBatches(storage, makeBatchId);
    assert.equal(afterSecondSeal.openDelta, 0);
    assert.deepEqual(afterSecondSeal.sealedBatches, [
      { batchId: 'calc_batch_000002', delta: 500 },
      { batchId: 'calc_batch_000003', delta: 200 },
      { batchId: 'calc_batch_000004', delta: 1 }
    ]);

    const afterZeroSeal = sealCalcBatches(storage, makeBatchId);
    assert.equal(seq, 4);
    assert.equal(afterZeroSeal.openDelta, 0);
    assert.equal(afterZeroSeal.sealedBatches.length, 3);

    const ackedDeltas = [500];
    for (const batch of afterZeroSeal.sealedBatches) {
      ackedDeltas.push(batch.delta);
      ackCalcBatch(storage, batch.batchId);
    }
    const finalState = ackCalcBatch(storage, 'nonexistent_batch_id');
    assert.equal(finalState.openDelta, 0);
    assert.deepEqual(finalState.sealedBatches, []);
    assert.equal(
      ackedDeltas.reduce((sum, d) => sum + d, 0),
      1201
    );
  });

  it('offline calc queue handles invalid deltas, corrupt storage, and throwing storage safely [R11]', () => {
    const storage = createMockStorage();
    enqueueOfflineCalc(storage, 3);
    const afterZero = enqueueOfflineCalc(storage, 0);
    assert.equal(afterZero.openDelta, 3);
    const afterNegative = enqueueOfflineCalc(storage, -5);
    assert.equal(afterNegative.openDelta, 3);
    const afterNan = enqueueOfflineCalc(storage, Number.NaN);
    assert.equal(afterNan.openDelta, 3);

    const throwingGetStorage = createMockStorage({}, { throwOnGet: true });
    assert.doesNotThrow(() => enqueueOfflineCalc(throwingGetStorage, 1));
    assert.doesNotThrow(() => sealCalcBatches(throwingGetStorage, () => 'batch_safe_000001'));
    assert.doesNotThrow(() => ackCalcBatch(throwingGetStorage, 'batch_safe_000001'));

    const throwingSetStorage = createMockStorage({}, { throwOnSet: true });
    assert.doesNotThrow(() => enqueueOfflineCalc(throwingSetStorage, 1));
    assert.doesNotThrow(() => sealCalcBatches(throwingSetStorage, () => 'batch_safe_000002'));
    assert.doesNotThrow(() => ackCalcBatch(throwingSetStorage, 'batch_safe_000002'));
  });

  it('savePendingPost, readPendingPost, and clearPendingPost preserve draft across failures without colliding with receipts or calc queue [R2, R10, R13]', () => {
    const sharedStorage = createMockStorage();
    assert.equal(readPendingPost(sharedStorage), null);
    assert.equal(
      readPendingPost(createMockStorage({}, { throwOnGet: true })),
      null
    );

    saveShortCodeReceipt(sharedStorage, { id: 1, shortCode: 'AB23', category: 'rom_ra' });
    enqueueOfflineCalc(sharedStorage, 4);

    const draft = {
      clientRequestId: 'req_draft_1234567890abcdef',
      category: 'rom_ra',
      rawQuantity: 2,
      rawUnit: 'cong_nam_bo',
      offerType: 'free',
      priceNote: '',
      locationNote: 'Gan dinh lang',
      contactName: 'Chu Hai',
      contactPhone: '0912345678',
      isProxyPost: true,
      rawVoiceText: 'Toi co 2 cong rom ra',
      lat: 10.0452,
      lng: 105.7469,
      expiryDays: 3
    };

    savePendingPost(sharedStorage, draft);
    assert.deepEqual(readPendingPost(sharedStorage), draft);
    assert.equal(getShortCodeReceipts(sharedStorage).length, 1);
    assert.equal(enqueueOfflineCalc(sharedStorage, 1).openDelta, 5);

    clearPendingPost(sharedStorage);
    assert.equal(readPendingPost(sharedStorage), null);
    assert.equal(getShortCodeReceipts(sharedStorage).length, 1);
    assert.equal(sealCalcBatches(sharedStorage, () => 'batch_keep_000001').sealedBatches[0].delta, 5);

    assert.doesNotThrow(() => savePendingPost(createMockStorage({}, { throwOnSet: true }), draft));
    assert.doesNotThrow(() => clearPendingPost(createMockStorage({}, { throwOnRemove: true })));
  });

  it('classifyCacheRoute separates bypass, network-only, network-first, and cache-first routes [R1, R8, R11, R12]', () => {
    const cases = [
      ['/api/listings', 'POST', 'bypass'],
      ['/api/listings/1/collect', 'POST', 'bypass'],
      ['/api/metrics/calculation', 'POST', 'bypass'],
      ['/api/admin/listings/1', 'PATCH', 'bypass'],
      ['/api/admin/crops/ca-chua', 'PUT', 'bypass'],
      ['/api/crops', 'POST', 'bypass'],
      ['/api/listings', 'post', 'bypass'],
      ['/api/admin/login', 'GET', 'network-only'],
      ['/api/admin/listings', 'GET', 'network-only'],
      ['/api/admin/export.csv', 'GET', 'network-only'],
      ['/api/admin/crops/ca-chua', 'GET', 'network-only'],
      ['/api/admin/script.js', 'GET', 'network-only'],
      ['/api/listings', 'GET', 'network-only'],
      ['/api/listings/42', 'GET', 'network-only'],
      ['/api/impact', 'GET', 'network-only'],
      ['/api/metrics/calculation', 'GET', 'network-only'],
      ['/api/health', 'GET', 'network-only'],
      ['/api/crops', 'GET', 'network-first'],
      ['/api/crops', 'get', 'network-first'],
      ['/', 'GET', 'network-first'],
      ['/index.html', 'GET', 'network-first'],
      ['/manifest.webmanifest', 'GET', 'network-first'],
      ['/styles/app.css', 'GET', 'network-first'],
      ['/js/app.js', 'GET', 'network-first'],
      ['/js/state.js', 'GET', 'network-first'],
      ['/js/sw-routes.js', 'GET', 'network-first'],
      ['/shared/pricing.js', 'GET', 'network-first'],
      ['/shared/crops.js', 'GET', 'network-first'],
      ['/icons/icon-192.png', 'GET', 'cache-first'],
      ['/icons/icon-512.png', 'GET', 'cache-first'],
      ['/icons/icon-192.svg', 'GET', 'cache-first'],
      ['/vendor/leaflet/leaflet.js', 'GET', 'cache-first'],
      ['/vendor/leaflet/leaflet.css', 'GET', 'cache-first'],
      ['/vendor/leaflet/images/marker-icon.png', 'GET', 'cache-first']
    ];

    for (const [pathname, method, expected] of cases) {
      assert.equal(
        classifyCacheRoute(pathname, method),
        expected,
        `expected ${method} ${pathname} -> ${expected}`
      );
    }

    for (const uncachedPath of ['/sw.js', '/api/admin', '/unknown-route', '/api/unknown']) {
      const result = classifyCacheRoute(uncachedPath, 'GET');
      assert.ok(
        result === 'bypass' || result === 'network-only',
        `expected ${uncachedPath} not to be cached, got ${result}`
      );
    }
  });

  it('purgeOldCaches deletes khkt-pwa-v1 and other-v0 while preserving khkt-pwa-v2 [R1, R8, R12]', async () => {
    const cacheStorage = createMockCacheStorage([
      'khkt-pwa-v1',
      'khkt-pwa-v2',
      'other-v0'
    ]);

    await purgeOldCaches(cacheStorage, 'khkt-pwa-v2');

    assert.deepEqual(cacheStorage.remaining(), ['khkt-pwa-v2']);
    const deleted = new Set(cacheStorage.deletedKeys());
    assert.equal(deleted.size, 2);
    assert.equal(deleted.has('khkt-pwa-v1'), true);
    assert.equal(deleted.has('other-v0'), true);
    assert.equal(deleted.has('khkt-pwa-v2'), false);

    const emptyCacheStorage = createMockCacheStorage([]);
    await purgeOldCaches(emptyCacheStorage, 'khkt-pwa-v2');
    assert.deepEqual(emptyCacheStorage.deletedKeys(), []);
  });
});
