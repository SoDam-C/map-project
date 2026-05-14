/**
 * 旅行统计工具函数
 */

/** Haversine 公式计算两点间距离（米） */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 计算一系列经纬度点的总距离（米） */
export function calculateRouteDistance(points: Array<{ lat: number; lng: number } | [number, number]>): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const raw0 = points[i - 1];
    const raw1 = points[i];
    const p0 = Array.isArray(raw0) ? raw0 : [raw0.lat, raw0.lng];
    const p1 = Array.isArray(raw1) ? raw1 : [raw1.lat, raw1.lng];
    total += haversineDistance(p0[0], p0[1], p1[0], p1[1]);
  }
  return total;
}

/** 格式化距离显示 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  if (meters < 100000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000).toLocaleString()} km`;
}

/** 计算旅行时长（小时） */
export function calculateTripDurationHours(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

/** 格式化时长 */
export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} 分钟`;
  if (hours < 24) return `${Math.round(hours)} 小时`;
  const days = Math.floor(hours / 24);
  const remainHours = Math.round(hours % 24);
  return remainHours > 0 ? `${days} 天 ${remainHours} 小时` : `${days} 天`;
}
