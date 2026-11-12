# ARCHITECTURE.md — Kiến Trúc Hệ Thống AgriCircle
*Tài liệu kỹ thuật giải thích cách hệ thống hoạt động dành cho nhóm nghiên cứu THCS*

---

## 1. Công Nghệ Sử Dụng & Lý Do Lựa Chọn (Technology Stack)

Hệ thống AgriCircle được xây dựng với nguyên tắc: **Đơn giản, tiết kiệm tối đa, dễ hiểu và hoạt động tốt ở nông thôn**.

| Thành phần | Công nghệ sử dụng | Vì sao phù hợp với học sinh THCS & nông thôn? |
| :--- | :--- | :--- |
| **Giao diện người dùng (Frontend)** | HTML5, CSS3, JavaScript thuần (Vanilla JS) | Không dùng framework phức tạp (React, Vue) để học sinh dễ hiểu, dễ sửa và mở trực tiếp trên trình duyệt điện thoại mà không cần cài đặt rườm rà. |
| **Bản đồ định vị** | Thư viện Leaflet (v1.9.4) | Bản đồ mã nguồn mở miễn phí, nhẹ nhàng, tự động chuyển sang chế độ dự phòng khi mạng chập chờn, không tốn phí bản quyền Google Maps. |
| **Hoạt động ngoại tuyến** | PWA Service Worker | Giúp lưu sẵn mã nguồn vào bộ nhớ đệm của điện thoại; khi ra giữa ruộng không có mạng 4G vẫn mở được ứng dụng và dùng máy tính tính giá. |
| **Nhập liệu giọng nói** | Web Speech API (vi-VN) | Tận dụng sẵn tính năng nhận diện giọng nói tiếng Việt có sẵn trên trình duyệt Chrome/Android, không tốn tiền mua dịch vụ AI bên ngoài. |
| **Máy chủ xử lý (Backend)** | Node.js (phiên bản v22+) | Chạy trực tiếp trên máy tính cá nhân hoặc máy tính trường học, cú pháp đồng nhất với JavaScript phía giao diện. |
| **Cơ sở dữ liệu** | SQLite (`node:sqlite`) | Lưu toàn bộ dữ liệu vào một tệp tin duy nhất (`agricircle.db`). Không cần cài đặt máy chủ cơ sở dữ liệu cồng kềnh, dễ dàng sao chép để nộp bài dự thi. |

---

## 2. Cấu Trúc Thư Mục Dự Án (Folder Structure)

```
d:\Work\CODE\khkt\
├── docs/                      # Hồ sơ nghiên cứu và tài liệu KHKT
│   ├── 01-goals.md            # Mục tiêu ban đầu
│   ├── 02-requirements.md     # Yêu cầu chức năng và giao diện
│   ├── 03-thcs-technical-guide.md # Sách hướng dẫn kỹ thuật cho học sinh
│   ├── 04-ke-hoach-nghien-cuu-khkt.md # Bản kế hoạch nghiên cứu chính thức
│   ├── 05-mau-khao-sat-nong-dan.md # Phiếu khảo sát 30 hộ nông dân thực tế
│   ├── 06-dan-y-thuyet-trinh-powerpoint.md # Dàn ý 12 slide thuyết trình KHKT
│   ├── 07-bo-cau-hoi-phan-bien-khkt.md # Bộ câu hỏi phản biện Ban Giám khảo
│   └── 08-kich-ban-video-demo.md # Kịch bản video minh họa thực tế
├── public/                    # Mã nguồn giao diện người dùng (chạy trên điện thoại/web)
│   ├── index.html             # Trang giao diện chính (5 màn hình chuyển đổi)
│   ├── manifest.json          # Tệp cấu hình để cài ứng dụng lên màn hình điện thoại
│   ├── sw.js                  # Bộ nhớ đệm giúp mở ứng dụng khi mất mạng (Service Worker)
│   ├── styles/
│   │   └── app.css            # Toàn bộ màu sắc, kích thước nút bấm to, kiểu dáng 3D
│   └── js/
│       ├── app.js             # Bộ điều khiển chính, chuyển đổi các tab màn hình
│       ├── state.js           # Lưu tạm dữ liệu trên máy người dùng (LocalStorage)
│       ├── api.js             # Gửi và nhận dữ liệu với máy chủ
│       ├── map-view.js        # Hiển thị bản đồ Leaflet, lọc tin và huy hiệu đường đi/độ ẩm
│       ├── calculator-view.js # Màn hình máy tính định giá độ tươi nông sản
│       ├── post-form.js       # Màn hình đăng tin giọng nói, 4 nút khối lượng & xem trước
│       ├── impact-view.js     # Màn hình bảng thành tích giảm khí thải môi trường
│       └── admin-view.js      # Màn hình quản lý tin đăng của cán bộ địa phương
├── src/
│   ├── server/                # Mã nguồn máy chủ (chạy trên máy tính)
│   │   ├── index.js           # Khởi động máy chủ
│   │   ├── app.js             # Tiếp nhận yêu cầu đăng tin, lấy danh sách tin, thu gom
│   │   ├── router.js          # Điều hướng đường dẫn an toàn
│   │   ├── db.js              # Tạo bảng và lưu trữ thông tin vào tệp SQLite
│   │   └── auth.js            # Sinh mã nhận tin 4 số bí mật và kiểm tra mã PIN
│   └── shared/                # Các công thức tính toán dùng chung
│       ├── crops.js           # Danh mục 10 loại quả nhiệt đới và đặc tính suy giảm
│       ├── pricing.js         # Công thức tính giá giảm dần theo ngày và cách bảo quản
│       ├── geo.js             # Công thức tính khoảng cách km giữa hai vị trí
│       ├── voice-parser.js    # Tách câu nói thành tên quả, số lượng, địa chỉ
│       └── validation.js      # Kiểm tra dữ liệu hợp lệ (loại xe, độ ẩm, số điện thoại)
├── tests/                     # 56 bài kiểm tra tự động bảo đảm hệ thống không bị lỗi
├── scripts/
│   └── verify-docs-and-bundle.mjs # Kịch bản kiểm tra dung lượng nhẹ < 1.5MB và 0 comment
├── PRD.md                     # Tài liệu mô tả sản phẩm và đối tượng sử dụng
├── ARCHITECTURE.md            # Tài liệu kiến trúc và luồng dữ liệu này
├── DESIGN.md                  # Quy chuẩn màu sắc và giao diện thân thiện với người già
├── RULES.md                   # Các quy tắc kỹ thuật bắt buộc phải tuân theo
├── TASKS.md                   # Danh mục từng bước công việc triển khai
└── PROGRESS.md                # Báo cáo tiến độ và các lỗi thực tế đã khắc phục
```

