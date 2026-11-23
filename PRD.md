# PRD.md — Tài Liệu Yêu Cầu Sản Phẩm (AgriCircle)
*Dự án Nghiên cứu Khoa học Kỹ thuật dành cho Học sinh THCS (Lĩnh vực: Phần mềm hệ thống & CNTT)*

---

## 1. Bạn Đang Xây Dựng Gì & Dành Cho Ai? (Product & Target Users)

### 1.1. Sản phẩm là gì?
**AgriCircle** là một ứng dụng web đơn giản (PWA), chạy trực tiếp trên điện thoại di động và máy tính theo mô hình **Vòng tròn Nông sản Tuần hoàn 3 Chặng**, giúp:
1. **Kết nối trao đổi phụ phẩm nông nghiệp tại chỗ:** Giúp nông dân có rơm rạ, thân bắp, vỏ trấu, rau củ dập nhẹ... tặng miễn phí hoặc bán rẻ cho các hộ trồng nấm rơm, nuôi bò, ủ phân vi sinh quanh vùng trong bán kính 3 - 20 km.
2. **Hỗ trợ định giá nông sản theo độ tươi & Chuyển hóa 1 chạm:** Giúp bà con tính toán mức giảm giá hợp lý theo số ngày sau thu hoạch để bán thanh lý nhanh ở Mức Vàng (thu hồi 55%–68% vốn), và khi chạm Mức Đỏ ($< 40\%$) có thể bấm 1 chạm **"Đẩy sang Sàn Phụ phẩm ngay"** để chuyển cho hộ chăn nuôi/ủ phân thay vì để thối hỏng phải đổ bỏ.

### 1.2. Dự án dành cho ai? (Đối tượng sử dụng)
- **Nông dân trồng lúa, trồng bắp, nhà vườn trồng cây ăn trái:** Sau mỗi vụ thu hoạch có nhiều rơm rạ, cành lá, phụ phẩm cần dọn sạch ruộng vườn để kịp gieo sạ vụ mới.
- **Hộ làm nấm rơm, trang trại chăn nuôi gia súc, cơ sở ủ phân hữu cơ:** Cần tìm mua hoặc xin rơm rạ, thân bắp gần nhà để giảm chi phí vận chuyển.
- **Tiểu thương chợ quê & người tiêu dùng địa phương:** Mua nông sản ngày 2, ngày 3 với giá thanh lý minh bạch để nấu canh, làm mứt, ép nước giải khát.

---

## 2. Nỗi Đau Thực Tế Của Bà Con Nông Dân Địa Phương (Pain Points)

Qua khảo sát thực tế 30 hộ nông dân tại địa bàn xã Xuân Đường mới (khu vực xã Cẩm Đường, Xuân Đường, Thừa Đức, tỉnh Đồng Nai), nhóm nghiên cứu học sinh ghi nhận 4 nỗi niềm lớn:
1. **Phụ phẩm bỏ phí hoặc đốt gây ô nhiễm:** Sau khi gặt lúa, rơm rạ chất đống ngoài đồng. Không ai đến gom thì bà con đành phải đốt đồng lộ thiên, khói mù mịt làm cay mắt, ngột ngạt xóm làng và cản trở giao thông; một số vứt xuống mương làm nghẽn dòng nước.
2. **Người già ngại dùng điện thoại thông minh:** 80% nông dân trực tiếp canh tác đã trên 50 tuổi. Chữ nhỏ trên màn hình nhìn không rõ, tay dính bùn đất khó gõ bàn phím số, các ứng dụng thương mại điện tử hiện nay quá phức tạp và bắt đăng ký tài khoản rườm rà.
3. **Đặc thù đường sá & chất lượng phụ phẩm nông thôn:**
   - Nhiều ruộng nằm sâu trong đồng, chỉ có đường đan cho xe ba gác hoặc phải chèo ghe/vỏ lãi. Nếu không ghi rõ loại đường, thương lái đánh xe tải lớn đến nơi không vào được sẽ quay đầu bỏ về.
   - Trại nấm rơm chỉ lấy rơm khô ráo; nếu rơm bị dầm mưa ướt sũng thì chỉ dùng làm phân vi sinh. Không mô tả rõ độ ẩm thì người đến gom không dùng được.
4. **Sợ bị gọi điện làm phiền sau khi dọn xong ruộng:** Bà con phản ánh đã từng đăng số điện thoại lên mạng xã hội, dù đã dọn xong ruộng từ 3 ngày trước nhưng vẫn liên tục bị người lạ gọi hỏi, gây phiền hà cho cuộc sống.

---

## 3. Mục Tiêu Thực Tế Của Dự Án Học Sinh (Realistic Goals)

