/**
 * 国家列表数据 — 用于国家自动检测
 */

export interface CountryListItem {
  iso3: string;
  iso2: string;
  name: string;
  nameZh: string;
  flag: string;
  /** [minLat, minLng, maxLat, maxLng] */
  bbox: [number, number, number, number];
}

/** 热门国家（按旅行相关性排序） */
export const POPULAR_COUNTRIES: CountryListItem[] = [
  { iso3: 'CHN', iso2: 'CN', name: 'China', nameZh: '中国', flag: '\u{1F1E8}\u{1F1F3}', bbox: [18, 73, 54, 135] },
  { iso3: 'JPN', iso2: 'JP', name: 'Japan', nameZh: '日本', flag: '\u{1F1EF}\u{1F1F5}', bbox: [26, 129, 46, 146] },
  { iso3: 'KOR', iso2: 'KR', name: 'South Korea', nameZh: '韩国', flag: '\u{1F1F0}\u{1F1F7}', bbox: [33, 125, 39, 130] },
  { iso3: 'THA', iso2: 'TH', name: 'Thailand', nameZh: '泰国', flag: '\u{1F1F9}\u{1F1ED}', bbox: [6, 97, 21, 106] },
  { iso3: 'SGP', iso2: 'SG', name: 'Singapore', nameZh: '新加坡', flag: '\u{1F1F8}\u{1F1EC}', bbox: [1.1, 103.6, 1.5, 104.1] },
  { iso3: 'MYS', iso2: 'MY', name: 'Malaysia', nameZh: '马来西亚', flag: '\u{1F1F2}\u{1F1FE}', bbox: [1, 100, 8, 119] },
  { iso3: 'VNM', iso2: 'VN', name: 'Vietnam', nameZh: '越南', flag: '\u{1F1FB}\u{1F1F3}', bbox: [8, 102, 24, 110] },
  { iso3: 'IDN', iso2: 'ID', name: 'Indonesia', nameZh: '印度尼西亚', flag: '\u{1F1EE}\u{1F1E9}', bbox: [-11, 95, 6, 141] },
  { iso3: 'PHL', iso2: 'PH', name: 'Philippines', nameZh: '菲律宾', flag: '\u{1F1F5}\u{1F1ED}', bbox: [5, 117, 21, 127] },
  { iso3: 'USA', iso2: 'US', name: 'United States', nameZh: '美国', flag: '\u{1F1FA}\u{1F1F8}', bbox: [25, -125, 50, -66] },
  { iso3: 'CAN', iso2: 'CA', name: 'Canada', nameZh: '加拿大', flag: '\u{1F1E8}\u{1F1E6}', bbox: [42, -141, 84, -52] },
  { iso3: 'GBR', iso2: 'GB', name: 'United Kingdom', nameZh: '英国', flag: '\u{1F1EC}\u{1F1E7}', bbox: [50, -8, 59, 2] },
  { iso3: 'FRA', iso2: 'FR', name: 'France', nameZh: '法国', flag: '\u{1F1EB}\u{1F1F7}', bbox: [42, -5, 51, 8] },
  { iso3: 'DEU', iso2: 'DE', name: 'Germany', nameZh: '德国', flag: '\u{1F1E9}\u{1F1EA}', bbox: [47, 6, 55, 15] },
  { iso3: 'ITA', iso2: 'IT', name: 'Italy', nameZh: '意大利', flag: '\u{1F1EE}\u{1F1F9}', bbox: [37, 7, 47, 18] },
  { iso3: 'ESP', iso2: 'ES', name: 'Spain', nameZh: '西班牙', flag: '\u{1F1EA}\u{1F1F8}', bbox: [36, -9, 44, 3] },
  { iso3: 'AUS', iso2: 'AU', name: 'Australia', nameZh: '澳大利亚', flag: '\u{1F1E6}\u{1F1FA}', bbox: [-44, 113, -10, 154] },
  { iso3: 'NZL', iso2: 'NZ', name: 'New Zealand', nameZh: '新西兰', flag: '\u{1F1F3}\u{1F1FF}', bbox: [-47, 166, -34, 179] },
  { iso3: 'RUS', iso2: 'RU', name: 'Russia', nameZh: '俄罗斯', flag: '\u{1F1F7}\u{1F1FA}', bbox: [41, 27, 77, 180] },
  { iso3: 'TUR', iso2: 'TR', name: 'Turkey', nameZh: '土耳其', flag: '\u{1F1F9}\u{1F1F7}', bbox: [36, 26, 42, 45] },
  { iso3: 'ARE', iso2: 'AE', name: 'UAE', nameZh: '阿联酋', flag: '\u{1F1E6}\u{1F1EA}', bbox: [22, 51, 26, 56] },
  { iso3: 'IND', iso2: 'IN', name: 'India', nameZh: '印度', flag: '\u{1F1EE}\u{1F1F3}', bbox: [6, 68, 36, 97] },
  { iso3: 'NPL', iso2: 'NP', name: 'Nepal', nameZh: '尼泊尔', flag: '\u{1F1F3}\u{1F1F5}', bbox: [26, 80, 30, 89] },
  { iso3: 'LKA', iso2: 'LK', name: 'Sri Lanka', nameZh: '斯里兰卡', flag: '\u{1F1F1}\u{1F1F0}', bbox: [6, 79, 10, 82] },
  { iso3: 'MMR', iso2: 'MM', name: 'Myanmar', nameZh: '缅甸', flag: '\u{1F1F2}\u{1F1F2}', bbox: [10, 92, 28, 102] },
  { iso3: 'KHM', iso2: 'KH', name: 'Cambodia', nameZh: '柬埔寨', flag: '\u{1F1F0}\u{1F1ED}', bbox: [10, 102, 15, 108] },
  { iso3: 'EGY', iso2: 'EG', name: 'Egypt', nameZh: '埃及', flag: '\u{1F1EA}\u{1F1EC}', bbox: [22, 25, 32, 37] },
  { iso3: 'ZAF', iso2: 'ZA', name: 'South Africa', nameZh: '南非', flag: '\u{1F1FF}\u{1F1E6}', bbox: [-35, 16, -22, 33] },
  { iso3: 'BRA', iso2: 'BR', name: 'Brazil', nameZh: '巴西', flag: '\u{1F1E7}\u{1F1F7}', bbox: [-34, -74, 5, -35] },
  { iso3: 'MEX', iso2: 'MX', name: 'Mexico', nameZh: '墨西哥', flag: '\u{1F1F2}\u{1F1FD}', bbox: [14, -118, 33, -86] },
  { iso3: 'ARG', iso2: 'AR', name: 'Argentina', nameZh: '阿根廷', flag: '\u{1F1E6}\u{1F1F7}', bbox: [-55, -73, -22, -53] },
  { iso3: 'CHE', iso2: 'CH', name: 'Switzerland', nameZh: '瑞士', flag: '\u{1F1E8}\u{1F1ED}', bbox: [46, 6, 48, 11] },
  { iso3: 'NLD', iso2: 'NL', name: 'Netherlands', nameZh: '荷兰', flag: '\u{1F1F3}\u{1F1F1}', bbox: [50, 3, 54, 7] },
  { iso3: 'SWE', iso2: 'SE', name: 'Sweden', nameZh: '瑞典', flag: '\u{1F1F8}\u{1F1EA}', bbox: [55, 11, 69, 24] },
  { iso3: 'NOR', iso2: 'NO', name: 'Norway', nameZh: '挪威', flag: '\u{1F1F3}\u{1F1F4}', bbox: [58, 5, 71, 31] },
  { iso3: 'GRC', iso2: 'GR', name: 'Greece', nameZh: '希腊', flag: '\u{1F1EC}\u{1F1F7}', bbox: [35, 20, 42, 27] },
  { iso3: 'CZE', iso2: 'CZ', name: 'Czech Republic', nameZh: '捷克', flag: '\u{1F1E8}\u{1F1FF}', bbox: [49, 12, 51, 19] },
  { iso3: 'AUT', iso2: 'AT', name: 'Austria', nameZh: '奥地利', flag: '\u{1F1E6}\u{1F1F9}', bbox: [46, 10, 49, 17] },
  { iso3: 'POL', iso2: 'PL', name: 'Poland', nameZh: '波兰', flag: '\u{1F1F5}\u{1F1F1}', bbox: [49, 14, 55, 24] },
  { iso3: 'PRT', iso2: 'PT', name: 'Portugal', nameZh: '葡萄牙', flag: '\u{1F1F5}\u{1F1F9}', bbox: [37, -10, 42, -7] },
  { iso3: 'IRL', iso2: 'IE', name: 'Ireland', nameZh: '爱尔兰', flag: '\u{1F1EE}\u{1F1EA}', bbox: [52, -11, 56, -6] },
  { iso3: 'DNK', iso2: 'DK', name: 'Denmark', nameZh: '丹麦', flag: '\u{1F1E9}\u{1F1F0}', bbox: [55, 8, 58, 15] },
  { iso3: 'FIN', iso2: 'FI', name: 'Finland', nameZh: '芬兰', flag: '\u{1F1EB}\u{1F1EE}', bbox: [60, 20, 70, 32] },
  { iso3: 'ISL', iso2: 'IS', name: 'Iceland', nameZh: '冰岛', flag: '\u{1F1EE}\u{1F1F8}', bbox: [63, -25, 67, -13] },
  { iso3: 'MCO', iso2: 'MC', name: 'Monaco', nameZh: '摩纳哥', flag: '\u{1F1F2}\u{1F1E8}', bbox: [43.7, 7.4, 43.8, 7.5] },
  { iso3: 'HRV', iso2: 'HR', name: 'Croatia', nameZh: '克罗地亚', flag: '\u{1F1ED}\u{1F1F7}', bbox: [42, 14, 46, 20] },
  { iso3: 'HUN', iso2: 'HU', name: 'Hungary', nameZh: '匈牙利', flag: '\u{1F1ED}\u{1F1FA}', bbox: [46, 16, 49, 23] },
  { iso3: 'ROM', iso2: 'RO', name: 'Romania', nameZh: '罗马尼亚', flag: '\u{1F1F7}\u{1F1F4}', bbox: [44, 22, 48, 30] },
  { iso3: 'MNG', iso2: 'MN', name: 'Mongolia', nameZh: '蒙古', flag: '\u{1F1F2}\u{1F1F3}', bbox: [42, 88, 52, 120] },
  { iso3: 'KAZ', iso2: 'KZ', name: 'Kazakhstan', nameZh: '哈萨克斯坦', flag: '\u{1F1F0}\u{1F1FF}', bbox: [40, 46, 56, 87] },
];

/** 按 bbox 面积从小到大排序（小国优先匹配，避免被大国的 bbox 吞掉） */
const SORTED_BY_AREA: CountryListItem[] = [...POPULAR_COUNTRIES].sort((a, b) => {
  const aa = (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]);
  const bb = (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]);
  return aa - bb;
});

/** 根据 [lng, lat] 坐标检测所在国家，返回 ISO3 或 null */
export function detectCountryFromCoords(lng: number, lat: number): string | null {
  for (const c of SORTED_BY_AREA) {
    const [minLat, minLng, maxLat, maxLng] = c.bbox;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return c.iso3;
    }
  }
  return null;
}

/** 按 ISO3 快速查找 */
const BY_ISO3 = new Map(POPULAR_COUNTRIES.map(c => [c.iso3, c]));

export function getCountryItem(iso3: string): CountryListItem | undefined {
  return BY_ISO3.get(iso3);
}
