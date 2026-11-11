# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION)

- **Dự án:** Nền tảng kết nối trao đổi phế phẩm nông nghiệp và hỗ trợ định giá nông sản theo độ tươi (Nông sản Tuần hoàn ĐBSCL)
- **Phiên bản:** v1.1 (Bản hoàn thiện MVP phục vụ thử nghiệm thực địa & thi KHKT cấp THCS)
- **Tham chiếu mục tiêu:** [01-goals.md](./01-goals.md) · **Tài liệu kỹ thuật THCS:** [03-thcs-technical-guide.md](./03-thcs-technical-guide.md)

---

## 1. Phạm vi Hệ thống & Đối tượng sử dụng (Personas)

### 1.1. Các nhóm người dùng chính
1. **Nông dân (Người cung ứng phụ phẩm / Người bán nông sản):**
   - Độ tuổi phổ biến 40–65 tuổi (mặc định vùng Đồng bằng sông Cửu Long — ĐBSCL, có bộ chọn chuyển sang Miền Trung và Miền Bắc), sử dụng điện thoại Android tầm trung/giá rẻ, thường thao tác ngoài đồng ruộng (ánh sáng chói, mạng yếu, tay bận/ngại gõ phím).
   - Nhu cầu: Nói 1 câu là đăng được tin dọn rơm rạ/phụ phẩm; kiểm tra nhanh giá nông sản hôm nay giảm bao nhiêu % để quyết định bán ngay hay xả hàng.
2. **Người thu gom / Cơ sở tái chế (Hộ nuôi bò, nhà trồng nấm, cơ sở ủ phân, thương lái tận dụng):**
   - Nhu cầu: Mở bản đồ lên thấy ngay quanh mình 3–20 km có ai đang cho/bán phụ phẩm gì, ước lượng bao nhiêu kg/công/sào để gọi xe phù hợp, bấm gọi điện hoặc nhắn Zalo là đi bốc được ngay.
3. **Nhóm nghiên cứu / Quản trị viên địa phương (Học sinh thực hiện đề tài, giáo viên, cán bộ HTX):**
   - Nhu cầu: Cập nhật danh mục nông sản & tỷ lệ hao hụt chuẩn theo khảo sát thực tế; rà soát tin đăng trùng/bị báo cáo; xuất số liệu thực nghiệm (tổng kg, số giao dịch, lượng $CO_2$ quy đổi, tổng lượt tra cứu) ra CSV để đưa vào báo cáo khoa học.

### 1.2. Ngoài phạm vi phiên bản MVP (Out of Scope)
Để giữ hệ thống **đủ tinh gọn cho học sinh THCS làm chủ 100%** và sát thói quen nông thôn:
- **Không** tích hợp cổng thanh toán trực tuyến, ví điện tử hay thu phí trung gian (hai bên tự thỏa thuận và trả tiền mặt/chuyển khoản trực tiếp khi giao nhận).
- **Không** làm hệ thống chat nội bộ phức tạp (tận dụng nút `Gọi điện ngay`, `Mở Zalo`, và `Chỉ đường`).
- **Không** sử dụng mô hình AI/Deep Learning "hộp đen" nhận diện ảnh hoặc dự đoán giá phức tạp.

---

## 2. Luồng nghiệp vụ khép kín (Core End-to-End Flow)

