import { createListing } from './db.js';
import { validateCreateListing } from '../shared/validation.js';

const farmers = [
  { name: 'Bác Ba Cẩm Đường', phone: '0912345001' },
  { name: 'Chú Năm Rơm', phone: '0912345002' },
  { name: 'Cô Bảy Vườn Mít', phone: '0912345003' },
  { name: 'Anh Tư Bắp', phone: '0912345004' },
  { name: 'Chị Út Suối Sóc', phone: '0912345005' },
  { name: 'Bác Tám Xuân Đường', phone: '0912345006' },
  { name: 'Chú Sáu Ruộng Đan', phone: '0912345007' },
  { name: 'Cô Chín Vườn Bưởi', phone: '0912345008' },
  { name: 'Anh Ba Ba Gác', phone: '0912345009' },
  { name: 'Bác Mười Nông Trường', phone: '0912345010' },
  { name: 'Chú Bảy Thừa Đức', phone: '0912345011' },
  { name: 'Anh Năm Nhân Nghĩa', phone: '0912345012' }
];

const locations = [
  { note: 'Ấp 1, Xã Xuân Đường (Gần chợ Xuân Đường)', lat: 10.7485, lng: 107.1820 },
  { note: 'Ấp 2, Xã Xuân Đường (Đường đan vào ruộng)', lat: 10.7445, lng: 107.1910 },
  { note: 'Ấp 3, Xã Xuân Đường (Cánh đồng sau trường tiểu học)', lat: 10.7550, lng: 107.1845 },
  { note: 'Ấp 4, Xã Xuân Đường (Gần đường tỉnh 765)', lat: 10.7380, lng: 107.1725 },
  { note: 'Ấp Suối Sóc, Xã Xuân Đường (Đường đất đỏ, xe ba gác vào được)', lat: 10.7525, lng: 107.1750 },
  { note: 'Nông trường Cao su Xuân Đường (Đội 2)', lat: 10.7610, lng: 107.1905 },
  { note: 'Khu vực Cầu Suối Cả (Giáp ranh Xuân Đường và Cẩm Đường)', lat: 10.7350, lng: 107.1650 },
  { note: 'Xã Cẩm Đường (Gần Phân hiệu 2 Trường THCS Cẩm Đường)', lat: 10.7285, lng: 107.1250 },
  { note: 'Ngã 3 Suối Nhạn - Xuân Đường', lat: 10.7410, lng: 107.1680 },
  { note: 'Khu đồi bắp giáp Thừa Đức', lat: 10.7680, lng: 107.1720 },
  { note: 'Vùng trồng rau củ Xã Nhân Nghĩa giáp Xuân Đường', lat: 10.7180, lng: 107.1620 },
  { note: 'Cánh đồng lúa trũng Suối Cả', lat: 10.7320, lng: 107.1580 }
];

