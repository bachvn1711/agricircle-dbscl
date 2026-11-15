import test from 'node:test';
import assert from 'node:assert/strict';

test('R14: src/shared modules import and execute with Buffer and process deleted', async () => {
  const processDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'process');
  const bufferDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Buffer');
  delete globalThis.process;
  delete globalThis.Buffer;

  try {
    assert.equal(typeof globalThis.process, 'undefined');
    assert.equal(typeof globalThis.Buffer, 'undefined');

    const [
      regionsMod,
      cropsMod,
      unitsMod,
      geoMod,
      pricingMod,
      voiceMod,
      validationMod
    ] = await Promise.all([
      import('../src/shared/regions.js?pure=1'),
      import('../src/shared/crops.js?pure=1'),
      import('../src/shared/units.js?pure=1'),
      import('../src/shared/geo.js?pure=1'),
      import('../src/shared/pricing.js?pure=1'),
      import('../src/shared/voice-parser.js?pure=1'),
      import('../src/shared/validation.js?pure=1')
    ]);

    assert.equal(regionsMod.getRegionById('dbscl').id, 'dbscl');
    assert.ok(cropsMod.DEFAULT_CROPS.length >= 8);
    assert.equal(unitsMod.convertToKg({ category: 'rom-ra', rawQuantity: 2, rawUnit: 'cong_nam_bo' }), 1111);
    assert.equal(geoMod.haversineKm(10.0452, 105.7469, 10.0452, 105.7469), 0);
    assert.equal(
      pricingMod.calculateFreshnessPrice({
        basePriceVnd: 20000,
        dailyDecayRate: 0.05,
        storageMode: 'fan',
        daysAfterHarvest: 3,
        maxShelfLifeDays: 12
      }).suggestedPriceVnd,
      17000
    );
    assert.equal(voiceMod.parseVoiceInput('2 công rơm rạ').rawQuantity, 2);
    assert.equal(validationMod.validateCollectBody({ shortCode: 'AB3K' }).ok, true);
    assert.equal(validationMod.validateCollectBody({ shortCode: '123đ' }).ok, false);
    assert.equal(validationMod.isValidAdminPin('123456'), true);
  } finally {
    if (processDescriptor) Object.defineProperty(globalThis, 'process', processDescriptor);
    if (bufferDescriptor) Object.defineProperty(globalThis, 'Buffer', bufferDescriptor);
  }
});

test('R3: REGIONS defaults to Xuân Đường center with zoom 13 and getRegionById resolves all regions', async () => {
  const { REGIONS, getRegionById } = await import('../src/shared/regions.js');
  const regionList = Array.isArray(REGIONS) ? REGIONS : Object.values(REGIONS);

  assert.ok(regionList.length >= 4);
  assert.equal(regionList[0].id, 'xuan_duong');
  assert.deepEqual(regionList[0].center, [10.7482, 107.1825]);
  assert.equal(regionList[0].defaultZoom, 13);

  const dbscl = getRegionById('dbscl');
  const mienTrung = getRegionById('mien_trung');
  const mienBac = getRegionById('mien_bac');

  assert.equal(dbscl.id, 'dbscl');
  assert.deepEqual(dbscl.center, [10.0452, 105.7469]);
  assert.equal(mienTrung.id, 'mien_trung');
  assert.equal(mienBac.id, 'mien_bac');
  assert.ok(Array.isArray(mienTrung.center) && mienTrung.center.length === 2);
  assert.ok(Array.isArray(mienBac.center) && mienBac.center.length === 2);
  assert.ok(dbscl.center[0] < mienTrung.center[0] && mienTrung.center[0] < mienBac.center[0]);

  assert.doesNotThrow(() => {
    const unknown = getRegionById('unknown-region');
    const empty = getRegionById(null);
    assert.ok(unknown == null || unknown.id === 'xuan_duong');
    assert.ok(empty == null || empty.id === 'xuan_duong');
  });
});

