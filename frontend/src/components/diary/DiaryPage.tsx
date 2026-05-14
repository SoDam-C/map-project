'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initStorage } from '@/lib/storage';
import { useDiary } from '@/hooks/useDiary';
import { useDiaryTrips } from '@/hooks/useDiaryTrips';
import { DiaryTimeline } from './DiaryTimeline';
import { DiaryEditor } from './DiaryEditor';
import { DiarySearchBar } from './DiarySearch';
import { TripCard } from './TripCard';
import { Plus, ChevronLeft, ChevronRight, BookOpen, Route, Download, BarChart3, MapPin, Image, Trophy, Upload, Star, Target, FileBarChart } from 'lucide-react';
import Link from 'next/link';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { DiaryEntryType } from '@/lib/types';

interface SearchState {
  query: string;
  type: DiaryEntryType | '';
  mood: string;
  hasPhotos: boolean | null;
  hasTrack: boolean | null;
}

export function DiaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  useState(() => { initStorage(); });

  const {
    entries, createEntry, updateEntry, deleteEntry,
    getAllDates, getEntriesByDate, getStats,
  } = useDiary();
  const { trips, getTripsList, createTrip, deleteTrip } = useDiaryTrips();

  const [editingId, setEditingId] = useState<string | null>(editId);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showTrips, setShowTrips] = useState(false);
  const [searchState, setSearchState] = useState<SearchState | null>(null);

  const stats = getStats();
  const dates = getAllDates();

  // 搜索过滤
  const filteredEntries = useMemo(() => {
    const all = Object.values(entries);
    if (!searchState) return all;

    return all.filter(entry => {
      // 全文搜索
      if (searchState.query) {
        const q = searchState.query.toLowerCase();
        const haystack = [
          entry.title, entry.content, entry.locationName,
          ...(entry.tags || []),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // 类型
      if (searchState.type && entry.type !== searchState.type) return false;

      // 心情
      if (searchState.mood && entry.mood !== searchState.mood) return false;

      // 有照片
      if (searchState.hasPhotos === true && entry.photoRefs.length === 0) return false;

      // 有轨迹
      if (searchState.hasTrack === true && !(entry.trackIds?.length)) return false;

      return true;
    });
  }, [entries, searchState]);

  const filteredDates = useMemo(() => {
    const dateSet = new Set(filteredEntries.map(e => e.date));
    return dates.filter(d => dateSet.has(d));
  }, [filteredEntries, dates]);

  const monthDates = filteredDates.filter(d => d.startsWith(currentMonth));

  const monthLabel = (() => {
    const [y, m] = currentMonth.split('-');
    const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    return `${y}年 ${months[parseInt(m) - 1]}`;
  })();

  const prevMonth = useCallback(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [currentMonth]);

  const handleNewEntry = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const id = createEntry({
      type: 'memory_entry',
      date: today,
      startTime: new Date().toISOString(),
      title: '',
      content: '',
      photoRefs: [],
      status: 'draft',
    });
    setEditingId(id);
  }, [createEntry]);

  const handleNewTrip = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    createTrip('新旅行', today, today);
  }, [createTrip]);

  const handleSave = useCallback(() => {
    setEditingId(null);
    router.push('/diary');
  }, [router]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    router.push('/diary');
  }, [router]);

  const handleEntryClick = useCallback((id: string) => {
    router.push(`/diary/${id}`);
  }, [router]);

  const handleExport = useCallback((format: string) => {
    window.open(`/api/diary/export?format=${format}`, '_blank');
  }, []);

  const handleSearch = useCallback((state: SearchState) => {
    setSearchState(state);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchState(null);
  }, []);

  // 编辑模式
  if (editingId) {
    const entry = entries[editingId];
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <DiaryEditor
          entry={entry || null}
          trips={getTripsList()}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  const isSearching = searchState && (searchState.query || searchState.type || searchState.mood || searchState.hasPhotos || searchState.hasTrack);

  // 键盘快捷键
  useKeyboardShortcuts({
    'n': handleNewEntry,
    'Escape': () => { setEditingId(null); router.push('/diary'); },
    'true+s': handleSave,
    'true+n': handleNewEntry,
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={24} />
            我的日记
          </h1>
          <div className="flex items-center gap-1">
            <Link href="/diary/stats" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="统计">
              <BarChart3 size={18} />
            </Link>
            <Link href="/diary/map" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="日记地图">
              <MapPin size={18} />
            </Link>
            <Link href="/diary/photos" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="照片">
              <Image size={18} />
            </Link>
            <Link href="/diary/achievements" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="成就">
              <Trophy size={18} />
            </Link>
            <Link href="/diary/import" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="导入照片">
              <Upload size={18} />
            </Link>
            <Link href="/diary/report" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="年度报告">
              <FileBarChart size={18} />
            </Link>
            <Link href="/diary/places" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="地点收藏">
              <Star size={18} />
            </Link>
            <Link href="/diary/progress" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="城市进度">
              <Target size={18} />
            </Link>
            <div className="relative group">
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Download size={18} />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-[var(--color-bg)] border border-white/10 rounded-xl shadow-xl z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[120px]">
                {[
                  { label: 'JSON', format: 'json' },
                  { label: 'Markdown', format: 'markdown' },
                  { label: 'GeoJSON', format: 'geojson' },
                ].map(f => (
                  <button
                    key={f.format}
                    onClick={() => handleExport(f.format)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                  >
                    {f.label}
                  </button>
                ))}
                <div className="border-t border-white/10 my-1" />
                <Link href="/diary/import/json" className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors block">
                  导入 JSON
                </Link>
              </div>
            </div>
            <button
              onClick={handleNewEntry}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus size={16} />
              新建
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="mb-4">
          <DiarySearchBar onSearch={handleSearch} onClear={handleClearSearch} />
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: '总条目', value: stats.total },
            { label: '已写', value: stats.withContent },
            { label: '待填充', value: stats.drafts },
            { label: '有照片', value: stats.withPhotos },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 搜索结果提示 */}
        {isSearching && (
          <div className="text-xs text-[var(--color-text-secondary)] mb-3">
            搜索到 {filteredEntries.length} 条结果
          </div>
        )}

        {/* 月份导航（非搜索模式时显示） */}
        {!isSearching && (
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-semibold">{monthLabel}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* 旅行分组 */}
        {!isSearching && getTripsList().length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowTrips(!showTrips)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-3 transition-colors"
            >
              <Route size={16} />
              旅行 ({getTripsList().length})
              <ChevronRight size={14} className={`transition-transform ${showTrips ? 'rotate-90' : ''}`} />
            </button>
            {showTrips && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {getTripsList().map(trip => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    entryCount={Object.values(entries).filter(e => e.tripId === trip.id).length}
                    onClick={() => router.push(`/diary/trips/${trip.id}`)}
                    onDelete={() => deleteTrip(trip.id)}
                  />
                ))}
                <button
                  onClick={handleNewTrip}
                  className="flex-shrink-0 w-32 h-20 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-[var(--color-text-secondary)] hover:border-white/40 hover:text-[var(--color-text)] transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 时间线 */}
        {(isSearching ? filteredDates : monthDates).length > 0 ? (
          <DiaryTimeline
            dates={isSearching ? filteredDates : monthDates}
            getEntriesForDate={(date) => {
              const all = getEntriesByDate(date);
              if (!searchState) return all;
              return all.filter(entry => {
                if (searchState.query) {
                  const q = searchState.query.toLowerCase();
                  const haystack = [entry.title, entry.content, entry.locationName, ...(entry.tags || [])].join(' ').toLowerCase();
                  if (!haystack.includes(q)) return false;
                }
                if (searchState.type && entry.type !== searchState.type) return false;
                if (searchState.mood && entry.mood !== searchState.mood) return false;
                if (searchState.hasPhotos === true && entry.photoRefs.length === 0) return false;
                if (searchState.hasTrack === true && !(entry.trackIds?.length)) return false;
                return true;
              });
            }}
            onEntryClick={handleEntryClick}
          />
        ) : (
          <div className="text-center py-20 text-[var(--color-text-secondary)]">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">{isSearching ? '没有匹配的日记' : '这个月还没有记录'}</p>
            <p className="text-sm">{isSearching ? '试试其他关键词' : '点击「新建」开始写日记'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
