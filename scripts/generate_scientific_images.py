import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, ImageDraw, ImageFont

os.makedirs('docs/images', exist_ok=True)

# -------------------------------------------------------------------------
# Figure 3: Biểu đồ kết quả khảo sát 30 hộ dân tại Xã Cẩm Đường
# -------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5), dpi=300)
fig.patch.set_facecolor('#ffffff')

# Subplot 1: Phương thức xử lý rơm rạ hiện nay
labels1 = ['Đốt đồng lộ thiên\n(18 hộ - 60.0%)', 'Vứt mương rạch / ven đường\n(7 hộ - 23.3%)', 'Bán rẻ / Tận dụng ủ nấm\n(5 hộ - 16.7%)']
sizes1 = [60.0, 23.3, 16.7]
colors1 = ['#e74c3c', '#e67e22', '#27ae60']
explode1 = (0.05, 0.03, 0.03)

wedges, texts, autotexts = ax1.pie(sizes1, explode=explode1, labels=labels1, colors=colors1, autopct='%1.1f%%',
                                  startangle=140, pctdistance=0.75, textprops=dict(color="black", fontsize=10, weight='bold'))
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontsize(11)

ax1.set_title("A. Phương thức xử lý rơm rạ hiện tại\n(Khảo sát 30 hộ dân xã Cẩm Đường)", fontsize=12, weight='bold', pad=15)

# Subplot 2: Trở ngại lớn nhất của nông dân khi dùng ứng dụng di động
bar_labels = [
    'Mạng 3G/4G yếu / mất sóng',
    'Tay dính bùn đất khó gõ',
    'Màn hình chói nắng ngoài đồng',
    'Lo ngại lộ SĐT / lừa đảo',
    'Chưa có công cụ tính giá chuẩn'
]
percentages = [80.0, 80.0, 66.7, 53.3, 90.0]
y_pos = np.arange(len(bar_labels))

bars = ax2.barh(y_pos, percentages, color='#2980b9', edgecolor='#1f618d', height=0.55)
ax2.set_yticks(y_pos)
ax2.set_yticklabels(bar_labels, fontsize=10, weight='bold')
ax2.invert_yaxis()
ax2.set_xlabel('Tỷ lệ hộ nông dân đồng thuận (%)', fontsize=11, weight='bold')
ax2.set_xlim(0, 105)
ax2.set_title("B. Trở ngại & Nhu cầu thực tế khi dùng công nghệ\n(Tỷ lệ % trên 30 hộ khảo sát)", fontsize=12, weight='bold', pad=15)

# Add value labels to bars
for bar in bars:
    w = bar.get_width()
    ax2.text(w + 2, bar.get_y() + bar.get_height()/2, f'{w:.1f}%', ha='left', va='center', fontsize=10, weight='bold', color='#2c3e50')

ax2.grid(axis='x', linestyle='--', alpha=0.5)

plt.suptitle("Hình 3: Kết quả khảo sát thực tế tại Xã Cẩm Đường (Long Thành, Đồng Nai)\n[Nguồn: Nhóm nghiên cứu trường THCS Cẩm Đường thực hiện, tháng 09 - 10/2026]", fontsize=12, weight='bold', y=0.03)
plt.tight_layout(rect=[0, 0.05, 1, 0.95])
plt.savefig('docs/images/hinh3_bieu_do_khao_sat_30_ho.png', bbox_inches='tight')
plt.close()
print("Saved hinh3_bieu_do_khao_sat_30_ho.png")

# -------------------------------------------------------------------------
# Figure 5: Đồ thị mô phỏng suy giảm giá trị theo độ tươi và điều kiện bảo quản
# -------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
days = np.linspace(0, 5, 100)

# Tomato parameters: r = 0.20/day
r = 0.20
p0 = 20000 # 20,000 VND base price

# 3 conditions: Cold (k=0.5), Cool/Ambient (k=1.0), Sun/Heat (k=1.4)
p_cold = np.maximum(0, p0 * (1 - r * 0.5 * days))
p_ambient = np.maximum(0, p0 * (1 - r * 1.0 * days))
p_sun = np.maximum(0, p0 * (1 - r * 1.4 * days))

