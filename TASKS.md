# TASKS.md — Danh Mục Nhiệm Vụ & Các Bước Triển Khai

Bản kế hoạch hành động chia nhỏ theo từng bước (Atomic Tasks) từ khởi tạo đến hoàn thiện hồ sơ dự thi KHKT cấp Huyện và Tỉnh.

---

## Giai Đoạn 1: Khảo Sát & Xác Lập Yêu Cầu (Hoàn thành 100%)
- [x] **Task 1.1:** Khảo sát thực trạng phế phẩm nông nghiệp (rơm, bắp, chuối, rau quả) tại địa bàn xã Cẩm Đường và lân cận.
- [x] **Task 1.2:** Thu thập dữ liệu hao hụt độ tươi của 10 loại nông sản nhiệt đới đặc thù và xây dựng bảng tham số sinh học.
- [x] **Task 1.3:** Soạn thảo hồ sơ yêu cầu chức năng (FR) và phi chức năng (NFR) trong `docs/01-survey-summary.md` và `docs/02-requirements.md`.
- [x] **Task 1.4:** Thiết lập tài liệu định hướng sản phẩm `PRD.md`.

---

## Giai Đoạn 2: Xây Dựng Lõi Nghiệp Vụ Dùng Chung (Slice 1 - Hoàn thành 100%)
- [x] **Task 2.1:** Cấu hình danh mục 10 loại nông sản và 6 nhóm phụ phẩm trong `src/shared/crops.js`.
- [x] **Task 2.2:** Lập trình thuật toán định giá độ tươi bằng `BigInt` tỷ lệ `10_000_000n` và làm tròn nửa lên trong `src/shared/pricing.js`.
- [x] **Task 2.3:** Lập trình công thức lượng giác Haversine tính khoảng cách tọa độ (km) trong `src/shared/geo.js`.
- [x] **Task 2.4:** Xây dựng bộ bóc tách ngôn ngữ tiếng Việt (Voice Parser) từ giọng nói sang 6 trường trong `src/shared/voice-parser.js`.
- [x] **Task 2.5:** Viết bộ kiểm tra dữ liệu đầu vào đẳng cấu (Isomorphic Validation) trong `src/shared/validation.js`.
- [x] **Task 2.6:** Viết 16 ca kiểm thử đơn vị cho tầng dùng chung trong `tests/shared-domain.test.js`.

---

## Giai Đoạn 3: Phát Triển Máy Chủ & Cơ Sở Dữ Liệu Cục Bộ (Slice 2 - Hoàn thành 100%)
- [x] **Task 3.1:** Khởi tạo bảng SQLite với chế độ ghi nhật ký `WAL` và các câu lệnh chuẩn bị trong `src/server/db.js`.
- [x] **Task 3.2:** Xây dựng bộ định tuyến HTTP thuần `node:http` có bảo vệ chống tấn công đường dẫn trong `src/server/router.js`.
- [x] **Task 3.3:** Viết API quản lý tin đăng, lọc bán kính, đăng bài, thu gom và báo cáo trong `src/server/app.js`.
- [x] **Task 3.4:** Lập trình xác thực mã PIN an toàn thời gian và sinh mã 4 chữ số bí mật trong `src/server/auth.js`.
- [x] **Task 3.5:** Viết 19 ca kiểm thử API tích hợp máy chủ trong `tests/server-api.test.js`.

---

