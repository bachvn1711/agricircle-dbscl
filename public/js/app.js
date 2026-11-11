import { DEFAULT_CROPS } from '/shared/crops.js';
import { DEFAULT_REGION_ID, REGIONS, getRegionById, isValidRegionId } from '/shared/regions.js';
import { fetchCrops, flushCalcMetric } from './api.js';
import { createAdminView } from './admin-view.js';
import { createCalculatorView } from './calculator-view.js';
import { createImpactView } from './impact-view.js';
import { createMapView } from './map-view.js';
import { createPostFormView } from './post-form.js';
import {
  ackCalcBatch,
  createEl,
  formatViNumber,
  generateClientRequestId,
  getBrowserStorage,
  getPendingCalcCount,
  readSelectedRegionId,
  saveSelectedRegionId,
  sealCalcBatches
} from './state.js';

const storage = getBrowserStorage();
let activeTab = 'map';
let selectedRegionId = readSelectedRegionId(storage, isValidRegionId, DEFAULT_REGION_ID);
let cropsCache = DEFAULT_CROPS.map((c) => ({ ...c }));
let isFlushingMetrics = false;
let flushTimerId = null;
let flushFailureCount = 0;

const regionSelect = document.getElementById('region-select');
const statusStrip = document.getElementById('global-status-strip');
const brandHomeBtn = document.getElementById('brand-home-btn');
const headerAdminBtn = document.getElementById('header-admin-btn');
const navButtons = Array.from(document.querySelectorAll('[data-tab]'));

const panels = {
  map: document.getElementById('view-map'),
  post: document.getElementById('view-post'),
  calc: document.getElementById('view-calc'),
  impact: document.getElementById('view-impact'),
  admin: document.getElementById('view-admin')
};

for (const region of REGIONS) {
  regionSelect.appendChild(createEl('option', {
    text: region.shortName,
    attrs: { value: region.id }
  }));
}
regionSelect.value = selectedRegionId;

function getRegion() {
  return getRegionById(selectedRegionId);
}

function getCrops() {
  return cropsCache;
}

function renderStatusStrip() {
  const isOffline = globalThis.navigator?.onLine === false;
  const pendingCalc = getPendingCalcCount(storage);
  const host = globalThis.location?.hostname || '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  const showLanHttpTip = globalThis.isSecureContext === false && !isLocalHost;

  if (!isOffline && pendingCalc === 0 && !showLanHttpTip) {
    statusStrip.hidden = true;
    statusStrip.replaceChildren();
    return;
  }

  statusStrip.replaceChildren();
  const messages = [];
  if (isOffline) {
    messages.push('Đang mất kết nối mạng. Công cụ Tính giá vẫn hoạt động bình thường.');
  }
  if (pendingCalc > 0) {
    messages.push(`Có ${formatViNumber(pendingCalc, 0)} lượt tính giá đang chờ đồng bộ.`);
  }
  if (showLanHttpTip) {
    messages.push('Đang truy cập qua HTTP mạng nội bộ: nếu trình duyệt khóa Micro hoặc GPS, hãy dùng 6 ô chọn nhanh và chọn xã/phường hoặc kéo ghim.');
  }

  statusStrip.appendChild(createEl('p', { className: 'status-strip-text', text: messages.join(' ') }));
  if (isOffline && activeTab !== 'calc') {
    statusStrip.appendChild(createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      text: 'Mở Tính giá',
      onClick: () => switchTab('calc')
    }));
  }
  statusStrip.hidden = false;
}

async function flushQueuedCalcMetrics() {
  if (isFlushingMetrics || globalThis.navigator?.onLine === false) {
    return;
  }
  isFlushingMetrics = true;
  try {
    const sealed = sealCalcBatches(storage, () => generateClientRequestId('calc'));
    if (sealed.sealedBatches.length === 0) {
      flushFailureCount = 0;
      return;
    }
    for (const batch of sealed.sealedBatches) {
      if (globalThis.navigator?.onLine === false) {
        break;
      }
      await flushCalcMetric({
        delta: batch.delta,
        clientRequestId: batch.batchId
      });
      ackCalcBatch(storage, batch.batchId);
    }
    flushFailureCount = 0;
    calcView.onMetricsFlushed();
    renderStatusStrip();
    if (activeTab === 'impact') {
      impactView.refresh();
    }
  } catch {
    flushFailureCount += 1;
    calcView.onMetricsFlushed();
    renderStatusStrip();
  } finally {
    isFlushingMetrics = false;
    if (getPendingCalcCount(storage) > 0 && globalThis.navigator?.onLine !== false && !globalThis.document?.hidden) {
      scheduleFlushCalcMetrics();
    }
  }
}

