# TASKS.md — Danh Mục Nhiệm Vụ & Các Bước Triển Khai
*Kế hoạch từng bước từ ý tưởng, khảo sát thực tế đến hoàn thiện sản phẩm và hồ sơ dự thi KHKT THCS*

---

## Giai Đoạn 1: Khảo Sát Thực Tế & Lắng Nghe Nông Dân (Đã Hoàn Thành 100%)
- [x] **Task 1.1:** Đi thực địa, khảo sát tình hình đốt rơm rạ và vứt bỏ phụ phẩm tại xã Cẩm Đường (Long Thành, Đồng Nai).
- [x] **Task 1.2:** Phỏng vấn thực tế 30 hộ nông dân địa phương, ghi nhận 4 khó khăn lớn: chữ nhỏ ngại bấm điện thoại, đường xe vào ruộng (ba gác/ghe), rơm ướt hay khô, và sợ bị gọi điện làm phiền.
- [x] **Task 1.3:** Soạn thảo mẫu phiếu khảo sát nông dân trong `docs/05-mau-khao-sat-nong-dan.md`.
- [x] **Task 1.4:** Thiết lập tài liệu yêu cầu sản phẩm `PRD.md` bám sát thực tế nông thôn.

---

## Giai Đoạn 2: Xây Dựng Các Công Thức & Xử Lý Tiếng Việt (Đã Hoàn Thành 100%)
- [x] **Task 2.1:** Lập danh mục 10 loại quả nhiệt đới và tỷ lệ suy giảm phẩm chất tự nhiên theo ngày trong `src/shared/crops.js`.
- [x] **Task 2.2:** Lập trình công thức tính mức giảm giá hợp lý làm tròn đến hàng trăm đồng trong `src/shared/pricing.js`.
- [x] **Task 2.3:** Lập trình công thức tính khoảng cách km giữa các xã trong `src/shared/geo.js`.
- [x] **Task 2.4:** Xây dựng bộ nhận diện câu nói tiếng Việt mộc mạc của nông dân thành thông tin đăng tin trong `src/shared/voice-parser.js`.
- [x] **Task 2.5:** Viết bộ kiểm tra thông tin hợp lệ (loại đường, độ ẩm, số điện thoại) trong `src/shared/validation.js`.
- [x] **Task 2.6:** Viết 16 bài kiểm tra tự động cho phần tính toán dùng chung trong `tests/shared-domain.test.js`.

---

## Giai Đoạn 3: Xây Dựng Máy Chủ Gọn Nhẹ & Cơ Sở Dữ Liệu SQLite (Đã Hoàn Thành 100%)
- [x] **Task 3.1:** Khởi tạo cơ sở dữ liệu SQLite lưu thành 1 tệp tin duy nhất không tốn phí máy chủ trong `src/server/db.js`.
- [x] **Task 3.2:** Xây dựng bộ điều hướng máy chủ Node.js an toàn trong `src/server/router.js`.
- [x] **Task 3.3:** Lập trình các cổng tiếp nhận đăng tin, tìm kiếm theo bán kính và xác nhận thu gom trong `src/server/app.js`.
- [x] **Task 3.4:** Lập trình tính năng sinh mã bí mật 4 chữ số và khóa liên lạc sau thu gom trong `src/server/auth.js`.
- [x] **Task 3.5:** Viết 20 bài kiểm tra tự động cho máy chủ trong `tests/server-api.test.js`.

---