| Tiêu chí | Mục tiêu phù hợp lứa tuổi THCS | Giải pháp thực tế |
| :--- | :--- | :--- |
| **Chi phí máy chủ** | **0 VNĐ** (hoàn toàn miễn phí) | Chạy thử nghiệm ngay trên máy tính phòng tin học nhà trường hoặc máy cá nhân, dùng SQLite lưu dữ liệu thành 1 tệp nhẹ. |
| **Dùng được ngoài đồng** | Mở được khi sóng 3G yếu hoặc mất mạng | Công nghệ PWA lưu đệm sẵn, ra giữa ruộng lúa vẫn mở máy tính tính giá được bình thường. |
| **Tiện lợi cho người già** | Không cần gõ phím phức tạp | Hỗ trợ nút micro nói tiếng Việt mộc mạc và 4 nút chọn nhanh số lượng 1 chạm (1 công, 2 công, 5 công, 1 tấn). |
| **Thông tin thiết thực** | Nhìn vào biết ngay xe vào được không | Huy hiệu trực quan hiển thị loại đường (Xe tải, Ba gác, Ghe thuyền) và độ ẩm rơm (Khô ráo, Hơi ẩm, Ướt mưa). |
| **Bảo vệ bà con** | Không bị làm phiền sau khi gom | Khi người lấy đến gom xong và nhập mã xác nhận, tin lập tức biến mất khỏi bản đồ và tự động khóa số điện thoại. |

---

## 4. Các Tính Năng Cốt Lõi (Core Features)

### 4.1. Bản đồ phụ phẩm nông nghiệp trực quan
- Hiển thị các điểm có rơm rạ, thân bắp, vỏ trấu quanh vị trí của người dùng bằng bản đồ vệ tinh/đường sá dễ nhìn.
- Bộ lọc đơn giản: Tìm theo loại phụ phẩm (Rơm rạ, Thân bắp...), tìm tin cho miễn phí (0 đồng), và chọn bán kính gần nhà (3km, 5km, 10km, 20km).
- Xem thông tin rõ ràng: Khoảng cách bao xa, đường xe gì vào được, rơm khô hay ướt, và nút bấm gọi điện thoại/nhắn Zalo trực tiếp.

### 4.2. Máy tính định giá nông sản theo độ tươi & Cầu nối sang Phụ phẩm
- Dựa trên quan sát thực nghiệm về sự hao hụt tự nhiên của 10 loại rau củ quả nhiệt đới khảo sát mặc định (Cà chua, Rau muống, Xoài cát, Bưởi da xanh, Sầu riêng, Mít Thái, Cải xanh, Dưa leo, Khoai lang, Cam sành) cùng chế độ *"🌱 Nông sản khác"* tự nhập.
- Nông dân chỉ cần chọn loại quả, số ngày sau khi hái (0, 1, 2, 3, 5 ngày...) và nơi để (Kho lạnh, Quạt mát hay Ngoài trời nắng nóng).
- Máy tính đưa ra mức giá khuyến nghị đã làm tròn chẵn trăm đồng, thanh đồng hồ độ tươi 3 vùng màu (Xanh - Vàng - Đỏ), biểu đồ dự báo 3 ngày tới và nút **"Đẩy sang Sàn Phụ phẩm ngay"** khi chạm Mức Đỏ.

### 4.3. Đăng tin cực nhanh bằng giọng nói tiếng Việt & Nút bấm 1 chạm
- Nông dân chỉ cần bấm nút micro to tròn và nói một câu tự nhiên: *"Tôi có hai công rơm khô xã Cẩm Đường cho miễn phí"*.
- Máy tự động nhận dạng và điền vào các ô: Tên nông sản, Cho/Bán, Số lượng, Địa chỉ.
- Có sẵn 4 nút bấm to chọn nhanh số lượng: `[🌾 1 Công]`, `[🌾 2 Công]`, `[🌾 5 Công]`, `[📦 1 Tấn]`.
- Thẻ xem trước trực quan (Preview Card) hiển thị to rõ nội dung để bà con kiểm tra kỹ trước khi bấm nút xác nhận to 54px: *"Đồng ý Đăng lên Bản đồ ngay 🚀"*.

### 4.4. Cơ chế thu gom xong & Khóa liên lạc tự động
- Khi đăng tin, nông dân nhận được một mã bí mật gồm 4 chữ số.
- Khi người mua hoặc người xin đến gom rơm xong, hai bên kiểm tra hàng và nhập mã này vào hệ thống.
- Tin đăng lập tức chuyển sang trạng thái "Đã thu gom", biến mất khỏi bản đồ tìm kiếm và khóa tính năng gọi điện thoại/Zalo để không ai làm phiền chủ ruộng nữa.

### 4.5. Bảng ghi nhận công sức bảo vệ môi trường
- Tự động cộng dồn số kg phụ phẩm đã được kết nối tái sử dụng thay vì bị đốt bỏ.
- Ước tính lượng khí thải $CO_2$ và khói bụi giảm thiểu cho địa phương, giúp các bạn học sinh và bà con thấy được ý nghĩa thiết thực của hành động bảo vệ môi trường làng quê.