```text
[1. NÔNG DÂN CÓ PHỤ PHẨM]
   └─▶ Bấm Micro nói ("2 công rơm rạ ở gần đình làng...") hoặc chọn 1 trong 6 ô biểu tượng
   └─▶ Bộ phân tích Rule-based tự điền sẵn thẻ xác nhận (có ô <textarea> chỉnh sửa + nút "Phân tích câu nói")
   └─▶ Tự động dò GPS (8 giây) hoặc kéo ghim / chọn xã-phường ──▶ Bấm "Đăng tin lên bản đồ"
   └─▶ Tin hiển thị công khai trên Bản đồ số (hạn 1–14 ngày, mặc định 3 ngày) và cấp mã ngắn 4 ký tự (shortCode)

[2. NÔNG DÂN CÓ NÔNG SẢN TƯƠI]
   └─▶ Mở Công cụ Tính giá độ tươi (PWA cache chạy được 100% khi tắt mạng)
   └─▶ Chọn loại nông sản + Giá loại 1 + Số ngày sau hái + Điều kiện bảo quản
   └─▶ Xem giá đề xuất (BigInt) + Dự báo 3 ngày tới + "Cách tính chi tiết" + "Nghe kết quả" (TTS)
   └─▶ Nếu rơi vào Mức Đỏ (< 40% giá trị hoặc vượt quá số ngày giữ tươi tối đa)
         └──▶ Bấm nút "Đẩy sang Sàn Phụ phẩm ngay" ──▶ Tự động điền thông tin sang biểu mẫu Đăng tin!

[3. NGƯỜI THU GOM / NUÔI BÒ / LÀM NẤM]
   └─▶ Mở Bản đồ phụ phẩm ──▶ Lọc trong bán kính 3–20 km (mặc định sắp xếp gần nhất theo Haversine)
   └─▶ Bấm "Gọi điện ngay", "Mở Zalo" hoặc "Chỉ đường" ──▶ Đến bốc hàng và nhận mã 4 ký tự từ chủ tin
   └─▶ Nhập đúng mã ngắn 4 ký tự (shortCode) + khối lượng thực tế (kg) vào mục "Đã thu gom xong"
         └──▶ Tin rời khỏi bản đồ công khai ──▶ Hệ thống cộng vào Thống kê tác động (kg & CO2)
```

---

## 3. Yêu cầu Chức năng (Functional Requirements)

### FR-1: Truy cập không rào cản & Định danh siêu tối giản
- **FR-1.1 (Xem không cần đăng nhập):** Bất kỳ ai mở ứng dụng đều xem được ngay Bản đồ phụ phẩm, Công cụ tính giá theo độ tươi và Bảng thống kê cộng đồng mà không bị màn hình đăng nhập chặn lại.
- **FR-1.2 (Thông tin người đăng tối giản & Biên nhận cục bộ):** Khi đăng tin lần đầu, người dùng chỉ cần nhập **Tên (hoặc Tên hộ)** và **Số điện thoại (10 chữ số VN bắt đầu bằng `0`)**; hệ thống lưu cục bộ trên trình duyệt (`localStorage` bọc `try/catch` an toàn ở chế độ riêng tư) cùng tối đa `50` biên nhận `shortCode` theo cơ chế FIFO.
- **FR-1.3 (Chế độ Đăng hộ):** Cho phép chọn *"Đăng giúp hộ khác"* (`isProxyPost`) khi người đăng là con cháu, hàng xóm hoặc học sinh khảo sát; hệ thống giữ nguyên hồ sơ cá nhân của người đăng hộ trong `localStorage` và cho phép nhập Tên + SĐT liên hệ của chính hộ nông dân có phụ phẩm.

### FR-2: Sàn Kết nối Phụ phẩm Nông nghiệp trên Bản đồ số
- **FR-2.1 (Bản đồ số miễn phí):** Hiển thị bản đồ nền **OpenStreetMap** qua thư viện cục bộ `leaflet@1.9.4`, hỗ trợ chuyển đổi giữa lớp bản đồ đường phố và lớp ảnh vệ tinh Esri World Imagery; khi ngoại tuyến hiển thị cảnh báo thân thiện và cho phép chuyển sang danh sách.
- **FR-2.2 (Phân loại & Hiển thị trực quan):**
  - 6 nhóm phụ phẩm có biểu tượng, màu sắc ghim `L.divIcon` và nhãn phân biệt riêng:
    1. `rom-ra`: *Rơm rạ*
    2. `than-bap`: *Thân / Lõi bắp*
    3. `vo-trau-vo-qua`: *Vỏ trấu / Vỏ bưởi / Mùn cưa*
    4. `ba-mia-ba-san`: *Bã mía / Bã sắn*
    5. `rau-cu-qua`: *Rau củ quả dập / Quá lứa*
    6. `phu-pham-khac`: *Phụ phẩm khác*
  - Phân biệt rõ bằng nhãn/màu giữa tin **"Cho miễn phí (chỉ cần dọn)"** (`free`) và **"Bán giá rẻ"** (`sell`).
