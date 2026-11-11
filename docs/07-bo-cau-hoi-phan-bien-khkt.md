# BỘ CÂU HỎI PHẢN BIỆN KHKT & HƯỚNG DẪN TRẢ LỜI (Q&A DEFENSE GUIDE)
**Dành cho Cuộc thi Khoa học Kỹ thuật dành cho học sinh Trung học**  
**Đề tài:** Nền tảng kết nối trao đổi phụ phẩm nông nghiệp & Hỗ trợ định giá nông sản theo độ tươi (AgriCircle)  
**Tác giả:** Hồ Ngọc Quỳnh Như (Lớp 9/C3, Trường THCS Cẩm Đường) — **GVHD:** Hoàng Thành Đạt  

---

> [!TIP]
> **Chiến thuật trả lời Ban Giám khảo (BGK) dành cho học sinh THCS:**
> 1. Luôn cảm ơn trước khi trả lời: *"Dạ em xin cảm ơn câu hỏi rất hay của Thầy/Cô ạ..."*
> 2. Trả lời đi thẳng vào trọng tâm: Nêu rõ **Con số thực tế** $\rightarrow$ **Cơ sở khoa học** $\rightarrow$ **Cách em đã làm trong phần mềm**.
> 3. Phong thái tự tin, trung thực: Những gì em tự lập trình thì giải thích rõ ràng; những gì thầy giáo định hướng thì thành thật chia sẻ sự hỗ trợ của thầy.

---

## NHÓM 1: VỀ TÍNH MỚI & SỰ CẦN THIẾT CỦA ĐỀ TÀI

### Câu 1: Hiện nay người dân đã có Zalo, Facebook để đăng bán đồ, tại sao em phải mất công làm ứng dụng này?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, Zalo và Facebook là mạng xã hội nói chung, không được thiết kế cho việc trao đổi phụ phẩm và định giá nông sản vì 3 hạn chế lớn:
  1. **Bài đăng bị trôi rất nhanh:** Sau vài giờ là tin bị trôi mất, người cần mua không thể tìm kiếm theo vị trí địa lý hay bán kính quanh mình (ví dụ bán kính 3 km, 5 km).
  2. **Không có công cụ tính giá theo ngày sau thu hoạch:** Nông dân chỉ đăng giá đại khái, không biết cách định giá hợp lý theo độ hao hụt sinh học của nông sản.
  3. **Không chạy được khi mất mạng:** Khi ra ruộng, sóng 4G thường rất yếu hoặc mất hẳn. Ứng dụng của em là PWA chạy ngoại tuyến (Offline-First), không có mạng vẫn mở lên tính giá và lưu tin đăng bình thường."*

### Câu 2: Đề tài này có gì khác biệt so với các sàn thương mại điện tử lớn như Shopee hay Sendo Farm?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, các sàn TMĐT lớn tập trung vào việc bán hàng tiêu dùng đóng gói, vận chuyển liên tỉnh và thu phí giao dịch từ 5% đến 15%.
  - Đối tượng của em là **phụ phẩm cồng kềnh, giá trị thấp hoặc 0 đồng** (như rơm rạ, thân ngô) mà các sàn lớn không nhận giao dịch.
  - Phụ phẩm nông nghiệp chỉ có thể vận chuyển kinh tế trong **bán kính cục bộ dưới 10 - 20 km** bằng xe ba gác, máy cày giữa các ấp, xã lân cận.
  - Ứng dụng của em kết nối trực tiếp P2P không qua trung gian, hoàn toàn miễn phí, không thu một đồng hoa hồng nào của người nông dân."*

---

## NHÓM 2: VỀ CƠ SỞ KHOA HỌC & TOÁN HỌC

### Câu 3: Cơ sở khoa học nào để em đưa ra công thức định giá nông sản theo số ngày sau thu hoạch?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, công thức của em dựa trên môn Sinh học và tài liệu Sinh lý thực vật sau thu hoạch của trường Đại học Nông Lâm:
  - Khi quả tách khỏi cành, quá trình hô hấp tế bào vẫn diễn ra, tiêu hao lượng đường dự trữ và nước qua biểu bì làm sụt giảm khối lượng và độ tươi.
  - Mỗi loại quả có hệ số suy giảm sinh học $r$ khác nhau: Cà chua vỏ mỏng hao hụt khoảng $5\%/\text{ngày}$; Dưa hấu vỏ dày hao hụt chậm hơn chỉ $3.3\%/\text{ngày}$; Xoài chín nhanh hao hụt $7\%/\text{ngày}$.
  - Điều kiện bảo quản đóng vai trò rất lớn: nhiệt độ cao ngoài trời nắng ($k=1.4$) làm enzym hoạt động mạnh gấp gần 3 lần so với giữ trong kho mát ($k=0.5$).
  - Em đã tổng hợp thành công thức: $V = \max(0,\; 1 - r \cdot k \cdot d)$ để suy ra giá bán khuyến nghị, bảo đảm có căn cứ khoa học chứ không hề cảm tính."*

