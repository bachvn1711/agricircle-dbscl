import json
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WORKSPACE_ROOT = Path("d:/Work/CODE/khkt")
ASSETS_VIDEO_DIR = WORKSPACE_ROOT / "assets" / "video"
TEMP_DIR = Path(os.environ.get("TEMP", "C:/Temp")) / "agricircle_tutorial_build"
CAPCUT_DRAFT_ROOT = Path(r"C:\Users\XIAOXIN\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft")
CHROME_PATH = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
if not CHROME_PATH.exists():
    CHROME_PATH = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")

ASSETS_VIDEO_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen3.5:9b"

TUTORIAL_SCENES = [
    {
        "id": "step1_intro",
        "step_badge": "BƯỚC 1 / 7 • KHỞI CHẠY & TỔNG QUAN",
        "title": "KHỞI CHẠY ỨNG DỤNG AGRICIRCLE (0 ĐỒNG & OFFLINE PWA)",
        "action_label": "Mở start.bat hoặc quét mã QR trên điện thoại • Giao diện 5 Tab trực quan",
        "tab_url_hash": "map",
        "accent": (27, 94, 32),
        "chip_color": (251, 192, 45),
        "guide_points": [
            ("Khởi chạy 1 chạm", "Nhấp đúp start.bat trên máy tính hoặc mở link PWA trên điện thoại Android/iOS."),
            ("Thiết kế cho nông thôn", "Nền ngà lúa non chống chói nắng 35°C, chữ to >= 16px, nút bấm nổi khối 3D >= 48px."),
            ("5 màn hình cốt lõi", "Bản đồ phụ phẩm • Đăng tin giọng nói • Tính giá độ tươi • Tác động CO2 • Quản trị.")
        ],
        "default_subtitles": [
            "Chào mừng đến với hướng dẫn sử dụng AgriCircle từ A đến Z của học sinh Hồ Ngọc Quỳnh Như (Lớp 9/C3, THCS Cẩm Đường).",
            "Bước 1: Bà con mở ứng dụng trực tiếp trên trình duyệt điện thoại hoặc nhấp đúp tệp start.bat trên máy tính mà không cần đăng ký tài khoản.",
            "Giao diện được thiết kế chữ to, tương phản cao ngoài trời nắng với 4 nút chuyển màn hình nhanh ở thanh đáy và nút Quản trị ở góc trên."
        ]
    },
    {
        "id": "step2_map_filter",
        "step_badge": "BƯỚC 2 / 7 • BẢN ĐỒ & LỌC BÁN KÍNH",
        "title": "TÌM PHỤ PHẨM QUANH NHÀ THEO ĐƯỜNG XE & ĐỘ ẨM",
        "action_label": "Tab Bản đồ • Lọc bán kính 3km - 20km • Xem huy hiệu Xe tải / Ba gác & Rơm khô / Ướt",
        "tab_url_hash": "map_list",
        "accent": (3, 105, 161),
        "chip_color": (56, 189, 248),
        "guide_points": [
            ("Lọc nhanh 1 chạm", "Chạm thẻ nhóm phụ phẩm (Rơm rạ, Thân bắp...) hoặc lọc tin Cho miễn phí 0đ, Khô ráo, Xe tải."),
            ("Bán kính hợp lý", "Chọn bán kính 3km, 5km, 10km hoặc 20km vừa tầm xe ba gác, máy cày chạy sang chở."),
            ("Huy hiệu đa sắc", "Nhìn màu huy hiệu biết ngay đường Xe tải hay Ba gác vào được, rơm Khô làm nấm hay Ướt ủ phân.")
        ],
        "default_subtitles": [
            "Bước 2: Tại màn hình Bản đồ, hộ trồng nấm hoặc chăn nuôi bò nhìn thấy ngay các điểm có rơm rạ, thân bắp quanh xã Xuân Đường.",
            "Bà con có thể bấm lọc nhanh các điểm Cho miễn phí 0 đồng, Rơm khô ráo làm nấm, hoặc lọc theo bán kính gần nhà từ 3km đến 20km.",
            "Mỗi thẻ tin đều gắn huy hiệu màu sắc rõ ràng: Đường xe tải hay xe ba gác vào được, rơm khô hay ướt để chuẩn bị đúng xe đi chở."
        ]
    },
    {
        "id": "step3_voice_post",
        "step_badge": "BƯỚC 3 / 7 • ĐĂNG TIN GIỌNG NÓI & NÚT 1 CHẠM",
        "title": "ĐĂNG TIN DỌN RUỘNG DƯỚI 45 GIÂY (KHÔNG CẦN GÕ PHÍM)",
        "action_label": "Tab Đăng tin • Bấm Micro nói tiếng Việt hoặc chạm 4 nút Khối lượng (1-2-5 Công, 1 Tấn)",
        "tab_url_hash": "post",
        "accent": (21, 128, 61),
        "chip_color": (74, 222, 128),
        "guide_points": [
            ("Micro tiếng Việt & Câu mẫu", "Bấm nút Micro to 64px nói tự nhiên hoặc chạm 1 trong 3 câu nói mẫu có sẵn."),
            ("4 nút khối lượng 1 chạm", "Chạm nút 1 Công (~556kg), 2 Công (~1.111kg), 5 Công (~2.778kg) hoặc 1 Tấn không cần gõ số."),
            ("Phiếu xem trước & Mã 4 số", "Kiểm tra Phiếu xem trước rồi bấm Đăng ngay. Hệ thống cấp Mã xác nhận 4 ký tự lưu sẵn vào máy.")
        ],
        "default_subtitles": [
            "Bước 3: Để đăng tin dọn ruộng, bác nông dân chuyển sang tab Đăng tin và bấm nút Micro lớn để nói câu tiếng Việt mộc mạc.",
            "Nếu ngoài đồng ồn gió, bác chỉ cần chạm vào nút câu mẫu hoặc chọn nhanh 4 nút khối lượng: 1 Công, 2 Công, 5 Công, 1 Tấn cùng loại đường xe.",
            "Trước khi gửi, màn hình hiện Phiếu xem trước to rõ. Khi bấm Đăng lên bản đồ, máy cấp Mã xác nhận 4 ký tự (bỏ chữ I, L, O, U tránh đọc nhầm)."
        ]
    },
    {
        "id": "step4_collect_lock",
        "step_badge": "BƯỚC 4 / 7 • THU GOM & KHÓA GỌI LÀM PHIỀN",
        "title": "LIÊN HỆ THU GOM & XÁC NHẬN DỌN XONG RUỘNG 1 CHẠM",
        "action_label": "Bấm Gọi ngay / Chỉ đường • Nhập Mã 4 ký tự hoặc bấm 'Tôi đã dọn xong ruộng này'",
        "tab_url_hash": "collect",
        "accent": (180, 83, 9),
        "chip_color": (251, 191, 36),
        "guide_points": [
            ("Kết nối trực tiếp", "Người mua bấm nút Gọi điện ngay, Mở Zalo hoặc Chỉ đường Google Maps tới tận ruộng."),
            ("Khóa tin bằng Mã 4 số", "Sau khi bốc hàng xong, nhập mã 4 ký tự và số kg thực tế (hoặc chủ ruộng bấm nút đóng 1 chạm)."),
            ("Bảo vệ sự yên tĩnh", "Tin lập tức rời khỏi bản đồ tìm kiếm và tự động ẩn/khóa nút gọi điện để không ai gọi làm phiền.")
        ],
        "default_subtitles": [
            "Bước 4: Khi tìm được nguồn phụ phẩm ưng ý, người thu gom bấm nút Gọi ngay, Mở Zalo hoặc Chỉ đường để đánh xe tới ruộng.",
            "Sau khi bốc rơm lên xe xong, người gom nhập Mã xác nhận 4 ký tự do chủ ruộng cung cấp hoặc chủ ruộng bấm nút 1 chạm ngay trên máy mình.",
            "Hệ thống lập tức chuyển tin sang trạng thái Đã thu gom, ẩn khỏi bản đồ và khóa nút gọi điện thoại, giữ sự yên tĩnh cho bác nông dân."
        ]
    },
    {
        "id": "step5_freshness_calc",
        "step_badge": "BƯỚC 5 / 7 • ĐỒNG HỒ ĐỘ TƯƠI & CẦU NỐI TUẦN HOÀN",
        "title": "TÍNH GIÁ NÔNG SẢN OFFLINE & ĐẨY SANG SÀN PHỤ PHẨM",
        "action_label": "Tab Tính giá (Chạy 100% khi mất mạng) • Đồng hồ 3 vùng màu • Dự báo 3 ngày tới",
        "tab_url_hash": "calc",
        "accent": (217, 119, 6),
        "chip_color": (253, 224, 71),
        "guide_points": [
            ("10 nông sản & Tự nhập", "Chọn Cà chua, Xoài cát, Sầu riêng, Bưởi, Mít Thái... + Số ngày sau hái + Bảo quản (Lạnh/Quạt/Nắng)."),
            ("Đồng hồ sinh học 3 màu", "Làm tròn giá chẵn trăm đồng bằng BigInt; kim chỉ thị trượt trên 3 vùng Xanh (>=75%), Vàng, Đỏ (<40%)."),
            ("Cầu nối 1 chạm ở Mức Đỏ", "Khi chạm Mức Đỏ quá lứa, bấm nút 'Đẩy sang Sàn Phụ phẩm ngay' để tự điền đơn bán cho trại chăn nuôi/ủ phân.")
        ],
        "default_subtitles": [
            "Bước 5: Khi ra đồng mất sóng 4G, bà con vẫn mở được tab Tính giá để kiểm tra độ tươi cho 10 loại nông sản hoặc tự nhập loại quả khác.",
            "Chỉ cần chọn số ngày sau khi hái và cách bảo quản, Thanh đồng hồ sinh học 3 vùng màu sẽ chỉ rõ tỷ lệ tươi còn lại và giá bán làm tròn chẵn trăm đồng.",
            "Nếu nông sản giảm xuống Mức Đỏ dưới 40% hoặc quá hạn tươi, nút 'Đẩy sang Sàn Phụ phẩm ngay' sẽ hiện ra để chuyển 1 chạm sang tab Đăng tin."
        ]
    },
    {
        "id": "step6_impact_bento",
        "step_badge": "BƯỚC 6 / 7 • BẢNG TÁC ĐỘNG CỘNG ĐỒNG",
        "title": "THEO DÕI KHỐI LƯỢNG RƠM CỨU ĐƯỢC & LƯỢNG CO2 CẮT GIẢM",
        "action_label": "Tab Tác động • Hệ số 1,46 kg CO2/kg rơm • Quy đổi Công ruộng sạch & Cây xanh",
        "tab_url_hash": "impact",
        "accent": (22, 101, 52),
        "chip_color": (134, 239, 172),
        "guide_points": [
            ("Cộng dồn tự động", "Mỗi lô phụ phẩm xác nhận thu gom được cộng ngay vào tổng số kg cứu khỏi đốt đồng."),
            ("Chuẩn khoa học 1,46", "Tính lượng khí nhà kính CO2 tránh phát thải theo hệ số 1,46 kg CO2 trên mỗi kg rơm rạ."),
            ("Lưới Bento Sinh thái", "Quy đổi trực quan ra số Công ruộng sạch khói bụi PM2.5 và số Cây xanh trưởng thành hấp thụ CO2/năm.")
        ],
        "default_subtitles": [
            "Bước 6: Màn hình Tác động cộng đồng tổng hợp trực quan thành quả bảo vệ môi trường của bà con nông dân và học sinh toàn xã.",
            "Hệ thống tự động nhân khối lượng phụ phẩm đã thu gom với hệ số 1,46 để tính lượng khí nhà kính CO2 tránh phát thải ra bầu không khí.",
            "Lưới Bento Sinh thái quy đổi con số đó thành diện tích công ruộng sạch khói đốt và số cây xanh trưởng thành tương đương trong 1 năm."
        ]
    },
    {
        "id": "step7_admin_csv",
        "step_badge": "BƯỚC 7 / 7 • QUẢN TRỊ ĐỊA PHƯƠNG & XUẤT BÁO CÁO CSV",
        "title": "QUẢN LÝ TIN ĐĂNG, CẬP NHẬT GIÁ MÙA VỤ & XUẤT BẢNG TÍNH",
        "action_label": "Tab Quản trị • Đăng nhập mã PIN (>= 6 ký tự) • Duyệt tin & Xuất CSV an toàn",
        "tab_url_hash": "admin",
        "accent": (30, 64, 175),
        "chip_color": (147, 197, 253),
        "guide_points": [
            ("Bảo mật bằng Mã PIN", "Cán bộ Hợp tác xã hoặc giáo viên đăng nhập bằng mã PIN từ 6 ký tự trở lên để quản lý hệ thống."),
            ("Kiểm duyệt & Khôi phục", "Xem toàn bộ tin đăng, ẩn tin sai phạm, sửa thông tin hoặc khôi phục tin bị báo cáo nhầm."),
            ("Xuất CSV nghiên cứu", "Tải tệp bảng tính CSV đã tự động che số điện thoại (091***6789) để lập báo cáo KHKT và thống kê xã.")
        ],
        "default_subtitles": [
            "Bước 7: Dành cho cán bộ Hợp tác xã và nhóm nghiên cứu nhà trường, nút Quản trị cho phép đăng nhập an toàn bằng mã PIN bảo mật.",
            "Tại đây, quản trị viên có thể rà soát các tin bị báo cáo, khôi phục tin hợp lệ hoặc điều chỉnh giá tham khảo của 10 loại nông sản theo mùa vụ.",
            "Cuối cùng, bấm nút Xuất CSV để tải toàn bộ số liệu thực nghiệm đã che số điện thoại bảo mật, hoàn tất quy trình sử dụng AgriCircle từ A đến Z!"
        ]
    }
]


