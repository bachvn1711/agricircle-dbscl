# DÀN Ý BÀI THUYẾT TRÌNH POWERPOINT CUỘC THI KHKT CẤP THCS
**Đề tài:** XÂY DỰNG NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI (AgriCircle)  
**Lĩnh vực:** 8: Công nghệ thông tin  
**Tác giả:** Học sinh Hồ Ngọc Quỳnh Như (Lớp 9/C3) — **Trường:** THCS Cẩm Đường  
**Giáo viên hướng dẫn:** Thầy Hoàng Thành Đạt (TCM Khoa học Tự nhiên – Công nghệ)  
**Thời lượng thuyết trình chuẩn:** 8 – 10 phút (kèm 5 phút trả lời câu hỏi của Ban Giám khảo)  

---

## CẤU TRÚC TỔNG THỂ 12 SLIDE BẢO VỆ ĐỀ TÀI

```
Slide 1: Trang bìa & Giới thiệu đề tài
Slide 2: Nỗi đau thực tiễn tại Cẩm Đường (Đốt đồng & Ép giá nông sản)
Slide 3: Mục tiêu nghiên cứu & Câu hỏi khoa học
Slide 4: Cơ sở khoa học: Sinh lý sau thu hoạch & Toán học BigInt
Slide 5: Triết lý giải pháp: Zero Cloud Cost & Rural Ergonomics
Slide 6: Kiến trúc hệ thống 3 tầng (Isomorphic Domain, SQLite WAL, PWA)
Slide 7: Tính năng 1: Máy tính định giá độ tươi & Dự báo 3 ngày
Slide 8: Tính năng 2: Đăng tin bằng giọng nói tiếng Việt một chạm
Slide 9: Tính năng 3: Bản đồ nông thôn & Thu gom an toàn mã 4 số
Slide 10: Bảng tác động giảm phát thải CO₂ & Thống kê thực tế
Slide 11: Kết quả kiểm thử tự động & Thử nghiệm thực địa tại Cẩm Đường
Slide 12: Tính mới, Khả năng nhân rộng & Lời cảm ơn
```

---

### CHI TIẾT TỪNG SLIDE & LỜI THOẠI THUYẾT TRÌNH (SPEAKER NOTES)

#### SLIDE 1: TRANG BÌA & GIỚI THIỆU ĐỀ TÀI
- **Tiêu đề lớn:** NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI
- **Tên thương hiệu:** AgriCircle (Kinh tế tuần hoàn nông nghiệp địa phương)
- **Thông tin:** Học sinh: Hồ Ngọc Quỳnh Như (Lớp 9/C3, Trường THCS Cẩm Đường) — GVHD: Thầy Hoàng Thành Đạt
- **Hình ảnh visual:** Logo AgriCircle hình mầm cây và vòng tuần hoàn màu xanh lá, bên cạnh là ruộng lúa vàng và cánh buồm công nghệ.
- **Lời thuyết trình học sinh (45 giây):**  
  *"Kính thưa Ban Giám khảo và quý thầy cô, em là Hồ Ngọc Quỳnh Như, học sinh lớp 9/C3 Trường THCS Cẩm Đường. Sinh ra và lớn lên tại vùng nông nghiệp huyện Long Thành, mỗi mùa thu hoạch em đều chứng kiến hai nỗi trăn trở lớn của bà con nông dân quê mình: một là hàng tấn rơm rạ, thân bắp bị đốt đỏ rực ngoài đồng gây khói bụi mù mịt; hai là nông sản hái xong nếu trễ 1, 2 ngày là bị thương lái ép giá rẻ như cho. Từ thực tế đó, dưới sự hướng dẫn của thầy Hoàng Thành Đạt, em đã xây dựng đề tài AgriCircle — nền tảng số hóa chạy ngoại tuyến 0 đồng nhằm kết nối phụ phẩm và định giá khoa học theo độ tươi. Sau đây em xin kính mời Ban Giám khảo cùng theo dõi bài báo cáo của em."*

---

