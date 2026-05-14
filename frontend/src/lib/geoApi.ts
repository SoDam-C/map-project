/**
 * 行政区划数据 API 抽象层
 *
 * 通过 Next.js API Routes 提供服务端代理：
 *   - 国家配置：/data/geo/countries.json（静态文件）
 *   - 区域数据：/api/geo/{iso3}/{level}.json（API Route）
 */

import type { FeatureCollection } from 'geojson';

export function isGeoApiConfigured(): boolean {
  return true;
}

/** GET /data/geo/countries.json */
export async function fetchCountryConfigs(): Promise<GeoCountryResponse[]> {
  const resp = await fetch('/data/geo/countries.json');
  if (!resp.ok) throw new Error(`Failed to load country configs: ${resp.status}`);
  return resp.json();
}

/**
 * GET /api/geo/{iso3}/{level}.json?lit=adcode1,adcode2
 * cache 由调用方传入（与 useRegionData 的 cacheRef 共享生命周期）
 */
export async function fetchRegionData(
  iso3: string,
  level: number,
  cache: Map<string, FeatureCollection>,
): Promise<FeatureCollection | null> {
  const cacheKey = `geo_${iso3}_${level}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const resp = await fetch(`/api/geo/${iso3}/${level}.json`);
    if (!resp.ok) return null;
    const data: FeatureCollection = await resp.json();
    cache.set(cacheKey, data);
    return data;
  } catch (e) {
    console.error(`[geoApi] Failed to load ${iso3} level ${level}:`, e);
    return null;
  }
}

/** 后端 countries.json 中每个国家的结构 */
export interface GeoCountryResponse {
  iso3: string;
  iso2: string;
  name: string;
  nameZh: string;
  flag: string;
  levels: number[];
  levelNames: Record<number, string>;
  levelTotals: Record<number, number>;
  center: [number, number];
  zoom: number;
}
