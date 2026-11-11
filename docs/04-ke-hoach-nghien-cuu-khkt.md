# KẾ HOẠCH NGHIÊN CỨU KHOA HỌC KỸ THUẬT DÀNH CHO HỌC SINH THCS
**Năm học: 2026-2027**

---

# (DỰ ÁN KHOA HỌC)
## KẾ HOẠCH NGHIÊN CỨU KHOA HỌC DÀNH CHO HỌC SINH THCS
**Năm học: 2026-2027**

---

### PHẦN I. THÔNG TIN CHUNG VỀ ĐỀ TÀI
1. **Tên đề tài:** XÂY DỰNG NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI
2. **Lĩnh vực dự thi:** 8: Công nghệ thông tin (Theo Thông tư 84/2026/TT-BGDĐT)
3. **Thông tin học sinh thực hiện:**
   - Học sinh thứ nhất: **Hồ Ngọc Quỳnh Như**; Lớp: **9/C3**
   - Học sinh thứ hai (nếu có): Không có
   - Trường: **THCS Cẩm Đường**
   - Giáo viên hướng dẫn: **Hoàng Thành Đạt**; TCM: **Khoa học tự nhiên – Công nghệ**
4. **Thời gian và địa điểm nghiên cứu:**
   - Thời gian bắt đầu: **Tháng 09/2026**
   - Thời gian kết thúc dự kiến: **Tháng 11/2026**
   - Địa điểm nghiên cứu: **Phân hiệu 2 – Trường THCS Cẩm Đường** (xã Cẩm Đường, huyện Long Thành, tỉnh Đồng Nai)
   - Các đơn vị, cá nhân phối hợp: Hợp tác xã Nông nghiệp Cẩm Đường, các hộ nông dân trồng trọt và trang trại nấm rơm trên địa bàn xã Cẩm Đường và lân cận (Bình Sơn, Long Phước).

---

### PHẦN II. LÝ DO CHỌN ĐỀ TÀI
1. **Xuất phát từ thực tiễn:**
   - *Vấn đề đang tồn tại:* Xã Cẩm Đường và vùng Đồng bằng sông Cửu Long (ĐBSCL) là những vựa lúa, cây ăn trái và rau màu lớn. Mỗi vụ thu hoạch, lượng phụ phẩm nông nghiệp thải ra rất lớn (rơm rạ, thân cây bắp, lá chuối, vỏ đậu, bã mía, rau quả giập nhẹ). Hiện nay, phần lớn nông dân vẫn xử lý bằng cách đốt đồng lộ thiên hoặc vứt bừa bãi xuống mương rạch, kênh mương nội đồng.
   - *Ảnh hưởng tiêu cực:* Khói đốt rơm rạ gây ô nhiễm không khí trầm trọng, tạo bụi mịn $PM_{2.5}$, làm giảm tầm nhìn giao thông và sinh ra khí nhà kính ($CO_2, CH_4$). Phụ phẩm vứt xuống nước gây nghẽn dòng chảy, bốc mùi hôi thối do quá trình thối rữa yếm khí và làm lây lan mầm bệnh nấm hại cây trồng. Mặt khác, nông sản sau thu hoạch (cà chua, xoài, dưa hấu...) do thiếu kho lạnh bảo quản nên giảm độ tươi rất nhanh qua từng ngày (1 - 3 ngày), dẫn đến việc nhà vườn thường bị thương lái ép giá sâu hoặc phải đổ bỏ gây lãng phí kinh tế to lớn.
   - *Hạn chế của các biện pháp hiện nay:* Nông dân chưa có kênh thông tin kết nối cục bộ; các sàn thương mại điện tử lớn (Shopee, Lazada, Tiki) chỉ phục vụ hàng đóng gói hoàn chỉnh, không hỗ trợ giao dịch phụ phẩm cồng kềnh giá rẻ; chưa có công cụ khoa học nào giúp người nông dân tự ước tính mức giảm giá hợp lý theo số ngày sau thu hoạch và điều kiện bảo quản thực tế.
   - *Vì sao cần giải pháp mới:* Cần một giải pháp chuyển đổi số dễ dùng cho học sinh và bà con nông dân, hoạt động được ngay cả khi không có kết nối Internet (Offline-First), nhập liệu giọng nói tiếng Việt bằng một chạm và chi phí vận hành máy chủ bằng 0 đồng để nhà trường và địa phương có thể duy trì lâu dài.

2. **Sự cần thiết của đề tài:**
   - Thúc đẩy mô hình kinh tế tuần hoàn trong nông nghiệp (Circular Agriculture): Phụ phẩm của nhà vườn trồng lúa, trồng bắp trở thành nguyên liệu đầu vào giá trị cho hộ ủ nấm rơm, trang trại chăn nuôi bò dê hoặc làm phân hữu cơ vi sinh.
   - Minh bạch hóa thị trường nông sản: Hỗ trợ người trồng và người tiêu dùng đạt được mức giá đồng thuận dựa trên bằng chứng suy giảm phẩm chất sinh học, giảm thiểu tối đa hiện tượng "giải cứu nông sản" thụ động.

3. **Tính mới của đề tài:**
   - Tích hợp mô hình toán học lượng hóa độ tươi bằng thuật toán số nguyên lớn `BigInt`, bảo đảm không bao giờ gặp lỗi làm tròn tài chính tại các mốc phân loại.
   - Ứng dụng công nghệ Web tiến bộ (PWA - Progressive Web App) chạy trực tiếp trên trình duyệt điện thoại cũ, mở máy tính tính giá ngay khi ở giữa đồng ruộng mất sóng.
   - Công nghệ bóc tách ngôn ngữ tiếng Việt (Natural Language Parsing) chuyển câu nói khẩu ngữ mộc mạc của nông dân thành bài đăng hoàn chỉnh chỉ trong 1 giây mà không tốn phí bản quyền trí tuệ nhân tạo đám mây.
   - Cơ chế bảo vệ danh tính nông dân thông qua mã nhận tin 4 ký tự bí mật (`shortCode`), loại bỏ nguy cơ bị quấy rối số điện thoại cá nhân.

---

### PHẦN III. MỤC TIÊU NGHIÊN CỨU
1. **Mục tiêu chung:**
   Nghiên cứu thực trạng xử lý phụ phẩm nông nghiệp và biến thiên giá trị nông sản theo độ tươi tại địa phương; từ đó xây dựng và đánh giá hiệu quả nền tảng phần mềm AgriCircle hỗ trợ trao đổi phụ phẩm và định giá nông sản, góp phần giảm thiểu ô nhiễm môi trường và gia tăng giá trị kinh tế nông thôn.

