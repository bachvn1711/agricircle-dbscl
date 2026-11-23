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

## Giai Đoạn 5: Hoàn Thiện Bộ 6 Tài Liệu Quản Lý Dự Án & Đóng Gói Triển Khai (Đã Hoàn Thành 100%)
- [x] **Task 5.1:** Đồng bộ toàn diện bộ 6 file quản trị dự án: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `PROGRESS.md`.
- [x] **Task 5.2:** Đóng gói ứng dụng: `start.bat` (1-click Windows), `start.sh` (Linux/Mac), `Dockerfile`, `render.yaml`.
- [x] **Task 5.3:** Đẩy mã nguồn lên kho lưu trữ GitHub chính thức: `https://github.com/bachvn1711/agricircle-dbscl`.
- [x] **Task 5.4:** Triển khai Live Online và hoàn thành bộ kiểm thử kết nối trực tiếp `17/17 tests pass` qua `scripts/test-live-connections.mjs`.
- [x] **Task 5.5:** Biên soạn Cẩm nang Hướng dẫn sử dụng chi tiết trong `USER_GUIDE.md` và `docs/09-huong-dan-su-dung.md`.

---

## Giai Đoạn 6: Hoàn Tất Toàn Diện Hồ Sơ Dự Thi KHKT Cấp Huyện & Tỉnh (Đã Hoàn Thành 100%)
- [x] **Task 6.1:** Soạn thảo Dàn ý 12 Slide thuyết trình PowerPoint thực tế, khiêm tốn, giàu sức thuyết phục trong `docs/06-dan-y-thuyet-trinh-powerpoint.md`.
- [x] **Task 6.2:** Soạn thảo Bộ 9 câu hỏi phản biện Ban Giám khảo kèm câu trả lời tự tin, chân thực trong `docs/07-bo-cau-hoi-phan-bien-khkt.md`.
- [x] **Task 6.3:** Dựng video clip demo mô phỏng sử dụng thực tế ngoài đồng ruộng (`assets/video/demo-agricircle.mp4` & dự án CapCut).
- [x] **Task 6.4:** Cập nhật Kế hoạch nghiên cứu KHKT chính thức trong `docs/04-ke-hoach-nghien-cuu-khkt.md` và xuất ra file Word chuẩn Thông tư 84 (`docs/04-ke-hoach-nghien-cuu-khkt.docx`).
- [x] **Task 6.5:** Thiết kế Poster triển lãm khoa học khổ A0 chuẩn Bộ GD&ĐT trong `docs/10-thiet-ke-poster-a0.md` và trang in trực tiếp `docs/poster-a0.html`.
