import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

# Ensure Arial font is loaded and registered
font_path = 'C:/Windows/Fonts/arial.ttf'
if os.path.exists(font_path):
    fm.fontManager.addfont(font_path)
    plt.rcParams['font.family'] = 'Arial'
else:
    plt.rcParams['font.sans-serif'] = ['Arial', 'Segoe UI', 'DejaVu Sans']

os.makedirs('docs/images', exist_ok=True)

# =========================================================================
# FIGURE 1: Thực trạng phát sinh và hệ số phát thải khi đốt rơm rạ
# =========================================================================
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 6), dpi=300)
fig.patch.set_facecolor('#ffffff')

# Subplot 1: Cơ cấu phát sinh phụ phẩm nông nghiệp toàn quốc (156.8 triệu tấn)
regions = [
    'ĐBSCL\n(66,2 triệu tấn)',
    'Trung du & Miền núi\nphía Bắc (29,0 tr tấn)',
    'Bắc Trung Bộ &\nDH Miền Trung (25,6 tr tấn)',
    'Đồng bằng\nsông Hồng (20,5 tr tấn)',
    'Đông Nam Bộ &\nTây Nguyên (15,5 tr tấn)'
]
shares = [42.2, 18.5, 16.3, 13.1, 9.9]
colors_pie = ['#27ae60', '#3498db', '#f39c12', '#9b59b6', '#95a5a6']
explode = (0.06, 0.02, 0.02, 0.02, 0.02)

wedges, texts, autotexts = ax1.pie(
    shares, explode=explode, labels=regions, colors=colors_pie,
    autopct='%1.1f%%', startangle=130, pctdistance=0.75,
    textprops=dict(fontsize=10, weight='bold', color='#2c3e50')
)
for at in autotexts:
    at.set_color('white')
    at.set_fontsize(10.5)

ax1.set_title(
    "A. Cơ cấu phát sinh 156,8 triệu tấn phụ phẩm/năm\n(Vùng ĐBSCL chiếm tỷ trọng lớn nhất 42,2%)",
    fontsize=11.5, weight='bold', pad=12, color='#1e3799'
)

# Subplot 2: Lượng phát thải và thất thoát khi đốt 1 tấn rơm khô
emissions = [
    'Khí CO2 tương đương\n(1.460 kg CO2e)',
    'Khí độc hại CO\n(60 kg)',
    'Thất thoát phân bón\nN, P, K (27,2 kg)',
    'Bụi mịn độc hại\nPM2.5 (3,0 kg)'
]
values = [1460, 60, 27.2, 3.0]
y_pos = np.arange(len(emissions))

# Logarithmic or visual scale representation
bars = ax2.barh(y_pos, [1460, 220, 160, 80], color=['#e74c3c', '#e67e22', '#f1c40f', '#c0392b'], height=0.55)
ax2.set_yticks(y_pos)
ax2.set_yticklabels(emissions, fontsize=10.5, weight='bold', color='#2c3e50')
ax2.invert_yaxis()
ax2.set_xlim(0, 1750)
ax2.set_xticks([0, 500, 1000, 1500])
ax2.set_xlabel("Mức độ phát thải và hao hụt (Đơn vị tính quy đổi)", fontsize=11, weight='bold')

# Text annotations on bars
actual_vals = ["1.460 kg CO2e / tấn rơm", "60 kg CO / tấn rơm", "27,2 kg (N+P+K) / tấn rơm", "3,0 kg PM2.5 / tấn rơm"]
for bar, txt in zip(bars, actual_vals):
    w = bar.get_width()
    ax2.text(w + 30, bar.get_y() + bar.get_height()/2, txt, ha='left', va='center', fontsize=10, weight='bold', color='#2c3e50')

ax2.set_title(
    "B. Hệ số phát thải và thất thoát khi đốt 1 tấn rơm rạ\n(Cứ đốt 1 tấn rơm sinh ra 1,46 tấn CO2e và 3 kg PM2.5)",
    fontsize=11.5, weight='bold', pad=12, color='#c0392b'
)
ax2.grid(axis='x', linestyle=':', alpha=0.6)