function scheduleFlushCalcMetrics() {
  if (globalThis.navigator?.onLine === false || globalThis.document?.hidden) {
    return;
  }
  if (flushTimerId !== null) {
    clearTimeout(flushTimerId);
  }
  const delayMs = Math.min(30000, 700 * Math.pow(2, Math.min(flushFailureCount, 5)));
  flushTimerId = setTimeout(() => {
    flushTimerId = null;
    flushQueuedCalcMetrics();
  }, delayMs);
}

async function loadRemoteCrops() {
  try {
    const remoteCrops = await fetchCrops();
    if (Array.isArray(remoteCrops) && remoteCrops.length > 0) {
      cropsCache = remoteCrops;
      calcView.onCropsUpdated();
    }
  } catch {
  }
}

const mapView = createMapView({
  container: panels.map,
  getRegion,
  onNavigatePost: () => switchTab('post'),
  onNavigateCalc: () => switchTab('calc'),
  onImpactChanged: () => impactView.refresh()
});

const postView = createPostFormView({
  container: panels.post,
  getRegion,
  onListingCreated: () => {
    mapView.refresh();
    impactView.refresh();
  },
  onNavigateMap: () => switchTab('map')
});

const calcView = createCalculatorView({
  container: panels.calc,
  getCrops,
  onCalcQueued: () => {
    renderStatusStrip();
    scheduleFlushCalcMetrics();
  },
  onTransferToPost: (draft) => {
    postView.applyExternalDraft(draft);
    switchTab('post');
  }
});

const impactView = createImpactView({
  container: panels.impact,
  onNavigatePost: () => switchTab('post'),
  onNavigateCalc: () => switchTab('calc')
});

const adminView = createAdminView({
  container: panels.admin,
  getCrops,
  onCropsChanged: () => loadRemoteCrops(),
  onListingsChanged: () => {
    mapView.refresh();
    impactView.refresh();
  }
});

const views = {
  map: mapView,
  post: postView,
  calc: calcView,
  impact: impactView,
  admin: adminView
};

function switchTab(nextTab) {
  if (!Object.hasOwn(panels, nextTab)) {
    return;
  }
  activeTab = nextTab;
  for (const [key, panel] of Object.entries(panels)) {
    panel.hidden = key !== nextTab;
  }
  for (const btn of navButtons) {
    const isActive = btn.dataset.tab === nextTab;
    btn.classList.toggle('is-active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  }
  renderStatusStrip();
  views[nextTab].onShow();
}

for (const btn of navButtons) {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    if (target) {
      switchTab(target);
    }
  });
}

brandHomeBtn.addEventListener('click', () => switchTab('map'));
if (headerAdminBtn) {
  headerAdminBtn.dataset.tab = 'admin';
}

regionSelect.addEventListener('change', () => {
  const nextId = regionSelect.value;
  if (!isValidRegionId(nextId)) {
    return;
  }
  selectedRegionId = saveSelectedRegionId(storage, nextId, isValidRegionId, DEFAULT_REGION_ID);
  mapView.onRegionChanged();
  postView.onRegionChanged();
});

globalThis.addEventListener('online', () => {
  renderStatusStrip();
  postView.onConnectivityChanged();
  adminView.onConnectivityChanged(true);
  flushQueuedCalcMetrics();
  loadRemoteCrops();
});

globalThis.addEventListener('offline', () => {
  renderStatusStrip();
  postView.onConnectivityChanged();
  adminView.onConnectivityChanged(false);
});

globalThis.document?.addEventListener?.('visibilitychange', () => {
  if (!globalThis.document.hidden && globalThis.navigator?.onLine !== false) {
    scheduleFlushCalcMetrics();
  }
});

if (globalThis.navigator?.serviceWorker) {
  globalThis.navigator.serviceWorker.register('/sw.js', { type: 'module' }).catch(() => {
  });
}

renderStatusStrip();
switchTab('map');
loadRemoteCrops();
flushQueuedCalcMetrics();
