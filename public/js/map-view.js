import { BYPRODUCT_CATEGORIES, getByproductCategoryById } from '/shared/crops.js';
import { isValidCoordinates, sortByDistance } from '/shared/geo.js';
import { getUnitById } from '/shared/units.js';
import {
  collectListing,
  fetchListings,
  isAbortError,
  reportListing
} from './api.js';
import {
  buildDirectionsHref,
  buildTelHref,
  buildZaloHref,
  createEl,
  formatRemainingTime,
  formatViNumber,
  parseStrictInt,
  parseStrictNumber
} from './state.js';

const PAGE_SIZE = 20;

export function getAccessRoadLabel(road) {
  if (road === 'tricycle') {
    return '🛺 Xe ba gác / Đường đan';
  }
  if (road === 'boat') {
    return '🛶 Đi ghe / Vỏ lãi đường sông';
  }
  return '🚛 Xe tải vào tận nơi';
}

export function getMoistureLabel(state) {
  if (state === 'humid') {
    return '⛅ Hơi ẩm (Cắt 1-2 ngày)';
  }
  if (state === 'wet') {
    return '🌧️ Ướt dầm mưa (Làm phân)';
  }
  return '☀️ Khô ráo (Vừa cắt, sạch)';
}

export function attachLeafletTileLayers(L, map, onTileOffline) {
  const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'OpenStreetMap'
  });
  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
    {
      maxZoom: 19,
      attribution: 'Esri'
    }
  );

  let errorBurst = 0;
  let burstTimer = null;

  function handleTileError() {
    if (!globalThis.navigator?.onLine) {
      onTileOffline(true);
      return;
    }
    errorBurst += 1;
    if (errorBurst >= 2) {
      onTileOffline(true);
    }
    if (burstTimer === null) {
      burstTimer = setTimeout(() => {
        errorBurst = 0;
        burstTimer = null;
      }, 3000);
    }
  }

  function handleTileLoad() {
    errorBurst = 0;
    onTileOffline(false);
  }

  street.on('tileerror', handleTileError);
  satellite.on('tileerror', handleTileError);
  street.on('load', handleTileLoad);
  satellite.on('load', handleTileLoad);
  street.addTo(map);

  return {
    street,
    satellite,
    cleanup() {
      if (burstTimer !== null) {
        clearTimeout(burstTimer);
        burstTimer = null;
      }
      street.off('tileerror', handleTileError);
      satellite.off('tileerror', handleTileError);
      street.off('load', handleTileLoad);
      satellite.off('load', handleTileLoad);
    }
  };
}

