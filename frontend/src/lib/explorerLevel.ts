/**
 * 探索者等级系统
 * 基于总体探索百分比计算等级
 */

export interface ExplorerLevel {
  id: string;
  name: string;
  emoji: string;
  minPercent: number;
  color: string;       // Tailwind 渐变色
  glowColor: string;   // 光晕色
}

export const EXPLORER_LEVELS: ExplorerLevel[] = [
  { id: 'novice',       name: '新手探索者',   emoji: '🌱', minPercent: 0,  color: 'from-gray-400 to-gray-500',       glowColor: 'rgba(156,163,175,0.3)' },
  { id: 'beginner',     name: '初级旅行者',   emoji: '🗺️', minPercent: 5,  color: 'from-green-400 to-emerald-500',   glowColor: 'rgba(52,211,153,0.3)' },
  { id: 'intermediate', name: '资深旅行家',   emoji: '🧳', minPercent: 15, color: 'from-blue-400 to-indigo-500',     glowColor: 'rgba(96,165,250,0.3)' },
  { id: 'advanced',     name: '环球探险家',   emoji: '✈️', minPercent: 30, color: 'from-purple-400 to-violet-500',   glowColor: 'rgba(167,139,250,0.3)' },
  { id: 'expert',       name: '世界征服者',   emoji: '🌍', minPercent: 50, color: 'from-amber-400 to-orange-500',    glowColor: 'rgba(251,191,36,0.3)' },
  { id: 'master',       name: '传奇旅行家',   emoji: '👑', minPercent: 75, color: 'from-rose-400 to-pink-500',      glowColor: 'rgba(251,113,133,0.3)' },
  { id: 'legend',       name: '全知全能',     emoji: '💎', minPercent: 95, color: 'from-cyan-400 to-blue-500',       glowColor: 'rgba(34,211,238,0.3)' },
];

export function calculateExplorerLevel(overallPercent: number): ExplorerLevel {
  for (let i = EXPLORER_LEVELS.length - 1; i >= 0; i--) {
    if (overallPercent >= EXPLORER_LEVELS[i].minPercent) return EXPLORER_LEVELS[i];
  }
  return EXPLORER_LEVELS[0];
}

export function getNextLevel(currentLevel: ExplorerLevel): ExplorerLevel | null {
  const idx = EXPLORER_LEVELS.findIndex(l => l.id === currentLevel.id);
  return idx < EXPLORER_LEVELS.length - 1 ? EXPLORER_LEVELS[idx + 1] : null;
}

export function getLevelProgress(overallPercent: number): number {
  const level = calculateExplorerLevel(overallPercent);
  const next = getNextLevel(level);
  if (!next) return 100;
  const range = next.minPercent - level.minPercent;
  const progress = overallPercent - level.minPercent;
  return Math.min(100, Math.round((progress / range) * 100));
}
