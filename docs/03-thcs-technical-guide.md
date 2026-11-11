# TÀI LIỆU KỸ THUẬT & HƯỚNG DẪN BẢO VỆ DỰ ÁN KHKT CẤP THCS

- **Dự án:** Nông sản Tuần hoàn ĐBSCL — Nền tảng kết nối phụ phẩm nông nghiệp và định giá nông sản theo độ tươi
- **Mục đích tài liệu:** Giải thích minh bạch toàn bộ cấu trúc mã nguồn, công thức Toán – Sinh – Tin học, cơ chế bảo mật và cách chạy ngoại tuyến để học sinh THCS làm chủ 100% dự án khi thuyết trình và trả lời Ban giám khảo KHKT.

> **Lưu ý về quy ước `no-comments`:** Toàn bộ mã nguồn trong `src/`, `public/`, `scripts/`, và `tests/` không chứa chú thích nội tuyến (`//`, `/* */`, `<!-- -->`) để tránh chú thích cũ bị sai lệch khi cập nhật code. Mọi phần giải thích chi tiết được tập trung trong tài liệu này và trong 54 ca kiểm thử tự động.

---

## 1. Kiến trúc Tổng thể 3 Tầng (0 VNĐ, Không Hộp Đen)

Hệ thống chạy hoàn toàn bằng **Node.js (>= 26.4)** với các mô-đun có sẵn (`node:http`, `node:sqlite`, `node:crypto`, `node:test`, `URLPattern`), chỉ dùng **1 thư viện bên ngoài duy nhất** là `leaflet@1.9.4` (được đóng gói cục bộ trong `node_modules/leaflet/dist/`, phục vụ 7 tệp tĩnh dưới `/vendor/leaflet/`).

```text
┌───────────────────────────────────────────────────────────────────┐
│ TẦNG 1: LUẬT NGHIỆP VỤ DÙNG CHUNG — src/shared/*.js              │
│ (Thuần JavaScript ESM, KHÔNG dùng fs/crypto/process của Node)     │
│  • regions.js       • crops.js        • units.js                  │
│  • geo.js           • pricing.js      • voice-parser.js           │
│  • validation.js                                                  │
└───────────────▲───────────────────────────────────▲───────────────┘
                │ (import trực tiếp)                │ (phục vụ tại /shared/*)
┌───────────────┴───────────────┐   ┌───────────────┴───────────────┐
│ TẦNG 2: MÁY CHỦ & SQLITE      │   │ TẦNG 3: GIAO DIỆN PWA         │
│ src/server/*.js               │   │ public/*                      │
│  • index.js (khởi động CLI)   │   │  • index.html & styles/app.css│
│  • app.js (API & xử lý HTTP)  │   │  • sw.js & js/sw-routes.js    │
│  • router.js (chuẩn hóa path) │   │  • js/state.js & js/api.js    │
│  • db.js (node:sqlite WAL)    │   │  • js/app.js + 5 màn hình     │
│  • auth.js (PIN, session, HMAC│   │    (map, post, calc,          │
│  • rate-limit.js & csv.js     │   │     impact, admin)            │
└───────────────────────────────┘   └───────────────────────────────┘
```

**Vì sao tách `src/shared/` ra riêng?**

Nhờ không gọi API riêng của Node.js, cả trình duyệt (khi tắt mạng hoàn toàn) lẫn máy chủ (khi kiểm tra dữ liệu đầu vào trước khi ghi SQLite) đều chạy **cùng một bộ công thức và bộ kiểm tra hợp lệ**. Công cụ Tính giá trên điện thoại và Máy chủ không bao giờ cho kết quả lệch nhau.

---

## 2. Giải thích Các Thuật toán & Công thức Cốt lõi

### 2.1. Công thức Định giá theo Độ tươi bằng `BigInt` (`src/shared/pricing.js`)

