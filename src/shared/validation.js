import { isValidByproductCategory } from './crops.js';
import { convertToKg, isValidUnit } from './units.js';
import { isValidCoordinates } from './geo.js';
import { isValidStorageMode } from './pricing.js';

export const CROCKFORD_BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const MAX_ACTIVE_LISTINGS_PER_PHONE = 5;
export const MAX_CALC_FLUSH_DELTA = 500;
export const MAX_KG_LIMIT = 100_000;
export const ACCESS_ROADS = ['truck', 'tricycle', 'boat'];
export const DEFAULT_ACCESS_ROAD = 'truck';
export const MOISTURE_STATES = ['dry', 'humid', 'wet'];
export const DEFAULT_MOISTURE_STATE = 'dry';

export function isValidAccessRoad(value) {
  return typeof value === 'string' && ACCESS_ROADS.includes(value);
}

export function isValidMoistureState(value) {
  return typeof value === 'string' && MOISTURE_STATES.includes(value);
}

const VN_PHONE_REGEX = /^0\d{9}$/;
const SHORT_CODE_REGEX = /^[0-9A-HJKMNP-TV-Z]{4}$/;
const CLIENT_REQUEST_ID_REGEX = /^[A-Za-z0-9_-]{16,64}$/;
const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/;
const ALLOWED_ADMIN_PATCH_FIELDS = new Set([
  'category',
  'rawQuantity',
  'rawUnit',
  'offerType',
  'priceNote',
  'locationNote',
  'expiryDays',
  'accessRoad',
  'moistureState'
]);
const ALLOWED_CROP_UPDATE_FIELDS = new Set([
  'dailyDecayRate',
  'maxShelfLifeDays',
  'referencePriceVnd'
]);

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function codepointLength(value) {
  return Array.from(value).length;
}

function fail(error) {
  return { ok: false, error };
}

function succeed(value) {
  return { ok: true, value };
}

function validateNoteField(raw, maxCodepoints, label) {
  if (typeof raw !== 'string') {
    return fail(`${label} phải là chuỗi ký tự`);
  }
  const normalized = raw.replace(/^ +| +$/g, '');
  if (codepointLength(normalized) > maxCodepoints) {
    return fail(`${label} không được vượt quá ${maxCodepoints} ký tự`);
  }
  return succeed(normalized);
}

function isValidRawQuantity(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 10_000;
}

function isValidExpiryDays(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 14;
}

export function isValidAdminPin(pin) {
  if (typeof pin !== 'string') {
    return false;
  }
  if (CONTROL_CHAR_REGEX.test(pin)) {
    return false;
  }
  return pin.trim().length >= 6 && pin.length <= 128;
}

