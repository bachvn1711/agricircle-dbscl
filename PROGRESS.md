# PROGRESS.md — Nhật Ký Tiến Độ Dự Án & Các Vấn Đề Đã Khắc Phục
*Ghi nhận trung thực tiến độ thực tế của đề tài AgriCircle theo chuẩn 6 tệp Vibe Coding*

---

## 1. Những Gì Đã Hoàn Thành (Completed Milestones)

| Hạng mục | Tình trạng | Kết quả kiểm chứng thực tế |
| :--- | :---: | :--- |
| **Lõi nghiệp vụ & Tính toán** | Đạt 100% | 16/16 tests pass; công thức tính giảm giá độ tươi làm tròn chẵn trăm đồng; bóc tách giọng nói tiếng Việt tự nhiên; chuyển đổi các đơn vị đo lường nông thôn (`công`, `sào`, `tấn`, `kg`). |
| **Máy chủ Node.js & SQLite** | Đạt 100% | 20/20 tests pass; máy chủ `node:http` nhẹ nhàng; cơ sở dữ liệu `node:sqlite` lưu trong 1 tệp tin duy nhất không tốn phí; sinh mã nhận tin 4 số; tự động khóa tin sau thu gom. |
| **Giao diện PWA & Bản đồ ngoại tuyến** | Đạt 100% | 20/20 tests pass; dung lượng toàn bộ gói giao diện chỉ **435 KB** (nhẹ hơn nhiều mức trần 1.5 MB); hoạt động offline nhờ Service Worker; giao diện 5 tab mượt mà. |
| **5 Điểm Tinh Chỉnh Thực Địa Mới Nhất** | Đạt 100% | 1. Thêm phương tiện tiếp cận (xe tải 🚛, ba gác 🛺, ghe thuyền 🛶).<br>2. Thêm độ ẩm rơm rạ (khô ráo ☀️, hơi ẩm ⛅, ướt dầm mưa 🌧️).<br>3. Khóa nút gọi & ẩn số điện thoại sau thu gom (chống quấy rầy).<br>4. 4 chip chọn nhanh khối lượng 1 chạm không cần gõ phím.<br>5. Thẻ xem trước (Preview Card) và nút bấm to 54px chống bấm nhầm. |
| **Kiểm định chất lượng mã nguồn** | Đạt 100% | **56/56 bài kiểm tra tự động chạy xanh lá**; kịch bản `verify-docs-and-bundle.mjs` quét 33 tệp xác nhận **100% không chứa dòng comment thừa**; bundle < 1.5MB. |
| **Bộ 6 file quản trị Vibe Coding** | Đạt 100% | `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `PROGRESS.md` đồng bộ hoàn toàn, đúng tinh thần và ngôn ngữ của học sinh THCS. |
| **Hồ sơ thuyết trình & Phản biện KHKT** | Đạt 100% | `docs/06-dan-y-thuyet-trinh-powerpoint.md` (12 slide súc tích, thực tế) & `docs/07-bo-cau-hoi-phan-bien-khkt.md` (9 câu hỏi bảo vệ bản quyền, tính khả thi). |
| **Video clip Demo hệ thống** | Đạt 100% | Đã kết xuất video demo `assets/video/demo-agricircle.mp4` và tạo sẵn dự án CapCut tại máy cá nhân. |

---

## 2. Các Khiếm Khuyết Kỹ Thuật Đã Khắc Phục Triệt Để (Remediated Defects)

1. **Vòng lặp gửi dữ liệu khi mất mạng (`public/js/app.js`):**
   - *Khắc phục:* Áp dụng thuật toán lùi thời gian cấp số nhân (`exponential backoff`: 700ms $\rightarrow$ 1.4s $\rightarrow$ 2.8s ... tối đa 30s) và lắng nghe sự kiện trang hiển thị `visibilitychange`.
2. **Xung đột GPS & Bóc tách câu nói dở dang (`public/js/post-form.js`):**
   - *Khắc phục:* Tăng tuần tự biến đếm `gpsSeq += 1` khi đổi xã/vùng để tránh kết quả GPS cũ đè lên vùng mới; đồng thời tự động bóc tách bản ghi âm dở dang khi người dùng bấm dừng mic.
3. **Chặn tấn công dữ liệu giả & Thứ tự kiểm tra báo cáo (`src/server/app.js`):**
   - *Khắc phục:* Bắt buộc kiểm tra `Content-Type: application/json`; kiểm tra tin tồn tại (404) và còn hạn (409) trước khi trừ hạn mức báo cáo.
4. **Bảo vệ bộ nhớ đệm Service Worker (`public/js/sw-routes.js` & `public/sw.js`):**
   - *Khắc phục:* Giải mã URL (`decodeURIComponent`) trước khi so khớp tiền tố; tuyệt đối không lưu đệm phản hồi có cấm lưu `no-store`.
5. **Độc lập thư mục khởi động máy chủ (`src/server/index.js`):**
   - *Khắc phục:* Dùng `import.meta.dirname` để xác định đường dẫn tài nguyên tĩnh, cho phép khởi động lệnh từ bất kỳ thư mục nào mà không bị lỗi 404.

---

## 3. Các Bước Tiếp Theo (Next Steps)

1. **Cập nhật Kế hoạch nghiên cứu KHKT chính thức (`docs/04-ke-hoach-nghien-cuu-khkt.md`):**
   - Điều chỉnh lại các phần mục tiêu, tính mới theo đúng ngôn ngữ học sinh THCS và chạy lệnh xuất file Word `docs/04-ke-hoach-nghien-cuu-khkt.docx`.
2. **Triển khai thử nghiệm thực địa & phát phiếu khảo sát:**
   - Cài đặt ứng dụng PWA lên điện thoại phụ huynh và bà con tại Cẩm Đường để ghi nhận phản hồi vào mẫu phiếu `docs/05-mau-khao-sat-nong-dan.md`.
3. **Chuẩn bị Poster triển lãm KHKT khổ A0:**
   - Thiết kế bố cục Poster với các hình ảnh thực tế, biểu đồ khảo sát và mã QR để Ban Giám khảo quét mở ứng dụng trải nghiệm trực tiếp.