1. **Vấn đề của số thực thông thường (IEEE-754):**
   Trong JavaScript, phép tính số thực có sai số nhị phân (ví dụ `0.1 + 0.2 = 0.30000000000000004`, hoặc `1 - 0.05 * 12` có thể lệch cực nhỏ quanh `0.40`). Nếu điểm ngưỡng là đúng `40%` hay `75%`, sai số `0.0000000000000001` có thể làm đổi màu cảnh báo sai.
2. **Giải pháp Toán học THCS bằng Số nguyên lớn (`BigInt`):**
   Hàm `calculateFreshnessPrice(input)` quy đổi tỷ lệ `100%` thành **`SCALE = 10_000_000n`**:
   - Đổi tỷ lệ hao hụt chuẩn $r$ sang phần triệu: `rMicro = BigInt(Math.round(dailyDecayRate * 1_000_000))`
   - Hệ số điều kiện bảo quản (`STORAGE_MODES`) dùng số nguyên nhân 10 (`kDeci`):
     - `cold` (Kho lạnh / Thùng xốp đá): `kFactor = 0.5`, `kDeci = 5n`
     - `fan` (Thoáng mát, có quạt): `kFactor = 1`, `kDeci = 10n`
     - `hot` (Ngoài trời nắng nóng / Ẩm ướt): `kFactor = 1.4`, `kDeci = 14n` (giá trị cố định trong MVP từ khoảng khảo sát `1.3–1.5`)
   - Độ suy hao tích lũy sau $d$ ngày (`daysAfterHarvest` từ `0` đến `3650`):
     $$\text{decayScaled} = r_{\text{micro}} \times k_{\text{deci}} \times d$$
   - Độ tươi còn lại (chặn dưới ở `0n`, không bao giờ âm):
     $$\text{remainingScaled} = \max(0n,\; 10\_000\_000n - \text{decayScaled})$$
   - Làm tròn **nửa lên (`half-up`) tới hàng trăm đồng** (`ROUND_UNIT = SCALE * 100n`, `HALF_ROUND_UNIT = ROUND_UNIT / 2n`):
     $$\text{hundreds} = \frac{\text{basePriceBig} \times \text{remainingScaled} + \text{HALF\_ROUND\_UNIT}}{\text{ROUND\_UNIT}}, \quad P_{\text{đề xuất}} = \text{Number}(\text{hundreds} \times 100n)$$
3. **Ngưỡng 3 vùng cảnh báo và Dự báo 3 ngày (`projectThreeDays`):**
   - `Mức Xanh` (`'green'`): `remainingScaled >= 7_500_000n` ($\ge 75\%$) và $d \le \text{maxShelfLifeDays}$.
   - `Mức Vàng` (`'yellow'`): `4_000_000n <= remainingScaled < 7_500_000n` ($40\% \le V < 75\%$) và $d \le \text{maxShelfLifeDays}$.
   - `Mức Đỏ` (`'red'`): `remainingScaled < 4_000_000n` ($< 40\%$) **hoặc** $d > \text{maxShelfLifeDays}$ (vượt số ngày bảo quản tươi an toàn). Khi rơi vào Mức Đỏ, giao diện bật nút `"Đẩy sang Sàn Phụ phẩm ngay"`.
   - `projectThreeDays(input)` tính trước cho $d + 1, d + 2, d + 3$ (nên `calculator-view.js` giới hạn đầu vào `MAX_CALC_DAYS = 3647` để ngày thứ 3 không vượt `3650`).

