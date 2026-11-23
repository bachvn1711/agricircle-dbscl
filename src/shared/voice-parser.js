export const VOICE_TEXT_MAX_CODEPOINTS = 500;

const NUMBER_WORDS = new Map([
  ['nửa', 0.5],
  ['một', 1],
  ['mốt', 1],
  ['hai', 2],
  ['ba', 3],
  ['bốn', 4],
  ['tư', 4],
  ['năm', 5],
  ['lăm', 5],
  ['sáu', 6],
  ['bảy', 7],
  ['bẩy', 7],
  ['tám', 8],
  ['chín', 9],
  ['mười', 10],
  ['chục', 10],
  ['trăm', 100]
]);

const BOUNDARY_START = '(?:^|[\\s,;:.!?()\\/\\-])';
const BOUNDARY_END = '(?=$|[\\s,;:.!?()\\/\\-])';

const UNIT_KEYWORDS = [
  { unit: 'cong_nam_bo', phrases: ['công nam bộ', 'công đất', 'công tầm cắt', 'công'] },
  { unit: 'sao_trung_bo', phrases: ['sào trung bộ', 'sào trung'] },
  { unit: 'sao_bac_bo', phrases: ['sào bắc bộ', 'sào bắc', 'sào'] },
  { unit: 'xe_ba_gac', phrases: ['xe ba gác', 'ba gác', 'xe lôi', 'xe'] },
  { unit: 'bao_tai', phrases: ['bao tải', 'bì', 'bao'] },
  { unit: 'tan', phrases: ['tấn'] },
  { unit: 'ta', phrases: ['tạ'] },
  { unit: 'kg', phrases: ['kilogram', 'kilôgam', 'ki lô gam', 'ki-lô-gam', 'kg', 'ký', 'kí'] }
];

const CATEGORY_KEYWORDS = [
  {
    id: 'rom-ra',
    phrases: ['rơm rạ', 'rơm khô', 'rơm tươi', 'gốc rạ', 'rơm', 'rạ']
  },
  {
    id: 'than-bap',
    phrases: [
      'thân bắp',
      'lõi bắp',
      'cùi bắp',
      'cây bắp',
      'lá bắp',
      'vỏ bắp',
      'thân ngô',
      'lõi ngô',
      'cùi ngô',
      'cây ngô',
      'lá ngô',
      'bắp',
      'ngô'
    ]
  },
  {
    id: 'vo-trau-vo-qua',
    phrases: [
      'vỏ trấu',
      'trấu',
      'vỏ cà phê',
      'cà phê',
      'vỏ bưởi',
      'mùn cưa',
      'mạt cưa',
      'vỏ sầu riêng',
      'vỏ dừa',
      'xơ dừa',
      'vỏ đậu',
      'vỏ lạc'
    ]
  },
  {
    id: 'ba-mia-ba-san',
    phrases: ['bã mía', 'bã sắn', 'bã khoai mì', 'xác mì', 'bã đậu', 'bã hèm', 'khoai mì', 'mía']
  },
  {
    id: 'rau-cu-qua',
    phrases: [
      'rau củ quả',
      'rau củ',
      'rau quả',
      'rau dập',
      'rau úa',
      'cải dập',
      'cà chua dập',
      'trái cây dập',
      'trái cây hư',
      'quá lứa',
      'mít thái',
      'mít dạt',
      'chuối chín',
      'xoài rụng',
      'rau muống',
      'cải xanh',
      'dưa leo',
      'khoai lang',
      'cà chua'
    ]
  },
  {
    id: 'phu-pham-khac',
    phrases: ['phụ phẩm khác', 'phân chuồng', 'phân bò', 'lục bình', 'bèo tây', 'cỏ voi', 'lá cây', 'cành cây']
  }
];

const ALL_UNIT_PHRASES = UNIT_KEYWORDS.flatMap((entry) =>
  entry.phrases.map((phrase) => ({ unit: entry.unit, phrase }))
).sort((a, b) => b.phrase.length - a.phrase.length);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholePhrase(text, phrase) {
  const regex = new RegExp(`${BOUNDARY_START}${escapeRegex(phrase)}${BOUNDARY_END}`, 'u');
  return regex.test(text);
}