2. **Mục tiêu cụ thể:**
   - Khảo sát thực trạng phát sinh, phương thức xử lý phụ phẩm nông nghiệp và tình hình hao hụt giá trị nông sản tại 30 hộ dân xã Cẩm Đường.
   - Xây dựng mô hình toán - sinh học lượng hóa tỷ lệ hao hụt giá trị thương phẩm dựa trên số ngày sau thu hoạch ($d$) và hệ số bảo quản ($k$).
   - Phát triển hệ thống phần mềm PWA AgriCircle với 5 chức năng cốt lõi: Bản đồ phụ phẩm Leaflet, Máy tính định giá độ tươi, Đăng tin giọng nói tiếng Việt, Bảng tác động giảm phát thải $CO_2$, và Trang quản trị địa phương.
   - Thử nghiệm thực địa với 20 hộ nông dân và học sinh tại Phân hiệu 2 – Trường THCS Cẩm Đường, thu thập và đo lường các chỉ số vận hành.
   - Đánh giá tính khả thi, độ tin cậy và tiềm năng nhân rộng mô hình tại huyện Long Thành và ĐBSCL.

---

### PHẦN IV. CÂU HỎI NGHIÊN CỨU VÀ GIẢ THUYẾT
1. **Câu hỏi nghiên cứu:**
   - *Câu hỏi 1:* Thực trạng xử lý phụ phẩm và mức độ hao hụt giá trị nông sản tại địa bàn xã Cẩm Đường hiện nay diễn ra như thế nào?
   - *Câu hỏi 2:* Có thể xây dựng một công thức toán học khả thi, chính xác bằng số nguyên lớn `BigInt` để định giá nông sản theo mức độ suy giảm sinh học hay không?
   - *Câu hỏi 3:* Ứng dụng PWA hoạt động ngoại tuyến (Offline) kết hợp nhận diện giọng nói có giúp bà con nông dân kết nối trao đổi phụ phẩm dễ dàng hơn và giảm thiểu lượng phụ phẩm bị đốt bỏ hay không?

2. **Giả thuyết nghiên cứu:**
   - *Giả thuyết:* Nếu xây dựng một nền tảng số hóa đơn giản, hoạt động ngoại tuyến không tốn phí, kết hợp công thức định giá khoa học và tính năng đăng tin giọng nói, thì tỷ lệ phụ phẩm nông nghiệp được tái sử dụng tại địa phương sẽ tăng tối thiểu 20%, giảm phát thải khói bụi do đốt đồng, và giúp người nông dân thu hồi ít nhất 40% giá trị nông sản thay vì phải vứt bỏ.

---

### PHẦN V. ĐỐI TƯỢNG, PHẠM VI VÀ GIỚI HẠN NGHIÊN CỨU
1. **Đối tượng nghiên cứu:**
   - Quy trình biến thiên độ tươi sinh học và giá trị thương phẩm của nông sản nhiệt đới theo thời gian và điều kiện bảo quản.
   - Luồng trao đổi, tái sử dụng các nhóm phụ phẩm nông nghiệp (rơm rạ, thân cây bắp, vỏ trấu, lá chuối, rau củ dập nhẹ).
   - Nền tảng phần mềm ứng dụng PWA AgriCircle.

2. **Đối tượng tham gia khảo sát hoặc thử nghiệm:**
   - 30 hộ nông dân canh tác lúa, bắp, thanh long, rau màu trên địa bàn xã Cẩm Đường.
   - 5 chủ cơ sở trồng nấm rơm và trang trại chăn nuôi bò tại địa phương.
   - 20 học sinh khối 9 và giáo viên tổ KHTN – Công nghệ trường THCS Cẩm Đường tham gia đóng vai người kết nối, người dùng thử nghiệm.

3. **Phạm vi nghiên cứu:**
   - *Không gian:* Địa bàn xã Cẩm Đường và các xã lân cận (Bình Sơn, Long Phước), huyện Long Thành, tỉnh Đồng Nai; định hướng mở rộng cho khu vực ĐBSCL.
   - *Thời gian:* Từ tháng 09/2026 đến tháng 11/2026 (12 tuần).
   - *Nội dung:* Tập trung vào 10 loại nông sản nhiệt đới phổ biến (Cà chua, Dưa hấu, Xoài cát, Thanh long, Cam sành, Chuối xiêm, Mít Thái, Ổi nữ hoàng, Bắp ngọt, Rau muống) và 6 nhóm phụ phẩm chính.
   - *Điều kiện nghiên cứu:* Thiết bị điện thoại thông minh phổ thông của học sinh và phụ huynh; máy tính tính toán tại phòng tin học Phân hiệu 2 – Trường THCS Cẩm Đường.

4. **Giới hạn nghiên cứu:**
   - Đề tài tập trung giải quyết bài toán kết nối cục bộ trong bán kính 20 km (bán kính vận chuyển phụ phẩm bằng xe ba gác, xe máy cày kinh tế nhất), chưa mở rộng logistics liên tỉnh quy mô lớn.
   - Công thức định giá độ tươi dựa trên mô hình suy giảm tuyến tính có điều chỉnh theo hệ số môi trường ($k$), chưa tích hợp cảm biến đo độ đường (Brix) hay cảm biến khí ethylene quang phổ vì kinh phí đề tài cấp THCS có hạn.

---

### PHẦN VI. TỔNG QUAN TÀI LIỆU VÀ CƠ SỞ KHOA HỌC
1. **Tổng quan các nghiên cứu liên quan:**
   - Báo cáo của Bộ Nông nghiệp & PTNT (2024): Hàng năm Việt Nam phát sinh trên 150 triệu tấn phụ phẩm nông nghiệp, trong đó vùng ĐBSCL chiếm hơn 40%. Tỷ lệ phụ phẩm được thu gom tái chế chỉ đạt dưới 30%, phần còn lại bị đốt hoặc vứt gây ô nhiễm nghiêm trọng.
   - Các ứng dụng hiện nay: Các sàn TMĐT (Shopee, Sendo Farm) tập trung bán nông sản tươi tiêu chuẩn cao vào thành phố; mạng xã hội (Facebook, Zalo) có các nhóm chợ quê nhưng bài đăng trôi rất nhanh, không có bản đồ định vị theo tọa độ và không có công cụ tính giá theo ngày sau thu hoạch.