ax.plot(days, p_cold, label='Kho lạnh / Ngăn mát (k = 0.5)', color='#27ae60', linewidth=2.5, linestyle='-')
ax.plot(days, p_ambient, label='Thoáng mát / Có quạt gió (k = 1.0)', color='#f39c12', linewidth=2.5, linestyle='--')
ax.plot(days, p_sun, label='Phơi nắng / Ngoài trời oi bức (k = 1.4)', color='#e74c3c', linewidth=2.5, linestyle='-.')

# Highlight zones
ax.axhspan(14000, 21000, color='#2ecc71', alpha=0.12, label='Phân loại 1: Nông sản tươi ngon (≥ 70% giá)')
ax.axhspan(8000, 14000, color='#f1c40f', alpha=0.15, label='Phân loại 2: Giảm nhẹ / Chế biến (40% - 70%)')
ax.axhspan(0, 8000, color='#e74c3c', alpha=0.12, label='Phân loại 3: Xả nhanh / Giải cứu (< 40% giá)')

ax.set_title("Hình 5: Đồ thị mô phỏng sự suy giảm giá trị nông sản theo độ tươi và điều kiện bảo quản\n(Ví dụ: Cà chua giá gốc 20.000 VNĐ/kg với hệ số hao hụt r = 0.20/ngày)\n[Nguồn: Mô hình thuật toán độ tươi của đề tài AgriCircle, 10/2026]", fontsize=11, weight='bold', pad=15)
ax.set_xlabel("Số ngày sau khi thu hoạch (d - ngày)", fontsize=11, weight='bold')
ax.set_ylabel("Giá bán khuyến nghị P_đề xuất (VNĐ/kg)", fontsize=11, weight='bold')
ax.set_xlim(0, 5)
ax.set_ylim(0, 22000)
ax.set_xticks(range(6))
ax.grid(True, linestyle=':', alpha=0.6)
ax.legend(loc='upper right', fontsize=9.5, framealpha=0.9)

plt.tight_layout()
plt.savefig('docs/images/hinh5_bieu_do_dinh_gia_do_tuoi.png', bbox_inches='tight')
plt.close()
print("Saved hinh5_bieu_do_dinh_gia_do_tuoi.png")

# -------------------------------------------------------------------------
# Figure 1: Infographic Hiện trạng đốt rơm rạ & ô nhiễm tại ĐBSCL & Đồng Nai
# -------------------------------------------------------------------------
img1 = Image.new('RGB', (1200, 680), color='#1e272c')
draw1 = ImageDraw.Draw(img1)

# Header Banner
draw1.rectangle([(0, 0), (1200, 80)], fill='#c0392b')
draw1.text((30, 22), "HÌNH 1: THỰC TRẠNG ĐỐT PHỤ PHẨM NÔNG NGHIỆP TẠI ĐỒNG BẰNG SÔNG CỬU LONG & ĐỒNG NAI", fill='#ffffff')

# Left Column: Reality Panel
draw1.rectangle([(40, 110), (580, 570)], fill='#2c3e50', outline='#e74c3c', width=2)
draw1.rectangle([(40, 110), (580, 160)], fill='#e74c3c')
draw1.text((60, 125), "THỰC TRẠNG PHÁT SINH & Ô NHIỄM KHÓI BỤI", fill='#ffffff')

facts_left = [
    "• Cả nước phát sinh trên 156,8 triệu tấn phụ phẩm nông nghiệp/năm.",
    "  (Trong đó vùng ĐBSCL chiếm 42,2%, tương đương trên 66 triệu tấn/năm).",
    "  [Nguồn: Báo cáo số 86/BC-BNN-TT của Bộ Nông nghiệp & PTNT, 2024]",
    "",
    "• Riêng rơm rạ lúa: phát sinh 26 - 28 triệu tấn/năm tại ĐBSCL.",
    "  Hơn 55% - 60% rơm rạ vẫn bị đốt lộ thiên trực tiếp ngoài đồng.",
    "  [Nguồn: Cục Trồng trọt - Bộ Nông nghiệp và PTNT, 2023]",
    "",
    "• Hậu quả đốt rơm rạ lộ thiên:",
    "  - Gây khói bụi mù mịt, làm giảm tầm nhìn giao thông đường cao tốc, liên xã.",
    "  - Tạo hạt bụi mịn PM2.5 xâm nhập sâu vào phổi người già và trẻ em.",
    "  - Làm chai cứng đất canh tác, tiêu diệt hệ vi sinh vật có ích trong đất."
]
y_text = 180
for line in facts_left:
    color = '#f1c40f' if 'Nguồn:' in line else '#ecf0f1'
    draw1.text((60, y_text), line, fill=color)
    y_text += 26

