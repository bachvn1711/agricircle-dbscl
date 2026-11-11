# Nông sản Tuần hoàn ĐBSCL (AgriCircle MVP)

Nền tảng Web PWA 0 đồng kết nối trao đổi phụ phẩm nông nghiệp trên bản đồ số và hỗ trợ nông dân định giá nông sản theo độ tươi (phục vụ thử nghiệm thực địa & thi Khoa học Kỹ thuật cấp THCS).

## Tính năng chính

- **Sàn Phụ phẩm Nông nghiệp trên Bản đồ số:** Mặc định khu vực ĐBSCL (hỗ trợ chuyển sang Miền Trung và Miền Bắc), dùng OpenStreetMap / ảnh vệ tinh qua `leaflet@1.9.4`, 6 nhóm phụ phẩm với ghim phân biệt `Cho miễn phí` / `Bán giá rẻ`, quy đổi 8 đơn vị địa phương (`kg`, `tạ`, `tấn`, `bao tải`, `xe ba gác`, `sào Bắc Bộ`, `sào Trung Bộ`, `công Nam Bộ`), lọc bán kính `3–20 km` và sắp xếp Haversine.
- **Nhập liệu Giọng nói & Chọn nhanh 6 ô:** Hỗ trợ nhận diện giọng nói tiếng Việt (`vi-VN`), bộ phân tích câu nói theo quy tắc (`src/shared/voice-parser.js`) có ô `<textarea>` chỉnh sửa và lưới chọn nhanh 6 nhóm phụ phẩm khi không dùng được micro.
- **Công cụ Tính giá Độ tươi (Chạy Offline 100%):** Tính toán bằng `BigInt` (`SCALE = 10_000_000n`) cho 9 loại nông sản khảo sát mặc định cùng chế độ `"Nông sản khác"`, dự báo 3 ngày tới, đọc kết quả tiếng Việt (TTS), 3 mức cảnh báo (Xanh / Vàng / Đỏ) và nút chuyển 1 chạm sang Sàn Phụ phẩm ở Mức Đỏ.
- **Thống kê Tác động & Quản trị:** Quy đổi khối lượng cứu được sang lượng $CO_2$ tránh phát thải (`1,46 kg CO₂/kg`), đồng bộ lượt tính giá ngoại tuyến qua `localStorage`, trang Quản trị bảo vệ bằng `ADMIN_PIN` (`>= 6` ký tự) và xuất CSV đã che số điện thoại kèm chống CSV Injection.

## Yêu cầu hệ thống

- **Node.js `>= 26.4`** (sử dụng `node:sqlite`, `node:test`, `globalThis.URLPattern`).
- Không cần cài đặt cơ sở dữ liệu ngoài hay dịch vụ đám mây trả phí.

## Cài đặt và Khởi chạy từ bản clone sạch

1. Cài đặt phụ thuộc (`leaflet@1.9.4`):

```bash
npm ci
```

2. Cấu hình biến môi trường (tham khảo `.env.example`):

- `PORT`: cổng lắng nghe (mặc định `3000`; hỗ trợ `0` để hệ điều hành cấp cổng trống).
- `HOST`: địa chỉ bind (mặc định `0.0.0.0` để chia sẻ trong mạng LAN).
- `DB_PATH`: đường dẫn tệp SQLite (mặc định `data/agricircle.db`; tự tạo thư mục cha nếu chưa tồn tại).
- `ADMIN_PIN`: mã PIN quản trị dài từ `6` đến `128` ký tự (không chứa ký tự điều khiển). Nếu bỏ trống hoặc ngắn hơn `6` ký tự, toàn bộ tuyến `/api/admin*` tự động từ chối với mã `503` (fail-closed).

3. Khởi chạy máy chủ:

- **Linux / macOS (bash):**

```bash
ADMIN_PIN=123456 PORT=3000 DB_PATH=data/agricircle.db node src/server/index.js
```

- **Windows (PowerShell):**

```powershell
$env:ADMIN_PIN="123456"; $env:PORT="3000"; $env:DB_PATH="data/agricircle.db"; node src/server/index.js
```

Mở trình duyệt tại `http://localhost:3000` (hoặc địa chỉ IP mạng nội bộ của máy chủ trên cổng tương ứng).

> **Lưu ý khi dùng qua HTTP mạng nội bộ (LAN):** Trình duyệt di động thường chặn Web Speech API hoặc GPS khi không có HTTPS (`isSecureContext === false`). Ứng dụng hiển thị hướng dẫn dùng lưới 6 ô chọn nhanh, ô nhập tay `<textarea>`, chọn xã/phường và kéo ghim bản đồ; sinh mã yêu cầu vẫn hoạt động bình thường nhờ `crypto.getRandomValues`.

## Kiểm thử & Xác minh

Chạy toàn bộ **54 kiểm thử** (`node:test`, 6 tệp kiểm thử):

```bash
npm test
```

Hoặc chạy từng bộ kiểm thử riêng lẻ (tương tự quy trình CI tại `.github/workflows/ci.yml`):

```bash
node --test tests/shared-domain.test.js
node --test tests/shared-domain-extra.test.js
node --test tests/server-api.test.js
node --test tests/server-api-extra.test.js
node --test tests/pwa-ui.test.js
node --test tests/pwa-ui-extra.test.js
```

Xác minh cấu hình, tài liệu, quy ước `0` chú thích mã nguồn (`no-comments`), danh sách `PRECACHE_URLS` và giới hạn dung lượng gói client (`< 1.572.864` byte / `1,5 MB`):

```bash
node scripts/verify-docs-and-bundle.mjs
```

Lệnh thành công sẽ in thông số dung lượng và dòng `VERIFY_OK` (có thể chạy từ bất kỳ thư mục làm việc nào).

## Cấu trúc Thư mục

- `src/shared/`: mô-đun ESM thuần không phụ thuộc Node (`regions.js`, `crops.js`, `units.js`, `geo.js`, `pricing.js`, `voice-parser.js`, `validation.js`).
- `src/server/`: máy chủ HTTP + SQLite (`index.js`, `app.js`, `router.js`, `db.js`, `auth.js`, `rate-limit.js`, `csv.js`).
- `public/`: giao diện PWA (`index.html`, `manifest.webmanifest`, `sw.js`, `styles/app.css`, `icons/*`, `js/*`).
- `scripts/verify-docs-and-bundle.mjs`: bộ kiểm tra tài liệu, `no-comments`, precache và dung lượng gói tải ban đầu.
- `tests/`: 6 bộ kiểm thử tự động cho tầng shared, máy chủ API và PWA client.
- `docs/`:
  - [`docs/01-goals.md`](./docs/01-goals.md): Mục tiêu dự án và chỉ số OKRs.
  - [`docs/02-requirements.md`](./docs/02-requirements.md): Đặc tả yêu cầu phần mềm và ma trận kiểm chứng `R1`–`R14`.
  - [`docs/03-thcs-technical-guide.md`](./docs/03-thcs-technical-guide.md): Tài liệu kỹ thuật và hướng dẫn bảo vệ dự án dành cho học sinh THCS.
- `.github/workflows/ci.yml`: Quy trình CI tự động trên Node 26 (ghim SHA cho toàn bộ GitHub Actions).