test('R3, R8: DEFAULT_CROPS and BYPRODUCT_CATEGORIES expose survey crops and 6 distinct byproduct categories', async () => {
  const { DEFAULT_CROPS, BYPRODUCT_CATEGORIES } = await import('../src/shared/crops.js');

  assert.ok(Array.isArray(DEFAULT_CROPS));
  assert.ok(DEFAULT_CROPS.length >= 8);

  const requiredCropIds = [
    'ca-chua',
    'rau-muong',
    'xoai-cat',
    'buoi-da-xanh',
    'sau-rieng',
    'cai-xanh',
    'dua-leo',
    'khoai-lang'
  ];
  const cropById = new Map(DEFAULT_CROPS.map((crop) => [crop.id, crop]));
  assert.equal(cropById.size, DEFAULT_CROPS.length);

  for (const id of requiredCropIds) {
    assert.ok(cropById.has(id), id);
  }

  for (const crop of DEFAULT_CROPS) {
    assert.equal(typeof crop.name, 'string');
    assert.ok(crop.name.length > 0);
    assert.equal(typeof crop.icon, 'string');
    assert.ok(crop.icon.length > 0);
    assert.equal(typeof crop.sourceNote, 'string');
    assert.ok(crop.sourceNote.length > 0);
    assert.ok(crop.dailyDecayRate > 0 && crop.dailyDecayRate <= 0.5);
    assert.ok(Number.isInteger(crop.maxShelfLifeDays) && crop.maxShelfLifeDays >= 1 && crop.maxShelfLifeDays <= 365);
    assert.ok(typeof crop.referencePriceVnd === 'number' && crop.referencePriceVnd >= 100);
  }

  const caChua = cropById.get('ca-chua');
  assert.equal(caChua.dailyDecayRate, 0.05);
  assert.equal(caChua.maxShelfLifeDays, 12);

  const rauMuong = cropById.get('rau-muong');
  assert.equal(rauMuong.dailyDecayRate, 0.1);
  assert.equal(rauMuong.maxShelfLifeDays, 4);

  assert.ok(Array.isArray(BYPRODUCT_CATEGORIES));
  assert.equal(BYPRODUCT_CATEGORIES.length, 6);
  for (const cat of BYPRODUCT_CATEGORIES) {
    assert.equal(typeof cat.id, 'string');
    assert.ok(cat.id.length > 0);
    assert.equal(typeof cat.name, 'string');
    assert.ok(cat.name.length > 0);
    assert.equal(typeof cat.color, 'string');
    assert.ok(cat.color.length > 0);
    assert.equal(typeof cat.icon, 'string');
    assert.ok(cat.icon.length > 0);
  }

  assert.equal(new Set(BYPRODUCT_CATEGORIES.map((c) => c.id)).size, 6);
  assert.equal(new Set(BYPRODUCT_CATEGORIES.map((c) => c.name)).size, 6);
  assert.equal(new Set(BYPRODUCT_CATEGORIES.map((c) => c.color)).size, 6);
  assert.equal(new Set(BYPRODUCT_CATEGORIES.map((c) => c.icon)).size, 6);
  assert.ok(BYPRODUCT_CATEGORIES.some((c) => c.id === 'rom-ra'));
});

test('R5: UNITS and convertToKg convert all 8 local units with proportional area scaling', async () => {
  const { UNITS, convertToKg } = await import('../src/shared/units.js');
  const unitList = Array.isArray(UNITS) ? UNITS : Object.values(UNITS);
  const unitIds = new Set(unitList.map((u) => u.id));

  for (const expectedId of ['kg', 'ta', 'tan', 'bao_tai', 'xe_ba_gac', 'sao_bac_bo', 'sao_trung_bo', 'cong_nam_bo']) {
    assert.ok(unitIds.has(expectedId), expectedId);
  }

  const cases = [
    { category: 'rom-ra', rawQuantity: 3, rawUnit: 'kg', expectedKg: 3 },
    { category: 'rom-ra', rawQuantity: 2, rawUnit: 'ta', expectedKg: 200 },
    { category: 'rom-ra', rawQuantity: 1.5, rawUnit: 'tan', expectedKg: 1500 },
    { category: 'rom-ra', rawQuantity: 1, rawUnit: 'bao_tai', expectedKg: 22.5 },
    { category: 'rom-ra', rawQuantity: 2, rawUnit: 'bao_tai', expectedKg: 45 },
    { category: 'rom-ra', rawQuantity: 2, rawUnit: 'xe_ba_gac', expectedKg: 600 },
    { category: 'rom-ra', rawQuantity: 1, rawUnit: 'sao_bac_bo', expectedKg: 200 },
    { category: 'rom-ra', rawQuantity: 1, rawUnit: 'sao_trung_bo', expectedKg: 278 },
    { category: 'rom-ra', rawQuantity: 1, rawUnit: 'cong_nam_bo', expectedKg: 556 },
    { category: 'rom-ra', rawQuantity: 2, rawUnit: 'cong_nam_bo', expectedKg: 1111 }
  ];

  for (const row of cases) {
    assert.equal(
      convertToKg({ category: row.category, rawQuantity: row.rawQuantity, rawUnit: row.rawUnit }),
      row.expectedKg
    );
  }
});