---

## 3. Các Luồng Dữ Liệu Chính (Data Flows)

### 3.1. Luồng 1: Định giá độ tươi nông sản (Dùng được cả khi mất mạng)
```
[Bà con chọn loại quả, số ngày hái, nơi để]
                  │
                  ▼
         [calculator-view.js]
                  │
                  ▼
          [src/shared/pricing.js]
  (Tính toán theo công thức suy giảm sinh học tự nhiên)
                  │
                  ▼
   [Hiện mức giá khuyến nghị + Lời khuyên nông vụ]
                  │
                  ▼
  (Lưu số lượt tính vào máy để khi có mạng sẽ đồng bộ)
```

### 3.2. Luồng 2: Đăng tin bằng giọng nói & Nút bấm 1 chạm
```
[Bà con bấm nút Micro và nói tiếng Việt]
                  │
                  ▼
       [Web Speech API trên máy]
                  │
                  ▼
       [src/shared/voice-parser.js]
 (Tách: Rơm/Bắp, Số lượng, Xã Cẩm Đường, Cho/Bán)
                  │
                  ▼
[Điền vào biểu mẫu + Chọn nút khối lượng/loại đường/độ ẩm]
                  │
                  ▼
     [Thẻ xem trước trực quan (Preview Card)]
 (Bà con kiểm tra lại to rõ, không sợ bấm nhầm)
                  │
                  ▼
 [Bấm nút "Đồng ý Đăng lên Bản đồ ngay 🚀" (54px)]
                  │
                  ▼
[Máy chủ kiểm tra hợp lệ -> Lưu vào tệp SQLite -> Hiện lên Bản đồ]
```

### 3.3. Luồng 3: Tìm kiếm phụ phẩm & Khóa liên lạc sau khi gom
```
[Hộ làm nấm / nuôi bò mở Bản đồ]
                  │
                  ▼
  [Bản đồ tải các điểm có rơm rạ gần nhất]
  (Thấy rõ: Huy hiệu Xe tải/Ba gác/Ghe và Rơm khô/Ướt)
                  │
                  ▼
[Bấm nút Gọi điện hoặc Nhắn Zalo trực tiếp cho chủ ruộng]
                  │
                  ▼
[Hai bên gặp nhau thu gom phụ phẩm ngoài đồng]
                  │
                  ▼
[Người gom nhập Mã bí mật 4 số do chủ ruộng cung cấp]
                  │
                  ▼
[Hệ thống đóng tin: Ẩn khỏi bản đồ + Khóa nút gọi điện]
  (Không ai gọi làm phiền bác nông dân nữa!)
```
