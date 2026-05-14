'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DiaryEntryType } from '@/lib/types';
import { Search, X, Filter } from 'lucide-react';

interface SearchState {
  query: string;
  type: DiaryEntryType | '';
  mood: string;
  hasPhotos: boolean | null;
  hasTrack: boolean | null;
}

interface Props {
  onSearch: (state: SearchState) => void;
  onClear: () => void;
}

const MOODS = ['😊 开心', '😌 平静', '🌄 震撼', '😴 累了', '🤔 思考', '🎉 期待', '😢 难过', '😤 愤怒', '🤩 惊喜'];

export function DiarySearchBar({ onSearch, onClear }: Props) {
  const [state, setState] = useState<SearchState>({
    query: '',
    type: '',
    mood: '',
    hasPhotos: null,
    hasTrack: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((partial: Partial<SearchState>) => {
    setState(prev => {
      const next = { ...prev, ...partial };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(next), 300);
      return next;
    });
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setState({ query: '', type: '', mood: '', hasPhotos: null, hasTrack: null });
    setShowFilters(false);
    onClear();
  }, [onClear]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const hasActiveFilters = state.type || state.mood || state.hasPhotos !== null || state.hasTrack !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索日记内容、标题、地点..."
            value={state.query}
            onChange={e => update({ query: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          {(state.query || hasActiveFilters) && (
            <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10">
              <X size={14} className="text-[var(--color-text-secondary)]" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border transition-colors ${showFilters || hasActiveFilters ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-white/10 text-[var(--color-text-secondary)] hover:bg-white/10'}`}
        >
          <Filter size={16} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
          {/* 类型 */}
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">类型</label>
            <div className="flex gap-2">
              {([
                { value: '' as const, label: '全部' },
                { value: 'track_entry' as const, label: '轨迹' },
                { value: 'memory_entry' as const, label: '记忆' },
                { value: 'note_entry' as const, label: '笔记' },
              ]).map(t => (
                <button
                  key={t.value}
                  onClick={() => update({ type: t.value })}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${state.type === t.value ? 'bg-blue-600 text-white' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 心情 */}
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">心情</label>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => update({ mood: '' })}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${!state.mood ? 'bg-blue-600 text-white' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'}`}
              >
                全部
              </button>
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => update({ mood: m })}
                  className={`px-2 py-1 rounded-lg text-xs transition-colors ${state.mood === m ? 'bg-blue-600 text-white' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 更多筛选 */}
          <div className="flex gap-2">
            <button
              onClick={() => update({ hasPhotos: state.hasPhotos === true ? null : true })}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${state.hasPhotos === true ? 'bg-blue-600 text-white' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'}`}
            >
              有照片
            </button>
            <button
              onClick={() => update({ hasTrack: state.hasTrack === true ? null : true })}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${state.hasTrack === true ? 'bg-blue-600 text-white' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'}`}
            >
              有轨迹
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