- **FR-2.3 (Định vị & Chỉnh ghim linh hoạt):**
  - Tự động lấy tọa độ GPS hiện tại (`timeout: 8000 ms`) khi người dùng chưa chạm ghim; cờ `pinTouchedByUser` ngăn kết quả GPS trễ ghi đè tọa độ người dùng đã kéo ghim hoặc chọn xã.
  - Cho phép **kéo thả ghim / chạm bản đồ** để đặt lại vị trí chính xác ngoài ruộng.
  - Hỗ trợ bộ chọn nhanh **xã / phường** theo 3 khu vực (`ĐBSCL` mặc định `công Nam Bộ 1.000 m²`, `Miền Trung` `sào Trung Bộ 500 m²`, `Miền Bắc` `sào Bắc Bộ 360 m²`) khi tắt GPS hoặc truy cập HTTP mạng nội bộ.
- **FR-2.4 (Quy đổi đơn vị địa phương sang khối lượng ước tính):**
  - Hỗ trợ đầy đủ 8 đơn vị dân dã trong `src/shared/units.js`: `kg` (`1`), `tạ` (`100`), `tấn` (`1.000`), `bao tải` (`22,5 kg` — trung điểm 20–25 kg), `xe ba gác` (`300 kg`), `sào Bắc Bộ` (`360 m²`), `sào Trung Bộ` (`500 m²`), `công Nam Bộ` (`1.000 m²`).
  - Đơn vị diện tích quy đổi tỷ lệ tuyến tính từ mốc chuẩn `200 kg / 360 m²`: $\text{kg} = \text{Math.round}(\text{rawQuantity} \times \text{areaM2} \times 200 / 360)$ (ví dụ `1 sào Bắc Bộ = 200 kg`, `2 công Nam Bộ = 1.111 kg`). Máy chủ luôn tự tính `estimatedKg`, bỏ qua giá trị gửi giả từ phía client.
- **FR-2.5 (Tìm kiếm, Lọc theo bán kính & Sắp xếp gần nhất):**
  - Bộ lọc: Loại phụ phẩm, Hình thức (`Cho & Bán`), Bán kính (`3 km`, `5 km`, `10 km`, `20 km`, `Tất cả`).
  - Tính khoảng cách bằng **công thức Haversine** (`EARTH_RADIUS_KM = 6371`), sắp xếp danh sách tăng dần từ gần nhất đến xa nhất và hỗ trợ chuyển đổi **Bản đồ** / **Danh sách** (phân trang `20` tin/lượt).
- **FR-2.6 (Kết nối 1 chạm & Vòng đời tin đăng — cập nhật quyết định bảo mật `shortCode`):**
  - Trong thẻ chi tiết tin có nút: `Gọi điện ngay` (`tel:`), `Mở Zalo` (`https://zalo.me/...`), và `Chỉ đường` (`https://www.google.com/maps/dir/...`).
  - Mỗi tin có **Hạn cần dọn** từ `1–14 ngày` (mặc định `3 ngày`). Khi quá hạn (`expiresAt <= now`), tin tự động bị lọc khỏi bảng tin công khai `/api/listings` và bộ đếm `activeListings`.
  - **Xác nhận `"Đã thu gom xong"`:** Để tránh người lạ lấy số điện thoại công khai trên bản đồ tự ý đóng tin của nông dân, hệ thống **bắt buộc dùng mã ngắn 4 ký tự Crockford Base32 (`shortCode`)** do chủ tin giữ khi đăng bài (so khớp bằng `crypto.timingSafeEqual`; gửi SĐT công khai hoặc sai mã bị từ chối `403`, khóa tạm sau `5` lần nhập sai / 15 phút theo `[ip, id]`). Khối lượng thực tế ghi nhận bị chặn ngưỡng an toàn: $0 < \text{actualKgCollected} \le \min(100.000,\; \max(500,\; \text{estimatedKg} \times 3))$.
  - **Báo cáo tin sai / đã dọn:** Giới hạn `1` lượt / `(ip, id)` / 15 phút và chống trùng lặp theo cookie `khkt_voter` ký HMAC-SHA256 (hoặc fallback IP). Khi đạt `>= 3` lượt báo cáo hợp lệ, tin tự động chuyển sang trạng thái `reported` và ẩn khỏi bản đồ công khai chờ quản trị viên kiểm tra.