const itemsConfig = [
  { cat: 'rom-ra', qty: 2, unit: 'cong_nam_bo', offer: 'free', road: 'truck', moist: 'dry', note: '2 công rơm mới gặt, rơm khô vàng rụm, xe tải vào tận bờ ruộng chở làm nấm rơm' },
  { cat: 'rom-ra', qty: 1, unit: 'cong_nam_bo', offer: 'free', road: 'tricycle', moist: 'dry', note: '1 công rơm cuộn sẵn để góc bờ, đường đan xe ba gác vào bốc thoải mái' },
  { cat: 'rom-ra', qty: 5, unit: 'cong_nam_bo', offer: 'free', road: 'truck', moist: 'humid', note: '5 công rơm rạ ruộng nhà mới cắt sáng qua, hơi ẩm, cho không cần dọn nhanh trong 2 ngày' },
  { cat: 'rom-ra', qty: 1, unit: 'tan', offer: 'sell', road: 'truck', moist: 'dry', price: '25.000 đ/cuộn', note: 'Rơm khô cuộn máy 35 cuộn (~1 tấn), rơm sạch đẹp để trại nấm hoặc nuôi bò' },
  { cat: 'rom-ra', qty: 3, unit: 'cong_nam_bo', offer: 'free', road: 'boat', moist: 'wet', note: '3 công rơm bị mưa dầm tối qua, chỉ thích hợp ủ phân vi sinh, bờ mương chỉ đi ghe xuồng' },
  { cat: 'than-bap', qty: 2, unit: 'cong_nam_bo', offer: 'free', road: 'truck', moist: 'dry', note: '2 công thân cây bắp lai vừa bẻ trái xong, cây còn tươi xanh cho bò ăn rất tốt' },
  { cat: 'than-bap', qty: 1, unit: 'tan', offer: 'free', road: 'tricycle', moist: 'humid', note: 'Cùi bắp và thân bắp khô xay sẵn 1 tấn, hộ nào nuôi bò ghé chở miễn phí' },
  { cat: 'vo-trau-vo-qua', qty: 20, unit: 'bao_tai', offer: 'free', road: 'truck', moist: 'dry', note: '20 bao tải trấu sạch mới xay từ nhà máy xay xát, để làm đệm lót chuồng gà' },
  { cat: 'vo-trau-vo-qua', qty: 15, unit: 'bao_tai', offer: 'free', road: 'tricycle', moist: 'humid', note: '15 bao vỏ bưởi da xanh tỉa cành gọt múi, hương thơm đậm, lấy ủ phân compost' },
  { cat: 'ba-mia-ba-san', qty: 1, unit: 'tan', offer: 'sell', road: 'truck', moist: 'humid', price: '300.000 đ/tấn', note: '1 tấn bã mía ép khô ráo, nguồn chất xơ tuyệt vời cho trang trại bò thịt' },
  { cat: 'rau-cu-qua', qty: 10, unit: 'bao_tai', offer: 'free', road: 'truck', moist: 'wet', note: '10 bao mít thái dạt múi và xoài chín rụng gốc, tặng hộ nuôi cá hoặc ủ đạm sinh học' },
  { cat: 'phu-pham-khac', qty: 5, unit: 'bao_tai', offer: 'free', road: 'tricycle', moist: 'dry', note: 'Lá chuối xiêm khô gom gọn góc vườn, lấy về che gốc cây thanh long chống nắng' }
];

export function generate50Listings(seedNow = Date.now()) {
  const listings = [];
  for (let i = 0; i < 50; i += 1) {
    const farmer = farmers[i % farmers.length];
    const loc = locations[i % locations.length];
    const item = itemsConfig[i % itemsConfig.length];

    const latJitter = ((i * 17) % 19 - 9) * 0.0015;
    const lngJitter = ((i * 23) % 19 - 9) * 0.0015;

    listings.push({
      category: item.cat,
      rawQuantity: item.qty,
      rawUnit: item.unit,
      offerType: item.offer,
      priceNote: item.price || '',
      lat: Math.round((loc.lat + latJitter) * 10000) / 10000,
      lng: Math.round((loc.lng + lngJitter) * 10000) / 10000,
      locationNote: `${loc.note} (Mã tin #${i + 1})`,
      contactName: farmer.name,
      contactPhone: farmer.phone,
      accessRoad: item.road,
      moistureState: item.moist,
      expiryDays: 7,
      isProxyPost: i % 4 === 0,
      rawVoiceText: `Tôi là ${farmer.name}, có phụ phẩm nông nghiệp tại ${loc.note}, cần trao đổi.`,
      clientRequestId: `seed-xd-${seedNow}-${i + 1}-${Math.random().toString(36).slice(2, 8)}`
    });
  }
  return listings;
}

export function seedDefaultListingsIfEmpty(db, currentNow = Date.now()) {
  const row = db.prepare('SELECT COUNT(*) AS cnt FROM listings').get();
  if (row && Number(row.cnt) > 0) {
    return 0;
  }
  const listings = generate50Listings(currentNow);
  let inserted = 0;
  for (const item of listings) {
    const validated = validateCreateListing(item);
    if (validated.ok) {
      const res = createListing(db, validated.value, currentNow);
      if (res.ok) {
        inserted += 1;
      }
    }
  }
  return inserted;
}