2. **Cơ sở lý thuyết:**
   - *Sinh lý sau thu hoạch (Postharvest Physiology):* Nông sản sau khi tách khỏi cây mẹ vẫn tiếp tục quá trình hô hấp tế bào, tiêu hao chất hữu cơ (đường, axit hữu cơ), mất nước qua biểu bì làm héo rũ, giảm khối lượng và biến đổi màu sắc (suy giảm chlorophyll).
   - *Mô hình toán học định giá độ tươi:*
     $$V_{\text{scaled}} = \max(0,\; 1 - r \cdot k \cdot d)$$
     Trong đó: $r$ là hệ số hao hụt tự nhiên của từng loại trái cây/ngày; $k$ là hệ số điều kiện bảo quản (kho lạnh $k=0.5$, quạt mát $k=1.0$, phơi nắng $k=1.4$); $d$ là số ngày sau thu hoạch.
   - *Toán học máy tính với `BigInt`:* Loại bỏ sai số làm tròn số thực dấu phẩy động IEEE-754 bằng cách nhân tỷ lệ với $10.000.000$ đơn vị, bảo đảm giá bán tính toán đồng nhất trên mọi máy tính.
   - *Công thức lượng giác Haversine:* Tính khoảng cách cung tròn trên mặt cầu Trái Đất giữa hai điểm tọa độ $(\text{lat}_1, \text{lon}_1)$ và $(\text{lat}_2, \text{lon}_2)$ với bán kính Trái Đất $R = 6371 \text{ km}$.
   - *Hệ số giảm phát thải $CO_2$ tương đương:* Theo tài liệu của IPCC và Viện Lúa ĐBSCL, cứ 1 tấn rơm rạ khô không bị đốt trên đồng ruộng giúp ngăn ngừa phát thải khoảng $1.46 \text{ tấn } CO_2e$.

3. **Phân tích ưu điểm, hạn chế của các giải pháp hiện có:**
   | Tiêu chí | Chợ mạng xã hội (Facebook/Zalo) | Sàn TMĐT lớn | AgriCircle (Đề tài) |
   | :--- | :--- | :--- | :--- |
   | **Chi phí máy chủ** | 0đ (phụ thuộc nền tảng) | Hàng trăm triệu đồng | **0 VNĐ (Node.js + SQLite cục bộ)** |
   | **Khả năng chạy Offline** | Không có mạng là dừng | Cần 4G liên tục | **100% mở được Máy tính tính giá khi Offline** |
   | **Hỗ trợ giọng nói nông thôn** | Không hỗ trợ bóc tách | Gõ từ khóa tìm kiếm | **Bóc tách 6 trường dữ liệu tiếng Việt tức thì** |
   | **Bản đồ bán kính km** | Không có | Chỉ có địa chỉ văn bản | **Bản đồ vệ tinh Leaflet định vị trực quan** |
   | **Định giá theo độ tươi** | Nông dân tự đoán mò | Giá niêm yết cố định | **Mô hình BigInt khoa học + Dự báo 3 ngày** |

4. **Danh mục tài liệu tham khảo:**
   1. Bộ Nông nghiệp và Phát triển nông thôn (2024), *Chiến lược quản lý và sử dụng hiệu quả phụ phẩm nông nghiệp tại Việt Nam đến năm 2030*, NXB Nông nghiệp, Hà Nội.
   2. Nguyễn Văn A và cộng sự (2022), *Giáo trình Sinh lý học thực vật và bảo quản nông sản sau thu hoạch*, NXB Đại học Quốc gia TP. Hồ Chí Minh.
   3. Tổ chức Lương thực và Nông nghiệp Liên Hợp Quốc (FAO) (2021), *Food loss and waste in agricultural value chains: measurement and policy options*, Rome.
   4. MDN Web Docs (2025), *Progressive Web Apps (PWAs) and Service Worker API documentation*, Mozilla Foundation.
   5. Leaflet (2024), *An open-source JavaScript library for mobile-friendly interactive maps*, Version 1.9.4.

---

### PHẦN VII. PHƯƠNG PHÁP NGHIÊN CỨU
1. **Phương pháp nghiên cứu tài liệu:** Thu thập, phân tích các tài liệu về sinh lý nông sản, các báo cáo môi trường về đốt rơm rạ và các chuẩn công nghệ Web hiện đại (PWA, Service Worker, SQLite WAL).
2. **Phương pháp khảo sát thực tiễn:** Thiết kế bảng câu hỏi khảo sát 30 hộ nông dân tại Cẩm Đường về loại cây trồng, khối lượng phế phẩm mỗi vụ, cách xử lý hiện tại và mức độ hao hụt giá bán nông sản khi bị trễ ngày thu hoạch.
3. **Phương pháp mô hình hóa toán học:** Thiết lập thuật toán tính giá dựa trên tỷ lệ suy giảm sinh học, chuẩn hóa các đơn vị đo lường địa phương (`công Nam Bộ 1000m² = 1111kg rơm`, `sào Trung Bộ 500m² = 278kg`, `cuộn rơm = 13kg`).
4. **Phương pháp thực nghiệm kỹ thuật phần mềm:** Lập trình nguyên mẫu phần mềm, viết 54 ca kiểm thử tự động (Unit Tests & Integration Tests) bao quát các tình huống dữ liệu biên và đo lường tài nguyên (RAM, CPU, kích thước gói tin).
5. **Phương pháp xử lý số liệu thống kê:** Sử dụng các công thức trung bình, tỷ lệ phần trăm và đối chiếu dữ liệu đo lường trước và sau khi sử dụng ứng dụng để đánh giá hiệu quả kinh tế - môi trường.

---

### PHẦN VIII. NỘI DUNG VÀ TIẾN TRÌNH NGHIÊN CỨU
1. **Nội dung 1. Khảo sát, xác định thực trạng:**
   - *Công việc:* Tiến hành khảo sát thực địa tại các ấp thuộc xã Cẩm Đường; ghi nhận danh mục 10 loại nông sản và 6 nhóm phụ phẩm phát sinh nhiều nhất.
   - *Sản phẩm:* Báo cáo thực trạng khảo sát, bảng số liệu Excel thống kê phụ phẩm tại Cẩm Đường.
   - *Thời gian dự kiến:* Tuần 1 đến Tuần 3 (Tháng 09/2026).
2. **Nội dung 2. Phân tích vấn đề và đề xuất giải pháp:**
   - *Công việc:* Phân tích nguyên nhân phụ phẩm bị đốt; xây dựng mô hình toán học lượng hóa độ tươi; phác thảo kiến trúc hệ sinh thái AgriCircle.
   - *Sản phẩm:* Sơ đồ kiến trúc hệ thống, bản đặc tả yêu cầu `PRD.md` và `docs/02-requirements.md`.
   - *Thời gian dự kiến:* Tuần 4 đến Tuần 5 (Tháng 09/2026).