4. **9 loại nông sản khảo sát mặc định (`DEFAULT_CROPS` trong `src/shared/crops.js`):**
   - *Rau lá:* `Rau muống` (`0.10`/ngày, tối đa `4` ngày, `10.000 đ/kg`), `Cải xanh` (`0.12`/ngày, `4` ngày, `15.000 đ/kg`).
   - *Quả vỏ mỏng:* `Cà chua` (`0.05`/ngày, `12` ngày, `20.000 đ/kg`), `Xoài cát` (`0.04`/ngày, `10` ngày, `35.000 đ/kg`), `Dưa leo` (`0.05`/ngày, `7` ngày, `18.000 đ/kg`).
   - *Quả vỏ dày / Củ:* `Bưởi da xanh` (`0.02`/ngày, `20` ngày, `30.000 đ/kg`), `Sầu riêng` (`0.05`/ngày, `8` ngày, `75.000 đ/kg`), `Khoai lang` (`0.015`/ngày, `30` ngày, `16.000 đ/kg`), `Cam sành` (`0.025`/ngày, `15` ngày, `22.000 đ/kg`).
   - Ngoài 9 loại trên, công cụ hỗ trợ mục `"Nông sản khác"` cho phép bà con tự nhập tỷ lệ hao hụt (`0.1–50%/ngày`) và số ngày giữ tươi tối đa (`1–365`).

### 2.2. Quy đổi Đơn vị Địa phương, Vùng Miền & Công thức Haversine

- **3 vùng địa lý (`src/shared/regions.js`):**
  - Mặc định `DEFAULT_REGION_ID = 'dbscl'`: tâm bản đồ Cần Thơ `[10.0452, 105.7469]`, đơn vị mặc định `cong_nam_bo` (`công Nam Bộ 1.000 m²`), kèm 5 xã/phường ĐBSCL.
  - Hai vùng chuyển đổi nhanh: `mien_trung` (`[16.0544, 108.2022]`, mặc định `sao_trung_bo` `500 m²`) và `mien_bac` (`[21.0285, 105.8542]`, mặc định `sao_bac_bo` `360 m²`).
- **8 đơn vị & Hàm `convertToKg` (`src/shared/units.js`):**
  - Đơn vị khối lượng cố định: `kg` (`1`), `ta` (`100`), `tan` (`1000`), `bao_tai` (`22.5` kg), `xe_ba_gac` (`300` kg).
  - Đơn vị diện tích quy đổi tỷ lệ theo mốc chuẩn `AREA_BASE_KG_PER_360M2 = 200`:
    - `sao_bac_bo` (`360 m²`): $\text{Math.round}(q \times 360 \times 200 / 360) = 200q$ kg
    - `sao_trung_bo` (`500 m²`): $\text{Math.round}(q \times 500 \times 200 / 360) \approx 278$ kg với `1 sào Trung Bộ`
    - `cong_nam_bo` (`1.000 m²`): $\text{Math.round}(q \times 1000 \times 200 / 360) = 1.111$ kg với `2 công Nam Bộ`
- **Tính khoảng cách đường chim bay (`src/shared/geo.js`):**
  - Hàm `haversineKm(lat1, lng1, lat2, lng2)` sử dụng bán kính Trái Đất `EARTH_RADIUS_KM = 6371` và `Math.atan2` kèm chặn miền `[0, 1]` cho `a` để tránh lỗi `NaN` ở điểm đối tâm.
  - Hàm `sortByDistance(items, originLat, originLng)` sắp xếp danh sách phụ phẩm từ gần nhất đến xa nhất.
- **Hệ số giảm phát thải $CO_2$ (`src/shared/units.js` & `src/server/db.js`):**
  - `CO2_KG_PER_KG_DIVERTED = 1.46`: cứ `1 kg` phụ phẩm thu gom thay cho đốt bỏ ngoài đồng giúp giảm ước tính `1,46 kg CO₂` (tham chiếu hệ số phát thải đốt rơm rạ của IPCC/FAO).

### 2.3. Bộ Phân tích Câu nói Tiếng Việt (`parseVoiceInput` trong `src/shared/voice-parser.js`)

