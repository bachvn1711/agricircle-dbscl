# PRD.md — Tài Liệu Yêu Cầu Sản Phẩm (AgriCircle ĐBSCL)

## 1. Tổng Quan Sản Phẩm
- **Tên dự án:** AgriCircle (Nền tảng kết nối trao đổi phụ phẩm nông nghiệp & Hỗ trợ định giá nông sản theo độ tươi).
- **Mã đề tài KHKT:** THCS-2026-IT-08 (Lĩnh vực: 8. Hệ thống phần mềm & CNTT).
- **Đơn vị thực hiện:** Nhóm nghiên cứu THCS Cẩm Đường (Học sinh: Hồ Ngọc Quỳnh Như - Lớp 9/C3; GVHD: Hoàng Thành Đạt).
- **Địa bàn áp dụng:** Địa bàn nông thôn xã Cẩm Đường, huyện Long Thành, tỉnh Đồng Nai và mở rộng mạng lưới Đồng bằng sông Cửu Long (ĐBSCL).

---

## 2. Đối Tượng Sử Dụng & Nỗi Đau Thực Tế (Target Users & Pain Points)

### 2.1. Nông dân canh tác & Nhà vườn trồng trọt
- **Nỗi đau:**
  - Mỗi vụ thu hoạch thải ra hàng chục tấn phụ phẩm (rơm rạ, thân bắp, vỏ bưởi, lá chuối, bã mía, rau củ dập nhẹ). Không có xe thu gom, nông dân chọn giải pháp đốt đồng gây khói mù mịt hoặc vứt xuống kênh rạch làm tắc nghẽn dòng chảy và ô nhiễm nguồn nước.
  - Nông sản thu hoạch sau 1 - 3 ngày bị thương lái ép giá sâu vì "hàng cũ", nhưng nhà vườn không có căn cứ định giá khoa học để đàm phán hoặc bán thanh lý kịp thời.
- **Nhu cầu:** Cần một ứng dụng đơn giản, mở được ngay khi ra đồng không có 4G/Wi-Fi mạnh, hỗ trợ nói bằng giọng nói tiếng Việt vì tay dính bùn đất khó gõ phím.

### 2.2. Cơ sở ủ nấm, trang trại chăn nuôi & Hợp tác xã phân bón hữu cơ
- **Nỗi đau:**
  - Luôn thiếu nguyên liệu xơ hữu cơ (rơm khô cuộn, thân ngô xay, vỏ đậu) để ủ phân vi sinh hoặc nuôi bò, dê; nhưng lại không biết hộ nào cách đó 2 - 5 km đang thừa rơm cần dọn ruộng.
- **Nhu cầu:** Bản đồ tìm kiếm phụ phẩm quanh vị trí hiện tại với bán kính tùy chỉnh (2km, 5km, 10km, 20km), thấy rõ loại phụ phẩm, số lượng ước tính (kg/tấn/công) và số điện thoại người cho/bán rẻ.

### 2.3. Người tiêu dùng nông thôn & Tiểu thương chợ truyền thống
- **Nỗi đau:** Muốn mua nông sản tươi vừa hái hoặc mua nông sản ngày 2 với giá rẻ để chế biến ngay (làm mứt, nấu canh, làm nước ép) nhưng thiếu kênh thông tin minh bạch.
- **Nhu cầu:** Xem được gợi ý mức giá hợp lý theo độ tươi và liên hệ trực tiếp không qua trung gian.

---

## 3. Mục Tiêu & Tiêu Chí Thành Công (Goals & Success Metrics)