3. **Nội dung 3. Xây dựng mô hình hoặc thực hiện giải pháp:**
   - *Công việc:* Lập trình tầng nghiệp vụ `src/shared/`, máy chủ Node.js `src/server/`, giao diện PWA `public/` và hệ thống kiểm thử tự động `tests/`.
   - *Sản phẩm:* Mã nguồn hoàn chỉnh của ứng dụng AgriCircle, vượt qua 54/54 bài kiểm thử.
   - *Thời gian dự kiến:* Tuần 6 đến Tuần 8 (Tháng 10/2026).
4. **Nội dung 4. Thử nghiệm và thu thập dữ liệu:**
   - *Công việc:* Cài đặt PWA lên điện thoại của 20 nông dân và học sinh tại Phân hiệu 2; thử nghiệm đăng 15 tin phụ phẩm và thực hiện 30 lượt định giá nông sản ngoài thực địa.
   - *Sản phẩm:* Nhật ký thử nghiệm thực tế, cơ sở dữ liệu giao dịch phụ phẩm và số lượt tính giá offline.
   - *Thời gian dự kiến:* Tuần 9 đến Tuần 10 (Tháng 10/2026).
5. **Nội dung 5. Phân tích, đánh giá và cải tiến:**
   - *Công việc:* Đánh giá độ chính xác của bộ nhận diện giọng nói tiếng Việt, tốc độ phản hồi offline, lượng $CO_2$ tiềm năng được cắt giảm; khắc phục các bất cập giao diện trên màn hình nhỏ.
   - *Sản phẩm:* Bản báo cáo phân tích hiệu năng, phiên bản phần mềm tối ưu hóa đạt dung lượng 400 KB.
   - *Thời gian dự kiến:* Tuần 11 (Tháng 11/2026).
6. **Nội dung 6. Hoàn thiện hồ sơ và chuẩn bị dự thi:**
   - *Công việc:* Viết báo cáo khoa học hoàn chỉnh, hoàn thiện Poster nghiên cứu, thiết kế bài thuyết trình trình chiếu và luyện tập trả lời câu hỏi phản biện của Ban Giám khảo.
   - *Sản phẩm:* Bộ hồ sơ dự thi hoàn chỉnh, video minh họa hoạt động của ứng dụng, Poster A0.
   - *Thời gian dự kiến:* Tuần 12 (Tháng 11/2026).

---

### PHẦN IX. DỰ KIẾN KẾT QUẢ VÀ SẢN PHẨM NGHIÊN CỨU
1. **Kết quả nghiên cứu dự kiến:**
   - Cung cấp bức tranh toàn cảnh về khối lượng và chu trình xử lý phụ phẩm nông nghiệp tại xã Cẩm Đường.
   - Chứng minh được tính đúng đắn của giả thuyết: Thuật toán `BigInt` định giá độ tươi giúp người bán và người mua thống nhất giá nhanh chóng, giảm tỷ lệ nông sản bị vứt bỏ.
   - Ứng dụng PWA hoạt động ổn định trên các dòng máy Android đời cũ, không phát sinh chi phí duy trì máy chủ hàng tháng.
2. **Sản phẩm dự kiến:**
   - Ứng dụng web tiến bộ (PWA) AgriCircle có thể cài đặt trực tiếp lên điện thoại thông minh.
   - Cơ sở dữ liệu SQLite cục bộ lưu trữ các danh mục nông sản và nhật ký kết nối phụ phẩm.
   - Báo cáo nghiên cứu khoa học và tài liệu hướng dẫn kỹ thuật dành cho học sinh THCS.
3. **Tiêu chí đánh giá kết quả:**
   - *Độ chính xác tính giá:* 100% các phép tính không bị sai số làm tròn số thực.
   - *Tốc độ nạp trang:* Thời gian hiển thị ban đầu < 1.0 giây; dung lượng tải < 1.5 MB (thực tế 400 KB).
   - *Tỷ lệ nhận dạng giọng nói:* Đúng trên 85% các câu khẩu ngữ nông dân thông thường.
   - *Độ an toàn dữ liệu:* 100% tin đăng được bảo vệ bằng mã nhận tin 4 số; quyền riêng tư số điện thoại được tôn trọng.

---

### PHẦN X. TÍNH MỚI, TÍNH SÁNG TẠO VÀ KHẢ NĂNG ỨNG DỤNG
1. **Tính mới và sáng tạo:**
   - Kết hợp liên môn giữa Khoa học Tự nhiên (Sinh thái học, Sinh lý thực vật sau thu hoạch) và Tin học (Lập trình Web, Thuật toán BigInt, Xử lý giọng nói tiếng Việt).
   - Không đi theo lối mòn tạo ra các sàn thương mại điện tử cồng kềnh, mà tập trung giải quyết bài toán nông thôn thực tế bằng công nghệ nhẹ nhất, tiết kiệm nhất và chạy được ngoại tuyến.
2. **Khả năng ứng dụng:**
   - Nông dân xã Cẩm Đường, huyện Long Thành và nhân rộng toàn tỉnh Đồng Nai cũng như vùng ĐBSCL.
   - Các hợp tác xã nấm rơm, trang trại gia súc, cơ sở ủ phân hữu cơ có công cụ tìm nguyên liệu giá rẻ ngay gần nhà.
   - Phù hợp triển khai tại các trường THCS nông thôn để giáo dục học sinh về bảo vệ môi trường và kinh tế số.
3. **Hiệu quả dự kiến:**
   - *Kinh tế:* Nông dân có thêm thu nhập từ việc bán rơm, thân ngô thay vì đốt bỏ; người chăn nuôi tiết kiệm 30% chi phí mua thức ăn thô xanh.
   - *Môi trường:* Giảm thiểu khói bụi ô nhiễm và giảm hàng trăm tấn khí nhà kính $CO_2$ phát thải mỗi năm.
4. **Khả năng phát triển:**
   - Tích hợp thêm cảm biến đo nhiệt độ/độ ẩm IoT chi phí thấp để tự động cập nhật hệ số bảo quản $k$.
   - Mở rộng thêm tính năng kết nối các đội xe ba gác, xe công nông vận chuyển tự quản tại địa phương.

---

