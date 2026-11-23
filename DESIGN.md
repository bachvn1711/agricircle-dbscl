# DESIGN.md — Quy Chuẩn Thiết Kế Giao Diện (AgriCircle)
*Thiết kế thân thiện, dễ nhìn, dễ bấm dành cho nông dân lớn tuổi và vùng nông thôn*

---

## 1. Triết Lý Thiết Kế Nông Thôn (Rural Ergonomics)

Hệ thống AgriCircle được thiết kế dựa trên phản hồi thực tế từ các bác nông dân tại xã Cẩm Đường:
1. **Dễ đọc dưới trời nắng gắt:** Màu sắc tương phản cao (đạt chuẩn WCAG AAA với tỷ lệ tương phản tối thiểu 7:1), chữ màu sẫm trên nền sáng, không dùng các tông màu nhạt gây lóa mắt ngoài đồng ruộng.
2. **Nút bấm to cho tay dính đất cát:** Mọi vùng chạm (nút bấm, ô chọn) có kích thước tối thiểu **48x48 px**, nút hành động chính to **54px**, hỗ trợ bấm 1 chạm dễ dàng mà không bị trượt ngón tay.
3. **Không cần gõ bàn phím số:** Người già ngại gõ số và dấu phẩy, hệ thống chuẩn bị sẵn các **chip chọn nhanh 1 chạm** (`1 Công`, `2 Công`, `5 Công`, `1 Tấn`).
4. **Trực quan, dễ hiểu:** Dùng huy hiệu màu sắc và biểu tượng quen thuộc (xe tải 🚛, ba gác 🛺, ghe thuyền 🛶, rơm khô ☀️, rơm ướt 🌧️) thay vì các bảng chữ dài dòng.

---

## 2. Bảng Màu Thân Thiện Với Nông Nghiệp (Color Palette)

| Tên biến CSS | Mã màu HEX | Ý nghĩa nông thôn | Cảm giác mang lại |
| :--- | :--- | :--- | :--- |
| `--green-primary` | `#1b5e20` | Màu xanh lá cây đậm của đồng ruộng | Gần gũi, tin cậy, vững chãi |
| `--green-accent` | `#2e7d32` | Màu xanh mạ non khi lúa trổ đòng | Tươi mới, tích cực, nông sản loại 1 |
| `--green-light` | `#e8f5e9` | Nền nhạt cho thông báo thành công | Êm dịu, mát mắt |
| `--amber` | `#e65100` | Màu cam vàng của rơm rạ mùa gặt | Nông sản cần bán nhanh trong 1 - 2 ngày |
| `--amber-light` | `#fff3e0` | Nền nhạt cho cảnh báo nhẹ | Dễ nhận diện |
| `--danger` | `#c62828` | Màu đỏ gạch cảnh báo | Báo lỗi hoặc nông sản đã quá ngày |
| `--bg-body` | `#f9fbf7` | Màu nền ngà lúa non dịu nhẹ | Giảm mỏi mắt khi nhìn lâu ngoài trời |
| `--surface` | `#ffffff` | Nền trắng thẻ thông tin | Tương phản tốt, chữ rõ ràng |
| `--text-main` | `#1a201c` | Màu xám đen đậm tự nhiên | Dễ đọc hơn màu đen tuyền gắt gỏng |
| `--text-muted` | `#4a554e` | Màu chữ phụ (khoảng cách km, ngày hái) | Đọc rõ, không bị mờ |

---

## 3. Cỡ Chữ & Phông Chữ Dành Cho Người Già (Typography)

- **Phông chữ mặc định của máy:** Dùng trực tiếp phông chữ sẵn có của điện thoại (`system font stack`), không tải thêm phông chữ nặng từ mạng giúp mở trang cực nhanh.
- **Cỡ chữ nhập liệu:** Tối thiểu **16px** để khi bấm vào ô nhập, điện thoại không bị tự động phóng to làm lệch khung nhìn.
- **Tiêu đề và chữ to:**
  - Tiêu đề màn hình: 20px - 22px, in đậm rõ ràng.
  - Chữ nội dung: 16px, khoảng cách dòng thoáng (1.5) để mắt người lớn tuổi không bị nhầm dòng.
  - Giá tiền và số lượng: In đậm, cỡ chữ 18px - 24px nổi bật.

---

## 4. Các Thành Phần Giao Diện Đặc Thù (Custom UI Components)

### 4.1. Nút thu âm Micro to bản (Big Voice Button)
- Nút tròn đường kính **64px**, đặt ở vị trí ngón tay cái dễ bấm.
- Khi đang thu âm, nút chuyển màu đỏ và có hiệu ứng vòng sóng âm nhấp nháy để người dùng biết máy đang nghe.

### 4.2. Hàng nút chọn nhanh khối lượng 1 chạm (Quick Quantity Chips)
- Đặt ngay dưới ô nhập số lượng, gồm 4 nút bấm to nổi 3D:
  - `[🌾 1 Công (~556 kg)]`
  - `[🌾 2 Công (~1.111 kg)]` — Lựa chọn phổ biến nhất ở địa phương
  - `[🌾 5 Công (~2.778 kg)]`
  - `[📦 1 Tấn (1.000 kg)]`
- Bấm vào nút nào, hệ thống tự động điền số lượng và đơn vị tương ứng tức thì.

### 4.3. Bộ nút chọn phương tiện tiếp cận & Trạng thái rơm rạ
- **Phương tiện vào ruộng:**
  - 🚛 `Xe tải`: Đường nhựa, bê tông lớn.
  - 🛺 `Ba gác`: Đường đan, cầu bê tông nhỏ.
  - 🚜 `Máy cày / Ghe đường nhỏ`: Đường rẫy đất đỏ lầy lội hoặc mương rạch nhỏ.
- **Độ ẩm phụ phẩm:**
  - ☀️ `Khô ráo`: Rơm vừa cắt, sạch sẽ (dành cho làm nấm rơm).
  - ⛅ `Hơi ẩm`: Cắt 1-2 ngày.
  - 🌧️ `Ướt dầm mưa`: Dùng để ủ phân vi sinh.

### 4.4. Thẻ xem lại trước khi đăng (Preview Confirmation Card)
- Khung thẻ màu xanh nhạt nổi bật tóm tắt ngắn gọn:
  *"Bác chuẩn bị đăng: 2 Công Rơm rạ tại Xã Cẩm Đường — Cho miễn phí — Xe ba gác vào được."*
- Giúp nông dân yên tâm kiểm tra lại thông tin trước khi nhấn nút to 54px: *"Đồng ý Đăng lên Bản đồ ngay 🚀"*.

### 4.5. Thẻ đóng tin sau khi thu gom (Auto-masking Badge)
- Khi tin đã thu gom xong, thẻ tin chuyển sang màu xám nhạt với huy hiệu xanh lá:
  *`✅ Đã thu gom xong vào lúc [giờ, ngày]. Nông dân đã dọn sạch ruộng.`*
- Hai nút "Gọi điện thoại" và "Mở Zalo" tự động ẩn đi hoặc bị khóa lại, ngăn chặn hoàn toàn việc gọi điện làm phiền.
