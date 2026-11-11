import os
import sys
import json
import time
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from gtts import gTTS

WORKSPACE_ROOT = Path("d:/Work/CODE/khkt")
OUTPUT_DIR = WORKSPACE_ROOT / "public" / "video"
TEMP_DIR = WORKSPACE_ROOT / "temp_video_build"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

CAPCUT_DRAFT_ROOT = Path(r"C:\Users\XIAOXIN\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft")

SCENES = [
    {
        "id": "scene1",
        "title": "DỰ ÁN AGRICIRCLE - ĐBSCL",
        "subtitle": "KẾT NỐI PHẾ PHẨM NÔNG NGHIỆP & ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI",
        "badge": "HỘI THI KHKT HỌC SINH TRUNG HỌC",
        "accent_color": (16, 185, 129),
        "bullets": [
            "Vấn đề thực tiễn: Hàng triệu tấn rơm rạ, vỏ sầu riêng, bã mía bị đốt bỏ gây ô nhiễm.",
            "Nông sản nhanh xuống độ tươi ngoài đồng ruộng khiến thương lái dễ ép giá.",
            "Giải pháp AgriCircle: Nền tảng số tuần hoàn giúp phụ phẩm thành tiền & tối ưu thời điểm bán.",
            "Mục tiêu: Tăng thu nhập cho hộ nông dân, giảm thiểu phát thải khí nhà kính."
        ],
        "stats": [
            ("1.46 tấn CO2e", "Tránh phát thải / tấn rơm"),
            ("100% BigInt", "Chính xác từng đồng VND"),
            ("3 Giây", "Đăng tin bằng giọng nói"),
            ("Offline PWA", "Hoạt động ngoài đồng ruộng")
        ],
        "voiceover": "Kính chào Ban Giám khảo! Tại nhiều vùng nông thôn, sau mỗi vụ thu hoạch, hàng triệu tấn rơm rạ, vỏ sầu riêng, bã mía bị đốt bỏ ngoài đồng hoặc đổ tràn lan, gây ô nhiễm không khí và lãng phí sinh khối. Trong khi đó, nông dân lại đau đầu vì nông sản nhanh xuống độ tươi, dễ bị thương lái ép giá rẻ. Xuất phát từ thực tế đó, dự án AgriCircle ra đời: Nền tảng kết nối trao đổi phụ phẩm nông nghiệp và hỗ trợ định giá nông sản theo độ tươi dành riêng cho bà con nông dân."
    },
    {
        "id": "scene2",
        "title": "BẢN ĐỒ PHỤ PHẨM TƯƠNG TÁC",
        "subtitle": "TÌM KIẾM THEO BÁN KÍNH & BẢO MẬT MÃ 4 KÝ TỰ",
        "badge": "TÍNH NĂNG 1: BẢN ĐỒ LEAFLET THÔNG MINH",
        "accent_color": (59, 130, 246),
        "bullets": [
            "Định vị bán kính 5km, 10km, 15km quanh xã để tối ưu chi phí vận chuyển phụ phẩm cồng kềnh.",
            "Phân loại trực quan: Rơm rạ cuộn, vỏ sầu riêng, bã mía, thân bắp; Bán rẻ hoặc Cho tặng 0đ.",
            "Bảo vệ nông dân: Tuyệt đối không để lộ số điện thoại công khai trên mạng.",
            "Mã nhận tin 4 ký tự độc quyền (Crockford Base32) giúp kết nối an toàn qua gọi và SMS."
        ],
        "stats": [
            ("5 - 15 km", "Bán kính quét tối ưu"),
            ("4 Ký Tự", "Mã tin độc quyền"),
            ("0 Lộ SĐT", "Bảo mật chống quấy rối"),
            ("1 Chạm", "Gọi / SMS kết nối ngay")
        ],
        "voiceover": "Tính năng đầu tiên là Bản đồ số trực quan. Người mua hoặc các trang trại có thể quét nhanh các nguồn phụ phẩm xung quanh bán kính từ 5 đến 15km. Đặc biệt, để bảo vệ bà con nông dân khỏi các cuộc gọi quấy rối, AgriCircle không hiển thị số điện thoại công khai. Mỗi tin đăng được mã hóa bằng Mã 4 ký tự ngắn gọn, cho phép người mua gọi điện hoặc nhắn tin trao đổi mà vẫn bảo mật thông tin cá nhân của chủ nông sản."
    },
    {
        "id": "scene3",
        "title": "CÔNG CỤ ĐỊNH GIÁ ĐỘ TƯƠI NÔNG SẢN",
        "subtitle": "THUẬT TOÁN SINH HỌC & DỰ BÁO XU HƯỚNG GIÁ 3 NGÀY",
        "badge": "TÍNH NĂNG 2: ĐỊNH GIÁ BIGINT CHÍNH XÁC",
        "accent_color": (245, 158, 11),
        "bullets": [
            "Mô hình sinh học sau thu hoạch: Tốc độ hô hấp và suy giảm đường theo nhiệt độ môi trường.",
            "Tính toán 100% bằng số nguyên BigInt: Tuyệt đối không phát sinh sai số dấu phẩy động.",
            "Cảnh báo trực quan cho nông dân: 'Bán gấp trong 24 giờ' khi độ tươi chạm ngưỡng giảm giá.",
            "Biểu đồ dự báo giá 3 ngày tiếp theo giúp bà con chủ động thương lượng với thương lái."
        ],
        "stats": [
            ("78% Độ Tươi", "Chỉ số sinh học đo lường"),
            ("85.000 đ/kg", "Giá khuyến nghị thời điểm"),
            ("3 Ngày Tới", "Biểu đồ dự báo giá giảm"),
            ("BigInt Safe", "Chính xác từng đồng xu")
        ],
        "voiceover": "Điểm sáng tạo cốt lõi của AgriCircle nằm ở Công cụ định giá theo độ tươi. Nông dân chỉ cần nhập thời gian cắt và điều kiện bảo quản, thuật toán sẽ tự động phân tích tốc độ suy giảm chất lượng sinh học. Hệ thống tính toán hoàn toàn bằng số nguyên BigInt để đảm bảo độ chính xác tuyệt đối đến từng đồng tiền Việt Nam. Hệ thống còn dự báo xu hướng giá trong 3 ngày tiếp theo, giúp bà con đưa ra quyết định bán kịp thời, tránh tình trạng để nông sản héo rồi phải bán đổ bán tháo."
    },
    {
        "id": "scene4",
        "title": "ĐĂNG TIN SIÊU TỐC BẰNG GIỌNG NÓI",
        "subtitle": "TRẢI NGHIỆM MỘT CHẠM DÀNH CHO BÀ CON NÔNG DÂN",
        "badge": "TÍNH NĂNG 3: NHẬN DIỆN GIỌNG NÓI ĐỊA PHƯƠNG",
        "accent_color": (168, 85, 247),
        "bullets": [
            "Giao diện thân thiện người cao tuổi: Phím bấm micro cực lớn, độ tương phản cao WCAG AAA.",
            "Tự động nhận diện từ khóa đơn vị đo Nam Bộ: Công (1.000m²), Sào, Thiên, Giạ (20kg), Chục 12/14.",
            "Bóc tách câu nói tự nhiên và tự động điền đầy đủ biểu mẫu đăng tin chỉ sau 3 giây.",
            "Nông dân ra ngoài đồng không cần phải gõ bàn phím chữ nhỏ phức tạp."
        ],
        "stats": [
            ("1 Nút Bấm", "Chạm micro nói tự nhiên"),
            ("5 Đơn Vị", "Công, Sào, Giạ, Thiên, Chục"),
            ("3 Giây", "Tự động hoàn tất biểu mẫu"),
            ("WCAG AAA", "Chữ to, dễ nhìn ngoài nắng")
        ],
        "voiceover": "Thấu hiểu nông dân lớn tuổi gặp khó khăn khi gõ bàn phím điện thoại, AgriCircle tích hợp công nghệ Đăng tin bằng giọng nói một chạm. Nông dân chỉ cần bấm nút micro và nói tự nhiên. Hệ thống được lập trình riêng để hiểu các thuật ngữ địa phương Nam Bộ như công, sào, thiên, giạ, hay chục mười hai. Tin đăng được phân tích và điền tự động vào biểu mẫu chỉ sau 3 giây."
    },
    {
        "id": "scene5",
        "title": "BẢNG THÀNH TÍCH CO2 & CHẾ ĐỘ OFFLINE",
        "subtitle": "TIÊU CHUẨN MÔI TRƯỜNG IPCC & HOẠT ĐỘNG KHÔNG CẦN INTERNET",
        "badge": "TÍNH NĂNG 4: TÁC ĐỘNG XANH & CÔNG NGHỆ PWA",
        "accent_color": (14, 165, 233),
        "bullets": [
            "Tính toán giảm phát thải CO2e chuẩn IPCC: Mỗi tấn rơm không đốt giảm 1.46 tấn CO2 tương đương.",
            "Huy hiệu xanh tuyên dương nông dân tuần hoàn bảo vệ môi trường nông thôn.",
            "Công nghệ Service Worker & Cache API: Mở ứng dụng mượt mà ngay cả khi không có 4G hoặc Wifi.",
            "Tự động lưu trữ tin vào hàng đợi Offline, đồng bộ tức thì lên máy chủ ngay khi có mạng."
        ],
        "stats": [
            ("1.46 t CO2e", "Hệ số giảm phát thải IPCC"),
            ("120 Tấn", "Phụ phẩm tái chế giả định"),
            ("0 KB Mạng", "Vẫn xem và đăng tin ngoại tuyến"),
            ("Auto Sync", "Tự động đồng bộ ngầm")
        ],
        "voiceover": "Không chỉ mang lại giá trị kinh tế, AgriCircle còn là công cụ giáo dục môi trường sống động. Bảng thành tích xanh tính toán lượng khí nhà kính giảm phát thải theo chuẩn quốc tế IPCC: mỗi tấn rơm tránh đốt giúp giảm một phẩy bốn mươi sáu tấn CO2 tương đương. Hơn nữa, nhờ công nghệ PWA và Service Worker, ứng dụng hoạt động mượt mà ngay cả khi bà con ra giữa đồng ruộng không có sóng 4G, và tự động đồng bộ khi có kết nối trở lại."
    },
    {
        "id": "scene6",
        "title": "NÔNG NGHIỆP TUẦN HOÀN BỀN VỮNG",
        "subtitle": "BIẾN PHẾ PHẨM THÀNH TÀI NGUYÊN - NÂNG CAO THU NHẬP NÔNG DÂN",
        "badge": "THÔNG ĐIỆP DỰ ÁN KHKT HỌC SINH TRUNG HỌC",
        "accent_color": (34, 197, 94),
        "bullets": [
            "Chi phí vận hành 0 đồng: Công nghệ thuần Node.js & SQLite WAL, chạy bền bỉ không tốn tiền server.",
            "Ý nghĩa thực tiễn: Giảm đốt rơm rạ, tăng thu nhập cho nông dân nghèo và trang trại nấm rơm.",
            "Dự án được bảo vệ bởi 55/55 bài kiểm thử tự động, mã nguồn nhẹ chỉ hơn 400KB.",
            "Sẵn sàng triển khai mở rộng trên toàn địa bàn huyện Long Thành và tỉnh Đồng Nai."
        ],
        "stats": [
            ("55/55 PASS", "Kiểm thử tự động bảo vệ"),
            ("401 KB", "Gói cài đặt siêu nhẹ"),
            ("0đ Cloud", "Tiết kiệm chi phí tối đa"),
            ("100% Xanh", "Vì nông thôn không khói bụi")
        ],
        "voiceover": "AgriCircle: Biến phế phẩm thành tài nguyên, nâng cao thu nhập cho bà con nông dân và cùng chung tay vì một nền nông nghiệp xanh bền vững. Em xin chân thành cảm ơn quý Ban Giám khảo đã lắng nghe!"
    }
]

