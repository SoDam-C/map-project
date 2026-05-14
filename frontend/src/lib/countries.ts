/**
 * 国家配置系统
 */

import type { AdminLevel } from './adminRegions';
import { isGeoApiConfigured, fetchCountryConfigs } from './geoApi';
import type { GeoCountryResponse } from './geoApi';

export type DataSource = 'datav' | 'gadm' | 'geoapi';

export interface CountryConfig {
  iso3: string;
  iso2: string;
  name: string;
  flag: string;
  levels: AdminLevel[];
  levelNames: Record<number, string>;
  levelTotals: Record<number, number>;
  dataSource: DataSource;
  center: [number, number];
  zoom: number;
}

export const CHINA_CONFIG: CountryConfig = {
  iso3: 'CHN',
  iso2: 'CN',
  name: '中国',
  flag: '\u{1F1E8}\u{1F1F3}',
  levels: [0, 1, 2, 3, 4],
  levelNames: { 0: '国家', 1: '省', 2: '市', 3: '区县', 4: '乡镇街道' },
  levelTotals: { 0: 1, 1: 34, 2: 333, 3: 2844, 4: 38722 },
  dataSource: 'geoapi',
  center: [104, 35],
  zoom: 4,
};

export const COUNTRY_REGISTRY: Record<string, CountryConfig> = {
  CHN: CHINA_CONFIG,
};

/** 从自建 API 加载所有国家配置并注册到 COUNTRY_REGISTRY */
export async function loadCountryConfigsFromApi(): Promise<void> {
  if (!isGeoApiConfigured()) return;
  try {
    const configs = await fetchCountryConfigs();
    for (const c of configs) {
      COUNTRY_REGISTRY[c.iso3] = toCountryConfig(c);
    }
  } catch (e) {
    console.error('[countries] Failed to load country configs from API:', e);
  }
}

function toCountryConfig(r: GeoCountryResponse): CountryConfig {
  return {
    iso3: r.iso3,
    iso2: r.iso2,
    name: r.nameZh || r.name,
    flag: r.flag,
    levels: r.levels as AdminLevel[],
    levelNames: r.levelNames,
    levelTotals: r.levelTotals,
    dataSource: 'geoapi',
    center: r.center,
    zoom: r.zoom,
  };
}

/** 热门国家的预设级别名称（GADM 不可达时的 fallback） */
const PRESET_LEVEL_NAMES: Record<string, Record<number, string>> = {
  JPN: { 0: '国家', 1: '都道府県', 2: '市区町村' },
  KOR: { 0: '国家', 1: '道/市', 2: '区/郡' },
  THA: { 0: '国家', 1: '府', 2: '县' },
  SGP: { 0: '国家' },
  MYS: { 0: '国家', 1: '州', 2: '县' },
  VNM: { 0: '国家', 1: '省', 2: '县' },
  IDN: { 0: '国家', 1: '省', 2: '县' },
  PHL: { 0: '国家', 1: '地区', 2: '省' },
  USA: { 0: '国家', 1: '州', 2: '县' },
  CAN: { 0: '国家', 1: '省', 2: '县' },
  GBR: { 0: '国家', 1: '构成国', 2: '区' },
  FRA: { 0: '国家', 1: '大区', 2: '省' },
  DEU: { 0: '国家', 1: '联邦州', 2: '县' },
  ITA: { 0: '国家', 1: '大区', 2: '省' },
  ESP: { 0: '国家', 1: '自治区', 2: '省' },
  AUS: { 0: '国家', 1: '州', 2: '地方政府' },
  NZL: { 0: '国家', 1: '大区', 2: '市' },
  RUS: { 0: '国家', 1: '联邦主体', 2: '区' },
  TUR: { 0: '国家', 1: '省', 2: '县' },
  ARE: { 0: '国家', 1: '酋长国' },
  IND: { 0: '国家', 1: '邦', 2: '县' },
  NPL: { 0: '国家', 1: '省', 2: '县' },
  MMR: { 0: '国家', 1: '邦/省', 2: '县' },
  KHM: { 0: '国家', 1: '省', 2: '县' },
  EGY: { 0: '国家', 1: '省' },
  ZAF: { 0: '国家', 1: '省', 2: '市' },
  BRA: { 0: '国家', 1: '州', 2: '市' },
  MEX: { 0: '国家', 1: '州', 2: '市' },
  ARG: { 0: '国家', 1: '省', 2: '县' },
  CHE: { 0: '国家', 1: '州', 2: '区' },
  NLD: { 0: '国家', 1: '省', 2: '市' },
  SWE: { 0: '国家', 1: '省', 2: '市' },
  NOR: { 0: '国家', 1: '郡', 2: '市' },
  GRC: { 0: '国家', 1: '大区', 2: '区域单位' },
  CZE: { 0: '国家', 1: '州', 2: '县' },
  AUT: { 0: '国家', 1: '州', 2: '区' },
  POL: { 0: '国家', 1: '省', 2: '县' },
  PRT: { 0: '国家', 1: '区', 2: '市' },
  IRL: { 0: '国家', 1: '省', 2: '郡' },
  DNK: { 0: '国家', 1: '大区', 2: '市' },
  FIN: { 0: '国家', 1: '区', 2: '市' },
  ISL: { 0: '国家', 1: '区', 2: '市' },
  HRV: { 0: '国家', 1: '县', 2: '市' },
  HUN: { 0: '国家', 1: '州', 2: '区' },
  ROM: { 0: '国家', 1: '县', 2: '市' },
  MNG: { 0: '国家', 1: '省', 2: '县' },
  KAZ: { 0: '国家', 1: '州', 2: '区' },
  LKA: { 0: '国家', 1: '省', 2: '区' },
};