## Giai Đoạn 4: Xây Dựng Giao Diện PWA & Bản Đồ Ngoại Tuyến (Slice 3 - Hoàn thành 100%)
- [x] **Task 4.1:** Thiết kế khung giao diện HTML5 chuẩn ngữ nghĩa 5 tab điều hướng trong `public/index.html`.
- [x] **Task 4.2:** Viết phong cách giao diện tương phản cao nông thôn trong `public/css/app.css`.
- [x] **Task 4.3:** Lập trình Service Worker quản lý bộ nhớ đệm và chạy offline trong `public/sw.js` và `public/js/sw-routes.js`.
- [x] **Task 4.4:** Phát triển giao diện Bản đồ Leaflet tương tác và bộ lọc xã trong `public/js/map-view.js`.
- [x] **Task 4.5:** Phát triển giao diện Máy tính định giá trực quan trong `public/js/calculator-view.js`.
- [x] **Task 4.6:** Phát triển giao diện Đăng tin tích hợp Web Speech API tiếng Việt trong `public/js/post-form.js`.
- [x] **Task 4.7:** Phát triển Bảng tác động môi trường và Bảng quản trị trong `public/js/impact-view.js` và `public/js/admin-view.js`.
- [x] **Task 4.8:** Viết 19 ca kiểm thử giao diện PWA và bộ nhớ đệm trong `tests/pwa-ui.test.js`.

---

## Giai Đoạn 5: CI/CD & Tài Liệu Kỹ Thuật (Slice 4 - Hoàn thành 100%)
- [x] **Task 5.1:** Cấu hình đường ống tích hợp liên tục `.github/workflows/ci.yml`.
- [x] **Task 5.2:** Viết kịch bản tự động kiểm tra quy tắc 0 comment và dung lượng < 1.5MB trong `scripts/verify-docs-and-bundle.mjs`.
- [x] **Task 5.3:** Soạn thảo Sách hướng dẫn kỹ thuật tự học cho học sinh THCS trong `docs/03-thcs-technical-guide.md`.
- [x] **Task 5.4:** Cập nhật tài liệu giới thiệu dự án `README.md`.

---

## Giai Đoạn 6: Tối Ưu Hóa & Khắc Phục Lỗi (Hoàn thành 100%)
- [x] **Task 6.1:** Khắc phục lỗi kiểm tra định dạng dữ liệu đầu vào `Content-Type: application/json` tại máy chủ.
- [x] **Task 6.2:** Tinh chỉnh xử lý hàng đợi tính giá offline trong `public/js/app.js` với thuật toán lùi thời gian cấp số nhân (*exponential backoff*) và sự kiện `visibilitychange`.
- [x] **Task 6.3:** Chuẩn hóa đường dẫn tương đối trong `src/server/index.js` theo `import.meta.dirname` giúp máy chủ khởi động an toàn từ bất kỳ thư mục nào.
- [x] **Task 6.4:** Cập nhật 6 file tài liệu quy chuẩn quản lý dự án (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `PROGRESS.md`).
- [x] **Task 6.5:** Bổ sung các ca kiểm thử bảo vệ hồi quy (*Regression Tests*) trong `tests/server-api-extra.test.js` và `tests/pwa-ui-extra.test.js` nâng tổng số bài kiểm thử lên 55/55 ca đạt chuẩn.

---

## Giai Đoạn 7: Hoàn Thiện Hồ Sơ KHKT Chính Thức & Thử Nghiệm Thực Tế (Bước tiếp theo)
- [x] **Task 7.1:** Thiết lập Subagent chuyên trách `khkt-monitor` theo dõi dự án và cập nhật báo cáo.
- [x] **Task 7.2:** Hoàn thiện hồ sơ Kế hoạch nghiên cứu KHKT chính thức 2 phần trong `docs/04-ke-hoach-nghien-cuu-khkt.md` (Học sinh Hồ Ngọc Quỳnh Như, GVHD Hoàng Thành Đạt; chuẩn 15 phần Khoa học + 11 phần Kỹ thuật).
- [x] **Task 7.3:** Soạn thảo mẫu phiếu điều tra khảo sát thực tế cho 30 hộ nông dân địa phương trong `docs/05-mau-khao-sat-nong-dan.md`.
- [ ] **Task 7.4:** Triển khai thử nghiệm mô hình thực địa tại Phân hiệu 2 – Trường THCS Cẩm Đường với sự tham gia của 20 hộ nông dân địa phương.
- [ ] **Task 7.5:** Thiết kế Poster dự thi khổ A0, chuẩn bị bài thuyết trình PowerPoint và tập luyện trả lời câu hỏi phản biện của Ban Giám khảo.
