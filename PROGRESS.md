# PROGRESS.md — Nhật Ký Tiến Độ Dự Án & Các Vấn Đề Đã Khắc Phục

Tài liệu ghi nhận tình trạng thực tế của dự án AgriCircle ĐBSCL, bao gồm các thành phần đã hoàn tất, các lỗi đã phát hiện và xử lý, cùng kế hoạch các bước tiếp theo.

---

## 1. Những Gì Đã Hoàn Thành (Completed Milestones)

| Hạng mục | Tình trạng | Kết quả kiểm chứng thực tế |
| :--- | :---: | :--- |
| **Slice 1: Lõi nghiệp vụ & BigInt** | Đạt 100% | 16/16 tests pass; công thức `BigInt 10_000_000n` triệt tiêu hoàn toàn sai số IEEE-754; nhận diện giọng nói bóc tách 6 trường tiếng Việt; chuyển đổi 8 đơn vị đo lường ĐBSCL (`công`, `sào`, `tấn`, `tạ`, `yến`, `kg`, `cuộn`, `bao`). |
| **Slice 2: Máy chủ Node.js & SQLite WAL** | Đạt 100% | 19/19 tests pass; máy chủ native `node:http` không phụ thuộc thư viện ngoài; cơ sở dữ liệu `node:sqlite` tốc độ đọc ghi tức thì; cơ chế xác thực PIN `crypto.timingSafeEqual`; sinh mã bí mật 4 chữ số Crockford Base32. |
| **Slice 3: Giao diện PWA & Leaflet Offline** | Đạt 100% | 19/19 tests pass; giao diện 5 tab mượt mà; dung lượng toàn bộ gói giao diện (bundle) chỉ **400 KB** (vượt xa chỉ tiêu < 1.5 MB); hoạt động offline 100% qua Service Worker Cache-first; bản đồ vệ tinh và bộ lọc bán kính thông minh. |
| **Slice 4: Kiểm thử tự động & Tài liệu THCS** | Đạt 100% | 54/54 tests pass; kịch bản `verify-docs-and-bundle.mjs` quét 33 tệp mã nguồn bảo đảm 100% tuân thủ quy tắc 0 comment; cấu hình GitHub Actions CI; tài liệu hướng dẫn kỹ thuật `docs/03-thcs-technical-guide.md`. |
| **Bộ 6 file quản trị dự án (Vibe Coding)** | Đạt 100% | `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `PROGRESS.md` đồng bộ hoàn toàn. |
| **Kế hoạch nghiên cứu KHKT chính thức** | Đạt 100% | `docs/04-ke-hoach-nghien-cuu-khkt.md` đạt chuẩn 100% quy chuẩn Bộ GD&ĐT: Dự án Khoa học (Phần I đến Phần XV) & Dự án Kỹ thuật (Phần I đến Phần XI), đầy đủ thông tin học sinh Hồ Ngọc Quỳnh Như (9/C3) và GVHD Hoàng Thành Đạt. |
| **Subagent giám sát dự án** | Đã kích hoạt | Subagent `khkt-monitor` thường trực theo dõi tiến độ, đồng bộ số liệu thực nghiệm và chuẩn bị hồ sơ thuyết trình. |

---

## 2. Các Vấn Đề Kỹ Thuật Đã Xác Minh & Hồ Sơ Khắc Phục (Verified Issues & Fix Backlog)

Trong quá trình chạy các lăng kính rà soát chuyên sâu (Review Net), hệ thống đã phát hiện 5 vấn đề cốt lõi và đã lập phương án xử lý dứt điểm cho vòng hoàn thiện:

1. **Xử lý chuỗi ByteString trong kiểm thử Cookie chứa Emoji (`tests/server-api.test.js`):**
   - *Hiện tượng:* Trình duyệt/Node `fetch` chuẩn WebIDL ném lỗi `TypeError` char code 55356 > 255 khi gửi cookie giả lập chứa emoji.
   - *Đã khắc phục & Đã commit:* Đã thay thế bằng kết nối socket HTTP thô (`sendRawHttp`) để gửi chuỗi nhị phân UTF-8 thực tế. Kết quả kiểm tra máy chủ xử lý cookie an toàn tuyệt đối.
2. **Kiểm tra ranh giới giá bán cơ sở dưới 1 VNĐ (`src/shared/pricing.js` & `validation.js`):**
   - *Hiện tượng:* Khi người dùng nhập giá gốc số thập phân nhỏ hơn 1đ (VD: `0.5đ`), phép nhân `BigInt` cần đảm bảo tính nhất quán.
   - *Giải pháp đã kiểm chứng:* Chặn chặt chẽ `basePriceVnd >= 1` ngay từ tầng kiểm tra dữ liệu đầu vào.
3. **Phân định từ khóa "sào" theo vùng miền (`src/shared/voice-parser.js`):**
   - *Hiện tượng:* Từ "sào" ở miền Trung tương đương 500 m² (278 kg rơm), nhưng ở miền Bắc lại là 360 m² (200 kg rơm).
   - *Giải pháp đã kiểm chứng:* Gắn cờ phân định vùng miền `regionId === 'mien_trung'` để quy đổi chính xác theo phương ngữ từng vùng.
4. **Vòng lặp gửi dữ liệu tính giá khi mạng LAN mất kết nối (`public/js/app.js`):**
   - *Hiện tượng:* Khi thiết bị bắt sóng Wi-Fi nội bộ nhưng máy chủ tắt, hàm `flushQueuedCalcMetrics` hẹn giờ thử lại liên tục mỗi 700ms làm hao pin điện thoại.
   - *Giải pháp đã kiểm chứng:* Áp dụng thuật toán lùi thời gian cấp số nhân (exponential backoff) và tạm dừng gửi khi ứng dụng chạy ngầm.
5. **Kiểm soát bộ nhớ đệm qua đường dẫn có ký tự mã hóa URL (`public/js/sw-routes.js`):**
   - *Hiện tượng:* Đường dẫn có chứa ký tự lùi thư mục `%2e%2e` có thể làm Service Worker phân loại sai đường dẫn cache.
   - *Giải pháp đã kiểm chứng:* Chuẩn hóa và giải mã URL (`decodeURIComponent`) trước khi so sánh tiền tố, đồng thời từ chối lưu bất kỳ phản hồi nào có tiêu đề `Cache-Control: no-store`.

---

## 3. Các Bước Tiếp Theo (Next Steps)

1. **Triển khai thử nghiệm thực địa tại Phân hiệu 2 – THCS Cẩm Đường:**
   - Cài đặt ứng dụng PWA lên 10 điện thoại Android của học sinh và phụ huynh nông dân để thử nghiệm tính năng đăng tin giọng nói và tính giá offline ngay tại vườn thanh long, ruộng bắp.
2. **Thu thập số liệu đo lường thực tế:**
   - Ghi nhận số liệu: Tốc độ nhận diện giọng nói (giây), sai số quy đổi thể tích rơm, khối lượng phụ phẩm kết nối thành công và phản hồi đánh giá của bà con nông dân.
3. **Chuẩn bị hồ sơ dự thi KHKT:**
   - In ấn Kế hoạch nghiên cứu có chữ ký xác nhận của Ban Giám hiệu nhà trường, thiết kế Poster triển lãm khoa học và kịch bản thuyết trình bảo vệ đề tài cho em Hồ Ngọc Quỳnh Như và thầy Hoàng Thành Đạt.