Không dùng AI hộp đen; toàn bộ logic phân tích minh bạch theo 5 bước:
1. **Cắt an toàn độ dài:** giữ tối đa `VOICE_TEXT_MAX_CODEPOINTS = 500` ký tự Unicode (`Array.from`), chuẩn hóa dấu phẩy thập phân `(\d),(\d) -> $1.$2` để hiểu cả `"2,5 công"` lẫn `"2.5 công"`.
2. **Tách số lượng & đơn vị (`extractQuantityAndUnit`):** kết hợp từ điển `NUMBER_WORDS` (`nửa = 0.5`, `một..mười`, `chục = 10`, `trăm = 100`, ghép `rưỡi`, `mươi`) với `UNIT_KEYWORDS` ưu tiên cụm dài trước (`"công nam bộ"` trước `"công"`), tự động nhận biết `"sào"` theo `regionId` (`mien_trung` -> `sao_trung_bo`, vùng khác -> `sao_bac_bo`). Dùng ranh giới từ (`BOUNDARY_START`, `BOUNDARY_END`) để tránh khớp nhầm chuỗi con trong từ khác.
3. **Tách nhóm phụ phẩm (`extractCategory`):** dò 6 danh sách từ khóa `CATEGORY_KEYWORDS` (`rom-ra`, `than-bap`, `vo-trau-vo-qua`, `ba-mia-ba-san`, `rau-cu-qua`, `phu-pham-khac`).
4. **Tách hình thức & thời hạn (`extractOfferType`, `extractExpiryDays`):** phân biệt `"cho không"`/`"miễn phí"`/`"dọn giùm"` (`free`) với `"bán"`/`"bán rẻ"`/`"k"`/`"nghìn"` (`sell`); tìm `"N ngày"`, `"N tuần"`, `"hôm nay"`/`"gấp"` (`1` ngày), `"ngày mai"` (`2` ngày), mặc định `3` ngày và giới hạn trong `[1, 14]`.
5. **Tách mốc địa điểm (`extractLocationNote`):** trích cụm theo mốc `"ở gần"`, `"gần"`, `"đầu cầu"`, `"ấp"`, `"xã"`, `"chợ"`..., cắt bỏ các từ khóa điều kiện phía sau và giới hạn tối đa `200` codepoint.

---

## 3. Kiến trúc Máy chủ, Cơ sở dữ liệu & Bảo mật (`src/server/`)

### 3.1. Cơ sở dữ liệu SQLite (`src/server/db.js`)
- Dùng `DatabaseSync` từ mô-đun chuẩn `node:sqlite`, tự tạo thư mục cha bằng `fs.mkdirSync(path.dirname(dbPath), { recursive: true })`.
- Thiết lập: `PRAGMA busy_timeout = 5000`, `PRAGMA journal_mode = WAL` (cho tệp trên đĩa), `PRAGMA synchronous = NORMAL`, `PRAGMA foreign_keys = 1`.
- Mọi thao tác ghi đều chạy qua `runInTransaction(db, fn)` dùng `BEGIN IMMEDIATE` và kiểm tra `db.isTransaction` trước khi `COMMIT` hoặc `ROLLBACK`.
- **5 bảng dữ liệu:**
  1. `listings`: lưu tin đăng phụ phẩm, ràng buộc `CHECK (offer_type IN ('free', 'sell'))` và `CHECK (status IN ('active', 'collected', 'hidden', 'reported'))`, chỉ mục duy nhất `idx_listings_phone_req (contact_phone, client_request_id)` giúp gửi lại không tạo tin trùng.
  2. `listing_reports`: khóa chính `(listing_id, voter_hash)` với `ON DELETE CASCADE` chống báo cáo trùng lặp.
  3. `crop_overrides`: lưu hệ số nông sản do quản trị viên tùy chỉnh mà không ghi đè mã nguồn.
  4. `metric_flushes`: lưu từng lô lượt tính giá (`client_request_id` PK, `delta` từ `1..500`); khi khởi động, máy chủ dọn các bản ghi quá `30 ngày` và cộng dồn vào `server_meta.calc_total_archived` để số đếm không bao giờ mất.
  5. `server_meta`: lưu `cookie_hmac_secret` (32 byte ngẫu nhiên sinh một lần cho cơ sở dữ liệu) và `calc_total_archived`.

