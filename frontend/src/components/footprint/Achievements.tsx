'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, checkAchievements, RARITY_CONFIG, type AchievementStats } from '@/lib/achievements';

interface AchievementsPanelProps {
  stats: AchievementStats;
  isDark: boolean;
}

const EMOJI: Record<string, string> = {
  star: '\u2B50', award: '\uD83C\uDFC6', trophy: '\uD83C\uDFC5', crown: '\uD83D\uDC51',
  gem: '\uD83D\uDC8E', building: '\uD83C\uDFE0', 'building-2': '\uD83C\uDFD7',
  'map-pin': '\uD83D\uDCCD', map: '\uD83D\uDDFA', plane: '\u2708',
  compass: '\uD83E\uDDED', camera: '\uD83D\uDCF8', image: '\uD83D\uDBC6',
  route: '\uD83D\uDE82',
};

export function AchievementsPanel({ stats, isDark }: AchievementsPanelProps) {
  const [open, setOpen] = useState(false);
  const unlockedIds = useMemo(() => checkAchievements(stats), [stats]);

  const text = isDark ? 'text-gray-400' : 'text-gray-500';
  const subText = isDark ? 'text-gray-600' : 'text-gray-400';

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-3 py-1 text-left"
      >
        {open ? <ChevronDown size={12} className={subText} /> : <ChevronRight size={12} className={subText} />}
        <Trophy size={12} className={subText} />
        <span className={`text-[11px] ${text}`}>成就</span>
        <span className={`text-[10px] ${subText}`}>{unlockedIds.length}/{ACHIEVEMENTS.length}</span>
      </button>

      {open && (
        <div className="px-3 pb-2 grid grid-cols-5 gap-1">
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedIds.includes(a.id);
            const rarity = RARITY_CONFIG[a.rarity];
            return (
              <div
                key={a.id}
                className={`flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                  unlocked
                    ? `${rarity.border} bg-white/5 ${rarity.glow}`
                    : (isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100')
                }`}
                title={`${rarity.label} · ${a.name}: ${a.description}`}
              >
                <span className={`text-base ${unlocked ? '' : 'opacity-25 grayscale'}`}>
                  {EMOJI[a.icon] || '\uD83D\uDCCD'}
                </span>
                <span className={`text-[8px] text-center leading-tight mt-0.5 ${
                  unlocked ? '' : (isDark ? 'text-gray-700' : 'text-gray-300')
                }`}
                  style={unlocked ? { color: rarity.color } : undefined}
                >
                  {a.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
