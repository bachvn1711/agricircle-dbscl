import test from 'node:test';
import assert from 'node:assert/strict';

import { getRegionById, isValidRegionId } from '../src/shared/regions.js';
import { getCropById, getByproductCategoryById } from '../src/shared/crops.js';
import { convertToKg, getUnitById } from '../src/shared/units.js';
import { haversineKm, sortByDistance } from '../src/shared/geo.js';
import { calculateFreshnessPrice, projectThreeDays } from '../src/shared/pricing.js';
import { parseVoiceInput } from '../src/shared/voice-parser.js';
import {
  isValidAdminPin,
  validateCreateListing,
  validateCollectBody,
  validateAdminPatchListing,
  validateCropUpdate,
  validateCalcInput
} from '../src/shared/validation.js';

test('prototype keys and degenerate inputs never leak Object.prototype members', () => {
  for (const key of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
    assert.equal(isValidRegionId(key), false);
    assert.equal(getRegionById(key).id, 'dbscl');
    assert.equal(getCropById(key), null);
    assert.equal(getByproductCategoryById(key), null);
    assert.equal(getUnitById(key), null);
    assert.equal(convertToKg('rom-ra', 2, key), 0);
  }

  const nullProtoPatch = Object.assign(Object.create(null), { locationNote: 'Chợ nổi Cái Răng' });
  assert.equal(validateAdminPatchListing(nullProtoPatch).ok, true);

  const protoPayload = JSON.parse('{"__proto__":{"status":"collected"},"locationNote":"OK"}');
  assert.equal(validateAdminPatchListing(protoPayload).ok, false);

  const protoCrop = JSON.parse('{"__proto__":{},"dailyDecayRate":0.05}');
  assert.equal(validateCropUpdate(protoCrop).ok, false);
});

test('convertToKg supports both object and positional signatures and guards non-finite inputs', () => {
  assert.equal(convertToKg('rom-ra', 2, 'cong_nam_bo'), 1111);
  assert.equal(convertToKg({ category: 'rom-ra', rawQuantity: 2, rawUnit: 'cong_nam_bo' }), 1111);
  assert.equal(convertToKg('rom-ra', 0, 'kg'), 0);
  assert.equal(convertToKg('rom-ra', -5, 'kg'), 0);
  assert.equal(convertToKg('rom-ra', Number.NaN, 'kg'), 0);
  assert.equal(convertToKg('rom-ra', Number.POSITIVE_INFINITY, 'kg'), 0);
  assert.equal(convertToKg('rom-ra', 2, 'unknown'), 0);
});

test('haversineKm and sortByDistance handle invalid coordinates deterministically', () => {
  assert.equal(haversineKm(Number.NaN, 105, 10, 105), Number.POSITIVE_INFINITY);
  assert.equal(haversineKm(95, 105, 10, 105), Number.POSITIVE_INFINITY);

  const sorted = sortByDistance(
    [
      { id: 'far', lat: 10.7769, lng: 106.7009 },
      { id: 'invalid', lat: Number.NaN, lng: 105.7469 },
      { id: 'near', lat: 10.0452, lng: 105.7469 }
    ],
    10.0452,
    105.7469
  );
  assert.deepEqual(
    sorted.map((item) => item.id),
    ['near', 'far', 'invalid']
  );
  assert.equal(sorted[0].distanceKm, 0);
  assert.equal(sorted[2].distanceKm, null);
});

test('calculateFreshnessPrice and projectThreeDays reject invalid bounds', () => {
  assert.throws(() =>
    calculateFreshnessPrice({
      basePriceVnd: 0,
      dailyDecayRate: 0.05,
      storageMode: 'fan',
      daysAfterHarvest: 1,
      maxShelfLifeDays: 10
    })
  );
  assert.throws(() =>
    calculateFreshnessPrice({
      basePriceVnd: 10000,
      dailyDecayRate: 0.05,
      storageMode: 'warm',
      daysAfterHarvest: 1,
      maxShelfLifeDays: 10
    })
  );
  assert.throws(() =>
    calculateFreshnessPrice({
      basePriceVnd: Number.NaN,
      dailyDecayRate: 0.05,
      storageMode: 'fan',
      daysAfterHarvest: 1,
      maxShelfLifeDays: 10
    })
  );
  assert.throws(() =>
    projectThreeDays({
      basePriceVnd: 10000,
      dailyDecayRate: 0.05,
      storageMode: 'fan',
      daysAfterHarvest: -1,
      maxShelfLifeDays: 10
    })
  );
});

test('parseVoiceInput avoids Vietnamese substring traps and parses compound phrases', () => {
  const companyTrap = parseVoiceInput('công ty cần bán bã mía 50 nghìn trong 3 tuần');
  assert.equal(companyTrap.category, 'ba-mia-ba-san');
  assert.equal(companyTrap.rawQuantity, null);
  assert.equal(companyTrap.rawUnit, null);
  assert.equal(companyTrap.offerType, 'sell');
  assert.equal(companyTrap.expiryDays, 14);

  const verbTrap = parseVoiceInput('hiện tại tôi muốn tạo tin rơm rạ ở gần chợ nổi miễn phí');
  assert.equal(verbTrap.category, 'rom-ra');
  assert.equal(verbTrap.rawUnit, null);
  assert.equal(verbTrap.offerType, 'free');
  assert.equal(verbTrap.locationNote, 'ở gần chợ nổi');

  const suffixHalf = parseVoiceInput('hai công rưỡi rơm rạ');
  assert.equal(suffixHalf.rawQuantity, 2.5);
  assert.equal(suffixHalf.rawUnit, 'cong_nam_bo');
});

