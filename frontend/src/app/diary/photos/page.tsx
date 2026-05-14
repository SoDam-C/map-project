'use client';

import { useState, useEffect, useMemo } from 'react';
import { initStorage, load } from '@/lib/storage';
import type { DiaryStore, DiaryEntry, PhotoReference } from '@/lib/types';
import { ArrowLeft, Image, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function PhotoMapPage() {
  const [entries, setEntries] = useState<DiaryStore>({});
  const [ready, setReady] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; caption?: string; entry: DiaryEntry } | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');

  useEffect(() => {
    initStorage();
    setEntries(load<DiaryStore>('diary') || {});
    setReady(true);
  }, []);

  // 汇总所有照片（按时间倒序）
  const allPhotos = useMemo(() => {
    const photos: { photo: PhotoReference; entry: DiaryEntry }[] = [];
    Object.values(entries).forEach(entry => {
      entry.photoRefs.forEach(photo => {
        photos.push({ photo, entry });
      });
    });
    // 按 entry 日期倒序
    return photos.sort((a, b) => b.entry.date.localeCompare(a.entry.date));
  }, [entries]);

  // 按日期分组
  const photosByDate = useMemo(() => {
    const groups: Record<string, { photo: PhotoReference; entry: DiaryEntry }[]> = {};
    allPhotos.forEach(({ photo, entry }) => {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push({ photo, entry });
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [allPhotos]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/diary" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-medium text-sm flex items-center gap-2">
            <Image size={16} className="text-pink-400" />
            照片
          </span>
          <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
            {allPhotos.length} 张
          </span>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'timeline' ? 'bg-white/10' : 'text-[var(--color-text-secondary)]'}`}
            >
              时间线
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'grid' ? 'bg-white/10' : 'text-[var(--color-text-secondary)]'}`}
            >
              网格
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {allPhotos.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-secondary)]">
            <Image size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">还没有照片</p>
            <p className="text-sm">在日记中添加照片 URL 即可在这里查看</p>
          </div>
        ) : viewMode === 'timeline' ? (
          /* 时间线模式 */
          <div className="space-y-6">
            {photosByDate.map(([date, photos]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-[var(--color-text-secondary)]" />
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">{date}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(({ photo, entry }) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto({ url: photo.url, caption: photo.caption, entry })}
                      className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-white/30 transition-colors group relative"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)] text-xs">加载失败</div>';
                        }}
                      />
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white text-center px-1 truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 网格模式 */
          <div className="grid grid-cols-4 gap-1">
            {allPhotos.map(({ photo, entry }) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto({ url: photo.url, caption: photo.caption, entry })}
                className="aspect-square overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 照片预览 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-3xl max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || ''}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {selectedPhoto.caption && (
              <p className="text-white text-sm mt-3">{selectedPhoto.caption}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-white/60 text-xs">
              <MapPin size={12} />
              {selectedPhoto.entry.locationName || selectedPhoto.entry.title}
              <span className="ml-2">{selectedPhoto.entry.date}</span>
              <Link
                href={`/diary/${selectedPhoto.entry.id}`}
                className="ml-2 text-blue-400 hover:text-blue-300"
                onClick={() => setSelectedPhoto(null)}
              >
                查看日记
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
