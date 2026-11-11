# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION)

**Dự án:** Nền tảng kết nối trao đổi phế phẩm nông nghiệp và hỗ trợ định giá nông sản theo độ tươi  
**Phiên bản:** v1.0 (MVP phục vụ thử nghiệm thực địa & thi KHKT cấp THCS)  
**Tham chiếu mục tiêu:** [01-goals.md](file:///d:/Work/CODE/khkt/docs/01-goals.md)

---

## 1. Phạm vi Hệ thống & Đối tượng sử dụng (Personas)

### 1.1. Các nhóm người dùng chính
1. **Nông dân (Người cung ứng phụ phẩm / Người bán nông sản):**
   - Độ tuổi phổ biến 40–65 tuổi, sử dụng điện thoại Android tầm trung/giá rẻ, thường thao tác ngoài đồng ruộng (ánh sáng chói, mạng yếu, tay bận/ngại gõ phím).
   - Nhu cầu: Nói 1 câu là đăng được tin dọn rơm rạ/phụ phẩm; kiểm tra nhanh giá nông sản hôm nay giảm bao nhiêu % để quyết định bán ngay hay xả hàng.
2. **Người thu gom / Cơ sở tái chế (Hộ nuôi bò, nhà trồng nấm, cơ sở ủ phân, thương lái tận dụng):**
   - Nhu cầu: Mở bản đồ lên thấy ngay quanh mình 5–10 km có ai đang cho/bán phụ phẩm gì, ước lượng bao nhiêu kg/sào để gọi xe phù hợp, bấm gọi điện hoặc nhắn Zalo là đi bốc được ngay.
3. **Nhóm nghiên cứu / Quản trị viên địa phương (Học sinh thực hiện đề tài, giáo viên, cán bộ HTX):**
   - Nhu cầu: Cập nhật danh mục nông sản & tỷ lệ hao hụt chuẩn theo khảo sát thực tế; rà soát tin đăng trùng/rác; xuất số liệu thực nghiệm (tổng kg, số giao dịch, lượng $CO_2$ quy đổi) để đưa vào báo cáo khoa học.

### 1.2. Ngoài phạm vi phiên bản MVP (Out of Scope)
Để giữ hệ thống **đủ tinh gọn cho học sinh THCS làm chủ 100%** và sát thói quen nông thôn:
- **Không** tích hợp cổng thanh toán trực tuyến, ví điện tử hay thu phí trung gian (hai bên tự thỏa thuận và trả tiền mặt/chuyển khoản trực tiếp khi giao nhận).
- **Không** làm hệ thống chat nội bộ phức tạp (tận dụng nút `Gọi điện` và `Zalo` có sẵn trên máy nông dân).
- **Không** sử dụng mô hình AI/Deep Learning "hộp đen" nhận diện ảnh hoặc dự đoán giá phức tạp.

---

## 2. Luồng nghiệp vụ khép kín (Core End-to-End Flow)

```text
[1. NÔNG DÂN CÓ PHỤ PHẨM]
   └─▶ Bấm Micro nói ("2 sào rơm ở gần đình làng...") hoặc chọn icon nhanh
   └─▶ Bộ phân tích Rule-based tự điền sẵn thông tin + lấy GPS (kéo ghim nếu cần)
   └─▶ Xác nhận 1 chạm ──▶ Tin lên Bản đồ số (Hạn tự ẩn sau N ngày)

[2. NÔNG DÂN CÓ NÔNG SẢN TƯƠI]
   └─▶ Mở Máy tính Độ tươi (chạy được cả khi mất mạng)
   └─▶ Chọn loại quả/rau + Giá loại 1 + Số ngày sau hái + Điều kiện bảo quản
   └─▶ Xem giá đề xuất + Biểu đồ suy giảm 3 ngày tới + Đọc to kết quả (TTS)
   └─▶ Nếu rơi vào Mức Đỏ (sắp hỏng / < 40% giá trị)
         └──▶ Bấm nút "Chuyển sang Sàn Phụ phẩm" ──▶ Tự động điền thông tin lên Bản đồ!

[3. NGƯỜI THU GOM / NUÔI BÒ / LÀM NẤM]
   └─▶ Mở Bản đồ phụ phẩm ──▶ Lọc trong bán kính 5km / 10km ──▶ Xem khối lượng ước tính
   └─▶ Bấm "Gọi điện" hoặc "Nhắn Zalo" ──▶ Đến bốc hàng
   └─▶ Một trong hai bên bấm "Đã thu gom xong" ──▶ Hệ thống cộng vào Thống kê tác động (kg & CO2)
```

---

## 3. Yêu cầu Chức năng (Functional Requirements)

### FR-1: Truy cập không rào cản & Định danh siêu tối giản
- **FR-1.1 (Xem không cần đăng nhập):** Bất kỳ ai mở ứng dụng đều xem được ngay Bản đồ phụ phẩm, Công cụ tính giá theo độ tươi và Bảng thống kê cộng đồng mà không bị màn hình đăng nhập chặn lại.
- **FR-1.2 (Thông tin người đăng tối giản):** Khi đăng tin lần đầu, người dùng chỉ cần nhập **Tên (hoặc Tên hộ)** và **Số điện thoại (10 chữ số VN)**; hệ thống lưu cục bộ trên trình duyệt (`LocalStorage`) để các lần sau không phải nhập lại.
- **FR-1.3 (Chế độ Đăng hộ):** Cho phép tick chọn *"Đăng giúp hộ khác"* khi người đăng là con cháu, hàng xóm hoặc học sinh khảo sát; khi đó hệ thống cho phép nhập Tên + SĐT liên hệ của chính hộ nông dân có phụ phẩm.

### FR-2: Sàn Kết nối Phụ phẩm Nông nghiệp trên Bản đồ số
- **FR-2.1 (Bản đồ số miễn phí):** Hiển thị bản đồ nền **OpenStreetMap** (hỗ trợ chuyển đổi lớp xem bản đồ đường phố và lớp bản đồ vệ tinh miễn phí nếu khả dụng để nông dân dễ nhìn thấy ruộng/mái nhà quen thuộc).
- **FR-2.2 (Phân loại & Hiển thị trực quan):**
  - Danh mục tối thiểu 6 nhóm phụ phẩm có biểu tượng & màu ghim riêng biệt:
    1. *Rơm rạ*
    2. *Thân / Lõi bắp (ngô)*
    3. *Vỏ trấu / Cà phê / Vỏ bưởi / Mùn cưa*
    4. *Bã mía / Bã sắn (khoai mì)*
    5. *Rau củ quả dập / Quá lứa (làm thức ăn chăn nuôi / ủ phân)*
    6. *Phụ phẩm khác*
  - Phân biệt rõ bằng nhãn/màu giữa tin **"Cho miễn phí (chỉ cần dọn)"** và **"Bán giá rẻ"**.
- **FR-2.3 (Định vị & Chỉnh ghim linh hoạt):**
  - Tự động lấy tọa độ GPS hiện tại khi người dùng cho phép.
  - Bắt buộc cho phép **chạm/kéo ghim trên bản đồ** để đặt lại vị trí (giải quyết trường hợp nông dân ngồi trong nhà đăng tin cho thửa ruộng cách đó vài trăm mét, hoặc GPS bị lệch).
  - Nếu thiết bị chặn GPS, cho phép chọn nhanh xã/thôn hoặc ghim thủ công trên bản đồ.
- **FR-2.4 (Quy đổi đơn vị địa phương sang khối lượng ước tính):**
  - Hỗ trợ nhập số lượng theo thói quen dân dã: `kg`, `tạ`, `tấn`, `bao tải`, `sào Bắc Bộ (360 m²)`, `sào Trung Bộ (500 m²)`, `công Nam Bộ (1.000 m²)`, `xe ba gác`.
  - Hệ thống có bảng hệ số quy đổi tham chiếu minh bạch (ví dụ: 1 sào Bắc Bộ lúa ước cho ~180–220 kg rơm khô; 1 bao tải ~20–25 kg) để hiển thị *"Ước tính ~400 kg"* giúp người thu gom chọn đúng xe chở và phục vụ thống kê.
- **FR-2.5 (Tìm kiếm, Lọc theo bán kính & Sắp xếp gần nhất):**
  - Bộ lọc đơn giản: Loại phụ phẩm, Hình thức (Cho miễn phí / Bán), Bán kính (`3 km`, `5 km`, `10 km`, `20 km`, `Tất cả`).
  - Tính khoảng cách đường chim bay bằng **công thức Haversine** (hiển thị *"Cách bạn 2,4 km"*), sắp xếp danh sách mặc định từ gần nhất đến xa nhất.
  - Có nút chuyển nhanh giữa chế độ xem **Bản đồ** và **Danh sách thẻ lớn**.
- **FR-2.6 (Kết nối 1 chạm & Vòng đời tin đăng):**
  - Trong thẻ chi tiết tin có nút lớn: `Gọi điện ngay` (`tel:<SĐT>`), `Mở Zalo`, và `Chỉ đường` (mở Google Maps / OSM dẫn đường tới ghim).
  - Mỗi tin có **Hạn cần dọn** (mặc định 3 ngày, chọn được 1–14 ngày). Quá hạn, tin tự động chuyển trạng thái `Hết hạn` (ẩn khỏi bản đồ công khai để không làm nhiễu dữ liệu).
  - Nút **"Đã thu gom / Đã dọn xong"**: Cho phép người đăng (hoặc người thu gom xác nhận kèm nhập SĐT người đăng/mã ngắn 4 số của tin) đánh dấu hoàn tất giao dịch và ghi nhận số kg thực tế vào bảng thống kê.

### FR-3: Nhập liệu 1 chạm bằng Giọng nói Tiếng Việt (Voice-to-Post)
- **FR-3.1 (Ghi âm tiếng Việt):** Nút Micro kích thước lớn đặt ngay đầu màn hình Đăng tin. Sử dụng nhận diện giọng nói tiếng Việt (`vi-VN`) chuyển lời nói thành văn bản hiển thị ngay trên màn hình để người dùng nhìn thấy hệ thống vừa nghe được gì.
- **FR-3.2 (Bộ phân tích câu nói minh bạch - Rule-based Parser):**
  - Không dùng AI hộp đen; sử dụng tập từ điển từ khóa và biểu thức chính quy (Regex) rõ ràng, học sinh giải thích được.
  - Từ câu nói tự nhiên (ví dụ: *"Tôi có 2 sào rơm rạ ở gần đình làng, cho không, cần dọn trong 2 ngày"*), hệ thống tự động tách và điền vào biểu mẫu:
    - **Loại phụ phẩm:** `rơm rạ` → chọn nhóm *Rơm rạ*.
    - **Số lượng & Đơn vị:** hỗ trợ cả số chữ (`một, hai, ba... mười, nửa, rưỡi`) và số (`2`, `3.5`) + đơn vị (`sào`, `công`, `bao`, `tạ`, `tấn`, `kg`, `xe`).
    - **Hình thức:** phát hiện `"cho"`, `"tặng"`, `"miễn phí"`, `"dọn giùm"` → *Cho miễn phí*; phát hiện `"bán"`, `"nghìn"`, `"k"`, `"đồng"` → *Bán*.
    - **Thời hạn dọn:** phát hiện `"trong 2 ngày"`, `"hôm nay"`, `"gấp"` → đặt số ngày hết hạn tương ứng.
    - **Ghi chú địa điểm:** giữ nguyên phần mô tả mốc địa danh (`"gần đình làng"`, `"đầu cầu..."`) đưa vào ô Mô tả ngắn.
- **FR-3.3 (Màn hình xác nhận & Fallback an toàn):**
  - Sau khi nói xong, hệ thống **không đăng mù ngay** mà hiển thị các thẻ đã điền sẵn với chữ lớn để nông dân kiểm tra/chạm sửa 1 cái rồi mới bấm `Đăng tin lên bản đồ`.
  - Nếu trình duyệt không hỗ trợ mic (hoặc môi trường ngoài ruộng quá ồn gió), hệ thống hiển thị thông báo thân thiện và cung cấp ngay **lưới nút chọn nhanh bằng hình ảnh** (không gây kẹt luồng sử dụng).

### FR-4: Công cụ Định giá Nông sản theo Độ tươi (Freshness Pricing Calculator)
- **FR-4.1 (Danh mục nông sản khảo sát & Khả năng mở rộng):**
  - Sẵn tối thiểu **5–8 loại nông sản** chia 3 nhóm sinh học (dữ liệu đặt trong file cấu hình minh bạch, có trích nguồn khảo sát):
    - *Nhóm hao hụt nhanh (8% – 12%/ngày):* Rau ăn lá (cải, xà lách, rau muống).
    - *Nhóm hao hụt trung bình (3% – 5%/ngày):* Cà chua, dưa leo, ớt, chuối chín.
    - *Nhóm hao hụt chậm (1.5% – 3%/ngày):* Cam, bưởi, khoai lang/củ.
  - Cho phép chọn `"Nông sản khác"` và tự chọn/nhập tỷ lệ hao hụt tham khảo.
- **FR-4.2 (Đầu vào đơn giản):**
  1. Chọn loại nông sản (nút bấm có hình ảnh minh họa).
  2. Nhập `Giá loại 1 mới hái tại vườn (đồng/kg)` (hỗ trợ nút tăng/giảm nhanh +1.000đ / -1.000đ và hiển thị giá tham khảo gợi ý tại địa phương nếu có).
  3. Chọn `Số ngày sau khi thu hoạch` (nút bấm to `0 ngày (Hôm nay)`, `1 ngày`, `2 ngày`... hoặc nút `+` / `-`).
  4. Chọn `Điều kiện bảo quản` (3 thẻ hình trực quan):
     - **Thoáng mát, có quạt:** Hệ số môi trường `k = 1.0` (giữ nguyên tỷ lệ hao hụt chuẩn).
     - **Kho lạnh / Thùng xốp đá:** Hệ số môi trường `k = 0.5` (giảm 50% tốc độ hao hụt).
     - **Ngoài trời nắng nóng / Ẩm ướt:** Hệ số môi trường `k = 1.4` (tăng 40% tốc độ hao hụt — cấu hình được trong khoảng `1.3 – 1.5`).
- **FR-4.3 (Công thức toán học chuẩn hóa & Không lỗi biên):**
  - Đặt:
    - $P_0$: Giá gốc loại 1 ban đầu (đồng/kg)
    - $r$: Tỷ lệ hao hụt chuẩn mỗi ngày (dạng thập phân, ví dụ `0.05` = 5%/ngày)
    - $k$: Hệ số điều chỉnh theo môi trường bảo quản (`0.5`, `1.0`, hoặc `1.4`)
    - $d$: Số ngày sau thu hoạch ($d \ge 0$)
  - Tính toán:
    - Tỷ lệ hao hụt thực tế mỗi ngày: $r_{\text{thực}} = r \times k$
    - Tỷ lệ giá trị còn lại (chặn cận dưới bằng 0 để không bao giờ ra giá âm):
      $$V_{\text{còn lại}} = \max\big(0,\; 1 - r_{\text{thực}} \times d\big)$$
    - Giá bán đề xuất (làm tròn đến hàng trăm đồng cho dễ giao dịch ngoài chợ):
      $$P_{\text{đề xuất}} = \text{round}_{100}\big(P_0 \times V_{\text{còn lại}}\big)$$
- **FR-4.4 (Giải thích trực quan, Dự báo 3 ngày tới & Đọc giọng nói):**
  - Hiển thị lời khuyên bằng ngôn ngữ đời thường: *"Đã hái 3 ngày, để quạt mát → Độ tươi còn 85% (giảm 15%). Giá bán hợp lý hôm nay là **17.000 đ/kg** thay vì cố giữ 20.000 đ/kg."*
  - Hiển thị **bảng/biểu đồ nhỏ dự báo 3 ngày tiếp theo** (Ngày mai giá còn bao nhiêu? Ngày kia còn bao nhiêu?) và mục **"Cách tính chi tiết"** bấm mở để học sinh dùng khi thuyết trình trước BGK.
  - Có nút **"Nghe kết quả" (Text-to-Speech tiếng Việt)** đọc to giá bán đề xuất và cảnh báo cho nông dân lớn tuổi.
- **FR-4.5 (Cảnh báo 3 mức & Cầu nối 1 chạm sang Sàn Phụ phẩm):**
  - **Mức Xanh** ($V_{\text{còn lại}} \ge 75\%$): *"Hàng còn tươi tốt – Bán theo giá đề xuất."*
  - **Mức Vàng** ($40\% \le V_{\text{còn lại}} < 75\%$): *"Đang xuống mã nhanh – Nên giảm giá đẩy bán hết ngay hôm nay để thu hồi vốn."*
  - **Mức Đỏ** ($V_{\text{còn lại}} < 40\%$ hoặc vượt quá số ngày sử dụng tươi an toàn): *"Không còn đạt chuẩn hàng tươi – Nguy cơ thối hỏng bỏ đi cao!"* → Hiển thị nút nổi bật **"Đẩy sang Sàn Phụ phẩm ngay (Bán rẻ làm thức ăn chăn nuôi / Cho ủ phân)"**, tự động điền loại nông sản & tên tin sang biểu mẫu Đăng tin trên bản đồ.

### FR-5: Bảng Thống kê Tác động & Dữ liệu Nghiên cứu (Impact & KHKT Data)
- **FR-5.1 (Thống kê công khai trên giao diện):**
  - Tổng số tin phụ phẩm đã đăng & số tin đã thu gom thành công.
  - Tổng khối lượng phụ phẩm ước tính đã được cứu khỏi đốt bỏ / thải bỏ (tấn hoặc kg).
  - Ước tính lượng khí thải $CO_2$ tránh được nhờ không đốt đồng (hiển thị kèm ghi chú công thức & hệ số tham khảo minh bạch để người xem và BGK kiểm chứng).
  - Tổng số lượt tra cứu công cụ định giá.
- **FR-5.2 (Quản trị & Xuất báo cáo phục vụ Tuần 9–12):**
  - Trang quản trị đơn giản (bảo vệ bằng mã PIN/mật khẩu dành cho nhóm học sinh & giáo viên) cho phép:
    - Chỉnh sửa/ẩn các tin đăng thử nghiệm, tin trùng lặp hoặc tin bị báo cáo sai.
    - Cập nhật bảng hệ số hao hụt và giá tham khảo địa phương.
    - Xuất dữ liệu thực nghiệm ra file **CSV** (đã che một phần SĐT nếu xuất cho phụ lục báo cáo công khai).

---

## 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

| Mã NFR | Hạng mục | Yêu cầu cụ thể & Ngưỡng kiểm chứng |
| :--- | :--- | :--- |
| **NFR-1** | **Giao diện thân thiện nông dân (Rural Accessibility)** | - Cỡ chữ nội dung chính tối thiểu `16px`, tiêu đề & nút hành động chính `18–22px`.<br>- Nút bấm kích thước tối thiểu `48×48px`, độ tương phản màu đạt chuẩn nhìn rõ dưới ánh nắng ngoài trời.<br>- Tuyệt đối dùng tiếng Việt phổ thông (không viết "Submit", "Filter", "Radius", "Freshness Score" trên giao diện người dùng). |
| **NFR-2** | **Chạy mượt trên mạng yếu & Hỗ trợ Offline** | - Dung lượng tải ban đầu gọn nhẹ (`< 1.5 MB` cho gói ứng dụng chính).<br>- Tích hợp **PWA (Service Worker + LocalStorage)**: Công cụ tính giá theo độ tươi phải mở và tính toán được bình thường **khi tắt Wi-Fi / 4G**. |
| **NFR-3** | **Tương thích thiết bị & Chi phí 0 đồng** | - Thiết kế Mobile-first cho màn hình dọc `360px – 430px` (điện thoại Android giá rẻ) và tự co giãn hợp lý trên máy tính bảng/Laptop khi trình chiếu cho BGK.<br>- 100% hạ tầng miễn phí (OpenStreetMap, Web Speech API / SpeechSynthesis, lưu trữ đám mây gói miễn phí hoặc máy chủ miễn phí), không cần thẻ tín dụng hay key trả phí. |
| **NFR-4** | **Tính toàn vẹn dữ liệu & Chống tin rác** | - Kiểm tra hợp lệ: SĐT Việt Nam (10 số bắt đầu bằng `0`), giá bán `> 0`, số ngày `>= 0`.<br>- Giới hạn tối đa số tin đang hoạt động trên cùng 1 SĐT (ví dụ tối đa `5 tin` đang mở) để tránh spam bản đồ.<br>- Nút `"Báo cáo tin sai / đã dọn"` giúp cộng đồng tự lọc tin hết hạn. |
| **NFR-5** | **Tính sư phạm & Bảo trì (Phù hợp THCS)** | - Tách biệt rạch ròi file dữ liệu cấu hình nông sản/quy đổi đơn vị, hàm toán học tính giá (có bộ kiểm thử tự động các ca biên), bộ tách từ khóa giọng nói (có bảng từ khóa rõ ràng) và phần giao diện.<br>- Mã nguồn có chú thích tiếng Việt rõ ràng ở các thuật toán cốt lõi để học sinh đọc hiểu và tự thuyết trình. |

---

## 5. Mô hình Dữ liệu Logic (Conceptual Data Entities)

*(Thiết kế ở mức logic để bước sau có thể triển khai linh hoạt trên Firebase Firestore, Supabase hoặc SQLite/JSON mà không phụ thuộc công nghệ)*

1. **`CropConfig` (Cấu hình Nông sản & Độ tươi — lưu sẵn trong app để chạy Offline):**
   - `id`, `name` (tên nông sản), `category` (Rau lá / Quả vỏ mỏng / Quả vỏ dày-Củ), `icon`
   - `dailyDecayRate` (tỷ lệ hao hụt chuẩn/ngày, VD `0.10` cho rau ăn lá)
   - `maxShelfLifeDays` (số ngày tối đa giữ tươi chuẩn)
   - `referencePriceVnd` (giá loại 1 tham khảo tại địa phương, có thể để nông dân sửa)
   - `sourceNote` (ghi chú nguồn khảo sát/tài liệu để thuyết trình BGK)
2. **`ByproductListing` (Tin đăng Sàn Phụ phẩm trên Bản đồ):**
   - `id`, `shortCode` (mã ngắn 4 ký tự để xác nhận nhanh)
   - `category` (Rơm rạ, Thân bắp, Vỏ trấu/cà phê/bưởi, Bã mía/sắn, Rau quả loại, Khác)
   - `offerType` (`free` | `sell`), `priceNote` (tùy chọn nếu bán)
   - `rawQuantity`, `rawUnit` (VD: `2`, `sào Bắc Bộ`), `estimatedKg` (số kg quy đổi để thống kê & gợi ý xe chở)
   - `lat`, `lng`, `locationNote` (VD: `"Gần đình làng..."`)
   - `contactName`, `contactPhone`, `isProxyPost` (đăng hộ hay tự đăng)
   - `rawVoiceText` (câu nói gốc nếu đăng bằng micro — phục vụ đánh giá độ chính xác bộ phân tích)
   - `status` (`active` | `collected` | `expired` | `reported`)
   - `createdAt`, `expiresAt`, `collectedAt`, `actualKgCollected`
3. **`ImpactMetrics` (Thống kê Thực nghiệm & Tác động):**
   - `totalListings`, `collectedListings`, `totalKgDiverted`, `estimatedCo2SavedKg`, `totalPriceCalculations`

---

## 6. Tiêu chí Nghiệm thu MVP (Acceptance Criteria Checklist)

Trước khi mang phần mềm đi thử nghiệm thực địa ở Tuần 9, phiên bản MVP phải đạt **100%** các tiêu chí sau:
- [ ] Mở được trên trình duyệt Chrome điện thoại Android màn hình `360px` không bị tràn ngang, chữ đọc rõ ràng.
- [ ] Nhấn nút Micro nói 1 câu mẫu tiếng Việt chứa loại phụ phẩm + số lượng + đơn vị → hệ thống bóc tách đúng và điền sẵn tối thiểu **3 trường** (`Loại`, `Số lượng`, `Đơn vị`).
- [ ] Khi từ chối cấp quyền Micro hoặc ngắt mạng, vẫn đăng tin / tính giá được bình thường qua luồng dự phòng (không treo hay báo lỗi chết màn hình).
- [ ] Ghim được vị trí trên bản đồ OpenStreetMap (cả tự động GPS lẫn kéo tay đặt lại ghim); danh sách hiển thị đúng khoảng cách `km` tăng dần.
- [ ] Bấm vào tin bất kỳ có thể gọi điện ngay (`tel:`) và đánh dấu `"Đã thu gom xong"`, thấy chỉ số **Tổng kg & $CO_2$ tránh phát thải** trên bảng thống kê tăng lên tương ứng.
- [ ] Kiểm thử công thức định giá với trường hợp biên (`0 ngày`, `3 ngày quạt mát`, `5 ngày nắng nóng`, `15 ngày quá hạn`): giá **không bao giờ âm**, tự động chuyển sang **Mức Đỏ** và bấm 1 chạm chuyển được thông tin sang màn hình Đăng tin phụ phẩm.
- [ ] Tắt toàn bộ Wi-Fi/4G trên điện thoại, tải lại trang: Công cụ định giá nông sản vẫn mở và tính toán ra kết quả chính xác.

