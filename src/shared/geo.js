export const EARTH_RADIUS_KM = 6371;

const DEG_TO_RAD = Math.PI / 180;

export function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  if (!isValidCoordinates(lat1, lng1) || !isValidCoordinates(lat2, lng2)) {
    return Number.POSITIVE_INFINITY;
  }

  if (lat1 === lat2 && lng1 === lng2) {
    return 0;
  }

  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const radLat1 = lat1 * DEG_TO_RAD;
  const radLat2 = lat2 * DEG_TO_RAD;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const aRaw = sinLat * sinLat + Math.cos(radLat1) * Math.cos(radLat2) * sinLng * sinLng;
  const a = Math.min(1, Math.max(0, aRaw));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return Number.isFinite(distanceKm) ? distanceKm : Number.POSITIVE_INFINITY;
}

export function sortByDistance(items, originLat, originLng) {
  if (!Array.isArray(items)) {
    return [];
  }

  const validOrigin = isValidCoordinates(originLat, originLng);
  return items
    .map((item, index) => {
      const hasCoords = item !== null && typeof item === 'object' && isValidCoordinates(item.lat, item.lng);
      const distanceKm = validOrigin && hasCoords ? haversineKm(originLat, originLng, item.lat, item.lng) : null;
      return { item, index, distanceKm };
    })
    .sort((a, b) => {
      const distA = a.distanceKm === null ? Number.POSITIVE_INFINITY : a.distanceKm;
      const distB = b.distanceKm === null ? Number.POSITIVE_INFINITY : b.distanceKm;
      if (distA !== distB) {
        return distA - distB;
      }
      return a.index - b.index;
    })
    .map(({ item, distanceKm }) => ({
      ...item,
      distanceKm
    }));
}
