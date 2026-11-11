import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildDirectionsHref,
  buildTelHref,
  buildZaloHref,
  enqueueOfflineCalc,
  formatRemainingTime,
  formatVnd,
  generateClientRequestId,
  getPendingCalcCount,
  isSafeVnPhone,
  parseStrictInt,
  parseStrictNumber,
  readFarmerProfile,
  readSelectedRegionId,
  saveFarmerProfile,
  saveSelectedRegionId
} from '../public/js/state.js';
import {
  CACHE_NAME,
  PRECACHE_URLS,
  classifyCacheRoute
} from '../public/js/sw-routes.js';
import { ApiError, fetchAdminListings } from '../public/js/api.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

let hooksInstalled = false;
function ensureWebRootImportHook() {
  if (hooksInstalled) {
    return;
  }
  hooksInstalled = true;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('/shared/')) {
        const target = path.join(REPO_ROOT, 'src', 'shared', specifier.slice('/shared/'.length));
        return nextResolve(pathToFileURL(target).href, context);
      }
      if (specifier.startsWith('/js/')) {
        const target = path.join(REPO_ROOT, 'public', 'js', specifier.slice('/js/'.length));
        return nextResolve(pathToFileURL(target).href, context);
      }
      return nextResolve(specifier, context);
    }
  });
}

function createMemoryStorage(initial = {}, opts = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(k) {
      if (opts.throwGet) {
        throw new Error('SecurityError');
      }
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      if (opts.throwSet) {
        throw new Error('QuotaExceededError');
      }
      map.set(k, String(v));
    },
    removeItem(k) {
      map.delete(k);
    }
  };
}

