/**
 * 轨迹相关工具函数
 */

/** 格式化距离 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters / 1000)}km`;
}

/** 格式化时长 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}分${s > 0 ? s + '秒' : ''}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h < 24) return `${h}时${m > 0 ? m + '分' : ''}`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}天${rh > 0 ? rh + '时' : ''}`;
}

/** 计算两点间距离（Haversine 公式） */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** 从 GPS 点数组计算 bounds */
export function computeBounds(points: Array<{ lat: number; lng: number }>): [number, number, number, number] {
  if (points.length === 0) return [0, 0, 0, 0];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const p of points) {
    if (p.lng < minLng) minLng = p.lng;
    if (p.lat < minLat) minLat = p.lat;
    if (p.lng > maxLng) maxLng = p.lng;
    if (p.lat > maxLat) maxLat = p.lat;
  }
  return [minLng, minLat, maxLng, maxLat];
}

/** 从 GPS 点数组计算总距离和时长 */
export function computeTrackStats(points: Array<{ lat: number; lng: number; timestamp: number }>): {
  distance: number;
  duration: number;
} {
  if (points.length < 2) return { distance: 0, duration: 0 };

  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    distance += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng,
    );
  }

  const duration = (points[points.length - 1].timestamp - points[0].timestamp) / 1000;
  return { distance, duration };
}
