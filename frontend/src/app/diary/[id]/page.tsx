'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initStorage, load } from '@/lib/storage';
import type { DiaryEntry, DiaryTrip, AttractionInfo, DiaryStore, DiaryTripStore, AttractionStore } from '@/lib/types';
import { ArrowLeft, Edit3, MapPin, Clock, Route, Image, ExternalLink, Tag, Trash2, Play } from 'lucide-react';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/diary/MarkdownRenderer';
import { DiaryMiniMap } from '@/components/diary/DiaryMiniMap';

export default function DiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [trip, setTrip] = useState<DiaryTrip | null>(null);
  const [attraction, setAttraction] = useState<AttractionInfo | null>(null);

  useEffect(() => {
    initStorage();
    const entries = load<DiaryStore>('diary') || {};
    const e = entries[id];
    if (!e) return;
    setEntry(e);

    if (e.tripId) {
      const trips = load<DiaryTripStore>('diary-trips') || {};
      setTrip(trips[e.tripId] || null);
    }

    if (e.attractionId) {
      const attrs = load<AttractionStore>('attractions') || {};
      // Search by id in the cache
      const found = Object.values(attrs).find(a => a.id === e.attractionId);
      if (found) setAttraction(found);
    }
  }, [id]);

  const handleEdit = useCallback(() => {
    router.push(`/diary?edit=${id}`);
  }, [router, id]);

  const handleDelete = useCallback(() => {
    if (!entry) return;
    if (!confirm('确定要删除这篇日记吗？')) return;
    const entries = load<DiaryStore>('diary') || {};
    delete entries[id];
    if (typeof window !== 'undefined') {
      localStorage.setItem('map-diary', JSON.stringify(entries));
    }
    router.push('/diary');
  }, [entry, id, router]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">日记不存在</p>
      </div>
    );
  }

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return iso.slice(11, 16);
  };

  const typeLabels: Record<string, string> = {
    track_entry: '轨迹日记',
    memory_entry: '记忆',
    note_entry: '笔记',
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/diary')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium text-sm flex-1">{typeLabels[entry.type] || '日记'}</span>
          <button onClick={handleEdit} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Edit3 size={18} />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 标题 */}
        <h1 className="text-2xl font-bold mb-4">{entry.title || '无标题'}</h1>

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)] mb-4">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatDate(entry.date)}
            {entry.startTime && ` ${formatTime(entry.startTime)}`}
            {entry.endTime && entry.endTime !== entry.startTime && ` - ${formatTime(entry.endTime)}`}
          </span>
          {entry.locationName && (
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {entry.locationName}
            </span>
          )}
          {entry.type === 'track_entry' && (entry.trackIds?.length ?? 0) > 0 && (
            <Link href={`/diary/tracks?track=${entry.trackIds![0]}`} className="flex items-center gap-1 text-green-400 hover:text-green-300">
              <Play size={14} />
              回放轨迹
            </Link>
          )}
        </div>

        {/* 内嵌地图 */}
        {entry.lat && entry.lng && (
          <div className="mb-6 rounded-xl overflow-hidden border border-white/10" style={{ height: '200px' }}>
            <DiaryMiniMap lat={entry.lat} lng={entry.lng} title={entry.title || entry.locationName || ''} />
          </div>
        )}

        {/* 景点信息卡片 */}
        {attraction && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
            <div className="flex items-start gap-3">
              {attraction.imageUrl && (
                <img src={attraction.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{attraction.name}</h3>
                {attraction.extract && (
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                    {attraction.extract}
                  </p>
                )}
                {attraction.wikipediaUrl && (
                  <a
                    href={attraction.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 mt-2 hover:text-blue-300"
                  >
                    <ExternalLink size={12} />
                    Wikipedia
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 正文 */}
        {entry.content ? (
          <div className="mb-6">
            <MarkdownRenderer content={entry.content} />
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--color-text-secondary)] opacity-60 mb-6">
            <p>这篇日记还没有内容</p>
            <button onClick={handleEdit} className="text-blue-400 text-sm mt-2 hover:text-blue-300">
              点击编辑
            </button>
          </div>
        )}

        {/* 照片 */}
        {entry.photoRefs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
              <Image size={14} />
              照片 ({entry.photoRefs.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {entry.photoRefs.map(photo => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 心情 + 标签 */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {entry.mood && (
            <span className="text-lg">{entry.mood}</span>
          )}
          {entry.tags?.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/10 text-[var(--color-text-secondary)] flex items-center gap-0.5">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>

        {/* 旅行归属 */}
        {trip && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">属于旅行</div>
            <div className="font-medium text-sm">{trip.title}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              {trip.startDate}{trip.endDate !== trip.startDate && ` → ${trip.endDate}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