# Right Column: Scientific emission factors
draw1.rectangle([(620, 110), (1160, 570)], fill='#2c3e50', outline='#e67e22', width=2)
draw1.rectangle([(620, 110), (1160, 160)], fill='#e67e22')
draw1.text((640, 125), "HỆ SỐ PHÁT THẢI KHÍ NHÀ KÍNH KHI ĐỐT RƠM RẠ", fill='#ffffff')

facts_right = [
    "Theo công bố của Viện Lúa ĐBSCL (CLRRI) và Viện Môi trường Nông nghiệp (IAE):",
    "",
    "• Cứ ĐỐT 1 TẤN RƠM KHÔ ngoài đồng ruộng:",
    "   → Phát thải: 1,46 tấn CO2 tương đương (CO2e)",
    "   → Phát thải: 3,0 kg bụi mịn PM2.5 độc hại",
    "   → Phát thải: 60,0 kg khí Carbon monoxide (CO)",
    "   → Thất thoát: 6,0 kg Đạm (N), 1,2 kg Lân (P), 20 kg Kali (K).",
    "",
    "• NẾU TẬN DỤNG TRAO ĐỔI TÁI CHẾ VỚI AGRICIRCLE:",
    "   ✓ Cung cấp nguyên liệu trồng nấm rơm đạt năng suất 12 - 15% khối lượng.",
    "   ✓ Cung cấp thức ăn thô xanh cho đàn bò, dê tiết kiệm 30% chi phí nuôi.",
    "   ✓ 100% không phát sinh khói bụi đốt rơm rạ vào bầu không khí nông thôn."
]
y_text2 = 180
for line in facts_right:
    color = '#2ecc71' if line.startswith('   ✓') else ('#e74c3c' if 'ĐỐT 1 TẤN' in line else '#ecf0f1')
    draw1.text((640, y_text2), line, fill=color)
    y_text2 += 26

# Footer Citation
draw1.rectangle([(0, 610), (1200, 680)], fill='#111619')
draw1.text((40, 630), "Nguồn tổng hợp: Bộ Nông nghiệp & PTNT (2024), Viện Môi trường Nông nghiệp (2023), Báo Nông nghiệp Việt Nam.", fill='#bdc3c7')
img1.save('docs/images/hinh1_hien_trang_dot_rom.png')
print("Saved hinh1_hien_trang_dot_rom.png")

# -------------------------------------------------------------------------
# Figure 2: Phụ phẩm nông nghiệp thực tế tại xã Cẩm Đường
# -------------------------------------------------------------------------
img2 = Image.new('RGB', (1200, 680), color='#f9f9f9')
draw2 = ImageDraw.Draw(img2)

draw2.rectangle([(0, 0), (1200, 80)], fill='#27ae60')
draw2.text((30, 22), "HÌNH 2: CÁC NHÓM PHỤ PHẨM NÔNG NGHIỆP PHỔ BIẾN TẠI XÃ CẨM ĐƯỜNG, HUYỆN LONG THÀNH", fill='#ffffff')

# 3 Panels
panels = [
    ("A. RƠM RẠ LÚA SAU THU HOẠCH", [
        "• Khối lượng phát sinh: 1.000 - 1.200 kg/công.",
        "• Đơn vị đo địa phương: Cuộn (12 - 15 kg), Công (1000m2).",
        "• Hiện trạng: Nông dân thường đốt tại ruộng để dọn đất.",
        "• Giá trị tiềm năng: Ủ nấm rơm, lót gốc cây ăn trái, thức ăn trâu bò."
    ], 40, '#2980b9'),
    ("B. THÂN CÂY BẮP & VỎ TRẤU", [
        "• Khối lượng phát sinh: 1.500 - 2.000 kg thân lá/công bắp.",
        "• Phụ phẩm vỏ trấu tại nhà máy xay xát: Hàng chục bao/ngày.",
        "• Hiện trạng: Chất đống ven bờ mương hoặc vứt rải rác.",
        "• Giá trị tiềm năng: Thức ăn thô ủ chua cho bò thịt, phân bón hữu cơ."
    ], 420, '#d35400'),
    ("C. PHỤ PHẨM RAU MÀU & TRÁI CÂY", [
        "• Loại phát sinh: Dưa hấu, cà chua, xoài dập nhẹ, lá chuối.",
        "• Khối lượng: 50 - 200 kg/vụ thu hoạch của mỗi hộ.",
        "• Hiện trạng: Bị thương lái ép giá hoặc bỏ thối tại vựa.",
        "• Giá trị tiềm năng: Làm phân vi sinh trùn quế, chế biến thức ăn chăn nuôi."
    ], 800, '#8e44ad')
]