/** 确保国家配置存在，不存在时创建基础 fallback（名称+预设级别），供 UI 立即使用 */
export function ensureCountryConfig(iso3: string, nameZh?: string, flag?: string): CountryConfig {
  if (COUNTRY_REGISTRY[iso3]) return COUNTRY_REGISTRY[iso3];
  const preset = PRESET_LEVEL_NAMES[iso3];
  const levels: AdminLevel[] = [0];
  const levelNames: Record<number, string> = { 0: preset?.[0] || 'Country' };
  const levelTotals: Record<number, number> = { 0: 1 };
  if (preset) {
    for (let lv = 1; lv <= 4; lv++) {
      if (preset[lv]) {
        levels.push(lv as AdminLevel);
        levelNames[lv] = preset[lv];
        levelTotals[lv] = 0;
      }
    }
  } else {
    levels.push(1);
    levelNames[1] = 'Admin 1';
    levelTotals[1] = 0;
  }
  const config: CountryConfig = {
    iso3,
    iso2: '',
    name: nameZh || iso3,
    flag: flag || '',
    levels,
    levelNames,
    levelTotals,
    dataSource: isGeoApiConfigured() ? 'geoapi' : 'gadm',
    center: [0, 0],
    zoom: 4,
  };
  COUNTRY_REGISTRY[iso3] = config;
  return config;
}

/** 从 GADM 动态获取国家完整配置（可能覆盖 fallback 配置） */
export async function fetchGadmCountryConfig(iso3: string): Promise<CountryConfig | null> {
  // 如果已有完整配置（levelTotals[1] > 0 说明 GADM 探测成功过），跳过
  const existing = COUNTRY_REGISTRY[iso3];
  if (existing && existing.levelTotals[1] > 0) return existing;

  try {
    // 先加载 ADM0 获取国家基本信息
    const resp = await fetch(`https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_${iso3}_0.json`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.features?.[0]) return null;

    const adm0Props = data.features[0].properties;
    const name = adm0Props.NAME_0 || iso3;

    // 探测各级别是否存在及数量，从对应级别的 feature 读取 ENGTYPE
    const levels: AdminLevel[] = [0];
    const levelTotals: Record<number, number> = { 0: 1 };
    const levelNames: Record<number, string> = { 0: 'Country' };

    for (let lv = 1; lv <= 3; lv++) {
      try {
        const probeResp = await fetch(`https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_${iso3}_${lv}.json`);
        if (!probeResp.ok) break;
        const probeData = await probeResp.json();
        const count = probeData.features?.length ?? 0;
        if (count === 0) break;

        levels.push(lv as AdminLevel);
        levelTotals[lv] = count;

        // 从 ADM${lv} feature 的 ENGTYPE_${lv} 字段读取级别名称
        const probeFeature = probeData.features[0]?.properties;
        if (probeFeature) {
          const engType = probeFeature[`ENGTYPE_${lv}`] || '';
          const localType = probeFeature[`TYPE_${lv}`] || engType || `ADM${lv}`;
          levelNames[lv] = engType || localType;
        } else {
          levelNames[lv] = `ADM${lv}`;
        }
      } catch {
        break;
      }
    }

    // 如果有 COUNTRY 则优先使用
    const countryName = adm0Props.COUNTRY || name;

    // 计算 center 和 zoom
    const bounds = data.features[0].bbox;
    const center: [number, number] = bounds
      ? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]
      : [0, 20];

    const config: CountryConfig = {
      iso3,
      iso2: '',
      name: countryName,
      flag: '',
      levels,
      levelNames,
      levelTotals,
      dataSource: 'gadm',
      center,
      zoom: 4,
    };

    COUNTRY_REGISTRY[iso3] = config;
    return config;
  } catch (e) {
    console.error(`[countries] Failed to fetch config for ${iso3}:`, e);
    return null;
  }
}
