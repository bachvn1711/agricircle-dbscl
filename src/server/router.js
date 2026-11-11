import fs from 'node:fs';
import path from 'node:path';

const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/;
const SAFE_SEGMENT_REGEX = /^[A-Za-z0-9._-]+$/;
const CANONICAL_ID_REGEX = /^[1-9]\d{0,9}$/;
const LEAFLET_ALLOWED_IMAGES = new Set([
  'layers.png',
  'layers-2x.png',
  'marker-icon.png',
  'marker-icon-2x.png',
  'marker-shadow.png'
]);

const STATIC_EXT_MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon']
]);

export function parseCanonicalListingId(rawId) {
  if (typeof rawId !== 'string' || !CANONICAL_ID_REGEX.test(rawId)) {
    return null;
  }
  const num = Number(rawId);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

export function normalizeRequestPathname(rawTarget) {
  if (typeof rawTarget !== 'string' || !rawTarget.startsWith('/')) {
    return { ok: false, status: 400, error: 'Đường dẫn yêu cầu không hợp lệ' };
  }
  if (CONTROL_CHAR_REGEX.test(rawTarget)) {
    return { ok: false, status: 400, error: 'Đường dẫn chứa ký tự điều khiển không hợp lệ' };
  }

  const qIdx = rawTarget.indexOf('?');
  const hashIdx = rawTarget.indexOf('#');
  let cutIdx = -1;
  if (qIdx >= 0 && hashIdx >= 0) {
    cutIdx = Math.min(qIdx, hashIdx);
  } else if (qIdx >= 0) {
    cutIdx = qIdx;
  } else if (hashIdx >= 0) {
    cutIdx = hashIdx;
  }

  const rawPath = cutIdx >= 0 ? rawTarget.slice(0, cutIdx) : rawTarget;
  const search = qIdx >= 0 && (hashIdx < 0 || qIdx < hashIdx)
    ? rawTarget.slice(qIdx, hashIdx >= 0 ? hashIdx : undefined)
    : '';

  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { ok: false, status: 400, error: 'Mã hóa đường dẫn không hợp lệ' };
  }

  if (CONTROL_CHAR_REGEX.test(decoded)) {
    return { ok: false, status: 400, error: 'Đường dẫn chứa ký tự điều khiển không hợp lệ' };
  }

  const forward = decoded.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  let normalized = path.posix.normalize(forward);
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return {
    ok: true,
    pathname: normalized,
    guardPath: normalized.toLowerCase(),
    search
  };
}

export function isAdminGuardPath(guardPath) {
  return guardPath === '/api/admin' || guardPath.startsWith('/api/admin/');
}

function createPattern(pathname) {
  return new globalThis.URLPattern({ pathname });
}

export function createRouteTable() {
  return {
    api: [
      { method: 'GET', pattern: createPattern('/api/health'), name: 'health' },
      { method: 'GET', pattern: createPattern('/api/crops'), name: 'getCrops' },
      { method: 'GET', pattern: createPattern('/api/listings'), name: 'getListings' },
      { method: 'POST', pattern: createPattern('/api/listings'), name: 'createListing' },
      { method: 'POST', pattern: createPattern('/api/listings/:id/collect'), name: 'collectListing' },
      { method: 'POST', pattern: createPattern('/api/listings/:id/report'), name: 'reportListing' },
      { method: 'POST', pattern: createPattern('/api/metrics/calculation'), name: 'flushCalcMetric' },
      { method: 'GET', pattern: createPattern('/api/impact'), name: 'getImpact' },
      { method: 'POST', pattern: createPattern('/api/admin/login'), name: 'adminLogin' },
      { method: 'POST', pattern: createPattern('/api/admin/logout'), name: 'adminLogout' },
      { method: 'GET', pattern: createPattern('/api/admin/listings'), name: 'adminGetListings' },
      { method: 'PATCH', pattern: createPattern('/api/admin/listings/:id'), name: 'adminPatchListing' },
      { method: 'PATCH', pattern: createPattern('/api/admin/crops/:id'), name: 'adminPatchCrop' },
      { method: 'GET', pattern: createPattern('/api/admin/export.csv'), name: 'adminExportCsv' }
    ],
    staticRoutes: [
      { pattern: createPattern('/'), kind: 'root' },
      { pattern: createPattern('/manifest.webmanifest'), kind: 'manifest' },
      { pattern: createPattern('/sw.js'), kind: 'sw' },
      { pattern: createPattern('/styles/:file'), kind: 'styles' },
      { pattern: createPattern('/js/:file'), kind: 'js' },
      { pattern: createPattern('/icons/:file'), kind: 'icons' },
      { pattern: createPattern('/shared/:file'), kind: 'shared' },
      { pattern: createPattern('/vendor/leaflet/leaflet.js'), kind: 'leafletJs' },
      { pattern: createPattern('/vendor/leaflet/leaflet.css'), kind: 'leafletCss' },
      { pattern: createPattern('/vendor/leaflet/images/:file'), kind: 'leafletImg' }
    ]
  };
}

