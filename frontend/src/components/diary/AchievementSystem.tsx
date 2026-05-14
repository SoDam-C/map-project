/**
 * 成就系统
 *
 * 勋章类型：
 *   - 点亮类：点亮 N 个省/市
 *   - 日记类：写 N 篇日记、连续 N 天
 *   - 旅行类：完成 N 次旅行
 *   - 照片类：添加 N 张照片
 *   - 轨迹类：记录 N 条轨迹
 */

import type { DiaryStore, DiaryTripStore, FootprintStore } from '@/lib/types';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'footprint' | 'diary' | 'travel' | 'photo' | 'track';
  rarity: AchievementRarity;
  check: (data: AchievementData) => boolean;
  target?: number;
  unit?: string;
}

interface AchievementData {
  diary: DiaryStore;
  trips: DiaryTripStore;
  footprints: FootprintStore;
}

const allEntries = (data: AchievementData) => Object.values(data.diary);
const allTrips = (data: AchievementData) => Object.values(data.trips);
const allFootprints = (data: AchievementData) => Object.values(data.footprints);

export const ACHIEVEMENTS: Achievement[] = [
  // === 日记类 ===
  {
    id: 'diary-first',
    name: '第一篇',
    description: '写下第一篇日记',
    icon: '📝',
    category: 'diary',
    rarity: 'common',
    check: d => allEntries(d).length >= 1,
  },
  {
    id: 'diary-10',
    name: '坚持记录',
    description: '写满 10 篇日记',
    icon: '📖',
    category: 'diary',
    rarity: 'rare',
    target: 10,
    unit: '篇',
    check: d => allEntries(d).length >= 10,
  },
  {
    id: 'diary-50',
    name: '笔耕不辍',
    description: '写满 50 篇日记',
    icon: '📚',
    category: 'diary',
    rarity: 'epic',
    target: 50,
    unit: '篇',
    check: d => allEntries(d).length >= 50,
  },
  {
    id: 'diary-100',
    name: '百篇日记',
    description: '写满 100 篇日记',
    icon: '🏆',
    category: 'diary',
    rarity: 'legendary',
    target: 100,
    unit: '篇',
    check: d => allEntries(d).length >= 100,
  },
  {
    id: 'streak-3',
    name: '三日连续',
    description: '连续 3 天写日记',
    icon: '🔥',
    category: 'diary',
    rarity: 'rare',
    check: d => getStreak(d) >= 3,
  },
  {
    id: 'streak-7',
    name: '一周连续',
    description: '连续 7 天写日记',
    icon: '🔥',
    category: 'diary',
    rarity: 'rare',
    check: d => getStreak(d) >= 7,
  },
  {
    id: 'streak-30',
    name: '月度坚持',
    description: '连续 30 天写日记',
    icon: '🔥',
    category: 'diary',
    rarity: 'epic',
    check: d => getStreak(d) >= 30,
  },
  {
    id: 'diary-photos',
    name: '图文并茂',
    description: '在一篇日记中添加 3 张以上照片',
    icon: '📷',
    category: 'diary',
    rarity: 'rare',
    check: d => allEntries(d).some(e => e.photoRefs.length >= 3),
  },
  {
    id: 'diary-tags',
    name: '标签达人',
    description: '使用超过 10 个不同的标签',
    icon: '🏷️',
    category: 'diary',
    rarity: 'rare',
    check: d => {
      const tags = new Set(allEntries(d).flatMap(e => e.tags || []));
      return tags.size >= 10;
    },
  },

  // === 足迹类 ===
  {
    id: 'footprint-first',
    name: '第一步',
    description: '点亮第一个足迹',
    icon: '👣',
    category: 'footprint',
    rarity: 'common',
    check: d => allFootprints(d).length >= 1,
  },
  {
    id: 'footprint-province-5',
    name: '走出家乡',
    description: '点亮 5 个省份',
    icon: '🗺️',
    category: 'footprint',
    rarity: 'rare',
    target: 5,
    unit: '省',
    check: d => getProvinceCount(d) >= 5,
  },
  {
    id: 'footprint-province-10',
    name: '走南闯北',
    description: '点亮 10 个省份',
    icon: '🗺️',
    category: 'footprint',
    rarity: 'epic',
    target: 10,
    unit: '省',
    check: d => getProvinceCount(d) >= 10,
  },
  {
    id: 'footprint-province-20',
    name: '大半个中国',
    description: '点亮 20 个省份',
    icon: '🇨🇳',
    category: 'footprint',
    rarity: 'epic',
    target: 20,
    unit: '省',
    check: d => getProvinceCount(d) >= 20,
  },
  {
    id: 'footprint-province-34',
    name: '走遍全国',
    description: '点亮所有省级行政区',
    icon: '🌍',
    category: 'footprint',
    rarity: 'legendary',
    target: 34,
    unit: '省',
    check: d => getProvinceCount(d) >= 34,
  },

  // === 旅行类 ===
  {
    id: 'travel-first',
    name: '第一次旅行',
    description: '创建第一个旅行分组',
    icon: '✈️',
    category: 'travel',
    rarity: 'common',
    check: d => allTrips(d).length >= 1,
  },
  {
    id: 'travel-5',
    name: '旅行达人',
    description: '完成 5 次旅行',
    icon: '🧳',
    category: 'travel',
    rarity: 'epic',
    target: 5,
    unit: '次',
    check: d => allTrips(d).length >= 5,
  },
  {
    id: 'travel-destinations',
    name: '目的地收集者',
    description: '去过 10 个不同的目的地',
    icon: '📍',
    category: 'travel',
    rarity: 'epic',
    check: d => {
      const dests = new Set(allTrips(d).flatMap(t => t.destinations));
      return dests.size >= 10;
    },
  },

  // === 照片类 ===
  {
    id: 'photo-10',
    name: '摄影入门',
    description: '累计添加 10 张照片',
    icon: '📸',
    category: 'photo',
    rarity: 'rare',
    target: 10,
    unit: '张',
    check: d => allEntries(d).reduce((s, e) => s + e.photoRefs.length, 0) >= 10,
  },
  {
    id: 'photo-50',
    name: '摄影爱好者',
    description: '累计添加 50 张照片',
    icon: '📷',
    category: 'photo',
    rarity: 'epic',
    target: 50,
    unit: '张',
    check: d => allEntries(d).reduce((s, e) => s + e.photoRefs.length, 0) >= 50,
  },
  {
    id: 'photo-100',
    name: '百图集',
    description: '累计添加 100 张照片',
    icon: '🎞️',
    category: 'photo',
    rarity: 'legendary',
    target: 100,
    unit: '张',
    check: d => allEntries(d).reduce((s, e) => s + e.photoRefs.length, 0) >= 100,
  },

  // === 轨迹类 ===
  {
    id: 'track-first',
    name: '轨迹起点',
    description: '创建第一篇轨迹日记',
    icon: '🛤️',
    category: 'track',
    rarity: 'common',
    check: d => allEntries(d).some(e => e.type === 'track_entry'),
  },
  {
    id: 'track-many',
    name: '轨迹记录者',
    description: '累计 10 篇轨迹日记',
    icon: '🗺️',
    category: 'track',
    rarity: 'rare',
    target: 10,
    unit: '篇',
    check: d => allEntries(d).filter(e => e.type === 'track_entry').length >= 10,
  },
];

