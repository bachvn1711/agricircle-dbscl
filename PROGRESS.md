# PROGRESS.md — Nhật Ký Tiến Độ Dự Án & Các Vấn Đề Đã Khắc Phục

Tài liệu ghi nhận tình trạng thực tế của dự án AgriCircle ĐBSCL, bao gồm các thành phần đã hoàn tất, các lỗi đã khắc phục triệt để và được chứng minh bằng kiểm thử tự động, cùng kế hoạch các bước tiếp theo.

---

## 1. Những Gì Đã Hoàn Thành (Completed Milestones)

| Hạng mục | Tình trạng | Kết quả kiểm chứng thực tế |
| :--- | :---: | :--- |
| **Slice 1: Lõi nghiệp vụ & BigInt** | Đạt 100% | 16/16 tests pass; công thức `BigInt 10_000_000n` triệt tiêu hoàn toàn sai số IEEE-754; nhận diện giọng nói bóc tách 6 trường tiếng Việt; chuyển đổi 8 đơn vị đo lường ĐBSCL (`công`, `sào`, `tấn`, `tạ`, `yến`, `kg`, `cuộn`, `bao`). |
| **Slice 2: Máy chủ Node.js & SQLite WAL** | Đạt 100% | 20/20 tests pass; máy chủ native `node:http`; `Content-Type: application/json` bắt buộc; kiểm tra 404/409 trước khi trừ hạn mức báo cáo; cơ sở dữ liệu `node:sqlite` WAL; xác thực PIN an toàn thời gian; sinh mã 4 số Crockford Base32. |
| **Slice 3: Giao diện PWA & Leaflet Offline** | Đạt 100% | 19/19 tests pass; giao diện 5 tab mượt mà; dung lượng toàn bộ gói giao diện (bundle) chỉ **401 KB** (< 1.5 MB); chạy offline qua Service Worker; chặn rò rỉ cache qua URL decode và lọc `no-store`. |
| **Slice 4: Kiểm thử tự động & Tài liệu THCS** | Đạt 100% | 55/55 tests pass; kịch bản `verify-docs-and-bundle.mjs` quét 33 tệp mã nguồn bảo đảm 100% tuân thủ quy tắc 0 comment; cấu hình GitHub Actions CI; tài liệu hướng dẫn kỹ thuật `docs/03-thcs-technical-guide.md`. |
| **Bộ 6 file quản trị dự án (Vibe Coding)** | Đạt 100% | `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `PROGRESS.md` đồng bộ hoàn toàn. |
| **Hồ sơ Kế hoạch nghiên cứu KHKT chính thức** | Đạt 100% | `docs/04-ke-hoach-nghien-cuu-khkt.md` đạt chuẩn 100% quy chuẩn Bộ GD&ĐT: Dự án Khoa học (Phần I đến Phần XV) & Dự án Kỹ thuật (Phần I đến Phần XI), đầy đủ thông tin học sinh Hồ Ngọc Quỳnh Như (9/C3) và GVHD Hoàng Thành Đạt. |
| **Mẫu phiếu khảo sát thực tế nông dân** | Đạt 100% | `docs/05-mau-khao-sat-nong-dan.md` chuẩn bị sẵn sàng cho 30 hộ nông dân địa phương. |
| **Subagent giám sát dự án** | Đã kích hoạt | Subagent `khkt-monitor` thường trực theo dõi tiến độ, đồng bộ số liệu thực nghiệm và chuẩn bị hồ sơ thuyết trình. |

---

## 2. Các Khiếm Khuyết Kỹ Thuật Đã Khắc Phục Triệt Để & Đã Kiểm Thử (Remediated & Verified Defects)

Toàn bộ 5 khiếm khuyết phát hiện từ đợt Review Net đã được khắc phục tận gốc và kiểm chứng bằng bài test tự động:

1. **Vòng lặp gửi dữ liệu tính giá khi mất mạng (`public/js/app.js`):**
   - *Khắc phục:* Áp dụng thuật toán lùi thời gian cấp số nhân (`exponential backoff`: 700ms $\rightarrow$ 1.4s $\rightarrow$ 2.8s ... tối đa 30s) và lắng nghe sự kiện `visibilitychange` để chỉ gửi khi trang đang hiển thị.
2. **Xung đột GPS & Bóc tách câu nói dở dang (`public/js/post-form.js`):**
   - *Khắc phục:* Tăng tuần tự biến đếm `gpsSeq += 1` trong hàm `onRegionChanged()` để triệt tiêu việc kết quả GPS cũ đè lên vùng mới; đồng thời tự động bóc tách bản ghi âm dở dang (`latestVoiceTranscript`) khi người dùng bấm dừng hoặc hết giờ.
3. **Chặn tấn công Cross-Origin & Thứ tự kiểm tra báo cáo tin (`src/server/app.js` & `src/server/db.js`):**
   - *Khắc phục:* Bắt buộc kiểm tra `Content-Type: application/json` trong hàm `readJsonBody` (từ chối `text/plain` bằng mã HTTP 415); chuyển việc kiểm tra hạn ngạch báo cáo vào trong giao dịch SQLite sau khi đã xác nhận tin tồn tại (404) và còn hạn (409).
4. **Bảo vệ bộ nhớ đệm Service Worker & Điều hướng ngoại tuyến (`public/js/sw-routes.js` & `public/sw.js`):**
   - *Khắc phục:* Giải mã URL (`decodeURIComponent`) trước khi so khớp tiền tố để chống path-traversal `%2e%2e`; từ chối lưu đệm các phản hồi có `Cache-Control: no-store`; hỗ trợ nạp shell `/index.html` khi điều hướng ngoại tuyến.
5. **Độc lập thư mục khởi động máy chủ (`src/server/index.js`):**
   - *Khắc phục:* Dùng `import.meta.dirname` để xác định đường dẫn tĩnh `public`, `src/shared` và `node_modules/leaflet/dist`, cho phép khởi động lệnh từ bất kỳ thư mục làm việc nào.

---

## 3. Các Bước Tiếp Theo (Next Steps)

1. **Triển khai thử nghiệm thực địa tại Phân hiệu 2 – THCS Cẩm Đường:**
   - Cài đặt ứng dụng PWA lên 10 điện thoại Android của học sinh và phụ huynh nông dân để thử nghiệm tính năng đăng tin giọng nói và tính giá offline ngay tại vườn thanh long, ruộng bắp.
2. **Thu thập số liệu đo lường thực tế:**
   - Ghi nhận số liệu: Tốc độ nhận diện giọng nói (giây), sai số quy đổi thể tích rơm, khối lượng phụ phẩm kết nối thành công và phản hồi đánh giá của bà con nông dân qua mẫu khảo sát `docs/05-mau-khao-sat-nong-dan.md`.
3. **Chuẩn bị hồ sơ dự thi KHKT:**
   - In ấn Kế hoạch nghiên cứu có chữ ký xác nhận của Ban Giám hiệu nhà trường, thiết kế Poster triển lãm khoa học và kịch bản thuyết trình bảo vệ đề tài.