### FR-3: Nhập liệu 1 chạm bằng Giọng nói Tiếng Việt (Voice-to-Post)
- **FR-3.1 (Ghi âm tiếng Việt):** Nút Micro kích thước lớn (`64px`) đầu màn hình Đăng tin dùng Web Speech API (`vi-VN`, tự dừng an toàn sau `10 giây` chờ), đổ kết quả vào ô `<textarea>` cho phép sửa trực tiếp.
- **FR-3.2 (Bộ phân tích câu nói minh bạch — Rule-based Parser):**
  - Không dùng AI hộp đen; dùng từ điển từ khóa và biểu thức chính quy trong `src/shared/voice-parser.js` (giới hạn `500` ký tự Unicode codepoint).
  - Tách tự động: nhóm phụ phẩm (`CATEGORY_KEYWORDS`), số lượng (hỗ trợ chữ số, dấu phẩy thập phân `"2,5"`, chữ số tiếng Việt `"một..mười"`, `"nửa"`, `"rưỡi"`, `"chục"`, `"trăm"`), đơn vị (`UNIT_KEYWORDS`, tự phân biệt `"sào"` theo khu vực đang chọn), hình thức (`free` / `sell`), thời hạn (`1–14 ngày`, mặc định `3`), và mốc địa điểm (`"ở gần"`, `"đầu cầu"`, `"ấp"`, `"xã"`...).
- **FR-3.3 (Màn hình xác nhận & Fallback an toàn):**
  - Sau khi nói xong hoặc nhấn nút **"Phân tích câu nói"**, hệ thống **không đăng mù ngay** mà điền sẵn thông tin vào các thẻ bên dưới để kiểm tra trước khi bấm `Đăng tin lên bản đồ`.
  - Nếu trình duyệt không hỗ trợ micro, bị chặn quyền, hoặc truy cập HTTP LAN không an toàn, hệ thống hiện thông báo không chặn luồng và cung cấp ngay **lưới 6 nhóm phụ phẩm bằng biểu tượng** + ô nhập tay `<textarea>`.

### FR-4: Công cụ Định giá Nông sản theo Độ tươi (Freshness Pricing Calculator)
- **FR-4.1 (Danh mục nông sản khảo sát & Khả năng mở rộng):**
  - Cấu hình sẵn **9 loại nông sản** trong `src/shared/crops.js` chia 3 nhóm sinh học (`Rau lá`: Rau muống, Cải xanh; `Quả vỏ mỏng`: Cà chua, Xoài cát, Dưa leo; `Quả vỏ dày / Củ`: Bưởi da xanh, Sầu riêng, Khoai lang, Cam sành), kèm `icon`, `referencePriceVnd` và `sourceNote` khảo sát.
  - Cho phép chọn **"Nông sản khác"** để tự nhập tên, tỷ lệ hao hụt (`0,1 – 50%/ngày`) và số ngày giữ tươi tối đa (`1 – 365 ngày`).
- **FR-4.2 (Đầu vào đơn giản):**
  1. Chọn loại nông sản (nút bấm có biểu tượng minh họa).
  2. Nhập `Giá loại 1 mới hái tại vườn (đồng/kg)` (tự điền sẵn giá tham khảo địa phương, có nút `-1.000đ` / `+1.000đ`).
  3. Chọn `Số ngày sau khi thu hoạch` (nút chọn nhanh `0, 1, 2, 3, 5 ngày` và nút `-1` / `+1 ngày`, tối đa `3647` ngày để dự báo 3 ngày tới không vượt `3650`).
  4. Chọn `Điều kiện bảo quản` (3 thẻ cố định trong MVP):
     - **Kho lạnh (`cold`):** $k = 0{,}5$
     - **Quạt mát (`fan`):** $k = 1{,}0$
     - **Nắng nóng (`hot`):** $k = 1{,}4$ (cố định giá trị giữa của khoảng `1,3 – 1,5` trong MVP để đảm bảo kết quả nhất quán giữa các thiết bị).