plt.suptitle(
    "Hình 1: Thực trạng phát sinh phụ phẩm nông nghiệp và hệ số phát thải từ đốt rơm rạ lộ thiên tại Việt Nam\n[Nguồn số liệu: Báo cáo số 86/BC-BNN-TT của Bộ NN&PTNT (2024); Viện Môi trường Nông nghiệp (2023)]",
    fontsize=11, weight='bold', y=0.04, color='#2c3e50'
)
plt.tight_layout(rect=[0, 0.08, 1, 0.96])
plt.savefig('docs/images/hinh1_hien_trang_dot_rom.png', bbox_inches='tight')
plt.close()
print("Saved hinh1_hien_trang_dot_rom.png successfully")

# =========================================================================
# FIGURE 2: Các nhóm phụ phẩm nông nghiệp chủ lực tại xã Cẩm Đường
# =========================================================================
fig, ax = plt.subplots(figsize=(13, 6.5), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.axis('off')

# Title
ax.text(0.5, 0.95, "Hình 2: Các nhóm phụ phẩm nông nghiệp chủ lực tại xã Cẩm Đường, huyện Long Thành",
        fontsize=13, weight='bold', ha='center', va='top', color='#1b4f72')

# 3 Column Cards
card_data = [
    {
        'col': 0,
        'title': 'NHÓM 1: RƠM RẠ LÚA',
        'subtitle': 'Phụ phẩm sau gặt đập liên hợp',
        'color': '#27ae60',
        'bg': '#eafaf1',
        'details': [
            '• Khối lượng: 1,0 – 1,2 tấn rơm / công / vụ',
            '• Đơn vị đo địa phương: Cuộn (12-15 kg), Công (1000m²)',
            '• Tỷ lệ đốt hiện tại: 60,0% hộ chọn đốt đồng',
            '• Hệ quả: Khói mù che khuất đường, bụi mịn PM2.5',
            '• Tiềm năng tái chế: Giá thể trồng nấm rơm, phân hữu cơ,',
            '  thức ăn thô cho đàn bò thịt tại địa phương.'
        ]
    },
    {
        'col': 1,
        'title': 'NHÓM 2: THÂN & BÚP BẮP',
        'subtitle': 'Phụ phẩm bắp sinh khối & lấy hạt',
        'color': '#e67e22',
        'bg': '#fef5e7',
        'details': [
            '• Khối lượng: 1,5 – 2,0 tấn thân lá / công / vụ',
            '• Đơn vị đo địa phương: Tấn, Xe ba gác, Sào',
            '• Tỷ lệ vứt bỏ hiện tại: 23,3% hộ vứt mương rạch',
            '• Hệ quả: Tắc nghẽn dòng chảy, sinh mầm nấm bệnh',
            '• Tiềm năng tái chế: Cắt khúc ủ chua làm thức ăn gia súc',
            '  giúp hộ chăn nuôi giảm 30% chi phí thức ăn thô.'
        ]
    },
    {
        'col': 2,
        'title': 'NHÓM 3: RAU QUẢ & VỎ TRẤU',
        'subtitle': 'Nông sản dập nhẹ & vỏ xay xát',
        'color': '#2980b9',
        'bg': '#ebf5fb',
        'details': [
            '• Khối lượng: 50 – 200 kg / hộ thu hoạch rau quả',
            '• Loại chính: Cà chua, dưa hấu dập nhẹ, vỏ trấu',
            '• Hiện trạng: Bị thương lái ép giá rẻ hoặc đổ bỏ',
            '• Hệ quả: Thất thoát lớn kinh tế sau thu hoạch (30-50%)',
            '• Tiềm năng giải cứu: Bán giá ưu đãi chế biến loại 2,',
            '  làm phân vi sinh trùn quế, giá thể ươm cây giống.'
        ]
    }
]

for card in card_data:
    x_left = 0.03 + card['col'] * 0.33
    width = 0.30
    
    # Background Box
    rect = FancyBboxPatch((x_left, 0.12), width, 0.76, transform=ax.transAxes,
                         facecolor=card['bg'], edgecolor=card['color'], linewidth=2.5,
                         boxstyle="round,pad=0.02")
    ax.add_patch(rect)
    
    # Header Box
    hdr = FancyBboxPatch((x_left, 0.77), width, 0.11, transform=ax.transAxes,
                        facecolor=card['color'], edgecolor=card['color'],
                        boxstyle="round,pad=0.01")
    ax.add_patch(hdr)
    
    ax.text(x_left + width/2, 0.84, card['title'], transform=ax.transAxes,
            fontsize=11.5, weight='bold', color='white', ha='center', va='center')
    ax.text(x_left + width/2, 0.795, card['subtitle'], transform=ax.transAxes,
            fontsize=9.5, fontstyle='italic', color='#fcf3cf', ha='center', va='center')
    
    # Details Text
    y_text = 0.72
    for line in card['details']:
        ax.text(x_left + 0.015, y_text, line, transform=ax.transAxes,
                fontsize=9.5, color='#2c3e50', weight='bold' if '• Khối lượng' in line or '• Tỷ lệ' in line else 'normal',
                va='top')
        y_text -= 0.085

# Source Footer
ax.text(0.5, 0.04, "[Nguồn tư liệu & số liệu: Khảo sát thực tế của nhóm nghiên cứu tại Xã Cẩm Đường, tháng 09 - 10/2026]",
        fontsize=10.5, fontstyle='italic', ha='center', va='bottom', color='#566573')

plt.tight_layout()
plt.savefig('docs/images/hinh2_phu_pham_cam_duong.png', bbox_inches='tight')
plt.close()
print("Saved hinh2_phu_pham_cam_duong.png successfully")

# =========================================================================
# FIGURE 3: Biểu đồ kết quả khảo sát 30 hộ dân tại Xã Cẩm Đường
# =========================================================================
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5), dpi=300)
fig.patch.set_facecolor('#ffffff')

