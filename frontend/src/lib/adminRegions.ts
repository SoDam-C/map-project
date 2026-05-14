/**
 * 行政区划常量与工具函数
 * 中国数据源：阿里 DataV GeoAtlas（免费，GCJ-02 坐标系）+ ruiduobao（乡镇级）
 * 国际数据源：GADM 4.1（免费学术使用，WGS84）
 */

import { parseRegionCode, buildRegionCode, getGadmParentGid } from './regionCode';

export type AdminLevel = 0 | 1 | 2 | 3 | 4;
// 0=国家, 1=省/州, 2=市/县, 3=区县, 4=乡镇/街道

export interface RegionInfo {
  adcode: string;
  name: string;
  level: AdminLevel;
  center: [number, number]; // [lng, lat]
  parentAdcode?: string;
}

/** 中国 34 个省级行政区（直辖市、省、自治区、特别行政区） */
export const PROVINCES: RegionInfo[] = [
  { adcode: '110000', name: '北京市', level: 1, center: [116.405, 39.905] },
  { adcode: '120000', name: '天津市', level: 1, center: [117.19, 39.125] },
  { adcode: '130000', name: '河北省', level: 1, center: [114.48, 38.03] },
  { adcode: '140000', name: '山西省', level: 1, center: [112.549, 37.871] },
  { adcode: '150000', name: '内蒙古自治区', level: 1, center: [111.670, 40.818] },
  { adcode: '210000', name: '辽宁省', level: 1, center: [123.429, 41.796] },
  { adcode: '220000', name: '吉林省', level: 1, center: [125.324, 43.887] },
  { adcode: '230000', name: '黑龙江省', level: 1, center: [126.642, 45.757] },
  { adcode: '310000', name: '上海市', level: 1, center: [121.473, 31.230] },
  { adcode: '320000', name: '江苏省', level: 1, center: [118.767, 32.041] },
  { adcode: '330000', name: '浙江省', level: 1, center: [120.153, 30.287] },
  { adcode: '340000', name: '安徽省', level: 1, center: [117.283, 31.861] },
  { adcode: '350000', name: '福建省', level: 1, center: [119.306, 26.075] },
  { adcode: '360000', name: '江西省', level: 1, center: [115.892, 28.676] },
  { adcode: '370000', name: '山东省', level: 1, center: [117.0, 36.675] },
  { adcode: '410000', name: '河南省', level: 1, center: [113.665, 34.757] },
  { adcode: '420000', name: '湖北省', level: 1, center: [114.305, 30.593] },
  { adcode: '430000', name: '湖南省', level: 1, center: [112.982, 28.194] },
  { adcode: '440000', name: '广东省', level: 1, center: [113.280, 23.125] },
  { adcode: '450000', name: '广西壮族自治区', level: 1, center: [108.320, 22.824] },
  { adcode: '460000', name: '海南省', level: 1, center: [110.331, 20.031] },
  { adcode: '500000', name: '重庆市', level: 1, center: [106.551, 29.563] },
  { adcode: '510000', name: '四川省', level: 1, center: [104.066, 30.572] },
  { adcode: '520000', name: '贵州省', level: 1, center: [106.713, 26.578] },
  { adcode: '530000', name: '云南省', level: 1, center: [102.712, 25.040] },
  { adcode: '540000', name: '西藏自治区', level: 1, center: [91.132, 29.660] },
  { adcode: '610000', name: '陕西省', level: 1, center: [108.940, 34.263] },
  { adcode: '620000', name: '甘肃省', level: 1, center: [103.834, 36.061] },
  { adcode: '630000', name: '青海省', level: 1, center: [101.778, 36.617] },
  { adcode: '640000', name: '宁夏回族自治区', level: 1, center: [106.278, 38.466] },
  { adcode: '650000', name: '新疆维吾尔自治区', level: 1, center: [87.617, 43.792] },
  { adcode: '710000', name: '台湾省', level: 1, center: [121.509, 25.044] },
  { adcode: '810000', name: '香港特别行政区', level: 1, center: [114.169, 22.319] },
  { adcode: '820000', name: '澳门特别行政区', level: 1, center: [113.544, 22.201] },
];

/** 直辖市 adcode 集合（省级行政区中直接下辖区县，无市级中间层） */
export const MUNICIPALITIES: Set<string> = new Set([
  '110000', // 北京市
  '120000', // 天津市
  '310000', // 上海市
  '500000', // 重庆市
]);