test('R5: haversineKm computes zero self-distance, symmetry, and kilometer distances', async () => {
  const { haversineKm } = await import('../src/shared/geo.js');

  assert.equal(haversineKm(10.0452, 105.7469, 10.0452, 105.7469), 0);

  const dCanThoToHcm = haversineKm(10.0452, 105.7469, 10.7769, 106.7009);
  const dHcmToCanTho = haversineKm(10.7769, 106.7009, 10.0452, 105.7469);
  assert.ok(Math.abs(dCanThoToHcm - dHcmToCanTho) < 1e-9);
  assert.ok(dCanThoToHcm > 130 && dCanThoToHcm < 134);

  const oneDegreeLat = haversineKm(0, 0, 1, 0);
  assert.ok(oneDegreeLat > 111.0 && oneDegreeLat < 111.4);
});

test('R8, R9: calculateFreshnessPrice enforces BigInt 10_000_000n precision, half-up round_100, zones, and shelf-life cap', async () => {
  const { calculateFreshnessPrice } = await import('../src/shared/pricing.js');

  const exactCases = [
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.05, storageMode: 'fan', daysAfterHarvest: 0, maxShelfLifeDays: 12 },
      remainingScaled: 10_000_000n,
      remainingPercent: 100,
      suggestedPriceVnd: 20000,
      zone: 'green'
    },
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.05, storageMode: 'fan', daysAfterHarvest: 3, maxShelfLifeDays: 12 },
      remainingScaled: 8_500_000n,
      remainingPercent: 85,
      suggestedPriceVnd: 17000,
      zone: 'green'
    },
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.05, storageMode: 'fan', daysAfterHarvest: 12, maxShelfLifeDays: 12 },
      remainingScaled: 4_000_000n,
      remainingPercent: 40,
      suggestedPriceVnd: 8000,
      zone: 'yellow'
    },
    {
      input: { basePriceVnd: 10000, dailyDecayRate: 0.04, storageMode: 'fan', daysAfterHarvest: 15, maxShelfLifeDays: 20 },
      remainingScaled: 4_000_000n,
      remainingPercent: 40,
      suggestedPriceVnd: 4000,
      zone: 'yellow'
    },
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.03, storageMode: 'hot', daysAfterHarvest: 6, maxShelfLifeDays: 20 },
      remainingScaled: 7_480_000n,
      remainingPercent: 74.8,
      suggestedPriceVnd: 15000,
      zone: 'yellow'
    },
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.015, storageMode: 'fan', daysAfterHarvest: 17, maxShelfLifeDays: 30 },
      remainingScaled: 7_450_000n,
      remainingPercent: 74.5,
      suggestedPriceVnd: 14900,
      zone: 'yellow'
    },
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.015, storageMode: 'cold', daysAfterHarvest: 1, maxShelfLifeDays: 30 },
      remainingScaled: 9_925_000n,
      remainingPercent: 99.25,
      suggestedPriceVnd: 19900,
      zone: 'green'
    },
    {
      input: { basePriceVnd: 15000, dailyDecayRate: 0.05, storageMode: 'fan', daysAfterHarvest: 7, maxShelfLifeDays: 12 },
      remainingScaled: 6_500_000n,
      remainingPercent: 65,
      suggestedPriceVnd: 9800,
      zone: 'yellow'
    },
    {
      input: { basePriceVnd: 10000, dailyDecayRate: 0.1, storageMode: 'hot', daysAfterHarvest: 5, maxShelfLifeDays: 4 },
      remainingScaled: 3_000_000n,
      remainingPercent: 30,
      suggestedPriceVnd: 3000,
      zone: 'red'
    },
    {
      input: { basePriceVnd: 10000, dailyDecayRate: 0.1, storageMode: 'hot', daysAfterHarvest: 8, maxShelfLifeDays: 4 },
      remainingScaled: 0n,
      remainingPercent: 0,
      suggestedPriceVnd: 0,
      zone: 'red'
    },
    {
      input: { basePriceVnd: 10_000_000, dailyDecayRate: 0.05, storageMode: 'fan', daysAfterHarvest: 3, maxShelfLifeDays: 12 },
      remainingScaled: 8_500_000n,
      remainingPercent: 85,
      suggestedPriceVnd: 8_500_000,
      zone: 'green'
    },
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.05, storageMode: 'cold', daysAfterHarvest: 15, maxShelfLifeDays: 12 },
      remainingScaled: 6_250_000n,
      remainingPercent: 62.5,
      suggestedPriceVnd: 12500,
      zone: 'red'
    },
    {
      input: { basePriceVnd: 20000, dailyDecayRate: 0.05, storageMode: 'fan', daysAfterHarvest: 25, maxShelfLifeDays: 12 },
      remainingScaled: 0n,
      remainingPercent: 0,
      suggestedPriceVnd: 0,
      zone: 'red'
    }
  ];

  for (const row of exactCases) {
    const res = calculateFreshnessPrice(row.input);
    assert.equal(typeof res.remainingScaled, 'bigint');
    assert.equal(res.remainingScaled, row.remainingScaled);
    assert.equal(res.remainingPercent, row.remainingPercent);
    assert.equal(res.suggestedPriceVnd, row.suggestedPriceVnd);
    assert.equal(res.zone, row.zone);
    assert.equal(typeof res.adviceText, 'string');
    assert.ok(res.adviceText.length > 0);
  }

  const oddDecimal = calculateFreshnessPrice({
    basePriceVnd: 10000,
    dailyDecayRate: 0.1234567,
    storageMode: 'fan',
    daysAfterHarvest: 1,
    maxShelfLifeDays: 10
  });
  assert.equal(oddDecimal.suggestedPriceVnd, 8800);
  assert.equal(oddDecimal.zone, 'green');
});