function parseQuantityPhrase(rawPhrase) {
  const cleaned = rawPhrase.trim().toLowerCase().replace(/,/g, '.');
  if (!cleaned) {
    return null;
  }

  if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const numericHalfMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s+rưỡi$/);
  if (numericHalfMatch) {
    const base = Number.parseFloat(numericHalfMatch[1]);
    return Number.isFinite(base) && base > 0 ? base + 0.5 : null;
  }

  if (cleaned === 'nửa') {
    return 0.5;
  }

  const tokens = cleaned.split(/\s+/);
  if (tokens.length === 2 && tokens[1] === 'rưỡi' && NUMBER_WORDS.has(tokens[0])) {
    const base = NUMBER_WORDS.get(tokens[0]);
    return base >= 1 && base <= 10 ? base + 0.5 : null;
  }

  if (tokens.length === 2 && tokens[1] === 'chục' && NUMBER_WORDS.has(tokens[0])) {
    const mult = NUMBER_WORDS.get(tokens[0]);
    return mult >= 1 && mult <= 9 ? mult * 10 : null;
  }

  if (tokens.length === 2 && tokens[1] === 'trăm' && NUMBER_WORDS.has(tokens[0])) {
    const mult = NUMBER_WORDS.get(tokens[0]);
    return mult >= 1 && mult <= 9 ? mult * 100 : null;
  }

  if (tokens.length === 2 && tokens[0] === 'mười' && NUMBER_WORDS.has(tokens[1])) {
    const ones = NUMBER_WORDS.get(tokens[1]);
    return ones >= 1 && ones < 10 ? 10 + ones : null;
  }

  if (tokens.length === 2 && tokens[1] === 'mươi' && NUMBER_WORDS.has(tokens[0])) {
    const tens = NUMBER_WORDS.get(tokens[0]);
    return tens >= 2 && tens <= 9 ? tens * 10 : null;
  }

  if (tokens.length === 3 && tokens[1] === 'mươi' && NUMBER_WORDS.has(tokens[0]) && NUMBER_WORDS.has(tokens[2])) {
    const tens = NUMBER_WORDS.get(tokens[0]);
    const ones = NUMBER_WORDS.get(tokens[2]);
    return tens >= 2 && tens <= 9 && ones >= 1 && ones < 10 ? tens * 10 + ones : null;
  }

  if (tokens.length === 1 && NUMBER_WORDS.has(tokens[0])) {
    return NUMBER_WORDS.get(tokens[0]);
  }

  return null;
}

const NUMBER_WORD_ALT = Array.from(NUMBER_WORDS.keys())
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|');

const QUANTITY_TOKEN_PATTERN = `(?:\\d+(?:[.,]\\d+)?(?:\\s+rưỡi)?|nửa|(?:${NUMBER_WORD_ALT})(?:\\s+(?:mươi\\s+(?:${NUMBER_WORD_ALT})|mươi|rưỡi|${NUMBER_WORD_ALT}))?)`;

function extractQuantityAndUnit(normalized, regionId) {
  for (const { unit, phrase } of ALL_UNIT_PHRASES) {
    const phrasePattern = escapeRegex(phrase);
    const qtyUnitRegex = new RegExp(
      `${BOUNDARY_START}(${QUANTITY_TOKEN_PATTERN})\\s+${phrasePattern}(?:\\s+(rưỡi))?${BOUNDARY_END}`,
      'gu'
    );
    for (const match of normalized.matchAll(qtyUnitRegex)) {
      const parsedQty = parseQuantityPhrase(match[1]);
      if (parsedQty !== null && parsedQty > 0) {
        const finalQty = match[2] ? parsedQty + 0.5 : parsedQty;
        let resolvedUnit = unit;
        if (phrase === 'sào' && regionId === 'mien_trung') {
          resolvedUnit = 'sao_trung_bo';
        }
        return { rawQuantity: finalQty, rawUnit: resolvedUnit };
      }
    }
  }

  for (const { unit, phrase } of ALL_UNIT_PHRASES) {
    if (phrase === 'bao' || phrase === 'công' || phrase === 'xe') {
      continue;
    }
    if (containsWholePhrase(normalized, phrase)) {
      let resolvedUnit = unit;
      if (phrase === 'sào' && regionId === 'mien_trung') {
        resolvedUnit = 'sao_trung_bo';
      }
      return { rawQuantity: null, rawUnit: resolvedUnit };
    }
  }

  return { rawQuantity: null, rawUnit: null };
}

function extractCategory(normalized) {
  for (const category of CATEGORY_KEYWORDS) {
    for (const phrase of category.phrases) {
      if (containsWholePhrase(normalized, phrase)) {
        return category.id;
      }
    }
  }
  return 'phu-pham-khac';
}

function extractOfferType(normalized) {
  if (
    containsWholePhrase(normalized, 'cho không') ||
    containsWholePhrase(normalized, 'cho miễn phí') ||
    containsWholePhrase(normalized, 'miễn phí') ||
    containsWholePhrase(normalized, 'dọn giùm') ||
    containsWholePhrase(normalized, 'lấy giùm') ||
    containsWholePhrase(normalized, 'tặng') ||
    containsWholePhrase(normalized, 'không lấy tiền')
  ) {
    return 'free';
  }

  if (
    containsWholePhrase(normalized, 'bán gấp') ||
    containsWholePhrase(normalized, 'bán rẻ') ||
    containsWholePhrase(normalized, 'bán lại') ||
    containsWholePhrase(normalized, 'bán') ||
    new RegExp(`${BOUNDARY_START}\\d+(?:\\.\\d+)?\\s*(?:k|nghìn|ngàn|đồng)${BOUNDARY_END}`, 'u').test(normalized)
  ) {
    return 'sell';
  }

  if (containsWholePhrase(normalized, 'cho')) {
    return 'free';
  }

  return 'free';
}

