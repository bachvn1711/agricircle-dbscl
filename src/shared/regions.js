export const DEFAULT_REGION_ID = 'xuan_duong';

const RAW_REGIONS = [
  {
    id: 'xuan_duong',
    name: 'Xã Xuân Đường & lân cận (Đồng Nai)',
    shortName: 'Xuân Đường (Đồng Nai)',
    center: [10.7482, 107.1825],
    defaultZoom: 13,
    defaultUnit: 'cong_nam_bo',
    areaLabel: 'công Nam Bộ 1.000 m²',
    communes: [
      { name: 'Xã Xuân Đường (Phân hiệu 2 THCS Cẩm Đường)', lat: 10.7482, lng: 107.1825 },
      { name: 'Ấp Xuân Đường, Xã Xuân Đường', lat: 10.7460, lng: 107.1860 },
      { name: 'Ấp Cẩm Đường, Xã Xuân Đường', lat: 10.7310, lng: 107.1450 },
      { name: 'Ấp Thừa Đức, Xã Xuân Đường', lat: 10.7680, lng: 107.1710 },
      { name: 'Xã Cẩm Đường (lân cận)', lat: 10.7285, lng: 107.1250 },
      { name: 'Xã Cẩm Mỹ (lân cận)', lat: 10.7850, lng: 107.2350 },
      { name: 'Xã Xuân Phú (lân cận)', lat: 10.8150, lng: 107.3050 }
    ]
  },
  {
    id: 'dbscl',
    name: 'Đồng bằng sông Cửu Long (Mở rộng)',
    shortName: 'ĐBSCL (Mở rộng)',
    center: [10.0452, 105.7469],
    defaultZoom: 11,
    defaultUnit: 'cong_nam_bo',
    areaLabel: 'công Nam Bộ 1.000 m²',
    communes: [
      { name: 'Phường An Khánh, Ninh Kiều, Cần Thơ', lat: 10.0309, lng: 105.7568 },
      { name: 'Xã Mỹ Khánh, Phong Điền, Cần Thơ', lat: 10.0018, lng: 105.7104 },
      { name: 'Xã Trường Long, Phong Điền, Cần Thơ', lat: 9.9885, lng: 105.6472 },
      { name: 'Xã Thạnh An, Vĩnh Thạnh, Cần Thơ', lat: 10.1724, lng: 105.4126 },
      { name: 'Phường Mỹ Thới, Long Xuyên, An Giang', lat: 10.3512, lng: 105.4628 }
    ]
  },
  {
    id: 'mien_trung',
    name: 'Miền Trung (Mở rộng)',
    shortName: 'Miền Trung',
    center: [16.0544, 108.2022],
    defaultZoom: 11,
    defaultUnit: 'sao_trung_bo',
    areaLabel: 'sào Trung Bộ 500 m²',
    communes: [
      { name: 'Xã Hòa Tiến, Hòa Vang, Đà Nẵng', lat: 15.9632, lng: 108.1654 },
      { name: 'Xã Hòa Phong, Hòa Vang, Đà Nẵng', lat: 15.9945, lng: 108.1182 },
      { name: 'Xã Điện Phương, Điện Bàn, Quảng Nam', lat: 15.8871, lng: 108.2512 }
    ]
  },
  {
    id: 'mien_bac',
    name: 'Miền Bắc (Mở rộng)',
    shortName: 'Miền Bắc',
    center: [21.0285, 105.8542],
    defaultZoom: 11,
    defaultUnit: 'sao_bac_bo',
    areaLabel: 'sào Bắc Bộ 360 m²',
    communes: [
      { name: 'Xã Đông Dư, Gia Lâm, Hà Nội', lat: 20.9964, lng: 105.9182 },
      { name: 'Xã Văn Đức, Gia Lâm, Hà Nội', lat: 20.9588, lng: 105.9324 },
      { name: 'Xã Song Phương, Hoài Đức, Hà Nội', lat: 21.0291, lng: 105.6914 }
    ]
  }
];

function freezeRegion(region) {
  return Object.freeze({
    ...region,
    center: Object.freeze([...region.center]),
    communes: Object.freeze(region.communes.map((commune) => Object.freeze({ ...commune })))
  });
}

export const REGIONS = Object.freeze(RAW_REGIONS.map(freezeRegion));

const REGION_BY_ID = new Map(REGIONS.map((region) => [region.id, region]));

export function isValidRegionId(regionId) {
  return typeof regionId === 'string' && REGION_BY_ID.has(regionId);
}

export function getRegionById(regionId) {
  if (typeof regionId === 'string' && REGION_BY_ID.has(regionId)) {
    return REGION_BY_ID.get(regionId);
  }
  return REGIONS[0];
}