### Câu 4: Tại sao em phải dùng `BigInt` (số nguyên lớn) để tính tiền mà không dùng phép nhân số thập phân thông thường?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, đây là một điểm kỹ thuật rất quan trọng trong môn Tin học:
  - Trong máy tính, các số thực có dấu phẩy động (chuẩn IEEE-754) luôn có sai số nhị phân nhỏ (ví dụ $0.1 + 0.2 = 0.30000000000000004$). Khi tính toán giá tiền nhân với phần trăm suy giảm, sai số này sẽ làm tiền bán bị lệch vài đồng hoặc làm nhảy nhầm ranh giới chất lượng giữa loại 1 và loại 2 (mốc $75\%$ và $40\%$).
  - Để bảo đảm quyền lợi tài chính chính xác tuyệt đối cho bà con nông dân, em đã nhân tỷ lệ với số nguyên lớn $10.000.000$ đơn vị bằng kiểu `BigInt` trong JavaScript, sau đó làm tròn nửa lên (`half-up`) đến hàng trăm đồng gần nhất. Nhờ đó, phép tính đạt độ chuẩn xác 100% trên mọi dòng điện thoại."*

### Câu 5: Con số 1.46 tấn $CO_2$ giảm phát thải cho mỗi tấn rơm rạ không bị đốt từ đâu mà ra?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, con số $1.46\text{ tấn } CO_2e/\text{tấn rơm}$ được em trích dẫn từ Báo cáo kiểm kê khí nhà kính nông nghiệp của Viện Lúa Đồng bằng sông Cửu Long và hướng dẫn của Ban liên chính phủ về biến đổi khí hậu (IPCC):
  - Khi đốt hở 1 tấn rơm khô ngoài trời, ngoài khí carbonic ($CO_2$), quá trình cháy không hoàn toàn còn sinh ra khí methane ($CH_4$) và dinitrogen monoxide ($N_2O$) — hai loại khí có tiềm năng làm nóng toàn cầu cao gấp 28 và 265 lần so với $CO_2$.
  - Khi quy đổi tương đương về tiềm năng nóng lên toàn cầu 100 năm ($GWP_{100}$), cứ ngăn chặn đốt được 1 tấn rơm sẽ giảm được khoảng $1.46\text{ tấn } CO_2$ tương đương thải vào bầu khí quyển."*

---

## NHÓM 3: VỀ CÔNG NGHỆ, BẢO MẬT & CHI PHÍ 0 ĐỒNG

### Câu 6: Làm sao ứng dụng có thể hoạt động được khi điện thoại nông dân bị mất sóng ngoài đồng?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, em ứng dụng công nghệ Web tiến bộ (Progressive Web App - PWA) kết hợp với Service Worker:
  - Khi mở ứng dụng lần đầu có mạng, toàn bộ giao diện, hình ảnh và mã logic tính giá (khoảng 400 KB) sẽ được Service Worker lưu tự động vào bộ nhớ đệm (Cache Storage) của trình duyệt.
  - Khi bà con mang điện thoại ra đồng mất sóng, Service Worker sẽ chặn các yêu cầu và nạp trực tiếp tài nguyên từ bộ nhớ máy tính mà không cần gửi lên Internet.
  - Các lượt tính giá ngoài đồng được lưu tạm vào hàng đợi LocalStorage; khi nào điện thoại bắt lại sóng Wi-Fi hoặc 4G, phần mềm sẽ tự động gửi số liệu đồng bộ về máy chủ."*

### Câu 7: Cơ chế mã nhận tin 4 số (`shortCode`) bảo mật như thế nào và tại sao lại dùng Crockford Base32?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, cơ chế này giúp xác thực giao dịch thu gom thực tế mà không cần tài khoản mật khẩu rườm rà:
  - Khi một tin được đăng, máy chủ sinh ra một mã bí mật 4 ký tự chỉ người bán nhìn thấy (ví dụ: `8K4M`).
  - Em sử dụng bảng mã Crockford Base32 (32 ký tự), loại bỏ hoàn toàn các chữ cái dễ nhầm lẫn như chữ `I`, chữ `L`, chữ `O` và chữ `U` để người nông dân đọc qua miệng không bị nghe nhầm.
  - Khi người mua tới ruộng bốc hàng xong, người bán mới đọc 4 ký tự này. Người mua nhập vào máy, máy chủ kiểm tra đúng mã thì tin mới chuyển sang 'Đã thu gom'. Điều này ngăn chặn kẻ xấu bấm phá hoại tin đăng của người khác."*

### Câu 8: Em nói chi phí máy chủ là 0 đồng, vậy hệ thống chạy ở đâu và duy trì lâu dài bằng cách nào?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô:
  - Hệ thống sử dụng Node.js bản địa và thư viện cơ sở dữ liệu `node:sqlite` tích hợp sẵn, lưu trữ toàn bộ dữ liệu trong 1 file SQLite ở chế độ ghi nhật ký WAL.
  - Máy chủ cực kỳ nhẹ, chỉ chiếm chưa đến 30 MB RAM, có thể chạy trực tiếp trên một chiếc máy tính bàn cũ tại phòng Tin học của trường hoặc phòng làm việc của Hợp tác xã xã Cẩm Đường.
  - Em không thuê máy chủ đám mây đắt tiền của nước ngoài, không dùng API bản quyền tính phí của Google Maps mà dùng thư viện bản đồ nguồn mở Leaflet và OpenStreetMap. Vì vậy, nhà trường và xã hoàn toàn có thể duy trì vận hành quanh năm với chi phí tiền điện máy tính thông thường."*

