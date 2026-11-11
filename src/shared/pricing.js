export const SCALE = 10_000_000n;
export const GREEN_MIN_SCALED = 7_500_000n;
export const YELLOW_MIN_SCALED = 4_000_000n;

const ROUND_UNIT = SCALE * 100n;
const HALF_ROUND_UNIT = ROUND_UNIT / 2n;
const VND_FORMATTER = new Intl.NumberFormat('vi-VN');

const RAW_STORAGE_MODES = [
  {
    id: 'cold',
    name: 'Kho lạnh / Thùng xốp đá',
    shortLabel: 'Kho lạnh',
    kFactor: 0.5,
    kDeci: 5n
  },
  {
    id: 'fan',
    name: 'Thoáng mát, có quạt',
    shortLabel: 'Quạt mát',
    kFactor: 1,
    kDeci: 10n
  },
  {
    id: 'hot',
    name: 'Ngoài trời nắng nóng / Ẩm ướt',
    shortLabel: 'Nắng nóng',
    kFactor: 1.4,
    kDeci: 14n
  }
];

export const STORAGE_MODES = Object.freeze(RAW_STORAGE_MODES.map((mode) => Object.freeze({ ...mode })));

const STORAGE_BY_ID = new Map(STORAGE_MODES.map((mode) => [mode.id, mode]));

export function isValidStorageMode(storageMode) {
  return typeof storageMode === 'string' && STORAGE_BY_ID.has(storageMode);
}

export function getStorageMode(storageMode) {
  if (typeof storageMode === 'string' && STORAGE_BY_ID.has(storageMode)) {
    return STORAGE_BY_ID.get(storageMode);
  }
  return null;
}

function formatVnd(amount) {
  return VND_FORMATTER.format(amount);
}

function buildAdviceText({ zone, daysAfterHarvest, storageInfo, remainingPercent, suggestedPriceVnd, basePriceVnd, overMaxShelfLife }) {
  const remainingRounded = Math.round(remainingPercent * 10) / 10;
  const decayRounded = Math.round((100 - remainingRounded) * 10) / 10;
  const summary = `Đã hái ${daysAfterHarvest} ngày, ${storageInfo.shortLabel.toLowerCase()} → Độ tươi còn ${remainingRounded}% (giảm ${decayRounded}%). Giá đề xuất: ${formatVnd(suggestedPriceVnd)} đ/kg (giá gốc ${formatVnd(basePriceVnd)} đ/kg).`;

  if (zone === 'green') {
    return `${summary} Hàng còn tươi tốt, bán theo giá đề xuất.`;
  }

  if (zone === 'yellow') {
    return `${summary} Đang xuống mã nhanh, nên giảm giá đẩy bán hết ngay hôm nay để thu hồi vốn.`;
  }

  if (overMaxShelfLife) {
    return `${summary} Đã vượt quá số ngày bảo quản tươi an toàn, nguy cơ thối hỏng cao. Nên đẩy sang Sàn Phụ phẩm ngay.`;
  }

  return `${summary} Không còn đạt chuẩn hàng tươi, nguy cơ thối hỏng bỏ đi cao. Nên đẩy sang Sàn Phụ phẩm ngay.`;
}

export function calculateFreshnessPrice(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Dữ liệu đầu vào phải là một đối tượng hợp lệ');
  }

  const { basePriceVnd, dailyDecayRate, storageMode, daysAfterHarvest, maxShelfLifeDays } = input;

  if (typeof basePriceVnd !== 'number' || !Number.isFinite(basePriceVnd) || !(basePriceVnd >= 1 && basePriceVnd <= 100_000_000)) {
    throw new RangeError('Giá gốc phải từ 1 đến 100.000.000 đồng');
  }

  if (typeof dailyDecayRate !== 'number' || !Number.isFinite(dailyDecayRate) || !(dailyDecayRate > 0 && dailyDecayRate <= 0.5)) {
    throw new RangeError('Tỷ lệ hao hụt mỗi ngày phải nằm trong khoảng (0, 0.5]');
  }

  const storageInfo = getStorageMode(storageMode);
  if (!storageInfo) {
    throw new RangeError('Chế độ bảo quản không hợp lệ');
  }

  if (typeof daysAfterHarvest !== 'number' || !Number.isInteger(daysAfterHarvest) || !(daysAfterHarvest >= 0 && daysAfterHarvest <= 3650)) {
    throw new RangeError('Số ngày sau thu hoạch phải là số nguyên từ 0 đến 3650');
  }

  if (typeof maxShelfLifeDays !== 'number' || !Number.isInteger(maxShelfLifeDays) || !(maxShelfLifeDays >= 1 && maxShelfLifeDays <= 365)) {
    throw new RangeError('Số ngày bảo quản tối đa phải là số nguyên từ 1 đến 365');
  }

  const rMicro = BigInt(Math.round(dailyDecayRate * 1_000_000));
  const daysBig = BigInt(daysAfterHarvest);
  const decayScaled = rMicro * storageInfo.kDeci * daysBig;
  const remainingScaled = decayScaled >= SCALE ? 0n : SCALE - decayScaled;

  const basePriceBig = BigInt(Math.round(basePriceVnd));
  const numerator = basePriceBig * remainingScaled;
  const hundreds = (numerator + HALF_ROUND_UNIT) / ROUND_UNIT;
  const suggestedPriceVnd = Number(hundreds * 100n);
  const remainingPercent = Number(remainingScaled) / 100_000;
  const overMaxShelfLife = daysAfterHarvest > maxShelfLifeDays;

  let zone = 'green';
  let zoneLabel = 'Mức Xanh';
  if (overMaxShelfLife || remainingScaled < YELLOW_MIN_SCALED) {
    zone = 'red';
    zoneLabel = 'Mức Đỏ';
  } else if (remainingScaled < GREEN_MIN_SCALED) {
    zone = 'yellow';
    zoneLabel = 'Mức Vàng';
  }

  const adviceText = buildAdviceText({
    zone,
    daysAfterHarvest,
    storageInfo,
    remainingPercent,
    suggestedPriceVnd,
    basePriceVnd: Math.round(basePriceVnd),
    overMaxShelfLife
  });

  return {
    remainingScaled,
    remainingPercent,
    suggestedPriceVnd,
    zone,
    zoneLabel,
    adviceText,
    daysAfterHarvest,
    storageMode,
    kFactor: storageInfo.kFactor,
    overMaxShelfLife
  };
}

export function projectThreeDays(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Dữ liệu đầu vào phải là một đối tượng hợp lệ');
  }

  const baseDays = input.daysAfterHarvest;
  if (typeof baseDays !== 'number' || !Number.isInteger(baseDays) || !(baseDays >= 0 && baseDays <= 3647)) {
    throw new RangeError('Số ngày sau thu hoạch không hợp lệ');
  }

  return [1, 2, 3].map((offset) =>
    calculateFreshnessPrice({
      ...input,
      daysAfterHarvest: baseDays + offset
    })
  );
}