#### SLIDE 2: NỖI ĐAU THỰC TIỄN TẠI CẨM ĐƯỜNG & VÙNG ĐBSCL
- **Bố cục 2 cột so sánh:**
  - *Cột 1 (Vấn đề Phụ phẩm):* 27 triệu tấn phụ phẩm đốt/vứt bỏ mỗi năm; khói bụi $PM_{2.5}$; ô nhiễm nguồn nước mương rạch; nguy cơ cháy lan và khí nhà kính.
  - *Cột 2 (Vấn đề Nông sản):* Hao hụt tự nhiên 15 - 30%; không có kho lạnh; thương lái ép giảm giá 30 - 50% sau ngày 1; đổ bỏ hàng loại 2 gây lãng phí.
- **Biểu đồ khảo sát:** Kết quả khảo sát 30 hộ dân tại Cẩm Đường: 73.3% đốt đồng vì không có ai gom; 86.7% tự đoán mò giá bán khi nông sản trễ ngày.
- **Lời thuyết trình (60 giây):**  
  *"Qua khảo sát thực tế 30 hộ dân tại xã Cẩm Đường, hơn 70% bà con cho biết đốt đồng là giải pháp duy nhất vì cần dọn ruộng gấp cho vụ sau mà không biết ai cần gom. Trong khi đó, các trại nấm rơm và trại nuôi bò cách đó chỉ 3 cây số lại đỏ mắt tìm mua rơm với giá đắt đỏ. Đồng thời, khi thanh long, dưa hấu hay cà chua bị trễ ngày thu hoạch, bà con hoàn toàn mù mờ về mức giá khoa học, thường bị ép giá hoặc đành bấm bụng vứt đi. Đây là khoảng trống thông tin rất lớn mà các sàn thương mại điện tử lớn hiện nay chưa giải quyết được."*

---

#### SLIDE 3: MỤC TIÊU NGHIÊN CỨU & CÂU HỎI KHOA HỌC
- **Mục tiêu chung:** Xây dựng giải pháp phần mềm nhẹ, dễ dùng, chạy được khi mất mạng, kết nối trực tiếp cung - cầu phụ phẩm và lượng hóa độ tươi nông sản.
- **3 Câu hỏi nghiên cứu then chốt:**
  1. Làm sao định giá nông sản công bằng, khoa học mà máy tính không bao giờ bị sai số làm tròn tiền tệ?
  2. Làm sao để người nông dân tay dính bùn đất có thể đăng tin trong 10 giây mà không cần gõ chữ?
  3. Làm sao triển khai phần mềm cho trường học và xã với chi phí máy chủ đúng bằng 0 đồng?
- **Lời thuyết trình (45 giây):**  
  *"Đề tài của em đặt mục tiêu giải quyết 3 bài toán cụ thể: Định giá công bằng bằng toán học; Đăng tin siêu tốc bằng giọng nói tiếng Việt; và Chi phí vận hành máy chủ 0 đồng. Đây là những tiêu chí sống còn để một sản phẩm công nghệ có thể thực sự đi vào đời sống của người nông dân."*

---

#### SLIDE 4: CƠ SỞ KHOA HỌC — SINH LÝ HỌC & TOÁN HỌC `BigInt`
- **Cơ sở sinh học sau thu hoạch:** Nông sản tiếp tục hô hấp tế bào $\rightarrow$ Mất nước, phân hủy diệp lục, suy giảm đường hữu cơ.
- **Công thức lượng hóa độ tươi:**
  $$V_{\text{scaled}} = \max(0,\; 10.000.000 - r_{\text{micro}} \cdot k_{\text{deci}} \cdot d)$$
  - $r$: Hệ số suy giảm sinh học theo từng loại quả (Cà chua $5\%$, Dưa hấu $3.3\%$, Xoài $7\%$).
  - $k$: Hệ số điều kiện bảo quản (Kho mát $0.5$, Quạt mát $1.0$, Phơi nắng $1.4$).
  - $d$: Số ngày sau khi hái.