def refine_subtitles_with_qwen(scenes):
    print(f"=== [1/5] KẾT NỐI LOCAL OLLAMA ({OLLAMA_MODEL}) ĐỂ BIÊN TẬP PHỤ ĐỀ A->Z ===")
    prompt_items = []
    for idx, sc in enumerate(scenes, 1):
        prompt_items.append({
            "step": idx,
            "id": sc["id"],
            "title": sc["title"],
            "draft_subtitles": sc["default_subtitles"]
        })

    prompt = (
        "Bạn là học sinh lớp 9 Hồ Ngọc Quỳnh Như (Trường THCS Cẩm Đường). "
        "Hãy biên tập nhẹ lại 7 câu phụ đề tóm tắt ngắn gọn (mỗi câu 18-28 từ, tiếng Việt rõ ràng) cho 7 bước hướng dẫn sử dụng phần mềm AgriCircle từ A đến Z dưới đây. "
        "Trả về JSON object có key là id (step1_intro..step7_admin_csv) và value là 1 câu phụ đề mở đầu cho bước đó:\n"
        f"{json.dumps({sc['id']: sc['default_subtitles'][0] for sc in scenes}, ensure_ascii=False)}"
    )

    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "think": False,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2,
            "num_predict": 450
        }
    }).encode("utf-8")

    req = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        elapsed = time.time() - t0
        raw_response = body.get("response", "").strip()
        parsed = json.loads(raw_response)
        updated_count = 0
        for sc in scenes:
            sid = sc["id"]
            subs = list(sc["default_subtitles"])
            candidate = parsed.get(sid)
            if isinstance(candidate, str) and len(candidate.strip()) > 20:
                subs[0] = candidate.strip()
                updated_count += 1
            elif isinstance(candidate, list) and len(candidate) >= 1 and isinstance(candidate[0], str) and len(candidate[0].strip()) > 20:
                subs[0] = candidate[0].strip()
                updated_count += 1
            sc["subtitles"] = subs
        print(f"-> Qwen3.5:9b phản hồi thành công sau {elapsed:.1f}s (Đã tối ưu phụ đề cho {updated_count}/{len(scenes)} bước).", flush=True)
        return True
    except Exception as exc:
        print(f"-> Lưu ý gọi Ollama ({exc}), sử dụng bộ phụ đề chuẩn đã biên tập.", flush=True)
        for sc in scenes:
            sc["subtitles"] = list(sc["default_subtitles"])
        return False