test('R8, R9: projectThreeDays forecasts 3 consecutive future days without mutating input', async () => {
  const { projectThreeDays } = await import('../src/shared/pricing.js');

  const input = {
    basePriceVnd: 20000,
    dailyDecayRate: 0.05,
    storageMode: 'fan',
    daysAfterHarvest: 11,
    maxShelfLifeDays: 12
  };
  const forecast = projectThreeDays(input);

  assert.equal(input.daysAfterHarvest, 11);
  assert.ok(Array.isArray(forecast));
  assert.equal(forecast.length, 3);

  assert.equal(forecast[0].remainingScaled, 4_000_000n);
  assert.equal(forecast[0].suggestedPriceVnd, 8000);
  assert.equal(forecast[0].zone, 'yellow');

  assert.equal(forecast[1].remainingScaled, 3_500_000n);
  assert.equal(forecast[1].suggestedPriceVnd, 7000);
  assert.equal(forecast[1].zone, 'red');

  assert.equal(forecast[2].remainingScaled, 3_000_000n);
  assert.equal(forecast[2].suggestedPriceVnd, 6000);
  assert.equal(forecast[2].zone, 'red');
});

test('R7: parseVoiceInput handles Vietnamese phrases, fractions, null/empty/punctuation, and 500-codepoint clamp', async () => {
  const { parseVoiceInput } = await import('../src/shared/voice-parser.js');
  const { BYPRODUCT_CATEGORIES } = await import('../src/shared/crops.js');
  const validCatIds = new Set(BYPRODUCT_CATEGORIES.map((c) => c.id));

  const strawText = 'Tôi có 2 công rơm rạ ở gần đình làng, cho không, cần dọn trong 2 ngày';
  const straw = parseVoiceInput(strawText);
  assert.equal(straw.category, 'rom-ra');
  assert.equal(straw.rawQuantity, 2);
  assert.equal(straw.rawUnit, 'cong_nam_bo');
  assert.equal(straw.offerType, 'free');
  assert.equal(straw.expiryDays, 2);
  assert.equal(typeof straw.locationNote, 'string');
  assert.ok(straw.locationNote.toLowerCase().includes('đình làng'));
  assert.equal(straw.truncatedText, strawText);

  const pomelo = parseVoiceInput('hai rưỡi bao tải vỏ bưởi bán gấp');
  assert.ok(validCatIds.has(pomelo.category));
  assert.notEqual(pomelo.category, 'rom-ra');
  assert.equal(pomelo.rawQuantity, 2.5);
  assert.equal(pomelo.rawUnit, 'bao_tai');
  assert.equal(pomelo.offerType, 'sell');
  assert.equal(pomelo.expiryDays, 1);

  const corn = parseVoiceInput('nửa công thân bắp');
  assert.ok(validCatIds.has(corn.category));
  assert.notEqual(corn.category, 'rom-ra');
  assert.notEqual(corn.category, pomelo.category);
  assert.equal(corn.rawQuantity, 0.5);
  assert.equal(corn.rawUnit, 'cong_nam_bo');

  const commaDecimal = parseVoiceInput('Tôi có 2,5 tạ rơm rạ');
  assert.equal(commaDecimal.category, 'rom-ra');
  assert.equal(commaDecimal.rawQuantity, 2.5);
  assert.equal(commaDecimal.rawUnit, 'ta');

  for (const emptyInput of [null, '', '   ...!!!???  ']) {
    const parsed = parseVoiceInput(emptyInput);
    assert.ok(parsed && typeof parsed === 'object');
    assert.ok('category' in parsed);
    assert.ok('rawQuantity' in parsed);
    assert.ok('rawUnit' in parsed);
    assert.ok('offerType' in parsed);
    assert.ok('expiryDays' in parsed);
    assert.ok('locationNote' in parsed);
    assert.ok('truncatedText' in parsed);
    assert.equal(parsed.rawQuantity ?? null, null);
    assert.equal(parsed.rawUnit ?? null, null);
    assert.equal(typeof parsed.truncatedText, 'string');
    assert.notEqual(pomelo.category, parsed.category);
    assert.notEqual(corn.category, parsed.category);
  }

  const longAscii = 'a'.repeat(600);
  const clampedAscii = parseVoiceInput(longAscii);
  assert.equal(Array.from(clampedAscii.truncatedText).length, 500);

  const longAstral = 'a'.repeat(499) + '🌾🌾🌾';
  const clampedAstral = parseVoiceInput(longAstral);
  assert.equal(Array.from(clampedAstral.truncatedText).length, 500);
  assert.equal(clampedAstral.truncatedText, 'a'.repeat(499) + '🌾');
});

