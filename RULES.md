# RULES.md — Quy Tắc Lập Trình & Giới Hạn Tuyệt Đối Của AI

## 1. Quy Tắc Viết Code (Coding Standards)

Mọi mã nguồn trong dự án AgriCircle phải tuân thủ nghiêm ngặt 6 quy tắc vàng sau:

### Quy tắc 1: Tuyệt đối không viết chú thích trong code (ZERO CODE COMMENTS)
- **Cấm:** Không được viết bất kỳ dòng chú thích nào dạng `//`, `/* ... */` trong các tệp JavaScript (`.js`), CSS (`.css`), hoặc `<!-- ... -->` trong HTML (`.html`).
- **Lý do:** Giữ cho mã nguồn cực kỳ tinh gọn, tối ưu từng byte cho mạng di động 3G nông thôn. Mọi kiến thức khoa học, cơ sở toán học và giải thích chi tiết bắt buộc phải trình bày trong các tệp tài liệu Markdown (`docs/03-thcs-technical-guide.md`, `docs/04-ke-hoach-nghien-cuu-khkt.md`).

### Quy tắc 2: Không cài thêm thư viện bên ngoài (Zero External Runtime Dependencies)
- Hệ thống chỉ sử dụng duy nhất gói thư viện bản đồ `leaflet` v1.9.4 đã được cố định phiên bản trong `package.json`.
- Tận dụng 100% các thư viện có sẵn của nền tảng Node.js:
  - Máy chủ HTTP: `node:http`.
  - Cơ sở dữ liệu: `node:sqlite` (tích hợp sẵn từ Node.js v22+).
  - Mật mã học: `node:crypto`.
  - Hệ thống tệp: `node:fs` và `node:path`.
- Phía giao diện (Frontend): Dùng JavaScript thuần (Vanilla ES6 Modules), không dùng React, Vue, jQuery, Tailwind hay Bootstrap.

### Quy tắc 3: Logic nghiệp vụ dùng chung đồng nhất (Isomorphic Domain Logic)
- Các tệp trong thư mục `src/shared/` (`pricing.js`, `crops.js`, `geo.js`, `voice-parser.js`, `validation.js`) là nguồn chân lý duy nhất (Single Source of Truth).
- Trình duyệt và Máy chủ cùng nhập khẩu (import) chung các hàm này. Không bao giờ được sao chép (copy-paste) hoặc viết lại hai phiên bản kiểm tra dữ liệu khác nhau giữa frontend và backend.

### Quy tắc 4: Tính toán tài chính bằng số nguyên lớn (BigInt Financial Arithmetic)
- Tuyệt đối không dùng số thực dấu phẩy động (`float` hay `Number`) để tính tiền nông sản có nhân hệ số suy giảm sinh học.
- Bắt buộc dùng `BigInt` với hằng số tỷ lệ `SCALE = 10_000_000n` và làm tròn nửa lên (`half-up`) tới hàng 100 đồng gần nhất. Điều này bảo đảm không bao giờ xảy ra lỗi làm tròn IEEE-754 tại các mốc phân định chất lượng $75\%$ và $40\%$.

### Quy tắc 5: Thiết kế công thái học nông thôn (Rural Ergonomics)
- Mọi vùng chạm (nút bấm, ô nhập) phải có kích thước tối thiểu `48x48 px`.
- Các ô nhập số tiền và khối lượng phải có thuộc tính `inputmode="numeric"` để điện thoại tự bật bàn phím số to rõ.
- Giao diện phải co giãn hoàn hảo trên màn hình hẹp `360 px` và không bao giờ xuất hiện thanh cuộn ngang ngoài ý muốn.

### Quy tắc 6: Bảo vệ dữ liệu cá nhân & An toàn bảo mật địa phương
- Không lưu công khai danh tính chủ tin; bảo vệ bằng mã nhận tin 4 số bí mật (`shortCode`).
- Xác thực mã PIN quản trị viên bằng thuật toán so sánh an toàn thời gian (`crypto.timingSafeEqual`) để chống nghe trộm thời gian phản hồi (timing attack).
- Mọi câu truy vấn SQLite bắt buộc dùng tham số (`?`), tuyệt đối không ghép chuỗi SQL để ngăn chặn hoàn toàn tấn công SQL Injection.

---

## 2. Những Điều AI Tuyệt Đối KHÔNG ĐƯỢC LÀM (Absolute Prohibitions)

1. **KHÔNG được tự ý chèn comment vào code:** Bất kỳ file mã nguồn nào bị phát hiện có comment sẽ bị kịch bản `scripts/verify-docs-and-bundle.mjs` từ chối biên dịch ngay lập tức.
2. **KHÔNG được làm giả hoặc hạ thấp tiêu chuẩn kiểm thử:** Khi gặp lỗi kiểm thử, phải tìm đúng nguyên nhân gốc rễ (root cause) để sửa code, không được sửa đổi file test để "cho qua chuyện" hay xóa bớt các ca kiểm tra biên.
3. **KHÔNG dùng `eval()` hoặc chèn chuỗi HTML nguy hiểm:** Không gán dữ liệu người dùng trực tiếp vào `innerHTML` mà phải dùng `textContent` hoặc hàm `createEl()` đã được khử trùng.
4. **KHÔNG phụ thuộc vào dịch vụ đám mây trả phí:** Không đề xuất tích hợp Firebase, Google Cloud API trả phí, Supabase hay AWS làm phát sinh chi phí hàng tháng cho nhà trường và học sinh.
5. **KHÔNG bịa đặt dữ liệu khoa học:** Số liệu khảo sát, kết quả đo lường độ trễ mạng, dung lượng gói tin và tỷ lệ chính xác của giọng nói phải phản ánh trung thực từ các bài thực nghiệm thực tế tại địa phương.