## Giai Đoạn 4: Thiết Kế Giao Diện Dễ Bấm & Dùng Ngoại Tuyến (Đã Hoàn Thành 100%)
- [x] **Task 4.1:** Thiết kế giao diện HTML5 chuẩn ngữ nghĩa 5 tab điều hướng to bản trong `public/index.html`.
- [x] **Task 4.2:** Viết giao diện tương phản cao, nút to 48px - 54px cho người già trong `public/styles/app.css`.
- [x] **Task 4.3:** Lập trình bộ nhớ đệm Service Worker giúp mở ứng dụng ngay cả khi ra đồng mất mạng trong `public/sw.js`.
- [x] **Task 4.4:** Phát triển màn hình Bản đồ phụ phẩm với huy hiệu đường đi (xe tải/ba gác/ghe) và độ ẩm trong `public/js/map-view.js`.
- [x] **Task 4.5:** Phát triển màn hình Máy tính định giá độ tươi trực quan trong `public/js/calculator-view.js`.
- [x] **Task 4.6:** Bổ sung 4 chip chọn nhanh khối lượng 1 chạm, nút micro thu âm và thẻ xem trước (Preview Card) trong `public/js/post-form.js`.
- [x] **Task 4.7:** Phát triển Bảng ghi nhận công sức bảo vệ môi trường trong `public/js/impact-view.js`.
- [x] **Task 4.8:** Viết 20 bài kiểm tra tự động cho phần giao diện trong `tests/pwa-ui.test.js`.

---

## Giai Đoạn 5: Hoàn Thiện Bộ 6 Tệp Vibe Coding & Kiểm Định Chất Lượng (Đã Hoàn Thành 100%)
- [x] **Task 5.1:** Đồng bộ toàn diện bộ 6 file quản trị dự án chuẩn chỉnh:
  - `PRD.md`: Bạn đang xây dựng gì và dành cho ai.
  - `ARCHITECTURE.md`: Công nghệ sử dụng, cấu trúc thư mục, luồng dữ liệu.
  - `DESIGN.md`: Màu sắc, cỡ chữ cho người già, nút bấm 3D và các thành phần giao diện.
  - `RULES.md`: Quy tắc không viết comment, giới hạn dung lượng < 1.5MB, giữ đúng tầm vóc THCS.
  - `TASKS.md`: Kế hoạch hành động chi tiết từng bước.
  - `PROGRESS.md`: Báo cáo tiến độ và các lỗi thực tế đã giải quyết.
- [x] **Task 5.2:** Kiểm tra dung lượng toàn bộ gói giao diện (đạt 435 KB, nhỏ hơn nhiều so với mức giới hạn 1.5 MB).
- [x] **Task 5.3:** Kiểm tra 100% không chứa dòng chú thích (comment) thừa trong mã nguồn (`scripts/verify-docs-and-bundle.mjs`).
- [x] **Task 5.4:** Bảo đảm 56/56 bài kiểm tra tự động chạy xanh lá hoàn hảo trên Node.js.

---

## Giai Đoạn 6: Chuẩn Bị Hồ Sơ Dự Thi KHKT Cấp Huyện & Tỉnh (Đang Tiến Hành)
- [x] **Task 6.1:** Soạn thảo Dàn ý 12 Slide thuyết trình PowerPoint thực tế, khiêm tốn, giàu sức thuyết phục trong `docs/06-dan-y-thuyet-trinh-powerpoint.md`.
- [x] **Task 6.2:** Soạn thảo Bộ 9 câu hỏi phản biện Ban Giám khảo kèm câu trả lời tự tin, chân thực trong `docs/07-bo-cau-hoi-phan-bien-khkt.md`.
- [x] **Task 6.3:** Dựng video clip demo mô phỏng sử dụng thực tế ngoài đồng ruộng (`assets/video/demo-agricircle.mp4` & dự án CapCut).
- [ ] **Task 6.4:** Cập nhật Kế hoạch nghiên cứu KHKT chính thức trong `docs/04-ke-hoach-nghien-cuu-khkt.md` và xuất ra file Word `docs/04-ke-hoach-nghien-cuu-khkt.docx`.
- [ ] **Task 6.5:** In ấn tài liệu, xin chữ ký Ban Giám hiệu trường THCS Cẩm Đường và thiết kế Poster khổ A0 để tham gia vòng thi cấp Huyện.