### 3.2. Chuẩn hóa Đường dẫn & Các Tuyến API (`src/server/router.js`, `src/server/app.js`)
- **Chuẩn hóa đường dẫn (`normalizeRequestPathname`):** từ chối đường dẫn không bắt đầu bằng `/` (`400`), giải mã URI (`400` nếu sai mã hóa), chặn toàn bộ ký tự điều khiển ASCII `[\u0000-\u001f\u007f]` (`400` với `%09`, `%0a`, `%0d`, `%00`), quy đổi `\` sang `/` (chặn vượt qua `/api/admin%5Clistings`), gộp dấu `/` liên tiếp, chuẩn hóa `path.posix.normalize`, và đối chiếu chữ thường ở cổng bảo vệ `isAdminGuardPath`.
- **Mã định danh chính tắc (`parseCanonicalListingId`):** chỉ chấp nhận `/^[1-9]\d{0,9}$/` (trả `404` ngay đối với `"01"`, `"+1"`, `"1.0"` trước khi ghi bộ giới hạn tần suất hay truy vấn SQL).
- **Danh sách 14 tuyến API (`Cache-Control: no-store`, thân JSON tối đa `32 KB`, `headersTimeout = 10s`, `requestTimeout = 15s`):**
  - Công khai: `GET /api/health`, `GET /api/crops`, `GET /api/listings` (chỉ trả `status = 'active' AND expires_at > now`, ẩn `short_code` & `client_request_id`, tối đa `200` tin), `POST /api/listings` (`<= 5` tin đang mở còn hạn/SĐT), `POST /api/listings/:id/collect`, `POST /api/listings/:id/report`, `POST /api/metrics/calculation`, `GET /api/impact`.
  - Quản trị (khóa `503` nếu `ADMIN_PIN` thiếu hoặc `< 6` ký tự): `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/listings`, `PATCH /api/admin/listings/:id` (`hide` | `restore` | `edit`), `PATCH /api/admin/crops/:id`, `GET /api/admin/export.csv`.

### 3.3. Cơ chế Xác thực, Giới hạn Tần suất & Xuất CSV An toàn
- **Xác nhận thu gom (`verifyShortCode`):** chỉ chấp nhận đúng `4` ký tự ASCII Crockford Base32 (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`), kiểm tra độ dài byte bằng `4` trước khi gọi `crypto.timingSafeEqual` để tránh ngoại lệ khi nhập chuỗi Unicode dài sai độ dài.
- **Chống spam báo cáo (`khkt_voter`):** trên `GET /`, máy chủ cấp cookie `HttpOnly; SameSite=Lax` dạng `<token>.<HMAC-SHA256>`. Khi báo cáo, nếu cookie hợp lệ thì băm theo `voter:<token>`, nếu không hợp lệ thì dùng `ip:<clientIp>` lấy trực tiếp từ `req.socket.remoteAddress`.
- **Phiên quản trị (`src/server/auth.js`):** so sánh SHA-256 của `ADMIN_PIN` bằng `crypto.timingSafeEqual`; `createAdminSessionStore` giữ tối đa **`MAX_ADMIN_SESSIONS = 64`** phiên trong `Map` bộ nhớ (khóa là SHA-256 của token ngẫu nhiên 32 byte), thời hạn **`4 giờ`**, tự xóa phiên hết hạn trước rồi đến phiên cũ nhất khi đầy.
- **Giới hạn tần suất (`src/server/rate-limit.js`):** bộ nhớ `Map` giới hạn **`MAX_RATE_KEYS = 4096`** với chu kỳ dọn `60 giây`:
  - `POST /api/admin/login`: `5` lượt / 15 phút / IP
  - `POST /api/listings`: `60` lượt / 15 phút / IP
  - `POST /api/listings/:id/collect`: `60` lượt / 15 phút / IP + khóa `5` lần nhập sai `shortCode` / 15 phút / `[ip, idNum]` (chỉ ghi lỗi khi sai mã `403`)
  - `POST /api/listings/:id/report`: `60` lượt / 15 phút / IP + `1` lượt / 15 phút / `[ip, idNum]` (chỉ ghi slot sau khi xác nhận tin đang mở hợp lệ)
  - `POST /api/metrics/calculation`: `120` lượt / 15 phút / IP
