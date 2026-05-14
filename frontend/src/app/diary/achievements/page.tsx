'use client';

import { useState, useEffect } from 'react';
import { initStorage, load } from '@/lib/storage';
import type { DiaryStore, DiaryTripStore, FootprintStore } from '@/lib/types';
import { ACHIEVEMENTS, checkAchievements, getAchievementProgressDetailed, RARITY_CONFIG } from '@/components/diary/AchievementSystem';
import type { AchievementRarity } from '@/components/diary/AchievementSystem';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  diary: '日记',
  footprint: '足迹',
  travel: '旅行',
  photo: '照片',
  track: '轨迹',
};

const RARITY_ORDER: AchievementRarity[] = ['legendary', 'epic', 'rare', 'common'];

export default function AchievementsPage() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, { current: number; target: number }>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage();
    const diary = load<DiaryStore>('diary') || {};
    const trips = load<DiaryTripStore>('diary-trips') || {};
    const footprints = load<FootprintStore>('footprints') || {};
    const data = { diary, trips, footprints };
    setUnlocked(new Set(checkAchievements(data)));
    setProgress(getAchievementProgressDetailed(data));
    setReady(true);
  }, []);

  if (!ready) return null;

  const unlockedCount = unlocked.size;
  const totalCount = ACHIEVEMENTS.length;

  // Group by rarity, then by category within each rarity
  const byRarity = RARITY_ORDER.map(rarity => ({
    rarity,
    config: RARITY_CONFIG[rarity],
    achievements: ACHIEVEMENTS.filter(a => a.rarity === rarity),
  })).filter(g => g.achievements.length > 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/diary" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy size={24} className="text-yellow-400" />
            成就
          </h1>
        </div>

        {/* Overall progress */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-secondary)]">解锁进度</span>
            <span className="text-sm font-medium">{unlockedCount} / {totalCount}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* By rarity tier */}
        {byRarity.map(group => {
          const unlockedInGroup = group.achievements.filter(a => unlocked.has(a.id)).length;
          return (
            <div key={group.rarity} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: group.config.color + '20', color: group.config.color }}>
                  {group.config.label}
                </span>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {unlockedInGroup}/{group.achievements.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {group.achievements.map(achievement => {
                  const isUnlocked = unlocked.has(achievement.id);
                  const prog = progress[achievement.id];
                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-xl p-3 text-center border transition-all ${
                        isUnlocked
                          ? `${group.config.border} bg-white/5 ${group.config.glow}`
                          : 'bg-white/[0.02] border-white/5 opacity-40'
                      }`}
                    >
                      <div className={`text-2xl mb-1 ${!isUnlocked ? 'grayscale' : ''}`}>{achievement.icon}</div>
                      <div className="text-xs font-medium leading-tight">{achievement.name}</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-tight">
                        {achievement.description}
                      </div>
                      {/* Progress bar for achievements with target */}
                      {prog && !isUnlocked && (
                        <div className="mt-1.5">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${(prog.current / prog.target) * 100}%`, backgroundColor: group.config.color }}
                            />
                          </div>
                          <div className="text-[9px] text-[var(--color-text-tertiary)] mt-0.5">
                            {prog.current}/{prog.target}
                          </div>
                        </div>
                      )}
                      {isUnlocked && (
                        <div className="text-[9px] mt-1" style={{ color: group.config.color }}>已解锁</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