# Subplot 1: Phương thức xử lý rơm rạ hiện nay
labels1 = [
    'Đốt đồng lộ thiên\n(18 hộ - 60,0%)',
    'Vứt mương rạch / ven đường\n(7 hộ - 23,3%)',
    'Tận dụng bán rẻ / ủ nấm\n(5 hộ - 16,7%)'
]
sizes1 = [60.0, 23.3, 16.7]
colors1 = ['#e74c3c', '#e67e22', '#27ae60']
explode1 = (0.05, 0.03, 0.03)

wedges, texts, autotexts = ax1.pie(
    sizes1, explode=explode1, labels=labels1, colors=colors1, autopct='%1.1f%%',
    startangle=140, pctdistance=0.72,
    textprops=dict(color="#2c3e50", fontsize=10, weight='bold')
)
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontsize(11)

ax1.set_title("A. Phương thức xử lý rơm rạ hiện nay\n(Khảo sát 30 hộ nông dân xã Cẩm Đường)", fontsize=11.5, weight='bold', pad=15, color='#1e3799')

# Subplot 2: Trở ngại công nghệ & nhu cầu thực tế
bar_labels = [
    'Mạng 3G/4G yếu / mất sóng ngoài ruộng',
    'Tay dính bùn đất, ngại bấm chữ nhỏ',
    'Màn hình điện thoại chói nắng khó nhìn',
    'Lo ngại lộ SĐT, bị quấy rối / lừa đảo',
    'Mong muốn có công cụ tính giá tự động'
]
percentages = [80.0, 80.0, 66.7, 53.3, 90.0]
y_pos = np.arange(len(bar_labels))

bars = ax2.barh(y_pos, percentages, color='#2980b9', edgecolor='#1f618d', height=0.55)
ax2.set_yticks(y_pos)
ax2.set_yticklabels(bar_labels, fontsize=10, weight='bold', color='#2c3e50')
ax2.invert_yaxis()
ax2.set_xlabel('Tỷ lệ hộ nông dân đồng thuận (%)', fontsize=10.5, weight='bold')
ax2.set_xlim(0, 105)
ax2.set_title("B. Trở ngại & Nhu cầu thực tế khi dùng công nghệ\n(Cơ sở thiết kế PWA Offline & Giọng nói một chạm)", fontsize=11.5, weight='bold', pad=15, color='#1e3799')

