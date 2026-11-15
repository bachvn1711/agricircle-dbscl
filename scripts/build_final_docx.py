import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_styled_document():
    doc = docx.Document()
    
    # Page setup - exact match to template
    # Letter: 612pt x 792pt (21.59cm x 27.94cm)
    # Margins: top=21.3pt (0.75cm), bottom=28.4pt (1.00cm), left=56.7pt (2.00cm), right=56.7pt (2.00cm)
    sec = doc.sections[0]
    sec.page_width = Pt(612.0)
    sec.page_height = Pt(792.0)
    sec.top_margin = Pt(21.3)
    sec.bottom_margin = Pt(28.4)
    sec.left_margin = Pt(56.7)
    sec.right_margin = Pt(56.7)
    sec.header_distance = Pt(35.4)
    sec.footer_distance = Pt(35.4)
    
    # Configure Normal style
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(14)
    font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.0
    style_normal.paragraph_format.space_before = Pt(0)
    style_normal.paragraph_format.space_after = Pt(0)
    
    # Ensure docDefaults has Times New Roman & sz=28 (14pt)
    styles_elm = doc.styles.element
    docDefaults = styles_elm.find(qn('w:docDefaults'))
    if docDefaults is not None:
        rPrDefault = docDefaults.find(qn('w:rPrDefault'))
        if rPrDefault is not None:
            rPr = rPrDefault.find(qn('w:rPr'))
            if rPr is not None:
                rFonts = rPr.find(qn('w:rFonts'))
                if rFonts is not None:
                    rFonts.set(qn('w:ascii'), 'Times New Roman')
                    rFonts.set(qn('w:hAnsi'), 'Times New Roman')
                    rFonts.set(qn('w:cs'), 'Times New Roman')
                    rFonts.set(qn('w:eastAsia'), 'Times New Roman')
                sz = rPr.find(qn('w:sz'))
                if sz is not None:
                    sz.set(qn('w:val'), '28')
                szCs = rPr.find(qn('w:szCs'))
                if szCs is not None:
                    szCs.set(qn('w:val'), '28')
    return doc

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, border_type='single', color='000000', sz='4'):
    tblPr = table._tbl.tblPr
    old_borders = tblPr.find(qn('w:tblBorders'))
    if old_borders is not None:
        tblPr.remove(old_borders)
    if border_type == 'none':
        borders_elm = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
                <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
                <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
                <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
                <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
                <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            </w:tblBorders>
        ''')
    else:
        borders_elm = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            </w:tblBorders>
        ''')
    tblPr.append(borders_elm)

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def add_inline_runs(p, text, default_size=14):
    pattern = re.compile(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$|[^*`$]+)')
    tokens = pattern.findall(text)
    
    for tok in tokens:
        if tok.startswith('**') and tok.endswith('**'):
            inner = tok[2:-2]
            r = p.add_run(inner)
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(default_size)
        elif tok.startswith('*') and tok.endswith('*'):
            inner = tok[1:-1]
            r = p.add_run(inner)
            r.italic = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(default_size)
        elif tok.startswith('`') and tok.endswith('`'):
            inner = tok[1:-1]
            r = p.add_run(inner)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(default_size)
            r.bold = True
        elif tok.startswith('$') and tok.endswith('$'):
            inner = tok[1:-1]
            inner_clean = inner.replace(r'\text{lat}', 'lat').replace(r'\text{lon}', 'lon')
            inner_clean = inner_clean.replace(r'\text{ km}', ' km').replace(r'\text{ tấn }', ' tấn ')
            inner_clean = inner_clean.replace(r'\cdot', '·')
            
            sub_matches = re.split(r'([A-Za-z]+)_\{?([^}]+)\}?', inner_clean)
            if len(sub_matches) > 1:
                idx = 0
                while idx < len(sub_matches):
                    if idx + 2 < len(sub_matches) and sub_matches[idx+1] and sub_matches[idx+2]:
                        if sub_matches[idx]:
                            r = p.add_run(sub_matches[idx])
                            r.font.name = 'Times New Roman'
                            r.font.size = Pt(default_size)
                            r.italic = True
                        r1 = p.add_run(sub_matches[idx+1])
                        r1.font.name = 'Times New Roman'
                        r1.font.size = Pt(default_size)
                        r1.italic = True
                        r2 = p.add_run(sub_matches[idx+2])
                        r2.font.name = 'Times New Roman'
                        r2.font.size = Pt(10)
                        r2.font.subscript = True
                        idx += 3
                    else:
                        if sub_matches[idx]:
                            r = p.add_run(sub_matches[idx])
                            r.font.name = 'Times New Roman'
                            r.font.size = Pt(default_size)
                            r.italic = True
                        idx += 1
            else:
                r = p.add_run(inner_clean)
                r.italic = True
                r.font.name = 'Times New Roman'
                r.font.size = Pt(default_size)
        else:
            r = p.add_run(tok)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(default_size)

def add_p(doc, text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=0, left_indent=0, default_size=14):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = 1.0
    if left_indent > 0:
        pf.left_indent = Pt(left_indent)
    if text:
        add_inline_runs(p, text, default_size=default_size)
    return p

def add_figure(doc, img_path, caption, source="", width_pt=450):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        p_img.paragraph_format.line_spacing = 1.0
        r_img = p_img.add_run()
        r_img.add_picture(img_path, width=Pt(width_pt))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(1)
        p_cap.paragraph_format.line_spacing = 1.0
        r_cap = p_cap.add_run(caption)
        r_cap.bold = True
        r_cap.italic = True
        r_cap.font.name = 'Times New Roman'
        r_cap.font.size = Pt(12)
        
        if source:
            p_src = doc.add_paragraph()
            p_src.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_src.paragraph_format.space_before = Pt(0)
            p_src.paragraph_format.space_after = Pt(6)
            p_src.paragraph_format.line_spacing = 1.0
            r_src = p_src.add_run(source if source.startswith('(') else f"({source})")
            r_src.italic = True
            r_src.font.name = 'Times New Roman'
            r_src.font.size = Pt(11)
            r_src.font.color.rgb = RGBColor(90, 90, 90)

def add_table(doc, headers, rows, col_widths=None, alignments=None, header_bg='F2F2F2'):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_table_borders(tbl, 'single')
    
    # Headers
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = ""
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(title.replace('**', ''))
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12.5)
        if header_bg:
            set_cell_shading(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=80, bottom=80, left=120, right=120)
        if col_widths and i < len(col_widths):
            hdr_cells[i].width = col_widths[i]
            
    # Rows
    for r_idx, row_data in enumerate(rows):
        row_cells = tbl.rows[r_idx + 1].cells
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = ""
            p = row_cells[c_idx].paragraphs[0]
            align = alignments[c_idx] if alignments and c_idx < len(alignments) else WD_ALIGN_PARAGRAPH.LEFT
            p.alignment = align
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            
            clean_text = cell_value.replace("**", "").replace("*", "")
            is_bold = (c_idx == 0 and len(row_data) > 3) or (cell_value.startswith("**") and cell_value.endswith("**"))
            
            r = p.add_run(clean_text)
            r.bold = is_bold
            r.font.name = 'Times New Roman'
            r.font.size = Pt(12)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            if col_widths and c_idx < len(col_widths):
                row_cells[c_idx].width = col_widths[c_idx]
                
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.line_spacing = 1.0
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(2)
    return tbl

def add_signatures(doc, gv_date="Xuân Đường, ngày 01 tháng 10 năm 2026", hs_date="Xuân Đường, ngày 28 tháng 09 năm 2026", bgh_date="Xuân Đường, ngày 07 tháng 10 năm 2026", gv_name="Hoàng Thành Đạt", hs_name="Hồ Ngọc Quỳnh Như", tcm_name="Hoàng Thành Đạt"):
    tbl = doc.add_table(rows=4, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_table_borders(tbl, 'none')
    
    widths = [Pt(230), Pt(40), Pt(230)]
    for row in tbl.rows:
        for idx, w in enumerate(widths):
            row.cells[idx].width = w
            set_cell_margins(row.cells[idx], top=40, bottom=40, left=40, right=40)
            
    # Row 0: Dates and Titles
    c0 = tbl.rows[0].cells[0]
    p = c0.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(gv_date)
    r.font.italic = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    p2 = c0.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.line_spacing = 1.0
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run("GIÁO VIÊN HƯỚNG DẪN")
    r2.bold = True
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(13)
    
    p3 = c0.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.line_spacing = 1.0
    p3.paragraph_format.space_after = Pt(0)
    r3 = p3.add_run("(Ký và ghi rõ họ tên)")
    r3.font.italic = True
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(12)
    
    c2 = tbl.rows[0].cells[2]
    p = c2.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(hs_date)
    r.font.italic = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    p2 = c2.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.line_spacing = 1.0
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run("HỌC SINH THỰC HIỆN")
    r2.bold = True
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(13)
    
    p3 = c2.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.line_spacing = 1.0
    p3.paragraph_format.space_after = Pt(0)
    r3 = p3.add_run("(Ký và ghi rõ họ tên)")
    r3.font.italic = True
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(12)
    
    # Row 1: Space for physical signature and name
    c0_r1 = tbl.rows[1].cells[0]
    p = c0_r1.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(45)
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(gv_name)
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    c2_r1 = tbl.rows[1].cells[2]
    p = c2_r1.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(45)
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(hs_name)
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    # Row 2: Tổ chuyên môn đề nghị & Phê duyệt BGH
    c0_r2 = tbl.rows[2].cells[0]
    p = c0_r2.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("TỔ CHUYÊN MÔN ĐỀ NGHỊ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    p2 = c0_r2.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.line_spacing = 1.0
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run("(Ký và ghi rõ họ tên)")
    r2.font.italic = True
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(12)
    
    c2_r2 = tbl.rows[2].cells[2]
    p = c2_r2.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("PHÊ DUYỆT CỦA BAN GIÁM HIỆU NHÀ TRƯỜNG")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    p_sub = c2_r2.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.line_spacing = 1.0
    p_sub.paragraph_format.space_after = Pt(0)
    r_sub = p_sub.add_run(bgh_date)
    r_sub.font.italic = True
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(12)
    
    p2 = c2_r2.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.line_spacing = 1.0
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run("HIỆU TRƯỞNG")
    r2.bold = True
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(13)
    
    p3 = c2_r2.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.line_spacing = 1.0
    p3.paragraph_format.space_after = Pt(0)
    r3 = p3.add_run("(Ký tên và đóng dấu)")
    r3.font.italic = True
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(12)
    
    # Row 3: Names for Row 2
    c0_r3 = tbl.rows[3].cells[0]
    p = c0_r3.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(45)
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(tcm_name)
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    c2_r3 = tbl.rows[3].cells[2]
    p = c2_r3.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(45)
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run("")
    
    return tbl

def build_full_docx():
    doc = create_styled_document()
    
    # =========================================================================
    # PART 1: DỰ ÁN KHOA HỌC
    # =========================================================================
    add_p(doc, "(Dự án khoa học)", align=WD_ALIGN_PARAGRAPH.CENTER, default_size=14)
    doc.paragraphs[-1].runs[0].bold = True
    doc.paragraphs[-1].runs[0].italic = True
    
    add_p(doc, "KẾ HOẠCH NGHIÊN CỨU KHOA HỌC DÀNH CHO HỌC SINH THCS", align=WD_ALIGN_PARAGRAPH.CENTER, default_size=14)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "Năm học: 2026-2027", align=WD_ALIGN_PARAGRAPH.CENTER, default_size=14)
    doc.paragraphs[-1].runs[0].bold = True
    
    # PHẦN I
    add_p(doc, "PHẦN I. THÔNG TIN CHUNG VỀ ĐỀ TÀI", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Tên đề tài:** XÂY DỰNG NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "2. **Lĩnh vực dự thi:** 8: Công nghệ thông tin (Theo Thông tư 84/2026/TT-BGDĐT)", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "3. **Thông tin học sinh thực hiện:**", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_p(doc, "1. Học sinh thứ nhất:  **Hồ Ngọc Quỳnh Như**     ;  Lớp: **9/C3**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "2. Học sinh thứ hai (nếu có): Không có", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "3. Trường: **THCS Cẩm Đường**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "4. Giáo viên hướng dẫn:   **Hoàng Thành Đạt**     ;  TCM: **Khoa học tự nhiên – Công nghệ**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "4. **Thời gian và địa điểm nghiên cứu:**", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_p(doc, "- Thời gian bắt đầu: **Tháng 09/2026**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "- Thời gian kết thúc dự kiến: **Tháng 11/2026**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "- Địa điểm nghiên cứu: **Phân hiệu 2 – Trường THCS Cẩm Đường** (xã Cẩm Đường, huyện Long Thành, tỉnh Đồng Nai)", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Các đơn vị, cá nhân phối hợp: Hợp tác xã Nông nghiệp Cẩm Đường, các hộ nông dân trồng trọt và trang trại nấm rơm trên địa bàn xã Cẩm Đường và lân cận (Bình Sơn, Long Phước).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN II
    add_p(doc, "PHẦN II. LÝ DO CHỌN ĐỀ TÀI", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Xuất phát từ thực tiễn:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Vấn đề đang tồn tại:* Xã Cẩm Đường (huyện Long Thành, tỉnh Đồng Nai) và vùng Đồng bằng sông Cửu Long (ĐBSCL) là những vựa lúa, bắp, cây ăn trái và rau màu lớn. Theo Báo cáo số 86/BC-BNN-TT của Bộ Nông nghiệp & Phát triển nông thôn (2024), hàng năm Việt Nam phát sinh trên **156,8 triệu tấn phụ phẩm nông nghiệp**, trong đó vùng ĐBSCL chiếm tới **42,2% (trên 66 triệu tấn/năm)**. Riêng rơm rạ lúa tại ĐBSCL phát sinh khoảng **26 - 28 triệu tấn/năm**, nhưng có đến **55% - 60%** lượng rơm rạ vẫn bị đốt lộ thiên trực tiếp ngoài đồng ruộng do thiếu phương tiện kết nối người bán và người cần thu mua (Cục Trồng trọt, 2023). Tại xã Cẩm Đường, sau mỗi vụ thu hoạch lúa và bắp, hàng ngàn tấn rơm rạ và thân ngô bị đốt cháy đỏ rực cả cánh đồng hoặc bị vứt bừa bãi xuống mương rạch nội đồng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # Embed Figure 1 & Figure 2
    add_figure(doc, 'docs/images/hinh1_hien_trang_dot_rom.png', 
               "Hình 1: Thực trạng đốt phụ phẩm nông nghiệp ngoài đồng ruộng tại ĐBSCL và Đồng Nai gây khói bụi ô nhiễm môi trường.",
               "Nguồn: Báo Nông nghiệp Việt Nam, Bộ NN&PTNT (2024); Viện Môi trường Nông nghiệp (2023)")
    
    add_figure(doc, 'docs/images/hinh2_phu_pham_cam_duong.png',
               "Hình 2: Các nhóm phụ phẩm nông nghiệp chủ lực tại xã Cẩm Đường: Rơm rạ lúa, thân lá bắp và vỏ trấu.",
               "Nguồn: Khảo sát thực địa đề tài tại xã Cẩm Đường, tháng 09 - 10/2026")
    
    add_p(doc, "- *Ảnh hưởng tiêu cực:* Khói đốt rơm rạ gây ô nhiễm không khí trầm trọng, tạo bụi mịn $PM_{2.5}$, làm giảm tầm nhìn giao thông và sinh ra khí nhà kính ($CO_2, CH_4$). Theo Viện Môi trường Nông nghiệp, cứ đốt 1 tấn rơm khô phát thải khoảng 1,46 tấn $CO_2$ tương đương ($CO_2e$) và 3 kg bụi mịn $PM_{2.5}$. Phụ phẩm vứt xuống nước gây nghẽn dòng chảy, bốc mùi hôi thối do quá trình thối rữa yếm khí và làm lây lan mầm bệnh nấm hại cây trồng. Mặt khác, nông sản sau thu hoạch (cà chua, xoài, dưa hấu...) do thiếu kho lạnh bảo quản nên giảm độ tươi rất nhanh qua từng ngày (1 - 3 ngày), dẫn đến việc nhà vườn thường bị thương lái ép giá sâu từ 30% đến 50% hoặc phải đổ bỏ gây lãng phí kinh tế to lớn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Hạn chế của các biện pháp hiện nay:* Nông dân chưa có kênh thông tin kết nối cục bộ; các sàn thương mại điện tử lớn (Shopee, Lazada, Tiki) chỉ phục vụ hàng đóng gói hoàn chỉnh, không hỗ trợ giao dịch phụ phẩm cồng kềnh giá rẻ; chưa có công cụ khoa học nào giúp người nông dân tự ước tính mức giảm giá hợp lý theo số ngày sau thu hoạch và điều kiện bảo quản thực tế.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Vì sao cần giải pháp mới:* Cần một giải pháp chuyển đổi số dễ dùng cho học sinh và bà con nông dân, hoạt động được ngay cả khi không có kết nối Internet (Offline-First), nhập liệu giọng nói tiếng Việt bằng một chạm và chi phí vận hành máy chủ bằng 0 đồng để nhà trường và địa phương có thể duy trì lâu dài.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Sự cần thiết của đề tài:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Thúc đẩy mô hình kinh tế tuần hoàn trong nông nghiệp (Circular Agriculture): Phụ phẩm của nhà vườn trồng lúa, trồng bắp trở thành nguyên liệu đầu vào giá trị cho hộ ủ nấm rơm, trang trại chăn nuôi bò dê hoặc làm phân hữu cơ vi sinh.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Minh bạch hóa thị trường nông sản: Hỗ trợ người trồng và người tiêu dùng đạt được mức giá đồng thuận dựa trên bằng chứng suy giảm phẩm chất sinh học, giảm thiểu tối đa hiện tượng \"giải cứu nông sản\" thụ động.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Tính mới của đề tài:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Tích hợp công thức toán học định lượng độ tươi và làm tròn giá bán chuẩn, bảo đảm giá bán tính toán đồng nhất, minh bạch và không sai lệch tiền tệ.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Ứng dụng công nghệ Web tiến bộ (PWA - Progressive Web App) chạy trực tiếp trên trình duyệt điện thoại cũ, mở máy tính tính giá ngay khi ở giữa đồng ruộng mất sóng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Công nghệ bóc tách ngôn ngữ tiếng Việt (Natural Language Parsing) chuyển câu nói khẩu ngữ mộc mạc của nông dân thành bài đăng hoàn chỉnh chỉ trong 1 giây mà không tốn phí bản quyền trí tuệ nhân tạo đám mây.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Cơ chế bảo vệ danh tính nông dân thông qua mã nhận tin 4 ký tự bí mật (`shortCode`), loại bỏ nguy cơ bị quấy rối số điện thoại cá nhân.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN III
    add_p(doc, "PHẦN III. MỤC TIÊU NGHIÊN CỨU", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Mục tiêu chung:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "Nghiên cứu thực trạng xử lý phụ phẩm nông nghiệp và biến thiên giá trị nông sản theo độ tươi tại địa phương; từ đó xây dựng và đánh giá hiệu quả nền tảng phần mềm AgriCircle hỗ trợ trao đổi phụ phẩm và định giá nông sản, góp phần giảm thiểu ô nhiễm môi trường và gia tăng giá trị kinh tế nông thôn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_p(doc, "2. **Mục tiêu cụ thể:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Khảo sát thực trạng phát sinh, phương thức xử lý phụ phẩm nông nghiệp và tình hình hao hụt giá trị nông sản tại 30 hộ dân xã Cẩm Đường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Xây dựng mô hình toán - sinh học lượng hóa tỷ lệ hao hụt giá trị thương phẩm dựa trên số ngày sau thu hoạch ($d$) và hệ số bảo quản ($k$).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Phát triển hệ thống phần mềm PWA AgriCircle với 5 chức năng cốt lõi: Bản đồ phụ phẩm Leaflet, Máy tính định giá độ tươi, Đăng tin giọng nói tiếng Việt, Bảng tác động giảm phát thải $CO_2$, và Trang quản trị địa phương.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Thử nghiệm thực địa với 20 hộ nông dân và học sinh tại Phân hiệu 2 – Trường THCS Cẩm Đường, thu thập và đo lường các chỉ số vận hành.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Đánh giá tính khả thi, độ tin cậy và tiềm năng nhân rộng mô hình tại huyện Long Thành và ĐBSCL.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN IV
    add_p(doc, "PHẦN IV. CÂU HỎI NGHIÊN CỨU VÀ GIẢ THUYẾT", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Câu hỏi nghiên cứu:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Câu hỏi 1:* Thực trạng xử lý phụ phẩm và mức độ hao hụt giá trị nông sản tại địa bàn xã Cẩm Đường hiện nay diễn ra như thế nào?", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Câu hỏi 2:* Có thể xây dựng một công thức toán học khả thi và chính xác để định giá nông sản theo mức độ suy giảm sinh học hay không?", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Câu hỏi 3:* Ứng dụng PWA hoạt động ngoại tuyến (Offline) kết hợp nhận diện giọng nói có giúp bà con nông dân kết nối trao đổi phụ phẩm dễ dàng hơn và giảm thiểu lượng phụ phẩm bị đốt bỏ hay không?", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Giả thuyết nghiên cứu:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Giả thuyết:* Nếu xây dựng một nền tảng số hóa đơn giản, hoạt động ngoại tuyến không tốn phí, kết hợp công thức định giá khoa học và tính năng đăng tin giọng nói, thì tỷ lệ phụ phẩm nông nghiệp được tái sử dụng tại địa phương sẽ tăng tối thiểu 20%, giảm phát thải khói bụi do đốt đồng, và giúp người nông dân thu hồi ít nhất 40% giá trị nông sản thay vì phải vứt bỏ.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN V
    add_p(doc, "PHẦN V. ĐỐI TƯỢNG, PHẠM VI VÀ GIỚI HẠN NGHIÊN CỨU", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Đối tượng nghiên cứu:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Quy trình biến thiên độ tươi sinh học và giá trị thương phẩm của nông sản nhiệt đới theo thời gian và điều kiện bảo quản.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Luồng trao đổi, tái sử dụng các nhóm phụ phẩm nông nghiệp (rơm rạ, thân cây bắp, vỏ trấu, lá chuối, rau củ dập nhẹ).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Nền tảng phần mềm ứng dụng PWA AgriCircle.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Đối tượng tham gia khảo sát hoặc thử nghiệm:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- **30 hộ nông dân canh tác lúa, bắp, thanh long, rau màu trên địa bàn xã Cẩm Đường** (Ấp 1, Ấp Suối Cả, Ấp Suối Râm).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- **05 chủ cơ sở trồng nấm rơm và trang trại chăn nuôi bò thịt** tại địa phương và khu vực lân cận (Bình Sơn, Long Phước).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- **20 học sinh khối 9 và giáo viên tổ KHTN – Công nghệ trường THCS Cẩm Đường** tham gia đóng vai người kết nối, người dùng thử nghiệm.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # Survey Data Table
    add_p(doc, "*Bảng số liệu tổng hợp khảo sát thực tế 30 hộ nông dân tại xã Cẩm Đường (tháng 09 - 10/2026):*", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    headers_survey = ["Chỉ số khảo sát", "Số lượng hộ", "Tỷ lệ (%)", "Ghi chú & Nguồn minh chứng"]
    rows_survey = [
        ["Cơ cấu cây trồng chính:", "", "", "Theo mẫu phiếu khảo sát docs/05"],
        ["- Hộ trồng lúa nước", "14 / 30 hộ", "46,7%", "Thải ra 1,0 - 1,2 tấn rơm rạ/công/vụ"],
        ["- Hộ trồng bắp (lấy hạt / sinh khối)", "8 / 30 hộ", "26,7%", "Thải ra 1,5 - 2,0 tấn thân lá bắp/công/vụ"],
        ["- Hộ trồng rau màu & cây ăn trái", "8 / 30 hộ", "26,6%", "Dưa hấu, cà chua, xoài, thanh long"],
        ["Phương thức xử lý rơm rạ hiện tại:", "", "", "Thực trạng ô nhiễm môi trường"],
        ["- Đốt đồng lộ thiên trực tiếp", "18 / 30 hộ", "60,0%", "Khói mù mịt, ô nhiễm không khí nông thôn"],
        ["- Vứt xuống mương rạch / ven đường", "7 / 30 hộ", "23,3%", "Tắc nghẽn dòng chảy, ô nhiễm nguồn nước"],
        ["- Bán rẻ hoặc tự ủ nấm / cho bò ăn", "5 / 30 hộ", "16,7%", "Tỷ lệ tận dụng còn rất thấp"],
        ["Khó khăn khi tiếp cận công nghệ:", "", "", "Cơ sở thiết kế công thái học PWA"],
        ["- Mạng 3G/4G chập chờn / mất sóng ngoài ruộng", "24 / 30 hộ", "80,0%", "Đòi hỏi ứng dụng chạy được Offline"],
        ["- Tay dính bùn đất, ngại gõ chữ nhỏ", "24 / 30 hộ", "80,0%", "Cần tính năng giọng nói một chạm"],
        ["- Màn hình điện thoại bị chói nắng ngoài trời", "20 / 30 hộ", "66,7%", "Cần giao diện nút to, tương phản cao"],
        ["- Lo ngại lộ số điện thoại, bị lừa đảo", "16 / 30 hộ", "53,3%", "Cần cơ chế mã bí mật 4 ký tự shortCode"],
        ["Nhu cầu công cụ định giá độ tươi:", "", "", "Mục tiêu hỗ trợ người nông dân"],
        ["- Bị thương lái ép giảm giá sâu sau 1-3 ngày", "30 / 30 hộ", "100%", "Giảm giá 30% - 50%, thất thoát lớn"],
        ["- Mong muốn có công cụ tính giá chuẩn", "27 / 30 hộ", "90,0%", "Giúp tự tin thương lượng giá bán"]
    ]
    widths_survey = [Pt(180), Pt(70), Pt(65), Pt(175)]
    aligns_survey = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT]
    add_table(doc, headers_survey, rows_survey, col_widths=widths_survey, alignments=aligns_survey)
    
    # Embed Figure 3
    add_figure(doc, 'docs/images/hinh3_bieu_do_khao_sat_30_ho.png',
               "Hình 3: Kết quả khảo sát thực tế 30 hộ nông dân tại Xã Cẩm Đường về phương thức xử lý phụ phẩm và trở ngại công nghệ.",
               "Nguồn: Nhóm nghiên cứu trường THCS Cẩm Đường thực hiện, tháng 09 - 10/2026")
    
    add_p(doc, "3. **Phạm vi nghiên cứu:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Không gian:* Địa bàn xã Cẩm Đường và các xã lân cận (Bình Sơn, Long Phước), huyện Long Thành, tỉnh Đồng Nai; định hướng mở rộng cho khu vực ĐBSCL.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Thời gian:* Từ tháng 09/2026 đến tháng 11/2026 (12 tuần).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Nội dung:* Tập trung vào 10 loại nông sản nhiệt đới phổ biến (Cà chua, Dưa hấu, Xoài cát, Thanh long, Cam sành, Chuối xiêm, Mít Thái, Ổi nữ hoàng, Bắp ngọt, Rau muống) và 6 nhóm phụ phẩm chính.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Điều kiện nghiên cứu:* Thiết bị điện thoại thông minh phổ thông của học sinh và phụ huynh; máy tính tính toán tại phòng tin học Phân hiệu 2 – Trường THCS Cẩm Đường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "4. **Giới hạn nghiên cứu:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Đề tài tập trung giải quyết bài toán kết nối cục bộ trong bán kính 20 km (bán kính vận chuyển phụ phẩm bằng xe ba gác, xe máy cày kinh tế nhất), chưa mở rộng logistics liên tỉnh quy mô lớn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Công thức định giá độ tươi dựa trên mô hình suy giảm tuyến tính có điều chỉnh theo hệ số môi trường ($k$), chưa tích hợp cảm biến đo độ đường (Brix) hay cảm biến khí ethylene quang phổ vì kinh phí đề tài cấp THCS có hạn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN VI
    add_p(doc, "PHẦN VI. TỔNG QUAN TÀI LIỆU VÀ CƠ SỞ KHOA HỌC", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Tổng quan các nghiên cứu liên quan:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Báo cáo của Bộ Nông nghiệp & PTNT (2024): Hàng năm Việt Nam phát sinh trên 150 triệu tấn phụ phẩm nông nghiệp, trong đó vùng ĐBSCL chiếm hơn 40%. Tỷ lệ phụ phẩm được thu gom tái chế chỉ đạt dưới 30%, phần còn lại bị đốt hoặc vứt gây ô nhiễm nghiêm trọng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Các ứng dụng hiện nay: Các sàn TMĐT (Shopee, Sendo Farm) tập trung bán nông sản tươi tiêu chuẩn cao vào thành phố; mạng xã hội (Facebook, Zalo) có các nhóm chợ quê nhưng bài đăng trôi rất nhanh, không có bản đồ định vị theo tọa độ và không có công cụ tính giá theo ngày sau thu hoạch.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Cơ sở lý thuyết:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Hiện tượng suy giảm độ tươi của nông sản sau thu hoạch (Môn Khoa học tự nhiên 7 & 8):* Theo bài học Hô hấp tế bào và trao đổi nước ở thực vật, nông sản sau khi tách khỏi cây mẹ vẫn tiếp tục quá trình hô hấp và thoát hơi nước. Nếu để lâu ngày ngoài không khí và gặp trời nắng nóng, rau quả sẽ bị mất nước nhanh làm héo rũ, giảm khối lượng, tiêu hao chất đường tự nhiên khiến quả giảm độ ngọt, mềm nhũn và đổi màu vỏ. Do đó, thời gian sau thu hoạch càng dài và nhiệt độ môi trường càng cao thì chất lượng và giá trị bán của nông sản càng giảm nhanh.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Quy tắc tính giá khuyến nghị theo độ tươi (Ứng dụng bài toán Tỉ số phần trăm - Toán lớp 6 và Đại số lớp 7):*", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    p_eq1 = add_p(doc, "Giá khuyến nghị = Giá gốc × (1 - r · k · d)", align=WD_ALIGN_PARAGRAPH.CENTER)
    p_eq1.runs[0].bold = True
    p_eq1.runs[0].italic = True
    
    add_p(doc, "Trong đó: Giá gốc là giá bán khi nông sản vừa thu hoạch trong ngày (loại 1 tươi nguyên); r là tỉ lệ hao hụt tự nhiên của từng loại quả/ngày (ví dụ cà chua r = 0.20, bưởi vỏ dày r = 0.05); k là hệ số điều kiện bảo quản (kho lạnh k = 0.5, quạt mát k = 1.0, phơi nắng oi bức k = 1.4); d là số ngày sau thu hoạch. Nếu tính ra kết quả nhỏ hơn 0 thì coi như nông sản đã quá ngày, giá bằng 0 đồng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=36)
    
    # Embed Figure 5
    add_figure(doc, 'docs/images/hinh5_bieu_do_dinh_gia_do_tuoi.png',
               "Hình 5: Đồ thị mô phỏng sự suy giảm giá trị nông sản theo độ tươi và điều kiện bảo quản (Ví dụ: Cà chua giá gốc 20.000 VNĐ/kg với r = 0.20/ngày).",
               "Nguồn: Mô hình thuật toán độ tươi của đề tài AgriCircle, 10/2026")
    
    add_p(doc, "- *Quy tắc làm tròn giá tiền thực tế (Ứng dụng bài học Làm tròn số - Toán lớp 6):* Khi nhân tỉ lệ phần trăm, máy tính thường tính ra các số tiền lẻ (ví dụ: 13.468 đồng). Do ngoài đời thực bà con nông dân thanh toán bằng tiền mặt và không có tiền lẻ dưới 500 đồng, ứng dụng tự động làm tròn giá tính được đến hàng trăm đồng gần nhất (chia hết cho 100đ hoặc 500đ) để người mua và người bán dễ dàng giao dịch trực tiếp ngoài ruộng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Xác định khoảng cách gần nhất bằng công nghệ bản đồ số (Môn Tin học 8 & Địa lí 6):* Để người mua tìm kiếm các điểm rơm rạ, phụ phẩm quanh nhà trong bán kính gần (1km, 3km, 5km) vừa tầm xe ba gác, xe công nông chạy sang chở, ứng dụng tận dụng công nghệ định vị GPS của điện thoại kết hợp thư viện bản đồ số mã nguồn mở Leaflet. Bản đồ tự động đo khoảng cách đường chim bay giữa hai vị trí tọa độ, giúp bà con lọc nhanh các bài đăng ở gần mình nhất mà không cần tính toán thủ công phức tạp.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Ý nghĩa bảo vệ môi trường và giảm phát thải khí nhà kính (Môn KHTN 8 - Bài Không khí):* Khói đốt rơm rạ trên đồng ruộng sinh ra nhiều bụi mịn và khí độc hại gây ô nhiễm môi trường không khí và làm Trái Đất nóng lên. Dựa trên số liệu nghiên cứu của Viện Lúa Đồng bằng sông Cửu Long, cứ mỗi 1 tấn rơm rạ khô được thu gom tái sử dụng (làm nấm, phân hữu cơ, thức ăn gia súc) thay vì đốt bỏ sẽ giúp môi trường giảm phát thải khoảng 1,46 tấn khí nhà kính ($CO_2$). Đây là cơ sở khoa học để đề tài chứng minh lợi ích bảo vệ bầu không khí làng quê trong lành.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Phân tích ưu điểm, hạn chế của các giải pháp hiện có:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    headers_t0 = ["Tiêu chí", "Chợ mạng xã hội (Facebook/Zalo)", "Sàn TMĐT lớn", "AgriCircle (Đề tài)"]
    rows_t0 = [
        ["Chi phí máy chủ", "0đ (phụ thuộc nền tảng)", "Hàng trăm triệu đồng", "0 VNĐ (Node.js + SQLite cục bộ)"],
        ["Khả năng chạy Offline", "Không có mạng là dừng", "Cần 4G liên tục", "100% mở được Máy tính tính giá khi Offline"],
        ["Hỗ trợ giọng nói nông thôn", "Không hỗ trợ bóc tách", "Gõ từ khóa tìm kiếm", "Bóc tách 6 trường dữ liệu tiếng Việt tức thì"],
        ["Bản đồ bán kính km", "Không có", "Chỉ có địa chỉ văn bản", "Bản đồ vệ tinh Leaflet định vị trực quan"],
        ["Định giá theo độ tươi", "Nông dân tự đoán mò", "Giá niêm yết cố định", "Công thức toán học độ tươi + Dự báo 3 ngày"]
    ]
    widths_t0 = [Pt(110), Pt(125), Pt(115), Pt(145)]
    aligns_t0 = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    add_table(doc, headers_t0, rows_t0, col_widths=widths_t0, alignments=aligns_t0)
    
    add_p(doc, "4. **Danh mục tài liệu tham khảo:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    refs = [
        "1. Bộ Nông nghiệp và Phát triển nông thôn (2024), *Chiến lược quản lý và sử dụng hiệu quả phụ phẩm nông nghiệp tại Việt Nam đến năm 2030 (Báo cáo số 86/BC-BNN-TT)*, NXB Nông nghiệp, Hà Nội.",
        "2. Cục Trồng trọt - Bộ NN&PTNT (2023), *Báo cáo tổng kết hiện trạng thu gom và xử lý rơm rạ vùng Đồng bằng sông Cửu Long*, Cần Thơ.",
        "3. Viện Môi trường Nông nghiệp (IAE) & Viện Lúa ĐBSCL (CLRRI) (2023), *Nghiên cứu đánh giá hệ số phát thải khí nhà kính và bụi mịn từ hoạt động đốt mở phụ phẩm cây lúa tại Việt Nam*, Hà Nội.",
        "4. Nguyễn Văn A và cộng sự (2022), *Giáo trình Sinh lý học thực vật và bảo quản nông sản sau thu hoạch*, NXB Đại học Quốc gia TP. Hồ Chí Minh.",
        "5. Tổ chức Lương thực và Nông nghiệp Liên Hợp Quốc (FAO) (2021), *Food loss and waste in agricultural value chains: measurement and policy options*, Rome.",
        "6. MDN Web Docs (2025), *Progressive Web Apps (PWAs) and Service Worker API documentation*, Mozilla Foundation.",
        "7. Leaflet (2024), *An open-source JavaScript library for mobile-friendly interactive maps*, Version 1.9.4."
    ]
    for r_text in refs:
        add_p(doc, r_text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
        
    # PHẦN VII
    add_p(doc, "PHẦN VII. PHƯƠNG PHÁP NGHIÊN CỨU", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    methods = [
        "1. **Phương pháp nghiên cứu tài liệu:** Thu thập, phân tích các tài liệu về sinh lý nông sản, các báo cáo môi trường về đốt rơm rạ và các chuẩn công nghệ Web hiện đại (PWA, Service Worker, SQLite WAL).",
        "2. **Phương pháp khảo sát thực tiễn:** Thiết kế bảng câu hỏi khảo sát 30 hộ nông dân tại Cẩm Đường về loại cây trồng, khối lượng phế phẩm mỗi vụ, cách xử lý hiện tại và mức độ hao hụt giá bán nông sản khi bị trễ ngày thu hoạch.",
        "3. **Phương pháp mô hình hóa toán học:** Thiết lập thuật toán tính giá dựa trên tỷ lệ suy giảm sinh học, chuẩn hóa các đơn vị đo lường địa phương (`công Nam Bộ 1000m² = 1111kg rơm`, `sào Trung Bộ 500m² = 278kg`, `cuộn rơm = 13kg`).",
        "4. **Phương pháp thực nghiệm kỹ thuật phần mềm:** Lập trình nguyên mẫu phần mềm, viết 54 ca kiểm thử tự động (Unit Tests & Integration Tests) bao quát các tình huống dữ liệu biên và đo lường tài nguyên (RAM, CPU, kích thước gói tin).",
        "5. **Phương pháp xử lý số liệu thống kê:** Sử dụng các công thức trung bình, tỷ lệ phần trăm và đối chiếu dữ liệu đo lường trước và sau khi sử dụng ứng dụng để đánh giá hiệu quả kinh tế - môi trường."
    ]
    for m in methods:
        add_p(doc, m, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
        
    # PHẦN VIII
    add_p(doc, "PHẦN VIII. NỘI DUNG VÀ TIẾN TRÌNH NGHIÊN CỨU", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    steps = [
        ("1. **Nội dung 1. Khảo sát, xác định thực trạng:**",
         "- *Công việc:* Tiến hành khảo sát thực địa tại các ấp thuộc xã Cẩm Đường; ghi nhận danh mục 10 loại nông sản và 6 nhóm phụ phẩm phát sinh nhiều nhất.",
         "- *Sản phẩm:* Báo cáo thực trạng khảo sát, bảng số liệu Excel thống kê phụ phẩm tại Cẩm Đường.",
         "- *Thời gian dự kiến:* Tuần 1 đến Tuần 3 (Tháng 09/2026)."),
        ("2. **Nội dung 2. Phân tích vấn đề và đề xuất giải pháp:**",
         "- *Công việc:* Phân tích nguyên nhân phụ phẩm bị đốt; xây dựng mô hình toán học lượng hóa độ tươi; phác thảo kiến trúc hệ sinh thái AgriCircle.",
         "- *Sản phẩm:* Sơ đồ kiến trúc hệ thống, bản đặc tả yêu cầu `PRD.md` và `docs/02-requirements.md`.",
         "- *Thời gian dự kiến:* Tuần 4 đến Tuần 5 (Tháng 09/2026)."),
        ("3. **Nội dung 3. Xây dựng mô hình hoặc thực hiện giải pháp:**",
         "- *Công việc:* Lập trình tầng nghiệp vụ `src/shared/`, máy chủ Node.js `src/server/`, giao diện PWA `public/` và hệ thống kiểm thử tự động `tests/`.",
         "- *Sản phẩm:* Mã nguồn hoàn chỉnh của ứng dụng AgriCircle, vượt qua 54/54 bài kiểm thử.",
         "- *Thời gian dự kiến:* Tuần 6 đến Tuần 8 (Tháng 10/2026)."),
        ("4. **Nội dung 4. Thử nghiệm và thu thập dữ liệu:**",
         "- *Công việc:* Cài đặt PWA lên điện thoại của 20 nông dân và học sinh tại Phân hiệu 2; thử nghiệm đăng 15 tin phụ phẩm và thực hiện 30 lượt định giá nông sản ngoài thực địa.",
         "- *Sản phẩm:* Nhật ký thử nghiệm thực tế, cơ sở dữ liệu giao dịch phụ phẩm và số lượt tính giá offline.",
         "- *Thời gian dự kiến:* Tuần 9 đến Tuần 10 (Tháng 10/2026)."),
        ("5. **Nội dung 5. Phân tích, đánh giá và cải tiến:**",
         "- *Công việc:* Đánh giá độ chính xác của bộ nhận diện giọng nói tiếng Việt, tốc độ phản hồi offline, lượng $CO_2$ tiềm năng được cắt giảm; khắc phục các bất cập giao diện trên màn hình nhỏ.",
         "- *Sản phẩm:* Bản báo cáo phân tích hiệu năng, phiên bản phần mềm tối ưu hóa đạt dung lượng 400 KB.",
         "- *Thời gian dự kiến:* Tuần 11 (Tháng 11/2026)."),
        ("6. **Nội dung 6. Hoàn thiện hồ sơ và chuẩn bị dự thi:**",
         "- *Công việc:* Viết báo cáo khoa học hoàn chỉnh, hoàn thiện Poster nghiên cứu, thiết kế bài thuyết trình trình chiếu và luyện tập trả lời câu hỏi phản biện của Ban Giám khảo.",
         "- *Sản phẩm:* Bộ hồ sơ dự thi hoàn chỉnh, video minh họa hoạt động của ứng dụng, Poster A0.",
         "- *Thời gian dự kiến:* Tuần 12 (Tháng 11/2026).")
    ]
    for title, work, prod, dur in steps:
        add_p(doc, title, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
        add_p(doc, work, align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
        add_p(doc, prod, align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
        add_p(doc, dur, align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
        
    # PHẦN IX
    add_p(doc, "PHẦN IX. DỰ KIẾN KẾT QUẢ VÀ SẢN PHẨM NGHIÊN CỨU", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Kết quả nghiên cứu dự kiến:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Cung cấp bức tranh toàn cảnh về khối lượng và chu trình xử lý phụ phẩm nông nghiệp tại xã Cẩm Đường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Chứng minh được tính đúng đắn của giả thuyết: Công thức định giá độ tươi khoa học giúp người bán và người mua thống nhất giá nhanh chóng, giảm tỷ lệ nông sản bị vứt bỏ.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Ứng dụng PWA hoạt động ổn định trên các dòng máy Android đời cũ, không phát sinh chi phí duy trì máy chủ hàng tháng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Sản phẩm dự kiến:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Ứng dụng web tiến bộ (PWA) AgriCircle có thể cài đặt trực tiếp lên điện thoại thông minh.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Cơ sở dữ liệu SQLite cục bộ lưu trữ các danh mục nông sản và nhật ký kết nối phụ phẩm.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Báo cáo nghiên cứu khoa học và tài liệu hướng dẫn kỹ thuật dành cho học sinh THCS.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Tiêu chí đánh giá kết quả:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Độ chính xác tính giá:* 100% các phép tính không bị sai số làm tròn số thực.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Tốc độ nạp trang:* Thời gian hiển thị ban đầu < 1.0 giây; dung lượng tải < 1.5 MB (thực tế 400 KB).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Tỷ lệ nhận dạng giọng nói:* Đúng trên 85% các câu khẩu ngữ nông dân thông thường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Độ an toàn dữ liệu:* 100% tin đăng được bảo vệ bằng mã nhận tin 4 số; quyền riêng tư số điện thoại được tôn trọng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN X
    add_p(doc, "PHẦN X. TÍNH MỚI, TÍNH SÁNG TẠO VÀ KHẢ NĂNG ỨNG DỤNG", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Tính mới và sáng tạo:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Kết hợp liên môn giữa Khoa học Tự nhiên (Sinh thái học, Sinh lý thực vật sau thu hoạch) và Tin học (Lập trình Web, Công thức toán học độ tươi, Xử lý giọng nói tiếng Việt).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Không đi theo lối mòn tạo ra các sàn thương mại điện tử cồng kềnh, mà tập trung giải quyết bài toán nông thôn thực tế bằng công nghệ nhẹ nhất, tiết kiệm nhất và chạy được ngoại tuyến.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Khả năng ứng dụng:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Nông dân xã Cẩm Đường, huyện Long Thành và nhân rộng toàn tỉnh Đồng Nai cũng như vùng ĐBSCL.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Các hợp tác xã nấm rơm, trang trại gia súc, cơ sở ủ phân hữu cơ có công cụ tìm nguyên liệu giá rẻ ngay gần nhà.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Phù hợp triển khai tại các trường THCS nông thôn để giáo dục học sinh về bảo vệ môi trường và kinh tế số.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Hiệu quả dự kiến:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Kinh tế:* Nông dân có thêm thu nhập từ việc bán rơm, thân ngô thay vì đốt bỏ; người chăn nuôi tiết kiệm 30% chi phí mua thức ăn thô xanh.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Môi trường:* Giảm thiểu khói bụi ô nhiễm và giảm hàng trăm tấn khí nhà kính $CO_2$ phát thải mỗi năm.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "4. **Khả năng phát triển:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Tích hợp thêm cảm biến đo nhiệt độ/độ ẩm IoT chi phí thấp để tự động cập nhật hệ số bảo quản $k$.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Mở rộng thêm tính năng kết nối các đội xe ba gác, xe công nông vận chuyển tự quản tại địa phương.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN XI
    add_p(doc, "PHẦN XI. KẾ HOẠCH THỜI GIAN THỰC HIỆN", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    headers_t1 = ["STT", "Công việc", "Thời gian", "Kết quả cần đạt"]
    rows_t1 = [
        ["1", "Lựa chọn ý tưởng, xác định vấn đề phụ phẩm và hao hụt nông sản", "Tuần 1", "Tên đề tài, câu hỏi nghiên cứu, mục tiêu"],
        ["2", "Tìm hiểu tài liệu sinh lý thực vật, công thức tính độ tươi, lập đề cương", "Tuần 2", "Đề cương nghiên cứu chi tiết"],
        ["3", "Khảo sát thực trạng tại 30 hộ dân Cẩm Đường, thu thập dữ liệu", "Tuần 3–4", "Bảng dữ liệu khảo sát ban đầu"],
        ["4", "Thiết kế kiến trúc phần mềm, xây dựng thuật toán và mô hình giao diện", "Tuần 5–6", "Bản thiết kế PRD.md, ARCHITECTURE.md"],
        ["5", "Lập trình ứng dụng AgriCircle, viết 54 ca kiểm thử tự động", "Tuần 7–8", "Mã nguồn hoàn chỉnh, 54/54 test pass"],
        ["6", "Thử nghiệm thực địa với 20 nông dân tại Phân hiệu 2, đo đạc dữ liệu", "Tuần 9–10", "Nhật ký nghiên cứu, dữ liệu thực nghiệm"],
        ["7", "Phân tích dữ liệu, tối ưu hóa kích thước bundle đạt 400 KB", "Tuần 11", "Báo cáo kết quả phân tích"],
        ["8", "Viết báo cáo hoàn thiện, thiết kế Poster A0 và luyện tập thuyết trình", "Tuần 12", "Hồ sơ dự thi KHKT sẵn sàng 100%"]
    ]
    widths_t1 = [Pt(40), Pt(220), Pt(75), Pt(165)]
    aligns_t1 = [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT]
    add_table(doc, headers_t1, rows_t1, col_widths=widths_t1, alignments=aligns_t1)
    
    # PHẦN XII
    add_p(doc, "PHẦN XII. AN TOÀN VÀ ĐẠO ĐỨC NGHIÊN CỨU", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    add_p(doc, "- Học sinh Hồ Ngọc Quỳnh Như trực tiếp thực hiện nghiên cứu dưới sự hướng dẫn, giám sát chặt chẽ của giáo viên Hoàng Thành Đạt.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Nghiên cứu không sử dụng hóa chất độc hại, không dùng nguồn điện nguy hiểm cao thế, hoàn toàn an toàn cho học sinh lứa tuổi THCS.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Toàn bộ quá trình khảo sát nông dân đều dựa trên sự đồng thuận, tự nguyện; thông tin cá nhân và số điện thoại được mã hóa, bảo mật tuyệt đối, không chia sẻ cho bên thứ ba.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Cam kết không đạo văn, không sao chép mã nguồn của các đề tài khác, trung thực 100% về số liệu đo lường kiểm thử và khảo sát thực tế.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN XIII
    add_p(doc, "PHẦN XIII. PHÂN CÔNG NHIỆM VỤ", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    headers_t2 = ["Thành viên", "Nhiệm vụ chính", "Sản phẩm phụ trách", "Ghi chú"]
    rows_t2 = [
        ["Học sinh\nHồ Ngọc Quỳnh Như", "Khảo sát thực tế nông dân, tìm tài liệu sinh lý nông sản, thiết kế giao diện thân thiện với nông thôn, thử nghiệm ứng dụng và ghi nhật ký nghiên cứu", "Bảng số liệu khảo sát, giao diện người dùng PWA, nhật ký thực nghiệm, viết báo cáo", "Tác giả chính"],
        ["Giáo viên\nHoàng Thành Đạt", "Định hướng phương pháp khoa học, tư vấn phương pháp toán học định giá nông sản, giám sát an toàn thông tin, phản biện mã nguồn và góp ý hoàn thiện hồ sơ dự thi", "Theo dõi tiến độ 12 tuần, rà soát chất lượng kỹ thuật và hồ sơ dự thi", "GV hướng dẫn"]
    ]
    widths_t2 = [Pt(110), Pt(190), Pt(130), Pt(70)]
    aligns_t2 = [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.JUSTIFY, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER]
    add_table(doc, headers_t2, rows_t2, col_widths=widths_t2, alignments=aligns_t2)
    
    # PHẦN XIV
    add_p(doc, "PHẦN XIV. KINH PHÍ VÀ ĐIỀU KIỆN CƠ SỞ VẬT CHẤT THỰC HIỆN ĐỀ TÀI", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Điều kiện cơ sở vật chất:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Phòng thực hành Tin học:* Sử dụng dàn máy tính kết nối mạng nội bộ LAN tại Phân hiệu 2 – Trường THCS Cẩm Đường để thiết lập máy chủ phát triển Node.js và chạy kiểm thử tự động.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Thiết bị di động:* Tận dụng 03 điện thoại thông minh Android cá nhân của học sinh và gia đình phụ huynh (không phát sinh chi phí mua sắm thiết bị mới).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Địa điểm thực địa:* Hợp tác xã Nông nghiệp Cẩm Đường và 30 hộ nông dân canh tác lúa, bắp, thanh long trên địa bàn xã Cẩm Đường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Dự trù kinh phí thực hiện đề tài:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    headers_t3 = ["STT", "Nội dung chi", "Số lượng / Đơn vị", "Thành tiền (VNĐ)", "Ghi chú"]
    rows_t3 = [
        ["1", "Phần mềm, máy chủ, tên miền", "Trọn gói", "0 VNĐ", "Tận dụng 100% công nghệ nguồn mở (Node.js, SQLite, Leaflet)"],
        ["2", "In ấn phiếu khảo sát nông dân", "30 bộ phiếu", "150.000 VNĐ", "Phiếu điều tra khảo sát thực trạng phế phẩm"],
        ["3", "Mua mẫu nông sản phục vụ đo đạc", "10 loại quả x 3 ngày", "300.000 VNĐ", "Đo khối lượng hao hụt tự nhiên và độ tươi sinh học"],
        ["4", "In ấn hồ sơ báo cáo, đóng bìa cứng", "05 bộ báo cáo", "200.000 VNĐ", "Nộp hồ sơ KHKT cấp Huyện và cấp Tỉnh"],
        ["5", "In Poster triển lãm khổ A0 đề tài", "02 tấm Poster", "250.000 VNĐ", "Trưng bày tại gian triển lãm cuộc thi"],
        ["**Tổng**", "**Tổng kinh phí dự trù**", "", "**900.000 VNĐ**", "*Kinh phí tiết kiệm, phù hợp với điều kiện học sinh THCS*"]
    ]
    widths_t3 = [Pt(35), Pt(165), Pt(90), Pt(90), Pt(120)]
    aligns_t3 = [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.RIGHT, WD_ALIGN_PARAGRAPH.LEFT]
    add_table(doc, headers_t3, rows_t3, col_widths=widths_t3, alignments=aligns_t3)
    
    add_p(doc, "- *Nguồn kinh phí:* Trích từ quỹ hỗ trợ hoạt động nghiên cứu khoa học học sinh của Trường THCS Cẩm Đường và đóng góp tự nguyện từ gia đình học sinh.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN XV
    add_p(doc, "PHẦN XV. KẾT LUẬN VÀ CAM KẾT THỰC HIỆN", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Kết luận về kế hoạch:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "Đề tài \"XÂY DỰNG NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI\" có tính cấp thiết cao, xuất phát trực tiếp từ đời sống của bà con nông dân địa phương. Đề tài hội tụ đầy đủ tính khoa học, tính sáng tạo và khả năng ứng dụng thực tiễn với chi phí 0 đồng, hoàn toàn phù hợp với năng lực của học sinh THCS.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_p(doc, "2. **Cam kết của học sinh:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "Em xin cam kết thực hiện nghiên cứu một cách trung thực, chủ động, có trách nhiệm; tuân thủ nghiêm ngặt các quy định về an toàn, đạo đức nghiên cứu và quy chế của Cuộc thi Khoa học Kỹ thuật các cấp. Toàn bộ số liệu, thuật toán và kết quả được trình bày đúng với quá trình thực tế.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_p(doc, "", space_after=10)
    add_signatures(doc, gv_date="Xuân Đường, ngày 01 tháng 10 năm 2026", hs_date="Xuân Đường, ngày 28 tháng 09 năm 2026", bgh_date="Xuân Đường, ngày 07 tháng 10 năm 2026", gv_name="Hoàng Thành Đạt", hs_name="Hồ Ngọc Quỳnh Như", tcm_name="Hoàng Thành Đạt")

    # =========================================================================
    # PART 2: DỰ ÁN KỸ THUẬT
    # =========================================================================
    doc.add_page_break()
    
    add_p(doc, "(Dự án kỹ thuật)", align=WD_ALIGN_PARAGRAPH.CENTER, default_size=14)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "KẾ HOẠCH NGHIÊN CỨU KHOA HỌC KỸ THUẬT DÀNH CHO HỌC SINH THCS", align=WD_ALIGN_PARAGRAPH.CENTER, default_size=14)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "Năm học: 2026-2027", align=WD_ALIGN_PARAGRAPH.CENTER, default_size=14)
    doc.paragraphs[-1].runs[0].bold = True
    
    # PHẦN I
    add_p(doc, "PHẦN I. THÔNG TIN CHUNG VỀ ĐỀ TÀI", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Tên đề tài:** XÂY DỰNG NỀN TẢNG KẾT NỐI TRAO ĐỔI PHẾ PHẨM NÔNG NGHIỆP VÀ HỖ TRỢ ĐỊNH GIÁ NÔNG SẢN THEO ĐỘ TƯƠI", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "2. **Lĩnh vực dự thi:** 8: Công nghệ thông tin (Theo Thông tư 84/2026/TT-BGDĐT)", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "3. **Thông tin học sinh thực hiện:**", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_p(doc, "1. Học sinh thứ nhất:  **Hồ Ngọc Quỳnh Như**     ;  Lớp: **9/C3**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "2. Học sinh thứ hai (nếu có): Không có", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "3. Trường: **THCS Cẩm Đường**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "4. Giáo viên hướng dẫn:   **Hoàng Thành Đạt**     ;  TCM: **Khoa học tự nhiên – Công nghệ**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "4. **Thời gian và địa điểm nghiên cứu:**", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_p(doc, "- Thời gian bắt đầu: **Tháng 09/2026**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "- Thời gian kết thúc dự kiến: **Tháng 11/2026**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    add_p(doc, "- Địa điểm nghiên cứu: **Phân hiệu 2 – Trường THCS Cẩm Đường**", align=WD_ALIGN_PARAGRAPH.LEFT, left_indent=18)
    
    # PHẦN II
    add_p(doc, "II. VẤN ĐỀ CẦN GIẢI QUYẾT", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Mô tả vấn đề thực tiễn:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Sau các mùa gặt lúa và bẻ bắp tại xã Cẩm Đường, hàng chục tấn rơm rạ và thân ngô bị bỏ lại trên đồng ruộng. Nông dân không có phương tiện thông tin để kết nối với các hộ trồng nấm hoặc trại bò cách đó vài km. Kết quả là phụ phẩm bị đốt bỏ gây ô nhiễm bầu không khí và khói mù che khuất tầm nhìn đường liên xã.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Khi nông sản (cà chua, dưa hấu, xoài...) thu hoạch xong nhưng chưa bán hết trong ngày, bà con không biết phải định giá giảm bao nhiêu vào ngày thứ 2, ngày thứ 3 để thu hồi vốn mà không bị thương lái ép giá quá mức.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Đối tượng sử dụng sản phẩm: Nông dân lớn tuổi, ít am hiểu công nghệ, tay dính bùn đất khó gõ chữ, sử dụng điện thoại thông minh giá rẻ hoặc máy tính bảng cũ.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Giải pháp hiện có:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Các nhóm mạng xã hội (Zalo/Facebook): Bài viết dễ bị trôi tin sau vài phút; không định vị được khoảng cách địa lý; không có công cụ tính giá tự động.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Ứng dụng thương mại điện tử chuyên nghiệp: Đòi hỏi kết nối mạng 4G liên tục, thủ tục đăng ký tài khoản phức tạp, thu phí hoa hồng giao dịch cao, không phù hợp cho phụ phẩm nông nghiệp giá rẻ (0 đồng hoặc vài chục nghìn đồng/công rơm).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Vấn đề kỹ thuật đặt ra:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Xây dựng ứng dụng Web cài đặt được như ứng dụng di động (PWA), dung lượng siêu nhẹ (< 1.5 MB), hoạt động ngoại tuyến khi mất sóng Internet.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Tạo bộ tính toán định giá độ tươi dùng công thức số học chuẩn chống sai số tiền tệ.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Tích hợp bộ chuyển đổi giọng nói tiếng Việt mộc mạc sang dữ liệu tin đăng có cấu trúc 6 trường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Tối ưu hóa giao diện công thái học nông thôn (Rural Ergonomics): nút bấm tối thiểu 48x48px, chữ to tương phản cao ngoài trời nắng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Chi phí vận hành máy chủ 0 đồng, sử dụng cơ sở dữ liệu `node:sqlite` không cần cài đặt phần mềm bên thứ ba.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN III
    add_p(doc, "III. MỤC TIÊU THIẾT KẾ VÀ CHẾ TẠO", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Mục tiêu chung:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "Thiết kế, chế tạo và thử nghiệm phần mềm nền tảng số AgriCircle phục vụ trao đổi phụ phẩm nông nghiệp và định giá độ tươi nông sản, tối ưu hóa cho bà con nông dân và học sinh vùng nông thôn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_p(doc, "2. **Mục tiêu cụ thể:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Xác định bộ tiêu chí kỹ thuật: Nạp trang < 1.5s, dung lượng bundle < 1.5 MB, thời gian phản hồi API < 100ms, 100% không comment trong code để tối ưu byte truyền tải.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Lập sơ đồ kiến trúc hệ thống 3 tầng: Tầng dùng chung (Isomorphic Shared), Tầng máy chủ Node.js bản địa (Native Backend) và Tầng giao diện PWA (Frontend).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Lập trình và chế tạo nguyên mẫu phần mềm chạy ổn định trên máy tính và điện thoại.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Viết bộ kiểm thử tự động 54 kịch bản kiểm tra toàn diện mọi tính năng và trường hợp lỗi biên.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Thử nghiệm trên thiết bị thật tại Phân hiệu 2 – Trường THCS Cẩm Đường, thu thập dữ liệu và cải tiến giao diện.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN IV
    add_p(doc, "IV. CƠ SỞ KHOA HỌC VÀ THIẾT KẾ KỸ THUẬT", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Cơ sở khoa học và giải thuật:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Quy tắc tính giá khuyến nghị theo độ tươi (Toán lớp 6 & 7):*", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    p_eq2 = add_p(doc, "Giá khuyến nghị = Giá gốc × (1 - r · k · d)", align=WD_ALIGN_PARAGRAPH.CENTER)
    p_eq2.runs[0].bold = True
    p_eq2.runs[0].italic = True
    
    add_p(doc, "Sau đó ứng dụng tự động làm tròn kết quả đến hàng trăm đồng (ví dụ 14.400đ, 12.500đ) để người mua và người bán dễ dàng giao dịch tiền mặt ngoài đồng ruộng mà không bị lẻ vài chục đồng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=36)
    add_p(doc, "- *Đo khoảng cách vị trí bằng bản đồ số Leaflet (Tin học 8 & Địa lí 6):*", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "Sử dụng tọa độ GPS của người bán và người mua kết hợp hàm đo khoảng cách có sẵn của thư viện bản đồ Leaflet để xác định khoảng cách thực tế (theo đơn vị kilômét), phục vụ việc lọc tin đăng theo bán kính 1km, 3km, 5km cho xe ba gác và xe công nông.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=36)
    add_p(doc, "- *Bóc tách thông tin từ giọng nói tiếng Việt (Tin học 8):* Sử dụng các mẫu từ khóa quen thuộc của bà con nông dân để tự động nhận biết số lượng, đơn vị đo địa phương (công, sào, tấn, bao, cuộn), loại phụ phẩm và địa danh thôn ấp (Cẩm Đường, Bình Sơn...).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Phương án thiết kế:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Lựa chọn phương án Single Page Application (SPA) viết bằng JavaScript thuần (Vanilla JS) kết hợp Service Worker thay vì dùng các framework nặng như React hay Angular.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Lý do lựa chọn:* Giảm dung lượng tải về từ hơn 2 MB xuống chỉ còn 400 KB; không cần bước build phức tạp, giúp học sinh dễ dàng làm chủ mã nguồn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Sơ đồ kiến trúc kỹ thuật & Giao diện người dùng:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    arch_lines = [
        "┌────────────────────────────────────────────────────────┐",
        "│              Trình duyệt Di Động PWA                   │",
        "│       (Giao diện công thái học 5 màn hình chính)       │",
        "└──────────────┬─────────────────────────┬───────────────┘",
        "               │                         │",
        "   (Nếu Offline)                         │ (Khi Online)",
        "               ▼                         ▼",
        "┌──────────────────────────────┐ ┌───────────────────────────────┐",
        "│ Service Worker (sw.js)       │ │ HTTP Fetch API                │",
        "│ Bộ nhớ đệm Cache-First       │ │ Trao đổi dữ liệu JSON         │",
        "└──────────────────────────────┘ └──────────────┬────────────────┘",
        "                                                ▼",
        "                                 ┌───────────────────────────────┐",
        "                                 │ Máy chủ Node.js (node:http)   │",
        "                                 │ Routing API không framework   │",
        "                                 └──────────────┬────────────────┘",
        "                                                ▼",
        "                                 ┌───────────────────────────────┐",
        "                                 │ Cơ sở dữ liệu SQLite (WAL)    │",
        "                                 │ Lưu trữ tin đăng, giá, CO2    │",
        "                                 └───────────────────────────────┘"
    ]
    for aline in arch_lines:
        p_arch = add_p(doc, aline, align=WD_ALIGN_PARAGRAPH.CENTER, default_size=10.5)
        p_arch.runs[0].font.name = 'Courier New'
        
    # Embed Figure 4 (Giao diện AgriCircle)
    add_figure(doc, 'docs/images/hinh4_giao_dien_agricircle.png',
               "Hình 4: Giao diện nền tảng PWA AgriCircle thực tế trên điện thoại di động: Bản đồ phụ phẩm, Máy tính độ tươi và Đăng tin giọng nói.",
               "Nguồn: Ảnh chụp từ phần mềm AgriCircle do nhóm học sinh thiết kế và thử nghiệm, 10/2026")
    
    add_p(doc, "4. **Các yêu cầu kỹ thuật đo lường được:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Dung lượng toàn bộ mã nguồn giao diện (HTML + CSS + JS + Icons): ≤ 1.5 MB (Đạt thực tế: **400 KB**).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Số lượng ca kiểm thử tự động đạt chuẩn: 100% vượt qua (Đạt: **54/54 tests pass**).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Thời gian thực thi phép tính giá trên máy: ≤ 5 ms (Đạt: **0.1 ms**).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Tương thích kích thước màn hình: Từ **360 px** đến **1920 px** không bị tràn chiều ngang.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN V
    add_p(doc, "V. VẬT LIỆU, THIẾT BỊ VÀ PHƯƠNG PHÁP THỰC HIỆN", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Vật liệu, linh kiện phần cứng:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- 01 Máy tính xách tay cấu hình phổ thông (CPU Intel Core i3, RAM 8GB) dùng làm máy chủ phát triển và kiểm thử.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- 03 Điện thoại thông minh chạy hệ điều hành Android (phiên bản Android 9, 11, 13) dùng thử nghiệm thực địa.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- 01 Thiết bị phát Wi-Fi nội bộ không cần kết nối Internet để thử nghiệm tính năng mạng LAN cục bộ.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Thiết bị, dụng cụ đo đạc:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Cân đồng hồ 100 kg để đo khối lượng rơm thực tế.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Thước dây cuộn 50m để đo diện tích ruộng mẫu tại Cẩm Đường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Phần mềm và công cụ hỗ trợ:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Môi trường thực thi: Node.js v22 LTS (Native SQLite, Native HTTP).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Trình soạn thảo mã nguồn: Visual Studio Code.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Thư viện bản đồ nguồn mở: Leaflet v1.9.4.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Công cụ gỡ lỗi: Chrome DevTools.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "4. **Phương pháp thiết kế & quy trình chế tạo:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Áp dụng phương pháp Phát triển theo lát cắt mỏng (Thin Slices): Làm đến đâu viết kiểm thử tự động kiểm chứng đến đó.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Quy trình thực hiện qua 6 giai đoạn rõ ràng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN VI
    add_p(doc, "VI. QUY TRÌNH THỰC HIỆN DỰ ÁN", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    stages = [
        "1. **Giai đoạn 1. Khảo sát và xác định yêu cầu (Tuần 1 - 2):** Khảo sát nhu cầu của bà con xã Cẩm Đường; xác định 10 loại cây trồng chủ lực và 6 loại phụ phẩm; chốt tài liệu yêu cầu `PRD.md`.",
        "2. **Giai đoạn 2. Thiết kế giải pháp kỹ thuật (Tuần 3 - 4):** Xây dựng công thức toán học độ tươi; thiết kế cấu trúc bảng dữ liệu SQLite; chọn bảng màu xanh đồng nội tương phản cao đạt chuẩn WCAG.",
        "3. **Giai đoạn 3. Chế tạo nguyên mẫu phần mềm (Tuần 5 - 8):** Xây dựng thư viện dùng chung `src/shared/`; Lập trình máy chủ Node.js và hệ cơ sở dữ liệu `src/server/`; Lập trình giao diện PWA 5 tab `public/`.",
        "4. **Giai đoạn 4. Thử nghiệm phần mềm trong phòng máy (Tuần 9):** Chạy 54 ca kiểm thử tự động, thử nghiệm ngắt kết nối mạng để kiểm tra chế độ chạy Offline của Service Worker.",
        "5. **Giai đoạn 5. Thử nghiệm thực địa và cải tiến (Tuần 10 - 11):** Mang điện thoại ra ruộng tại Cẩm Đường thử nghiệm với nông dân; phát hiện và khắc phục các vấn đề nút bấm, độ nhạy micro và luồng đồng bộ dữ liệu.",
        "6. **Giai đoạn 6. Hoàn thiện sản phẩm và đóng gói hồ sơ (Tuần 12):** Kiểm tra toàn diện quy tắc không comment; xuất bản tài liệu hướng dẫn kỹ thuật `docs/03-thcs-technical-guide.md` và hoàn tất hồ sơ dự thi KHKT."
    ]
    for s_text in stages:
        add_p(doc, s_text, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
        
    # PHẦN VII
    add_p(doc, "VII. KẾ HOẠCH THỬ NGHIỆM VÀ ĐÁNH GIÁ", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Mục đích thử nghiệm:** Xác minh độ ổn định, độ chính xác của thuật toán tính giá và khả năng vận hành ngoại tuyến của ứng dụng trong môi trường thực tế tại nông thôn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "2. **Điều kiện thử nghiệm:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Môi trường phòng thí nghiệm: Máy tính kiểm thử Node.js v22 trên hệ điều hành Windows 11.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Môi trường thực địa: Ruộng lúa, vườn bắp tại xã Cẩm Đường dưới ánh nắng ban ngày (32°C - 35°C), kết nối 3G yếu hoặc hoàn toàn ngắt mạng (Offline).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "3. **Các tiêu chí đánh giá:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Tỷ lệ vượt qua các ca kiểm thử tự động (yêu cầu: 100%).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Dung lượng bộ nhớ cache PWA (yêu cầu: < 1.5 MB).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Độ chính xác bóc tách giọng nói tiếng Việt (yêu cầu: > 80%).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Thời gian đáp ứng của công cụ tính giá khi không có mạng (yêu cầu: < 50 ms).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "4. **Số lần thử nghiệm dự kiến:** Tối thiểu 50 lượt kiểm thử tự động bằng lệnh `npm test` và 30 lượt thử nghiệm thực tế với người dùng thật.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    # Embed Figure 6
    add_figure(doc, 'docs/images/hinh6_nhat_ky_thu_nghiem.png',
               "Hình 6: Nhật ký thử nghiệm thực địa và kết quả đo đạc nền tảng AgriCircle tại Phân hiệu 2 – Trường THCS Cẩm Đường.",
               "Nguồn: Trích lục Nhật ký nghiên cứu của học sinh Hồ Ngọc Quỳnh Như và GVHD Hoàng Thành Đạt, 10/2026")
    
    # PHẦN VIII
    add_p(doc, "VIII. DỰ KIẾN KẾT QUẢ", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "1. **Sản phẩm hoàn thành:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Nền tảng PWA AgriCircle chạy mượt mà trên trình duyệt web điện thoại và máy tính.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- 01 máy chủ cục bộ Node.js siêu nhẹ tiêu thụ dưới 30 MB RAM.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- 01 cơ sở dữ liệu SQLite lưu trữ dữ liệu giao dịch phụ phẩm và thống kê giảm phát thải $CO_2$.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "2. **Các chức năng đáp ứng yêu cầu:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Định giá nhanh chóng nông sản theo độ tươi và dự báo biến động giá 3 ngày kế tiếp.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Đăng tin phụ phẩm bằng một câu nói tiếng Việt tự nhiên.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Bản đồ bán kính tìm kiếm phụ phẩm quanh vị trí hiện tại.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Xác nhận giao dịch thu gom bằng mã bí mật 4 chữ số an toàn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "3. **Chi phí chế tạo & vận hành:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- Chi phí phần mềm và máy chủ: **0 VNĐ** (sử dụng 100% công nghệ nguồn mở miễn phí).", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- Tận dụng thiết bị điện thoại thông minh sẵn có của học sinh và gia đình.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "4. **Hạn chế và hướng phát triển:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "- *Hạn chế:* Giọng nói tiếng Việt phụ thuộc vào bộ Web Speech API của trình duyệt Chrome/Android.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "- *Hướng phát triển:* Tích hợp thêm cảm biến đo độ ngọt (Brix) và kết nối với máy in phiếu cân di động qua Bluetooth cho các vựa thu mua nông sản.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN IX
    add_p(doc, "IX. TIẾN ĐỘ THỰC HIỆN", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    headers_t4 = ["STT", "Công việc", "Thời gian", "Sản phẩm minh chứng"]
    rows_t4 = [
        ["1", "Khảo sát vấn đề thực tiễn tại Cẩm Đường, tìm hiểu tài liệu", "Tuần 1", "Báo cáo khảo sát, danh mục phụ phẩm"],
        ["2", "Xác định yêu cầu kỹ thuật và các tiêu chí đo lường", "Tuần 2", "Tài liệu PRD.md, RULES.md"],
        ["3", "Thiết kế kiến trúc hệ thống, sơ đồ dữ liệu và giao diện", "Tuần 3–4", "Tài liệu ARCHITECTURE.md, DESIGN.md"],
        ["4", "Lập trình nguyên mẫu Slice 1 (Công thức tính giá & Đăng tin giọng nói)", "Tuần 5–6", "Nguyên mẫu lần 1, 16 test pass"],
        ["5", "Lập trình nguyên mẫu Slice 2 & 3 (Máy chủ SQLite & Giao diện PWA)", "Tuần 7–8", "Nguyên mẫu lần 2, 48 test pass"],
        ["6", "Thử nghiệm ngoại tuyến, tối ưu hóa kích thước bundle", "Tuần 9–10", "Bảng số liệu kiểm thử, bundle 400 KB"],
        ["7", "Đánh giá thực nghiệm với 20 nông dân tại Cẩm Đường", "Tuần 11", "Sản phẩm hoàn chỉnh, 54/54 test pass"],
        ["8", "Viết báo cáo khoa học kỹ thuật, thiết kế Poster A0 dự thi", "Tuần 12", "Hồ sơ KHKT đầy đủ, sẵn sàng dự thi"]
    ]
    widths_t4 = [Pt(40), Pt(210), Pt(80), Pt(170)]
    aligns_t4 = [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT]
    add_table(doc, headers_t4, rows_t4, col_widths=widths_t4, alignments=aligns_t4)
    
    # PHẦN X
    add_p(doc, "X. PHÂN CÔNG NHIỆM VỤ", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "- **Học sinh Hồ Ngọc Quỳnh Như:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "+ Thực hiện khảo sát thực tế bà con nông dân tại xã Cẩm Đường.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "+ Phác thảo giao diện người dùng theo phong cách nông thôn tương phản cao.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "+ Tham gia kiểm thử phần mềm trên điện thoại Android, thu thập phản hồi của người dùng.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "+ Soạn thảo báo cáo nghiên cứu và chuẩn bị bài thuyết trình dự thi.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    add_p(doc, "- **Giáo viên hướng dẫn Hoàng Thành Đạt:**", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_p(doc, "+ Định hướng giải pháp kỹ thuật và tư vấn công thức định giá nông sản và xử lý dữ liệu.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "+ Giám sát an toàn thông tin, bảo mật mã PIN và kiểm tra chất lượng mã nguồn.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    add_p(doc, "+ Theo dõi tiến độ thực hiện 12 tuần và đôn đốc hoàn thiện sản phẩm.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, left_indent=18)
    
    # PHẦN XI
    add_p(doc, "XI. CAM KẾT VÀ PHÊ DUYỆT", align=WD_ALIGN_PARAGRAPH.LEFT)
    doc.paragraphs[-1].runs[0].bold = True
    
    add_p(doc, "Học sinh và giáo viên hướng dẫn cam kết trực tiếp thực hiện dự án, ghi chép trung thực toàn bộ quá trình nghiên cứu, lưu giữ đầy đủ mã nguồn và dữ liệu gốc; tuân thủ quy định về an toàn thông tin và đạo đức nghiên cứu khoa học kỹ thuật dành cho học sinh trung học.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    
    add_p(doc, "", space_after=10)
    add_signatures(doc, gv_date="Xuân Đường, ngày 01 tháng 10 năm 2026", hs_date="Xuân Đường, ngày 28 tháng 09 năm 2026", bgh_date="Xuân Đường, ngày 07 tháng 10 năm 2026", gv_name="Hoàng Thành Đạt", hs_name="Hồ Ngọc Quỳnh Như", tcm_name="Hoàng Thành Đạt")
    
    # Save files with safe fallback for file lock
    destinations = [
        r"D:\Work\CODE\khkt\docs\04-ke-hoach-nghien-cuu-khkt.docx",
        r"D:\Work\CODE\khkt\docs\04-ke-hoach-nghien-cuu-khkt_capnhat.docx",
        r"C:\Users\XIAOXIN\Downloads\2027 - Phụ lục 0 - Học sinh (Kế hoạch nghiên cứu KHKT AgriCircle).docx"
    ]
    
    for path in destinations:
        try:
            doc.save(path)
            print(f"Successfully saved: {path}")
        except PermissionError:
            print(f"File locked by Word, saving copy as alternative for: {path}")
            alt_path = path.replace(".docx", "_moinhat.docx")
            doc.save(alt_path)
            print(f"Saved alternative: {alt_path}")
        except Exception as e:
            print(f"Error saving to {path}: {e}")

if __name__ == '__main__':
    build_full_docx()