def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def capture_live_ui_screenshots():
    print("=== [2/5] KHỞI ĐỘNG MÁY CHỦ AGRICIRCLE & CHỤP GIAO DIỆN THỰC TẾ ===")
    port = find_free_port()
    db_file = TEMP_DIR / "tutorial_demo.db"
    if db_file.exists():
        db_file.unlink()

    env = os.environ.copy()
    env["PORT"] = str(port)
    env["HOST"] = "127.0.0.1"
    env["DB_PATH"] = str(db_file)
    env["ADMIN_PIN"] = "20262027"

    seed_script = WORKSPACE_ROOT / "src" / "server" / "seed-xuan-duong.js"
    if seed_script.exists():
        subprocess.run(["node", str(seed_script)], cwd=str(WORKSPACE_ROOT), env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    server_proc = subprocess.Popen(
        ["node", "src/server/index.js"],
        cwd=str(WORKSPACE_ROOT),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    base_url = f"http://127.0.0.1:{port}"
    ready = False
    for _ in range(30):
        try:
            with urllib.request.urlopen(f"{base_url}/api/health", timeout=1) as r:
                if r.status == 200:
                    ready = True
                    break
        except Exception:
            time.sleep(0.2)

    screenshots = {}
    try:
        if ready and CHROME_PATH.exists():
            shot_path = TEMP_DIR / "live_home.png"
            cmd = [
                str(CHROME_PATH),
                "--headless",
                "--disable-gpu",
                "--window-size=1280,900",
                "--hide-scrollbars",
                f"--screenshot={shot_path}",
                base_url
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
            if shot_path.exists():
                screenshots["home"] = shot_path
                print(f"-> Đã chụp trực tiếp giao diện web sống tại {base_url} bằng Headless Browser.")
    except Exception as e:
        print(f"-> Lưu ý khi chụp trình duyệt: {e}")
    finally:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=3)
        except Exception:
            server_proc.kill()

    return screenshots


def get_font(size, bold=False):
    candidates = ["arialbd.ttf" if bold else "arial.ttf", "segoeuib.ttf" if bold else "segoeui.ttf"]
    for fn in candidates:
        fp = Path(f"C:/Windows/Fonts/{fn}")
        if fp.exists():
            try:
                return ImageFont.truetype(str(fp), size)
            except Exception:
                pass
    return ImageFont.load_default()


def wrap_text(draw, text, font, max_width):
    words = text.split(" ")
    lines = []
    current = ""
    for w in words:
        test = (current + " " + w).strip()
        w_len = draw.textlength(test, font=font) if hasattr(draw, "textlength") else len(test) * 12
        if w_len <= max_width or not current:
            current = test
        else:
            lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def draw_app_mockup(draw, im, scene, sub_idx):
    mx, my, mw, mh = 950, 175, 890, 650
    draw.rounded_rectangle([mx + 6, my + 8, mx + mw + 6, my + mh + 8], radius=24, fill=(180, 198, 184))
    draw.rounded_rectangle([mx, my, mx + mw, my + mh], radius=24, fill=(247, 249, 244), outline=(27, 94, 32), width=3)

    draw.rounded_rectangle([mx + 3, my + 3, mx + mw - 3, my + 62], radius=21, fill=(255, 255, 255))
    draw.line([mx + 3, my + 62, mx + mw - 3, my + 62], fill=(251, 192, 45), width=4)

    f_brand = get_font(22, bold=True)
    f_nav = get_font(16, bold=True)
    f_body = get_font(18, bold=False)
    f_bold = get_font(19, bold=True)
    f_big = get_font(30, bold=True)
    f_sm = get_font(15, bold=True)

    draw.rounded_rectangle([mx + 20, my + 14, mx + 54, my + 48], radius=8, fill=(27, 94, 32))
    draw.text((mx + 29, my + 19), "A", font=f_brand, fill=(255, 255, 255))
    draw.text((mx + 64, my + 18), "AgriCircle", font=f_brand, fill=(27, 94, 32))
    draw.rounded_rectangle([mx + 182, my + 19, mx + 282, my + 45], radius=12, fill=(232, 245, 233), outline=(187, 247, 208))
    draw.text((mx + 192, my + 23), "XUÂN ĐƯỜNG", font=get_font(13, bold=True), fill=(27, 94, 32))

    tabs = [
        ("map", "Bản đồ"),
        ("post", "Đăng tin"),
        ("calc", "Tính giá"),
        ("impact", "Tác động"),
        ("admin", "Quản trị")
    ]
    active_tab = "map"
    if "post" in scene["id"]:
        active_tab = "post"
    elif "calc" in scene["id"]:
        active_tab = "calc"
    elif "impact" in scene["id"]:
        active_tab = "impact"
    elif "admin" in scene["id"]:
        active_tab = "admin"

    tx = mx + 310
    for tid, tlabel in tabs:
        is_act = tid == active_tab
        bg = (27, 94, 32) if is_act else (237, 243, 232)
        fg = (255, 255, 255) if is_act else (59, 77, 62)
        tw = 96
        draw.rounded_rectangle([tx, my + 14, tx + tw, my + 48], radius=16, fill=bg)
        draw.text((tx + 16, my + 22), tlabel, font=f_nav, fill=fg)
        tx += tw + 10

    cx, cy = mx + 24, my + 80
    cw, ch = mw - 48, mh - 100

    sid = scene["id"]
    if sid in ("step1_intro", "step2_map_filter"):
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 88], radius=16, fill=(232, 245, 233), outline=(187, 247, 208), width=2)
        draw.text((cx + 18, cy + 12), "Sàn Phụ Phẩm Nông Nghiệp Tuần Hoàn — Xã Xuân Đường", font=f_bold, fill=(20, 36, 23))
        draw.text((cx + 18, cy + 44), "🌾 15 nguồn phụ phẩm quanh Xuân Đường • ~12,5 tấn • 10 điểm miễn phí 0đ", font=f_sm, fill=(27, 94, 32))

        chips = ["🆓 Cho miễn phí 0đ", "☀️ Khô ráo (Làm nấm)", "🚛 Xe tải vào tận nơi", "Bán kính: Trong 5 km"]
        qx = cx
        for idx_c, ch_txt in enumerate(chips):
            hi = (sid == "step2_map_filter" and idx_c <= sub_idx)
            c_bg = (27, 94, 32) if hi else (255, 255, 255)
            c_fg = (255, 255, 255) if hi else (20, 36, 23)
            draw.rounded_rectangle([qx, cy + 102, qx + 200, cy + 140], radius=18, fill=c_bg, outline=(148, 180, 154), width=2)
            draw.text((qx + 14, cy + 112), ch_txt, font=f_sm, fill=c_fg)
            qx += 210

        map_y = cy + 154
        draw.rounded_rectangle([cx, map_y, cx + 410, map_y + 380], radius=16, fill=(218, 238, 216), outline=(148, 180, 154), width=2)
        for gx in range(cx + 35, cx + 400, 65):
            draw.line([gx, map_y + 4, gx, map_y + 376], fill=(198, 226, 195), width=1)
        for gy in range(map_y + 35, map_y + 375, 55):
            draw.line([cx + 4, gy, cx + 406, gy], fill=(198, 226, 195), width=1)
        draw.ellipse([cx + 95, map_y + 75, cx + 325, map_y + 305], outline=(27, 94, 32), width=2)
        pins = [
            (cx + 195, map_y + 175, "Rơm rạ • Cho", (22, 163, 74)),
            (cx + 125, map_y + 120, "Thân bắp • Cho", (22, 163, 74)),
            (cx + 260, map_y + 230, "Vỏ bưởi • Bán", (37, 99, 235))
        ]
        for px, py, plbl, pcol in pins:
            draw.ellipse([px - 16, py - 16, px + 16, py + 16], fill=pcol, outline=(255, 255, 255), width=3)
            draw.rounded_rectangle([px + 20, py - 12, px + 135, py + 14], radius=8, fill=(255, 255, 255), outline=pcol)
            draw.text((px + 26, py - 7), plbl, font=get_font(13, bold=True), fill=pcol)

        lx = cx + 428
        lw = cw - 428
        cards = [
            ("🌾 Rơm rạ", "Miễn phí 0đ", "2 Công Nam Bộ (~1.111 kg)", "Cách 1,2 km • Còn 2 ngày", "🚛 Xe tải vào tận nơi", "☀️ Khô ráo (Làm nấm)", (224, 242, 254), (254, 249, 195)),
            ("🌽 Thân / Lõi bắp", "Miễn phí 0đ", "1 Tấn (1.000 kg)", "Cách 2,4 km • Còn 3 ngày", "🛺 Xe ba gác / Đường đan", "⛅ Hơi ẩm (Cắt 1-2 ngày)", (254, 243, 199), (224, 231, 255))
        ]
        cy_card = map_y
        for c_title, c_offer, c_qty, c_meta, b_road, b_moist, col_r, col_m in cards:
            draw.rounded_rectangle([lx, cy_card, lx + lw, cy_card + 182], radius=16, fill=(255, 255, 255), outline=(148, 180, 154), width=2)
            draw.text((lx + 14, cy_card + 12), c_title, font=f_bold, fill=(20, 36, 23))
            draw.rounded_rectangle([lx + lw - 120, cy_card + 10, lx + lw - 14, cy_card + 36], radius=12, fill=(220, 252, 231))
            draw.text((lx + lw - 108, cy_card + 15), c_offer, font=get_font(13, bold=True), fill=(20, 83, 45))
            draw.text((lx + 14, cy_card + 42), c_qty, font=f_bold, fill=(27, 94, 32))
            draw.text((lx + 14, cy_card + 68), c_meta, font=f_sm, fill=(59, 77, 62))
            draw.rounded_rectangle([lx + 14, cy_card + 94, lx + 195, cy_card + 122], radius=12, fill=col_r, outline=(125, 211, 252))
            draw.text((lx + 22, cy_card + 99), b_road, font=get_font(13, bold=True), fill=(3, 105, 161))
            draw.rounded_rectangle([lx + 202, cy_card + 94, lx + lw - 14, cy_card + 122], radius=12, fill=col_m, outline=(253, 224, 71))
            draw.text((lx + 210, cy_card + 99), b_moist, font=get_font(13, bold=True), fill=(133, 77, 14))
            draw.rounded_rectangle([lx + 14, cy_card + 132, lx + 150, cy_card + 170], radius=10, fill=(27, 94, 32))
            draw.text((lx + 32, cy_card + 142), "📞 Gọi ngay", font=f_sm, fill=(255, 255, 255))
            draw.rounded_rectangle([lx + 160, cy_card + 132, lx + lw - 14, cy_card + 170], radius=10, fill=(237, 243, 232), outline=(148, 180, 154))
            draw.text((lx + 185, cy_card + 142), "Chi tiết & Xong", font=f_sm, fill=(20, 36, 23))
            cy_card += 196

    elif sid == "step3_voice_post":
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 68], radius=16, fill=(220, 38, 38) if sub_idx == 0 else (27, 94, 32))
        btn_txt = "🔴 Đang nghe bác nói... (Sóng âm 5 cột hoạt động)" if sub_idx == 0 else "🎙️ Bấm để nói tiếng Việt (Tự động điền 6 ô)"
        draw.text((cx + 210, cy + 21), btn_txt, font=f_bold, fill=(255, 255, 255))

        draw.rounded_rectangle([cx, cy + 82, cx + cw, cy + 150], radius=12, fill=(255, 255, 255), outline=(27, 94, 32), width=2)
        draw.text((cx + 16, cy + 92), "Câu nói đã nhận diện:", font=f_sm, fill=(59, 77, 62))
        draw.text((cx + 16, cy + 116), "\"Tôi có 2 công rơm khô ở gần chợ Xuân Đường, cho miễn phí, cần dọn trong 2 ngày\"", font=f_bold, fill=(27, 94, 32))

        qty_chips = ["🌾 1 Công (~556 kg)", "🌾 2 Công (~1.111 kg) ✓", "🌾 5 Công (~2.778 kg)", "📦 1 Tấn (1.000 kg)"]
        qx = cx
        for idx_q, q_txt in enumerate(qty_chips):
            act = idx_q == 1
            draw.rounded_rectangle([qx, cy + 166, qx + 202, cy + 218], radius=12, fill=(232, 245, 233) if act else (255, 255, 255), outline=(27, 94, 32) if act else (148, 180, 154), width=3 if act else 1)
            draw.text((qx + 14, cy + 183), q_txt, font=f_sm, fill=(27, 94, 32) if act else (20, 36, 23))
            qx += 213

        draw.rounded_rectangle([cx, cy + 234, cx + cw, cy + 314], radius=14, fill=(255, 253, 247), outline=(22, 163, 74), width=2)
        draw.text((cx + 16, cy + 244), "📋 Xem trước tin đăng thực tế (Preview Card):", font=f_bold, fill=(27, 94, 32))
        draw.text((cx + 16, cy + 274), "Bác chuẩn bị đăng: 2 Công Nam Bộ Rơm rạ (~1.111 kg) tại chợ Xuân Đường — Cho miễn phí — 🚛 Xe tải — ☀️ Khô ráo.", font=f_sm, fill=(20, 36, 23))

        draw.rounded_rectangle([cx, cy + 330, cx + cw, cy + 390], radius=14, fill=(27, 94, 32))
        draw.text((cx + 250, cy + 348), "Đồng ý Đăng lên Bản đồ ngay 🚀", font=f_bold, fill=(255, 255, 255))

        draw.rounded_rectangle([cx, cy + 406, cx + cw, cy + 525], radius=16, fill=(220, 252, 231), outline=(27, 94, 32), width=2)
        draw.text((cx + 20, cy + 418), "✅ Đã đăng tin lên bản đồ thành công! Mã xác nhận 4 ký tự của chủ ruộng:", font=f_bold, fill=(20, 83, 45))
        draw.rounded_rectangle([cx + 20, cy + 455, cx + 190, cy + 508], radius=12, fill=(255, 255, 255), outline=(27, 94, 32), width=2)
        draw.text((cx + 52, cy + 465), "7 K 4 P", font=f_big, fill=(27, 94, 32))
        draw.text((cx + 210, cy + 468), "Mã đã tự động lưu trên máy để bác bấm đóng tin 1 chạm khi dọn xong!", font=f_sm, fill=(20, 83, 45))

    elif sid == "step4_collect_lock":
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 530], radius=20, fill=(255, 255, 255), outline=(148, 180, 154), width=2)
        draw.text((cx + 24, cy + 20), "🌾 Rơm rạ — 2 Công Nam Bộ (khoảng 1.111 kg)", font=get_font(22, bold=True), fill=(27, 94, 32))
        draw.text((cx + 24, cy + 54), "Người liên hệ: Bác Ba Cảnh (Ấp Suối Cả, Xuân Đường) • Cách 1,2 km", font=f_body, fill=(59, 77, 62))

        if sub_idx < 2:
            draw.rounded_rectangle([cx + 24, cy + 92, cx + 390, cy + 144], radius=12, fill=(27, 94, 32))
            draw.text((cx + 60, cy + 108), "📞 Gọi điện ngay (0912345678)", font=f_bold, fill=(255, 255, 255))
            draw.rounded_rectangle([cx + 410, cy + 92, cx + 610, cy + 144], radius=12, fill=(237, 243, 232), outline=(148, 180, 154))
            draw.text((cx + 465, cy + 108), "💬 Mở Zalo", font=f_bold, fill=(20, 36, 23))
            draw.rounded_rectangle([cx + 625, cy + 92, cx + cw - 24, cy + 144], radius=12, fill=(237, 243, 232), outline=(148, 180, 154))
            draw.text((cx + 655, cy + 108), "📍 Chỉ đường", font=f_bold, fill=(20, 36, 23))
        else:
            draw.rounded_rectangle([cx + 24, cy + 92, cx + cw - 24, cy + 152], radius=12, fill=(220, 252, 231), outline=(22, 163, 74), width=2)
            draw.text((cx + 40, cy + 110), "✅ Đã thu gom xong! Nút Gọi điện & Zalo đã tự động khóa để bảo vệ sự yên tĩnh cho chủ ruộng.", font=f_bold, fill=(20, 83, 45))

        draw.line([cx + 24, cy + 170, cx + cw - 24, cy + 170], fill=(207, 224, 210), width=2)
        draw.text((cx + 24, cy + 188), "Xác nhận Đã thu gom xong (Nhập mã 4 ký tự hoặc Chủ tin bấm 1 chạm):", font=f_bold, fill=(20, 36, 23))

        draw.rounded_rectangle([cx + 24, cy + 230, cx + 400, cy + 290], radius=12, fill=(247, 249, 244), outline=(27, 94, 32), width=2)
        draw.text((cx + 40, cy + 248), "Mã xác nhận 4 ký tự:   7K4P", font=f_bold, fill=(27, 94, 32))

        draw.rounded_rectangle([cx + 420, cy + 230, cx + cw - 24, cy + 290], radius=12, fill=(247, 249, 244), outline=(27, 94, 32), width=2)
        draw.text((cx + 440, cy + 248), "Khối lượng thực tế:   1.111 kg", font=f_bold, fill=(20, 36, 23))

        draw.rounded_rectangle([cx + 24, cy + 312, cx + cw - 24, cy + 374], radius=14, fill=(27, 94, 32))
        draw.text((cx + 210, cy + 332), "✅ Tôi đã dọn xong ruộng này (Khóa tin 1 chạm)", font=f_bold, fill=(255, 255, 255))

        draw.rounded_rectangle([cx + 24, cy + 398, cx + cw - 24, cy + 505], radius=14, fill=(254, 243, 199), outline=(251, 191, 36))
        draw.text((cx + 40, cy + 414), "🔒 Cơ chế bảo vệ 3 lớp của AgriCircle:", font=f_bold, fill=(146, 64, 14))
        draw.text((cx + 40, cy + 446), "• Nhập sai mã 5 lần bị khóa tạm 15 phút • Tin tự động hết hạn sau 3 ngày mùa gặt", font=f_sm, fill=(146, 64, 14))
        draw.text((cx + 40, cy + 472), "• Sau khi thu gom, cộng ngay 1.111 kg rơm vào Bảng thành tích giảm phát thải CO2 của xã!", font=f_sm, fill=(146, 64, 14))

    elif sid == "step5_freshness_calc":
        crops_list = ["🍅 Cà chua ✓", "🥭 Xoài cát", "🍈 Sầu riêng", "🍈 Bưởi da xanh", "🍈 Mít Thái", "🌱 Nông sản khác"]
        qx = cx
        for idx_cr, cr_txt in enumerate(crops_list):
            act = idx_cr == 0
            draw.rounded_rectangle([qx, cy, qx + 132, cy + 46], radius=12, fill=(232, 245, 233) if act else (255, 255, 255), outline=(27, 94, 32) if act else (148, 180, 154), width=2)
            draw.text((qx + 10, cy + 13), cr_txt, font=get_font(14, bold=True), fill=(27, 94, 32) if act else (20, 36, 23))
            qx += 140

        is_red = (sub_idx == 2)
        days_lbl = "9 ngày sau thu hoạch" if is_red else "2 ngày sau thu hoạch"
        mode_lbl = "☀️ Ngoài trời nắng nóng (k = 1,4)"
        pct_val = 37.0 if is_red else 86.0
        price_val = "7.400 đ/kg" if is_red else "17.200 đ/kg"
        zone_lbl = "🔴 Mức Đỏ (<40% — Chuyển sang Phụ phẩm)" if is_red else "🟢 Mức Xanh (86% — Còn tươi tốt)"
        panel_bg = (254, 242, 242) if is_red else (240, 253, 244)
        panel_bd = (248, 113, 113) if is_red else (134, 239, 172)

        draw.rounded_rectangle([cx, cy + 62, cx + cw, cy + 114], radius=12, fill=(255, 255, 255), outline=(148, 180, 154))
        draw.text((cx + 18, cy + 77), f"Giá gốc loại 1: 20.000 đ/kg   •   Thời gian: {days_lbl}   •   Bảo quản: {mode_lbl}", font=f_bold, fill=(20, 36, 23))

        draw.rounded_rectangle([cx, cy + 128, cx + cw, cy + 365], radius=18, fill=panel_bg, outline=panel_bd, width=2)
        draw.text((cx + 24, cy + 144), f"🍅 Cà chua (Hao hụt chuẩn 5%/ngày)   —   {zone_lbl}", font=f_bold, fill=(153, 27, 27) if is_red else (20, 83, 45))
        draw.text((cx + 24, cy + 178), f"Giá bán đề xuất: {price_val}   (Độ tươi còn lại: {pct_val:.1f}%)", font=f_big, fill=(220, 38, 38) if is_red else (27, 94, 32))

        gx, gy, gw, gh = cx + 24, cy + 232, cw - 48, 22
        draw.rounded_rectangle([gx, gy, gx + int(gw * 0.39), gy + gh], radius=10, fill=(239, 68, 68))
        draw.rounded_rectangle([gx + int(gw * 0.39), gy, gx + int(gw * 0.74), gy + gh], radius=0, fill=(245, 158, 11))
        draw.rounded_rectangle([gx + int(gw * 0.74), gy, gx + gw, gy + gh], radius=10, fill=(22, 163, 74))
        marker_x = gx + int(gw * (pct_val / 100.0))
        draw.rounded_rectangle([marker_x - 8, gy - 6, marker_x + 8, gy + gh + 6], radius=4, fill=(20, 36, 23), outline=(255, 255, 255), width=2)
        draw.text((gx, gy + 28), "🔴 <40% Phụ phẩm", font=f_sm, fill=(153, 27, 27))
        draw.text((gx + int(gw * 0.42), gy + 28), "🟡 40–74% Xả hàng thu hồi vốn", font=f_sm, fill=(180, 83, 9))
        draw.text((gx + gw - 165, gy + 28), "🟢 ≥75% Tươi loại 1", font=f_sm, fill=(20, 83, 45))

        if is_red:
            draw.rounded_rectangle([cx + 24, cy + 300, cx + cw - 24, cy + 352], radius=12, fill=(220, 38, 38))
            draw.text((cx + 190, cy + 316), "♻️ Đẩy sang Sàn Phụ phẩm ngay (Chuyển 1 chạm)", font=f_bold, fill=(255, 255, 255))
        else:
            draw.rounded_rectangle([cx + 24, cy + 300, cx + 360, cy + 352], radius=12, fill=(27, 94, 32))
            draw.text((cx + 80, cy + 316), "🔊 Nghe kết quả tư vấn", font=f_bold, fill=(255, 255, 255))

        draw.rounded_rectangle([cx, cy + 380, cx + cw, cy + 530], radius=16, fill=(255, 255, 255), outline=(148, 180, 154))
        draw.text((cx + 20, cy + 392), "Dự báo 3 ngày tiếp theo (Thanh Bar trực quan):", font=f_bold, fill=(20, 36, 23))
        forecasts = [
            ("Sau 1 ngày nữa", "15.800 đ/kg (79,0%)", 0.79, (22, 163, 74)),
            ("Sau 2 ngày nữa", "14.400 đ/kg (72,0% - Mức Vàng)", 0.72, (245, 158, 11)),
            ("Sau 3 ngày nữa", "13.000 đ/kg (65,0% - Xả hàng)", 0.65, (245, 158, 11))
        ]
        fy = cy + 426
        for f_day, f_val, f_ratio, f_col in forecasts:
            draw.text((cx + 24, fy), f_day, font=f_sm, fill=(59, 77, 62))
            draw.text((cx + 210, fy), f_val, font=f_sm, fill=(20, 36, 23))
            bx = cx + 490
            bw = 320
            draw.rounded_rectangle([bx, fy + 4, bx + bw, fy + 18], radius=6, fill=(237, 243, 232))
            draw.rounded_rectangle([bx, fy + 4, bx + int(bw * f_ratio), fy + 18], radius=6, fill=f_col)
            fy += 32

    elif sid == "step6_impact_bento":
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 210], radius=20, fill=(220, 252, 231), outline=(27, 94, 32), width=2)
        draw.text((cx + 24, cy + 18), "Tổng khối lượng phụ phẩm đã cứu khỏi đốt bỏ tại địa phương:", font=f_bold, fill=(20, 83, 45))
        draw.text((cx + 24, cy + 48), "12.000,0 kg  (12,0 Tấn)", font=f_big, fill=(27, 94, 32))
        draw.text((cx + 24, cy + 96), "Ước tính khí thải CO₂ tránh phát thải (Hệ số 1,46 kg CO₂/kg — Viện Lúa ĐBSCL & IPCC):", font=f_bold, fill=(20, 83, 45))
        draw.text((cx + 24, cy + 126), "17.520,00 kg CO₂  (17,52 Tấn CO₂)", font=f_big, fill=(21, 128, 61))
        draw.text((cx + 24, cy + 172), "🌱 Tương đương dọn sạch ~22 công ruộng rơm rạ và lượng CO₂ hấp thụ của ~796 cây xanh trưởng thành/năm.", font=f_sm, fill=(20, 83, 45))

        bento = [
            ("🌾 ~22 Công ruộng", "Diện tích ruộng sạch khói đốt đồng PM2.5", cx, cy + 228),
            ("🌳 ~796 Cây xanh", "Cây trưởng thành hấp thụ CO₂ trong 1 năm", cx + 430, cy + 228),
            ("📦 12 / 15 Lô thu gom", "Tỷ lệ kết nối thu gom thành công đạt 80%", cx, cy + 340),
            ("🧮 30+ Lượt tính giá", "Thu hồi 55%–68% giá trị nông sản ngày 2–3", cx + 430, cy + 340)
        ]
        for b_val, b_lbl, bx, by in bento:
            draw.rounded_rectangle([bx, by, bx + 412, by + 96], radius=16, fill=(255, 255, 255), outline=(148, 180, 154), width=2)
            draw.text((bx + 20, by + 16), b_val, font=get_font(24, bold=True), fill=(27, 94, 32))
            draw.text((bx + 20, by + 54), b_lbl, font=f_sm, fill=(59, 77, 62))

        draw.rounded_rectangle([cx, cy + 455, cx + cw, cy + 515], radius=14, fill=(27, 94, 32))
        draw.text((cx + 310, cy + 474), "🔄 Làm mới số liệu tác động", font=f_bold, fill=(255, 255, 255))

    elif sid == "step7_admin_csv":
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 82], radius=16, fill=(255, 255, 255), outline=(148, 180, 154), width=2)
        draw.text((cx + 20, cy + 16), "🔐 Quản trị viên Hợp tác xã / Nhà trường (Đã đăng nhập bằng mã PIN >= 6 ký tự)", font=f_bold, fill=(27, 94, 32))
        draw.rounded_rectangle([cx + 20, cy + 44, cx + 270, cy + 74], radius=8, fill=(27, 94, 32))
        draw.text((cx + 36, cy + 50), "📥 Xuất bảng tính CSV an toàn", font=f_sm, fill=(255, 255, 255))
        draw.rounded_rectangle([cx + 290, cy + 44, cx + 480, cy + 74], radius=8, fill=(237, 243, 232), outline=(148, 180, 154))
        draw.text((cx + 312, cy + 50), "Tải lại danh sách tin", font=f_sm, fill=(20, 36, 23))

        draw.rounded_rectangle([cx, cy + 98, cx + cw, cy + 310], radius=16, fill=(255, 255, 255), outline=(148, 180, 154), width=2)
        draw.text((cx + 20, cy + 112), "1. Kiểm duyệt & Khôi phục tin đăng phụ phẩm:", font=f_bold, fill=(20, 36, 23))
        rows = [
            ("#15 • Rơm rạ • 2 công (1.111 kg) • Bác Ba Cảnh", "Đang mở (active)", "Sửa thông tin", "Ẩn tin"),
            ("#14 • Thân bắp • 1 tấn (1.000 kg) • Cô Tư Suối Cả", "Bị báo cáo (reported)", "Khôi phục tin", "Ẩn tin")
        ]
        ry = cy + 148
        for r_info, r_st, btn1, btn2 in rows:
            draw.rounded_rectangle([cx + 18, ry, cx + cw - 18, ry + 68], radius=12, fill=(247, 249, 244), outline=(207, 224, 210))
            draw.text((cx + 32, ry + 12), r_info, font=f_bold, fill=(20, 36, 23))
            draw.text((cx + 32, ry + 40), f"Trạng thái: {r_st}", font=f_sm, fill=(27, 94, 32))
            draw.rounded_rectangle([cx + cw - 280, ry + 16, cx + cw - 150, ry + 52], radius=8, fill=(27, 94, 32))
            draw.text((cx + cw - 266, ry + 25), btn1, font=f_sm, fill=(255, 255, 255))
            draw.rounded_rectangle([cx + cw - 140, ry + 16, cx + cw - 32, ry + 52], radius=8, fill=(254, 226, 226))
            draw.text((cx + cw - 110, ry + 25), btn2, font=f_sm, fill=(153, 27, 27))
            ry += 78

        draw.rounded_rectangle([cx, cy + 326, cx + cw, cy + 525], radius=16, fill=(255, 255, 255), outline=(148, 180, 154), width=2)
        draw.text((cx + 20, cy + 340), "2. Cập nhật hệ số hao hụt & Giá tham khảo 10 loại nông sản theo mùa vụ:", font=f_bold, fill=(20, 36, 23))
        draw.text((cx + 20, cy + 375), "• 🍅 Cà chua: Hao hụt 5,0%/ngày • Giữ tươi tối đa 12 ngày • Giá gốc: 20.000 đ/kg   [Lưu cập nhật]", font=f_sm, fill=(59, 77, 62))
        draw.text((cx + 20, cy + 407), "• 🍈 Sầu riêng: Hao hụt 5,0%/ngày • Giữ tươi tối đa 8 ngày • Giá gốc: 75.000 đ/kg   [Lưu cập nhật]", font=f_sm, fill=(59, 77, 62))
        draw.rounded_rectangle([cx + 20, cy + 445, cx + cw - 20, cy + 508], radius=10, fill=(232, 245, 233))
        draw.text((cx + 34, cy + 460), "🛡️ File CSV xuất ra tự động che SĐT (091***5678), ẩn mã 4 số bí mật và chặn mã độc công thức Excel!", font=f_sm, fill=(20, 83, 45))