- **FR-4.3 (Công thức toán học chuẩn hóa bằng `BigInt` & Không lỗi biên):**
  - Để loại bỏ hoàn toàn sai số làm tròn dấu phẩy động IEEE-754 tại các mốc ranh giới `75%` và `40%`, hàm `calculateFreshnessPrice` trong `src/shared/pricing.js` dùng số nguyên lớn **`BigInt`** với `SCALE = 10_000_000n`:
    - $r_{\text{micro}} = \text{BigInt}(\text{Math.round}(r \times 1.000.000))$
    - $\text{decayScaled} = r_{\text{micro}} \times k_{\text{deci}} \times d$ (với $k_{\text{deci}} \in \{5n, 10n, 14n\}$)
    - $V_{\text{scaled}} = \max(0n,\; 10\_000\_000n - \text{decayScaled})$
    - Giá bán đề xuất làm tròn **nửa lên (`half-up`) tới hàng trăm đồng**:
      $$P_{\text{đề xuất}} = \left\lfloor \frac{P_0 \times V_{\text{scaled}} + 500\_000\_000n}{1\_000\_000\_000n} \right\rfloor \times 100$$
- **FR-4.4 (Giải thích trực quan, Dự báo 3 ngày tới & Đọc giọng nói):**
  - Hiển thị lời khuyên tiếng Việt đời thường, **bảng dự báo 3 ngày tiếp theo** (`projectThreeDays`), mục bấm mở **"Cách tính chi tiết"** kèm nguồn khảo sát `sourceNote`, và nút **"Nghe kết quả"** (Text-to-Speech `vi-VN`, tự reset khóa sau `15 giây`).
- **FR-4.5 (Cảnh báo 3 mức & Cầu nối 1 chạm sang Sàn Phụ phẩm):**
  - **Mức Xanh** ($V_{\text{scaled}} \ge 7\_500\_000n$, tức $\ge 75\%$ và chưa quá hạn tươi): *"Hàng còn tươi tốt, bán theo giá đề xuất."*
  - **Mức Vàng** ($4\_000\_000n \le V_{\text{scaled}} < 7\_500\_000n$, tức $40\% \le V < 75\%$ và chưa quá hạn tươi): *"Đang xuống mã nhanh, nên giảm giá đẩy bán hết ngay hôm nay để thu hồi vốn."*
  - **Mức Đỏ** ($V_{\text{scaled}} < 4\_000\_000n$ hoặc $d > \text{maxShelfLifeDays}$): Hiện nút **"Đẩy sang Sàn Phụ phẩm ngay"**, tự động điền nhóm phụ phẩm, hình thức (`sell`/`free`), gợi ý giá và chuyển thẳng sang màn hình Đăng tin.

### FR-5: Bảng Thống kê Tác động & Quản trị Nghiên cứu (Impact & KHKT Data)
- **FR-5.1 (Thống kê công khai trên giao diện):**
  - Hiển thị tổng khối lượng phụ phẩm cứu được (`totalKgDiverted`, ưu tiên `actualKgCollected`, nếu chưa nhập dùng `estimatedKg`), ước tính khí thải $CO_2$ tránh phát thải theo hệ số **1,46 kg $CO_2$ / kg** (`CO2_KG_PER_KG_DIVERTED = 1.46`, tham chiếu đốt rơm rạ IPCC/FAO), `totalListings`, `activeListings` (đang mở và còn hạn), `collectedListings`, và `totalPriceCalculations` (đồng bộ từ hàng đợi `localStorage` mỗi lô tối đa `500` lượt lên `POST /api/metrics/calculation`).
