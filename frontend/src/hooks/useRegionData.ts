'use client';

import { useRef, useCallback, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import {
  PROVINCES,
  MUNICIPALITIES,
  getRegionUrl,
  getTownshipListUrl,
  getTownshipGeoJsonUrl,
  type AdminLevel,
} from '@/lib/adminRegions';
import { parseRegionCode } from '@/lib/regionCode';
import { loadGadmLevel } from '@/lib/gadmLoader';
import { fetchRegionData } from '@/lib/geoApi';
import { POPULAR_COUNTRIES } from '@/lib/countryList';
import type { CountryConfig } from '@/lib/countries';

interface UseRegionDataOptions {
  map: MapLibreMap | null;
  countryConfig: CountryConfig;
}

interface RegionDataState {
  level: AdminLevel;
  loading: boolean;
}

export function useRegionData({ map, countryConfig }: UseRegionDataOptions) {
  const [state, setState] = useState<RegionDataState>({
    level: 0,
    loading: false,
  });

  const cacheRef = useRef<Map<string, FeatureCollection>>(new Map());
  const nameCacheRef = useRef<Map<string, string>>(new Map());
  const currentLevelRef = useRef<AdminLevel>(0);
  const currentCountryRef = useRef<string>('');
  const configVersionRef = useRef<string>('');

  /** 中国数据加载（DataV + ruiduobao） */
  const loadChinaLevel = useCallback(async (level: AdminLevel, m: MapLibreMap, litAdcodes?: Set<string>): Promise<FeatureCollection | null> => {
    let features: FeatureCollection['features'] = [];

    if (level <= 1) {
      const cacheKey = '100000_full';
      if (!cacheRef.current.has(cacheKey)) {
        try {
          const resp = await fetch(getRegionUrl('100000', true));
          const data: FeatureCollection = await resp.json();
          data.features = data.features.map(f => ({
            ...f,
            properties: { ...f.properties, adcode: 'CHN:' + String(f.properties?.adcode ?? '') },
          }));
          data.features.forEach(f => {
            const ac = String(f.properties?.adcode ?? '');
            const nm = String(f.properties?.name ?? '');
            if (ac && nm) nameCacheRef.current.set(ac, nm);
          });
          cacheRef.current.set(cacheKey, data);
        } catch (e) {
          console.error('[useRegionData] Failed to load province boundaries:', e);
          return null;
        }
      }
      features = cacheRef.current.get(cacheKey)!.features;
    } else if (level === 2) {
      const bounds = m.getBounds();
      const visibleProvinces = PROVINCES.filter(p => {
        const [lng, lat] = p.center;
        return lng >= bounds.getWest() - 2 && lng <= bounds.getEast() + 2 &&
               lat >= bounds.getSouth() - 2 && lat <= bounds.getNorth() + 2;
      });

      const allFeatures: FeatureCollection['features'] = [];
      await Promise.all(visibleProvinces.map(async (prov) => {
        const cacheKey = `${prov.adcode}_full`;
        if (!cacheRef.current.has(cacheKey)) {
          try {
            const resp = await fetch(getRegionUrl(prov.adcode, true));
            const data: FeatureCollection = await resp.json();
            data.features = data.features.map(f => ({
              ...f,
              properties: { ...f.properties, adcode: 'CHN:' + String(f.properties?.adcode ?? '') },
            }));
            data.features.forEach(f => {
              const ac = String(f.properties?.adcode ?? '');
              const nm = String(f.properties?.name ?? '');
              if (ac && nm) nameCacheRef.current.set(ac, nm);
            });
            cacheRef.current.set(cacheKey, data);
          } catch { return; }
        }
        const cached = cacheRef.current.get(cacheKey);
        if (cached) allFeatures.push(...cached.features);
      }));
      features = allFeatures;
    } else if (level === 3) {
      if (!litAdcodes || litAdcodes.size === 0) {
        return { type: 'FeatureCollection' as const, features: [] };
      }

      const citiesToLoad = new Set<string>();
      for (const adcode of litAdcodes) {
        const localId = parseRegionCode(adcode).localId;
        if (localId.length >= 4) {
          citiesToLoad.add(localId.slice(0, 4) + '00');
        }
      }

      const allFeatures: FeatureCollection['features'] = [];
      const cityArray = Array.from(citiesToLoad);
      const batchSize = 5;
      for (let i = 0; i < cityArray.length; i += batchSize) {
        const batch = cityArray.slice(i, i + batchSize);
        await Promise.all(batch.map(async (cityAdcode) => {
          const cacheKey = `${cityAdcode}_full`;
          if (!cacheRef.current.has(cacheKey)) {
            try {
              const resp = await fetch(getRegionUrl(cityAdcode, true));
              const data: FeatureCollection = await resp.json();
              data.features = data.features.map(f => ({
                ...f,
                properties: { ...f.properties, adcode: 'CHN:' + String(f.properties?.adcode ?? '') },
              }));
              data.features.forEach(f => {
                const ac = String(f.properties?.adcode ?? '');
                const nm = String(f.properties?.name ?? '');
                if (ac && nm) nameCacheRef.current.set(ac, nm);
              });
              cacheRef.current.set(cacheKey, data);
            } catch { return; }
          }
          const cached = cacheRef.current.get(cacheKey);
          if (cached) allFeatures.push(...cached.features);
        }));
      }
      features = allFeatures;
    } else if (level === 4) {
      if (!litAdcodes || litAdcodes.size === 0) {
        return { type: 'FeatureCollection' as const, features: [] };
      }

      const districtsToLoad = new Set<string>();
      for (const adcode of litAdcodes) {
        const localId = parseRegionCode(adcode).localId;
        if (localId.length >= 6) {
          districtsToLoad.add(localId.slice(0, 6));
        }
      }

      const allFeatures: FeatureCollection['features'] = [];
      const districtArray = Array.from(districtsToLoad);
      const batchSize = 3;
      for (let i = 0; i < districtArray.length; i += batchSize) {
        const batch = districtArray.slice(i, i + batchSize);
        await Promise.all(batch.map(async (districtAdcode) => {
          const cacheKey = `${districtAdcode}_townships`;
          if (cacheRef.current.has(cacheKey)) {
            allFeatures.push(...cacheRef.current.get(cacheKey)!.features);
            return;
          }

          try {
            const provinceAdcode = districtAdcode.slice(0, 2) + '0000';
            const cityAdcode = districtAdcode.slice(0, 4) + '00';
            const provinceName = nameCacheRef.current.get(provinceAdcode);
            const cityName = MUNICIPALITIES.has(provinceAdcode)
              ? '市辖区'
              : nameCacheRef.current.get(cityAdcode);
            const countyName = nameCacheRef.current.get(districtAdcode);

            if (!provinceName || !cityName || !countyName) return;

            const listResp = await fetch(getTownshipListUrl(provinceName, cityName, countyName));
            const listData = await listResp.json();
            const towns: Array<{ code: string }> = listData.data || [];
            if (towns.length === 0) return;

            const townshipBatchSize = 3;
            const townshipFeatures: FeatureCollection['features'] = [];
            for (let j = 0; j < towns.length; j += townshipBatchSize) {
              const tBatch = towns.slice(j, j + townshipBatchSize);
              await Promise.all(tBatch.map(async (town) => {
                try {
                  const resp = await fetch(getTownshipGeoJsonUrl(town.code));
                  const geojson: FeatureCollection = await resp.json();
                  geojson.features.forEach(f => {
                    f.properties = {
                      ...f.properties,
                      adcode: 'CHN:' + String(f.properties?.code ?? '').slice(0, 9),
                    };
                    delete f.properties.geom;
                  });
                  townshipFeatures.push(...geojson.features);
                } catch { /* skip */ }
              }));
            }

            const result = { type: 'FeatureCollection' as const, features: townshipFeatures };
            cacheRef.current.set(cacheKey, result);
            allFeatures.push(...townshipFeatures);
          } catch { /* skip */ }
        }));
      }
      features = allFeatures;
    }

    return { type: 'FeatureCollection' as const, features };
  }, []);

  /** GADM 数据加载（fallback） */
  const loadGadmCountryLevel = useCallback(async (config: CountryConfig, level: AdminLevel, litAdcodes?: Set<string>): Promise<FeatureCollection | null> => {
    const data = await loadGadmLevel(config.iso3, level, cacheRef.current);
    if (!data) return null;

    // 对于高密度级别（ADM2+），如果 feature 太多且有已点亮足迹，按父级过滤
    if (level >= 2 && litAdcodes && litAdcodes.size > 0 && data.features.length > 500) {
      return filterByParent(config.iso3, data, litAdcodes);
    }

    return data;
  }, []);

  /** 自建 API 数据加载 */
  const loadGeoApiLevel = useCallback(async (iso3: string, level: AdminLevel, litAdcodes?: Set<string>): Promise<FeatureCollection | null> => {
    const data = await fetchRegionData(iso3, level, cacheRef.current);
    if (!data) return null;

    if (level >= 2 && litAdcodes && litAdcodes.size > 0 && data.features.length > 500) {
      return filterByParent(iso3, data, litAdcodes);
    }

    return data;
  }, []);

  /** 按父级 ID 过滤高密度级别（复用逻辑） */
  const filterByParent = useCallback((iso3: string, data: FeatureCollection, litAdcodes: Set<string>): FeatureCollection | null => {
    const parentIds = new Set<string>();
    for (const code of litAdcodes) {
      const { country, localId } = parseRegionCode(code);
      if (country === iso3) {
        const lastDot = localId.lastIndexOf('.');
        if (lastDot !== -1) {
          parentIds.add(`${iso3}:${localId.slice(0, lastDot)}`);
        }
      }
    }
    if (parentIds.size > 0) {
      const filtered = data.features.filter(f => parentIds.has(String(f.properties?.adcode ?? '')));
      if (filtered.length > 0) {
        return { type: 'FeatureCollection' as const, features: filtered };
      }
    }
    return data;
  }, []);

  /** 检测视野内邻国并加载其 level 1 数据 */
  const loadNeighborData = useCallback(async (
    m: MapLibreMap,
    currentIso3: string,
    level: AdminLevel,
  ): Promise<FeatureCollection['features']> => {
    // 仅在 level >= 2 时加载邻国轮廓
    if (level < 2) return [];

    const bounds = m.getBounds();
    const zoom = m.getZoom();
    // 缩放太小不加载邻国
    if (zoom < 3) return [];

    const neighborCountries = POPULAR_COUNTRIES.filter(c => {
      if (c.iso3 === currentIso3) return false;
      const [minLat, minLng, maxLat, maxLng] = c.bbox;
      return bounds.getWest() <= maxLng && bounds.getEast() >= minLng &&
             bounds.getSouth() <= maxLat && bounds.getNorth() >= minLat;
    });

    if (neighborCountries.length === 0) return [];

    const allFeatures: FeatureCollection['features'] = [];
    await Promise.all(neighborCountries.map(async (c) => {
      const data = await fetchRegionData(c.iso3, 1, cacheRef.current);
      if (!data) return;
      // 标记为邻国数据（不参与 lit/unlit 计数）
      for (const f of data.features) {
        if (f.properties) f.properties._neighbor = true;
      }
      allFeatures.push(...data.features);
    }));

    return allFeatures;
  }, []);

  /** 加载某一级别的行政区划数据 */
  const loadLevel = useCallback(async (level: AdminLevel, m: MapLibreMap, litAdcodes?: Set<string>): Promise<FeatureCollection | null> => {
    if (countryConfig.dataSource === 'datav') {
      return loadChinaLevel(level, m, litAdcodes);
    } else if (countryConfig.dataSource === 'geoapi') {
      return loadGeoApiLevel(countryConfig.iso3, level, litAdcodes);
    } else {
      return loadGadmCountryLevel(countryConfig, level, litAdcodes);
    }
  }, [countryConfig, loadChinaLevel, loadGeoApiLevel, loadGadmCountryLevel]);

  const loadDataForLevel = useCallback(async (level: AdminLevel): Promise<FeatureCollection | null> => {
    const m = map;
    if (!m) return null;

    const geojson = await loadLevel(level, m);
    if (!geojson) return null;

    setState({ level, loading: false });

    try {
      const source = m.getSource('footprints-regions') as any;
      if (source) {
        source.setData(geojson);
      }
    } catch { /* ignore */ }

    return geojson;
  }, [map, loadLevel]);

  const switchToLevel = useCallback(async (level: AdminLevel, litAdcodes?: Set<string>) => {
    const m = map;
    if (!m) return;

    // 版本签名：country + levels 数量，配置更新时版本变化触发重新加载
    const versionKey = `${countryConfig.iso3}:${countryConfig.levels.length}`;
    const configChanged = versionKey !== configVersionRef.current;
    if (!configChanged && level === currentLevelRef.current) return;

    configVersionRef.current = versionKey;
    currentCountryRef.current = countryConfig.iso3;
    currentLevelRef.current = level;
    setState({ level, loading: true });

    const geojson = await loadLevel(level, m, litAdcodes);
    if (!geojson) {
      setState({ level, loading: false });
      return;
    }

    // 加载视野内邻国的 level 1 轮廓数据
    const neighborFeatures = await loadNeighborData(m, countryConfig.iso3, level);
    if (neighborFeatures.length > 0) {
      geojson.features = [...geojson.features, ...neighborFeatures];
    }

    setState({ level, loading: false });
    try {
      const source = m.getSource('footprints-regions') as any;
      if (source) source.setData(geojson);
      if (litAdcodes && litAdcodes.size > 0) {
        const fitted = fitToLitFeatures(m, geojson.features, litAdcodes);
        // 没有匹配的 lit feature 时（如国家级无足迹），回退到 fit 全部
        if (!fitted) fitToAllFeatures(m, geojson.features);
      } else {
        fitToAllFeatures(m, geojson.features);
      }
    } catch { /* ignore */ }
  }, [map, loadLevel, loadNeighborData]);

  return { level: state.level, loading: state.loading, switchToLevel, loadDataForLevel };
}

/** 将地图视野 fit 到已点亮特征的最小边界，返回是否成功 fit */
export function fitToLitFeatures(
  m: MapLibreMap,
  features: FeatureCollection['features'],
  litAdcodes: Set<string>,
): boolean {
  const lit = features.filter(f => litAdcodes.has(String(f.properties?.adcode ?? '')));
  if (lit.length === 0) return false;

  fitToAllFeatures(m, lit);
  return true;
}

/** 将地图视野 fit 到指定特征集合的最小边界 */
export function fitToAllFeatures(
  m: MapLibreMap,
  features: FeatureCollection['features'],
) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const f of features) {
    const g = f.geometry;
    const coords: number[][] = [];
    if (g.type === 'Polygon') {
      for (const ring of g.coordinates) coords.push(...ring);
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates) for (const ring of poly) coords.push(...ring);
    }
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  if (minLng !== Infinity) {
    m.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
  }
}
