const RAW_CROPS = [
  {
    id: 'ca-chua',
    name: 'Cà chua',
    category: 'Quả vỏ mỏng',
    icon: '🍅',
    dailyDecayRate: 0.05,
    maxShelfLifeDays: 12,
    referencePriceVnd: 20000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát 24 hộ trồng rau màu tại ĐBSCL và tài liệu bảo quản sau thu hoạch rau quả nhiệt đới'
  },
  {
    id: 'rau-muong',
    name: 'Rau muống',
    category: 'Rau lá',
    icon: '🥬',
    dailyDecayRate: 0.1,
    maxShelfLifeDays: 4,
    referencePriceVnd: 10000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát hộ trồng rau ăn lá vùng ven Cần Thơ và tài liệu bảo quản rau xanh tươi'
  },
  {
    id: 'xoai-cat',
    name: 'Xoài cát',
    category: 'Quả vỏ mỏng',
    icon: '🥭',
    dailyDecayRate: 0.04,
    maxShelfLifeDays: 10,
    referencePriceVnd: 35000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát nhà vườn xoài cát Hòa Lộc tại ĐBSCL và khuyến cáo kỹ thuật sau thu hoạch'
  },
  {
    id: 'buoi-da-xanh',
    name: 'Bưởi da xanh',
    category: 'Quả vỏ dày / Củ',
    icon: '🍈',
    dailyDecayRate: 0.02,
    maxShelfLifeDays: 20,
    referencePriceVnd: 30000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát nhà vườn cây có múi tại Bến Tre, Cần Thơ và tiêu chuẩn bảo quản quả vỏ dày'
  },
  {
    id: 'sau-rieng',
    name: 'Sầu riêng',
    category: 'Quả vỏ dày / Củ',
    icon: '🥥',
    dailyDecayRate: 0.05,
    maxShelfLifeDays: 8,
    referencePriceVnd: 75000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát thương lái và nhà vườn Phong Điền về tốc độ chín rụng của sầu riêng thu hoạch'
  },
  {
    id: 'cai-xanh',
    name: 'Cải xanh',
    category: 'Rau lá',
    icon: '🥦',
    dailyDecayRate: 0.12,
    maxShelfLifeDays: 4,
    referencePriceVnd: 15000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát tiểu thương chợ nông sản và hộ trồng rau ăn lá ngắn ngày'
  },
  {
    id: 'dua-leo',
    name: 'Dưa leo',
    category: 'Quả vỏ mỏng',
    icon: '🥒',
    dailyDecayRate: 0.05,
    maxShelfLifeDays: 7,
    referencePriceVnd: 18000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát hộ trồng màu tại ĐBSCL về hao hụt độ giòn và độ ẩm dưa leo theo ngày'
  },
  {
    id: 'khoai-lang',
    name: 'Khoai lang',
    category: 'Quả vỏ dày / Củ',
    icon: '🍠',
    dailyDecayRate: 0.015,
    maxShelfLifeDays: 30,
    referencePriceVnd: 16000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát nông hộ trồng khoai lang tím Vĩnh Long và tài liệu bảo quản củ nơi khô ráo'
  },
  {
    id: 'cam-sanh',
    name: 'Cam sành',
    category: 'Quả vỏ dày / Củ',
    icon: '🍊',
    dailyDecayRate: 0.025,
    maxShelfLifeDays: 15,
    referencePriceVnd: 22000,
    byproductCategory: 'rau-cu-qua',
    sourceNote: 'Khảo sát vườn cam sành Trà Ôn, Vĩnh Long và hướng dẫn phân loại cam sau thu hoạch'
  }
];

const RAW_BYPRODUCT_CATEGORIES = [
  {
    id: 'rom-ra',
    name: 'Rơm rạ',
    color: '#B45309',
    icon: '🌾'
  },
  {
    id: 'than-bap',
    name: 'Thân / Lõi bắp',
    color: '#15803D',
    icon: '🌽'
  },
  {
    id: 'vo-trau-vo-qua',
    name: 'Vỏ trấu / Vỏ bưởi / Mùn cưa',
    color: '#0F766E',
    icon: '🥥'
  },
  {
    id: 'ba-mia-ba-san',
    name: 'Bã mía / Bã sắn',
    color: '#1D4ED8',
    icon: '🎋'
  },
  {
    id: 'rau-cu-qua',
    name: 'Rau củ quả dập / Quá lứa',
    color: '#DC2626',
    icon: '🥬'
  },
  {
    id: 'phu-pham-khac',
    name: 'Phụ phẩm khác',
    color: '#4B5563',
    icon: '♻️'
  }
];

export const DEFAULT_CROPS = Object.freeze(RAW_CROPS.map((crop) => Object.freeze({ ...crop })));

export const BYPRODUCT_CATEGORIES = Object.freeze(
  RAW_BYPRODUCT_CATEGORIES.map((category) => Object.freeze({ ...category }))
);

const CROP_BY_ID = new Map(DEFAULT_CROPS.map((crop) => [crop.id, crop]));
const BYPRODUCT_CATEGORY_BY_ID = new Map(BYPRODUCT_CATEGORIES.map((category) => [category.id, category]));

export function isValidCropId(cropId) {
  return typeof cropId === 'string' && CROP_BY_ID.has(cropId);
}

export function getCropById(cropId) {
  if (typeof cropId === 'string' && CROP_BY_ID.has(cropId)) {
    return CROP_BY_ID.get(cropId);
  }
  return null;
}

export function isValidByproductCategory(categoryId) {
  return typeof categoryId === 'string' && BYPRODUCT_CATEGORY_BY_ID.has(categoryId);
}

export function getByproductCategoryById(categoryId) {
  if (typeof categoryId === 'string' && BYPRODUCT_CATEGORY_BY_ID.has(categoryId)) {
    return BYPRODUCT_CATEGORY_BY_ID.get(categoryId);
  }
  return null;
}