- **FR-5.2 (Quản trị & Xuất báo cáo phục vụ Tuần 9–12):**
  - Trang Quản trị bảo vệ bằng biến môi trường `ADMIN_PIN` ($\ge 6$ ký tự, không chứa ký tự điều khiển). Nếu `ADMIN_PIN` chưa cấu hình hoặc `< 6` ký tự, tất cả API `/api/admin*` từ chối an toàn với mã `503` (fail-closed).
  - Kho phiên quản trị lưu trong bộ nhớ máy chủ (`createAdminSessionStore` với tối đa `64` phiên đồng thời và thời hạn `4 giờ`), cookie `HttpOnly; SameSite=Strict`.
  - Hỗ trợ ẩn tin (`hide`), khôi phục tin bị báo cáo/đã ẩn (`restore`, xóa báo cáo về `0` và gia hạn `expiryDays` nếu hết hạn), chỉnh sửa thông tin tin chưa thu gom (`edit`, từ chối `409` với tin `collected`), cập nhật hệ số nông sản (`PATCH /api/admin/crops/:id`), và xuất file **CSV** (`GET /api/admin/export.csv`) chuẩn RFC-4180 có che số điện thoại (`091***6789`), bỏ hoàn toàn bí mật (`short_code`, `client_request_id`), vô hiệu hóa công thức bảng tính (`=`, `+`, `-`, `@`, `\t`, `\r`) cả đầu ô lẫn sau ký tự xuống dòng, và kèm dòng tổng hợp tác động.

---

## 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

| Mã NFR | Hạng mục | Yêu cầu cụ thể & Ngưỡng kiểm chứng |
| :--- | :--- | :--- |
| **NFR-1** | **Giao diện thân thiện nông dân (Rural Accessibility)** | - Cỡ chữ nội dung chính `16px`, tiêu đề & nút hành động chính `18–20px` (`--text-lg: 20px`).<br>- Nút bấm kích thước tối thiểu `48×48px`, chế độ sáng ban ngày (`color-scheme: light`) độ tương phản cao ngoài trời.<br>- 100% tiếng Việt phổ thông trong giao diện người dùng, không có mã HTML chưa thoát (`.textContent`). |
| **NFR-2** | **Chạy mượt trên mạng yếu & Hỗ trợ Offline** | - Tổng dung lượng tải ban đầu của gói PWA (`public/**/*` + `src/shared/*.js` + 7 tệp `leaflet@1.9.4`) **< 1,5 MB (`1.572.864` byte)**.<br>- Service Worker (`public/sw.js` nạp kiểu `{ type: 'module' }`, cache `khkt-pwa-v2`) lưu đệm toàn bộ ứng dụng, 7 tệp Leaflet và `/api/crops`, không bao giờ cache `/api/admin/*`, `/api/listings`, `/api/impact`.<br>- Hàng đợi lượt tính giá lưu bất biến trong `localStorage` và tự đồng bộ khi có mạng lại (`'online'`). |
| **NFR-3** | **Tương thích thiết bị & Chi phí 0 đồng** | - Mobile-first màn hình `360px` không tràn ngang, tự co giãn hợp lý trên máy tính bảng/Laptop (`>= 768px`).<br>- Chạy trên Node.js `>= 26.4` + SQLite tích hợp (`node:sqlite`), duy nhất 1 thư viện ngoài cố định phiên bản `leaflet@1.9.4`, chi phí vận hành `0 VNĐ`. |
| **NFR-4** | **Tính toàn vẹn dữ liệu & Chống tin rác** | - Kiểm tra hợp lệ: SĐT VN (`^0\d{9}$`), giới hạn `<= 5` tin đang mở còn hạn trên 1 SĐT, idempotency theo `(contact_phone, client_request_id)`, giao dịch SQLite `BEGIN IMMEDIATE` + `PRAGMA busy_timeout = 5000`.<br>- Chuẩn hóa đường dẫn chặn ký tự điều khiển (`\u0000-\u001f`, `\u007f`), giới hạn thân JSON `32 KB` (`413`), giới hạn tần suất theo IP và `(ip, id)` (`MAX_RATE_KEYS = 4096`). |
| **NFR-5** | **Tính sư phạm & Bảo trì (`no-comments` — Cập nhật quyết định kiến trúc)** | - Tách biệt rạch ròi 3 lớp: `src/shared/` (thuần ESM, không dùng biến toàn cục Node), `src/server/`, và `public/`.<br>- **Quyết định `no-comments`:** Toàn bộ mã nguồn trong `src/`, `public/`, `scripts/`, `tests/` duy trì **0 chú thích nội tuyến** (`//`, `/* */`, `<!-- -->`) để tránh chú thích trôi lệch khỏi code khi chỉnh sửa. Mọi giải thích toán học, luồng xử lý và hướng dẫn thuyết trình cho học sinh THCS được tập trung có cấu trúc trong [03-thcs-technical-guide.md](./03-thcs-technical-guide.md) và được kiểm chứng tự động bằng bộ 54 kiểm thử + `scripts/verify-docs-and-bundle.mjs`. |