def render_tutorial_frame(scene, scene_idx, total_scenes, sub_idx, subtitle_text, out_path):
    width, height = 1920, 1080
    im = Image.new("RGB", (width, height), (20, 36, 23))
    draw = ImageDraw.Draw(im)

    accent = scene["accent"]
    chip_col = scene["chip_color"]

    draw.rectangle([0, 0, width, 118], fill=(27, 94, 32))
    draw.rectangle([0, 118, width, 126], fill=(251, 192, 45))

    f_badge = get_font(20, bold=True)
    f_title = get_font(34, bold=True)
    f_sub = get_font(20, bold=True)
    f_card_t = get_font(24, bold=True)
    f_card_b = get_font(20, bold=False)
    f_sub_box = get_font(30, bold=True)

    draw.rounded_rectangle([60, 20, 430, 56], radius=18, fill=(251, 192, 45))
    draw.text((78, 27), scene["step_badge"], font=f_badge, fill=(20, 36, 23))

    prog_text = f"VIDEO HƯỚNG DẪN SỬ DỤNG TỪ A -> Z (CHỈ PHỤ ĐỀ)  •  CẢNH {sub_idx + 1}/3"
    draw.text((width - 640, 28), prog_text, font=get_font(18, bold=True), fill=(232, 245, 233))

    draw.text((60, 66), scene["title"], font=f_title, fill=(255, 255, 255))

    draw.rounded_rectangle([60, 142, 920, 186], radius=12, fill=(32, 56, 37), outline=chip_col, width=2)
    draw.text((78, 152), f"👉 Thao tác: {scene['action_label']}", font=f_sub, fill=chip_col)

    y_card = 204
    for idx_p, (pt_title, pt_desc) in enumerate(scene["guide_points"]):
        is_current = (idx_p == sub_idx)
        card_bg = (34, 66, 41) if is_current else (26, 46, 30)
        card_bd = (251, 192, 45) if is_current else (62, 96, 69)
        bd_w = 3 if is_current else 1

        draw.rounded_rectangle([60, y_card, 920, y_card + 190], radius=18, fill=card_bg, outline=card_bd, width=bd_w)
        num_bg = (251, 192, 45) if is_current else accent
        num_fg = (20, 36, 23) if is_current else (255, 255, 255)
        draw.rounded_rectangle([84, y_card + 22, 136, y_card + 74], radius=12, fill=num_bg)
        draw.text((101, y_card + 32), str(idx_p + 1), font=get_font(28, bold=True), fill=num_fg)

        draw.text((156, y_card + 24), pt_title, font=f_card_t, fill=(254, 240, 138) if is_current else (255, 255, 255))
        wrapped = wrap_text(draw, pt_desc, f_card_b, 730)
        wy = y_card + 64
        for line in wrapped[:3]:
            draw.text((156, wy), line, font=f_card_b, fill=(232, 245, 233))
            wy += 32

        y_card += 210

    draw_app_mockup(draw, im, scene, sub_idx)

    sub_bar_y = 852
    draw.rounded_rectangle([60, sub_bar_y, width - 60, 1036], radius=22, fill=(10, 18, 12), outline=(251, 192, 45), width=3)

    step_total_clips = total_scenes * 3
    current_clip_num = scene_idx * 3 + sub_idx + 1
    bar_w = int((width - 160) * (current_clip_num / step_total_clips))
    draw.rounded_rectangle([80, sub_bar_y + 14, width - 80, sub_bar_y + 24], radius=5, fill=(40, 60, 45))
    draw.rounded_rectangle([80, sub_bar_y + 14, 80 + bar_w, sub_bar_y + 24], radius=5, fill=(251, 192, 45))

    sub_lines = wrap_text(draw, subtitle_text, f_sub_box, width - 220)
    sy = sub_bar_y + 44 if len(sub_lines) >= 2 else sub_bar_y + 64
    for sline in sub_lines[:3]:
        line_w = draw.textlength(sline, font=f_sub_box) if hasattr(draw, "textlength") else len(sline) * 16
        sx = (width - line_w) / 2
        draw.text((sx + 2, sy + 2), sline, font=f_sub_box, fill=(0, 0, 0))
        draw.text((sx, sy), sline, font=f_sub_box, fill=(254, 249, 195))
        sy += 44

    draw.text((84, 1046), "Tác giả: Hồ Ngọc Quỳnh Như (Lớp 9/C3, Trường THCS Cẩm Đường) • GVHD: Thầy Hoàng Thành Đạt", font=get_font(17, bold=True), fill=(187, 247, 208))
    draw.text((width - 540, 1046), "Phụ đề biên tập cùng Qwen3.5 Local • Không cần bật âm thanh", font=get_font(17, bold=True), fill=(253, 224, 71))

    im.save(out_path, quality=95)