- **Đột phá toán học `BigInt`:** Nhân độ chia tỷ lệ $10.000.000$ đơn vị $\rightarrow$ Triệt tiêu hoàn toàn sai số dấu phẩy động IEEE-754 tại các mốc biên 75% và 40%.
- **Lời thuyết trình (60 giây):**  
  *"Kính thưa Ban Giám khảo, điểm tựa khoa học của đề tài nằm ở việc kết hợp giữa sinh lý học thực vật sau thu hoạch và toán học máy tính. Nếu dùng số thập phân thông thường trong lập trình, máy tính sẽ sinh ra sai số làm tròn tiền tệ. Em đã áp dụng kiểu dữ liệu số nguyên lớn `BigInt` với tỷ lệ 10 triệu đơn vị và làm tròn nửa lên đến hàng trăm đồng. Nhờ vậy, công thức cho ra giá khuyến nghị và bảng dự báo 3 ngày tiếp theo chính xác đến từng đồng trên mọi thiết bị."*

---

#### SLIDE 5: TRIẾT LÝ THIẾT KẾ NÔNG THÔN (RURAL ERGONOMICS) & 0 ĐỒNG
- **Bảng so sánh 3 tiêu chuẩn:**
  1. *Độ tương phản cao WCAG AAA:* Nền xanh đồng nội `#1b5e20`, chữ đen đậm trên nền ngà `#f9fbf7`, đọc rõ dưới nắng $35^\circ\text{C}$.
  2. *Vùng chạm ngón tay:* Tất cả các nút bấm tối thiểu **48x48 px**, bàn phím số tự bật (`inputmode="numeric"`).
  3. *Zero Cloud Cost:* Sử dụng Node.js native và `node:sqlite` WAL mode. Không thuê máy chủ đám mây, tận dụng máy tính cũ của trường học.
- **Lời thuyết trình (45 giây):**  
  *"Em thiết kế giao diện theo triết lý 'Công thái học nông thôn'. Nông dân lớn tuổi mắt kém hoặc ra đồng nắng chói vẫn đọc rõ từng con số nhờ độ tương phản cao đạt chuẩn WCAG AAA. Các nút bấm to bản từ 48 pixel trở lên giúp ngón tay thô ráp, dính đất vẫn chạm chính xác một lần ăn ngay."*

---

#### SLIDE 6: KIẾN TRÚC HỆ THỐNG 3 TẦNG (SYSTEM ARCHITECTURE)
- **Sơ đồ khối 3 tầng:**
  - *Tầng 1: Tầng dùng chung (Isomorphic Shared Domain):* Quy tắc kiểm tra dữ liệu, công thức BigInt, Haversine tọa độ.
  - *Tầng 2: Tầng máy chủ (Native Node.js & SQLite):* Ghi nhật ký WAL, xác thực mã PIN an toàn thời gian, sinh mã 4 số bảo mật.
  - *Tầng 3: Tầng giao diện (PWA & Service Worker):* Bộ nhớ đệm Cache-First, hoạt động ngoại tuyến khi mất sóng Internet, bản đồ Leaflet.
- **Lời thuyết trình (45 giây):**  
  *"Toàn bộ hệ thống được xây dựng trên kiến trúc Isomorphic — nghĩa là logic tính giá và kiểm tra dữ liệu được chia sẻ nguyên vẹn giữa máy chủ và điện thoại. Nhờ Service Worker, khi mất mạng 4G ngoài ruộng, giao diện Tính giá vẫn nạp tức thì từ bộ nhớ đệm của điện thoại chỉ trong 0.1 giây."*

---

#### SLIDE 7: TÍNH NĂNG 1 — MÁY TÍNH ĐỊNH GIÁ ĐỘ TƯƠI TRỰC QUAN
- **Hình ảnh giao diện thực tế:**
  - Lưới chọn 10 loại quả nhiệt đới (Cà chua, Dưa hấu, Xoài...).
  - Nút bấm chọn nhanh số ngày: `0 ngày`, `1 ngày`, `2 ngày`, `3 ngày`, `5 ngày`.
  - Hộp kết quả: Số tiền to rõ (`18.000 đ/kg`), huy hiệu trạng thái (Xanh mạ > 75%, Cam hổ phách 40 - 75%, Xám tro < 40%).
  - Biểu đồ dự báo giá 3 ngày tiếp theo và lời khuyên hành động nông vụ (bán nhanh hoặc chế biến ngay).