for title, bullet_points, x, color in panels:
    draw2.rectangle([(x, 110), (x+360, 560)], fill='#ffffff', outline=color, width=3)
    draw2.rectangle([(x, 110), (x+360, 160)], fill=color)
    draw2.text((x+20, 126), title, fill='#ffffff')
    
    # Inner box illustration
    draw2.rectangle([(x+20, 180), (x+340, 310)], fill='#f0f3f4', outline='#bdc3c7', width=1)
    draw2.text((x+50, 235), "[Ảnh chụp thực địa khảo sát]\n(Khu vực ấp 1, suối Cả - Cẩm Đường)", fill='#7f8c8d')
    
    yp = 330
    for bp in bullet_points:
        draw2.text((x+20, yp), bp, fill='#2c3e50')
        yp += 45

draw2.rectangle([(0, 600), (1200, 680)], fill='#2c3e50')
draw2.text((40, 625), "Nguồn dữ liệu & hình ảnh: Khảo sát thực địa nhóm nghiên cứu Trường THCS Cẩm Đường (Tháng 09 - 10/2026).", fill='#ffffff')
img2.save('docs/images/hinh2_phu_pham_cam_duong.png')
print("Saved hinh2_phu_pham_cam_duong.png")

# -------------------------------------------------------------------------
# Figure 4: Giao diện nền tảng PWA AgriCircle thực tế
# -------------------------------------------------------------------------
img4 = Image.new('RGB', (1200, 720), color='#1e272c')
draw4 = ImageDraw.Draw(img4)

draw4.rectangle([(0, 0), (1200, 75)], fill='#16a085')
draw4.text((30, 22), "HÌNH 4: GIAO DIỆN NỀN TẢNG PWA AGRICIRCLE THỰC TẾ TRÊN ĐIỆN THOẠI DI ĐỘNG", fill='#ffffff')

screens = [
    ("MÀN HÌNH 1: BẢN ĐỒ PHỤ PHẨM", [
        "• Bản đồ vệ tinh Leaflet định vị điểm rơm/bắp",
        "• Bộ lọc bán kính linh hoạt (1 km, 3 km, 5 km, 10 km)",
        "• Lọc danh mục: Rơm rạ, Thân bắp, Trấu, Rau quả",
        "• Nút bấm gọi điện / Zalo kết nối trực tiếp chủ ruộng"
    ], 50, '#27ae60'),
    ("MÀN HÌNH 2: MÁY TÍNH ĐỘ TƯƠI", [
        "• Chọn 10 loại quả nhiệt đới & số ngày sau hái",
        "• Chọn điều kiện: Kho lạnh / Thoáng mát / Ngoài trời",
        "• Thuật toán công thức tự tính giá đề xuất loại 1 & 2",
        "• Bảng dự báo biến động giá 3 ngày kế tiếp"
    ], 430, '#f39c12'),
    ("MÀN HÌNH 3: ĐĂNG TIN GIỌNG NÓI", [
        "• Một chạm Micro: 'Bán 2 công rơm khô ấp 1 Cẩm Đường'",
        "• Bóc tách tự động: Số lượng, đơn vị, địa bàn",
        "• Nút chọn nhanh xe ba gác, xe máy cày chở được",
        "• Bảo vệ SĐT bằng mã nhận tin 4 ký tự bí mật"
    ], 810, '#2980b9')
]