function getStreak(data: AchievementData): number {
  const datesWithContent = new Set(
    allEntries(data).filter(e => e.content.length > 0).map(e => e.date)
  );
  if (datesWithContent.size === 0) return 0;
  let count = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (datesWithContent.has(key)) {
      count++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

function getProvinceCount(data: AchievementData): number {
  return allFootprints(data).filter(f => f.adcode.endsWith('0000')).length;
}

export function checkAchievements(data: AchievementData): string[] {
  return ACHIEVEMENTS.filter(a => a.check(data)).map(a => a.id);
}

export function getAchievementProgress(data: AchievementData): Record<string, number> {
  const progress: Record<string, number> = {};

  const entryCount = allEntries(data).length;
  progress['diary-count'] = entryCount;
  progress['streak'] = getStreak(data);
  progress['provinces'] = getProvinceCount(data);
  progress['trips'] = allTrips(data).length;
  progress['photos'] = allEntries(data).reduce((s, e) => s + e.photoRefs.length, 0);

  return progress;
}

/** Per-achievement detailed progress: { current, target } */
export function getAchievementProgressDetailed(data: AchievementData): Record<string, { current: number; target: number }> {
  const result: Record<string, { current: number; target: number }> = {};
  const entryCount = allEntries(data).length;
  const streak = getStreak(data);
  const provinceCount = getProvinceCount(data);
  const tripCount = allTrips(data).length;
  const photoCount = allEntries(data).reduce((s, e) => s + e.photoRefs.length, 0);
  const trackCount = allEntries(data).filter(e => e.type === 'track_entry').length;

  for (const a of ACHIEVEMENTS) {
    if (a.target == null) continue;
    let current = 0;
    if (a.id.startsWith('diary-') && a.category === 'diary') current = entryCount;
    else if (a.id.startsWith('streak-')) current = streak;
    else if (a.id.startsWith('footprint-province')) current = provinceCount;
    else if (a.id.startsWith('travel-')) current = tripCount;
    else if (a.id.startsWith('photo-')) current = photoCount;
    else if (a.id.startsWith('track-')) current = trackCount;
    result[a.id] = { current: Math.min(current, a.target), target: a.target };
  }
  return result;
}

/** Rarity visual config */
export const RARITY_CONFIG: Record<AchievementRarity, { label: string; color: string; border: string; glow: string }> = {
  common:    { label: '普通', color: '#9ca3af', border: 'border-gray-500/30', glow: '' },
  rare:      { label: '稀有', color: '#60a5fa', border: 'border-blue-400/40', glow: '' },
  epic:      { label: '史诗', color: '#a78bfa', border: 'border-purple-400/40', glow: 'shadow-[0_0_12px_rgba(167,139,250,0.3)]' },
  legendary: { label: '传说', color: '#fbbf24', border: 'border-amber-400/50', glow: 'shadow-[0_0_16px_rgba(251,191,36,0.4)]' },
};