- **Xuất CSV (`src/server/csv.js`):** `maskPhone` che số thành dạng `091***6789`; `neutralizeFormula` chèn dấu `'` trước ký tự `[=+\-@\t\r]` ở đầu ô **và ngay sau `\r` hoặc `\n`** để chặn tấn công CSV Injection nhiều dòng (ví dụ `"\r=CMD()"`), kèm phần `Tổng hợp tác động` ở cuối tệp.

---

## 4. Kiến trúc PWA Ngoại tuyến & Giao diện (`public/`)

1. **Service Worker (`public/sw.js` & `public/js/sw-routes.js`):**
   - `public/js/app.js` đăng ký `/sw.js` với `{ type: 'module' }`.
   - Khi cài đặt (`install`), tải trước **31 đường dẫn** trong `PRECACHE_URLS` vào cache `'khkt-pwa-v2'` (gồm `/`, `/manifest.webmanifest`, `/styles/app.css`, 9 tệp `/js/*.js`, 7 tệp `/shared/*.js`, 4 tệp `/icons/*`, 7 tệp `/vendor/leaflet/*`, và `/api/crops`).
   - Khi kích hoạt (`activate`), `purgeOldCaches` xóa các bản cache cũ (ví dụ `khkt-pwa-v1`).
   - Phân loại chiến lược (`classifyCacheRoute`):
     - `network-first` (hết giờ `2.5s`, chỉ lưu khi `response.ok`): `/`, `/manifest.webmanifest`, `/styles/*`, `/js/*`, `/shared/*`, `/api/crops`.
     - `cache-first`: `/icons/*`, `/vendor/leaflet/*`.
     - `network-only` (trả `503` kèm header `X-AgriCircle-Offline: 1` khi mất mạng): `/api/listings`, `/api/impact`, `/api/metrics/*`, `/api/admin/*`.
     - `bypass`: mọi phương thức khác `GET` và `/sw.js`.
2. **Trạng thái & Hàng đợi Ngoại tuyến (`public/js/state.js`):**
   - Đọc/ghi `localStorage` qua `readLocalJsonSafe` bọc `try/catch` để không sập ở chế độ ẩn danh.
   - Hàng đợi lượt tính giá `khkt_offline_calc_queue` lưu theo cấu trúc `{ openDelta, sealedBatches }`. Khi có mạng lại, `sealCalcBatches` cắt `openDelta` thành từng lô `<= 500` lượt với mã `batchId` sinh bằng `crypto.getRandomValues` (hoạt động ngay cả trên `http://` mạng LAN không có `crypto.randomUUID`), gửi tuần tự lên `POST /api/metrics/calculation` và chỉ xóa lô qua `ackCalcBatch` sau khi máy chủ xác nhận thành công.
3. **An toàn Giao diện & UX Nông thôn:**
   - Mọi văn bản từ người dùng và API được gán qua `node.textContent` (hàm `createEl`), kể cả nội dung popup Leaflet (`marker.bindPopup(domElement)`), loại bỏ nguy cơ XSS.
   - Các nút gửi form khóa tạm đến khối `finally`, các lượt tải dùng `AbortController` để hủy yêu cầu cũ khi người dùng chuyển bộ lọc nhanh.

