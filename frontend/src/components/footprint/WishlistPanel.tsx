'use client';

import { useState, useMemo } from 'react';
import { Heart, X, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import type { WishlistPriority, WishlistStore } from '@/lib/types';
import { WISHLIST_PRIORITY_LABELS, WISHLIST_PRIORITY_ICONS } from '@/lib/types';

const PRIORITIES: WishlistPriority[] = ['must-go', 'next-time', 'if-chance'];

interface WishlistPanelProps {
  isDark: boolean;
  litAdcodes: Set<string>;
}

export function WishlistPanel({ isDark, litAdcodes }: WishlistPanelProps) {
  const { items, removeItem, updatePriority, getAll, getVisitedWishlist } = useWishlist();
  const [expandedPriority, setExpandedPriority] = useState<WishlistPriority | null>('must-go');
  const [showVisited, setShowVisited] = useState(false);

  const allItems = getAll();
  const visitedItems = getVisitedWishlist(litAdcodes);

  const grouped = useMemo(() => {
    const groups: Record<WishlistPriority, typeof allItems> = {
      'must-go': [],
      'next-time': [],
      'if-chance': [],
    };
    for (const item of allItems) {
      const isVisited = litAdcodes.has(item.adcode);
      if (isVisited && !showVisited) continue;
      groups[item.priority].push(item);
    }
    return groups;
  }, [allItems, litAdcodes, showVisited]);

  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const subText = isDark ? 'text-gray-600' : 'text-gray-400';

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-pink-400" />
          <span className="text-sm font-medium">愿望清单</span>
          <span className="text-xs text-[var(--color-text-tertiary)]">{allItems.length} 个</span>
        </div>
        {visitedItems.length > 0 && (
          <button
            onClick={() => setShowVisited(!showVisited)}
            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            {showVisited ? '收起' : `${visitedItems.length} 个已到达`}
            {showVisited ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>

      {allItems.length === 0 ? (
        <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4">
          还没有想去的地点，在地图上右键可添加
        </p>
      ) : (
        PRIORITIES.map(priority => {
          const items = grouped[priority];
          const isExpanded = expandedPriority === priority;
          return (
            <div key={priority}>
              <button
                onClick={() => setExpandedPriority(isExpanded ? null : priority)}
                className="w-full flex items-center gap-1 text-left"
              >
                {isExpanded ? <ChevronDown size={12} className={subText} /> : <ChevronRight size={12} className={subText} />}
                <span>{WISHLIST_PRIORITY_ICONS[priority]}</span>
                <span className={`text-[11px] ${mutedText}`}>
                  {WISHLIST_PRIORITY_LABELS[priority]} ({items.length})
                </span>
              </button>

              {isExpanded && items.length > 0 && (
                <div className="mt-1 space-y-1">
                  {items.map(item => {
                    const isVisited = litAdcodes.has(item.adcode);
                    return (
                      <div
                        key={item.adcode}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                      >
                        <span className="text-xs">{isVisited ? '✅' : '📍'}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs truncate ${isVisited ? 'line-through opacity-60' : ''}`}>
                            {item.name}
                          </div>
                          {isVisited && <div className="text-[9px] text-green-400">已到达!</div>}
                        </div>
                        <button
                          onClick={() => removeItem(item.adcode)}
                          className="text-[10px] text-red-400/50 hover:text-red-400 p-1"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {isExpanded && items.length === 0 && (
                <p className="text-[10px] text-[var(--color-text-tertiary)] pl-4 py-1">暂无</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