- **Lời thuyết trình (60 giây):**  
  *"Đây là màn hình máy tính định giá. Người bán chỉ cần chạm chọn quả cà chua, bấm số ngày hái là 2 ngày và chọn quạt mát. Ngay lập tức, hệ thống báo giá gợi ý là 18.000 đồng/kg, giảm 10% so với giá hái tại vườn. Đặc biệt, bảng dự báo 3 ngày tới chỉ rõ: đến ngày thứ 4 giá sẽ rớt xuống vùng màu cam, khuyên bà con nên thanh lý trong hôm nay để không bị lỗ vốn."*

---

#### SLIDE 8: TÍNH NĂNG 2 — ĐĂNG TIN BẰNG GIỌNG NÓI TIẾNG VIỆT SIÊU TỐC
- **Hình ảnh giao diện:** Nút micro khổng lồ 64px có sóng âm nhấp nháy; ô văn bản tự điền.
- **Cơ chế bóc tách tự động (Regex Entity Extraction):**
  - Câu nói mẫu của nông dân: *"Bán hai công rơm khô ấp 1 Cẩm Đường giá năm mươi ngàn một cuộn"*
  - $\rightarrow$ Máy tự động bóc tách:
    + Loại phụ phẩm: `Rơm rạ`
    + Hình thức: `Bán giá rẻ`
    + Khối lượng: `2 công` (tự quy đổi = $1.111\text{ kg}$)
    + Giá bán: `50.000 đ/cuộn`
    + Địa chỉ: `Ấp 1, Xã Cẩm Đường`
- **Lời thuyết trình (60 giây):**  
  *"Bà con nông dân rất ngại gõ bàn phím chữ cái nhỏ. Em đã tích hợp Web Speech API tiếng Việt kết hợp bộ bóc tách ngôn ngữ tự nhiên do em tự viết. Bà con chỉ cần bấm nút micro và nói đúng một câu khẩu ngữ quen thuộc. Trong vòng chưa đầy 1 giây, phần mềm tự động điền đầy đủ 6 ô thông tin. Người dùng chỉ cần liếc mắt kiểm tra và bấm 'Đăng tin lên bản đồ'."*

---

#### SLIDE 9: TÍNH NĂNG 3 — BẢN ĐỒ PHỤ PHẨM & MÃ XÁC THỰC 4 SỐ BÍ MẬT
- **Bản đồ vệ tinh Leaflet:** Các ghim màu định vị vị trí phụ phẩm (Rơm, Thân ngô, Vỏ chuối...).
- **Bộ lọc thông minh:** Lọc bán kính (2km, 5km, 10km), lọc tin cho tặng 0 đồng, chọn nhanh các xã (Cẩm Đường, Bình Sơn, Long Phước).
- **Cơ chế bảo mật mã nhận tin 4 số (`shortCode`):**
  - Người mua gọi điện / nhắn Zalo thỏa thuận và đến bốc hàng.
  - Người bán giữ mã 4 số bí mật (ví dụ: `8K4M`). Chỉ khi người mua đến tận nơi chất hàng lên xe, người bán mới đọc mã để người mua bấm xác nhận thu gom.
  - Bảo vệ quyền riêng tư, tránh tình trạng tin ảo hoặc bị lộ danh tính.
- **Lời thuyết trình (60 giây):**  
  *"Trên màn hình Bản đồ, người cần mua rơm như các chủ trại nấm chỉ cần kéo thanh bán kính 5 km là thấy ngay những ruộng rơm quanh mình. Để bảo đảm an toàn, em thiết kế cơ chế 'bắt tay 4 số'. Người bán giữ mã số bí mật, khi người mua tới ruộng bốc hàng xong xuôi thì người bán mới đọc mã để xác nhận giao dịch thành công. Tin đăng sẽ lập tức tự đổi trạng thái sang 'Đã thu gom'."*

---

#### SLIDE 10: TÁC ĐỘNG MÔI TRƯỜNG & ĐO LƯỜNG $CO_2$ CẮT GIẢM
- **Bảng thành tích cộng đồng (Impact Dashboard):**
  - Tổng số kg phụ phẩm đã giải cứu: $\sum \text{kg collected}$.
  - Tổng số $CO_2$ tương đương không bị phát thải vào khí quyển:
    $$\text{Tấn } CO_2e = \frac{\text{Tổng kg rơm rạ thu gom}}{1000} \times 1.46$$
  - Tổng số lượt nông dân sử dụng công cụ định giá.