---

## 5. Hướng dẫn Kiểm thử & Bộ Câu hỏi Bảo vệ trước Ban Giám Khảo

### 5.1. Lệnh kiểm thử toàn diện
Chạy trong thư mục gốc dự án (Node.js `>= 26.4`):
```bash
npm test
node scripts/verify-docs-and-bundle.mjs
```
- `npm test` chạy đủ **54 kiểm thử** trên 6 tệp:
  - `tests/shared-domain.test.js` (11 kiểm thử) & `tests/shared-domain-extra.test.js` (8 kiểm thử)
  - `tests/server-api.test.js` (8 kiểm thử) & `tests/server-api-extra.test.js` (8 kiểm thử)
  - `tests/pwa-ui.test.js` (7 kiểm thử) & `tests/pwa-ui-extra.test.js` (12 kiểm thử)
- `node scripts/verify-docs-and-bundle.mjs` kiểm tra cấu hình, sự tồn tại của tài liệu, quét từ vựng đảm bảo **0 chú thích mã nguồn**, xác minh 31 mục `PRECACHE_URLS` và tổng dung lượng client `< 1.572.864` byte (`1,5 MB`), in ra `VERIFY_OK`.

### 5.2. Gợi ý trả lời nhanh các câu hỏi thường gặp của Ban Giám Khảo
1. **"Vì sao em không dùng AI/ChatGPT để phân tích câu nói và dự đoán giá?"**
   → AI hộp đen cần chi phí API/Internet liên tục và khó giải thích nguyên nhân khi tính sai. Bộ quy tắc từ khóa tiếng Việt kết hợp công thức suy giảm tuyến tính bằng `BigInt` giúp hoạt động **0 đồng**, chạy **100% offline** ngoài ruộng và học sinh THCS giải thích được từng dòng tính toán.
2. **"Vì sao dùng `BigInt` thay cho `Number` thông thường khi tính phần trăm?"**
   → Vì số thực nhị phân có sai số làm tròn (như `0.1 + 0.2`), có thể làm sai lệch vùng cảnh báo tại đúng mốc `40%` hay `75%`. Nhân hệ số lên `10_000_000n` bằng số nguyên lớn giúp mọi phép so sánh ranh giới và làm tròn hàng trăm đồng chính xác tuyệt đối.
3. **"Nếu nông dân mất mạng ngoài đồng hoặc không biết dùng micro thì sao?"**
   → Service Worker lưu sẵn toàn bộ giao diện, bảng nông sản và công cụ tính giá trên máy nên Công cụ Tính giá vẫn mở và tính bình thường khi tắt mạng; số lượt tra cứu tự lưu vào `localStorage` và gửi bù khi có mạng. Khi không dùng được micro, bà con vẫn sửa câu mẫu trong ô văn bản hoặc chạm chọn nhanh 1 trong 6 ô biểu tượng lớn.
4. **"Làm sao tránh người lạ phá hoại bằng cách bấm 'Đã thu gom xong' hộ tin của người khác?"**
   → Hệ thống cấp cho chủ tin một mã ngắn bí mật `4 ký tự` (`shortCode`) khi đăng bài và **không hiển thị mã này công khai**. Chỉ ai có mã 4 ký tự mới xác nhận thu gom được; nhập sai 5 lần liên tiếp sẽ bị khóa tạm 15 phút.
5. **"Số điện thoại của bà con khi xuất báo cáo CSV nghiên cứu có bị lộ hay bị chèn mã độc Excel không?"**
   → Hàm `maskPhone` tự che giữa số điện thoại thành `091***6789`, các cột bí mật (`short_code`, `client_request_id`) không được đưa vào CSV, và `neutralizeFormula` vô hiệu hóa mọi công thức bảng tính (`=`, `+`, `-`, `@`, `\t`, `\r`) ở cả đầu ô lẫn sau ký tự xuống dòng.