test('R10: validateCreateListing enforces field bounds, ignores forged estimatedKg, and rejects invalid shapes', async () => {
  const { validateCreateListing } = await import('../src/shared/validation.js');

  const validPayload = {
    category: 'rom-ra',
    rawQuantity: 2,
    rawUnit: 'cong_nam_bo',
    offerType: 'free',
    priceNote: '',
    lat: 10.0452,
    lng: 105.7469,
    locationNote: 'Gần đình làng',
    contactName: 'Chú Ba',
    contactPhone: '0912345678',
    isProxyPost: true,
    expiryDays: 3,
    rawVoiceText: 'a'.repeat(500),
    clientRequestId: 'req_1234567890abcdef',
    estimatedKg: 999999
  };

  const okRes = validateCreateListing(validPayload);
  assert.equal(okRes.ok, true);
  assert.ok(okRes.value && typeof okRes.value === 'object');
  assert.notEqual(okRes.value.estimatedKg, 999999);

  const omittedExpiry = validateCreateListing({
    category: 'rom-ra',
    rawQuantity: 1,
    rawUnit: 'kg',
    offerType: 'free',
    lat: 10.0452,
    lng: 105.7469,
    contactName: 'Cô Tư',
    contactPhone: '0987654321'
  });
  assert.equal(omittedExpiry.ok, true);
  assert.equal(omittedExpiry.value.expiryDays, 3);

  const invalidCases = [
    null,
    [],
    'not-an-object',
    { ...validPayload, contactPhone: '091234567' },
    { ...validPayload, contactPhone: '09123456789' },
    { ...validPayload, contactPhone: '1912345678' },
    { ...validPayload, contactPhone: '09123abc78' },
    { ...validPayload, contactName: '' },
    { ...validPayload, contactName: '   ' },
    { ...validPayload, category: 'unknown-category' },
    { ...validPayload, rawUnit: 'acre' },
    { ...validPayload, rawQuantity: 0 },
    { ...validPayload, rawQuantity: -2 },
    { ...validPayload, rawQuantity: 10001 },
    { ...validPayload, rawQuantity: 101, rawUnit: 'tan' },
    { ...validPayload, offerType: 'barter' },
    { ...validPayload, lat: 95 },
    { ...validPayload, lng: 185 },
    { ...validPayload, lat: Number.NaN },
    { ...validPayload, expiryDays: 0 },
    { ...validPayload, expiryDays: 15 },
    { ...validPayload, expiryDays: 2.5 },
    { ...validPayload, rawVoiceText: 'a'.repeat(501) },
    { ...validPayload, clientRequestId: 'too_short_15chr' },
    { ...validPayload, clientRequestId: 'bad space 1234567890' },
    { ...validPayload, clientRequestId: 'a'.repeat(65) }
  ];

  for (const bad of invalidCases) {
    const res = validateCreateListing(bad);
    assert.equal(res.ok, false);
    assert.equal(typeof res.error, 'string');
    assert.ok(res.error.length > 0);
  }
});

