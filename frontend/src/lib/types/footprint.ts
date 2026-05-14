/**
 * 足迹核心类型定义
 */

import type { AdminLevel } from '../adminRegions';

/** 足迹来源类型 */
export type FootprintSource = 'manual' | 'gps' | 'photo' | 'trip' | 'track' | 'ancestor';

/** 足迹记录 */
export interface FootprintRecord {
  id: string;
  adcode: string;
  name: string;
  level: AdminLevel;
  center: [number, number];
  litAt: string;
  source: FootprintSource;
  sourceId?: string;
}

/** 单个国家/地区的足迹统计 */
export interface CountryFootprintStats {
  counts: Partial<Record<AdminLevel, number>>;
  percentages: Partial<Record<AdminLevel, number>>;
}

/** 足迹统计（按国家分组） */
export interface FootprintStatsData {
  byCountry: Record<string, CountryFootprintStats>;
  recentList: FootprintRecord[];
}

/** 足迹存储结构 */
export type FootprintStore = Record<string, FootprintRecord>;

/** 从旧版 Footprint 接口迁移 */
export interface LegacyFootprint {
  adcode: string;
  litAt: string;
  source: 'manual' | 'gps' | 'photo';
}

/** 愿望清单优先级 */
export type WishlistPriority = 'must-go' | 'next-time' | 'if-chance';

export const WISHLIST_PRIORITY_LABELS: Record<WishlistPriority, string> = {
  'must-go': '想去了',
  'next-time': '下次去',
  'if-chance': '有机会去',
};

export const WISHLIST_PRIORITY_ICONS: Record<WishlistPriority, string> = {
  'must-go': '🔴',
  'next-time': '🟡',
  'if-chance': '🟢',
};

/** 愿望清单项 */
export interface WishlistItem {
  id: string;
  adcode: string;
  name: string;
  level: AdminLevel;
  priority: WishlistPriority;
  addedAt: string;
  note?: string;
}

/** 愿望清单存储 */
export type WishlistStore = Record<string, WishlistItem>;