- **Ý nghĩa giáo dục & môi trường:** Biến hành động nhặt rơm, dọn ruộng của từng hộ nông dân thành số liệu bảo vệ môi trường trực quan, có thể báo cáo cho Đoàn thanh niên và UBND xã.
- **Lời thuyết trình (45 giây):**  
  *"Mỗi kg rơm được thu gom thay vì đốt đồng sẽ được hệ thống tự động quy đổi sang lượng khí nhà kính $CO_2$ giảm thiểu theo công thức của Viện Lúa ĐBSCL: cứ 1 tấn rơm không bị đốt giúp giảm 1.46 tấn $CO_2$ tương đương. Bảng tác động này giúp bà con thấy được đóng góp của mình cho môi trường xanh của quê hương."*

---

#### SLIDE 11: KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & THỬ NGHIỆM THỰC ĐỊA
- **Số liệu kỹ thuật đo lường thực tế:**
  - **Kiểm thử tự động:** **55/55 ca kiểm thử ĐẠT 100% (PASS)**, bao phủ toàn bộ các trường hợp lỗi mạng, lỗi biên.
  - **Quy tắc Zero-Comment:** 33/33 tệp mã nguồn sạch $100\%$, đạt tiêu chuẩn lập trình quốc tế.
  - **Dung lượng toàn bộ ứng dụng:** **401 KB** (chỉ bằng 1 bức ảnh chụp điện thoại, nhỏ hơn 4 lần so với mức trần 1.5 MB).
  - **Thời gian phản hồi tính giá:** Dưới **0.1 ms** trên điện thoại cũ.
- **Kết quả thử nghiệm thực tế tại Cẩm Đường:** Thử nghiệm với 20 người dùng tại Phân hiệu 2, tỷ lệ nhận diện giọng nói đạt 88.5%, 100% người dùng đánh giá dễ sử dụng.
- **Lời thuyết trình (60 giây):**  
  *"Toàn bộ hệ thống phần mềm đã được em kiểm chứng nghiêm ngặt qua 55 bài kiểm thử tự động đạt kết quả tuyệt đối 100%. Dung lượng toàn bộ ứng dụng chỉ vỏn vẹn 401 Kilobyte — nghĩa là nhẹ hơn cả một bức ảnh chụp điện thoại, giúp nạp trang ngay cả khi mạng 3G yếu nhất. Qua thử nghiệm thực tế với 20 hộ dân tại Phân hiệu 2, bà con đều ngạc nhiên vì ứng dụng chạy rất nhanh và không hề tốn dung lượng 4G."*

---

#### SLIDE 12: TÍNH MỚI, KHẢ NĂNG NHÂN RỘNG & LỜI KẾT
- **3 Điểm mới nổi bật của đề tài:**
  1. Ứng dụng toán học `BigInt` giải quyết bài toán định giá sinh học sau thu hoạch.
  2. Nền tảng PWA Offline-first và đăng tin giọng nói dành riêng cho nông dân lớn tuổi.
  3. Chi phí máy chủ 0 đồng, thúc đẩy kinh tế tuần hoàn nông nghiệp tại cấp cơ sở.
- **Hướng phát triển:** Tích hợp cảm biến đo độ ngọt Brix qua Bluetooth; kết nối đội xe công nông vận chuyển tự quản.
- **Lời kết học sinh (45 giây):**  
  *"Kính thưa Ban Giám khảo, đề tài AgriCircle không chỉ là một sản phẩm tin học dự thi, mà là tâm huyết của em mong muốn mang tri thức công nghệ giải quyết vấn đề thiết thực của quê hương Cẩm Đường: biến rác thải đồng ruộng thành tài nguyên và giúp người nông dân làm chủ giá trị nông sản của mình. Em xin trân trọng cảm ơn Ban Giám khảo đã chú ý lắng nghe và em rất mong nhận được những góp ý quý báu của quý thầy cô!"*
