'use client';

import { calculateExplorerLevel, getNextLevel, getLevelProgress, type ExplorerLevel } from '@/lib/explorerLevel';

const LEVEL_COLORS: Record<string, { from: string; to: string }> = {
  novice:       { from: '#9ca3af', to: '#6b7280' },
  beginner:     { from: '#4ade80', to: '#10b981' },
  intermediate: { from: '#60a5fa', to: '#6366f1' },
  advanced:     { from: '#a78bfa', to: '#8b5cf6' },
  expert:       { from: '#fbbf24', to: '#f97316' },
  master:       { from: '#fb7185', to: '#ec4899' },
  legend:       { from: '#22d3ee', to: '#3b82f6' },
};

function getGradient(levelId: string): string {
  const c = LEVEL_COLORS[levelId] || LEVEL_COLORS.novice;
  return `linear-gradient(135deg, ${c.from}, ${c.to})`;
}

function getTextColor(levelId: string): string {
  return LEVEL_COLORS[levelId]?.from || '#9ca3af';
}

interface ExplorerLevelBadgeProps {
  overallPercent: number;
  compact?: boolean;
}

export function ExplorerLevelBadge({ overallPercent, compact = false }: ExplorerLevelBadgeProps) {
  const level = calculateExplorerLevel(overallPercent);
  const next = getNextLevel(level);
  const progress = getLevelProgress(overallPercent);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
        <span className="text-sm">{level.emoji}</span>
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{level.name}</span>
        <span className="text-xs font-bold" style={{ color: getTextColor(level.id) }}>
          {overallPercent}%
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{level.emoji}</span>
          <div>
            <div className="text-sm font-bold text-[var(--color-text-primary)]">{level.name}</div>
            <div className="text-xs text-[var(--color-text-tertiary)]">已探索 {overallPercent}%</div>
          </div>
        </div>
        <div className="text-3xl font-extrabold" style={{ background: getGradient(level.id), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {overallPercent}%
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: getGradient(level.id) }}
        />
      </div>

      {next && (
        <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
          距离 <span className="font-medium">{next.emoji} {next.name}</span> 还需 {next.minPercent - overallPercent}%
        </div>
      )}
    </div>
  );
}