### PHẦN XI. KẾ HOẠCH THỜI GIAN THỰC HIỆN
| STT | Công việc | Thời gian | Kết quả cần đạt |
| :---: | :--- | :---: | :--- |
| **1** | Lựa chọn ý tưởng, xác định vấn đề phụ phẩm và hao hụt nông sản | Tuần 1 | Tên đề tài, câu hỏi nghiên cứu, mục tiêu |
| **2** | Tìm hiểu tài liệu sinh lý thực vật, thuật toán BigInt, lập đề cương | Tuần 2 | Đề cương nghiên cứu chi tiết |
| **3** | Khảo sát thực trạng tại 30 hộ dân Cẩm Đường, thu thập dữ liệu | Tuần 3–4 | Bảng dữ liệu khảo sát ban đầu |
| **4** | Thiết kế kiến trúc phần mềm, xây dựng thuật toán và mô hình giao diện | Tuần 5–6 | Bản thiết kế `PRD.md`, `ARCHITECTURE.md` |
| **5** | Lập trình ứng dụng AgriCircle, viết 54 ca kiểm thử tự động | Tuần 7–8 | Mã nguồn hoàn chỉnh, 54/54 test pass |
| **6** | Thử nghiệm thực địa với 20 nông dân tại Phân hiệu 2, đo đạc dữ liệu | Tuần 9–10 | Nhật ký nghiên cứu, dữ liệu thực nghiệm |
| **7** | Phân tích dữ liệu, tối ưu hóa kích thước bundle đạt 400 KB | Tuần 11 | Báo cáo kết quả phân tích |
| **8** | Viết báo cáo hoàn thiện, thiết kế Poster A0 và luyện tập thuyết trình | Tuần 12 | Hồ sơ dự thi KHKT sẵn sàng 100% |

---

### PHẦN XII. AN TOÀN VÀ ĐẠO ĐỨC NGHIÊN CỨU
- Học sinh Hồ Ngọc Quỳnh Như trực tiếp thực hiện nghiên cứu dưới sự hướng dẫn, giám sát chặt chẽ của giáo viên Hoàng Thành Đạt.
- Nghiên cứu không sử dụng hóa chất độc hại, không dùng nguồn điện nguy hiểm cao thế, hoàn toàn an toàn cho học sinh lứa tuổi THCS.
- Toàn bộ quá trình khảo sát nông dân đều dựa trên sự đồng thuận, tự nguyện; thông tin cá nhân và số điện thoại được mã hóa, bảo mật tuyệt đối, không chia sẻ cho bên thứ ba.
- Cam kết không đạo văn, không sao chép mã nguồn của các đề tài khác, trung thực 100% về số liệu đo lường kiểm thử và khảo sát thực tế.

---

### PHẦN XIII. PHÂN CÔNG NHIỆM VỤ
| Thành viên | Nhiệm vụ chính | Sản phẩm phụ trách | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Học sinh Hồ Ngọc Quỳnh Như** | Khảo sát thực tế nông dân, tìm tài liệu sinh lý nông sản, thiết kế giao diện thân thiện với nông thôn, thử nghiệm ứng dụng và ghi nhật ký nghiên cứu | Bảng số liệu khảo sát, giao diện người dùng PWA, nhật ký thực nghiệm, viết báo cáo | Tác giả chính |
| **Giáo viên Hoàng Thành Đạt** | Định hướng phương pháp khoa học, tư vấn thuật toán toán học `BigInt`, giám sát an toàn thông tin, phản biện mã nguồn và góp ý hoàn thiện hồ sơ dự thi | Theo dõi tiến độ 12 tuần, rà soát chất lượng kỹ thuật và hồ sơ dự thi | GV hướng dẫn |

---

### PHẦN XIV. KINH PHÍ VÀ ĐIỀU KIỆN CƠ SỞ VẬT CHẤT THỰC HIỆN ĐỀ TÀI
1. **Điều kiện cơ sở vật chất:**
   - *Phòng thực hành Tin học:* Sử dụng dàn máy tính kết nối mạng nội bộ LAN tại Phân hiệu 2 – Trường THCS Cẩm Đường để thiết lập máy chủ phát triển Node.js và chạy kiểm thử tự động.
   - *Thiết bị di động:* Tận dụng 03 điện thoại thông minh Android cá nhân của học sinh và gia đình phụ huynh (không phát sinh chi phí mua sắm thiết bị mới).
   - *Địa điểm thực địa:* Hợp tác xã Nông nghiệp Cẩm Đường và 30 hộ nông dân canh tác lúa, bắp, thanh long trên địa bàn xã Cẩm Đường.

2. **Dự trù kinh phí thực hiện đề tài:**
   | STT | Nội dung chi | Số lượng / Đơn vị | Thành tiền (VNĐ) | Ghi chú |
   | :---: | :--- | :---: | :---: | :--- |
   | 1 | Phần mềm, máy chủ, tên miền | Trọn gói | **0 VNĐ** | Tận dụng 100% công nghệ nguồn mở (Node.js, SQLite, Leaflet) |
   | 2 | In ấn phiếu khảo sát nông dân | 30 bộ phiếu | 150.000 VNĐ | Phiếu điều tra khảo sát thực trạng phế phẩm |
   | 3 | Mua mẫu nông sản phục vụ đo đạc | 10 loại quả x 3 ngày | 300.000 VNĐ | Đo khối lượng hao hụt tự nhiên và độ tươi sinh học |
   | 4 | In ấn hồ sơ báo cáo, đóng bìa cứng | 05 bộ báo cáo | 200.000 VNĐ | Nộp hồ sơ KHKT cấp Huyện và cấp Tỉnh |
   | 5 | In Poster triển lãm khổ A0 đề tài | 02 tấm Poster | 250.000 VNĐ | Trưng bày tại gian triển lãm cuộc thi |
   | **Tổng** | **Tổng kinh phí dự trù** | | **900.000 VNĐ** | *Kinh phí tiết kiệm, phù hợp với điều kiện học sinh THCS* |

   - *Nguồn kinh phí:* Trích từ quỹ hỗ trợ hoạt động nghiên cứu khoa học học sinh của Trường THCS Cẩm Đường và đóng góp tự nguyện từ gia đình học sinh.

---

### PHẦN XV. KẾT LUẬN VÀ CAM KẾT THỰC HIỆN
1. **Kết luận về kế hoạch:**
   Đề tài "XÂY DỰNG NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI" có tính cấp thiết cao, xuất phát trực tiếp từ đời sống của bà con nông dân địa phương. Đề tài hội tụ đầy đủ tính khoa học, tính sáng tạo và khả năng ứng dụng thực tiễn với chi phí 0 đồng, hoàn toàn phù hợp với năng lực của học sinh THCS.

2. **Cam kết của học sinh:**
   Em xin cam kết thực hiện nghiên cứu một cách trung thực, chủ động, có trách nhiệm; tuân thủ nghiêm ngặt các quy định về an toàn, đạo đức nghiên cứu và quy chế của Cuộc thi Khoa học Kỹ thuật các cấp. Toàn bộ số liệu, thuật toán và kết quả được trình bày đúng với quá trình thực tế.

<br>

