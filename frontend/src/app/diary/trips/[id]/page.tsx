'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initStorage, load, save } from '@/lib/storage';
import type { DiaryStore, DiaryEntry, DiaryTripStore, DiaryTrip } from '@/lib/types';
import { ArrowLeft, MapPin, Calendar, Pencil, Trash2, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trip, setTrip] = useState<DiaryTrip | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage();
    const trips = load<DiaryTripStore>('diary-trips') || {};
    const t = trips[id];
    if (!t) return;
    setTrip(t);
    setTitle(t.title);

    const allEntries = load<DiaryStore>('diary') || {};
    const tripEntries = t.entryIds
      .map(eid => allEntries[eid])
      .filter(Boolean)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    setEntries(tripEntries);
    setReady(true);
  }, [id]);

  const handleSave = useCallback(() => {
    if (!trip) return;
    const trips = load<DiaryTripStore>('diary-trips') || {};
    trips[id] = { ...trip, title, updatedAt: new Date().toISOString() };
    save('diary-trips', trips);
    setTrip(trips[id]);
    setEditing(false);
  }, [trip, id, title]);

  const handleDelete = useCallback(() => {
    if (!confirm('确定要删除这个旅行吗？')) return;
    const trips = load<DiaryTripStore>('diary-trips') || {};
    delete trips[id];
    save('diary-trips', trips);
    router.push('/diary');
  }, [id, router]);

  // 按日期分组
  const entriesByDate = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    entries.forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  const totalDays = new Set(entries.map(e => e.date)).size;
  const totalPhotos = entries.reduce((s, e) => s + e.photoRefs.length, 0);

  if (!ready) return null;
  if (!trip) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">旅行不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/diary" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          {editing ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 bg-transparent text-lg font-bold focus:outline-none"
              autoFocus
            />
          ) : (
            <h1 className="font-bold text-lg flex-1">{trip.title}</h1>
          )}
          {editing ? (
            <button onClick={handleSave} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm">保存</button>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-white/10"><Pencil size={16} /></button>
              <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 旅行信息 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xl font-bold">{totalDays}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">天</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xl font-bold">{entries.length}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">篇日记</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xl font-bold">{totalPhotos}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">张照片</div>
          </div>
        </div>

        {/* 日期范围 */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-4">
          <Calendar size={14} />
          <span>{trip.startDate}{trip.endDate !== trip.startDate && ` → ${trip.endDate}`}</span>
          {trip.destinations.length > 0 && (
            <span className="ml-auto flex items-center gap-1">
              <MapPin size={14} />
              {trip.destinations.join(' · ')}
            </span>
          )}
        </div>

        {/* 日记时间线 */}
        {entriesByDate.length > 0 ? (
          <div className="space-y-6">
            {entriesByDate.map(([date, dateEntries]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">{date}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] opacity-60">{dateEntries.length} 条</span>
                </div>
                <div className="ml-4 border-l-2 border-white/10 pl-4 space-y-3">
                  {dateEntries.map(entry => (
                    <Link
                      key={entry.id}
                      href={`/diary/${entry.id}`}
                      className="block rounded-xl p-3 border border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{entry.title || entry.locationName || '无标题'}</h3>
                          {entry.locationName && (
                            <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />{entry.locationName}
                            </span>
                          )}
                          {entry.content && (
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{entry.content.slice(0, 100)}</p>
                          )}
                        </div>
                        {entry.mood && <span className="text-sm ml-2">{entry.mood}</span>}
                      </div>
                      {entry.photoRefs.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {entry.photoRefs.slice(0, 3).map(p => (
                            <img key={p.id} src={p.url} alt="" className="w-12 h-12 rounded object-cover" onError={e => {(e.target as HTMLImageElement).style.display = 'none'}} />
                          ))}
                          {entry.photoRefs.length > 3 && (
                            <span className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-[var(--color-text-secondary)]">+{entry.photoRefs.length - 3}</span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[var(--color-text-secondary)]">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">这个旅行还没有日记</p>
            <Link href="/diary" className="text-blue-400 text-sm hover:text-blue-300">去写日记</Link>
          </div>
        )}
      </div>
    </div>
  );
}
