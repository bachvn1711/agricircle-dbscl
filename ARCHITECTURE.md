# ARCHITECTURE.md — Kiến Trúc Hệ Thống AgriCircle ĐBSCL

## 1. Ngăn Xếp Công Nghệ (Technology Stack)

Hệ sinh thái AgriCircle được thiết kế với triết lý: **Zero Cloud Cost, Zero Build Step, 100% Rural Usability, Isomorphic Reliability**.

| Tầng hệ thống | Công nghệ lựa chọn | Lý do lựa chọn cho đề tài THCS |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js v22+ Native ESM | Hỗ trợ chuẩn module ES6 hiện đại, không cần cấu hình Babel hay Webpack. |
| **Cơ sở dữ liệu** | `node:sqlite` (Native module tích hợp sẵn) | Không cần cài đặt máy chủ MySQL/PostgreSQL phức tạp; lưu trữ 1 file SQLite gọn nhẹ, chế độ WAL (Write-Ahead Logging) cho tốc độ đọc ghi tức thì. |
| **Web Server / Routing** | Native `node:http` (Zero Frameworks) | Không phụ thuộc Express/Fastify; router tự viết bằng Regex với cơ chế phòng thủ chặt chẽ (chống path-traversal, chống null-byte injection, giới hạn payload 32KB). |
| **Frontend Runtime** | Vanilla ES6 JavaScript (No Build Step) | Trình duyệt nạp trực tiếp các file `.js` module thông qua thẻ `<script type="module">`. Học sinh THCS dễ dàng sửa và kiểm tra ngay lập tức bằng phím F5. |
| **Giao diện & Bản đồ** | Vanilla CSS3 + Leaflet v1.9.4 | Tự viết CSS biến (variables), Flexbox/Grid responsive; Leaflet offline-fallback hiển thị tọa độ và bản đồ vệ tinh không tốn phí bản quyền Google Maps. |
| **Offline Engine** | PWA Service Worker (Cache-First + Network-First) | Cài đặt được lên màn hình chính điện thoại như một ứng dụng Android/iOS độc lập; mở công cụ Tính giá ngay cả khi mất sóng Internet. |
| **Thuật toán cốt lõi** | `BigInt` Fixed-point Arithmetic | Nhân tỷ lệ $10.000.000$ đơn vị để tính tiền tệ chính xác tuyệt đối, loại bỏ sai số dấu phẩy động IEEE-754. |

---

## 2. Cấu Trúc Thư Mục Dự Án (Directory Layout)

