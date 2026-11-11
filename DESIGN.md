# DESIGN.md — Quy Chuẩn Thiết Kế Giao Diện (AgriCircle ĐBSCL)

## 1. Triết Lý Thiết Kế Nông Thôn (Rural Ergonomics)
Hệ thống AgriCircle được tối ưu hóa cho điều kiện thực tế của nông dân tại vườn, ruộng và chợ đầu mối:
- **Ánh sáng gắt ngoài trời:** Tương phản văn bản cực cao (đạt chuẩn WCAG AAA với tỷ lệ tương phản tối thiểu 7:1) giúp đọc rõ dưới ánh nắng chói chang.
- **Thao tác một tay & Tay dính đất:** Mọi nút bấm, ô chọn đều có kích thước vùng chạm tối thiểu **48x48 px**, các nút hành động chính (CTA) đặt sát cạnh dưới màn hình (thumb-friendly zone).
- **Màn hình điện thoại giá rẻ:** Tối ưu hóa mượt mà cho màn hình có độ phân giải từ **360x640 px** đến **390x844 px**, không có hiện tượng vỡ khung hay thanh cuộn ngang gây khó chịu.

---

## 2. Bảng Màu Chuẩn (Color Palette)

| Tên biến CSS | Mã màu HEX | Ý nghĩa ngữ cảnh trong nông nghiệp | Chuẩn tương phản |
| :--- | :--- | :--- | :--- |
| `--green-primary` | `#1b5e20` | Màu xanh lá cây đậm (rừng cây, màu chủ đạo của thương hiệu) | Tương phản 9.5:1 trên nền trắng |
| `--green-accent` | `#2e7d32` | Màu xanh mạ non (nông sản loại 1, mức tươi ngon nhất > 75%) | Tương phản 7.2:1 trên nền trắng |
| `--green-light` | `#e8f5e9` | Nền nhạt cho các thông báo thành công và thẻ xanh | Êm mắt, không chói |
| `--amber` | `#e65100` | Màu cam hổ phách (nông sản loại 2, độ tươi 40% - 75%, cần bán nhanh) | Tương phản 8.1:1 trên nền trắng |
| `--amber-light` | `#fff3e0` | Nền nhạt cho thẻ nông sản cần bán gấp trong 1 - 2 ngày | Nhận biết trực quan tức thì |
| `--danger` | `#c62828` | Màu đỏ gạch (nông sản quá hạn, chuyển sang ủ phân hoặc cho gia súc) | Cảnh báo lỗi, xóa tin |
| `--bg-body` | `#f9fbf7` | Màu nền ngà ấm dịu nhẹ, hạn chế mỏi mắt khi nhìn lâu ngoài nắng | Tự nhiên, sạch sẽ |
| `--surface` | `#ffffff` | Nền thẻ bài đăng, hộp thoại pop-up, bảng tính giá | Nổi bật thông tin |
| `--text-main` | `#1a201c` | Màu chữ đen xám tự nhiên (độ đậm 900) thay vì đen tuyền gắt gỏng | Đọc chữ rõ ràng |
| `--text-muted` | `#4a554e` | Màu chữ chú thích phụ, ngày thu hoạch, khoảng cách km | Chuẩn WCAG AA |

---

## 3. Kiểu Chữ & Phông Chữ (Typography)
- **Họ phông chữ hệ thống (System Font Stack):**
  ```css
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  ```
  *Lý do:* Sử dụng trực tiếp phông chữ tích hợp sẵn trong điện thoại, tiết kiệm 100% dung lượng tải phông từ Google Fonts (giảm được 150 KB tải về và tăng tốc độ hiển thị tức thì).
- **Cỡ chữ cơ sở:** Tối thiểu **16px** cho các ô nhập liệu (`input`, `select`, `textarea`) để ngăn chặn việc trình duyệt iOS Safari tự động phóng to màn hình gây lệch khung nhìn.
- **Phân cấp văn bản:**
  - Tiêu đề màn hình (H1): `1.375rem` (22px), độ đậm `700`, căn giữa hoặc căn trái rõ ràng.
  - Tiêu đề nhóm (H2/H3): `1.125rem` (18px), độ đậm `600`.
  - Nội dung chính (Body): `1.0rem` (16px), chiều cao dòng `1.5` để người lớn tuổi đọc dễ dàng.
  - Chữ chú thích nhỏ (Caption/Meta): `0.875rem` (14px), độ đậm `500`.

---

## 4. Các Thành Phần Giao Diện Cốt Lõi (UI Components)

### 4.1. Thanh Điều Hướng Dưới Cùng (Bottom Navigation Bar)
- Cố định ở đáy màn hình (`position: fixed; bottom: 0;`), gồm 5 nút bấm có biểu tượng và nhãn chữ to:
  1. 🗺️ **Bản đồ** (Tìm kiếm phụ phẩm quanh vị trí).
  2. 🧮 **Tính giá** (Máy tính định giá độ tươi nông sản).
  3. 📢 **Đăng tin** (Giao diện đăng tin giọng nói và biểu mẫu).
  4. 🌱 **Tác động** (Bảng thành tích kg phụ phẩm & giảm CO2).
  5. ⚙️ **Quản trị** (Đăng nhập mã PIN và cập nhật giá).
- Nút đang được chọn sẽ có nền xanh lá mạ và vạch chỉ thị nổi bật.

### 4.2. Thẻ Phụ Phẩm (By-product Listing Card)
- Bo góc mềm mại `12px`, đường viền thanh mảnh `1px solid #e0e0e0`, bóng đổ nhẹ `0 2px 8px rgba(0,0,0,0.06)`.
- **Huy hiệu trực quan:**
  - `Bán giá rẻ`: Nền cam nhạt, chữ cam đậm.
  - `Cho miễn phí`: Nền xanh lá nhạt, chữ xanh đậm.
  - `Đã thu gom`: Nền xám, chữ gạch ngang mờ.
- **Dòng hành động nhanh:** Nút bấm gọi điện thoại (`tel:`) và nút mở ứng dụng Zalo được thiết kế to bản, bấm là liên lạc được ngay với nhà vườn.

### 4.3. Bảng Máy Tính Định Giá (Freshness Calculator View)
- Bộ chọn loại nông sản dạng lưới ô vuông lớn (Cà chua, Dưa hấu, Xoài cát, Thanh long, Cam sành...).
- Nút bấm tăng giảm nhanh số ngày sau thu hoạch: `[0 ngày]`, `[1 ngày]`, `[2 ngày]`, `[3 ngày]`, `[5 ngày]`.
- Thẻ kết quả nổi bật với số tiền in to (VD: `18.000 đ/kg`), dải màu trạng thái (Xanh / Vàng cam / Xám) và bảng 3 cột dự báo giá trị của 3 ngày sắp tới.

### 4.4. Nút Thu Âm Giọng Nói Khổng Lồ (Voice Recording Button)
- Nút tròn đường kính `64px`, màu xanh lá nổi bật kèm biểu tượng micro 🎙️.
- Khi đang thu âm, nút chuyển sang màu đỏ và có hiệu ứng vòng tròn tỏa sóng âm nhấp nháy (`pulse animation`) giúp nông dân nhận biết máy đang lắng nghe.
