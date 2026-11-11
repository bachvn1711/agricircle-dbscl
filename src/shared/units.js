export const CO2_KG_PER_KG_DIVERTED = 1.46;
export const AREA_BASE_KG_PER_360M2 = 200;

const RAW_UNITS = [
  {
    id: 'kg',
    name: 'Kilôgam (kg)',
    shortLabel: 'kg',
    kgPerUnit: 1,
    areaM2: null
  },
  {
    id: 'ta',
    name: 'Tạ (100 kg)',
    shortLabel: 'tạ',
    kgPerUnit: 100,
    areaM2: null
  },
  {
    id: 'tan',
    name: 'Tấn (1.000 kg)',
    shortLabel: 'tấn',
    kgPerUnit: 1000,
    areaM2: null
  },
  {
    id: 'bao_tai',
    name: 'Bao tải (~22,5 kg)',
    shortLabel: 'bao tải',
    kgPerUnit: 22.5,
    areaM2: null
  },
  {
    id: 'xe_ba_gac',
    name: 'Xe ba gác (~300 kg)',
    shortLabel: 'xe ba gác',
    kgPerUnit: 300,
    areaM2: null
  },
  {
    id: 'sao_bac_bo',
    name: 'Sào Bắc Bộ (360 m²)',
    shortLabel: 'sào Bắc Bộ',
    kgPerUnit: null,
    areaM2: 360
  },
  {
    id: 'sao_trung_bo',
    name: 'Sào Trung Bộ (500 m²)',
    shortLabel: 'sào Trung Bộ',
    kgPerUnit: null,
    areaM2: 500
  },
  {
    id: 'cong_nam_bo',
    name: 'Công Nam Bộ (1.000 m²)',
    shortLabel: 'công Nam Bộ',
    kgPerUnit: null,
    areaM2: 1000
  }
];

export const UNITS = Object.freeze(RAW_UNITS.map((unit) => Object.freeze({ ...unit })));

const UNIT_BY_ID = new Map(UNITS.map((unit) => [unit.id, unit]));

export function isValidUnit(unitId) {
  return typeof unitId === 'string' && UNIT_BY_ID.has(unitId);
}

export function getUnitById(unitId) {
  if (typeof unitId === 'string' && UNIT_BY_ID.has(unitId)) {
    return UNIT_BY_ID.get(unitId);
  }
  return null;
}

export function convertToKg(categoryOrInput, rawQuantityArg, rawUnitArg) {
  let rawQuantity = rawQuantityArg;
  let rawUnit = rawUnitArg;

  if (categoryOrInput !== null && typeof categoryOrInput === 'object' && !Array.isArray(categoryOrInput)) {
    rawQuantity = categoryOrInput.rawQuantity;
    rawUnit = categoryOrInput.rawUnit;
  }

  if (typeof rawQuantity !== 'number' || !Number.isFinite(rawQuantity) || !(rawQuantity > 0)) {
    return 0;
  }

  const unit = getUnitById(rawUnit);
  if (!unit) {
    return 0;
  }

  let result = 0;
  if (unit.areaM2 !== null) {
    result = Math.round((rawQuantity * unit.areaM2 * AREA_BASE_KG_PER_360M2) / 360);
  } else if (unit.kgPerUnit !== null) {
    result = Math.round(rawQuantity * unit.kgPerUnit * 100) / 100;
  }

  if (!Number.isFinite(result) || !(result >= 0)) {
    return 0;
  }

  return result;
}