```
d:\Work\CODE\khkt\
├── .github/
│   └── workflows/ci.yml       # Tự động chạy kiểm thử trên GitHub Actions khi đẩy code
├── docs/                      # Hồ sơ nghiên cứu KHKT và tài liệu hướng dẫn kỹ thuật
│   ├── 01-survey-summary.md   # Số liệu khảo sát thực tế nông dân và vựa thu gom ĐBSCL
│   ├── 02-requirements.md     # Đặc tả chi tiết các yêu cầu chức năng (FR) và phi chức năng (NFR)
│   ├── 03-thcs-technical-guide.md # Sách hướng dẫn kỹ thuật tự học dành cho học sinh THCS
│   └── 04-ke-hoach-nghien-cuu-khkt.md # Kế hoạch nghiên cứu 12 tuần theo mẫu chính thức
├── public/                    # Mã nguồn giao diện Web PWA (Frontend)
│   ├── index.html             # Khung sườn HTML chuẩn ngữ nghĩa (5 tab giao diện)
│   ├── manifest.json          # Cấu hình PWA cài đặt App lên điện thoại di động
│   ├── sw.js                  # Service Worker quản lý bộ nhớ đệm và chạy offline
│   ├── css/
│   │   └── app.css            # Toàn bộ quy tắc giao diện, màu sắc, tương phản cao
│   ├── js/
│   │   ├── app.js             # Bộ điều phối trung tâm, chuyển tab và xử lý offline queue
│   │   ├── state.js           # Quản lý trạng thái ứng dụng và LocalStorage an toàn
│   │   ├── api.js             # Giao tiếp HTTP với máy chủ (fetch wrapper có timeout)
│   │   ├── sw-routes.js       # Phân loại luồng lưu trữ bộ nhớ đệm cho Service Worker
│   │   ├── map-view.js        # Giao diện bản đồ nông thôn và bộ lọc phụ phẩm
│   │   ├── calculator-view.js # Giao diện máy tính định giá độ tươi nông sản
│   │   ├── post-form.js       # Giao diện đăng tin kết hợp nhận diện giọng nói tiếng Việt
│   │   ├── impact-view.js     # Giao diện bảng thành tích giải cứu phụ phẩm & giảm CO2
│   │   └── admin-view.js      # Giao diện quản trị viên xã, duyệt tin và xuất báo cáo CSV
│   └── icons/                 # Bộ biểu tượng ứng dụng và huy hiệu nông sản
├── src/
│   ├── server/                # Mã nguồn máy chủ Node.js (Backend)
│   │   ├── index.js           # Điểm khởi động máy chủ (CLI, đọc cổng PORT từ môi trường)
│   │   ├── app.js             # Xử lý các yêu cầu HTTP API (REST endpoints)
│   │   ├── router.js          # Bộ định tuyến tĩnh và động với bộ lọc an ninh đường dẫn
│   │   ├── db.js              # Khởi tạo bảng SQLite, câu lệnh chuẩn bị (Prepared Statements)
│   │   └── auth.js            # Xác thực mã PIN an toàn, sinh mã nhận tin 4 số bí mật
│   └── shared/                # Mã dùng chung giữa Trình duyệt và Máy chủ (Isomorphic Domain)
│       ├── crops.js           # Bảng dữ liệu 10 loại nông sản nhiệt đới đặc thù
│       ├── pricing.js         # Thuật toán BigInt tính giá theo mức độ tươi và dự báo 3 ngày
│       ├── geo.js             # Công thức Haversine tính khoảng cách tọa độ Trái Đất (km)
│       ├── voice-parser.js    # Bộ bóc tách ngôn ngữ tiếng Việt từ câu nói sang 6 trường dữ liệu
│       └── validation.js      # Kiểm tra tính hợp lệ của mọi dữ liệu đầu vào
├── tests/                     # Hệ thống 54 ca kiểm thử tự động toàn diện
├── scripts/
│   └── verify-docs-and-bundle.mjs # Kịch bản kiểm tra dung lượng < 1.5MB và quy tắc 0 comment
├── PRD.md                     # Tài liệu định nghĩa sản phẩm
├── ARCHITECTURE.md            # Tài liệu kiến trúc hệ thống
├── DESIGN.md                  # Hướng dẫn quy chuẩn giao diện
├── RULES.md                   # Bộ quy tắc lập trình cốt lõi
├── TASKS.md                   # Danh sách các bước triển khai chi tiết
├── PROGRESS.md                # Nhật ký tiến độ và các lỗi đã khắc phục
└── package.json               # Cấu hình dự án Node.js
```

---

## 3. Các Luồng Dữ Liệu Cốt Lõi (Core Data Flows)

```
+-----------------------------------------------------------------------------------+
|                              AGRICIRCLE DATA FLOWS                                |
+-----------------------------------------------------------------------------------+

[Luồng 1: Định giá độ tươi nông sản (Offline & Online)]
Nông dân nhập/nói -> calculator-view.js
      │
      ├──> src/shared/pricing.js (Thuật toán BigInt - Tính tức thì trong 2ms)
      │         │
      │         └──> Hiển thị giá khuyến nghị + Biểu đồ 3 ngày + Lời khuyên
      │
      └──> public/js/state.js (Lưu số lượt tính vào LocalStorage queue)
                │
                └──> Khi có mạng: app.js POST /api/metrics/calculation -> SQLite DB

[Luồng 2: Đăng tin trao đổi phụ phẩm (Voice / Form)]
Nông dân nói vào Micro -> Web Speech API (vi-VN)
      │
      └──> src/shared/voice-parser.js (Bóc tách tự động: Rơm/Bắp, kg, Giá, Địa chỉ)
                │
                └──> Form điền sẵn -> Nông dân bấm "Đăng tin"
                          │
                          ├──> src/shared/validation.js (Kiểm tra hợp lệ tại máy)
                          │
                          └──> POST /api/listings (HTTP Network Request)
                                    │
                                    ├──> src/server/app.js (Rate Limit & Xác thực)
                                    └──> src/server/db.js (Lưu vào SQLite WAL)
                                              │
                                              └──> Trả về mã nhận tin 4 số (shortCode)

[Luồng 3: Tìm kiếm & Thu gom phụ phẩm an toàn (P2P Handshake)]
Người mua mở Bản đồ (map-view.js) -> Xem ghim Leaflet phụ phẩm quanh vị trí
      │
      └──> Nhấn gọi điện / Zalo với Chủ tin thỏa thuận thời gian
                │
                └──> Người mua đến tận nơi bốc hàng
                          │
                          └──> Chủ tin đọc mã 4 số bí mật (shortCode)
                                    │
                                    └──> Người mua nhập xác nhận: POST /api/listings/:id/collect
                                              │
                                              └──> Máy chủ kiểm tra khớp mã:
                                                        - Đổi trạng thái tin: 'collected'
                                                        - Cộng dồn kg & CO2 vào Bảng Tác Động
```
