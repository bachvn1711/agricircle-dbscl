const FORMULA_LEAD_REGEX = /^[=+\-@\t\r]/;
const FORMULA_AFTER_NEWLINE_REGEX = /([\r\n])(?=[=+\-@\t\r])/g;

export function maskPhone(phone) {
  if (typeof phone !== 'string') {
    return '***';
  }
  const trimmed = phone.trim();
  if (trimmed.length < 7) {
    return '***';
  }
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-4)}`;
}

export function neutralizeFormula(text) {
  let safe = text.replace(FORMULA_AFTER_NEWLINE_REGEX, "$1'");
  if (FORMULA_LEAD_REGEX.test(safe)) {
    safe = `'${safe}`;
  }
  return safe;
}

export function escapeCsvCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  const raw =
    typeof value === 'string'
      ? value
      : (typeof value === 'number' || typeof value === 'boolean' ? `${value}` : '');
  const safe = neutralizeFormula(raw);
  return `"${safe.replace(/"/g, '""')}"`;
}

function formatTimestamp(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) {
    return '';
  }
  return new Date(ms).toISOString();
}

export function buildListingsCsv(rows, impact) {
  const headers = [
    'ID',
    'Nhóm phụ phẩm',
    'Hình thức',
    'Ghi chú giá',
    'Số lượng',
    'Đơn vị',
    'Khối lượng ước tính (kg)',
    'Vĩ độ',
    'Kinh độ',
    'Ghi chú địa điểm',
    'Người liên hệ',
    'SĐT (đã che)',
    'Đăng hộ',
    'Câu nói gốc',
    'Trạng thái',
    'Số lượt báo cáo',
    'Thời gian đăng',
    'Thời gian hết hạn',
    'Thời gian thu gom',
    'Khối lượng thu gom thực tế (kg)'
  ];

  const lines = [headers.map(escapeCsvCell).join(',')];

  for (const row of rows) {
    const cells = [
      row.id,
      row.category,
      row.offer_type,
      row.price_note,
      row.raw_quantity,
      row.raw_unit,
      row.estimated_kg,
      row.lat,
      row.lng,
      row.location_note,
      row.contact_name,
      maskPhone(row.contact_phone),
      row.is_proxy_post ? 'Có' : 'Không',
      row.raw_voice_text,
      row.status,
      row.report_count,
      formatTimestamp(row.created_at),
      formatTimestamp(row.expires_at),
      formatTimestamp(row.collected_at),
      row.actual_kg_collected ?? ''
    ];
    lines.push(cells.map(escapeCsvCell).join(','));
  }

  lines.push('');
  lines.push(
    [
      'Tổng hợp tác động',
      'Tổng số tin',
      'Tin đang mở',
      'Tin đã thu gom',
      'Tổng khối lượng cứu được (kg)',
      'Ước tính CO2 tránh phát thải (kg)',
      'Tổng lượt tính giá'
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  lines.push(
    [
      'TỔNG CỘNG',
      impact.totalListings,
      impact.activeListings,
      impact.collectedListings,
      impact.totalKgDiverted,
      impact.estimatedCo2SavedKg,
      impact.totalPriceCalculations
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return lines.join('\r\n');
}
