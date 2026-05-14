'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAttractionSearch } from '@/hooks/useAttractionSearch';
import { Search, X, ExternalLink, MapPin } from 'lucide-react';

interface Props {
  value?: string;        // attractionId
  onSelect: (attraction: { id: string; name: string; extract?: string; imageUrl?: string; wikipediaUrl?: string; lat?: number; lng?: number }) => void;
}

export function AttractionSearch({ value, onSelect }: Props) {
  const { results, loading, error, search, clear } = useAttractionSearch();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => search(val), 500);
    } else {
      clear();
    }
  }, [search, clear]);

  const handleSelect = useCallback((result: typeof results[0]) => {
    setSelected(result.id);
    onSelect({
      id: result.id,
      name: result.name,
      extract: result.extract,
      imageUrl: result.imageUrl,
      wikipediaUrl: result.wikipediaUrl,
      lat: result.lat,
      lng: result.lng,
    });
    setQuery(result.name);
    clear();
  }, [onSelect, clear]);

  const handleClear = useCallback(() => {
    setSelected(null);
    setQuery('');
    clear();
    onSelect(null as unknown as Parameters<typeof onSelect>[0]);
  }, [clear, onSelect]);

  // 点击外部关闭
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clear();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [clear]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <Search size={14} className="absolute left-3 text-[var(--color-text-secondary)]" />
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索景点（如：西湖）"
          value={query}
          onChange={e => handleInput(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        {selected && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 rounded hover:bg-white/10 text-[var(--color-text-secondary)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--color-bg)] border border-white/10 rounded-xl shadow-xl z-30 max-h-80 overflow-y-auto">
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                {r.imageUrl && (
                  <img src={r.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{r.name}</div>
                  {r.extract && (
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{r.extract}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {r.lat && (
                      <span className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-0.5">
                        <MapPin size={10} />
                        {r.lat.toFixed(2)}, {r.lng?.toFixed(2)}
                      </span>
                    )}
                    {r.wikipediaUrl && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                        <ExternalLink size={10} />
                        Wikipedia
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 加载/错误 */}
      {loading && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--color-bg)] border border-white/10 rounded-xl p-4 text-center text-sm text-[var(--color-text-secondary)]">
          搜索中...
        </div>
      )}
      {error && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--color-bg)] border border-white/10 rounded-xl p-4 text-center text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