export function validateCreateListing(input) {
  if (!isPlainObject(input)) {
    return fail('Dữ liệu tin đăng phải là một đối tượng hợp lệ');
  }

  if (typeof input.category !== 'string' || !isValidByproductCategory(input.category)) {
    return fail('Nhóm phụ phẩm không hợp lệ');
  }

  if (typeof input.rawUnit !== 'string' || !isValidUnit(input.rawUnit)) {
    return fail('Đơn vị đo không hợp lệ');
  }

  if (!isValidRawQuantity(input.rawQuantity)) {
    return fail('Số lượng phải là số dương hợp lệ tối đa 10.000');
  }

  const estimatedKg = convertToKg({
    category: input.category,
    rawQuantity: input.rawQuantity,
    rawUnit: input.rawUnit
  });
  if (!Number.isFinite(estimatedKg) || !(estimatedKg > 0 && estimatedKg <= MAX_KG_LIMIT)) {
    return fail('Khối lượng quy đổi phải lớn hơn 0 và không vượt quá 100.000 kg');
  }

  if (input.offerType !== 'free' && input.offerType !== 'sell') {
    return fail('Hình thức đăng chỉ chấp nhận cho miễn phí hoặc bán');
  }

  let priceNote = '';
  if (input.priceNote !== undefined && input.priceNote !== null) {
    const priceRes = validateNoteField(input.priceNote, 160, 'Ghi chú giá');
    if (!priceRes.ok) {
      return priceRes;
    }
    priceNote = priceRes.value;
  }

  if (!isValidCoordinates(input.lat, input.lng)) {
    return fail('Tọa độ bản đồ không hợp lệ');
  }

  let locationNote = '';
  if (input.locationNote !== undefined && input.locationNote !== null) {
    const locRes = validateNoteField(input.locationNote, 200, 'Ghi chú vị trí');
    if (!locRes.ok) {
      return locRes;
    }
    locationNote = locRes.value;
  }

  if (typeof input.contactName !== 'string') {
    return fail('Tên người liên hệ là bắt buộc');
  }
  const contactName = input.contactName.trim();
  if (!(contactName.length >= 1 && codepointLength(contactName) <= 80)) {
    return fail('Tên người liên hệ phải từ 1 đến 80 ký tự');
  }

  if (typeof input.contactPhone !== 'string') {
    return fail('Số điện thoại liên hệ là bắt buộc');
  }
  const contactPhone = input.contactPhone.trim();
  if (!VN_PHONE_REGEX.test(contactPhone)) {
    return fail('Số điện thoại Việt Nam phải gồm đúng 10 chữ số và bắt đầu bằng 0');
  }

  let isProxyPost = false;
  if (input.isProxyPost !== undefined) {
    if (typeof input.isProxyPost !== 'boolean') {
      return fail('Trạng thái đăng hộ phải là giá trị đúng hoặc sai');
    }
    isProxyPost = input.isProxyPost;
  }

  let accessRoad = DEFAULT_ACCESS_ROAD;
  if (input.accessRoad !== undefined && input.accessRoad !== null) {
    if (!isValidAccessRoad(input.accessRoad)) {
      return fail('Phương tiện tiếp cận không hợp lệ (xe tải, xe ba gác, ghe xuồng)');
    }
    accessRoad = input.accessRoad;
  }

  let moistureState = DEFAULT_MOISTURE_STATE;
  if (input.moistureState !== undefined && input.moistureState !== null) {
    if (!isValidMoistureState(input.moistureState)) {
      return fail('Trạng thái độ ẩm không hợp lệ (khô ráo, hơi ẩm, ướt dầm mưa)');
    }
    moistureState = input.moistureState;
  }

  let expiryDays = 3;
  if (input.expiryDays !== undefined) {
    if (!isValidExpiryDays(input.expiryDays)) {
      return fail('Số ngày hết hạn phải là số nguyên từ 1 đến 14');
    }
    expiryDays = input.expiryDays;
  }

  let rawVoiceText = '';
  if (input.rawVoiceText !== undefined && input.rawVoiceText !== null) {
    if (typeof input.rawVoiceText !== 'string') {
      return fail('Văn bản giọng nói phải là chuỗi ký tự');
    }
    if (codepointLength(input.rawVoiceText) > 500) {
      return fail('Văn bản giọng nói không được vượt quá 500 ký tự');
    }
    rawVoiceText = input.rawVoiceText.trim();
  }

  let clientRequestId = null;
  if (input.clientRequestId !== undefined && input.clientRequestId !== null) {
    if (typeof input.clientRequestId !== 'string' || !CLIENT_REQUEST_ID_REGEX.test(input.clientRequestId)) {
      return fail('Mã yêu cầu khách hàng không hợp lệ');
    }
    clientRequestId = input.clientRequestId;
  }

  return succeed({
    category: input.category,
    rawQuantity: input.rawQuantity,
    rawUnit: input.rawUnit,
    estimatedKg,
    offerType: input.offerType,
    priceNote,
    lat: input.lat,
    lng: input.lng,
    locationNote,
    contactName,
    contactPhone,
    isProxyPost,
    accessRoad,
    moistureState,
    expiryDays,
    rawVoiceText,
    clientRequestId
  });
}

export function validateCollectBody(input) {
  if (!isPlainObject(input)) {
    return fail('Dữ liệu xác nhận thu gom không hợp lệ');
  }

  if (typeof input.shortCode !== 'string') {
    return fail('Mã xác nhận 4 ký tự là bắt buộc');
  }

  const normalizedShortCode = input.shortCode.trim().toUpperCase();
  if (!SHORT_CODE_REGEX.test(normalizedShortCode)) {
    return fail('Mã xác nhận phải gồm đúng 4 ký tự chữ số hợp lệ');
  }

  let actualKgCollected = null;
  if (input.actualKgCollected !== undefined) {
    if (
      typeof input.actualKgCollected !== 'number' ||
      !Number.isFinite(input.actualKgCollected) ||
      !(input.actualKgCollected > 0 && input.actualKgCollected <= MAX_KG_LIMIT)
    ) {
      return fail('Khối lượng thu gom thực tế phải lớn hơn 0 và không vượt quá 100.000 kg');
    }
    actualKgCollected = input.actualKgCollected;
  }

  return succeed({
    shortCode: normalizedShortCode,
    actualKgCollected
  });
}

