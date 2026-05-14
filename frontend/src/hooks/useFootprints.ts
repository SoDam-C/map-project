'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAncestorAdcodes,
  getAdcodeLevel,
  type AdminLevel,
} from '@/lib/adminRegions';
import { getCountry, buildRegionCode, parseRegionCode } from '@/lib/regionCode';
import { COUNTRY_REGISTRY } from '@/lib/countries';
import { loadFootprints, save, load, removeData } from '@/lib/storage';
import type { FootprintRecord, FootprintStatsData, CountryFootprintStats, FootprintSource } from '@/lib/types';

const NAMESPACE = 'footprints' as const;

const INITIAL_MOCK: Record<string, FootprintRecord> = {
  'CHN:110105': { id: 'CHN:110105', adcode: 'CHN:110105', name: '朝阳区', level: 3, center: [116.486, 39.921], litAt: '2026-01-15T08:00:00Z', source: 'track' },
  'CHN:110101': { id: 'CHN:110101', adcode: 'CHN:110101', name: '东城区', level: 3, center: [116.416, 39.928], litAt: '2026-01-16T10:00:00Z', source: 'track' },
  'CHN:310115': { id: 'CHN:310115', adcode: 'CHN:310115', name: '浦东新区', level: 3, center: [121.544, 31.221], litAt: '2026-02-20T10:00:00Z', source: 'track' },
  'CHN:440100': { id: 'CHN:440100', adcode: 'CHN:440100', name: '广州市', level: 2, center: [113.264, 23.129], litAt: '2026-04-05T09:00:00Z', source: 'track' },
  'CHN:440300': { id: 'CHN:440300', adcode: 'CHN:440300', name: '深圳市', level: 2, center: [114.058, 22.543], litAt: '2026-04-06T11:00:00Z', source: 'track' },
  'CHN:510100': { id: 'CHN:510100', adcode: 'CHN:510100', name: '成都市', level: 2, center: [104.066, 30.572], litAt: '2026-04-20T14:00:00Z', source: 'track' },
  'CHN:330100': { id: 'CHN:330100', adcode: 'CHN:330100', name: '杭州市', level: 2, center: [120.153, 30.287], litAt: '2026-05-01T09:00:00Z', source: 'track' },
};

function ensureAncestors(data: Record<string, FootprintRecord>): Record<string, FootprintRecord> {
  const result = { ...data };
  for (const adcode of Object.keys(result)) {
    const ancestors = getAncestorAdcodes(adcode);
    const now = result[adcode].litAt;
    for (const anc of ancestors) {
      if (!(anc in result)) {
        const ancLevel = getAdcodeLevel(anc);
        result[anc] = {
          id: anc,
          adcode: anc,
          name: anc,
          level: ancLevel,
          center: [0, 0],
          litAt: now,
          source: 'ancestor',
        };
      }
    }
  }
  return result;
}

function loadFromStorage(): Record<string, FootprintRecord> {
  if (typeof window === 'undefined') return ensureAncestors(INITIAL_MOCK);
  const data = loadFootprints();
  if (data && Object.keys(data).length > 0) return ensureAncestors(data);
  return ensureAncestors(INITIAL_MOCK);
}

function persistToStorage(data: Record<string, FootprintRecord>) {
  save(NAMESPACE, data);
}

export function useFootprints() {
  const [footprints, setFootprints] = useState<Record<string, FootprintRecord>>(loadFromStorage);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((data: Record<string, FootprintRecord>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistToStorage(data), 500);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const isLit = useCallback((adcode: string): boolean => {
    return adcode in footprints;
  }, [footprints]);

  /** 通过 GPS 轨迹自动点亮（仅添加，不触发取消逻辑） */
  const lightUp = useCallback((adcode: string, source: FootprintSource, sourceId?: string) => {
    setFootprints(prev => {
      if (adcode in prev) return prev;
      const next = { ...prev };
      const ancestors = getAncestorAdcodes(adcode);
      const now = new Date().toISOString();
      ancestors.forEach(a => {
        if (!(a in next)) {
          const aLevel = getAdcodeLevel(a);
          next[a] = {
            id: a,
            adcode: a,
            name: a,
            level: aLevel,
            center: [0, 0],
            litAt: now,
            source,
            sourceId,
          };
        }
      });
      persist(next);
      return next;
    });
  }, [persist]);

  const getStats = useCallback((): FootprintStatsData => {
    const byCountry: Record<string, CountryFootprintStats> = {};
    const entries = Object.values(footprints);

    for (const fp of entries) {
      const country = getCountry(fp.adcode);
      if (!byCountry[country]) {
        byCountry[country] = { counts: {}, percentages: {} };
      }
      const stats = byCountry[country];
      stats.counts[fp.level] = (stats.counts[fp.level] || 0) + 1;
    }

    // 按国家计算百分比
    for (const [iso3, stats] of Object.entries(byCountry)) {
      const config = COUNTRY_REGISTRY[iso3];
      if (!config) continue;
      for (const level of config.levels) {
        const count = stats.counts[level] || 0;
        const total = config.levelTotals[level];
        stats.percentages[level] = total > 0 ? Math.round((count / total) * 100) : 0;
      }
    }

    const recentList = [...entries]
      .sort((a, b) => b.litAt.localeCompare(a.litAt))
      .slice(0, 10);

    return { byCountry, recentList };
  }, [footprints]);

  /** 获取指定国家的统计数据 */
  const getCountryStats = useCallback((countryIso3: string): CountryFootprintStats => {
    const allStats = getStats();
    return allStats.byCountry[countryIso3] || { counts: {}, percentages: {} };
  }, [getStats]);

  const litAdcodes = useCallback((): Set<string> => {
    return new Set(Object.keys(footprints));
  }, [footprints]);

  /** 获取指定国家的已点亮 adcode 集合 */
  const getCountryLitAdcodes = useCallback((countryIso3: string): Set<string> => {
    return new Set(
      Object.keys(footprints).filter(a => getCountry(a) === countryIso3),
    );
  }, [footprints]);

  const resetFootprints = useCallback(() => {
    const empty: Record<string, FootprintRecord> = {};
    setFootprints(empty);
    persistToStorage(empty);
  }, []);

  /** 计算总体探索百分比（所有国家所有层级的加权平均） */
  const getOverallPercentage = useCallback((): number => {
    const allStats = getStats();
    let totalPct = 0;
    let weightCount = 0;
    for (const [iso3, stats] of Object.entries(allStats.byCountry)) {
      const config = COUNTRY_REGISTRY[iso3];
      if (!config) continue;
      for (const level of config.levels) {
        totalPct += stats.percentages[level] || 0;
        weightCount += 1;
      }
    }
    return weightCount > 0 ? Math.round(totalPct / weightCount) : 0;
  }, [getStats]);

  return { footprints, isLit, lightUp, getStats, getCountryStats, litAdcodes, getCountryLitAdcodes, resetFootprints, getOverallPercentage };
}
