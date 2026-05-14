'use client';

import type { AdminLevel } from '@/lib/adminRegions';
import { getAdcodeLevel, getProvinceAdcode, getCityAdcode } from '@/lib/adminRegions';
import type { FeatureCollection } from 'geojson';

interface ReverseGeocodeResult {
  adcode: string;
  name: string;
  level: AdminLevel;
}

/**
 * 根据经纬度查找所在的行政区划
 * 通过遍历已加载的 GeoJSON 特征做点包含判断
 */
export function findRegionByPoint(
  lng: number,
  lat: number,
  geojson: FeatureCollection
): ReverseGeocodeResult | null {
  for (const feature of geojson.features) {
    const props = feature.properties as Record<string, unknown>;
    const adcode = String(props.adcode ?? '');
    const name = String(props.name ?? '');
    if (!adcode) continue;

    if (isPointInPolygon(lng, lat, feature.geometry)) {
      return {
        adcode,
        name,
        level: getAdcodeLevel(adcode),
      };
    }
  }
  return null;
}

/**
 * 射线法判断点是否在多边形内
 */
function isPointInPolygon(lng: number, lat: number, geometry: GeoJSON.Geometry): boolean {
  if (geometry.type === 'Polygon') {
    return pointInRing(lng, lat, geometry.coordinates[0]);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(rings => pointInRing(lng, lat, rings[0]));
  }
  return false;
}

function pointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * 根据经纬度推断大致的行政区划编码（无需 GeoJSON）
 * 仅用于粗略匹配，精确匹配需要 GeoJSON 数据
 */
export function inferAdcodeFromCoords(lng: number, lat: number): { adcode: string; name: string; level: AdminLevel } | null {
  // 这是一个粗略的简化版，仅做 fallback
  // 实际精确匹配应使用 findRegionByPoint 或高德逆地理编码 API
  if (lng < 73 || lng > 136 || lat < 3 || lat > 54) return null; // 不在中国范围内

  // 返回省级编码（非常粗略，基于经纬度范围）
  // 实际应用中应使用完整的行政区划数据库或 API
  return null;
}