function createCategoryPinIcon(L, categoryId, offerType) {
  const cat = getByproductCategoryById(categoryId) || getByproductCategoryById('phu-pham-khac');
  const pinEl = createEl('div', {
    className: 'map-pin',
    attrs: {
      'data-category': cat.id,
      'data-offer': offerType,
      'aria-label': `${cat.name} (${offerType === 'sell' ? 'Bán giá rẻ' : 'Cho miễn phí'})`
    }
  });
  pinEl.style.backgroundColor = cat.color;
  const iconSpan = createEl('span', { text: cat.icon });
  const badgeSpan = createEl('span', {
    className: `map-pin-offer ${offerType === 'sell' ? 'is-sell' : 'is-free'}`,
    text: offerType === 'sell' ? 'Bán' : 'Cho'
  });
  pinEl.append(iconSpan, badgeSpan);
  return L.divIcon({
    className: 'map-pin-wrap',
    html: pinEl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

function formatQuantityHeadline(listing) {
  const unitObj = getUnitById(listing.rawUnit);
  const unitLabel = unitObj ? unitObj.shortLabel : listing.rawUnit;
  return `${formatViNumber(listing.rawQuantity)} ${unitLabel} (khoảng ${formatViNumber(listing.estimatedKg, 1)} kg)`;
}

function formatDistanceLabel(distanceKm) {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm)) {
    return 'Chưa rõ khoảng cách';
  }
  return `Cách ${formatViNumber(distanceKm, 1)} km`;
}

export function createMapView({
  container,
  getRegion,
  onNavigatePost,
  onNavigateCalc,
  onImpactChanged
}) {
  let viewMode = 'map';
  let layerMode = 'street';
  let filters = {
    category: 'all',
    offerType: 'all',
    radiusKm: 'all'
  };
  let originCoords = null;
  let originSource = 'region';
  let listings = [];
  let visibleCount = PAGE_SIZE;
  let loading = false;
  let errorMessage = '';
  let isOfflineError = false;
  let tileOffline = false;
  let selectedListing = null;
  let lastTriggerEl = null;
  let activeAbort = null;
  let gpsSeq = 0;
  let mounted = false;

  let mapInstance = null;
  let tileControl = null;
  let markerLayer = null;
  let originMarker = null;

  const heroBadge = createEl('div', { className: 'hero-3d-badge' },
    createEl('span', { className: 'hero-3d-badge-pulse' }),
    createEl('span', { text: 'Nông nghiệp tuần hoàn Xuân Đường & lân cận - Kết nối trực tiếp tận ruộng' })
  );

  const heroTitle = createEl('h1', { id: 'heading-map', className: 'hero-3d-title', text: 'Sàn Phụ Phẩm Nông Nghiệp Tuần Hoàn' });
  const heroSubtitle = createEl('p', {
    className: 'hero-3d-lead',
    text: 'Biến Rơm rạ, Trấu, Bã mía, Thân bắp thành tiền mặt. Không đốt đồng - Tăng thu nhập - Dọn sạch ruộng vườn.'
  });

  const cardFarmer = createEl('div', { className: 'role-3d-card role-farmer' },
    createEl('div', { className: 'role-3d-icon-wrap' },
      createEl('span', { className: 'role-3d-emoji', text: '🌾' })
    ),
    createEl('div', { className: 'role-3d-body' },
      createEl('h2', { className: 'role-3d-title', text: 'Nhà Nông Cần Bán / Cho' }),
      createEl('p', { className: 'role-3d-desc', text: 'Ruộng vừa gặt xong có rơm rạ, trấu? Đăng bán hoặc cho miễn phí chỉ 10 giây bằng giọng nói.' })
    ),
    createEl('button', {
      type: 'button',
      className: 'btn-tactile btn-tactile-green',
      text: 'Đăng tin bằng giọng nói 🎙️',
      onClick: () => onNavigatePost()
    })
  );

  const cardCollector = createEl('div', { className: 'role-3d-card role-collector' },
    createEl('div', { className: 'role-3d-icon-wrap' },
      createEl('span', { className: 'role-3d-emoji', text: '🚛' })
    ),
    createEl('div', { className: 'role-3d-body' },
      createEl('h2', { className: 'role-3d-title', text: 'Thương Lái & Thu Gom' }),
      createEl('p', { className: 'role-3d-desc', text: 'Cần nguồn rơm cuộn, trấu đốt lò, mụn dừa? Xem bản đồ bán kính quanh bạn và gọi trực tiếp.' })
    ),
    createEl('button', {
      type: 'button',
      className: 'btn-tactile btn-tactile-blue',
      text: 'Xem bản đồ thu gom 🗺️',
      onClick: () => {
        const targetEl = document.getElementById('map-canvas');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    })
  );

  const cardCalculator = createEl('div', { className: 'role-3d-card role-calculator' },
    createEl('div', { className: 'role-3d-icon-wrap' },
      createEl('span', { className: 'role-3d-emoji', text: '🧮' })
    ),
    createEl('div', { className: 'role-3d-body' },
      createEl('h2', { className: 'role-3d-title', text: 'Tra Cứu Giá & Độ Tươi' }),
      createEl('p', { className: 'role-3d-desc', text: 'Biết ngay nông sản & phụ phẩm sau 1-3 ngày sụt giảm bao nhiêu giá trị theo thời tiết để bán kịp lúc.' })
    ),
    createEl('button', {
      type: 'button',
      className: 'btn-tactile btn-tactile-amber',
      text: 'Tính giá rơm / trấu 🧮',
      onClick: () => onNavigateCalc()
    })
  );

  const roleGrid = createEl('div', { className: 'role-3d-grid' }, cardFarmer, cardCollector, cardCalculator);

  const statsBento = createEl('div', { className: 'stats-3d-bento' },
    createEl('div', { className: 'stat-3d-item' },
      createEl('span', { className: 'stat-3d-num', text: '1.250+ kg' }),
      createEl('span', { className: 'stat-3d-label', text: 'Phụ phẩm sẵn sàng kết nối' })
    ),
    createEl('div', { className: 'stat-3d-item' },
      createEl('span', { className: 'stat-3d-num', text: '18.500.000 đ' }),
      createEl('span', { className: 'stat-3d-label', text: 'Thu nhập nông dân giữ lại' })
    ),
    createEl('div', { className: 'stat-3d-item' },
      createEl('span', { className: 'stat-3d-num', text: '3,2 Tấn' }),
      createEl('span', { className: 'stat-3d-label', text: 'CO₂ giảm thải nhờ không đốt đồng' })
    )
  );

  const flowDiagram = createEl('div', { className: 'circular-flow-3d' },
    createEl('div', { className: 'flow-step-3d' },
      createEl('span', { className: 'flow-step-num', text: '1' }),
      createEl('span', { className: 'flow-step-icon', text: '🌾' }),
      createEl('span', { className: 'flow-step-title', text: 'Ruộng Lúa & Vườn' }),
      createEl('span', { className: 'flow-step-desc', text: 'Tồn dư rơm rạ, trấu' })
    ),
    createEl('div', { className: 'flow-arrow-3d', text: '➔' }),
    createEl('div', { className: 'flow-step-3d' },
      createEl('span', { className: 'flow-step-num', text: '2' }),
      createEl('span', { className: 'flow-step-icon', text: '🎙️' }),
      createEl('span', { className: 'flow-step-title', text: 'Đăng Tin Số Hóa' }),
      createEl('span', { className: 'flow-step-desc', text: 'Nói 10s, ghim vị trí' })
    ),
    createEl('div', { className: 'flow-arrow-3d', text: '➔' }),
    createEl('div', { className: 'flow-step-3d' },
      createEl('span', { className: 'flow-step-num', text: '3' }),
      createEl('span', { className: 'flow-step-icon', text: '🚛' }),
      createEl('span', { className: 'flow-step-title', text: 'Thu Gom Tận Nơi' }),
      createEl('span', { className: 'flow-step-desc', text: 'Thương lái điều xe tải' })
    ),
    createEl('div', { className: 'flow-arrow-3d', text: '➔' }),
    createEl('div', { className: 'flow-step-3d' },
      createEl('span', { className: 'flow-step-num', text: '4' }),
      createEl('span', { className: 'flow-step-icon', text: '🍄' }),
      createEl('span', { className: 'flow-step-title', text: 'Tái Sinh Giá Trị' }),
      createEl('span', { className: 'flow-step-desc', text: 'Nấm, củi trấu, phân bón' })
    )
  );

  const headerBlock = createEl('div', { className: 'hero-3d-section' },
    heroBadge,
    heroTitle,
    heroSubtitle,
    roleGrid,
    flowDiagram,
    statsBento
  );

  const btnMapMode = createEl('button', {
    type: 'button',
    className: 'seg-btn is-active',
    text: 'Bản đồ',
    attrs: { 'aria-pressed': 'true' },
    onClick: () => setViewMode('map')
  });
  const btnListMode = createEl('button', {
    type: 'button',
    className: 'seg-btn',
    text: 'Danh sách',
    attrs: { 'aria-pressed': 'false' },
    onClick: () => setViewMode('list')
  });
  const modeToggleRow = createEl('div', { className: 'segmented-row' }, btnMapMode, btnListMode);

  const categorySelect = createEl('select', {
    id: 'map-filter-category',
    className: 'select-input',
    attrs: { 'aria-label': 'Lọc theo loại phụ phẩm' }
  });
  categorySelect.appendChild(createEl('option', { text: 'Tất cả nhóm phụ phẩm', attrs: { value: 'all' } }));
  for (const cat of BYPRODUCT_CATEGORIES) {
    categorySelect.appendChild(createEl('option', {
      text: `${cat.icon} ${cat.name}`,
      attrs: { value: cat.id }
    }));
  }

  const offerSelect = createEl('select', {
    id: 'map-filter-offer',
    className: 'select-input',
    attrs: { 'aria-label': 'Lọc theo hình thức cho hoặc bán' }
  });
  offerSelect.append(
    createEl('option', { text: 'Tất cả (Cho & Bán)', attrs: { value: 'all' } }),
    createEl('option', { text: 'Cho miễn phí', attrs: { value: 'free' } }),
    createEl('option', { text: 'Bán giá rẻ', attrs: { value: 'sell' } })
  );

  const radiusSelect = createEl('select', {
    id: 'map-filter-radius',
    className: 'select-input',
    attrs: { 'aria-label': 'Lọc theo bán kính' }
  });
  for (const opt of [
    ['all', 'Bán kính: Tất cả'],
    ['3', 'Trong 3 km'],
    ['5', 'Trong 5 km'],
    ['10', 'Trong 10 km'],
    ['20', 'Trong 20 km']
  ]) {
    radiusSelect.appendChild(createEl('option', { text: opt[1], attrs: { value: opt[0] } }));
  }

  const filtersContainer = createEl('div', { className: 'filter-grid filter-grid-map' },
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Loại phụ phẩm', attrs: { for: 'map-filter-category' } }),
      categorySelect
    ),
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Hình thức', attrs: { for: 'map-filter-offer' } }),
      offerSelect
    ),
    createEl('div', { className: 'field-group' },
      createEl('label', { className: 'field-label', text: 'Bán kính', attrs: { for: 'map-filter-radius' } }),
      radiusSelect
    )
  );

  const btnLocateMe = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary',
    text: 'Về vị trí tôi',
    onClick: () => requestGpsLocation()
  });
  const btnLayerToggle = createEl('button', {
    type: 'button',
    className: 'btn btn-secondary',
    text: 'Ảnh vệ tinh',
    onClick: () => toggleMapLayer()
  });
  const communeSelect = createEl('select', {
    id: 'map-commune-select',
    className: 'select-input',
    attrs: { 'aria-label': 'Chọn điểm tham chiếu theo xã hoặc phường' }
  });
  const gpsStatusEl = createEl('p', { className: 'field-hint', attrs: { hidden: true } });
  const tileNoticeEl = createEl('div', {
    className: 'notice-box notice-amber',
    text: 'Nền bản đồ ngoại tuyến chưa tải được ảnh đường, các ghim phụ phẩm vẫn hiển thị hoặc bà con chuyển sang chế độ Danh sách.',
    attrs: { hidden: true }
  });

  const filterDetails = createEl('details', { id: 'map-filter-details', className: 'inline-details' },
    createEl('summary', { id: 'map-filter-summary', text: 'Bộ lọc loại, giá, bán kính & xã' }),
    filtersContainer,
    createEl('div', { className: 'field-group' },
      createEl('label', {
        className: 'field-label',
        text: 'Chọn xã / phường tham chiếu (khi tắt GPS)',
        attrs: { for: 'map-commune-select' }
      }),
      communeSelect
    )
  );
  if (globalThis.innerWidth >= 768) {
    filterDetails.open = true;
  }

  const byproductCardsRow = createEl('div', { className: 'byproduct-3d-carousel' });
  const allByproductCard = createEl('button', {
    type: 'button',
    className: 'byproduct-3d-card is-active-3d',
    attrs: { 'data-category-id': 'all' },
    onClick: () => {
      selectByproductFilter('all');
    }
  },
    createEl('span', { className: 'byproduct-3d-icon', text: '🌐' }),
    createEl('span', { className: 'byproduct-3d-name', text: 'Tất cả' })
  );
  byproductCardsRow.appendChild(allByproductCard);

  for (const cat of BYPRODUCT_CATEGORIES) {
    const card = createEl('button', {
      type: 'button',
      className: 'byproduct-3d-card',
      attrs: { 'data-category-id': cat.id },
      onClick: () => {
        selectByproductFilter(cat.id);
      }
    },
      createEl('span', { className: 'byproduct-3d-icon', text: cat.icon }),
      createEl('span', { className: 'byproduct-3d-name', text: cat.name })
    );
    byproductCardsRow.appendChild(card);
  }

  function selectByproductFilter(catId) {
    filters.category = catId;
    categorySelect.value = catId;
    const allCards = byproductCardsRow.querySelectorAll('.byproduct-3d-card');
    for (const c of allCards) {
      c.classList.toggle('is-active-3d', c.getAttribute('data-category-id') === catId);
    }
    loadListings();
  }

  const toolbarBlock = createEl('div', { className: 'surface-block toolbar-3d-block' },
    byproductCardsRow,
    modeToggleRow,
    createEl('div', { className: 'map-toolbar' }, btnLocateMe, btnLayerToggle),
    filterDetails,
    gpsStatusEl
  );

  const feedbackBox = createEl('div', { className: 'notice-box', attrs: { hidden: true, role: 'status' } });
  const mapStage = createEl('div', { className: 'surface-block' });
  const mapCanvas = createEl('div', { id: 'map-canvas', className: 'map-canvas', attrs: { 'aria-label': 'Bản đồ vị trí phụ phẩm' } });
  const mapCountEl = createEl('p', { className: 'field-hint' });
  mapStage.append(tileNoticeEl, mapCanvas, mapCountEl);

  const listStage = createEl('div', { attrs: { hidden: true } });
  const stateBox = createEl('div', { className: 'surface-block', attrs: { hidden: true } });

  const sheetBackdrop = createEl('div', {
    className: 'sheet-backdrop',
    attrs: { hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-listing-title' }
  });
  const sheetPanel = createEl('div', { className: 'sheet-panel' });
  sheetBackdrop.appendChild(sheetPanel);

  sheetBackdrop.addEventListener('click', (event) => {
    if (event.target === sheetBackdrop) {
      closeDetailSheet();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && selectedListing !== null) {
      closeDetailSheet();
    }
  });

  container.append(headerBlock, feedbackBox, toolbarBlock, stateBox, mapStage, listStage, sheetBackdrop);

  function getEffectiveOrigin() {
    if (originCoords && isValidCoordinates(originCoords.lat, originCoords.lng)) {
      return originCoords;
    }
    const region = getRegion();
    return { lat: region.center[0], lng: region.center[1] };
  }

  function syncCommuneOptions() {
    const region = getRegion();
    communeSelect.replaceChildren();
    communeSelect.appendChild(createEl('option', {
      text: `Trung tâm ${region.shortName}`,
      attrs: { value: '' }
    }));
    region.communes.forEach((commune, idx) => {
      communeSelect.appendChild(createEl('option', {
        text: commune.name,
        attrs: { value: String(idx) }
      }));
    });
  }

  function setViewMode(mode) {
    viewMode = mode === 'list' ? 'list' : 'map';
    btnMapMode.classList.toggle('is-active', viewMode === 'map');
    btnMapMode.setAttribute('aria-pressed', viewMode === 'map' ? 'true' : 'false');
    btnListMode.classList.toggle('is-active', viewMode === 'list');
    btnListMode.setAttribute('aria-pressed', viewMode === 'list' ? 'true' : 'false');
    mapStage.hidden = viewMode !== 'map';
    listStage.hidden = viewMode !== 'list';
    if (viewMode === 'map') {
      ensureMapInitialized();
      if (mapInstance) {
        setTimeout(() => {
          mapInstance.invalidateSize();
          renderMapMarkers();
        }, 50);
      }
    } else {
      renderListItems();
    }
  }

  function toggleMapLayer() {
    if (!mapInstance || !tileControl) {
      return;
    }
    if (layerMode === 'street') {
      mapInstance.removeLayer(tileControl.street);
      tileControl.satellite.addTo(mapInstance);
      layerMode = 'satellite';
      btnLayerToggle.textContent = 'Bản đồ đường';
    } else {
      mapInstance.removeLayer(tileControl.satellite);
      tileControl.street.addTo(mapInstance);
      layerMode = 'street';
      btnLayerToggle.textContent = 'Ảnh vệ tinh';
    }
  }

  function ensureMapInitialized() {
    if (mapInstance || !globalThis.L) {
      return;
    }
    const L = globalThis.L;
    const origin = getEffectiveOrigin();
    const region = getRegion();
    mapInstance = L.map(mapCanvas).setView([origin.lat, origin.lng], region.defaultZoom);
    tileControl = attachLeafletTileLayers(L, mapInstance, (isOff) => {
      tileOffline = isOff;
      tileNoticeEl.hidden = !tileOffline;
    });
    markerLayer = L.layerGroup().addTo(mapInstance);
    if (!globalThis.navigator?.onLine) {
      tileOffline = true;
      tileNoticeEl.hidden = false;
    }
  }

  function renderMapMarkers() {
    if (!globalThis.L) {
      mapCountEl.textContent = `Có ${listings.length} tin đang mở (chuyển sang Danh sách để xem chi tiết).`;
      return;
    }
    ensureMapInitialized();
    if (!mapInstance || !markerLayer) {
      return;
    }
    const L = globalThis.L;
    markerLayer.clearLayers();
    const origin = getEffectiveOrigin();
    if (originMarker) {
      mapInstance.removeLayer(originMarker);
      originMarker = null;
    }
    if (originSource === 'gps' || originSource === 'commune') {
      originMarker = L.circleMarker([origin.lat, origin.lng], {
        radius: 8,
        color: '#122017',
        fillColor: '#146C38',
        fillOpacity: 0.9,
        weight: 2
      }).addTo(mapInstance);
    }

    for (const item of listings) {
      if (!isValidCoordinates(item.lat, item.lng)) {
        continue;
      }
      const cat = getByproductCategoryById(item.category) || getByproductCategoryById('phu-pham-khac');
      const marker = L.marker([item.lat, item.lng], {
        icon: createCategoryPinIcon(L, item.category, item.offerType)
      });

      const popupEl = createEl('div', { className: 'popup-card' },
        createEl('p', { className: 'popup-title', text: `${cat.icon} ${cat.name}` }),
        createEl('p', { className: 'popup-meta', text: formatQuantityHeadline(item) }),
        createEl('p', {
          className: 'popup-meta',
          text: `${item.offerType === 'sell' ? 'Bán giá rẻ' : 'Cho miễn phí'} - ${formatDistanceLabel(item.distanceKm)}`
        }),
        createEl('p', {
          className: 'popup-meta',
          text: `${getAccessRoadLabel(item.accessRoad)} | ${getMoistureLabel(item.moistureState)}`
        })
      );
      if (item.locationNote) {
        popupEl.appendChild(createEl('p', { className: 'popup-meta', text: item.locationNote }));
      }
      popupEl.appendChild(createEl('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: 'Xem chi tiết & Xong',
        onClick: (ev) => openDetailSheet(item, ev.currentTarget)
      }));

      marker.bindPopup(popupEl);
      marker.addTo(markerLayer);
    }

    mapCountEl.textContent = `Đang hiển thị ${listings.length} điểm phụ phẩm trên bản đồ.`;
  }

  function renderListItems() {
    listStage.replaceChildren();
    if (loading || errorMessage || listings.length === 0) {
      return;
    }
    const wrapper = createEl('div', { className: 'divider-list' });
    const slice = listings.slice(0, visibleCount);
    for (const item of slice) {
      const cat = getByproductCategoryById(item.category) || getByproductCategoryById('phu-pham-khac');
      const offerPill = createEl('span', {
        className: `pill ${item.offerType === 'sell' ? 'pill-sell' : 'pill-green'}`,
        text: item.offerType === 'sell' ? 'Bán giá rẻ' : 'Cho miễn phí'
      });
      const row = createEl('div', { className: 'divider-row' },
        createEl('div', { className: 'listing-top' },
          createEl('span', { className: 'listing-category', text: `${cat.icon} ${cat.name}` }),
          offerPill
        ),
        createEl('p', { className: 'listing-hero-qty', text: formatQuantityHeadline(item) }),
        createEl('p', {
          className: 'listing-meta-line',
          text: `${formatDistanceLabel(item.distanceKm)} - ${formatRemainingTime(item.expiresAt)}`
        })
      );
      if (item.priceNote) {
        row.appendChild(createEl('p', { className: 'listing-note', text: `Giá gợi ý: ${item.priceNote}` }));
      }
      if (item.locationNote) {
        row.appendChild(createEl('p', { className: 'listing-note', text: `Địa điểm: ${item.locationNote}` }));
      }

      const actions = createEl('div', { className: 'listing-actions' });
      const telHref = buildTelHref(item.contactPhone);
      if (telHref) {
        actions.appendChild(createEl('a', {
          className: 'btn btn-primary',
          text: 'Gọi điện ngay',
          attrs: { href: telHref }
        }));
      }
      actions.appendChild(createEl('button', {
        type: 'button',
        className: 'btn btn-secondary',
        text: 'Chi tiết & Xong',
        onClick: (ev) => openDetailSheet(item, ev.currentTarget)
      }));
      row.appendChild(actions);
      wrapper.appendChild(row);
    }
    listStage.appendChild(wrapper);

    if (listings.length > visibleCount) {
      listStage.appendChild(createEl('div', { className: 'row-inline' },
        createEl('button', {
          type: 'button',
          className: 'btn btn-secondary',
          text: `Xem thêm (${listings.length - visibleCount} tin còn lại)`,
          onClick: () => {
            visibleCount += PAGE_SIZE;
            renderListItems();
          }
        })
      ));
    }
  }

  function renderStateBox() {
    stateBox.replaceChildren();
    if (loading) {
      stateBox.hidden = false;
      stateBox.appendChild(createEl('p', {
        className: 'field-hint',
        text: 'Đang tải danh sách phụ phẩm quanh bạn...'
      }));
      return;
    }
    if (errorMessage) {
      stateBox.hidden = false;
      stateBox.appendChild(createEl('div', { className: 'notice-box notice-red', text: errorMessage }));
      const actions = createEl('div', { className: 'row-inline' },
        createEl('button', {
          type: 'button',
          className: 'btn btn-inline-primary',
          text: 'Thử lại',
          onClick: () => loadListings()
        })
      );
      if (isOfflineError || !globalThis.navigator?.onLine) {
        actions.appendChild(createEl('button', {
          type: 'button',
          className: 'btn btn-secondary',
          text: 'Mở Công cụ tính giá',
          onClick: () => onNavigateCalc()
        }));
      }
      stateBox.appendChild(actions);
      return;
    }
    if (listings.length === 0) {
      stateBox.hidden = false;
      const hasFilter =
        filters.category !== 'all' || filters.offerType !== 'all' || filters.radiusKm !== 'all';
      stateBox.appendChild(createEl('p', {
        text: hasFilter
          ? 'Không có tin phụ phẩm nào khớp bộ lọc hiện tại.'
          : 'Chưa có tin phụ phẩm nào đang mở trong khu vực này.'
      }));
      const actions = createEl('div', { className: 'row-inline' });
      if (hasFilter) {
        actions.appendChild(createEl('button', {
          type: 'button',
          className: 'btn btn-secondary',
          text: 'Xóa bộ lọc',
          onClick: () => {
            filters = { category: 'all', offerType: 'all', radiusKm: 'all' };
            categorySelect.value = 'all';
            offerSelect.value = 'all';
            radiusSelect.value = 'all';
            loadListings();
          }
        }));
      }
      actions.appendChild(createEl('button', {
        type: 'button',
        className: 'btn btn-inline-primary',
        text: 'Đăng tin phụ phẩm',
        onClick: () => onNavigatePost()
      }));
      stateBox.appendChild(actions);
      return;
    }
    stateBox.hidden = true;
  }

  function showActionFeedback(message, kind = 'green') {
    feedbackBox.className = `notice-box ${kind === 'red' ? 'notice-red' : 'notice-green'}`;
    feedbackBox.textContent = message;
    feedbackBox.hidden = false;
  }

  function closeDetailSheet() {
    selectedListing = null;
    sheetBackdrop.hidden = true;
    sheetPanel.replaceChildren();
    if (lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
      lastTriggerEl.focus();
    }
    lastTriggerEl = null;
  }

  function openDetailSheet(listing, triggerEl) {
    selectedListing = listing;
    lastTriggerEl = triggerEl || document.activeElement;
    sheetPanel.replaceChildren();

    const cat = getByproductCategoryById(listing.category) || getByproductCategoryById('phu-pham-khac');
    const closeBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary sheet-close-btn',
      text: 'Đóng',
      attrs: { 'aria-label': 'Đóng chi tiết tin đăng' },
      onClick: () => closeDetailSheet()
    });

    const header = createEl('div', { className: 'sheet-header' },
      createEl('div', {},
        createEl('h2', { id: 'sheet-listing-title', className: 'section-heading', text: `${cat.icon} ${cat.name}` }),
        createEl('span', {
          className: `pill ${listing.offerType === 'sell' ? 'pill-sell' : 'pill-green'}`,
          text: listing.offerType === 'sell' ? 'Bán giá rẻ' : 'Cho miễn phí'
        })
      ),
      closeBtn
    );

    const detailsBlock = createEl('div', { className: 'sheet-section' },
      createEl('p', { className: 'listing-hero-qty', text: formatQuantityHeadline(listing) }),
      createEl('p', {
        className: 'listing-meta-line',
        text: `${formatDistanceLabel(listing.distanceKm)} - ${formatRemainingTime(listing.expiresAt)}`
      }),
      createEl('div', { className: 'row-inline' },
        createEl('span', { className: 'pill pill-gray', text: getAccessRoadLabel(listing.accessRoad) }),
        createEl('span', { className: 'pill pill-gray', text: getMoistureLabel(listing.moistureState) })
      ),
      createEl('p', {
        className: 'listing-note',
        text: `Người liên hệ: ${listing.contactName}${listing.isProxyPost ? ' (đăng giúp hộ)' : ''}`
      })
    );
    if (listing.priceNote) {
      detailsBlock.appendChild(createEl('p', { className: 'listing-note', text: `Ghi chú giá: ${listing.priceNote}` }));
    }
    if (listing.locationNote) {
      detailsBlock.appendChild(createEl('p', { className: 'listing-note', text: `Mốc địa điểm: ${listing.locationNote}` }));
    }
    if (listing.rawVoiceText) {
      detailsBlock.appendChild(createEl('p', { className: 'field-hint', text: `Câu nói gốc: "${listing.rawVoiceText}"` }));
    }

    const connectActions = createEl('div', { className: 'action-stack' });
    const isCollected = listing.status === 'collected';

    if (isCollected) {
      const collectedTimeStr = listing.collectedAt
        ? new Date(listing.collectedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        : 'gần đây';
      connectActions.appendChild(createEl('div', {
        className: 'notice-box notice-green',
        text: `✅ Đã thu gom xong vào lúc ${collectedTimeStr}. Nông dân đã hoàn tất dọn ruộng.`
      }));
    } else {
      const telHref = buildTelHref(listing.contactPhone);
      if (telHref) {
        connectActions.appendChild(createEl('a', {
          className: 'btn btn-primary',
          text: `Gọi điện ngay (${listing.contactPhone})`,
          attrs: { href: telHref }
        }));
      }
      const zaloAndDirRow = createEl('div', { className: 'row-inline' });
      const zaloHref = buildZaloHref(listing.contactPhone);
      if (zaloHref) {
        zaloAndDirRow.appendChild(createEl('a', {
          className: 'btn btn-secondary',
          text: 'Mở Zalo',
          attrs: { href: zaloHref, target: '_blank', rel: 'noopener noreferrer' }
        }));
      }
      const dirHref = buildDirectionsHref(listing.lat, listing.lng);
      if (dirHref) {
        zaloAndDirRow.appendChild(createEl('a', {
          className: 'btn btn-secondary',
          text: 'Chỉ đường',
          attrs: { href: dirHref, target: '_blank', rel: 'noopener noreferrer' }
        }));
      }
      if (zaloAndDirRow.childNodes.length > 0) {
        connectActions.appendChild(zaloAndDirRow);
      }
    }

    const sheetNotice = createEl('div', { className: 'notice-box', attrs: { hidden: true, role: 'status' } });
    const codeInput = createEl('input', {
      id: 'collect-short-code',
      className: 'text-input',
      type: 'text',
      attrs: { maxlength: '4', autocomplete: 'off', placeholder: 'Nhập 4 ký tự (VD: 7K4P)' }
    });
    const kgInput = createEl('input', {
      id: 'collect-actual-kg',
      className: 'text-input',
      type: 'text',
      attrs: { inputmode: 'decimal', value: String(listing.estimatedKg) }
    });
    kgInput.value = String(listing.estimatedKg);

    const collectSubmitBtn = createEl('button', {
      type: 'submit',
      className: 'btn btn-primary',
      text: 'Xác nhận đã thu gom xong'
    });

    const collectForm = createEl('form', { className: 'sheet-section' },
      createEl('h3', { className: 'section-heading', text: 'Đã thu gom xong' }),
      createEl('p', {
        className: 'field-hint',
        text: 'Nhập mã xác nhận 4 ký tự của chủ tin và khối lượng thực tế (kg).'
      }),
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Mã xác nhận 4 ký tự', attrs: { for: 'collect-short-code' } }),
        codeInput
      ),
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Khối lượng thu gom thực tế (kg)', attrs: { for: 'collect-actual-kg' } }),
        kgInput
      ),
      sheetNotice,
      collectSubmitBtn
    );

    collectForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (collectSubmitBtn.disabled) {
        return;
      }
      const shortCode = codeInput.value.trim().toUpperCase();
      const parsedKg = parseStrictNumber(kgInput.value);
      if (shortCode.length !== 4) {
        sheetNotice.className = 'notice-box notice-red';
        sheetNotice.textContent = 'Vui lòng nhập đủ 4 ký tự mã xác nhận.';
        sheetNotice.hidden = false;
        return;
      }
      if (parsedKg === null || parsedKg <= 0) {
        sheetNotice.className = 'notice-box notice-red';
        sheetNotice.textContent = 'Khối lượng thu gom thực tế phải là số dương hợp lệ.';
        sheetNotice.hidden = false;
        return;
      }

      collectSubmitBtn.disabled = true;
      sheetNotice.hidden = true;
      try {
        await collectListing(listing.id, {
          shortCode,
          actualKgCollected: parsedKg
        });
        closeDetailSheet();
        showActionFeedback(`Đã xác nhận thu gom xong ${formatViNumber(parsedKg, 1)} kg phụ phẩm!`, 'green');
        onImpactChanged();
        await loadListings();
      } catch (err) {
        sheetNotice.className = 'notice-box notice-red';
        sheetNotice.textContent = err?.message || 'Không thể xác nhận thu gom lúc này.';
        sheetNotice.hidden = false;
      } finally {
        collectSubmitBtn.disabled = false;
      }
    });

    const reportBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-subtle',
      text: 'Báo tin sai / đã dọn',
      onClick: async () => {
        if (reportBtn.disabled) {
          return;
        }
        reportBtn.disabled = true;
        sheetNotice.hidden = true;
        try {
          const updated = await reportListing(listing.id);
          if (updated && updated.status === 'reported') {
            closeDetailSheet();
            showActionFeedback('Đã ghi nhận báo cáo và tạm ẩn tin chờ quản trị viên kiểm tra.', 'green');
            await loadListings();
          } else {
            sheetNotice.className = 'notice-box notice-green';
            sheetNotice.textContent = 'Đã ghi nhận báo cáo của bạn. Cảm ơn bà con đã giúp dữ liệu chính xác.';
            sheetNotice.hidden = false;
          }
        } catch (err) {
          sheetNotice.className = 'notice-box notice-red';
          sheetNotice.textContent = err?.message || 'Không thể gửi báo cáo lúc này.';
          sheetNotice.hidden = false;
        } finally {
          reportBtn.disabled = false;
        }
      }
    });

    if (isCollected) {
      sheetPanel.append(header, detailsBlock, connectActions);
    } else {
      sheetPanel.append(header, detailsBlock, connectActions, collectForm, reportBtn);
    }
    sheetBackdrop.hidden = false;
    closeBtn.focus();
  }

  function requestGpsLocation() {
    if (!globalThis.navigator?.geolocation) {
      gpsStatusEl.textContent = 'Thiết bị không hỗ trợ GPS. Hãy chọn xã/phường ở ô bên dưới.';
      gpsStatusEl.hidden = false;
      return;
    }
    const currentSeq = ++gpsSeq;
    gpsStatusEl.textContent = 'Đang lấy vị trí GPS hiện tại...';
    gpsStatusEl.hidden = false;
    globalThis.navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (currentSeq !== gpsSeq) {
          return;
        }
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isValidCoordinates(lat, lng)) {
          return;
        }
        originCoords = { lat, lng };
        originSource = 'gps';
        communeSelect.value = '';
        gpsStatusEl.textContent = `Đã định vị tại ${lat.toFixed(4)}, ${lng.toFixed(4)}.`;
        gpsStatusEl.hidden = false;
        if (mapInstance) {
          mapInstance.setView([lat, lng], 13);
        }
        loadListings();
      },
      () => {
        if (currentSeq !== gpsSeq) {
          return;
        }
        gpsStatusEl.textContent = 'Không lấy được GPS. Bà con hãy chọn xã/phường tham chiếu bên trên.';
        gpsStatusEl.hidden = false;
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  }

  async function loadListings() {
    if (activeAbort) {
      activeAbort.abort();
    }
    const controller = new AbortController();
    activeAbort = controller;

    loading = true;
    errorMessage = '';
    isOfflineError = false;
    renderStateBox();

    const origin = getEffectiveOrigin();
    try {
      const items = await fetchListings(
        {
          category: filters.category,
          offerType: filters.offerType,
          radiusKm: filters.radiusKm,
          lat: origin.lat,
          lng: origin.lng,
          limit: 200
        },
        { signal: controller.signal }
      );
      if (activeAbort !== controller) {
        return;
      }
      listings = sortByDistance(items, origin.lat, origin.lng);
      visibleCount = PAGE_SIZE;
      loading = false;
      renderStateBox();
      if (viewMode === 'map') {
        renderMapMarkers();
      } else {
        renderListItems();
      }
    } catch (err) {
      if (isAbortError(err) || activeAbort !== controller) {
        return;
      }
      loading = false;
      listings = [];
      isOfflineError = Boolean(err?.isOffline || err?.isNetworkError || !globalThis.navigator?.onLine);
      errorMessage = err?.message || 'Không thể tải danh sách phụ phẩm.';
      renderStateBox();
      renderMapMarkers();
      renderListItems();
    }
  }

  categorySelect.addEventListener('change', () => {
    filters.category = categorySelect.value;
    const allCards = byproductCardsRow.querySelectorAll('.byproduct-3d-card');
    for (const c of allCards) {
      c.classList.toggle('is-active-3d', c.getAttribute('data-category-id') === categorySelect.value);
    }
    loadListings();
  });
  offerSelect.addEventListener('change', () => {
    filters.offerType = offerSelect.value;
    loadListings();
  });
  radiusSelect.addEventListener('change', () => {
    filters.radiusKm = radiusSelect.value;
    loadListings();
  });
  communeSelect.addEventListener('change', () => {
    gpsSeq += 1;
    const region = getRegion();
    const idxStr = communeSelect.value;
    if (idxStr === '') {
      originCoords = null;
      originSource = 'region';
      gpsStatusEl.hidden = true;
    } else {
      const idx = parseStrictInt(idxStr);
      const commune = idx !== null && idx >= 0 ? region.communes[idx] : null;
      if (commune) {
        originCoords = { lat: commune.lat, lng: commune.lng };
        originSource = 'commune';
        gpsStatusEl.textContent = `Đang xem quanh ${commune.name}.`;
        gpsStatusEl.hidden = false;
      }
    }
    const target = getEffectiveOrigin();
    if (mapInstance) {
      mapInstance.setView([target.lat, target.lng], getRegion().defaultZoom || 13);
    }
    loadListings();
  });

  syncCommuneOptions();

  return {
    onShow() {
      if (!mounted) {
        mounted = true;
        setViewMode('map');
        loadListings();
      } else if (viewMode === 'map' && mapInstance) {
        setTimeout(() => mapInstance.invalidateSize(), 50);
      }
    },
    onRegionChanged() {
      gpsSeq += 1;
      originCoords = null;
      originSource = 'region';
      gpsStatusEl.hidden = true;
      syncCommuneOptions();
      const region = getRegion();
      if (mapInstance) {
        mapInstance.setView(region.center, region.defaultZoom);
      }
      if (mounted) {
        loadListings();
      }
    },
    refresh() {
      if (mounted) {
        loadListings();
      }
    }
  };
}