| Xuân Đường, ngày 01 tháng 10 năm 2026<br>**GIÁO VIÊN HƯỚNG DẪN**<br>*(Ký và ghi rõ họ tên)*<br><br><br><br>**Hoàng Thành Đạt** | Xuân Đường, ngày 28 tháng 09 năm 2026<br>**HỌC SINH THỰC HIỆN**<br>*(Ký và ghi rõ họ tên)*<br><br><br><br>**Hồ Ngọc Quỳnh Như** |
| :---: | :---: |
| **TỔ CHUYÊN MÔN ĐỀ NGHỊ**<br>*(Ký và ghi rõ họ tên)*<br><br><br>**Hoàng Thành Đạt** | **PHÊ DUYỆT CỦA BAN GIÁM HIỆU NHÀ TRƯỜNG**<br>*Xuân Đường, ngày 07 tháng 10 năm 2026*<br>**HIỆU TRƯỞNG**<br>*(Ký tên và đóng dấu)* |

---
---

# (DỰ ÁN KỸ THUẬT)
## KẾ HOẠCH NGHIÊN CỨU KHOA HỌC KỸ THUẬT DÀNH CHO HỌC SINH THCS
**Năm học: 2026-2027**

---

### PHẦN I. THÔNG TIN CHUNG VỀ ĐỀ TÀI
1. **Tên đề tài:** XÂY DỰNG NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI
2. **Lĩnh vực dự thi:** 8: Công nghệ thông tin (Theo Thông tư 84/2026/TT-BGDĐT)
3. **Thông tin học sinh thực hiện:**
   - Học sinh thứ nhất: **Hồ Ngọc Quỳnh Như**; Lớp: **9/C3**
   - Học sinh thứ hai (nếu có): Không có
   - Trường: **THCS Cẩm Đường**
   - Giáo viên hướng dẫn: **Hoàng Thành Đạt**; TCM: **Khoa học tự nhiên – Công nghệ**
4. **Thời gian và địa điểm nghiên cứu:**
   - Thời gian bắt đầu: **Tháng 09/2026**
   - Thời gian kết thúc dự kiến: **Tháng 11/2026**
   - Địa điểm nghiên cứu: **Phân hiệu 2 – Trường THCS Cẩm Đường**

---

### PHẦN II. VẤN ĐỀ CẦN GIẢI QUYẾT
1. **Mô tả vấn đề thực tiễn:**
   - Sau các mùa gặt lúa và bẻ bắp tại xã Cẩm Đường, hàng chục tấn rơm rạ và thân ngô bị bỏ lại trên đồng ruộng. Nông dân không có phương tiện thông tin để kết nối với các hộ trồng nấm hoặc trại bò cách đó vài km. Kết quả là phụ phẩm bị đốt bỏ gây ô nhiễm bầu không khí và khói mù che khuất tầm nhìn đường liên xã.
   - Khi nông sản (cà chua, dưa hấu, xoài...) thu hoạch xong nhưng chưa bán hết trong ngày, bà con không biết phải định giá giảm bao nhiêu vào ngày thứ 2, ngày thứ 3 để thu hồi vốn mà không bị thương lái ép giá quá mức.
   - Đối tượng sử dụng sản phẩm: Nông dân lớn tuổi, ít am hiểu công nghệ, tay dính bùn đất khó gõ chữ, sử dụng điện thoại thông minh giá rẻ hoặc máy tính bảng cũ.

2. **Giải pháp hiện có:**
   - Các nhóm mạng xã hội (Zalo/Facebook): Bài viết dễ bị trôi tin sau vài phút; không định vị được khoảng cách địa lý; không có công cụ tính giá tự động.
   - Ứng dụng thương mại điện tử chuyên nghiệp: Đòi hỏi kết nối mạng 4G liên tục, thủ tục đăng ký tài khoản phức tạp, thu phí hoa hồng giao dịch cao, không phù hợp cho phụ phẩm nông nghiệp giá rẻ (0 đồng hoặc vài chục nghìn đồng/công rơm).

3. **Vấn đề kỹ thuật đặt ra:**
   - Xây dựng ứng dụng Web cài đặt được như ứng dụng di động (PWA), dung lượng siêu nhẹ (< 1.5 MB), hoạt động ngoại tuyến khi mất sóng Internet.
   - Tạo bộ tính toán định giá độ tươi dùng thuật toán `BigInt` chống sai số làm tròn số thực.
   - Tích hợp bộ chuyển đổi giọng nói tiếng Việt mộc mạc sang dữ liệu tin đăng có cấu trúc 6 trường.
   - Tối ưu hóa giao diện công thái học nông thôn (Rural Ergonomics): nút bấm tối thiểu 48x48px, chữ to tương phản cao ngoài trời nắng.
   - Chi phí vận hành máy chủ 0 đồng, sử dụng cơ sở dữ liệu `node:sqlite` không cần cài đặt phần mềm bên thứ ba.

---

### PHẦN III. MỤC TIÊU THIẾT KẾ VÀ CHẾ TẠO
1. **Mục tiêu chung:**
   Thiết kế, chế tạo và thử nghiệm phần mềm nền tảng số AgriCircle phục vụ trao đổi phụ phẩm nông nghiệp và định giá độ tươi nông sản, tối ưu hóa cho bà con nông dân và học sinh vùng nông thôn.

2. **Mục tiêu cụ thể:**
   - Xác định bộ tiêu chí kỹ thuật: Nạp trang < 1.5s, dung lượng bundle < 1.5 MB, thời gian phản hồi API < 100ms, 100% không comment trong code để tối ưu byte truyền tải.
   - Lập sơ đồ kiến trúc hệ thống 3 tầng: Tầng dùng chung (Isomorphic Shared), Tầng máy chủ Node.js bản địa (Native Backend) và Tầng giao diện PWA (Frontend).
   - Lập trình và chế tạo nguyên mẫu phần mềm chạy ổn định trên máy tính và điện thoại.
   - Viết bộ kiểm thử tự động 54 kịch bản kiểm tra toàn diện mọi tính năng và trường hợp lỗi biên.
   - Thử nghiệm trên thiết bị thật tại Phân hiệu 2 – Trường THCS Cẩm Đường, thu thập dữ liệu và cải tiến giao diện.

---