/** 各级行政区划总数（用于统计进度） */
export const REGION_TOTALS: Record<AdminLevel, number> = {
  0: 1,       // 国家
  1: 34,      // 省
  2: 333,     // 市
  3: 2844,    // 区县
  4: 38722,   // 乡镇/街道
};

/** 各级行政区划名称 */
export const LEVEL_NAMES: Record<AdminLevel, string> = {
  0: '国家',
  1: '省',
  2: '市',
  3: '区县',
  4: '乡镇街道',
};

const DATAV_BASE = 'https://geo.datav.aliyun.com/areas_v3/bound';
const RUIDUBAO_BASE = 'https://map.ruiduobao.com';

/** 构建 DataV GeoJSON 请求 URL */
export function getRegionUrl(adcode: string, full = false): string {
  return `${DATAV_BASE}/${adcode}${full ? '_full' : ''}.json`;
}

/** 构建 ruiduobao 乡镇列表查询 URL */
export function getTownshipListUrl(provinceName: string, cityName: string, countyName: string): string {
  const params = new URLSearchParams({
    year: '2023',
    province: provinceName,
    city: cityName,
    county: countyName,
  });
  return `${RUIDUBAO_BASE}/api/tree/towns?${params}`;
}

/** 构建 ruiduobao 乡镇 GeoJSON URL（code 取前 9 位） */
export function getTownshipGeoJsonUrl(code: string): string {
  return `${RUIDUBAO_BASE}/vectordata/${code.slice(0, 9)}.gson`;
}

/** 根据地图缩放级别返回应显示的行政层级 */
export function getAdminLevel(zoom: number): AdminLevel {
  if (zoom < 3) return 0;
  if (zoom < 5) return 1;
  if (zoom < 8) return 2;
  if (zoom < 11) return 3;
  return 4;
}

/**
 * 从 adcode 推断其所属省级 adcode
 * 例：'330102' → '330000', '110105' → '110000'
 */
export function getProvinceAdcode(adcode: string): string {
  return adcode.slice(0, 2) + '0000';
}

/**
 * 从 adcode 推断其所属市级 adcode
 * 例：'330102' → '330100'
 */
export function getCityAdcode(adcode: string): string {
  return adcode.slice(0, 4) + '00';
}

/**
 * 获取 adcode 的行政层级
 * 支持复合 ID（CHN:110105）和旧版裸 adcode（110105）
 */
export function getAdcodeLevel(adcode: string): AdminLevel {
  const { country, localId } = parseRegionCode(adcode);

  if (country !== 'CHN') {
    // GADM 代码：按 GID 中 `.` 的数量推断层级
    const segments = localId.split('.');
    // ISO3 → 0, ISO3.X_Y → 1, ISO3.X_Y.Z_W → 2, ...
    return Math.min(segments.length - 1, 4) as AdminLevel;
  }

  // 中国 adcode 规则
  if (localId.length === 6 && localId.endsWith('0000')) return 1;
  if (localId.length === 6 && localId.endsWith('00')) return 2;
  if (localId.length === 6) return 3;
  if (localId.length >= 9) return 4;
  return 0;
}

/**
 * 向上递归获取所有祖先 adcode（从当前到国家级）
 * 支持复合 ID，根据国家选择不同的祖先推断策略
 */
export function getAncestorAdcodes(adcode: string): string[] {
  const { country, localId } = parseRegionCode(adcode);

  if (country !== 'CHN') {
    // GADM：按 GID 的 `.` 分隔符提取父级链
    const ancestors: string[] = [adcode];
    let gid = localId;
    while (true) {
      const parent = getGadmParentGid(gid);
      if (!parent) break;
      ancestors.push(buildRegionCode(country, parent));
      gid = parent;
    }
    return [...new Set(ancestors)];
  }

  // 中国逻辑
  const ancestors: string[] = [adcode];
  const level = getChinaAdcodeLevel(localId);

  if (level >= 3) {
    ancestors.push(buildRegionCode('CHN', getCityAdcode(localId)));
    ancestors.push(buildRegionCode('CHN', getProvinceAdcode(localId)));
  } else if (level === 2) {
    ancestors.push(buildRegionCode('CHN', getProvinceAdcode(localId)));
  }
  return [...new Set(ancestors)];
}

/** 中国 adcode 层级推断（内部） */
function getChinaAdcodeLevel(adcode: string): number {
  if (adcode.length === 6 && adcode.endsWith('0000')) return 1;
  if (adcode.length === 6 && adcode.endsWith('00')) return 2;
  if (adcode.length === 6) return 3;
  if (adcode.length >= 9) return 4;
  return 0;
}