export function matchApiRoute(routeTable, method, pathname) {
  for (const route of routeTable.api) {
    if (route.method !== method) {
      continue;
    }
    const matched = route.pattern.exec({ pathname });
    if (matched) {
      return {
        name: route.name,
        params: matched.pathname.groups || {}
      };
    }
  }
  return null;
}

function resolveContainedFile(baseDir, segments, allowedExtensions) {
  let realBase;
  try {
    realBase = fs.realpathSync(baseDir);
  } catch {
    return null;
  }

  const candidate = path.resolve(realBase, ...segments);
  const ext = path.extname(candidate).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    return null;
  }

  let realTarget;
  try {
    realTarget = fs.realpathSync(candidate);
  } catch {
    return null;
  }

  const rel = path.relative(realBase, realTarget);
  if (rel === '' || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    return null;
  }

  let stat;
  try {
    stat = fs.statSync(realTarget);
  } catch {
    return null;
  }
  if (!stat.isFile()) {
    return null;
  }

  const contentType = STATIC_EXT_MIME.get(ext);
  if (!contentType) {
    return null;
  }

  return { filePath: realTarget, contentType };
}

export function matchStaticAsset(routeTable, pathname, dirs) {
  for (const route of routeTable.staticRoutes) {
    const matched = route.pattern.exec({ pathname });
    if (!matched) {
      continue;
    }
    const groups = matched.pathname.groups || {};
    const file = groups.file;
    if (file !== undefined && (!SAFE_SEGMENT_REGEX.test(file) || file.includes('..'))) {
      return null;
    }

    switch (route.kind) {
      case 'root':
        return {
          isRoot: true,
          asset: resolveContainedFile(dirs.staticDir, ['index.html'], new Set(['.html']))
        };
      case 'manifest':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.staticDir, ['manifest.webmanifest'], new Set(['.webmanifest']))
        };
      case 'sw':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.staticDir, ['sw.js'], new Set(['.js']))
        };
      case 'styles':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.staticDir, ['styles', file], new Set(['.css']))
        };
      case 'js':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.staticDir, ['js', file], new Set(['.js']))
        };
      case 'icons':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.staticDir, ['icons', file], new Set(['.png', '.svg', '.ico']))
        };
      case 'shared':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.sharedDir, [file], new Set(['.js']))
        };
      case 'leafletJs':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.leafletDistDir, ['leaflet.js'], new Set(['.js']))
        };
      case 'leafletCss':
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.leafletDistDir, ['leaflet.css'], new Set(['.css']))
        };
      case 'leafletImg':
        if (!LEAFLET_ALLOWED_IMAGES.has(file)) {
          return null;
        }
        return {
          isRoot: false,
          asset: resolveContainedFile(dirs.leafletDistDir, ['images', file], new Set(['.png']))
        };
      default:
        return null;
    }
  }
  return null;
}