function createFakeDom() {
  class FakeClassList {
    constructor(node) {
      this.node = node;
    }
    _tokens() {
      const raw = this.node._attrs.get('class') || '';
      return raw ? raw.trim().split(/\s+/) : [];
    }
    _save(tokens) {
      if (tokens.length === 0) {
        this.node._attrs.delete('class');
      } else {
        this.node._attrs.set('class', tokens.join(' '));
      }
    }
    contains(cls) {
      return this._tokens().includes(cls);
    }
    add(...items) {
      const set = new Set(this._tokens());
      for (const item of items) {
        set.add(item);
      }
      this._save([...set]);
    }
    remove(...items) {
      const removeSet = new Set(items);
      this._save(this._tokens().filter((t) => !removeSet.has(t)));
    }
    toggle(cls, force) {
      const has = this.contains(cls);
      const next = force === undefined ? !has : Boolean(force);
      if (next) {
        this.add(cls);
      } else {
        this.remove(cls);
      }
      return next;
    }
  }

  class FakeNode {
    constructor(nodeType, text = '') {
      this.nodeType = nodeType;
      this.parentNode = null;
      this.childNodes = [];
      this._text = text;
    }
    get textContent() {
      if (this.nodeType === 3) {
        return this._text;
      }
      return this.childNodes.map((c) => c.textContent).join('');
    }
    set textContent(val) {
      if (this.nodeType === 3) {
        this._text = String(val ?? '');
        return;
      }
      this.childNodes = [];
      if (val !== null && val !== undefined && val !== '') {
        this.appendChild(new FakeNode(3, String(val)));
      }
    }
    appendChild(child) {
      if (child.parentNode) {
        const idx = child.parentNode.childNodes.indexOf(child);
        if (idx >= 0) {
          child.parentNode.childNodes.splice(idx, 1);
        }
      }
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
  }

  class FakeElement extends FakeNode {
    constructor(tagName) {
      super(1);
      this.tagName = tagName.toUpperCase();
      this._attrs = new Map();
      this.dataset = {};
      this.style = {};
      this.listeners = new Map();
      this.classList = new FakeClassList(this);
      this.value = '';
      this.checked = false;
      this.disabled = false;
      this.hidden = false;
      this.type = '';
      this.options = [];
      this.selectedIndex = 0;
    }
    get id() {
      return this._attrs.get('id') || '';
    }
    set id(v) {
      if (v) {
        this._attrs.set('id', String(v));
      } else {
        this._attrs.delete('id');
      }
    }
    get className() {
      return this._attrs.get('class') || '';
    }
    set className(v) {
      if (v) {
        this._attrs.set('class', String(v));
      } else {
        this._attrs.delete('class');
      }
    }
    setAttribute(k, v) {
      const val = String(v);
      this._attrs.set(k, val);
      if (k === 'value') {
        this.value = val;
      }
    }
    getAttribute(k) {
      return this._attrs.has(k) ? this._attrs.get(k) : null;
    }
    hasAttribute(k) {
      return this._attrs.has(k);
    }
    append(...nodes) {
      for (const n of nodes) {
        this.appendChild(n);
      }
    }
    appendChild(child) {
      super.appendChild(child);
      if (this.tagName === 'SELECT' && child.tagName === 'OPTION') {
        this.options.push(child);
        if (this.options.length === 1 && !this.value) {
          this.value = child.value;
        }
      }
      return child;
    }
    replaceChildren(...nodes) {
      this.childNodes = [];
      this.options = [];
      for (const n of nodes) {
        if (n !== null && n !== undefined) {
          this.appendChild(n);
        }
      }
    }
    remove() {
      if (this.parentNode) {
        const idx = this.parentNode.childNodes.indexOf(this);
        if (idx >= 0) {
          this.parentNode.childNodes.splice(idx, 1);
        }
        this.parentNode = null;
      }
    }
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, []);
      }
      this.listeners.get(type).push(fn);
    }
    dispatchEvent(event) {
      const ev = typeof event === 'string' ? { type: event } : event;
      if (typeof ev.preventDefault !== 'function') {
        ev.preventDefault = () => {};
      }
      if (!ev.currentTarget) {
        ev.currentTarget = this;
      }
      if (!ev.target) {
        ev.target = this;
      }
      const list = this.listeners.get(ev.type) || [];
      for (const fn of [...list]) {
        fn(ev);
      }
    }
    click() {
      if (this.disabled) {
        return;
      }
      this.dispatchEvent({ type: 'click', currentTarget: this, target: this });
      if (this.type === 'submit') {
        let p = this.parentNode;
        while (p && p.tagName !== 'FORM') {
          p = p.parentNode;
        }
        if (p) {
          p.dispatchEvent({ type: 'submit', currentTarget: p, target: p });
        }
      }
    }
    focus() {
      document.activeElement = this;
    }
    scrollIntoView() {}
    querySelectorAll(selector) {
      const results = [];
      const walk = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType === 1) {
            if (matchesSelector(child, selector)) {
              results.push(child);
            }
            walk(child);
          }
        }
      };
      walk(this);
      return results;
    }
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }
  }

  function matchesSimple(el, part) {
    if (part.startsWith('#')) {
      return el.id === part.slice(1);
    }
    if (part.startsWith('.')) {
      return el.classList.contains(part.slice(1));
    }
    const attrMatch = part.match(/^\[([^=\]]+)="([^"]*)"\]$/);
    if (attrMatch) {
      return el.getAttribute(attrMatch[1]) === attrMatch[2];
    }
    return el.tagName === part.toUpperCase();
  }

  function matchesSelector(el, selector) {
    const parts = selector.trim().split(/\s+/);
    const leaf = parts[parts.length - 1];
    const subMatches = leaf.match(/(#[A-Za-z0-9_-]+|\.[A-Za-z0-9_-]+|\[[^\]]+\]|[A-Za-z0-9_-]+)/g);
    if (!subMatches || !subMatches.every((p) => matchesSimple(el, p))) {
      return false;
    }
    if (parts.length === 1) {
      return true;
    }
    const parentTarget = parts.slice(0, -1).join(' ');
    let p = el.parentNode;
    while (p && p.nodeType === 1) {
      if (matchesSelector(p, parentTarget)) {
        return true;
      }
      p = p.parentNode;
    }
    return false;
  }

  const rootBody = new FakeElement('body');
  const document = {
    body: rootBody,
    activeElement: null,
    listeners: new Map(),
    createElement(tag) {
      return new FakeElement(tag);
    },
    createTextNode(text) {
      return new FakeNode(3, String(text));
    },
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, []);
      }
      this.listeners.get(type).push(fn);
    },
    querySelector(sel) {
      return rootBody.querySelector(sel);
    },
    querySelectorAll(sel) {
      return rootBody.querySelectorAll(sel);
    }
  };
  return { document, rootBody };
}