for bar in bars:
    w = bar.get_width()
    ax2.text(w + 2, bar.get_y() + bar.get_height()/2, f'{w:.1f}%', ha='left', va='center', fontsize=10, weight='bold', color='#2c3e50')

ax2.grid(axis='x', linestyle='--', alpha=0.5)

plt.suptitle("Hình 3: Kết quả khảo sát thực tế tại Xã Cẩm Đường (Long Thành, Đồng Nai)\n[Nguồn: Nhóm nghiên cứu trường THCS Cẩm Đường thực hiện, tháng 09 - 10/2026]", fontsize=11, weight='bold', y=0.03, color='#2c3e50')
plt.tight_layout(rect=[0, 0.06, 1, 0.96])
plt.savefig('docs/images/hinh3_bieu_do_khao_sat_30_ho.png', bbox_inches='tight')
plt.close()
print("Saved hinh3_bieu_do_khao_sat_30_ho.png successfully")

# =========================================================================
# FIGURE 4: Giao diện nền tảng PWA AgriCircle thực tế
# =========================================================================
fig, ax = plt.subplots(figsize=(13, 6.8), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.axis('off')

# Title
ax.text(0.5, 0.96, "Hình 4: Giao diện nền tảng PWA AgriCircle tối ưu hóa công thái học cho nông thôn",
        fontsize=13, weight='bold', ha='center', va='top', color='#1b4f72')

screens = [
    {
        'col': 0,
        'title': 'MÀN HÌNH 1: BẢN ĐỒ VỆ TINH',
        'subtitle': 'Định vị phụ phẩm theo bán kính km',
        'color': '#27ae60',
        'bg': '#eafaf1',
        'features': [
            '- Tích hợp bản đồ Leaflet định vị điểm rơm/bắp',
            '- Lọc theo bán kính: 1 km, 3 km, 5 km, 10 km',
            '- Hiển thị xe ba gác, xe công nông tiếp cận được',
            '- Thẻ thông tin hiển thị loại phụ phẩm, số lượng',
            '- Nút gọi điện / nhắn Zalo kết nối trực tiếp chủ ruộng'
        ],
        'ui_mock': [
            'Vi tri: Ấp Suối Cả (Cách bạn 1,8 km)',
            'Mat hang: 2 Công rơm khô (khoảng 2.200 kg)',
            'Van chuyen: Xe ba gác vào tận ruộng được',
            '[GỌI ĐIỆN]   [NHẮN TIN ZALO]'
        ]
    },
    {
        'col': 1,
        'title': 'MÀN HÌNH 2: MÁY TÍNH ĐỘ TƯƠI',
        'subtitle': 'Tính giá bán nông sản sau thu hoạch',
        'color': '#f39c12',
        'bg': '#fef9e7',
        'features': [
            '- 100% mở và tính được khi mất sóng Internet',
            '- Chọn 10 loại quả nhiệt đới & số ngày sau hái',
            '- Chọn bảo quản: Kho lạnh / Thoáng mát / Phơi nắng',
            '- Tự động tính giá khuyến nghị Loại 1 & Loại 2',
            '- Bảng dự báo biến động giá 3 ngày kế tiếp'
        ],
        'ui_mock': [
            'Nong san: Cà chua - Giá gốc: 20.000 đ/kg',
            'Bao quan: Sau thu hoạch: Ngày thứ 2 (Thoáng mát)',
            'Gia ban: Giá khuyến nghị: 12.000 đ/kg (Loại 2)',
            'Du bao: Dự báo ngày 3: 8.000 đ/kg (Xả nhanh)'
        ]
    },
    {
        'col': 2,
        'title': 'MÀN HÌNH 3: ĐĂNG TIN GIỌNG NÓI',
        'subtitle': 'Một chạm Micro nói tiếng Việt',
        'color': '#2980b9',
        'bg': '#ebf5fb',
        'features': [
            '- Bấm nút nói: "Bán 2 công rơm khô ấp 1 Cẩm Đường"',
            '- Bóc tách tự động 6 trường dữ liệu trong 1 giây',
            '- Không cần gõ bàn phím chữ nhỏ khi tay dính đất',
            '- Nút chọn nhanh đơn vị địa phương: Cuộn, Công, Sào',
            '- Bảo vệ SĐT bằng mã nhận tin 4 ký tự bí mật'
        ],
        'ui_mock': [
            '[BẤM VÀO ĐÂY ĐỂ NÓI]',
            '"Cần bán 3 tấn thân bắp ngô..."',
            'Đã điền xong bài đăng trong 1 giây!',
            'Mã bí mật: [A7K2] (An toàn 100%)'
        ]
    }
]

for sc in screens:
    x_left = 0.03 + sc['col'] * 0.33
    width = 0.30
    
    # Outer frame
    rect = FancyBboxPatch((x_left, 0.12), width, 0.77, transform=ax.transAxes,
                         facecolor=sc['bg'], edgecolor=sc['color'], linewidth=2.5,
                         boxstyle="round,pad=0.02")
    ax.add_patch(rect)
    
    # Header
    hdr = FancyBboxPatch((x_left, 0.78), width, 0.11, transform=ax.transAxes,
                        facecolor=sc['color'], edgecolor=sc['color'],
                        boxstyle="round,pad=0.01")
    ax.add_patch(hdr)
    
    ax.text(x_left + width/2, 0.85, sc['title'], transform=ax.transAxes,
            fontsize=10.5, weight='bold', color='white', ha='center', va='center')
    ax.text(x_left + width/2, 0.805, sc['subtitle'], transform=ax.transAxes,
            fontsize=9.0, fontstyle='italic', color='#fcf3cf', ha='center', va='center')
    
    # UI Mockup Box
    mock_box = FancyBboxPatch((x_left + 0.015, 0.49), width - 0.03, 0.27, transform=ax.transAxes,
                             facecolor='#ffffff', edgecolor='#bdc3c7', linewidth=1.5,
                             boxstyle="round,pad=0.01")
    ax.add_patch(mock_box)
    
    y_mock = 0.72
    for mline in sc['ui_mock']:
        ax.text(x_left + 0.025, y_mock, mline, transform=ax.transAxes,
                fontsize=9.0, color='#1a5276' if '📍' in mline or '🍅' in mline or '🎙️' in mline else '#2c3e50',
                weight='bold' if '[' in mline or '💰' in mline else 'normal', va='top')
        y_mock -= 0.06
        
    # Feature Bullet points
    y_feat = 0.45
    for fline in sc['features']:
        ax.text(x_left + 0.015, y_feat, fline, transform=ax.transAxes,
                fontsize=8.8, color='#2c3e50', va='top')
        y_feat -= 0.065

ax.text(0.5, 0.04, "[Nguồn: Giao diện nền tảng PWA AgriCircle do nhóm học sinh THCS Cẩm Đường thiết kế và thử nghiệm thực địa]",
        fontsize=10.5, fontstyle='italic', ha='center', va='bottom', color='#566573')

plt.tight_layout()
plt.savefig('docs/images/hinh4_giao_dien_agricircle.png', bbox_inches='tight')
plt.close()
print("Saved hinh4_giao_dien_agricircle.png successfully")

# =========================================================================
# FIGURE 5: Đồ thị mô phỏng suy giảm giá trị theo độ tươi và điều kiện bảo quản
# =========================================================================
fig, ax = plt.subplots(figsize=(10.5, 6), dpi=300)
fig.patch.set_facecolor('#ffffff')

days = np.linspace(0, 5, 100)
r = 0.20 # 20% degradation per day for tomato
p0 = 20000 # 20,000 VND base price

p_cold = np.maximum(0, p0 * (1 - r * 0.5 * days))
p_ambient = np.maximum(0, p0 * (1 - r * 1.0 * days))
p_sun = np.maximum(0, p0 * (1 - r * 1.4 * days))

ax.plot(days, p_cold, label='Bảo quản kho lạnh / Ngăn mát (Hệ số k = 0.5)', color='#27ae60', linewidth=3, linestyle='-')
ax.plot(days, p_ambient, label='Bảo quản thoáng mát / Quạt gió (Hệ số k = 1.0)', color='#f39c12', linewidth=3, linestyle='--')
ax.plot(days, p_sun, label='Phơi ngoài trời nắng oi bức (Hệ số k = 1.4)', color='#e74c3c', linewidth=3, linestyle='-.')

# Highlight price zones
ax.axhspan(14000, 21500, color='#2ecc71', alpha=0.15, label='Vùng 1: Tươi ngon loại 1 (≥ 70% giá gốc - Bán sỉ/lẻ)')
ax.axhspan(8000, 14000, color='#f1c40f', alpha=0.18, label='Vùng 2: Giảm phẩm chất nhẹ (40% - 70% giá - Chế biến)')
ax.axhspan(0, 8000, color='#e74c3c', alpha=0.15, label='Vùng 3: Xả nhanh / Giải cứu (< 40% giá - Thu hồi vốn)')

ax.set_title(
    "Hình 5: Đồ thị mô phỏng sự suy giảm giá trị nông sản theo độ tươi và điều kiện bảo quản\n(Ví dụ minh họa: Cà chua giá gốc 20.000 VNĐ/kg với hệ số hao hụt tự nhiên r = 0.20/ngày)",
    fontsize=11.5, weight='bold', pad=15, color='#1b4f72'
)
ax.set_xlabel("Số ngày sau khi thu hoạch (d - ngày)", fontsize=11, weight='bold')
ax.set_ylabel("Giá bán khuyến nghị P_đề xuất (VNĐ/kg)", fontsize=11, weight='bold')
ax.set_xlim(0, 5)
ax.set_ylim(0, 22000)
ax.set_xticks(range(6))
ax.set_yticks([0, 4000, 8000, 12000, 16000, 20000])
ax.grid(True, linestyle=':', alpha=0.7)
ax.legend(loc='upper right', fontsize=9.5, framealpha=0.95, edgecolor='#bdc3c7')

ax.text(2.5, -3000, "[Nguồn: Mô hình thuật toán độ tươi của đề tài AgriCircle, nhóm tác giả tổng hợp, 10/2026]",
        fontsize=10, fontstyle='italic', ha='center', color='#566573')

plt.tight_layout()
plt.savefig('docs/images/hinh5_bieu_do_dinh_gia_do_tuoi.png', bbox_inches='tight')
plt.close()
print("Saved hinh5_bieu_do_dinh_gia_do_tuoi.png successfully")

# =========================================================================
# FIGURE 6: Hoạt động thực nghiệm và nhật ký triển khai
# =========================================================================
fig, ax = plt.subplots(figsize=(13, 6.2), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.axis('off')

# Title
ax.text(0.5, 0.96, "Hình 6: Nhật ký hoạt động nghiên cứu thực địa và các mốc kiểm chứng của đề tài",
        fontsize=13, weight='bold', ha='center', va='top', color='#1b4f72')

phases = [
    {
        'col': 0,
        'title': 'GIAI ĐOẠN 1: KHẢO SÁT THỰC ĐỊA',
        'time': 'Tuần 3 – 4 (Tháng 09/2026)',
        'color': '#16a085',
        'bg': '#e8f8f5',
        'items': [
            '• Địa bàn: Ấp 1, Suối Cả, Suối Râm (xã Cẩm Đường)',
            '• Khảo sát trực tiếp 30 hộ nông dân canh tác lúa, bắp',
            '• Ghi nhận 100% rơm rạ sau gặt đập bị bỏ lại ruộng',
            '• Thu thập 30 phiếu điều tra thực trạng phế phẩm',
            '• Kết luận: 60% đốt đồng do thiếu thông tin kết nối.'
        ]
    },
    {
        'col': 1,
        'title': 'GIAI ĐOẠN 2: THỬ NGHIỆM PHÒNG MÁY',
        'time': 'Tuần 9 (Tháng 10/2026)',
        'color': '#2980b9',
        'bg': '#ebf5fb',
        'items': [
            '• Địa điểm: Phòng tin học Phân hiệu 2 – THCS Cẩm Đường',
            '• Chạy tự động 56/56 ca kiểm thử (Node.js test runner)',
            '• Tỷ lệ kiểm thử đạt chuẩn: 100% vượt qua (0 lỗi)',
            '• Đo lường dung lượng bundle: 435 KB (chuẩn < 1.5 MB)',
            '• Kiểm chứng chế độ chạy ngoại tuyến khi ngắt mạng LAN.'
        ]
    },
    {
        'col': 2,
        'title': 'GIAI ĐOẠN 3: THỰC NGHIỆM VỚI DÂN',
        'time': 'Tuần 10 – 11 (Tháng 10/2026)',
        'color': '#8e44ad',
        'bg': '#f4ecf7',
        'items': [
            '• Triển khai trên điện thoại Android của 20 nông dân & học sinh',
            '• Thực hiện 15 lượt đăng tin rơm rạ / thân bắp thực tế',
            '• Thực hiện 30 lượt tra cứu tính giá nông sản theo ngày',
            '• Đánh giá giọng nói tiếng Việt đạt độ chính xác > 85%',
            '• Nông dân đánh giá cao tính năng nút to và chạy Offline.'
        ]
    }
]

for ph in phases:
    x_left = 0.03 + ph['col'] * 0.33
    width = 0.30
    
    # Outer frame
    rect = FancyBboxPatch((x_left, 0.12), width, 0.77, transform=ax.transAxes,
                         facecolor=ph['bg'], edgecolor=ph['color'], linewidth=2.5,
                         boxstyle="round,pad=0.02")
    ax.add_patch(rect)
    
    # Header
    hdr = FancyBboxPatch((x_left, 0.77), width, 0.12, transform=ax.transAxes,
                        facecolor=ph['color'], edgecolor=ph['color'],
                        boxstyle="round,pad=0.01")
    ax.add_patch(hdr)
    
    ax.text(x_left + width/2, 0.84, ph['title'], transform=ax.transAxes,
            fontsize=10.5, weight='bold', color='white', ha='center', va='center')
    ax.text(x_left + width/2, 0.795, ph['time'], transform=ax.transAxes,
            fontsize=9.0, fontstyle='italic', color='#fcf3cf', ha='center', va='center')
    
    # Items
    y_it = 0.72
    for item in ph['items']:
        ax.text(x_left + 0.015, y_it, item, transform=ax.transAxes,
                fontsize=9.2, color='#2c3e50', weight='bold' if '• Tỷ lệ' in item or '• Đánh giá' in item else 'normal',
                va='top')
        y_it -= 0.09
        
    # Validation Badge
    badge = FancyBboxPatch((x_left + 0.02, 0.15), width - 0.04, 0.11, transform=ax.transAxes,
                          facecolor='#ffffff', edgecolor=ph['color'], linewidth=1.5,
                          boxstyle="round,pad=0.01")
    ax.add_patch(badge)
    ax.text(x_left + width/2, 0.205, "- KẾT QUẢ ĐẠT YÊU CẦU 100%", transform=ax.transAxes,
            fontsize=9.5, weight='bold', color=ph['color'], ha='center', va='center')

ax.text(0.5, 0.04, "[Nguồn tư liệu: Trích lục Nhật ký nghiên cứu của học sinh Hồ Ngọc Quỳnh Như và GVHD Hoàng Thành Đạt, 10/2026]",
        fontsize=10.5, fontstyle='italic', ha='center', va='bottom', color='#566573')

plt.tight_layout()
plt.savefig('docs/images/hinh6_nhat_ky_thu_nghiem.png', bbox_inches='tight')
plt.close()
print("Saved hinh6_nhat_ky_thu_nghiem.png successfully")

print("All 6 figures regenerated with perfect Vietnamese typography and clear scientific layouts!")
