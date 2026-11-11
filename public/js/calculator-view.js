import { STORAGE_MODES, calculateFreshnessPrice, projectThreeDays } from '/shared/pricing.js';
import { validateCalcInput } from '/shared/validation.js';
import {
  createEl,
  enqueueOfflineCalc,
  formatViNumber,
  formatVnd,
  getBrowserStorage,
  parseStrictInt,
  parseStrictNumber
} from './state.js';

const QUICK_DAYS = [0, 1, 2, 3, 5];
const MAX_CALC_DAYS = 3647;

function getZoneClass(zone) {
  if (zone === 'red') {
    return 'zone-red';
  }
  if (zone === 'yellow') {
    return 'zone-yellow';
  }
  return 'zone-green';
}

function getZonePillClass(zone) {
  if (zone === 'red') {
    return 'pill-red';
  }
  if (zone === 'yellow') {
    return 'pill-amber';
  }
  return 'pill-green';
}

export function createCalculatorView({
  container,
  getCrops,
  onCalcQueued,
  onTransferToPost
}) {
  const storage = getBrowserStorage();
  const initialCrops = getCrops();
  const firstCrop = initialCrops[0];

  let selectedCropId = firstCrop ? firstCrop.id : 'custom';
  let customName = 'Nông sản khác';
  let customDecayPercentText = '5';
  let customMaxDaysText = '7';
  let basePriceText = firstCrop ? String(firstCrop.referencePriceVnd) : '20000';
  let daysText = '0';
  let storageMode = 'fan';
  let priceEditedByUser = false;

  let isSpeaking = false;
  let speechTimerId = null;
  let activeUtterance = null;
  let currentSpeakBtn = null;

  const headerBlock = createEl('div', { className: 'screen-header' },
    createEl('h1', { id: 'heading-calc', className: 'screen-title', text: 'Công cụ tính giá theo độ tươi' }),
    createEl('p', {
      className: 'screen-lead',
      text: 'Nông sản hôm nay còn tươi bao nhiêu % và bán giá nào?'
    })
  );

  const cropGrid = createEl('div', { className: 'crop-grid' });
  const cropButtons = new Map();
  const cropHintEl = createEl('p', { className: 'field-hint' });

  const customNameInput = createEl('input', {
    id: 'calc-custom-name',
    className: 'text-input',
    type: 'text',
    attrs: { maxlength: '60', placeholder: 'Ví dụ: Ớt chỉ thiên, Bầu, Bí' }
  });
  customNameInput.value = customName;

  const customDecayInput = createEl('input', {
    id: 'calc-custom-decay',
    className: 'text-input',
    type: 'text',
    attrs: { inputmode: 'decimal', placeholder: '0,1 đến 50 (%/ngày)' }
  });
  customDecayInput.value = customDecayPercentText;

  const customMaxDaysInput = createEl('input', {
    id: 'calc-custom-max-days',
    className: 'text-input',
    type: 'text',
    attrs: { inputmode: 'numeric', placeholder: '1 đến 365 ngày' }
  });
  customMaxDaysInput.value = customMaxDaysText;

  const customFieldsBox = createEl('div', { className: 'surface-block', attrs: { hidden: true } },
    createEl('h2', { className: 'section-heading', text: 'Thông số nông sản tự nhập' }),
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Tên nông sản (tùy chọn)', attrs: { for: 'calc-custom-name' } }),
      customNameInput
    ),
    createEl('div', { className: 'filter-grid' },
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Tỷ lệ hao hụt (%/ngày)', attrs: { for: 'calc-custom-decay' } }),
        customDecayInput
      ),
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Số ngày giữ tươi tối đa', attrs: { for: 'calc-custom-max-days' } }),
        customMaxDaysInput
      )
    )
  );

  const priceInput = createEl('input', {
    id: 'calc-base-price',
    className: 'text-input',
    type: 'text',
    attrs: { inputmode: 'numeric', placeholder: 'Ví dụ: 20000' }
  });
  priceInput.value = basePriceText;

  const btnPriceMinus = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary step-btn',
    text: '-1.000đ',
    attrs: { 'aria-label': 'Giảm giá gốc 1.000 đồng' },
    onClick: () => adjustPrice(-1000)
  });
  const btnPricePlus = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary step-btn',
    text: '+1.000đ',
    attrs: { 'aria-label': 'Tăng giá gốc 1.000 đồng' },
    onClick: () => adjustPrice(1000)
  });

  const daysChipRow = createEl('div', { className: 'chip-row' });
  const daysChipButtons = new Map();
  for (const d of QUICK_DAYS) {
    const label = d === 0 ? '0 ngày (Hôm nay)' : `${d} ngày`;
    const btn = createEl('button', {
      type: 'button',
      className: 'chip-btn',
      text: label,
      onClick: () => {
        daysText = String(d);
        daysInput.value = daysText;
        recordAndRender();
      }
    });
    daysChipButtons.set(d, btn);
    daysChipRow.appendChild(btn);
  }

  const daysInput = createEl('input', {
    id: 'calc-days-input',
    className: 'text-input',
    type: 'text',
    attrs: { inputmode: 'numeric', 'aria-label': 'Số ngày sau thu hoạch' }
  });
  daysInput.value = daysText;

  const btnDaysMinus = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary step-btn',
    text: '-1 ngày',
    attrs: { 'aria-label': 'Giảm 1 ngày' },
    onClick: () => adjustDays(-1)
  });
  const btnDaysPlus = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary step-btn',
    text: '+1 ngày',
    attrs: { 'aria-label': 'Tăng 1 ngày' },
    onClick: () => adjustDays(1)
  });

  const storageGrid = createEl('div', { className: 'storage-grid' });
  const storageButtons = new Map();
  for (const mode of STORAGE_MODES) {
    const btn = createEl('button', {
      type: 'button',
      className: 'choice-tile choice-tile-row',
      onClick: () => {
        storageMode = mode.id;
        recordAndRender();
      }
    },
      createEl('span', { text: `${mode.shortLabel} (k = ${formatViNumber(mode.kFactor, 1)})` })
    );
    storageButtons.set(mode.id, btn);
    storageGrid.appendChild(btn);
  }

  const inputSection = createEl('div', { className: 'surface-block' },
    createEl('h2', { className: 'section-heading', text: '1. Chọn nông sản và điều kiện bảo quản' }),
    createEl('div', { className: 'field-group' },
      createEl('span', { className: 'field-label', text: 'Loại nông sản' }),
      cropGrid,
      cropHintEl
    ),
    customFieldsBox,
    createEl('div', { className: 'field-group' },
      createEl('label', {
        className: 'field-label',
        text: 'Giá loại 1 mới hái tại vườn (đồng/kg)',
        attrs: { for: 'calc-base-price' }
      }),
      createEl('div', { className: 'step-row' }, btnPriceMinus, priceInput, btnPricePlus)
    ),
    createEl('div', { className: 'field-group' },
      createEl('span', { className: 'field-label', text: 'Số ngày sau thu hoạch' }),
      daysChipRow,
      createEl('div', { className: 'step-row' }, btnDaysMinus, daysInput, btnDaysPlus)
    ),
    createEl('div', { className: 'field-group' },
      createEl('span', { className: 'field-label', text: 'Điều kiện bảo quản' }),
      storageGrid
    )
  );

  const errorBox = createEl('div', { className: 'notice-box notice-red', attrs: { hidden: true, role: 'alert' } });
  const resultPanel = createEl('div', { className: 'calc-result-panel' });
  const forecastBlock = createEl('div', { className: 'surface-block' });
  const formulaDetails = createEl('details', { className: 'details-block' });
  const speechNotice = createEl('div', { className: 'notice-box notice-amber', attrs: { hidden: true } });

  container.append(
    headerBlock,
    inputSection,
    errorBox,
    resultPanel,
    forecastBlock,
    formulaDetails,
    speechNotice
  );

  function getActiveCrop() {
    if (selectedCropId === 'custom') {
      return null;
    }
    return getCrops().find((c) => c.id === selectedCropId) || null;
  }

  function renderCropButtons() {
    cropGrid.replaceChildren();
    cropButtons.clear();
    const crops = getCrops();
    for (const crop of crops) {
      const btn = createEl('button', {
        type: 'button',
        className: 'choice-tile choice-tile-row',
        attrs: { 'data-crop-id': crop.id },
        onClick: () => {
          selectedCropId = crop.id;
          basePriceText = String(crop.referencePriceVnd);
          priceInput.value = basePriceText;
          priceEditedByUser = false;
          recordAndRender();
        }
      },
        createEl('span', { text: crop.icon }),
        createEl('span', { text: crop.name })
      );
      cropButtons.set(crop.id, btn);
      cropGrid.appendChild(btn);
    }
    const customBtn = createEl('button', {
      type: 'button',
      className: 'choice-tile choice-tile-row',
      attrs: { 'data-crop-id': 'custom' },
      onClick: () => {
        selectedCropId = 'custom';
        recordAndRender();
      }
    },
      createEl('span', { text: '🌱' }),
      createEl('span', { text: 'Nông sản khác' })
    );
    cropButtons.set('custom', customBtn);
    cropGrid.appendChild(customBtn);
  }

  function syncSelectionHighlights() {
    for (const [id, btn] of cropButtons.entries()) {
      const active = id === selectedCropId;
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    const currentDay = parseStrictInt(daysText);
    for (const [d, btn] of daysChipButtons.entries()) {
      const active = currentDay === d;
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    for (const [id, btn] of storageButtons.entries()) {
      const active = id === storageMode;
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    customFieldsBox.hidden = selectedCropId !== 'custom';
  }

  function adjustPrice(delta) {
    const current = parseStrictNumber(priceInput.value);
    const base = current !== null && current >= 0 ? Math.round(current) : 0;
    const next = Math.max(1000, base + delta);
    basePriceText = String(next);
    priceInput.value = basePriceText;
    priceEditedByUser = true;
    recordAndRender();
  }

  function adjustDays(delta) {
    const current = parseStrictInt(daysInput.value);
    const base = current !== null ? current : 0;
    const next = Math.max(0, Math.min(MAX_CALC_DAYS, base + delta));
    daysText = String(next);
    daysInput.value = daysText;
    recordAndRender();
  }

  function updateSpeakButtonUi() {
    if (!currentSpeakBtn) {
      return;
    }
    currentSpeakBtn.textContent = isSpeaking ? '🔊 Đang đọc kết quả...' : '🔊 Nghe kết quả';
    currentSpeakBtn.setAttribute('aria-pressed', isSpeaking ? 'true' : 'false');
  }

  function stopSpeech() {
    if (speechTimerId !== null) {
      clearTimeout(speechTimerId);
      speechTimerId = null;
    }
    if (activeUtterance) {
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance = null;
    }
    isSpeaking = false;
  }

  function speakAdvice(text) {
    speechNotice.hidden = true;
    const synth = globalThis.speechSynthesis;
    const Utterance = globalThis.SpeechSynthesisUtterance;
    if (!synth || typeof synth.speak !== 'function' || typeof Utterance !== 'function') {
      speechNotice.textContent = 'Trình duyệt này chưa hỗ trợ đọc giọng nói tiếng Việt.';
      speechNotice.hidden = false;
      return;
    }
    stopSpeech();
    if (typeof synth.cancel === 'function') {
      try {
        synth.cancel();
      } catch {
      }
    }
    const utterance = new Utterance(text);
    utterance.lang = 'vi-VN';
    activeUtterance = utterance;
    isSpeaking = true;
    updateSpeakButtonUi();
    speechTimerId = setTimeout(() => {
      if (activeUtterance !== utterance) {
        return;
      }
      stopSpeech();
      updateSpeakButtonUi();
    }, 15000);
    utterance.onend = () => {
      if (activeUtterance !== utterance) {
        return;
      }
      stopSpeech();
      updateSpeakButtonUi();
    };
    utterance.onerror = () => {
      if (activeUtterance !== utterance) {
        return;
      }
      stopSpeech();
      updateSpeakButtonUi();
    };
    try {
      synth.speak(utterance);
    } catch {
      stopSpeech();
      updateSpeakButtonUi();
      speechNotice.textContent = 'Không thể phát giọng nói lúc này.';
      speechNotice.hidden = false;
    }
  }

  function buildCurrentInput() {
    const activeCrop = getActiveCrop();
    const parsedPrice = parseStrictNumber(basePriceText);
    const parsedDays = parseStrictInt(daysText);

    if (activeCrop) {
      cropHintEl.textContent = `Giá tham khảo: ${formatVnd(activeCrop.referencePriceVnd)}/kg. Hao hụt chuẩn: ${formatViNumber(activeCrop.dailyDecayRate * 100, 1)}%/ngày. Tối đa: ${activeCrop.maxShelfLifeDays} ngày.`;
      return {
        crop: activeCrop,
        cropName: activeCrop.name,
        byproductCategory: activeCrop.byproductCategory || 'rau-cu-qua',
        sourceNote: activeCrop.sourceNote,
        input: {
          basePriceVnd: parsedPrice === null ? -1 : parsedPrice,
          dailyDecayRate: activeCrop.dailyDecayRate,
          storageMode,
          daysAfterHarvest: parsedDays === null ? -1 : parsedDays,
          maxShelfLifeDays: activeCrop.maxShelfLifeDays
        }
      };
    }

    cropHintEl.textContent = 'Đang dùng chế độ Nông sản khác với tỷ lệ hao hụt tự nhập.';
    const decayPercent = parseStrictNumber(customDecayPercentText);
    const maxDays = parseStrictInt(customMaxDaysText);
    return {
      crop: null,
      cropName: customName.trim() || 'Nông sản khác',
      byproductCategory: 'rau-cu-qua',
      sourceNote: 'Tỷ lệ hao hụt và thời gian bảo quản do bà con tự nhập theo thực tế vườn nhà.',
      input: {
        basePriceVnd: parsedPrice === null ? -1 : parsedPrice,
        dailyDecayRate: decayPercent === null ? -1 : decayPercent / 100,
        storageMode,
        daysAfterHarvest: parsedDays === null ? -1 : parsedDays,
        maxShelfLifeDays: maxDays === null ? -1 : maxDays
      }
    };
  }

  function renderCalculation() {
    syncSelectionHighlights();

    const { cropName, byproductCategory, sourceNote, input } = buildCurrentInput();
    const validation = validateCalcInput(input);
    if (!validation.ok) {
      errorBox.textContent = validation.error;
      errorBox.hidden = false;
      resultPanel.hidden = true;
      forecastBlock.hidden = true;
      formulaDetails.hidden = true;
      return false;
    }
    if (validation.value.daysAfterHarvest > MAX_CALC_DAYS) {
      errorBox.textContent = 'Số ngày sau thu hoạch tối đa là 3647 ngày (để dự báo thêm 3 ngày không vượt 3650).';
      errorBox.hidden = false;
      resultPanel.hidden = true;
      forecastBlock.hidden = true;
      formulaDetails.hidden = true;
      return false;
    }

    errorBox.hidden = true;
    resultPanel.hidden = false;
    forecastBlock.hidden = false;
    formulaDetails.hidden = false;

    const result = calculateFreshnessPrice(validation.value);
    const forecast = projectThreeDays(validation.value);

    resultPanel.className = `calc-result-panel ${getZoneClass(result.zone)}`;
    resultPanel.replaceChildren(
      createEl('div', { className: 'listing-top' },
        createEl('span', { className: 'listing-category', text: cropName }),
        createEl('span', { className: `pill ${getZonePillClass(result.zone)}`, text: result.zoneLabel })
      ),
      createEl('p', {
        className: 'focal-number',
        text: `${formatVnd(result.suggestedPriceVnd)}/kg`
      }),
      createEl('p', {
        className: 'listing-meta-line',
        text: `Độ tươi còn lại: ${formatViNumber(result.remainingPercent, 1)}%`
      }),
      createEl('p', { className: 'listing-note', text: result.adviceText })
    );

    const speakBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-primary',
      text: isSpeaking ? '🔊 Đang đọc kết quả...' : '🔊 Nghe kết quả',
      attrs: { 'aria-pressed': isSpeaking ? 'true' : 'false' },
      onClick: () => speakAdvice(result.adviceText)
    });
    currentSpeakBtn = speakBtn;
    const ctaStack = createEl('div', { className: 'action-stack' }, speakBtn);

    if (result.zone === 'red') {
      ctaStack.appendChild(createEl('button', {
        type: 'button',
        className: 'btn btn-danger',
        text: 'Đẩy sang Sàn Phụ phẩm ngay',
        onClick: () => {
          onTransferToPost({
            category: byproductCategory,
            offerType: result.suggestedPriceVnd > 0 ? 'sell' : 'free',
            priceNote:
              result.suggestedPriceVnd > 0
                ? `${cropName} quá độ tươi, bán rẻ ${formatVnd(result.suggestedPriceVnd)}/kg làm thức ăn chăn nuôi hoặc ủ phân`
                : `${cropName} quá hạn tươi, cho miễn phí để làm thức ăn chăn nuôi hoặc ủ phân`,
            expiryDays: 2
          });
        }
      }));
    }
    resultPanel.appendChild(ctaStack);

    forecastBlock.replaceChildren(
      createEl('h2', { className: 'section-heading', text: 'Dự báo 3 ngày tiếp theo' })
    );
    forecast.forEach((step, idx) => {
      const dayNum = idx + 1;
      const row = createEl('div', { className: 'forecast-row' },
        createEl('span', { text: `Sau ${dayNum} ngày nữa (ngày thứ ${step.daysAfterHarvest})` }),
        createEl('strong', { text: `${formatVnd(step.suggestedPriceVnd)}/kg (${formatViNumber(step.remainingPercent, 1)}%)` }),
        createEl('span', { className: `pill ${getZonePillClass(step.zone)}`, text: step.zoneLabel })
      );
      forecastBlock.appendChild(row);
    });

    const effectivePercent = formatViNumber(validation.value.dailyDecayRate * result.kFactor * 100, 2);
    formulaDetails.replaceChildren(
      createEl('summary', { text: 'Cách tính chi tiết' }),
      createEl('div', { className: 'field-group' },
        createEl('p', {
          className: 'listing-note',
          text: `1. Tỷ lệ hao hụt thực tế mỗi ngày: r_thực = ${formatViNumber(validation.value.dailyDecayRate * 100, 2)}% x ${formatViNumber(result.kFactor, 1)} = ${effectivePercent}%/ngày.`
        }),
        createEl('p', {
          className: 'listing-note',
          text: `2. Tỷ lệ giá trị còn lại sau ${validation.value.daysAfterHarvest} ngày: V = max(0, 100% - ${effectivePercent}% x ${validation.value.daysAfterHarvest}) = ${formatViNumber(result.remainingPercent, 1)}%.`
        }),
        createEl('p', {
          className: 'listing-note',
          text: `3. Giá bán đề xuất (làm tròn hàng trăm đồng): ${formatVnd(validation.value.basePriceVnd)} x ${formatViNumber(result.remainingPercent, 1)}% = ${formatVnd(result.suggestedPriceVnd)}/kg.`
        }),
        createEl('p', {
          className: 'field-hint',
          text: `Nguồn tham khảo: ${sourceNote}`
        })
      )
    );

    return true;
  }

  function recordAndRender() {
    const valid = renderCalculation();
    if (valid) {
      enqueueOfflineCalc(storage, 1);
      onCalcQueued();
    }
  }

  priceInput.addEventListener('input', () => {
    basePriceText = priceInput.value;
    priceEditedByUser = true;
    recordAndRender();
  });
  daysInput.addEventListener('input', () => {
    daysText = daysInput.value;
    recordAndRender();
  });
  customNameInput.addEventListener('input', () => {
    customName = customNameInput.value;
    renderCalculation();
  });
  customDecayInput.addEventListener('input', () => {
    customDecayPercentText = customDecayInput.value;
    recordAndRender();
  });
  customMaxDaysInput.addEventListener('input', () => {
    customMaxDaysText = customMaxDaysInput.value;
    recordAndRender();
  });

  renderCropButtons();
  renderCalculation();

  return {
    onShow() {
      renderCalculation();
    },
    onCropsUpdated() {
      const updated = getCrops();
      const active = updated.find((c) => c.id === selectedCropId);
      if (active && !priceEditedByUser) {
        basePriceText = String(active.referencePriceVnd);
        priceInput.value = basePriceText;
      }
      renderCropButtons();
      renderCalculation();
    },
    onMetricsFlushed() {
    }
  };
}
