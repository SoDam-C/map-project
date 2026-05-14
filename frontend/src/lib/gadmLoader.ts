/**
 * GADM 数据加载器
 * 数据源：https://geodata.ucdavis.edu/gadm/gadm4.1/json/
 */

import type { FeatureCollection } from 'geojson';

const GADM_BASE = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json';

/** 构建 GADM GeoJSON 请求 URL */
export function getGadmUrl(iso3: string, level: number): string {
  return `${GADM_BASE}/gadm41_${iso3}_${level}.json`;
}

/** 标准化 GADM feature：设置 adcode 为复合 ID，name 为本地名称 */
function normalizeGadmFeature(feature: any, iso3: string, level: number): any {
  const props = feature.properties || {};
  const gid = props[`GID_${level}`] || '';
  const name = props[`NAME_${level}`] || props[`NAME_0`] || '';

  return {
    ...feature,
    properties: {
      ...props,
      adcode: `${iso3}:${gid}`,
      name,
    },
  };
}

/**
 * 加载 GADM 某级别的数据并缓存
 * 整个国家文件下载后过滤客户端
 */
export async function loadGadmLevel(
  iso3: string,
  level: number,
  cache: Map<string, FeatureCollection>,
): Promise<FeatureCollection | null> {
  const cacheKey = `gadm_${iso3}_${level}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const resp = await fetch(getGadmUrl(iso3, level));
    if (!resp.ok) return null;
    const data: FeatureCollection = await resp.json();
    data.features = data.features.map(f => normalizeGadmFeature(f, iso3, level));
    cache.set(cacheKey, data);
    return data;
  } catch (e) {
    console.error(`[gadmLoader] Failed to load ${iso3} level ${level}:`, e);
    return null;
  }
}
