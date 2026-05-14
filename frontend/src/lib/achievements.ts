/**
 * 成就系统 — 规则定义与检测（足迹页面专用）
 */

import type { FootprintStatsData } from '@/lib/types';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'region' | 'milestone' | 'special';
  rarity: AchievementRarity;
  target?: number;
  unit?: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  footprintStats: FootprintStatsData;
  activeCountry: string;
  totalTrips: number;
  totalPhotos: number;
  totalDistance: number;
}

export const RARITY_CONFIG: Record<AchievementRarity, { label: string; color: string; border: string; glow: string }> = {
  common:    { label: '普通', color: '#9ca3af', border: 'border-gray-500/30', glow: '' },
  rare:      { label: '稀有', color: '#60a5fa', border: 'border-blue-400/40', glow: '' },
  epic:      { label: '史诗', color: '#a78bfa', border: 'border-purple-400/40', glow: 'shadow-[0_0_12px_rgba(167,139,250,0.3)]' },
  legendary: { label: '传说', color: '#fbbf24', border: 'border-amber-400/50', glow: 'shadow-[0_0_16px_rgba(251,191,36,0.4)]' },
};

/** 所有成就定义 */
export const ACHIEVEMENTS: Achievement[] = [
  // 区域点亮类
  {
    id: 'first_province',
    name: '初出茅庐',
    description: '点亮第一个省份',
    icon: 'star',
    category: 'region',
    rarity: 'common',
    target: 1,
    unit: '省',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[1] ?? 0) >= 1,
  },
  {
    id: 'five_provinces',
    name: '五省达人',
    description: '点亮 5 个省份',
    icon: 'award',
    category: 'region',
    rarity: 'rare',
    target: 5,
    unit: '省',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[1] ?? 0) >= 5,
  },
  {
    id: 'ten_provinces',
    name: '半壁江山',
    description: '点亮 10 个省份',
    icon: 'trophy',
    category: 'region',
    rarity: 'epic',
    target: 10,
    unit: '省',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[1] ?? 0) >= 10,
  },
  {
    id: 'twenty_provinces',
    name: '走遍中国',
    description: '点亮 20 个省份',
    icon: 'crown',
    category: 'region',
    rarity: 'epic',
    target: 20,
    unit: '省',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[1] ?? 0) >= 20,
  },
  {
    id: 'all_provinces',
    name: '全国制霸',
    description: '点亮全部 34 个省级行政区',
    icon: 'gem',
    category: 'region',
    rarity: 'legendary',
    target: 34,
    unit: '省',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[1] ?? 0) >= 34,
  },
  {
    id: 'first_city',
    name: '城市探索者',
    description: '点亮第一个城市',
    icon: 'building',
    category: 'region',
    rarity: 'common',
    target: 1,
    unit: '市',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[2] ?? 0) >= 1,
  },
  {
    id: 'fifty_cities',
    name: '城市收藏家',
    description: '点亮 50 个城市',
    icon: 'building-2',
    category: 'region',
    rarity: 'epic',
    target: 50,
    unit: '市',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[2] ?? 0) >= 50,
  },
  {
    id: 'first_district',
    name: '深入基层',
    description: '点亮第一个区县',
    icon: 'map-pin',
    category: 'region',
    rarity: 'common',
    target: 1,
    unit: '区',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[3] ?? 0) >= 1,
  },
  {
    id: 'hundred_districts',
    name: '区县百晓生',
    description: '点亮 100 个区县',
    icon: 'map',
    category: 'region',
    rarity: 'epic',
    target: 100,
    unit: '区',
    check: (stats) => stats.activeCountry === 'CHN' && (stats.footprintStats.byCountry['CHN']?.counts[3] ?? 0) >= 100,
  },
  {
    id: 'first_country',
    name: '环球旅行家',
    description: '在 2 个以上国家留下足迹',
    icon: 'globe',
    category: 'region',
    rarity: 'rare',
    target: 2,
    unit: '国',
    check: (stats) => Object.keys(stats.footprintStats.byCountry).length >= 2,
  },
  {
    id: 'five_countries',
    name: '五大洲',
    description: '在 5 个以上国家留下足迹',
    icon: 'globe-2',
    category: 'region',
    rarity: 'epic',
    target: 5,
    unit: '国',
    check: (stats) => Object.keys(stats.footprintStats.byCountry).length >= 5,
  },
  {
    id: 'ten_countries',
    name: '世界公民',
    description: '在 10 个以上国家留下足迹',
    icon: 'globe-2',
    category: 'region',
    rarity: 'legendary',
    target: 10,
    unit: '国',
    check: (stats) => Object.keys(stats.footprintStats.byCountry).length >= 10,
  },
  // 里程碑类
  {
    id: 'first_trip',
    name: '踏上旅途',
    description: '创建第一段行程',
    icon: 'plane',
    category: 'milestone',
    rarity: 'common',
    target: 1,
    unit: '次',
    check: (stats) => stats.totalTrips >= 1,
  },
  {
    id: 'ten_trips',
    name: '旅行老手',
    description: '创建 10 段行程',
    icon: 'compass',
    category: 'milestone',
    rarity: 'epic',
    target: 10,
    unit: '次',
    check: (stats) => stats.totalTrips >= 10,
  },
  {
    id: 'first_photo',
    name: '定格瞬间',
    description: '导入第一张照片',
    icon: 'camera',
    category: 'milestone',
    rarity: 'common',
    target: 1,
    unit: '张',
    check: (stats) => stats.totalPhotos >= 1,
  },
  {
    id: 'hundred_photos',
    name: '百张回忆',
    description: '导入 100 张照片',
    icon: 'image',
    category: 'milestone',
    rarity: 'epic',
    target: 100,
    unit: '张',
    check: (stats) => stats.totalPhotos >= 100,
  },
  {
    id: 'ten_thousand_km',
    name: '万里长征',
    description: '累计旅行里程超过 10000 公里',
    icon: 'route',
    category: 'milestone',
    rarity: 'legendary',
    target: 10000,
    unit: 'km',
    check: (stats) => stats.totalDistance >= 10000000,
  },
];

/** 检查已解锁的成就 */
export function checkAchievements(stats: AchievementStats): string[] {
  return ACHIEVEMENTS.filter(a => a.check(stats)).map(a => a.id);
}

/** 获取成就详情 */
export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