export function validateAdminPatchListing(input) {
  if (!isPlainObject(input)) {
    return fail('Dữ liệu chỉnh sửa tin đăng không hợp lệ');
  }

  const keys = Object.keys(input);
  if (keys.length === 0) {
    return fail('Cần ít nhất một trường hợp lệ để cập nhật');
  }

  for (const key of keys) {
    if (!ALLOWED_ADMIN_PATCH_FIELDS.has(key)) {
      return fail(`Trường "${key}" không được phép chỉnh sửa`);
    }
    if (input[key] === undefined) {
      return fail(`Giá trị trường "${key}" không hợp lệ`);
    }
  }

  const value = {};

  if (Object.hasOwn(input, 'category')) {
    if (typeof input.category !== 'string' || !isValidByproductCategory(input.category)) {
      return fail('Nhóm phụ phẩm không hợp lệ');
    }
    value.category = input.category;
  }

  if (Object.hasOwn(input, 'rawQuantity')) {
    if (!isValidRawQuantity(input.rawQuantity)) {
      return fail('Số lượng phải lớn hơn 0 và không vượt quá 10.000');
    }
    value.rawQuantity = input.rawQuantity;
  }

  if (Object.hasOwn(input, 'rawUnit')) {
    if (typeof input.rawUnit !== 'string' || !isValidUnit(input.rawUnit)) {
      return fail('Đơn vị đo không hợp lệ');
    }
    value.rawUnit = input.rawUnit;
  }

  if (Object.hasOwn(value, 'rawQuantity') && Object.hasOwn(value, 'rawUnit')) {
    const kg = convertToKg({
      category: value.category ?? 'rom-ra',
      rawQuantity: value.rawQuantity,
      rawUnit: value.rawUnit
    });
    if (!Number.isFinite(kg) || !(kg > 0 && kg <= MAX_KG_LIMIT)) {
      return fail('Khối lượng quy đổi vượt giới hạn 100.000 kg');
    }
  }

  if (Object.hasOwn(input, 'offerType')) {
    if (input.offerType !== 'free' && input.offerType !== 'sell') {
      return fail('Hình thức đăng không hợp lệ');
    }
    value.offerType = input.offerType;
  }

  if (Object.hasOwn(input, 'priceNote')) {
    const priceRes = validateNoteField(input.priceNote, 160, 'Ghi chú giá');
    if (!priceRes.ok) {
      return priceRes;
    }
    value.priceNote = priceRes.value;
  }

  if (Object.hasOwn(input, 'locationNote')) {
    const locRes = validateNoteField(input.locationNote, 200, 'Ghi chú vị trí');
    if (!locRes.ok) {
      return locRes;
    }
    value.locationNote = locRes.value;
  }

  if (Object.hasOwn(input, 'expiryDays')) {
    if (!isValidExpiryDays(input.expiryDays)) {
      return fail('Số ngày hết hạn phải là số nguyên từ 1 đến 14');
    }
    value.expiryDays = input.expiryDays;
  }

  if (Object.hasOwn(input, 'accessRoad')) {
    if (!isValidAccessRoad(input.accessRoad)) {
      return fail('Phương tiện tiếp cận không hợp lệ (xe tải, xe ba gác, ghe xuồng)');
    }
    value.accessRoad = input.accessRoad;
  }

  if (Object.hasOwn(input, 'moistureState')) {
    if (!isValidMoistureState(input.moistureState)) {
      return fail('Trạng thái độ ẩm không hợp lệ (khô ráo, hơi ẩm, ướt dầm mưa)');
    }
    value.moistureState = input.moistureState;
  }

  return succeed(value);
}