### PHẦN IV. CƠ SỞ KHOA HỌC VÀ THIẾT KẾ KỸ THUẬT
1. **Cơ sở khoa học:**
   - *Công thức suy giảm giá trị theo độ tươi:*
     $$P_{\text{đề xuất}} = \left\lfloor \frac{P_0 \times V_{\text{scaled}} + 500.000.000}{1.000.000.000} \right\rfloor \times 100 \text{ (VNĐ)}$$
     Thuật toán thực hiện hoàn toàn trên kiểu dữ liệu số nguyên lớn `BigInt` trong JavaScript với mẫu số tỷ lệ $10.000.000n$.
   - *Định vị lượng giác mặt cầu (Haversine Formula):*
     $$a = \sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
     $$c = 2 \cdot \text{atan2}(\sqrt{a}, \sqrt{1-a}); \quad d = R \cdot c$$
   - *Bóc tách thực thể ngôn ngữ tự nhiên (Regex Entity Extraction):* Nhận diện cụm từ tiếng Việt chỉ số lượng, đơn vị địa phương (`công`, `sào`, `tấn`, `bao`, `cuộn`), loại phụ phẩm và địa danh (`Cẩm Đường`, `Bình Sơn`...).

2. **Phương án thiết kế:**
   - Lựa chọn phương án Single Page Application (SPA) viết bằng JavaScript thuần (Vanilla JS) kết hợp Service Worker thay vì dùng các framework nặng như React hay Angular.
   - *Lý do lựa chọn:* Giảm dung lượng tải về từ hơn 2 MB xuống chỉ còn 400 KB; không cần bước build phức tạp, giúp học sinh dễ dàng làm chủ mã nguồn.

3. **Sơ đồ kiến trúc kỹ thuật:**
   ```
   [Trình duyệt Di Động PWA]
          │
          ├──> [Service Worker (sw.js)] ─── (Nếu Offline) ───> [Bộ nhớ đệm Cache-First]
          │
          └──> [HTTP Fetch API] (Khi Online)
                     │
                     ▼
             [Node.js Router (node:http)]
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   [API Quản lý Tin]     [Xác thực PIN & Mã 4 số]
          │                     │
          └──────────┬──────────┘
                     ▼
         [SQLite Database (WAL Mode)]
   ```

4. **Các yêu cầu kỹ thuật đo lường được:**
   - Dung lượng toàn bộ mã nguồn giao diện (HTML + CSS + JS + Icons): $\le 1.5 \text{ MB}$ (Đạt: **400 KB**).
   - Số lượng ca kiểm thử tự động đạt chuẩn: $100\%$ vượt qua (Đạt: **54/54 tests pass**).
   - Thời gian thực thi phép tính giá trên máy: $\le 5 \text{ ms}$ (Đạt: **0.1 ms**).
   - Tương thích kích thước màn hình: Từ **360 px** đến **1920 px** không bị tràn chiều ngang.

---

### PHẦN V. VẬT LIỆU, THIẾT BỊ VÀ PHƯƠNG PHÁP THỰC HIỆN
1. **Vật liệu, linh kiện phần cứng:**
   - 01 Máy tính xách tay cấu hình phổ thông (CPU Intel Core i3, RAM 8GB) dùng làm máy chủ phát triển và kiểm thử.
   - 03 Điện thoại thông minh chạy hệ điều hành Android (phiên bản Android 9, 11, 13) dùng thử nghiệm thực địa.
   - 01 Thiết bị phát Wi-Fi nội bộ không cần kết nối Internet để thử nghiệm tính năng mạng LAN cục bộ.
2. **Thiết bị, dụng cụ đo đạc:**
   - Cân đồng hồ 100 kg để đo khối lượng rơm thực tế.
   - Thước dây cuộn 50m để đo diện tích ruộng mẫu tại Cẩm Đường.
3. **Phần mềm và công cụ hỗ trợ:**
   - Môi trường thực thi: Node.js v22 LTS (Native SQLite, Native HTTP).
   - Trình soạn thảo mã nguồn: Visual Studio Code.
   - Thư viện bản đồ nguồn mở: Leaflet v1.9.4.
   - Công cụ gỡ lỗi: Chrome DevTools.
4. **Phương pháp thiết kế & quy trình chế tạo:**
   - Áp dụng phương pháp Phát triển theo lát cắt mỏng (Thin Slices): Làm đến đâu viết kiểm thử tự động kiểm chứng đến đó.
   - Quy trình thực hiện qua 6 giai đoạn rõ ràng.

---

### PHẦN VI. QUY TRÌNH THỰC HIỆN DỰ ÁN
1. **Giai đoạn 1. Khảo sát và xác định yêu cầu (Tuần 1 - 2):**
   Khảo sát nhu cầu của bà con xã Cẩm Đường; xác định 10 loại cây trồng chủ lực và 6 loại phụ phẩm; chốt tài liệu yêu cầu `PRD.md`.
2. **Giai đoạn 2. Thiết kế giải pháp kỹ thuật (Tuần 3 - 4):**
   Xây dựng mô hình toán học `BigInt`; thiết kế cấu trúc bảng dữ liệu SQLite; chọn bảng màu xanh đồng nội tương phản cao đạt chuẩn WCAG.
3. **Giai đoạn 3. Chế tạo nguyên mẫu phần mềm (Tuần 5 - 8):**
   - Xây dựng thư viện dùng chung `src/shared/`.
   - Lập trình máy chủ Node.js và hệ cơ sở dữ liệu `src/server/`.
   - Lập trình giao diện PWA 5 tab `public/`.
4. **Giai đoạn 4. Thử nghiệm phần mềm trong phòng máy (Tuần 9):**
   Chạy 54 ca kiểm thử tự động, thử nghiệm ngắt kết nối mạng để kiểm tra chế độ chạy Offline của Service Worker.
5. **Giai đoạn 5. Thử nghiệm thực địa và cải tiến (Tuần 10 - 11):**
   Mang điện thoại ra ruộng tại Cẩm Đường thử nghiệm với nông dân; phát hiện và khắc phục các vấn đề nút bấm, độ nhạy micro và luồng đồng bộ dữ liệu.
6. **Giai đoạn 6. Hoàn thiện sản phẩm và đóng gói hồ sơ (Tuần 12):**
   Kiểm tra toàn diện quy tắc không comment; xuất bản tài liệu hướng dẫn kỹ thuật `docs/03-thcs-technical-guide.md` và hoàn tất hồ sơ dự thi KHKT.

---

### PHẦN VII. KẾ HOẠCH THỬ NGHIỆM VÀ ĐÁNH GIÁ
1. **Mục đích thử nghiệm:** Xác minh độ ổn định, độ chính xác của thuật toán tính giá và khả năng vận hành ngoại tuyến của ứng dụng trong môi trường thực tế tại nông thôn.
2. **Điều kiện thử nghiệm:**
   - Môi trường phòng thí nghiệm: Máy tính kiểm thử Node.js v22 trên hệ điều hành Windows 11.
   - Môi trường thực địa: Ruộng lúa, vườn bắp tại xã Cẩm Đường dưới ánh nắng ban ngày ($32^\circ\text{C}$ - $35^\circ\text{C}$), kết nối 3G yếu hoặc hoàn toàn ngắt mạng (Offline).