---

## NHÓM 4: VỀ TÍNH ỨNG DỤNG & ĐỐI TƯỢNG NÔNG DÂN

### Câu 9: Nông dân lớn tuổi, mắt kém, tay hay dính bùn đất thì sử dụng phần mềm này như thế nào?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, em đã khảo sát và thiết kế riêng cho bà con theo 3 tiêu chuẩn:
  1. **Nút bấm siêu to:** Mọi nút bấm và ô chọn đều có kích thước tối thiểu $48\text{px} \times 48\text{px}$, nút thu âm micro to đến $64\text{px}$, ngón tay to dính đất chạm vẫn rất dễ trúng.
  2. **Độ tương phản cực cao (chuẩn WCAG AAA):** Chữ đen đậm trên nền sáng ngà, màu xanh đậm, giúp nhìn ngoài nắng chói $35^\circ\text{C}$ không bị lóa mắt.
  3. **Không cần gõ phím:** Chỉ cần bấm 1 chạm vào micro và nói giọng tự nhiên, hệ thống tự điền thông tin vào 6 ô."*

### Câu 10: Nhận diện giọng nói có hiểu được giọng của bà con vùng nông thôn ĐBSCL không?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô:
  - Em sử dụng bộ nhận diện Web Speech API tiếng Việt kết hợp với bộ phân tích từ vựng (Regex Parser) do em tự xây dựng dựa trên các từ ngữ địa phương quen thuộc: ví dụ bà con hay nói 'công rơm', 'sào bắp', 'chục quả', 'trăm ký', 'dọn ruộng'.
  - Bộ bóc tách của em nhận diện được các từ khóa đó và tự động quy đổi: ví dụ nói '2 công rơm' thì hệ thống tự hiểu 1 công Nam Bộ là $1.000\text{ m}^2$ tương đương khoảng $1.111\text{ kg}$ rơm rạ khô.
  - Qua thử nghiệm thực tế với 20 người dùng tại Cẩm Đường, tỷ lệ phần mềm hiểu đúng ý câu nói đạt gần 89%."*

---

## NHÓM 5: VỀ VAI TRÒ & SỰ THAM GIA CỦA HỌC SINH

### Câu 11: Một học sinh lớp 9 làm sao có thể tự làm được cả hệ thống phần mềm phức tạp như thế này? Em làm phần nào và thầy giáo làm phần nào?
- **Gợi ý trả lời trung thực & thuyết phục nhất:**
  *"Dạ thưa Thầy/Cô, em xin thành thật báo cáo sự phân công như sau:
  - **Phần em trực tiếp thực hiện:** Em là người trực tiếp đi khảo sát thực tế tại các ấp ở Cẩm Đường, thu thập số liệu hao hụt 10 loại quả; em thiết kế giao diện HTML/CSS, vẽ các biểu tượng, bố cục nút bấm to cho bà con; em viết các hàm tính toán công thức theo độ tươi và cùng thầy viết các bài kiểm thử tự động.
  - **Phần Thầy hướng dẫn:** Thầy Hoàng Thành Đạt là người định hướng cho em về mô hình kiến trúc Isomorphic, tư vấn em dùng kiểu dữ liệu `BigInt` để triệt tiêu sai số làm tròn, hướng dẫn em cấu hình máy chủ Node.js và giám sát an toàn thông tin để đảm bảo không vi phạm an ninh dữ liệu.
  - Toàn bộ quá trình từ tuần 1 đến tuần 12 em đều trực tiếp ngồi máy thực hiện, viết nhật ký nghiên cứu và kiểm thử từng dòng lệnh nên em hoàn toàn hiểu rõ từng chức năng của hệ thống ạ."*

### Câu 12: Hướng phát triển tiếp theo của đề tài sau cuộc thi này là gì?
- **Gợi ý trả lời xuất sắc:**
  *"Dạ thưa Thầy/Cô, sau cuộc thi em có 2 định hướng phát triển cụ thể:
  1. Về phần cứng: Em muốn kết hợp thêm cảm biến đo độ ngọt (Brix) giá rẻ kết nối qua Bluetooth để khi nông dân thử nước quả, máy sẽ tự nhảy hệ số độ tươi mà không cần đoán ngày.
  2. Về thực tế địa phương: Em sẽ xin phép Ban Giám hiệu và UBND xã Cẩm Đường được bàn giao ứng dụng cho Hợp tác xã Nông nghiệp xã để chính thức thí điểm kết nối các đội xe ba gác, máy cày tự quản thu gom rơm cho các hộ trồng nấm rơm trong vụ mùa tới."*