async function withPatchedGlobals(patches, fn) {
  const saved = new Map();
  for (const [key, value] of Object.entries(patches)) {
    const desc = Object.getOwnPropertyDescriptor(globalThis, key);
    saved.set(key, desc || null);
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
      enumerable: true
    });
  }
  try {
    return await fn();
  } finally {
    for (const [key, desc] of saved.entries()) {
      if (desc) {
        Object.defineProperty(globalThis, key, desc);
      } else {
        delete globalThis[key];
      }
    }
  }
}

describe('pwa-ui extra edge cases and security helpers', () => {
  it('validates tel:, Zalo, and Google Maps hrefs strictly against injection schemes [R6, FM7]', () => {
    assert.equal(isSafeVnPhone('0912345678'), true);
    assert.equal(buildTelHref('0912345678'), 'tel:0912345678');
    assert.equal(buildZaloHref('0912345678'), 'https://zalo.me/0912345678');

    const badPhones = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      '091234567',
      '09123456789',
      '1912345678',
      '09123abc78',
      '',
      null,
      undefined
    ];
    for (const phone of badPhones) {
      assert.equal(isSafeVnPhone(phone), false);
      assert.equal(buildTelHref(phone), null);
      assert.equal(buildZaloHref(phone), null);
    }

    assert.equal(
      buildDirectionsHref(10.0452, 105.7469),
      'https://www.google.com/maps/dir/?api=1&destination=10.0452,105.7469'
    );
    assert.equal(buildDirectionsHref(91, 105), null);
    assert.equal(buildDirectionsHref(10, 181), null);
    assert.equal(buildDirectionsHref('10', '105'), null);
    assert.equal(buildDirectionsHref(Number.NaN, 105), null);
  });

  it('parseStrictNumber and parseStrictInt handle Vietnamese commas and avoid JS parseInt/Number traps', () => {
    assert.equal(parseStrictNumber('2,5'), 2.5);
    assert.equal(parseStrictNumber(' 10.25 '), 10.25);
    assert.equal(parseStrictNumber('-1'), -1);
    assert.equal(parseStrictNumber(''), null);
    assert.equal(parseStrictNumber('   '), null);
    assert.equal(parseStrictNumber('12abc'), null);
    assert.equal(parseStrictNumber('Infinity'), null);
    assert.equal(parseStrictNumber(null), null);

    assert.equal(parseStrictInt('0'), 0);
    assert.equal(parseStrictInt('14'), 14);
    assert.equal(parseStrictInt('12.5'), null);
    assert.equal(parseStrictInt('12px'), null);
    assert.equal(parseStrictInt(''), null);
  });

  it('generateClientRequestId matches backend CLIENT_REQUEST_ID_REGEX without crypto.randomUUID', () => {
    const id1 = generateClientRequestId('calc');
    const id2 = generateClientRequestId('post');
    assert.match(id1, /^[A-Za-z0-9_-]{16,64}$/);
    assert.match(id2, /^[A-Za-z0-9_-]{16,64}$/);
    assert.notEqual(id1, id2);
  });

  it('farmer profile, region selection, and pending calc count behave safely under normal and throwing storage', () => {
    const storage = createMemoryStorage();
    assert.deepEqual(readFarmerProfile(storage), { contactName: '', contactPhone: '' });
    saveFarmerProfile(storage, { contactName: 'Chú Hai', contactPhone: '0912345678' });
    assert.deepEqual(readFarmerProfile(storage), { contactName: 'Chú Hai', contactPhone: '0912345678' });

    const validator = (id) => id === 'dbscl' || id === 'mien_bac' || id === 'mien_trung';
    assert.equal(readSelectedRegionId(storage, validator, 'dbscl'), 'dbscl');
    saveSelectedRegionId(storage, 'mien_bac', validator, 'dbscl');
    assert.equal(readSelectedRegionId(storage, validator, 'dbscl'), 'mien_bac');
    saveSelectedRegionId(storage, 'invalid_region', validator, 'dbscl');
    assert.equal(readSelectedRegionId(storage, validator, 'dbscl'), 'mien_bac');

    enqueueOfflineCalc(storage, 7);
    assert.equal(getPendingCalcCount(storage), 7);

    const throwingStorage = createMemoryStorage({}, { throwGet: true, throwSet: true });
    assert.deepEqual(readFarmerProfile(throwingStorage), { contactName: '', contactPhone: '' });
    assert.equal(getPendingCalcCount(throwingStorage), 0);
  });

  it('formatRemainingTime and formatVnd output valid Vietnamese strings', () => {
    const now = 1_700_000_000_000;
    assert.equal(formatRemainingTime(now - 1000, now), 'Đã hết hạn');
    assert.equal(formatRemainingTime(now + 2 * 3600 * 1000, now), 'Còn 2 giờ');
    assert.equal(formatRemainingTime(now + 3 * 86400 * 1000, now), 'Còn 3 ngày');
    assert.match(formatVnd(17000), /^17\.000\sđ$/);
  });

  it('classifyCacheRoute blocks traversal and query bypass while PRECACHE_URLS lists only existing static assets', () => {
    assert.equal(CACHE_NAME, 'khkt-pwa-v2');
    assert.equal(classifyCacheRoute('/api/admin/listings?limit=50', 'GET'), 'network-only');
    assert.equal(classifyCacheRoute('/js/../api/admin/listings', 'GET'), 'network-only');
    assert.equal(classifyCacheRoute('/icons/%2e%2e%2fapi%2flistings', 'GET'), 'network-only');
    assert.equal(classifyCacheRoute('/icons/%2E%2E%2Fapi%2Fadmin%2Flistings', 'GET'), 'network-only');
    assert.equal(classifyCacheRoute('/styles/..\\app.css', 'GET'), 'network-only');
    assert.equal(classifyCacheRoute('/api/crops?t=123', 'GET'), 'network-first');
    assert.equal(PRECACHE_URLS.includes('/api/crops'), true);
    assert.equal(PRECACHE_URLS.includes('/js/sw-routes.js'), true);
    assert.equal(PRECACHE_URLS.some((u) => u.startsWith('/api/admin')), false);
    assert.equal(PRECACHE_URLS.includes('/index.html'), false);

    for (const url of PRECACHE_URLS) {
      if (url === '/' || url === '/api/crops') {
        continue;
      }
      let fsPath;
      if (url.startsWith('/shared/')) {
        fsPath = path.join(REPO_ROOT, 'src', 'shared', url.slice('/shared/'.length));
      } else if (url.startsWith('/vendor/leaflet/')) {
        fsPath = path.join(REPO_ROOT, 'node_modules', 'leaflet', 'dist', url.slice('/vendor/leaflet/'.length));
      } else {
        fsPath = path.join(REPO_ROOT, 'public', url.slice(1));
      }
      assert.equal(fs.existsSync(fsPath), true, `Missing precache asset on disk: ${url}`);
    }
  });

  it('distinguishes SW synthetic offline 503 header from real server 503 PIN error in api.js and sw.js [R12, FM4]', async () => {
    ensureWebRootImportHook();

    await withPatchedGlobals({
      navigator: { onLine: true },
      fetch: async () => new Response(JSON.stringify({ error: 'Đang mất kết nối mạng' }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-AgriCircle-Offline': '1'
        }
      })
    }, async () => {
      await assert.rejects(
        () => fetchAdminListings(),
        (err) => err instanceof ApiError && err.status === 503 && err.isOffline === true && err.isNetworkError === true
      );
    });

    await withPatchedGlobals({
      navigator: { onLine: true },
      fetch: async () => new Response(JSON.stringify({ error: 'Chưa cấu hình mã PIN quản trị hợp lệ' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }, async () => {
      await assert.rejects(
        () => fetchAdminListings(),
        (err) => err instanceof ApiError && err.status === 503 && err.isOffline === false && err.isNetworkError === false
      );
    });

    const swListeners = new Map();
    await withPatchedGlobals({
      self: {
        location: { origin: 'http://127.0.0.1:4103' },
        skipWaiting() {},
        clients: { claim: async () => {} },
        addEventListener(type, fn) {
          swListeners.set(type, fn);
        }
      },
      caches: {
        async open() {
          return { async match() { return null; }, async put() {} };
        },
        async keys() { return []; },
        async delete() { return true; }
      },
      fetch: async () => {
        throw new TypeError('Failed to fetch');
      }
    }, async () => {
      await import(`../public/sw.js?test=${Date.now()}`);
      const fetchHandler = swListeners.get('fetch');
      assert.equal(typeof fetchHandler, 'function');
      let respondedPromise = null;
      fetchHandler({
        request: { url: 'http://127.0.0.1:4103/api/admin/listings', method: 'GET', mode: 'cors' },
        respondWith(p) {
          respondedPromise = p;
        }
      });
      const offlineResp = await respondedPromise;
      assert.equal(offlineResp.status, 503);
      assert.equal(offlineResp.headers.get('X-AgriCircle-Offline'), '1');
    });
  });

  it('calculator-view caps daysAfterHarvest at 3647 and handles rapid TTS clicks without dropping focus [R8, R9]', async () => {
    ensureWebRootImportHook();
    const { document, rootBody } = createFakeDom();
    const { DEFAULT_CROPS } = await import('../src/shared/crops.js');
    const container = document.createElement('section');
    rootBody.appendChild(container);

    const spokenUtterances = [];
    const synthMock = {
      speak(u) {
        spokenUtterances.push(u);
      },
      cancel() {
        const prev = spokenUtterances[0];
        if (prev && typeof prev.onerror === 'function') {
          queueMicrotask(() => prev.onerror());
        }
      }
    };
    class FakeUtterance {
      constructor(text) {
        this.text = text;
        this.lang = '';
        this.onend = null;
        this.onerror = null;
      }
    }

    await withPatchedGlobals({
      document,
      localStorage: createMemoryStorage(),
      navigator: { onLine: true },
      speechSynthesis: synthMock,
      SpeechSynthesisUtterance: FakeUtterance
    }, async () => {
      const { createCalculatorView } = await import('../public/js/calculator-view.js');
      createCalculatorView({
        container,
        getCrops: () => DEFAULT_CROPS.map((c) => ({ ...c })),
        onCalcQueued: () => {},
        onTransferToPost: () => {}
      });

      const daysInput = container.querySelector('#calc-days-input');
      assert.ok(daysInput);

      assert.doesNotThrow(() => {
        daysInput.value = '3648';
        daysInput.dispatchEvent({ type: 'input' });
      });
      const errNotice = container.querySelector('.notice-red');
      assert.equal(errNotice.hidden, false);
      assert.match(errNotice.textContent, /3647/);

      daysInput.value = '3647';
      daysInput.dispatchEvent({ type: 'input' });
      assert.equal(errNotice.hidden, true);

      const plusDayBtn = container.querySelectorAll('button').find((b) => b.textContent === '+1 ngày');
      plusDayBtn.click();
      assert.equal(daysInput.value, '3647');

      const speakBtn1 = container.querySelectorAll('button').find((b) => b.textContent.includes('Nghe kết quả'));
      speakBtn1.focus();
      speakBtn1.click();
      speakBtn1.click();
      await Promise.resolve();

      const speakBtnAfter = container.querySelectorAll('button').find((b) => b.textContent.includes('Đang đọc kết quả'));
      assert.equal(speakBtnAfter, speakBtn1);
      assert.equal(document.activeElement, speakBtn1);

      const secondUtterance = spokenUtterances[1];
      assert.ok(secondUtterance);
      secondUtterance.onend();
      assert.match(speakBtn1.textContent, /Nghe kết quả/);
    });
  });

  it('admin-view handles offline 503 as amber notice, real 503 as red error, and assigns unique label ids on listing edit [R12]', async () => {
    ensureWebRootImportHook();
    const { document, rootBody } = createFakeDom();
    const { DEFAULT_CROPS } = await import('../src/shared/crops.js');

    await withPatchedGlobals({
      document,
      navigator: { onLine: true },
      fetch: async () => new Response(JSON.stringify({ error: 'Đang mất kết nối mạng' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'X-AgriCircle-Offline': '1' }
      })
    }, async () => {
      const { createAdminView } = await import('../public/js/admin-view.js');
      const container = document.createElement('section');
      rootBody.appendChild(container);
      const view = createAdminView({
        container,
        getCrops: () => DEFAULT_CROPS,
        onCropsChanged: () => {},
        onListingsChanged: () => {}
      });
      view.onShow();
      await new Promise((r) => setTimeout(r, 15));
      assert.ok(container.querySelector('.notice-amber'));
      assert.equal(container.querySelector('.notice-red'), null);
    });

    await withPatchedGlobals({
      document,
      navigator: { onLine: true },
      fetch: async () => new Response(JSON.stringify({ error: 'Chưa cấu hình mã PIN quản trị hợp lệ' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }, async () => {
      const { createAdminView } = await import('../public/js/admin-view.js');
      const container = document.createElement('section');
      rootBody.appendChild(container);
      const view = createAdminView({
        container,
        getCrops: () => DEFAULT_CROPS,
        onCropsChanged: () => {},
        onListingsChanged: () => {}
      });
      view.onShow();
      await new Promise((r) => setTimeout(r, 15));
      assert.ok(container.querySelector('.notice-red'));
      assert.equal(container.querySelector('.notice-amber'), null);
    });

    const sampleListing = {
      id: 42,
      category: 'rom-ra',
      offerType: 'free',
      priceNote: '',
      rawQuantity: 2,
      rawUnit: 'cong_nam_bo',
      estimatedKg: 1111,
      locationNote: 'Gan dinh lang',
      contactName: 'Chu Hai',
      contactPhone: '0912345678',
      status: 'active',
      reportCount: 0,
      expiresAt: Date.now() + 86400000
    };

    await withPatchedGlobals({
      document,
      navigator: { onLine: true },
      fetch: async () => new Response(JSON.stringify({ listings: [sampleListing] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }, async () => {
      const { createAdminView } = await import('../public/js/admin-view.js');
      const container = document.createElement('section');
      rootBody.appendChild(container);
      const view = createAdminView({
        container,
        getCrops: () => DEFAULT_CROPS,
        onCropsChanged: () => {},
        onListingsChanged: () => {}
      });
      view.onShow();
      await new Promise((r) => setTimeout(r, 15));

      const editBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Sửa thông tin');
      assert.ok(editBtn);
      editBtn.click();

      const editForm = container.querySelector('form');
      assert.ok(editForm);
      const labels = editForm.querySelectorAll('label');
      const controls = [...editForm.querySelectorAll('select'), ...editForm.querySelectorAll('input')];
      assert.equal(labels.length, 7);
      assert.equal(controls.length, 7);
      const ids = new Set(controls.map((el) => el.id).filter(Boolean));
      assert.equal(ids.size, 7);
      for (const label of labels) {
        const forId = label.getAttribute('for');
        assert.ok(forId && ids.has(forId), `Label "${label.textContent}" missing matching control id (${forId})`);
      }
    });
  });

  it('map-view ignores stale GPS callback after manual commune selection or region change [R4, FM5]', async () => {
    ensureWebRootImportHook();
    const { document, rootBody } = createFakeDom();
    const { getRegionById } = await import('../src/shared/regions.js');
    let currentRegionId = 'dbscl';
    let pendingGpsSuccess = null;

    await withPatchedGlobals({
      document,
      innerWidth: 1280,
      navigator: {
        onLine: true,
        geolocation: {
          getCurrentPosition(success) {
            pendingGpsSuccess = success;
          }
        }
      },
      fetch: async () => new Response(JSON.stringify({ listings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }, async () => {
      const { createMapView } = await import('../public/js/map-view.js');
      const container = document.createElement('section');
      rootBody.appendChild(container);
      const view = createMapView({
        container,
        getRegion: () => getRegionById(currentRegionId),
        onNavigatePost: () => {},
        onNavigateCalc: () => {},
        onImpactChanged: () => {}
      });
      view.onShow();
      await new Promise((r) => setTimeout(r, 15));

      const gpsBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Về vị trí tôi');
      gpsBtn.click();
      assert.equal(typeof pendingGpsSuccess, 'function');

      const communeSel = container.querySelector('#map-commune-select');
      communeSel.value = '0';
      communeSel.dispatchEvent({ type: 'change' });

      pendingGpsSuccess({ coords: { latitude: 21.0285, longitude: 105.8542 } });
      await new Promise((r) => setTimeout(r, 15));

      assert.doesNotMatch(container.textContent, /Đã định vị tại 21\.0285/);

      gpsBtn.click();
      currentRegionId = 'mien_bac';
      view.onRegionChanged();
      pendingGpsSuccess({ coords: { latitude: 10.0452, longitude: 105.7469 } });
      await new Promise((r) => setTimeout(r, 15));

      assert.doesNotMatch(container.textContent, /Đã định vị tại 10\.0452/);
    });
  });

  it('post-form ignores stale SpeechRecognition onend/onerror from cancelled instance on rapid restart [R7]', async () => {
    ensureWebRootImportHook();
    const { document, rootBody } = createFakeDom();
    const { getRegionById } = await import('../src/shared/regions.js');
    const instances = [];

    class MockSpeechRecognition {
      constructor() {
        this.lang = '';
        this.interimResults = false;
        this.continuous = false;
        this.maxAlternatives = 1;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this.stopped = false;
        instances.push(this);
      }
      start() {}
      stop() {
        this.stopped = true;
      }
    }

    await withPatchedGlobals({
      document,
      localStorage: createMemoryStorage(),
      navigator: { onLine: true },
      SpeechRecognition: MockSpeechRecognition
    }, async () => {
      const { createPostFormView } = await import('../public/js/post-form.js');
      const container = document.createElement('section');
      rootBody.appendChild(container);
      createPostFormView({
        container,
        getRegion: () => getRegionById('dbscl'),
        onListingCreated: () => {},
        onNavigateMap: () => {}
      });

      const voiceBtn = container.querySelector('.btn-voice');
      voiceBtn.click();
      const rec1 = instances[0];
      assert.equal(voiceBtn.classList.contains('is-listening'), true);

      const cachedOnEnd1 = rec1.onend;
      const cachedOnError1 = rec1.onerror;

      voiceBtn.click();
      voiceBtn.click();
      const rec2 = instances[1];
      assert.ok(rec2);
      assert.equal(rec1.onend, null);
      assert.equal(voiceBtn.classList.contains('is-listening'), true);

      if (typeof cachedOnEnd1 === 'function') {
        cachedOnEnd1();
      }
      if (typeof cachedOnError1 === 'function') {
        cachedOnError1();
      }
      assert.equal(voiceBtn.classList.contains('is-listening'), true);
      assert.equal(container.querySelector('#post-mic-notice').hidden, true);
    });
  });

  it('app.css wraps long popup-meta and listing-meta-line cleanly [R13]', () => {
    const cssText = fs.readFileSync(path.join(REPO_ROOT, 'public', 'styles', 'app.css'), 'utf8');
    assert.match(cssText, /\.popup-meta\s*\{[^}]*overflow-wrap:\s*anywhere/);
    assert.match(cssText, /\.listing-meta-line\s*\{[^}]*overflow-wrap:\s*anywhere/);
  });
});