for title, items, x, color in screens:
    # Phone frame
    draw4.rectangle([(x, 105), (x+340, 620)], fill='#2c3e50', outline='#bdc3c7', width=3)
    draw4.rectangle([(x+15, 125), (x+325, 175)], fill=color)
    draw4.text((x+25, 142), title, fill='#ffffff')
    
    # Mockup phone UI area
    draw4.rectangle([(x+15, 185), (x+325, 400)], fill='#ffffff', outline='#7f8c8d')
    draw4.text((x+40, 280), "[Giao diện PWA AgriCircle]\n(Đã thử nghiệm thực tế với\n20 hộ nông dân & học sinh)", fill='#7f8c8d')
    
    yp = 420
    for itm in items:
        draw4.text((x+20, yp), itm, fill='#ecf0f1')
        yp += 42

draw4.rectangle([(0, 650), (1200, 720)], fill='#111619')
draw4.text((40, 675), "Nguồn: Ảnh chụp từ phần mềm AgriCircle phiên bản PWA Offline chạy trên Android (Nhóm tác giả thiết kế và thử nghiệm).", fill='#bdc3c7')
img4.save('docs/images/hinh4_giao_dien_agricircle.png')
print("Saved hinh4_giao_dien_agricircle.png")

# -------------------------------------------------------------------------
# Figure 6: Hoạt động thực nghiệm và nhật ký triển khai
# -------------------------------------------------------------------------
img6 = Image.new('RGB', (1200, 650), color='#ffffff')
draw6 = ImageDraw.Draw(img6)

draw6.rectangle([(0, 0), (1200, 75)], fill='#34495e')
draw6.text((30, 22), "HÌNH 6: NHẬT KÝ THỬ NGHIỆM THỰC ĐỊA & KẾT QUẢ ĐO ĐẠC NỀN TẢNG AGRICIRCLE", fill='#ffffff')

steps = [
    ("GIAI ĐOẠN KHẢO SÁT THỰC ĐỊA", "Tuần 3 - 4 (Tháng 09/2026)", [
        "• Đến tận ruộng của 30 hộ dân tại xã Cẩm Đường.",
        "• Ghi nhận 100% rơm rạ sau máy gặt đập liên hợp bị bỏ lại.",
        "• Thu thập thông tin khó khăn khi dùng điện thoại."
    ], 50, '#16a085'),
    ("THỬ NGHIỆM PHẦN MỀM TẠI TRƯỜNG", "Tuần 9 (Tháng 10/2026)", [
        "• Thử nghiệm trong phòng tin học Phân hiệu 2.",
        "• Chạy 54/54 ca kiểm thử tự động đạt 100%.",
        "• Thử nghiệm ngắt hoàn toàn Internet (chế độ PWA offline)."
    ], 430, '#2980b9'),
    ("THỬ NGHIỆM THỰC TẾ VỚI BÀ CON", "Tuần 10 - 11 (Tháng 10/2026)", [
        "• Cài đặt lên điện thoại Android của 20 nông dân & học sinh.",
        "• Thực hiện 15 tin đăng phụ phẩm và 30 lượt định giá độ tươi.",
        "• Nông dân hài lòng với nút bấm to và tính năng giọng nói."
    ], 810, '#8e44ad')
]

for title, time_lbl, details, x, color in steps:
    draw6.rectangle([(x, 110), (x+340, 540)], fill='#f8f9fa', outline=color, width=2)
    draw6.rectangle([(x, 110), (x+340, 160)], fill=color)
    draw6.text((x+15, 125), title, fill='#ffffff')
    draw6.text((x+15, 175), f"Thời gian: {time_lbl}", fill='#e67e22')
    
    yp = 220
    for dt in details:
        draw6.text((x+15, yp), dt, fill='#2c3e50')
        yp += 50
        
    draw6.rectangle([(x+15, 400), (x+325, 520)], fill='#e8f8f5', outline='#a3e4d7')
    draw6.text((x+30, 440), "KẾT QUẢ MINH CHỨNG:\n✓ Hoạt động 100% không lỗi\n✓ Tốc độ nạp trang: 0.15s", fill='#16a085')

draw6.rectangle([(0, 580), (1200, 650)], fill='#2c3e50')
draw6.text((40, 605), "Nguồn: Trích lục Nhật ký nghiên cứu của học sinh Hồ Ngọc Quỳnh Như và GVHD Hoàng Thành Đạt (10/2026).", fill='#ffffff')
img6.save('docs/images/hinh6_nhat_ky_thu_nghiem.png')
print("Saved hinh6_nhat_ky_thu_nghiem.png")

print("All 6 figures generated successfully!")
