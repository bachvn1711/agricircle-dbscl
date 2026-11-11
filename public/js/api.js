const DEFAULT_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(message, { status = 0, isNetworkError = false, isOffline = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.isOffline = isOffline;
  }
}

export function isAbortError(err) {
  return Boolean(err && typeof err === 'object' && err.name === 'AbortError');
}

async function readOptionalJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(url, options = {}) {
  const { method = 'GET', body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => {
    controller.abort();
  };
  if (signal) {
    if (signal.aborted) {
      const abortErr = new Error('Yêu cầu đã bị hủy');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timerId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const headers = {
    Accept: 'application/json'
  };
  const fetchOptions = {
    method,
    credentials: 'same-origin',
    signal: controller.signal,
    headers
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await readOptionalJson(response);
    if (!response.ok) {
      const serverMessage =
        data && typeof data.error === 'string' && data.error.trim() !== ''
          ? data.error
          : `Lỗi kết nối máy chủ (${response.status})`;
      const offlineHeader = response.headers?.get('X-AgriCircle-Offline') === '1';
      const isOfflineResp = offlineHeader || (response.status === 503 && globalThis.navigator?.onLine === false);
      throw new ApiError(serverMessage, {
        status: response.status,
        isNetworkError: isOfflineResp,
        isOffline: isOfflineResp
      });
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (signal && signal.aborted) {
      const abortErr = new Error('Yêu cầu đã bị hủy');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    if (timedOut) {
      throw new ApiError('Kết nối quá chậm, vui lòng thử lại sau ít giây.', {
        status: 0,
        isNetworkError: true,
        isOffline: !globalThis.navigator?.onLine
      });
    }
    throw new ApiError('Không thể kết nối máy chủ lúc này. Kiểm tra lại mạng hoặc dùng công cụ Tính giá ngoại tuyến.', {
      status: 0,
      isNetworkError: true,
      isOffline: !globalThis.navigator?.onLine
    });
  } finally {
    clearTimeout(timerId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function fetchCrops({ signal } = {}) {
  const data = await requestJson('/api/crops', { signal });
  return Array.isArray(data?.crops) ? data.crops : [];
}

export async function fetchListings(filters = {}, { signal } = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.offerType && filters.offerType !== 'all') {
    params.set('offerType', filters.offerType);
  }
  if (filters.radiusKm && filters.radiusKm !== 'all') {
    params.set('radiusKm', String(filters.radiusKm));
  }
  if (typeof filters.lat === 'number' && typeof filters.lng === 'number') {
    params.set('lat', String(filters.lat));
    params.set('lng', String(filters.lng));
  }
  params.set('limit', String(filters.limit || 200));
  const query = params.toString();
  const data = await requestJson(`/api/listings${query ? `?${query}` : ''}`, { signal });
  return Array.isArray(data?.listings) ? data.listings : [];
}

export async function createListing(payload) {
  return requestJson('/api/listings', { method: 'POST', body: payload });
}

export async function collectListing(id, payload) {
  const data = await requestJson(`/api/listings/${encodeURIComponent(String(id))}/collect`, {
    method: 'POST',
    body: payload
  });
  return data?.listing || null;
}

export async function reportListing(id) {
  const data = await requestJson(`/api/listings/${encodeURIComponent(String(id))}/report`, {
    method: 'POST',
    body: {}
  });
  return data?.listing || null;
}

export async function flushCalcMetric(payload) {
  return requestJson('/api/metrics/calculation', {
    method: 'POST',
    body: payload
  });
}

export async function fetchImpact({ signal } = {}) {
  return requestJson('/api/impact', { signal });
}

export async function adminLogin(pin) {
  return requestJson('/api/admin/login', {
    method: 'POST',
    body: { pin }
  });
}

export async function adminLogout() {
  return requestJson('/api/admin/logout', {
    method: 'POST',
    body: {}
  });
}

export async function fetchAdminListings({ limit = 200, signal } = {}) {
  const data = await requestJson(`/api/admin/listings?limit=${encodeURIComponent(String(limit))}`, { signal });
  return Array.isArray(data?.listings) ? data.listings : [];
}

export async function adminPatchListing(id, payload) {
  const data = await requestJson(`/api/admin/listings/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: payload
  });
  return data?.listing || null;
}

export async function adminPatchCrop(cropId, payload) {
  const data = await requestJson(`/api/admin/crops/${encodeURIComponent(String(cropId))}`, {
    method: 'PATCH',
    body: payload
  });
  return data?.crop || null;
}

export async function downloadAdminCsv() {
  const response = await fetch('/api/admin/export.csv', {
    method: 'GET',
    credentials: 'same-origin'
  });
  if (!response.ok) {
    let message = `Không thể xuất tệp bảng tính (${response.status})`;
    const data = await readOptionalJson(response);
    if (data && typeof data.error === 'string') {
      message = data.error;
    }
    const offlineHeader = response.headers?.get('X-AgriCircle-Offline') === '1';
    const isOfflineResp = offlineHeader || (response.status === 503 && globalThis.navigator?.onLine === false);
    throw new ApiError(message, {
      status: response.status,
      isNetworkError: isOfflineResp,
      isOffline: isOfflineResp
    });
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'agricircle-listings.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