export function validateCropUpdate(input) {
  if (!isPlainObject(input)) {
    return fail('Dữ liệu cập nhật nông sản không hợp lệ');
  }

  const keys = Object.keys(input);
  if (keys.length === 0) {
    return fail('Cần ít nhất một trường để cập nhật nông sản');
  }

  for (const key of keys) {
    if (!ALLOWED_CROP_UPDATE_FIELDS.has(key)) {
      return fail(`Trường "${key}" không được phép cập nhật`);
    }
    if (input[key] === undefined) {
      return fail(`Giá trị trường "${key}" không hợp lệ`);
    }
  }

  const value = {};

  if (Object.hasOwn(input, 'dailyDecayRate')) {
    if (
      typeof input.dailyDecayRate !== 'number' ||
      !Number.isFinite(input.dailyDecayRate) ||
      !(input.dailyDecayRate >= 0.001 && input.dailyDecayRate <= 0.5)
    ) {
      return fail('Tỷ lệ hao hụt mỗi ngày phải từ 0.001 đến 0.50');
    }
    value.dailyDecayRate = input.dailyDecayRate;
  }

  if (Object.hasOwn(input, 'maxShelfLifeDays')) {
    if (
      typeof input.maxShelfLifeDays !== 'number' ||
      !Number.isInteger(input.maxShelfLifeDays) ||
      !(input.maxShelfLifeDays >= 1 && input.maxShelfLifeDays <= 365)
    ) {
      return fail('Số ngày bảo quản tối đa phải là số nguyên từ 1 đến 365');
    }
    value.maxShelfLifeDays = input.maxShelfLifeDays;
  }

  if (Object.hasOwn(input, 'referencePriceVnd')) {
    if (
      typeof input.referencePriceVnd !== 'number' ||
      !Number.isInteger(input.referencePriceVnd) ||
      !(input.referencePriceVnd >= 100 && input.referencePriceVnd <= 10_000_000)
    ) {
      return fail('Giá tham khảo phải là số nguyên từ 100 đến 10.000.000 đồng');
    }
    value.referencePriceVnd = input.referencePriceVnd;
  }

  return succeed(value);
}

export function validateCalcInput(input) {
  if (!isPlainObject(input)) {
    return fail('Dữ liệu tính giá không hợp lệ');
  }

  if (
    typeof input.basePriceVnd !== 'number' ||
    !Number.isFinite(input.basePriceVnd) ||
    !(input.basePriceVnd >= 1 && input.basePriceVnd <= 100_000_000)
  ) {
    return fail('Giá gốc loại 1 phải từ 1 đến 100.000.000 đồng');
  }

  if (
    typeof input.dailyDecayRate !== 'number' ||
    !Number.isFinite(input.dailyDecayRate) ||
    !(input.dailyDecayRate >= 0.001 && input.dailyDecayRate <= 0.5)
  ) {
    return fail('Tỷ lệ hao hụt mỗi ngày phải từ 0.001 đến 0.50');
  }

  if (!isValidStorageMode(input.storageMode)) {
    return fail('Điều kiện bảo quản không hợp lệ');
  }

  if (
    typeof input.daysAfterHarvest !== 'number' ||
    !Number.isInteger(input.daysAfterHarvest) ||
    !(input.daysAfterHarvest >= 0 && input.daysAfterHarvest <= 3650)
  ) {
    return fail('Số ngày sau thu hoạch phải là số nguyên từ 0 trở lên');
  }

  if (
    typeof input.maxShelfLifeDays !== 'number' ||
    !Number.isInteger(input.maxShelfLifeDays) ||
    !(input.maxShelfLifeDays >= 1 && input.maxShelfLifeDays <= 365)
  ) {
    return fail('Số ngày bảo quản tối đa phải là số nguyên từ 1 đến 365');
  }

  return succeed({
    basePriceVnd: Math.round(input.basePriceVnd),
    dailyDecayRate: input.dailyDecayRate,
    storageMode: input.storageMode,
    daysAfterHarvest: input.daysAfterHarvest,
    maxShelfLifeDays: input.maxShelfLifeDays
  });
}

export function validateCalcFlush(input) {
  if (!isPlainObject(input)) {
    return fail('Dữ liệu đồng bộ lượt tính giá không hợp lệ');
  }

  if (
    typeof input.delta !== 'number' ||
    !Number.isSafeInteger(input.delta) ||
    !(input.delta >= 1 && input.delta <= MAX_CALC_FLUSH_DELTA)
  ) {
    return fail('Số lượt tính giá đồng bộ phải là số nguyên từ 1 đến 500');
  }

  if (typeof input.clientRequestId !== 'string' || !CLIENT_REQUEST_ID_REGEX.test(input.clientRequestId)) {
    return fail('Mã yêu cầu đồng bộ không hợp lệ');
  }

  return succeed({
    delta: input.delta,
    clientRequestId: input.clientRequestId
  });
}
