import { BYPRODUCT_CATEGORIES, getByproductCategoryById } from '/shared/crops.js';
import { isValidCoordinates } from '/shared/geo.js';
import { UNITS, convertToKg } from '/shared/units.js';
import { validateCreateListing } from '/shared/validation.js';
import { VOICE_TEXT_MAX_CODEPOINTS, parseVoiceInput } from '/shared/voice-parser.js';
import { createListing } from './api.js';
import { attachLeafletTileLayers } from './map-view.js';
import {
  clearPendingPost,
  createEl,
  formatViNumber,
  generateClientRequestId,
  getBrowserStorage,
  getShortCodeReceipts,
  parseStrictInt,
  parseStrictNumber,
  readFarmerProfile,
  readPendingPost,
  saveFarmerProfile,
  savePendingPost,
  saveShortCodeReceipt
} from './state.js';

const EXPIRY_DAY_OPTIONS = [1, 2, 3, 7, 14];

export function createPostFormView({
  container,
  getRegion,
  onListingCreated,
  onNavigateMap
}) {
  const storage = getBrowserStorage();
  const initialRegion = getRegion();
  const savedProfile = readFarmerProfile(storage);
  const existingDraft = readPendingPost(storage);

  let state = {
    clientRequestId: existingDraft?.clientRequestId || generateClientRequestId('post'),
    category: existingDraft?.category || 'rom-ra',
    rawQuantityText: existingDraft?.rawQuantity !== undefined && existingDraft?.rawQuantity !== null
      ? String(existingDraft.rawQuantity)
      : '2',
    rawUnit: existingDraft?.rawUnit || initialRegion.defaultUnit,
    offerType: existingDraft?.offerType === 'sell' ? 'sell' : 'free',
    priceNote: existingDraft?.priceNote || '',
    expiryDays: EXPIRY_DAY_OPTIONS.includes(existingDraft?.expiryDays) ? existingDraft.expiryDays : 3,
    lat: isValidCoordinates(existingDraft?.lat, existingDraft?.lng) ? existingDraft.lat : initialRegion.center[0],
    lng: isValidCoordinates(existingDraft?.lat, existingDraft?.lng) ? existingDraft.lng : initialRegion.center[1],
    locationNote: existingDraft?.locationNote || '',
    contactName: existingDraft?.contactName || savedProfile.contactName || '',
    contactPhone: existingDraft?.contactPhone || savedProfile.contactPhone || '',
    isProxyPost: Boolean(existingDraft?.isProxyPost),
    rawVoiceText: existingDraft?.rawVoiceText || ''
  };

  let pinTouchedByUser = isValidCoordinates(existingDraft?.lat, existingDraft?.lng);
  let unitTouchedByUser = Boolean(existingDraft?.rawUnit);
  let gpsSeq = 0;
  let gpsAutoRequested = false;
  let isSubmitting = false;
  let latestVoiceTranscript = '';
  let recognition = null;
  let recognitionTimer = null;
  let isListening = false;
  let mounted = false;
  let miniMap = null;
  let pinMarker = null;
  let tileControl = null;
  let miniLayerMode = 'street';

  const headerBlock = createEl('div', { className: 'screen-header' },
    createEl('h1', { id: 'heading-post', className: 'screen-title', text: 'Đăng tin phụ phẩm nhanh' }),
    createEl('p', {
      className: 'screen-lead',
      text: 'Làm sao đăng nhanh phụ phẩm lên bản đồ dưới 45 giây?'
    })
  );

  const receiptCard = createEl('div', { id: 'post-receipt-card', className: 'surface-block notice-green', attrs: { hidden: true, role: 'status' } });

  const btnVoice = createEl('button', {
    type: 'button',
    className: 'btn btn-voice',
    text: '🎙️ Bấm để nói tiếng Việt'
  });
  const micNotice = createEl('div', { id: 'post-mic-notice', className: 'notice-box notice-amber', attrs: { hidden: true } });
  const voiceTextarea = createEl('textarea', {
    id: 'post-voice-textarea',
    className: 'textarea-input',
    attrs: {
      maxlength: String(VOICE_TEXT_MAX_CODEPOINTS),
      placeholder: 'Ví dụ: Tôi có 2 công rơm rạ ở gần đình làng, cho không, cần dọn trong 2 ngày'
    }
  });
  voiceTextarea.value = state.rawVoiceText;
  const btnParseVoice = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary',
    text: 'Phân tích câu nói'
  });
  const parseNotice = createEl('div', { id: 'post-parse-notice', className: 'notice-box notice-green', attrs: { hidden: true } });

  const voiceSection = createEl('div', { className: 'surface-block' },
    createEl('h2', { className: 'section-heading', text: '1. Nói hoặc gõ mô tả phụ phẩm' }),
    btnVoice,
    createEl('div', { className: 'field-group' },
      createEl('label', {
        className: 'field-label',
        text: 'Nội dung vừa nghe hoặc gõ để chỉnh sửa',
        attrs: { for: 'post-voice-textarea' }
      }),
      voiceTextarea
    ),
    micNotice,
    createEl('div', { className: 'row-inline' }, btnParseVoice),
    parseNotice
  );

  const categoryGrid = createEl('div', { className: 'category-grid' });
  const categoryButtons = new Map();
  for (const cat of BYPRODUCT_CATEGORIES) {
    const tileBtn = createEl('button', {
      type: 'button',
      className: 'choice-tile',
      attrs: { 'aria-pressed': state.category === cat.id ? 'true' : 'false' },
      onClick: () => {
        state.category = cat.id;
        syncCategoryButtons();
        updateLiveKg();
        persistDraft();
      }
    },
      createEl('span', { text: cat.icon }),
      createEl('span', { text: cat.name })
    );
    categoryButtons.set(cat.id, tileBtn);
    categoryGrid.appendChild(tileBtn);
  }

  const quantityInput = createEl('input', {
    id: 'post-quantity-input',
    className: 'text-input',
    type: 'text',
    attrs: { inputmode: 'decimal', placeholder: 'VD: 2 hoặc 2,5' }
  });
  quantityInput.value = state.rawQuantityText;

  const unitSelect = createEl('select', {
    id: 'post-unit-select',
    className: 'select-input'
  });
  for (const unit of UNITS) {
    unitSelect.appendChild(createEl('option', {
      text: unit.name,
      attrs: { value: unit.id }
    }));
  }
  unitSelect.value = state.rawUnit;

  const liveKgNotice = createEl('p', { id: 'post-live-kg', className: 'notice-box notice-green' });

  const btnOfferFree = createEl('button', {
    type: 'button',
    className: 'seg-btn',
    text: 'Cho miễn phí (chỉ cần dọn)',
    onClick: () => {
      state.offerType = 'free';
      syncOfferButtons();
      persistDraft();
    }
  });
  const btnOfferSell = createEl('button', {
    type: 'button',
    className: 'seg-btn',
    text: 'Bán giá rẻ',
    onClick: () => {
      state.offerType = 'sell';
      syncOfferButtons();
      persistDraft();
    }
  });

  const priceNoteInput = createEl('input', {
    id: 'post-price-note',
    className: 'text-input',
    type: 'text',
    attrs: { maxlength: '160', placeholder: 'Ví dụ: 5.000 đ/kg hoặc thương lượng tại ruộng' }
  });
  priceNoteInput.value = state.priceNote;

  const expiryRow = createEl('div', { className: 'chip-row' });
  const expiryButtons = new Map();
  for (const days of EXPIRY_DAY_OPTIONS) {
    const chip = createEl('button', {
      type: 'button',
      className: 'chip-btn',
      text: `${days} ngày`,
      onClick: () => {
        state.expiryDays = days;
        syncExpiryButtons();
        persistDraft();
      }
    });
    expiryButtons.set(days, chip);
    expiryRow.appendChild(chip);
  }

  const categoryAndQtySection = createEl('div', { className: 'surface-block' },
    createEl('h2', { className: 'section-heading', text: '2. Kiểm tra loại phụ phẩm và số lượng' }),
    createEl('div', { className: 'field-group' },
      createEl('span', { className: 'field-label', text: 'Chọn nhanh 1 trong 6 nhóm phụ phẩm' }),
      categoryGrid
    ),
    createEl('div', { className: 'filter-grid' },
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Số lượng', attrs: { for: 'post-quantity-input' } }),
        quantityInput
      ),
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Đơn vị địa phương', attrs: { for: 'post-unit-select' } }),
        unitSelect
      )
    ),
    liveKgNotice,
    createEl('div', { className: 'field-group' },
      createEl('span', { className: 'field-label', text: 'Hình thức trao đổi' }),
      createEl('div', { className: 'segmented-row' }, btnOfferFree, btnOfferSell)
    ),
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Ghi chú giá hoặc điều kiện (tùy chọn)', attrs: { for: 'post-price-note' } }),
      priceNoteInput
    ),
    createEl('div', { className: 'field-group' },
      createEl('span', { className: 'field-label', text: 'Hạn cần dọn' }),
      expiryRow
    )
  );

  const btnGetGps = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary',
    text: 'Lấy vị trí GPS hiện tại',
    onClick: () => requestGps(true)
  });
  const btnMiniLayer = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary',
    text: 'Ảnh vệ tinh',
    onClick: () => {
      if (!miniMap || !tileControl) {
        return;
      }
      if (miniLayerMode === 'street') {
        miniMap.removeLayer(tileControl.street);
        tileControl.satellite.addTo(miniMap);
        miniLayerMode = 'satellite';
        btnMiniLayer.textContent = 'Bản đồ đường';
      } else {
        miniMap.removeLayer(tileControl.satellite);
        tileControl.street.addTo(miniMap);
        miniLayerMode = 'street';
        btnMiniLayer.textContent = 'Ảnh vệ tinh';
      }
    }
  });
  const communeFallbackSelect = createEl('select', {
    id: 'post-commune-select',
    className: 'select-input',
    attrs: { 'aria-label': 'Chọn nhanh xã hoặc phường nếu không dùng GPS' }
  });
  const miniMapEl = createEl('div', { id: 'post-pin-map', className: 'mini-map-canvas', attrs: { 'aria-label': 'Kéo ghim chọn vị trí ruộng hoặc vườn' } });
  const pinStatusEl = createEl('p', { className: 'field-hint' });
  const pinTileNotice = createEl('div', {
    className: 'notice-box notice-amber',
    text: 'Bản đồ nền ngoại tuyến chưa hiển thị ảnh đường, bà con vẫn có thể chọn xã/phường hoặc giữ tọa độ hiện tại.',
    attrs: { hidden: true }
  });
  const locationNoteInput = createEl('input', {
    id: 'post-location-note',
    className: 'text-input',
    type: 'text',
    attrs: { maxlength: '200', placeholder: 'Ví dụ: Gần đình làng, đầu cầu kênh 3' }
  });
  locationNoteInput.value = state.locationNote;

  const locationSection = createEl('div', { className: 'surface-block' },
    createEl('h2', { className: 'section-heading', text: '3. Vị trí có phụ phẩm' }),
    createEl('div', { className: 'map-toolbar' }, btnGetGps, btnMiniLayer),
    createEl('div', { className: 'field-group' },
      createEl('label', {
        className: 'field-label',
        text: 'Hoặc chọn nhanh xã / phường gần nhất',
        attrs: { for: 'post-commune-select' }
      }),
      communeFallbackSelect
    ),
    pinTileNotice,
    miniMapEl,
    pinStatusEl,
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Mốc địa điểm dễ tìm', attrs: { for: 'post-location-note' } }),
      locationNoteInput
    )
  );

  const proxyCheckbox = createEl('input', {
    id: 'post-proxy-checkbox',
    type: 'checkbox'
  });
  proxyCheckbox.checked = state.isProxyPost;
  const proxyLabel = createEl('label', { className: 'check-row', attrs: { for: 'post-proxy-checkbox' } },
    proxyCheckbox,
    createEl('span', { text: 'Đăng giúp hộ khác (giữ nguyên thông tin cá nhân của tôi trên máy)' })
  );
  const contactNameInput = createEl('input', {
    id: 'post-contact-name',
    className: 'text-input',
    type: 'text',
    attrs: { maxlength: '80', autocomplete: 'name', placeholder: 'Ví dụ: Chú Ba hoặc Hộ cô Tư' }
  });
  contactNameInput.value = state.contactName;
  const contactPhoneInput = createEl('input', {
    id: 'post-contact-phone',
    className: 'text-input',
    type: 'tel',
    attrs: { maxlength: '10', inputmode: 'numeric', autocomplete: 'tel', placeholder: '10 số bắt đầu bằng 0 (VD: 0912345678)' }
  });
  contactPhoneInput.value = state.contactPhone;

  const contactSection = createEl('div', { className: 'surface-block' },
    createEl('h2', { className: 'section-heading', text: '4. Người liên hệ thu gom' }),
    proxyLabel,
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Tên người liên hệ', attrs: { for: 'post-contact-name' } }),
      contactNameInput
    ),
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Số điện thoại (10 chữ số VN)', attrs: { for: 'post-contact-phone' } }),
      contactPhoneInput
    )
  );

  const offlineSubmitNotice = createEl('div', {
    className: 'notice-box notice-amber',
    text: 'Đang mất kết nối mạng. Bản nháp đã được giữ an toàn trên máy, khi có mạng lại hãy bấm Đăng tin lên bản đồ.',
    attrs: { hidden: true }
  });
  const submitErrorNotice = createEl('div', { className: 'notice-box notice-red', attrs: { hidden: true, role: 'alert' } });
  const submitBtn = createEl('button', {
    type: 'submit',
    className: 'btn btn-primary',
    text: 'Đăng tin lên bản đồ'
  });

  const formEl = createEl('form', {},
    voiceSection,
    categoryAndQtySection,
    locationSection,
    contactSection,
    offlineSubmitNotice,
    submitErrorNotice,
    submitBtn
  );

  const vaultDetails = createEl('details', { className: 'details-block' });
  const vaultSummary = createEl('summary', { text: 'Mã xác nhận các tin đã đăng trên máy (0)' });
  const vaultBody = createEl('div', { className: 'divider-list' });
  vaultDetails.append(vaultSummary, vaultBody);

  container.append(headerBlock, receiptCard, formEl, vaultDetails);

  function persistDraft() {
    const parsedQty = parseStrictNumber(quantityInput.value);
    savePendingPost(storage, {
      clientRequestId: state.clientRequestId,
      category: state.category,
      rawQuantity: parsedQty !== null ? parsedQty : quantityInput.value,
      rawUnit: state.rawUnit,
      offerType: state.offerType,
      priceNote: state.priceNote,
      locationNote: state.locationNote,
      contactName: state.contactName,
      contactPhone: state.contactPhone,
      isProxyPost: state.isProxyPost,
      rawVoiceText: state.rawVoiceText,
      lat: state.lat,
      lng: state.lng,
      expiryDays: state.expiryDays
    });
  }

  function syncCategoryButtons() {
    for (const [id, btn] of categoryButtons.entries()) {
      const selected = id === state.category;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    }
  }

  function syncOfferButtons() {
    btnOfferFree.classList.toggle('is-active', state.offerType === 'free');
    btnOfferFree.setAttribute('aria-pressed', state.offerType === 'free' ? 'true' : 'false');
    btnOfferSell.classList.toggle('is-active', state.offerType === 'sell');
    btnOfferSell.setAttribute('aria-pressed', state.offerType === 'sell' ? 'true' : 'false');
  }

  function syncExpiryButtons() {
    for (const [days, btn] of expiryButtons.entries()) {
      const selected = days === state.expiryDays;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    }
  }

  function updateLiveKg() {
    const qty = parseStrictNumber(quantityInput.value);
    if (qty === null || qty <= 0) {
      liveKgNotice.className = 'notice-box notice-amber';
      liveKgNotice.textContent = 'Nhập số lượng lớn hơn 0 để ước tính khối lượng (kg).';
      return;
    }
    const kg = convertToKg({
      category: state.category,
      rawQuantity: qty,
      rawUnit: state.rawUnit
    });
    liveKgNotice.className = 'notice-box notice-green';
    liveKgNotice.textContent = `Ước tính quy đổi: khoảng ${formatViNumber(kg, 1)} kg`;
  }

  function syncCommuneOptions() {
    const region = getRegion();
    communeFallbackSelect.replaceChildren();
    communeFallbackSelect.appendChild(createEl('option', {
      text: `Chọn xã / phường tại ${region.shortName}`,
      attrs: { value: '' }
    }));
    region.communes.forEach((commune, idx) => {
      communeFallbackSelect.appendChild(createEl('option', {
        text: commune.name,
        attrs: { value: String(idx) }
      }));
    });
  }

  function updatePinDisplay(lat, lng, reasonText) {
    state.lat = lat;
    state.lng = lng;
    if (pinMarker && miniMap) {
      pinMarker.setLatLng([lat, lng]);
      miniMap.panTo([lat, lng]);
    }
    const coordsText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    pinStatusEl.textContent = reasonText
      ? `${reasonText} (Ghim tại ${coordsText})`
      : `Ghim hiện tại: ${coordsText}. Kéo ghim hoặc chạm bản đồ để chỉnh vị trí.`;
  }

  function ensureMiniMap() {
    if (miniMap || !globalThis.L) {
      return;
    }
    const L = globalThis.L;
    miniMap = L.map(miniMapEl).setView([state.lat, state.lng], 13);
    tileControl = attachLeafletTileLayers(L, miniMap, (isOff) => {
      pinTileNotice.hidden = !isOff;
    });
    pinMarker = L.marker([state.lat, state.lng], { draggable: true }).addTo(miniMap);
    pinMarker.on('dragstart', () => {
      pinTouchedByUser = true;
    });
    pinMarker.on('dragend', () => {
      pinTouchedByUser = true;
      const pos = pinMarker.getLatLng();
      updatePinDisplay(pos.lat, pos.lng, 'Đã cập nhật vị trí kéo ghim');
      persistDraft();
    });
    miniMap.on('click', (ev) => {
      pinTouchedByUser = true;
      updatePinDisplay(ev.latlng.lat, ev.latlng.lng, 'Đã chọn điểm trên bản đồ');
      persistDraft();
    });
    if (!globalThis.navigator?.onLine) {
      pinTileNotice.hidden = false;
    }
  }

  function requestGps(explicitByUser) {
    if (explicitByUser) {
      pinTouchedByUser = false;
    }
    if (!globalThis.navigator?.geolocation) {
      updatePinDisplay(state.lat, state.lng, 'Thiết bị không hỗ trợ GPS, vui lòng chọn xã/phường hoặc kéo ghim');
      return;
    }
    const currentSeq = ++gpsSeq;
    pinStatusEl.textContent = 'Đang dò vị trí GPS (tối đa 8 giây)...';
    globalThis.navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (currentSeq !== gpsSeq || pinTouchedByUser) {
          return;
        }
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isValidCoordinates(lat, lng)) {
          return;
        }
        updatePinDisplay(lat, lng, 'Đã lấy tọa độ GPS hiện tại');
        persistDraft();
      },
      () => {
        if (currentSeq !== gpsSeq || pinTouchedByUser) {
          return;
        }
        updatePinDisplay(state.lat, state.lng, 'GPS không phản hồi, hãy chọn xã/phường hoặc kéo ghim');
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  }

  function applyParsedVoice(text) {
    const parsed = parseVoiceInput(text, { regionId: getRegion().id });
    state.rawVoiceText = parsed.truncatedText;
    if (voiceTextarea.value !== parsed.truncatedText) {
      voiceTextarea.value = parsed.truncatedText;
    }
    state.category = parsed.category;
    if (parsed.rawQuantity !== null) {
      state.rawQuantityText = String(parsed.rawQuantity);
      quantityInput.value = state.rawQuantityText;
    }
    if (parsed.rawUnit) {
      state.rawUnit = parsed.rawUnit;
      unitSelect.value = parsed.rawUnit;
      unitTouchedByUser = true;
    }
    state.offerType = parsed.offerType;
    state.expiryDays = EXPIRY_DAY_OPTIONS.includes(parsed.expiryDays)
      ? parsed.expiryDays
      : (parsed.expiryDays <= 2 ? 2 : parsed.expiryDays <= 5 ? 3 : parsed.expiryDays <= 10 ? 7 : 14);
    if (parsed.locationNote) {
      state.locationNote = parsed.locationNote;
      locationNoteInput.value = parsed.locationNote;
    }

    syncCategoryButtons();
    syncOfferButtons();
    syncExpiryButtons();
    updateLiveKg();
    persistDraft();

    const catObj = getByproductCategoryById(state.category);
    parseNotice.textContent = `Đã điền sẵn: ${catObj ? catObj.name : state.category}, ${quantityInput.value || '?'} ${unitSelect.options[unitSelect.selectedIndex]?.text || ''}, ${state.offerType === 'sell' ? 'Bán giá rẻ' : 'Cho miễn phí'}, hạn ${state.expiryDays} ngày. Kiểm tra lại rồi bấm Đăng tin lên bản đồ.`;
    parseNotice.hidden = false;
  }

  function stopVoiceListening() {
    if (recognitionTimer !== null) {
      clearTimeout(recognitionTimer);
      recognitionTimer = null;
    }
    const captured = latestVoiceTranscript || voiceTextarea.value.trim();
    const prev = recognition;
    recognition = null;
    if (prev) {
      prev.onresult = null;
      prev.onerror = null;
      prev.onend = null;
      try {
        prev.stop();
      } catch {
      }
    }
    isListening = false;
    btnVoice.classList.remove('is-listening');
    btnVoice.textContent = '🎙️ Bấm để nói tiếng Việt';
    if (captured) {
      applyParsedVoice(captured);
    }
  }

  function startVoiceListening() {
    if (isListening) {
      stopVoiceListening();
      return;
    }
    const SpeechRec = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SpeechRec) {
      micNotice.textContent =
        'Trình duyệt chưa hỗ trợ thu âm giọng nói. Bà con hãy sửa câu mẫu bên trên rồi bấm Phân tích câu nói, hoặc chạm chọn nhanh 6 ô bên dưới.';
      micNotice.hidden = false;
      return;
    }

    micNotice.hidden = true;
    try {
      const rec = new SpeechRec();
      rec.lang = 'vi-VN';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      recognition = rec;
      isListening = true;
      btnVoice.classList.add('is-listening');
      btnVoice.textContent = 'Đang nghe... Bấm để dừng';

      let latestTranscript = '';
      let hadFinal = false;

      recognitionTimer = setTimeout(() => {
        stopVoiceListening();
      }, 10000);

      rec.onresult = (event) => {
        if (recognition !== rec) {
          return;
        }
        let combined = '';
        for (let i = 0; i < event.results.length; i += 1) {
          combined += event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            hadFinal = true;
          }
        }
        latestTranscript = combined.trim();
        latestVoiceTranscript = latestTranscript;
        if (latestTranscript) {
          voiceTextarea.value = latestTranscript;
          state.rawVoiceText = latestTranscript;
        }
      };

      rec.onerror = () => {
        if (recognition !== rec) {
          return;
        }
        stopVoiceListening();
        micNotice.textContent =
          'Không thu được giọng nói (micro bị chặn hoặc ồn gió). Bà con hãy gõ/sửa câu bên trên rồi bấm Phân tích câu nói, hoặc chọn nhanh 6 ô bên dưới.';
        micNotice.hidden = false;
      };

      rec.onend = () => {
        if (recognition !== rec) {
          return;
        }
        const captured = latestTranscript || voiceTextarea.value.trim();
        stopVoiceListening();
        if (captured && (hadFinal || latestTranscript)) {
          applyParsedVoice(captured);
        }
      };

      rec.start();
    } catch {
      stopVoiceListening();
      micNotice.textContent =
        'Không bật được micro lúc này. Bà con hãy gõ vào ô trên rồi bấm Phân tích câu nói, hoặc chạm chọn nhanh 6 ô bên dưới.';
      micNotice.hidden = false;
    }
  }

  function renderVault() {
    const receipts = getShortCodeReceipts(storage);
    vaultSummary.textContent = `Mã xác nhận các tin đã đăng trên máy (${receipts.length})`;
    vaultBody.replaceChildren();
    if (receipts.length === 0) {
      vaultBody.appendChild(createEl('div', {
        className: 'divider-row',
        text: 'Chưa có mã xác nhận nào được lưu trên thiết bị này.'
      }));
      return;
    }
    const newestFirst = [...receipts].reverse();
    for (const item of newestFirst) {
      const cat = getByproductCategoryById(item.category);
      const row = createEl('div', { className: 'divider-row' },
        createEl('div', { className: 'listing-top' },
          createEl('strong', { text: `Mã: ${item.shortCode}` }),
          createEl('span', { className: 'pill pill-green', text: cat ? cat.name : (item.category || 'Phụ phẩm') })
        ),
        createEl('p', {
          className: 'listing-meta-line',
          text: item.estimatedKg ? `Ước tính ${formatViNumber(item.estimatedKg, 1)} kg` : 'Đã lưu mã xác nhận'
        })
      );
      vaultBody.appendChild(row);
    }
  }

  function syncConnectivityUi() {
    const offline = globalThis.navigator?.onLine === false;
    offlineSubmitNotice.hidden = !offline;
    submitBtn.disabled = offline || isSubmitting;
  }

  function showReceipt(listing, shortCode) {
    receiptCard.replaceChildren(
      createEl('h2', { className: 'section-heading', text: 'Đã đăng tin lên bản đồ thành công!' }),
      createEl('p', {
        text: 'Giữ lại mã xác nhận 4 ký tự này để đưa cho người thu gom khi bốc hàng xong:'
      }),
      createEl('p', { className: 'receipt-code', text: shortCode }),
      createEl('p', {
        className: 'field-hint',
        text: `Tin #${listing.id} (${formatViNumber(listing.estimatedKg, 1)} kg).`
      }),
      createEl('div', { className: 'row-inline' },
        createEl('button', {
          type: 'button',
          className: 'btn btn-inline-primary',
          text: 'Xem tin trên Bản đồ',
          onClick: () => onNavigateMap()
        }),
        createEl('button', {
          type: 'button',
          className: 'btn btn-secondary',
          text: 'Đăng tin mới khác',
          onClick: () => {
            receiptCard.hidden = true;
          }
        })
      )
    );
    receiptCard.hidden = false;
    receiptCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btnVoice.addEventListener('click', startVoiceListening);
  btnParseVoice.addEventListener('click', () => {
    const raw = voiceTextarea.value.trim();
    if (!raw) {
      parseNotice.className = 'notice-box notice-amber';
      parseNotice.textContent = 'Hãy nhập hoặc nói một câu mô tả phụ phẩm trước khi phân tích.';
      parseNotice.hidden = false;
      return;
    }
    parseNotice.className = 'notice-box notice-green';
    applyParsedVoice(raw);
  });

  voiceTextarea.addEventListener('input', () => {
    state.rawVoiceText = voiceTextarea.value;
    persistDraft();
  });
  quantityInput.addEventListener('input', () => {
    state.rawQuantityText = quantityInput.value;
    updateLiveKg();
    persistDraft();
  });
  unitSelect.addEventListener('change', () => {
    state.rawUnit = unitSelect.value;
    unitTouchedByUser = true;
    updateLiveKg();
    persistDraft();
  });
  priceNoteInput.addEventListener('input', () => {
    state.priceNote = priceNoteInput.value;
    persistDraft();
  });
  locationNoteInput.addEventListener('input', () => {
    state.locationNote = locationNoteInput.value;
    persistDraft();
  });
  contactNameInput.addEventListener('input', () => {
    state.contactName = contactNameInput.value;
    persistDraft();
  });
  contactPhoneInput.addEventListener('input', () => {
    state.contactPhone = contactPhoneInput.value;
    persistDraft();
  });
  proxyCheckbox.addEventListener('change', () => {
    state.isProxyPost = proxyCheckbox.checked;
    if (state.isProxyPost) {
      const own = readFarmerProfile(storage);
      if (state.contactName === own.contactName && state.contactPhone === own.contactPhone) {
        state.contactName = '';
        state.contactPhone = '';
        contactNameInput.value = '';
        contactPhoneInput.value = '';
      }
    } else {
      const own = readFarmerProfile(storage);
      if (!state.contactName && own.contactName) {
        state.contactName = own.contactName;
        contactNameInput.value = own.contactName;
      }
      if (!state.contactPhone && own.contactPhone) {
        state.contactPhone = own.contactPhone;
        contactPhoneInput.value = own.contactPhone;
      }
    }
    persistDraft();
  });

  communeFallbackSelect.addEventListener('change', () => {
    const idxStr = communeFallbackSelect.value;
    if (!idxStr) {
      return;
    }
    const idx = parseStrictInt(idxStr);
    const commune = idx !== null && idx >= 0 ? getRegion().communes[idx] : null;
    if (commune) {
      pinTouchedByUser = true;
      updatePinDisplay(commune.lat, commune.lng, `Đã chọn ${commune.name}`);
      if (!state.locationNote) {
        state.locationNote = commune.name;
        locationNoteInput.value = commune.name;
      }
      persistDraft();
    }
  });

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting || globalThis.navigator?.onLine === false) {
      syncConnectivityUi();
      return;
    }
    submitErrorNotice.hidden = true;

    const rawQuantity = parseStrictNumber(quantityInput.value);
    const payload = {
      category: state.category,
      rawQuantity: rawQuantity === null ? 0 : rawQuantity,
      rawUnit: state.rawUnit,
      offerType: state.offerType,
      priceNote: state.priceNote,
      lat: state.lat,
      lng: state.lng,
      locationNote: state.locationNote,
      contactName: state.contactName,
      contactPhone: state.contactPhone,
      isProxyPost: state.isProxyPost,
      expiryDays: state.expiryDays,
      rawVoiceText: state.rawVoiceText,
      clientRequestId: state.clientRequestId
    };

    const validated = validateCreateListing(payload);
    if (!validated.ok) {
      submitErrorNotice.textContent = validated.error;
      submitErrorNotice.hidden = false;
      persistDraft();
      return;
    }

    persistDraft();
    isSubmitting = true;
    syncConnectivityUi();
    try {
      const res = await createListing(validated.value);
      if (!state.isProxyPost) {
        saveFarmerProfile(storage, {
          contactName: validated.value.contactName,
          contactPhone: validated.value.contactPhone
        });
      }
      saveShortCodeReceipt(storage, {
        id: res.listing.id,
        shortCode: res.shortCode,
        category: res.listing.category,
        rawQuantity: res.listing.rawQuantity,
        rawUnit: res.listing.rawUnit,
        estimatedKg: res.listing.estimatedKg,
        offerType: res.listing.offerType,
        createdAt: res.listing.createdAt
      });
      clearPendingPost(storage);
      renderVault();
      showReceipt(res.listing, res.shortCode);

      state.clientRequestId = generateClientRequestId('post');
      state.rawVoiceText = '';
      state.priceNote = '';
      voiceTextarea.value = '';
      priceNoteInput.value = '';
      parseNotice.hidden = true;
      onListingCreated();
    } catch (err) {
      submitErrorNotice.textContent = err?.message || 'Không thể đăng tin lúc này. Bản nháp vẫn được giữ nguyên.';
      submitErrorNotice.hidden = false;
      persistDraft();
    } finally {
      isSubmitting = false;
      syncConnectivityUi();
    }
  });

  syncCommuneOptions();
  syncCategoryButtons();
  syncOfferButtons();
  syncExpiryButtons();
  updateLiveKg();
  renderVault();
  syncConnectivityUi();

  return {
    onShow() {
      if (!mounted) {
        mounted = true;
        ensureMiniMap();
        updatePinDisplay(state.lat, state.lng);
        if (!gpsAutoRequested && !pinTouchedByUser) {
          gpsAutoRequested = true;
          requestGps(false);
        }
      }
      if (miniMap) {
        setTimeout(() => miniMap.invalidateSize(), 50);
      }
      syncConnectivityUi();
      renderVault();
    },
    onRegionChanged() {
      gpsSeq += 1;
      const region = getRegion();
      syncCommuneOptions();
      if (!unitTouchedByUser) {
        state.rawUnit = region.defaultUnit;
        unitSelect.value = state.rawUnit;
        updateLiveKg();
      }
      if (!pinTouchedByUser) {
        updatePinDisplay(region.center[0], region.center[1]);
      }
    },
    onConnectivityChanged() {
      syncConnectivityUi();
    },
    applyExternalDraft(draft) {
      if (!draft || typeof draft !== 'object') {
        return;
      }
      if (draft.category) {
        state.category = draft.category;
      }
      if (draft.offerType === 'sell' || draft.offerType === 'free') {
        state.offerType = draft.offerType;
      }
      if (typeof draft.priceNote === 'string') {
        state.priceNote = draft.priceNote;
        priceNoteInput.value = draft.priceNote;
      }
      if (typeof draft.rawVoiceText === 'string') {
        state.rawVoiceText = draft.rawVoiceText;
        voiceTextarea.value = draft.rawVoiceText;
      }
      if (draft.expiryDays && EXPIRY_DAY_OPTIONS.includes(draft.expiryDays)) {
        state.expiryDays = draft.expiryDays;
      }
      syncCategoryButtons();
      syncOfferButtons();
      syncExpiryButtons();
      updateLiveKg();
      persistDraft();
      parseNotice.className = 'notice-box notice-green';
      parseNotice.textContent = 'Đã điền sẵn thông tin từ Công cụ tính giá. Bà con kiểm tra số lượng, vị trí rồi bấm Đăng tin lên bản đồ.';
      parseNotice.hidden = false;
    }
  };
}