test('R6, R10: validateCollectBody enforces 4-char ASCII Crockford-base32 shortCode and bounded actualKgCollected', async () => {
  const { validateCollectBody } = await import('../src/shared/validation.js');

  const minimalValid = validateCollectBody({ shortCode: 'AB3K' });
  assert.equal(minimalValid.ok, true);
  assert.equal(minimalValid.value.shortCode, 'AB3K');

  const normalizedValid = validateCollectBody({ shortCode: 'ab3k', actualKgCollected: 1111 });
  assert.equal(normalizedValid.ok, true);
  assert.equal(normalizedValid.value.shortCode, 'AB3K');
  assert.equal(normalizedValid.value.actualKgCollected, 1111);

  const invalidBodies = [
    null,
    [],
    {},
    { contactPhone: '0912345678' },
    { shortCode: 1234 },
    { shortCode: 'ABC' },
    { shortCode: 'ABCDE' },
    { shortCode: '123đ' },
    { shortCode: '🎉🎉' },
    { shortCode: 'ABCI' },
    { shortCode: 'ABCL' },
    { shortCode: 'ABCO' },
    { shortCode: 'ABCU' },
    { shortCode: 'AB3K', actualKgCollected: 0 },
    { shortCode: 'AB3K', actualKgCollected: -10 },
    { shortCode: 'AB3K', actualKgCollected: 100001 },
    { shortCode: 'AB3K', actualKgCollected: Number.NaN },
    { shortCode: 'AB3K', actualKgCollected: '500' }
  ];

  for (const bad of invalidBodies) {
    const res = validateCollectBody(bad);
    assert.equal(res.ok, false);
    assert.equal(typeof res.error, 'string');
    assert.ok(res.error.length > 0);
  }
});

