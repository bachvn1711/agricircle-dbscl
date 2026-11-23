# RULES.md — Quy Tắc Dự Án & Những Điều AI Tuyệt Đối Không Được Làm
*Bộ quy tắc bảo đảm tính trung thực khoa học, tinh gọn mã nguồn và phù hợp với học sinh THCS*

---

## 1. Quy Tắc Kỹ Thuật Khi Viết Code (Coding Standards)

Mọi mã nguồn trong dự án AgriCircle phải tuân thủ nghiêm ngặt các quy tắc sau:

### Quy tắc 1: Tuyệt đối không viết chú thích trong code (ZERO CODE COMMENTS)
- **Cấm:** Không được viết bất kỳ dòng chú thích nào dạng `//`, `/* ... */` trong các tệp JavaScript (`.js`), CSS (`.css`), hoặc `<!-- ... -->` trong HTML (`.html`).
- **Lý do sư phạm & bảo trì:** Tránh việc chú thích cũ trong code bị lệch khi học sinh chỉnh sửa công thức và giao diện qua nhiều vòng thử nghiệm thực địa; đồng thời giữ gói giao diện tải xuống điện thoại nông dân luôn gọn nhẹ. Toàn bộ phần giải thích toán học và thuật toán cho học sinh THCS được tập trung chi tiết trong cuốn sổ tay kỹ thuật `docs/03-thcs-technical-guide.md`.

### Quy tắc 2: Không cài thêm thư viện rườm rà (Zero Extra Dependencies)
- Chỉ sử dụng duy nhất gói bản đồ mã nguồn mở `leaflet` v1.9.4 đã khai báo trong `package.json`.
- Tận dụng tối đa các tính năng có sẵn của trình duyệt và Node.js:
  - Máy chủ: `node:http`.
  - Cơ sở dữ liệu: `node:sqlite` (tích hợp sẵn, lưu thành 1 file `agricircle.db` gọn nhẹ).
  - Giao diện: JavaScript thuần (Vanilla JS), CSS biến (Variables), HTML ngữ nghĩa.

### Quy tắc 3: Thiết kế thân thiện cho người già & nông thôn (Rural Ergonomics)
- Mọi nút bấm, ô chọn phải có vùng chạm tối thiểu **48x48 px**, nút hành động chính to **54px**.
- Có các nút bấm chọn nhanh khối lượng 1 chạm không bắt người dùng phải gõ bàn phím số.
- Màu sắc tương phản cao, chữ to rõ ràng, đọc tốt dưới ánh nắng ngoài đồng.

### Quy tắc 4: Hoạt động được khi mất mạng ngoài đồng (Offline-First)
- Công cụ tính giá nông sản phải mở được và tính toán được ngay cả khi điện thoại không có sóng 4G/Wi-Fi nhờ bộ nhớ đệm Service Worker.

---

## 2. Quy Tắc Về Phạm Vi & Tính Chân Thực Của Học Sinh THCS (Scope & Integrity)

### Quy tắc 5: Đúng tầm vóc học sinh THCS (Age-Appropriate Scope)
- **Tuyệt đối không dùng các thuật ngữ hàn lâm công nghệ cao:** Không đưa vào báo cáo các thuật ngữ như *"triệt tiêu lỗi dấu phẩy động IEEE-754"*, *"kiến trúc Isomorphic đa tầng"*, *"mã hóa Crockford Base32"*, *"phòng thủ tấn công microsecond timing attack"*, *"BigInt arbitrary precision mathematics"*.
- **Tập trung vào tính thiết thực đời sống:** Nhấn mạnh vào:
  - Nỗi đau khói đốt đồng cay mắt bà con và ô nhiễm kênh rạch ở xã Cẩm Đường.
  - Kết quả khảo sát thực tế 30 hộ nông dân tại địa phương.
  - Các giải pháp thực tế giải quyết khó khăn của bà con: đường xe tải / ba gác / ghe vỏ lãi, rơm khô / rơm ướt, nút bấm to cho người già, tự khóa số điện thoại sau khi dọn ruộng xong để tránh làm phiền.
  - Sự phân công rõ ràng: Học sinh trực tiếp đi thực địa, phỏng vấn bà con, đề xuất giải pháp giao diện dễ bấm và thử nghiệm; Thầy giáo hướng dẫn hỗ trợ phương pháp nghiên cứu và cài đặt kỹ thuật nền tảng.

---

## 3. Những Điều AI Tuyệt Đối KHÔNG ĐƯỢC LÀM (Absolute Prohibitions)

1. **KHÔNG tự ý chèn comment vào code:** Kịch bản kiểm tra `scripts/verify-docs-and-bundle.mjs` sẽ báo lỗi ngay nếu phát hiện có comment trong tệp mã nguồn.
2. **KHÔNG hạ thấp tiêu chuẩn kiểm thử hoặc sửa bài test cho qua chuyện:** Phải duy trì toàn bộ 56+ bài kiểm thử tự động luôn chạy xanh lá trên mã nguồn thật.
3. **KHÔNG đề xuất dịch vụ đám mây trả phí:** Không dùng Firebase, Google Maps trả phí, AWS hay Supabase làm phát sinh hóa đơn tiền bạc cho trường học và gia đình học sinh.
4. **KHÔNG bịa đặt số liệu ảo:** Mọi số liệu trong báo cáo phải xuất phát từ bài khảo sát thực tế và các đo đạc thực nghiệm có thể kiểm chứng được.
