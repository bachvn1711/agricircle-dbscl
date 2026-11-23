# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG AGRICIRCLE (USER GUIDELINE)
*Nền tảng kết nối phụ phẩm nông nghiệp & Hỗ trợ định giá nông sản theo độ tươi*
*Dự án Nghiên cứu Khoa học Kỹ thuật dành cho Học sinh THCS*

---

## MỤC LỤC
1. [Khởi Chạy Ứng Dụng & Cài Đặt (PWA & One-Click)](#1-khoi-chay-ung-dung--cai-dat)
2. [Hướng Dẫn Dành Cho Nông Dân / Nhà Vườn (Đăng Tin & Dọn Ruộng)](#2-huong-dan-cho-nong-dan--nha-vuon)
3. [Hướng Dẫn Dành Cho Trại Nấm & Hộ Chăn Nuôi (Tìm Gom Phụ Phẩm)](#3-huong-dan-cho-trai-nam--ho-chan-nuoi)
4. [Hướng Dẫn Dành Cho Tiểu Thương (Máy Tính Định Giá Độ Tươi)](#4-huong-dan-cho-tieu-thuong--dinh-gia)
5. [Hướng Dẫn Dành Cho Cán Bộ Quản Trị Địa Phương (Báo Cáo & Quản Lý)](#5-huong-dan-cho-can-bo-quan-tri)
6. [Kịch Bản 3 Phút Trải Nghiệm Nhanh Cho Ban Giám Khảo KHKT](#6-kich-ban-3-phut-cho-ban-giam-khao)
7. [Hướng Dẫn Triển Khai Trực Tuyến Miễn Phí (Free Cloud Deploy)](#7-huong-dan-trien-khai-truc-tuyen-mien-phi)

---

## 1. KHỞI CHẠY ỨNG DỤNG & CÀI ĐẶT

### 1.1. Khởi chạy 1 chạm trên máy tính (Không cần gõ lệnh)
- **Trên Windows:** Nhấp đúp chuột vào tệp [`start.bat`](file:///d:/Work/CODE/khkt/start.bat).
  - Hệ thống sẽ tự động kiểm tra thư viện và bật trình duyệt truy cập `http://localhost:3000`.
  - Màn hình đen cũng sẽ in ra địa chỉ mạng nội bộ (VD: `http://192.168.1.15:3000`) để các máy khác và điện thoại cùng mạng Wi-Fi truy cập được ngay.
- **Trên Linux/macOS:** Mở Terminal và gõ:
  ```bash
  chmod +x start.sh && ./start.sh
  ```

### 1.2. Cài đặt lên điện thoại di động (PWA - Không cần tải từ CH Play/App Store)
Ứng dụng sử dụng công nghệ Web tiến bộ (Progressive Web App - PWA), cho phép biến trang web thành ứng dụng độc lập trên điện thoại:
- **Trên điện thoại Android (Chrome):**
  1. Mở trình duyệt Chrome và truy cập vào địa chỉ ứng dụng.
  2. Bấm vào dấu **3 chấm (⋮)** ở góc trên bên phải màn hình.
  3. Chọn **"Thêm vào màn hình chính"** (Add to Home screen) hoặc bấm nút **"Cài đặt ứng dụng"** hiện lên ở đáy màn hình.
  4. Biểu tượng lá mạ **AgriCircle** sẽ xuất hiện trên màn hình điện thoại như một ứng dụng bình thường.
- **Trên điện thoại iPhone (Safari):**
  1. Mở Safari và vào trang web.
  2. Bấm nút **Chia sẻ** (biểu tượng ô vuông có mũi tên chỉ lên ở đáy màn hình).
  3. Cuộn xuống chọn **"Thêm vào MH chính"** (Add to Home Screen).

> [!TIP]
> **Khả năng dùng khi mất mạng ngoài đồng (Offline):** Sau khi đã mở ứng dụng 1 lần, khi mang điện thoại ra giữa ruộng lúa không có sóng 4G/Wi-Fi, bà con vẫn mở app lên và dùng máy tính tính giá bình thường nhờ bộ nhớ đệm tự động.

---

## 2. HƯỚNG DẪN CHO NÔNG DÂN / NHÀ VƯỜN (ĐĂNG TIN DỌN RUỘNG)

Dành cho bà con có rơm rạ sau vụ gặt, thân bắp tỉa cành, vỏ trấu, rau củ quả dập nhẹ muốn cho miễn phí hoặc bán rẻ để dọn sạch đất.

```
+-------------------------------------------------------------------------------+
| BƯỚC 1: Bấm tab 📢 ĐĂNG TIN ở đáy màn hình                                    |
| BƯỚC 2: Bấm nút MICRO 🎙️ to màu xanh và nói 1 câu tiếng Việt tự nhiên        |
| BƯỚC 3: Bấm chọn nhanh KHỐI LƯỢNG (1 chạm) + LOẠI ĐƯỜNG + ĐỘ ẨM RƠM           |
| BƯỚC 4: Nhìn THẺ XEM TRƯỚC (Preview) kiểm tra lại rõ ràng                     |
| BƯỚC 5: Bấm nút to 54px: "Đồng ý Đăng lên Bản đồ ngay 🚀"                     |
| BƯỚC 6: Đọc MÃ 4 CHỮ SỐ cho người đến bốc hàng -> Tự động đóng tin & khóa sđt |
+-------------------------------------------------------------------------------+
```

### Chi tiết thao tác:
1. **Nói bằng giọng nói (Không cần gõ phím):**
   - Bấm vào nút tròn to có hình micro 🎙️. Nút sẽ chuyển sang màu đỏ nhấp nháy.
   - Nói mộc mạc: *"Tôi có hai công rơm khô xã Cẩm Đường cho miễn phí dọn ruộng"*.
   - Máy sẽ tự động phân tích và điền vào các ô tương ứng.
2. **Chọn nhanh khối lượng 1 chạm (Quick Chips):**
   - Bấm trực tiếp vào 1 trong 4 nút to nổi 3D:
     - `[🌾 1 Công (~556 kg)]`
     - `[🌾 2 Công (~1.111 kg)]` — Lựa chọn phổ biến nhất
     - `[🌾 5 Công (~2.778 kg)]`
     - `[📦 1 Tấn (1.000 kg)]`
3. **Chọn phương tiện vào ruộng & Độ ẩm rơm:**
   - **Đường xe vào:** Bấm chọn 🚛 `Xe tải` (nếu đường lớn) / 🛺 `Ba gác` (đường đan xóm) / 🛶 `Ghe thuyền` (mương rạch).
   - **Độ ẩm phụ phẩm:** Bấm chọn ☀️ `Khô ráo` (vừa cắt) / ⛅ `Hơi ẩm` / 🌧️ `Ướt dầm mưa` (chỉ ủ phân).
4. **Xem lại thẻ xác nhận (Preview Card):**
   - Hệ thống hiển thị tóm tắt: *"Bác chuẩn bị đăng: 2 Công Rơm rạ tại Xã Cẩm Đường — Cho miễn phí — Xe ba gác vào được"*.
   - Đúng ý thì bấm nút to màu xanh lá: **"Đồng ý Đăng lên Bản đồ ngay 🚀"**.
5. **Cơ chế chống quấy rầy sau khi dọn ruộng xong:**
   - Màn hình sẽ hiện một **Mã nhận tin 4 ký tự** (VD: `7K9M`).
   - Khi có người lái xe đến gom rơm xong, bác nông dân chỉ cần đọc mã này cho người gom nhập vào máy.
   - Tin đăng lập tức rời khỏi bản đồ và **tự động khóa tính năng gọi điện thoại/Zalo**. Bác yên tâm không bị ai gọi làm phiền nữa!

---

## 3. HƯỚNG DẪN CHO TRẠI NẤM & HỘ CHĂN NUÔI (TÌM GOM PHỤ PHẨM)

Dành cho các cơ sở ủ nấm rơm, trang trại bò dê, cơ sở phân bón vi sinh cần tìm nguồn phụ phẩm quanh vùng.

### Chi tiết thao tác:
1. **Xem vị trí nguồn phụ phẩm:** Mở tab 🗺️ **Bản đồ**. Bản đồ sẽ hiển thị các chấm tròn màu xanh lá hoặc màu cam quanh vị trí của bạn.
2. **Lọc theo nhu cầu:**
   - Chọn loại phụ phẩm: `Rơm rạ`, `Thân / Lõi bắp`, `Vỏ trấu / Vỏ bưởi / Mùn cưa`, `Bã mía / Bã sắn`, `Rau củ quả dập / Quá lứa`...
   - Chọn bán kính: `3 km`, `5 km`, `10 km` hoặc `20 km`.
   - Chọn `Cho miễn phí 0đ` nếu muốn xin rơm dọn ruộng hộ bà con.
3. **Nhận diện nhanh loại đường và chất lượng rơm qua huy hiệu:**
   - Trên mỗi thẻ tin hiển thị rõ:
     - 🚛 `Xe tải vào được`: Có thể đánh xe tải lớn đến bốc hàng.
     - 🛺 `Chỉ xe ba gác`: Phải chuẩn bị xe ba gác hoặc xe rùa trung chuyển.
     - 🛶 `Đường sông / Ghe thuyền`: Cần vỏ lãi hoặc ghe xuồng.
     - ☀️ `Rơm khô`: Phù hợp làm nấm rơm ngay.
     - 🌧️ `Rơm ướt`: Dành cho ủ phân compost hữu cơ.
4. **Liên hệ nhà vườn:** Bấm nút to **"Gọi điện thoại"** hoặc **"Mở Zalo"** để trao đổi trực tiếp, hẹn giờ bốc hàng.
5. **Xác nhận hoàn tất:** Khi đã bốc xong hàng ngoài ruộng, hỏi chủ ruộng **Mã xác nhận 4 số**, nhập vào ô xác nhận trên màn hình và bấm hoàn tất. Hành động này cũng sẽ cộng dồn số kg rơm được giải cứu vào bảng thành tích môi trường chung của xã!

---

## 4. HƯỚNG DẪN CHO TIỂU THƯƠNG & NGƯỜI MUA (ĐỊNH GIÁ ĐỘ TƯƠI)

Dành cho nhà vườn muốn biết mức giá thanh lý hợp lý để không bị thương lái ép giá, hoặc tiểu thương muốn mua gom nông sản ngày 2, ngày 3 về làm mứt, ép nước, nấu canh.

### Chi tiết thao tác:
1. Mở tab 🧮 **Tính giá** (Hoạt động offline 100% không cần mạng).
2. **Chọn loại nông sản:** Bấm chọn 1 trong 10 ô nông sản khảo sát có sẵn (Cà chua 🍅, Rau muống 🥬, Xoài cát 🥭, Bưởi da xanh 🍈, Sầu riêng 榴, Mít Thái 🍈, Cải xanh 🥬, Dưa leo 🥒, Khoai lang 🍠, Cam sành 🍊) hoặc bấm `🌱 Nông sản khác` để tự nhập (như Thanh long, Dưa hấu...).
3. **Chọn số ngày sau thu hoạch:** Bấm các nút chọn nhanh `[0 ngày]`, `[1 ngày]`, `[2 ngày]`, `[3 ngày]`, `[5 ngày]`.
4. **Chọn điều kiện bảo quản:**
   - ❄️ *Kho mát / Thùng xốp đá* (Hao hụt rất chậm).
   - 🍃 *Bóng râm / Quạt mát* (Hao hụt bình thường).
   - ☀️ *Ngoài trời nắng nóng* (Hao hụt nhanh gấp đôi).
5. **Đọc kết quả khoa học:**
   - **Giá khuyến nghị:** Số tiền in to đã làm tròn chẵn trăm đồng (VD: `14.500 đ/kg`).
   - **Khung màu trạng thái:**
     - 🟢 *Màu xanh lá (Độ tươi > 75%):* Nông sản loại 1, tươi ngon, giữ nguyên giá bán.
     - 🟠 *Màu cam (Độ tươi 40% - 75%):* Nông sản loại 2, nên giảm giá 20-30% để bán thanh lý nhanh trong ngày mai.
     - 🔴 *Màu xám/đỏ (Độ tươi < 40%):* Quá ngày thương phẩm, nên chuyển làm thức ăn gia súc hoặc ủ phân vi sinh.
   - **Biểu đồ dự báo 3 ngày tới:** Cho biết giá sẽ tiếp tục giảm bao nhiêu nếu để thêm 1 ngày, 2 ngày nữa để nhà vườn quyết định bán sớm.

---

## 5. HƯỚNG DẪN CHO CÁN BỘ QUẢN TRỊ ĐỊA PHƯƠNG (BÁO CÁO & QUẢN LÝ)

Dành cho cán bộ nông nghiệp xã Cẩm Đường, Ban Giám hiệu hoặc Giáo viên hướng dẫn theo dõi số liệu dự án.

### Chi tiết thao tác:
1. Mở tab ⚙️ **Quản trị**.
2. Nhập mã PIN quản trị viên (Mặc định khi thử nghiệm: `202600`).
3. **Các chức năng quản trị:**
   - **Duyệt và điều chỉnh tin đăng:** Xem danh sách toàn bộ các tin đã đăng, đang hoạt động hoặc đã thu gom.
   - **Cập nhật giá tham khảo thị trường:** Khi mùa vụ thay đổi, cán bộ có thể cập nhật giá gốc của 10 loại nông sản để máy tính tự tính toán chuẩn xác theo giá thời điểm đó.
   - **Xuất báo cáo Excel/CSV:** Bấm nút **"Xuất báo cáo CSV"**, hệ thống sẽ tự tải về tệp bảng tính thống kê tổng số bài đăng, số kg phụ phẩm đã giải cứu, và ước tính lượng khí thải $CO_2$ không bị phát tán ra môi trường để nộp báo cáo cho xã.

---

## 6. KỊCH BẢN 3 PHÚT CHO BAN GIÁM KHẢO KHKT

Khi đứng trước gian hàng triển lãm KHKT, em học sinh có thể hướng dẫn Ban Giám khảo trải nghiệm theo 3 bước sau:

| Thời gian | Hành động của Giám khảo & Thao tác của Học sinh | Ý nghĩa chứng minh |
| :---: | :--- | :--- |
| **Phút 1** | **Bật chế độ máy bay (Mất mạng hoàn toàn):**<br>Học sinh mời Giám khảo mở tab **Tính giá**, chọn *Cà chua* sau khi hái 2 ngày để ngoài nắng. Hệ thống lập tức gợi ý mức giá giảm còn `13.000 đ/kg` kèm biểu đồ dự báo 3 ngày tiếp theo. | Chứng minh tính năng **Offline-First**, hoạt động được ngoài đồng ruộng mất sóng. |
| **Phút 2** | **Thử đăng tin bằng giọng nói & Nút 1 chạm:**<br>Bấm micro và nói: *"Cho hai công rơm khô xã Cẩm Đường"*. Máy tự động điền biểu mẫu. Bấm chọn nhanh `[🌾 2 Công]`, chọn `🚛 Xe tải`, xem thẻ xác nhận và bấm đăng. | Chứng minh tính năng **thân thiện với người già**, tay dính bùn đất không cần gõ phím. |
| **Phút 3** | **Thu gom & Khóa số điện thoại tự động:**<br>Học sinh đóng vai người mua đến nhập mã 4 số xác nhận thu gom. Thẻ tin lập tức chuyển trạng thái `Đã thu gom` và khóa nút gọi điện. | Chứng minh tính năng **bảo vệ quyền riêng tư**, không làm phiền nông dân sau mùa gặt. |

---

## 7. HƯỚNG DẪN TRIỂN KHAI TRỰC TUYẾN MIỄN PHÍ (FREE CLOUD DEPLOY)

Hệ thống được đóng gói sẵn để đưa lên Internet hoàn toàn 0 đồng cho hội đồng chấm thi từ xa truy cập:

### Cách 1: Triển khai 1-click lên Render.com (Miễn phí 100%)
1. Tải toàn bộ mã nguồn dự án lên một kho GitHub cá nhân.
2. Đăng ký tài khoản miễn phí tại [Render.com](https://render.com).
3. Bấm **New +** $\rightarrow$ Chọn **Blueprint**.
4. Kết nối tới kho GitHub của bạn. Render sẽ tự động đọc tệp [`render.yaml`](file:///d:/Work/CODE/khkt/render.yaml) đã chuẩn bị sẵn và khởi tạo máy chủ chạy trên Node.js v22.
5. Sau 2 phút, bạn sẽ có một đường link công khai dạng `https://agricircle-dbscl.onrender.com` để in mã QR lên Poster dự thi!

### Cách 2: Triển khai bằng Docker Container
Dự án đã có sẵn tệp [`Dockerfile`](file:///d:/Work/CODE/khkt/Dockerfile) chuẩn siêu nhẹ (Node 22 Alpine). Bạn có thể chạy trên bất kỳ máy chủ nào:
```bash
docker build -t agricircle .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name agricircle-app agricircle
```