---

## 5. Mô hình Dữ liệu Logic (Triển khai trên SQLite `node:sqlite` & `LocalStorage`)

1. **`CropConfig` (Cấu hình mặc định trong `src/shared/crops.js` + bảng `crop_overrides` trong SQLite):**
   - `id`, `name`, `category` (`Rau lá` | `Quả vỏ mỏng` | `Quả vỏ dày / Củ`), `icon`
   - `dailyDecayRate` (`0.001`–`0.50`), `maxShelfLifeDays` (`1`–`365`), `referencePriceVnd` (`100`–`10.000.000`), `byproductCategory`, `sourceNote`
2. **`ByproductListing` (Bảng `listings` và bảng `listing_reports` trong SQLite):**
   - `id` (số nguyên dương chuẩn hóa `/^[1-9]\d{0,9}$/`), `shortCode` (4 ký tự Crockford Base32 — chỉ trả về lúc tạo tin, không xuất ra feed công khai/quản trị/CSV)
   - `category`, `offerType` (`free` | `sell`), `priceNote`, `rawQuantity`, `rawUnit`, `estimatedKg`
   - `lat`, `lng`, `locationNote`, `contactName`, `contactPhone`, `isProxyPost`, `rawVoiceText`, `clientRequestId`
   - `status` (`active` | `collected` | `hidden` | `reported`) — tin quá hạn (`expiresAt <= now`) được lọc động khỏi bảng tin công khai và thống kê `activeListings` theo thời gian thực
   - `reportCount`, `createdAt`, `expiresAt`, `collectedAt`, `actualKgCollected`
3. **`ImpactMetrics` (Tính toán tổng hợp từ SQLite `listings`, `metric_flushes`, `server_meta`):**
   - `totalListings`, `activeListings`, `collectedListings`, `totalKgDiverted`, `estimatedCo2SavedKg`, `totalPriceCalculations`

---

## 6. Tiêu chí Nghiệm thu MVP (Acceptance Criteria Checklist)

- [x] Giao diện Mobile-first `360px` không tràn ngang, cỡ chữ nội dung `>= 16px`, nút chạm `>= 48×48px`, 100% tiếng Việt và thoát XSS bằng `.textContent`.
- [x] Micro tiếng Việt (`vi-VN`) + ô chỉnh sửa `<textarea>` + nút `"Phân tích câu nói"` + lưới 6 nhóm phụ phẩm hoạt động đầy đủ khi từ chối mic hoặc ồn gió.
- [x] Bản đồ `leaflet@1.9.4` hỗ trợ chuyển lớp đường/vệ tinh, 6 ghim biểu tượng riêng, GPS có khóa chống ghi đè `pinTouchedByUser`, kéo ghim, chọn xã fallback, lọc bán kính và sắp xếp Haversine.
- [x] Nút `Gọi điện ngay` (`tel:`), `Mở Zalo`, `Chỉ đường`, xác nhận `"Đã thu gom xong"` bằng `shortCode` 4 ký tự và cộng dồn `totalKgDiverted` + `estimatedCo2SavedKg`.
- [x] Công thức định giá `BigInt` đạt chính xác các biên `0` ngày, `3` ngày quạt mát, `40%`, `75%`, quá hạn (`0 đ` ở mức Đỏ) và chuyển 1 chạm sang form Đăng tin.
- [x] Chạy ngoại tuyến với Service Worker `{ type: 'module' }` + `localStorage` hàng đợi lượt tính giá và tự đồng bộ khi có mạng lại; kiểm chứng qua `54` kiểm thử tự động và `scripts/verify-docs-and-bundle.mjs`.

---

## 7. Ma trận Kiểm chứng Yêu cầu (`R1`–`R14`)