test('R10, R12: validateAdminPatchListing, validateCropUpdate, validateCalcInput, validateCalcFlush, and isValidAdminPin enforce bounds', async () => {
  const {
    validateAdminPatchListing,
    validateCropUpdate,
    validateCalcInput,
    validateCalcFlush,
    isValidAdminPin
  } = await import('../src/shared/validation.js');

  assert.equal(validateAdminPatchListing({ locationNote: 'Đầu cầu Xáng', expiryDays: 7 }).ok, true);
  assert.equal(
    validateAdminPatchListing({
      category: 'rom-ra',
      rawQuantity: 4,
      rawUnit: 'ta',
      offerType: 'sell',
      priceNote: '50k/tạ'
    }).ok,
    true
  );

  for (const badPatch of [
    null,
    [],
    {},
    { locationNote: 'OK', status: 'collected' },
    { shortCode: 'AAAA' },
    { contactPhone: '0912345678' },
    { actualKgCollected: 100 },
    { estimatedKg: 500 },
    { expiryDays: 0 },
    { expiryDays: 15 },
    { rawQuantity: -1 },
    { accessRoad: 'spaceship' },
    { moistureState: 'frozen' }
  ]) {
    assert.equal(validateAdminPatchListing(badPatch).ok, false);
  }

  assert.equal(validateAdminPatchListing({ accessRoad: 'boat', moistureState: 'wet' }).ok, true);

  assert.equal(validateCalcFlush({ delta: 1, clientRequestId: 'calc_batch_123456' }).ok, true);
  assert.equal(validateCalcFlush({ delta: 500, clientRequestId: 'a'.repeat(64) }).ok, true);

  for (const badFlush of [
    null,
    [],
    {},
    { delta: 0, clientRequestId: 'calc_batch_123456' },
    { delta: -1, clientRequestId: 'calc_batch_123456' },
    { delta: 501, clientRequestId: 'calc_batch_123456' },
    { delta: 1.5, clientRequestId: 'calc_batch_123456' },
    { delta: '10', clientRequestId: 'calc_batch_123456' },
    { delta: 10, clientRequestId: 'too_short_15chr' },
    { delta: 10, clientRequestId: 'a'.repeat(65) },
    { delta: 10, clientRequestId: 'bad space 1234567890' },
    { delta: 10, clientRequestId: 1234567890123456 }
  ]) {
    assert.equal(validateCalcFlush(badFlush).ok, false);
  }

  assert.equal(isValidAdminPin('123456'), true);
  assert.equal(isValidAdminPin('admin999'), true);
  assert.equal(isValidAdminPin(undefined), false);
  assert.equal(isValidAdminPin(null), false);
  assert.equal(isValidAdminPin(''), false);
  assert.equal(isValidAdminPin('12345'), false);
  assert.equal(isValidAdminPin(123456), false);
  assert.equal(isValidAdminPin(['123456']), false);
});

test('validateCreateListing enforces accessRoad and moistureState with defaults', async () => {
  const { validateCreateListing, ACCESS_ROADS, MOISTURE_STATES } = await import('../src/shared/validation.js');

  const base = {
    category: 'rom-ra',
    rawQuantity: 2,
    rawUnit: 'cong_nam_bo',
    offerType: 'free',
    lat: 10.0452,
    lng: 105.7469,
    contactName: 'Chú Ba',
    contactPhone: '0912345678'
  };

  const defaultRes = validateCreateListing(base);
  assert.equal(defaultRes.ok, true);
  assert.equal(defaultRes.value.accessRoad, 'truck');
  assert.equal(defaultRes.value.moistureState, 'dry');

  for (const road of ACCESS_ROADS) {
    const res = validateCreateListing({ ...base, accessRoad: road });
    assert.equal(res.ok, true);
    assert.equal(res.value.accessRoad, road);
  }

  for (const state of MOISTURE_STATES) {
    const res = validateCreateListing({ ...base, moistureState: state });
    assert.equal(res.ok, true);
    assert.equal(res.value.moistureState, state);
  }

  assert.equal(validateCreateListing({ ...base, accessRoad: 'airplane' }).ok, false);
  assert.equal(validateCreateListing({ ...base, moistureState: 'frozen' }).ok, false);
});