function extractExpiryDays(normalized) {
  const daysRegex = new RegExp(
    `${BOUNDARY_START}(?:(?:trong|hạn|cần\\s+dọn\\s+trong)\\s+)?(${QUANTITY_TOKEN_PATTERN})\\s+ngày${BOUNDARY_END}`,
    'gu'
  );
  for (const daysMatch of normalized.matchAll(daysRegex)) {
    const parsedDays = parseQuantityPhrase(daysMatch[1]);
    if (parsedDays !== null && Number.isFinite(parsedDays)) {
      const clamped = Math.min(14, Math.max(1, Math.round(parsedDays)));
      return clamped;
    }
  }

  const weeksRegex = new RegExp(`${BOUNDARY_START}(${QUANTITY_TOKEN_PATTERN})\\s+tuần${BOUNDARY_END}`, 'gu');
  for (const weeksMatch of normalized.matchAll(weeksRegex)) {
    const parsedWeeks = parseQuantityPhrase(weeksMatch[1]);
    if (parsedWeeks !== null && Number.isFinite(parsedWeeks)) {
      const clamped = Math.min(14, Math.max(1, Math.round(parsedWeeks * 7)));
      return clamped;
    }
  }

  if (
    containsWholePhrase(normalized, 'hôm nay') ||
    containsWholePhrase(normalized, 'trong ngày') ||
    containsWholePhrase(normalized, 'gấp') ||
    containsWholePhrase(normalized, 'lấy ngay') ||
    containsWholePhrase(normalized, 'dọn ngay')
  ) {
    return 1;
  }

  if (containsWholePhrase(normalized, 'ngày mai')) {
    return 2;
  }

  if (containsWholePhrase(normalized, 'tuần này')) {
    return 7;
  }

  return 3;
}

function extractLocationNote(originalText) {
  if (!originalText) {
    return '';
  }

  const markers = [
    'ở gần',
    'gần',
    '(?<!hiện\\s+)tại',
    'bên cạnh',
    'đối diện',
    'đầu cầu',
    'chân cầu',
    'ngã ba',
    'ngã tư',
    'chợ',
    'ấp',
    'xóm',
    'thôn',
    'xã',
    'kênh',
    'đình'
  ];

  const markerAlt = markers.join('|');
  const locationRegex = new RegExp(
    `(?:^|[\\s,;:.!?()\\-])((?:${markerAlt})\\s+[^,.;!?]+)`,
    'iu'
  );
  const match = originalText.match(locationRegex);
  if (!match) {
    return '';
  }

  let candidate = match[1].trim();
  const stopWordsRegex = new RegExp(
    `\\s+(?:cho không|cho miễn phí|miễn phí|dọn giùm|lấy giùm|tặng|bán|cần dọn|trong\\s+\\d+\\s+ngày|hôm nay|gấp)${BOUNDARY_END}`,
    'iu'
  );
  const stopMatch = candidate.match(stopWordsRegex);
  if (stopMatch && stopMatch.index !== undefined) {
    candidate = candidate.slice(0, stopMatch.index).trim();
  }

  const codepoints = Array.from(candidate);
  return codepoints.length > 200 ? codepoints.slice(0, 200).join('') : candidate;
}

export function parseVoiceInput(rawText, options = null) {
  const safeText = typeof rawText === 'string' ? rawText : '';
  const codepoints = Array.from(safeText);
  const truncatedText =
    codepoints.length > VOICE_TEXT_MAX_CODEPOINTS
      ? codepoints.slice(0, VOICE_TEXT_MAX_CODEPOINTS).join('')
      : safeText;

  const normalized = truncatedText
    .trim()
    .toLowerCase()
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return {
      category: 'phu-pham-khac',
      rawQuantity: null,
      rawUnit: null,
      offerType: 'free',
      expiryDays: 3,
      locationNote: '',
      truncatedText
    };
  }

  const regionId = options && typeof options === 'object' ? options.regionId : null;
  const { rawQuantity, rawUnit } = extractQuantityAndUnit(normalized, regionId);
  const category = extractCategory(normalized);
  const offerType = extractOfferType(normalized);
  const expiryDays = extractExpiryDays(normalized);
  const locationNote = extractLocationNote(truncatedText);

  return {
    category,
    rawQuantity,
    rawUnit,
    offerType,
    expiryDays,
    locationNote,
    truncatedText
  };
}