test('validation preserves CSV test payloads and rejects undefined fields, overflow kg, and control chars in PIN', () => {
  const csvNoteRes = validateCreateListing({
    category: 'rom-ra',
    rawQuantity: 1,
    rawUnit: 'ta',
    offerType: 'free',
    lat: 10.0452,
    lng: 105.7469,
    locationNote: '\r=CMD()\n=HYPERLINK()',
    contactName: 'Cô Năm',
    contactPhone: '0912345678'
  });
  assert.equal(csvNoteRes.ok, true);
  assert.equal(csvNoteRes.value.locationNote, '\r=CMD()\n=HYPERLINK()');

  assert.equal(validateAdminPatchListing({ locationNote: undefined }).ok, false);
  assert.equal(validateAdminPatchListing({ rawQuantity: 101, rawUnit: 'tan' }).ok, false);
  assert.equal(validateCollectBody({ shortCode: 'AB3K', actualKgCollected: null }).ok, false);

  assert.equal(isValidAdminPin('      '), false);
  assert.equal(isValidAdminPin('123456\n'), false);
});

test('regression: basePriceVnd below 1 VND is rejected consistently in validation and pricing', () => {
  for (const subOne of [0.4, 0.49, 0.99]) {
    assert.equal(
      validateCalcInput({
        basePriceVnd: subOne,
        dailyDecayRate: 0.05,
        storageMode: 'fan',
        daysAfterHarvest: 1,
        maxShelfLifeDays: 10
      }).ok,
      false
    );
    assert.throws(() =>
      calculateFreshnessPrice({
        basePriceVnd: subOne,
        dailyDecayRate: 0.05,
        storageMode: 'fan',
        daysAfterHarvest: 1,
        maxShelfLifeDays: 10
      })
    );
  }

  assert.equal(
    validateCalcInput({
      basePriceVnd: 1,
      dailyDecayRate: 0.05,
      storageMode: 'fan',
      daysAfterHarvest: 1,
      maxShelfLifeDays: 10
    }).ok,
    true
  );
  assert.equal(
    calculateFreshnessPrice({
      basePriceVnd: 1,
      dailyDecayRate: 0.05,
      storageMode: 'fan',
      daysAfterHarvest: 1,
      maxShelfLifeDays: 10
    }).suggestedPriceVnd,
    0
  );
});

test('regression: voice-parser anchors expiry regexes, supports chục/trăm + matchAll, and handles multi-space Hiện tại', () => {
  assert.equal(parseVoiceInput('lô B5 ngày mai').expiryDays, 2);
  assert.equal(parseVoiceInput('đường DT842 ngày mai').expiryDays, 2);
  assert.equal(parseVoiceInput('lô A4 tuần này').expiryDays, 7);
  assert.equal(parseVoiceInput('khai tuần này').expiryDays, 7);
  assert.equal(parseVoiceInput('lô B5 có 0 ngày, cần dọn trong 2 ngày').expiryDays, 2);

  const hundredKg = parseVoiceInput('một trăm kg rơm rạ');
  assert.equal(hundredKg.rawQuantity, 100);
  assert.equal(hundredKg.rawUnit, 'kg');

  const twoHundredBags = parseVoiceInput('hai trăm bao tải vỏ bưởi');
  assert.equal(twoHundredBags.rawQuantity, 200);
  assert.equal(twoHundredBags.rawUnit, 'bao_tai');

  const oneDozenBags = parseVoiceInput('một chục bao tải rơm');
  assert.equal(oneDozenBags.rawQuantity, 10);
  assert.equal(oneDozenBags.rawUnit, 'bao_tai');

  const twentyKg = parseVoiceInput('hai chục kg bã mía');
  assert.equal(twentyKg.rawQuantity, 20);
  assert.equal(twentyKg.rawUnit, 'kg');

  const skipZeroMatch = parseVoiceInput('tôi có 0 kg, nhầm 5 kg rơm rạ');
  assert.equal(skipZeroMatch.rawQuantity, 5);
  assert.equal(skipZeroMatch.rawUnit, 'kg');

  const skipInvalidPhraseMatch = parseVoiceInput('mười trăm kg rồi 15 kg rơm');
  assert.equal(skipInvalidPhraseMatch.rawQuantity, 15);
  assert.equal(skipInvalidPhraseMatch.rawUnit, 'kg');

  assert.equal(parseVoiceInput('Hiện  tại tôi có 2 công rơm rạ').locationNote, '');
  assert.equal(parseVoiceInput('Hiện\t\ttại tôi có 2 công rơm ở gần chợ nổi').locationNote, 'ở gần chợ nổi');
});