| Mã yêu cầu | Nội dung chính | Mô-đun triển khai | Kiểm chứng tự động |
| :--- | :--- | :--- | :--- |
| **R1** | Máy chủ 0 đồng, CI Node 26, PWA `< 1,5 MB`, HTTP LAN `getRandomValues` | `src/server/index.js`, `public/sw.js`, `.github/workflows/ci.yml`, `scripts/verify-docs-and-bundle.mjs` | `tests/pwa-ui*.test.js`, `verify-docs-and-bundle.mjs` |
| **R2** | Truy cập mở, hồ sơ & `<= 50` biên nhận `localStorage`, đăng hộ | `public/js/state.js`, `public/js/post-form.js` | `tests/pwa-ui.test.js`, `tests/server-api.test.js` |
| **R3** | Mặc định ĐBSCL (`công Nam Bộ`), 3 vùng địa lý | `src/shared/regions.js`, `public/js/app.js` | `tests/shared-domain.test.js` |
| **R4** | Bản đồ Leaflet, 6 ghim `L.divIcon`, GPS `pinTouchedByUser`, chọn xã | `public/js/map-view.js`, `public/js/post-form.js` | `tests/pwa-ui-extra.test.js` |
| **R5** | Quy đổi 8 đơn vị (tỷ lệ diện tích), Haversine, lọc Map/List | `src/shared/units.js`, `src/shared/geo.js`, `src/server/app.js` | `tests/shared-domain*.test.js`, `tests/server-api-extra.test.js` |
| **R6** | `tel:`/Zalo/chỉ đường, TTL `1–14` ngày, `shortCode`-only, báo cáo ẩn ở `3` | `src/server/db.js`, `src/server/auth.js`, `src/shared/validation.js` | `tests/server-api*.test.js`, `tests/pwa-ui-extra.test.js` |
| **R7** | Voice `vi-VN`, `<textarea>` + `"Phân tích câu nói"`, lưới 6 ô | `src/shared/voice-parser.js`, `public/js/post-form.js` | `tests/shared-domain*.test.js`, `tests/pwa-ui-extra.test.js` |
| **R8** | 9 nông sản + tự nhập, `BigInt` (`10_000_000n`), dự báo 3 ngày, TTS | `src/shared/crops.js`, `src/shared/pricing.js`, `public/js/calculator-view.js` | `tests/shared-domain*.test.js`, `tests/pwa-ui-extra.test.js` |
| **R9** | Cảnh báo Xanh/Vàng/Đỏ và cầu nối 1 chạm sang Đăng tin | `src/shared/pricing.js`, `public/js/calculator-view.js`, `public/js/post-form.js` | `tests/shared-domain.test.js` |
| **R10** | `node:sqlite` `BEGIN IMMEDIATE`, `<= 5` tin/SĐT, idempotency, rate limit | `src/server/db.js`, `src/server/rate-limit.js`, `src/server/app.js` | `tests/server-api*.test.js` |
| **R11** | Thống kê cộng đồng, `1,46 kg CO₂/kg`, hàng đợi tính giá `<= 500`/lô | `src/server/db.js`, `public/js/state.js`, `public/js/impact-view.js` | `tests/server-api*.test.js`, `tests/pwa-ui.test.js` |
| **R12** | `ADMIN_PIN` fail-closed `503`, phiên `64`/`4h`, chặn path độc, CSV an toàn | `src/server/auth.js`, `src/server/router.js`, `src/server/csv.js`, `public/js/admin-view.js` | `tests/server-api*.test.js`, `tests/pwa-ui-extra.test.js` |
| **R13** | Giao diện tiếng Việt chữ to, `.textContent`, `AbortController`, chống nhấn đúp | `public/styles/app.css`, `public/js/*.js` | `tests/pwa-ui-extra.test.js` |
| **R14** | `src/shared/*` thuần JS, `no-comments`, tài liệu & hướng dẫn THCS | `docs/02-requirements.md`, `docs/03-thcs-technical-guide.md`, `scripts/verify-docs-and-bundle.mjs` | `tests/shared-domain.test.js`, `verify-docs-and-bundle.mjs` |