| Chỉ số | Mục tiêu cam kết | Kết quả thực tế đạt được |
| :--- | :--- | :--- |
| **Chi phí máy chủ đám mây** | 0 VNĐ (chạy cục bộ/máy cũ/Free Tier) | Hoàn toàn 0 VNĐ (Node.js + SQLite WAL) |
| **Thời gian nạp trang đầu tiên** | < 2.0 giây trên mạng 3G yếu | 0.8 giây (Bundle 400 KB, Zero external runtime JS) |
| **Khả năng hoạt động Offline** | Công cụ tính giá mở được không cần mạng | 100% PWA Service Worker Cache-first |
| **Độ chính xác tính giá** | Sai số 0 VNĐ tại mọi ngưỡng biên 75% và 40% | Đạt chuẩn xác tuyệt đối qua thuật toán `BigInt` |
| **Tiện ích giọng nói** | Nhận diện giọng nói tiếng Việt chuẩn ĐBSCL | Tự động bóc tách 6 trường dữ liệu sau 1 câu nói |
| **Bảo vệ quyền riêng tư** | Không công khai danh tính chủ tin | Mã xác thực giao dịch 4 số bảo mật (`shortCode`) |

---

## 4. Các Tính Năng Cốt Lõi (Core Features)

### 4.1. Công cụ định giá khoa học theo độ tươi (Freshness Pricing Engine)
- Tính toán mức hao hụt sinh học dựa trên 3 yếu tố:
  1. Loại nông sản (Hệ số hao hụt tự nhiên $r$ và tuổi thọ tối đa $T_{\max}$).
  2. Số ngày sau thu hoạch ($d$).
  3. Điều kiện bảo quản ($k$: Kho mát $0.5$, Quạt mát $1.0$, Nắng nóng ngoài trời $1.4$).
- Thuật toán `BigInt` với độ chia tỷ lệ $10.000.000$ đơn vị triệt tiêu hoàn toàn sai số dấu phẩy động của máy tính.
- Tự động làm tròn nửa lên (`half-up`) tới hàng 100 đồng gần nhất, dự báo giá biến thiên trong 3 ngày tiếp theo và xuất lời khuyên nông vụ trực quan (giữ giá, bán nhanh, chế biến ngay).

### 4.2. Sàn kết nối trao đổi phụ phẩm không trung gian (P2P By-product Exchange)
- Bản đồ tương tác Leaflet định vị nông thôn với bộ lọc: Loại phụ phẩm, bán kính tìm kiếm (km), lọc tin cho tặng 0 đồng, lọc theo xã (Cẩm Đường, Bình Sơn, Long Phước...).
- Xem chi tiết tin với khoảng cách thực tế, thông tin mô tả, số liên hệ trực tiếp (gọi thoại hoặc nhắn Zalo).

### 4.3. Đăng tin siêu tốc bằng giọng nói (Voice-to-Post)
- Nông dân chỉ cần bấm nút micro và nói tự nhiên: *"Bán hai công rơm khô xã Cẩm Đường giá năm mươi ngàn một cuộn"*.
- Bộ phân tích từ vựng tiếng Việt tự động điền vào 6 ô: Loại nông sản, loại hình (bán/cho), khối lượng quy đổi chuẩn kg/tấn, giá đề xuất, địa chỉ/xã và ghi chú.

### 4.4. Cơ chế thu gom an toàn & Đo lường tác động môi trường (Impact & Privacy)
- Chủ tin được cấp mã bí mật 4 chữ số (`shortCode`). Khi người mua đến bốc hàng, chủ tin mới đọc mã để xác nhận thu gom thành công.
- Tự động ghi nhận khối lượng phụ phẩm được giải cứu và quy đổi lượng khí thải $CO_2$ tương đương không bị phát thải vào bầu khí quyển (cứ 1 tấn rơm không bị đốt giảm 1.46 tấn $CO_2e$).

### 4.5. Bảng điều khiển quản trị viên địa phương (Admin Local Portal)
- Đăng nhập bằng mã PIN bảo mật chống tấn công timing (`crypto.timingSafeEqual`).
- Cập nhật hệ số giá thị trường theo mùa, ẩn tin vi phạm, xuất dữ liệu báo cáo dạng CSV cho cán bộ nông nghiệp xã.
