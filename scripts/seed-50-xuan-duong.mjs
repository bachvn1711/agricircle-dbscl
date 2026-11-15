import path from 'node:path';
import { openDatabase, createListing } from '../src/server/db.js';
import { generate50Listings } from '../src/server/seed-xuan-duong.js';
import { validateCreateListing } from '../src/shared/validation.js';

export { generate50Listings };

const dbPath = path.resolve(import.meta.dirname, '../data/agricircle.db');
const currentNow = Date.now();
const db = openDatabase({ dbPath, now: () => currentNow });
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

db.close();
console.log(`Đã gieo thành công ${inserted}/50 tin phụ phẩm quanh Xã Xuân Đường vào cơ sở dữ liệu SQLite cục bộ!`);

const remoteUrl = process.argv[2];
if (remoteUrl && /^https?:\/\//i.test(remoteUrl)) {
  console.log(`Bắt đầu đồng bộ trực tuyến lên máy chủ: ${remoteUrl}`);
  let onlineSuccess = 0;
  for (const item of listings) {
    try {
      const resp = await fetch(`${remoteUrl.replace(/\/+$/, '')}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify(item)
      });
      if (resp.status === 200 || resp.status === 201) {
        onlineSuccess += 1;
      }
    } catch {
    }
  }
  console.log(`Đã đồng bộ trực tuyến thành công ${onlineSuccess}/50 tin lên ${remoteUrl}!`);
}