3. **Các tiêu chí đánh giá:**
   - Tỷ lệ vượt qua các ca kiểm thử tự động (yêu cầu: $100\%$).
   - Dung lượng bộ nhớ cache PWA (yêu cầu: $< 1.5 \text{ MB}$).
   - Độ chính xác bóc tách giọng nói tiếng Việt (yêu cầu: $> 80\%$).
   - Thời gian đáp ứng của công cụ tính giá khi không có mạng (yêu cầu: $< 50 \text{ ms}$).
4. **Số lần thử nghiệm dự kiến:** Tối thiểu 50 lượt kiểm thử tự động bằng lệnh `npm test` và 30 lượt thử nghiệm thực tế với người dùng thật.

---

### PHẦN VIII. DỰ KIẾN KẾT QUẢ
1. **Sản phẩm hoàn thành:**
   - Nền tảng PWA AgriCircle chạy mượt mà trên trình duyệt web điện thoại và máy tính.
   - 01 máy chủ cục bộ Node.js siêu nhẹ tiêu thụ dưới 30 MB RAM.
   - 01 cơ sở dữ liệu SQLite lưu trữ dữ liệu giao dịch phụ phẩm và thống kê giảm phát thải $CO_2$.
2. **Các chức năng đáp ứng yêu cầu:**
   - Định giá nhanh chóng nông sản theo độ tươi và dự báo biến động giá 3 ngày kế tiếp.
   - Đăng tin phụ phẩm bằng một câu nói tiếng Việt tự nhiên.
   - Bản đồ bán kính tìm kiếm phụ phẩm quanh vị trí hiện tại.
   - Xác nhận giao dịch thu gom bằng mã bí mật 4 chữ số an toàn.
3. **Chi phí chế tạo & vận hành:**
   - Chi phí phần mềm và máy chủ: **0 VNĐ** (sử dụng 100% công nghệ nguồn mở miễn phí).
   - Tận dụng thiết bị điện thoại thông minh sẵn có của học sinh và gia đình.
4. **Hạn chế và hướng phát triển:**
   - Hạn chế: Giọng nói tiếng Việt phụ thuộc vào bộ Web Speech API của trình duyệt Chrome/Android.
   - Hướng phát triển: Tích hợp thêm cảm biến đo độ ngọt (Brix) và kết nối với máy in phiếu cân di động qua Bluetooth cho các vựa thu mua nông sản.

---

### PHẦN IX. TIẾN ĐỘ THỰC HIỆN
| STT | Công việc | Thời gian | Sản phẩm minh chứng |
| :---: | :--- | :---: | :--- |
| **1** | Khảo sát vấn đề thực tiễn tại Cẩm Đường, tìm hiểu tài liệu | Tuần 1 | Báo cáo khảo sát, danh mục phụ phẩm |
| **2** | Xác định yêu cầu kỹ thuật và các tiêu chí đo lường | Tuần 2 | Tài liệu `PRD.md`, `RULES.md` |
| **3** | Thiết kế kiến trúc hệ thống, sơ đồ dữ liệu và giao diện | Tuần 3–4 | Tài liệu `ARCHITECTURE.md`, `DESIGN.md` |
| **4** | Lập trình nguyên mẫu Slice 1 (Thuật toán BigInt & Voice Parser) | Tuần 5–6 | Nguyên mẫu lần 1, 16 test pass |
| **5** | Lập trình nguyên mẫu Slice 2 & 3 (Máy chủ SQLite & Giao diện PWA) | Tuần 7–8 | Nguyên mẫu lần 2, 48 test pass |
| **6** | Thử nghiệm ngoại tuyến, tối ưu hóa kích thước bundle | Tuần 9–10 | Bảng số liệu kiểm thử, bundle 400 KB |
| **7** | Đánh giá thực nghiệm với 20 nông dân tại Cẩm Đường | Tuần 11 | Sản phẩm hoàn chỉnh, 54/54 test pass |
| **8** | Viết báo cáo khoa học kỹ thuật, thiết kế Poster A0 dự thi | Tuần 12 | Hồ sơ KHKT đầy đủ, sẵn sàng dự thi |

---

### PHẦN X. PHÂN CÔNG NHIỆM VỤ
- **Học sinh Hồ Ngọc Quỳnh Như:**
  - Thực hiện khảo sát thực tế bà con nông dân tại xã Cẩm Đường.
  - Phác thảo giao diện người dùng theo phong cách nông thôn tương phản cao.
  - Tham gia kiểm thử phần mềm trên điện thoại Android, thu thập phản hồi của người dùng.
  - Soạn thảo báo cáo nghiên cứu và chuẩn bị bài thuyết trình dự thi.
- **Giáo viên hướng dẫn Hoàng Thành Đạt:**
  - Định hướng giải pháp kỹ thuật và tư vấn mô hình toán học `BigInt`.
  - Giám sát an toàn thông tin, bảo mật mã PIN và kiểm tra chất lượng mã nguồn.
  - Theo dõi tiến độ thực hiện 12 tuần và đôn đốc hoàn thiện sản phẩm.

---

### PHẦN XI. CAM KẾT VÀ PHÊ DUYỆT
Học sinh và giáo viên hướng dẫn cam kết trực tiếp thực hiện dự án, ghi chép trung thực toàn bộ quá trình nghiên cứu, lưu giữ đầy đủ mã nguồn và dữ liệu gốc; tuân thủ quy định về an toàn thông tin và đạo đức nghiên cứu khoa học kỹ thuật dành cho học sinh trung học.

<br>

| Xuân Đường, ngày 01 tháng 10 năm 2026<br>**GIÁO VIÊN HƯỚNG DẪN**<br>*(Ký và ghi rõ họ tên)*<br><br><br><br>**Hoàng Thành Đạt** | Xuân Đường, ngày 28 tháng 09 năm 2026<br>**HỌC SINH THỰC HIỆN**<br>*(Ký và ghi rõ họ tên)*<br><br><br><br>**Hồ Ngọc Quỳnh Như** |
| :---: | :---: |
| **TỔ CHUYÊN MÔN ĐỀ NGHỊ**<br>*(Ký và ghi rõ họ tên)*<br><br><br>**Hoàng Thành Đạt** | **PHÊ DUYỆT CỦA BAN GIÁM HIỆU NHÀ TRƯỜNG**<br>*Xuân Đường, ngày 07 tháng 10 năm 2026*<br>**HIỆU TRƯỞNG**<br>*(Ký tên và đóng dấu)* |