def format_srt_timestamp(seconds):
    ms = int(round((seconds - int(seconds)) * 1000))
    total_sec = int(seconds)
    hrs = total_sec // 3600
    mins = (total_sec % 3600) // 60
    secs = total_sec % 60
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{ms:03d}"


def build_a_to_z_tutorial_video():
    refine_subtitles_with_qwen(TUTORIAL_SCENES)

    print("=== [2/4] KẾT XUẤT KHUNG HÌNH 1080P & PHỤ ĐỀ SRT ===", flush=True)
    clip_duration = 5.0
    clip_files = []
    srt_entries = []
    current_time = 0.0
    srt_index = 1

    total_scenes = len(TUTORIAL_SCENES)
    for s_idx, scene in enumerate(TUTORIAL_SCENES):
        subtitles = scene.get("subtitles", scene["default_subtitles"])
        for sub_idx, sub_text in enumerate(subtitles):
            frame_path = TEMP_DIR / f"{scene['id']}_sub{sub_idx + 1}.png"
            clip_path = TEMP_DIR / f"{scene['id']}_sub{sub_idx + 1}.mp4"

            render_tutorial_frame(scene, s_idx, total_scenes, sub_idx, sub_text, frame_path)

            start_ts = format_srt_timestamp(current_time)
            end_ts = format_srt_timestamp(current_time + clip_duration)
            srt_entries.append(f"{srt_index}\n{start_ts} --> {end_ts}\n{sub_text}\n")
            srt_index += 1
            current_time += clip_duration

            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-framerate", "2", "-i", str(frame_path),
                "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage",
                "-r", "24", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "96k",
                "-t", f"{clip_duration:.2f}",
                "-shortest",
                str(clip_path)
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            clip_files.append(clip_path)

    srt_path = ASSETS_VIDEO_DIR / "huong-dan-su-dung-a-z.srt"
    srt_path.write_text("\n".join(srt_entries), encoding="utf-8")
    print(f"-> Đã xuất tệp phụ đề chuẩn SRT: {srt_path}")

    print("=== [4/5] GHÉP NỐI VIDEO MP4 HOÀN CHỈNH (KHÔNG LỒNG GIỌNG, PHỤ ĐỀ TRỰC QUAN) ===")
    concat_file = TEMP_DIR / "concat_tutorial.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        for clip in clip_files:
            f.write(f"file '{clip.resolve().as_posix()}'\n")

    tutorial_mp4 = ASSETS_VIDEO_DIR / "huong-dan-su-dung-a-z.mp4"
    demo_mp4 = ASSETS_VIDEO_DIR / "demo-agricircle.mp4"

    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(tutorial_mp4)
    ]
    subprocess.run(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    shutil.copy2(str(tutorial_mp4), str(demo_mp4))

    print(f"-> Đã tạo video hướng dẫn A-Z: {tutorial_mp4} ({tutorial_mp4.stat().st_size / 1024:.1f} KB)")
    print(f"-> Đã đồng bộ sang tệp video chính: {demo_mp4}")
    print(f"-> Tổng thời lượng: {current_time:.0f} giây ({len(clip_files)} cảnh phụ đề)")

    print("=== [5/5] CẬP NHẬT DỰ ÁN CAPCUT DRAFT ===")
    if CAPCUT_DRAFT_ROOT.exists():
        capcut_dir = CAPCUT_DRAFT_ROOT / "agricircle_demo"
        capcut_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(tutorial_mp4), str(capcut_dir / "agricircle_tutorial_a_z.mp4"))
        shutil.copy2(str(srt_path), str(capcut_dir / "huong-dan-su-dung-a-z.srt"))
        print(f"-> Đã cập nhật video & phụ đề vào thư mục CapCut: {capcut_dir}")

    print("=== HOÀN TẤT 100%! ===")


if __name__ == "__main__":
    build_a_to_z_tutorial_video()