def get_font(size, bold=False):
    font_names = ["arialbd.ttf" if bold else "arial.ttf", "segoeui.ttf", "calibri.ttf"]
    for fn in font_names:
        fp = Path(f"C:/Windows/Fonts/{fn}")
        if fp.exists():
            try:
                return ImageFont.truetype(str(fp), size)
            except Exception:
                pass
    return ImageFont.load_default()

def render_scene_slide(scene, out_path):
    width, height = 1920, 1080
    im = Image.new("RGB", (width, height), (15, 23, 42)) # Deep slate navy #0f172a
    draw = ImageDraw.Draw(im)

    # Accent top banner
    accent = scene["accent_color"]
    draw.rectangle([0, 0, width, 12], fill=accent)

    # Header section
    font_badge = get_font(24, bold=True)
    font_title = get_font(52, bold=True)
    font_subtitle = get_font(26, bold=False)

    # Badge pill
    badge_text = scene["badge"]
    badge_w = font_badge.getlength(badge_text) if hasattr(font_badge, 'getlength') else len(badge_text) * 14
    draw.rounded_rectangle([100, 50, 100 + badge_w + 40, 92], radius=10, fill=(30, 41, 59), outline=accent, width=2)
    draw.text((120, 58), badge_text, font=font_badge, fill=accent)

    # Title & Subtitle
    draw.text((100, 115), scene["title"], font=font_title, fill=(248, 250, 252))
    draw.text((100, 185), scene["subtitle"], font=font_subtitle, fill=(148, 163, 184))

    # Divider
    draw.line([100, 230, width - 100, 230], fill=(51, 65, 85), width=2)

    # Left Column: Key Features & Bullets (Cards)
    col1_x = 100
    col1_w = 1100
    y_cursor = 270

    font_bullet = get_font(30, bold=False)
    font_bullet_icon = get_font(32, bold=True)

    for i, bullet in enumerate(scene["bullets"]):
        card_h = 95
        card_rect = [col1_x, y_cursor, col1_x + col1_w, y_cursor + card_h]
        draw.rounded_rectangle(card_rect, radius=12, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
        draw.rounded_rectangle([col1_x + 16, y_cursor + 22, col1_x + 64, y_cursor + 72], radius=8, fill=accent)
        draw.text((col1_x + 30, y_cursor + 28), str(i + 1), font=font_bullet_icon, fill=(15, 23, 42))

        # Split bullet into multiple lines if needed
        words = bullet.split(" ")
        line1, line2 = "", ""
        for w in words:
            if len(line1) + len(w) < 55 and not line2:
                line1 += (w + " ")
            else:
                line2 += (w + " ")
        
        if line2:
            draw.text((col1_x + 85, y_cursor + 16), line1.strip(), font=font_bullet, fill=(241, 245, 249))
            draw.text((col1_x + 85, y_cursor + 52), line2.strip(), font=get_font(25), fill=(203, 213, 225))
        else:
            draw.text((col1_x + 85, y_cursor + 30), line1.strip(), font=font_bullet, fill=(241, 245, 249))

        y_cursor += (card_h + 22)

    # Right Column: High-Impact Metrics & Stats Box
    col2_x = 1260
    col2_w = 560
    box_rect = [col2_x, 270, col2_x + col2_w, 740]
    draw.rounded_rectangle(box_rect, radius=16, fill=(24, 32, 47), outline=accent, width=2)

    font_box_header = get_font(28, bold=True)
    draw.text((col2_x + 30, 295), "CHỈ SỐ & ĐỘ TIN CẬY", font=font_box_header, fill=accent)
    draw.line([col2_x + 30, 340, col2_x + col2_w - 30, 340], fill=(51, 65, 85), width=1)

    y_stat = 370
    font_val = get_font(38, bold=True)
    font_lbl = get_font(22, bold=False)

    for val, lbl in scene["stats"]:
        draw.rounded_rectangle([col2_x + 30, y_stat, col2_x + col2_w - 30, y_stat + 75], radius=10, fill=(30, 41, 59))
        draw.text((col2_x + 50, y_stat + 8), val, font=font_val, fill=(255, 255, 255))
        draw.text((col2_x + 50, y_stat + 45), lbl, font=font_lbl, fill=(148, 163, 184))
        y_stat += 90

    # Bottom Footer
    draw.line([100, 950, width - 100, 950], fill=(51, 65, 85), width=1)
    font_footer = get_font(22, bold=False)
    draw.text((100, 975), "AgriCircle ĐBSCL | Nền tảng Nông nghiệp Tuần hoàn & Định giá Độ tươi Nông sản", font=font_footer, fill=(148, 163, 184))
    draw.text((width - 450, 975), "Hội thi KHKT Học sinh Trung học", font=font_footer, fill=accent)

    im.save(out_path, quality=95)

def build_demo_video():
    print("=== STARTING AGRICIRCLE DEMO VIDEO GENERATION ===")
    clip_files = []
    total_duration = 0.0

    for idx, scene in enumerate(SCENES):
        scene_id = scene["id"]
        print(f"\n--- Processing Scene {idx+1}/{len(SCENES)}: {scene['title']} ---")

        # 1. Generate Voiceover MP3 using gTTS
        audio_path = TEMP_DIR / f"{scene_id}_audio.mp3"
        print(f"Generating Vietnamese voiceover for {scene_id}...")
        tts = gTTS(text=scene["voiceover"], lang="vi", slow=False)
        tts.save(str(audio_path))

        # Probe duration using ffprobe
        res = subprocess.run(
            ["ffprobe", "-i", str(audio_path), "-show_entries", "format=duration", "-v", "quiet", "-of", "csv=p=0"],
            capture_output=True, text=True, check=True
        )
        duration = float(res.stdout.strip())
        print(f"Voice duration: {duration:.2f} seconds")
        total_duration += duration

        # 2. Render 1920x1080 slide image
        slide_path = TEMP_DIR / f"{scene_id}_slide.png"
        print(f"Rendering 1080p slide image for {scene_id}...")
        render_scene_slide(scene, slide_path)

        # 3. Create MP4 clip using ffmpeg
        clip_path = TEMP_DIR / f"{scene_id}_clip.mp4"
        print(f"Encoding video clip: {clip_path.name}...")
        # Add 0.5s padding so the speech isn't cut too abruptly
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", str(slide_path),
            "-i", str(audio_path),
            "-c:v", "libx264", "-tune", "stillimage",
            "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p",
            "-t", f"{duration + 0.5:.2f}",
            str(clip_path)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        clip_files.append(clip_path)

    # 4. Concatenate all clips
    print("\n--- Concatenating all scenes into final video ---")
    concat_list_file = TEMP_DIR / "concat_list.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for clip in clip_files:
            # Escape path for ffmpeg concat
            f.write(f"file '{clip.resolve().as_posix()}'\n")

    final_video = OUTPUT_DIR / "demo-agricircle.mp4"
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list_file),
        "-c", "copy",
        str(final_video)
    ]
    subprocess.run(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"FINAL VIDEO GENERATED SUCCESSFULLY: {final_video}")
    print(f"Total Video Duration: {total_duration:.2f} seconds (~{total_duration/60:.1f} minutes)")

    # 5. CapCut Project Generation
    print("\n--- Creating CapCut Project Draft ---")
    capcut_project_dir = CAPCUT_DRAFT_ROOT / "agricircle_demo"
    capcut_project_dir.mkdir(parents=True, exist_ok=True)

    # Copy final video and scene audios into CapCut draft for easy access
    draft_meta = {
        "draft_id": "agricircle_demo_khkt_2026",
        "draft_name": "AgriCircle Demo KHKT",
        "draft_fold_path": str(capcut_project_dir),
        "tm_draft_create_time": int(time.time()),
        "draft_cover_url": ""
    }
    with open(capcut_project_dir / "draft_meta_info.json", "w", encoding="utf-8") as f:
        json.dump(draft_meta, f, indent=2, ensure_ascii=False)

    # Register in root_meta_info.json if present
    root_meta_file = CAPCUT_DRAFT_ROOT / "root_meta_info.json"
    if root_meta_file.exists():
        try:
            with open(root_meta_file, "r", encoding="utf-8") as f:
                root_data = json.load(f)
            
            # Check if already registered
            store = root_data.get("all_draft_store", [])
            exists = any(d.get("draft_id") == "agricircle_demo_khkt_2026" for d in store)
            if not exists:
                new_entry = {
                    "draft_fold_path": str(capcut_project_dir).replace("\\", "/"),
                    "draft_id": "agricircle_demo_khkt_2026",
                    "draft_name": "AgriCircle Demo KHKT",
                    "draft_json_file": str(capcut_project_dir / "draft_content.json").replace("\\", "/"),
                    "draft_root_path": str(CAPCUT_DRAFT_ROOT).replace("\\", "/"),
                    "tm_draft_create_time": int(time.time()),
                    "draft_is_invisible": False
                }
                store.insert(0, new_entry)
                root_data["all_draft_store"] = store
                with open(root_meta_file, "w", encoding="utf-8") as f:
                    json.dump(root_data, f, indent=2, ensure_ascii=False)
                print("Registered project in CapCut root_meta_info.json!")
        except Exception as e:
            print(f"Warning updating root_meta_info.json: {e}")

    # Copy the final MP4 and slide assets into the CapCut draft folder
    import shutil
    shutil.copy2(str(final_video), str(capcut_project_dir / "agricircle_demo_master.mp4"))
    for clip in clip_files:
        shutil.copy2(str(clip), str(capcut_project_dir / clip.name))

    print(f"CapCut draft populated at: {capcut_project_dir}")
    print("=== ALL DONE! ===")

if __name__ == "__main__":
    build_demo_video()
