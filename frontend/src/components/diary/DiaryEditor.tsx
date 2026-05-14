'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DiaryEntry, DiaryTrip, DiaryEntryType, PhotoReference, AttractionInfo } from '@/lib/types';
import { useDiary } from '@/hooks/useDiary';
import { useFootprints } from '@/hooks/useFootprints';
import { AttractionSearch } from './AttractionSearch';
import { DiaryPhotoManager } from './DiaryPhotoManager';
import { MarkdownToolbar } from './MarkdownToolbar';
import { TrackSelector } from './TrackSelector';
import { ArrowLeft, MapPin, Tag, Smile, Image, Landmark } from 'lucide-react';

interface Props {
  entry: DiaryEntry | null;
  trips: DiaryTrip[];
  onSave: () => void;
  onCancel: () => void;
}

const MOODS = ['😊 开心', '😌 平静', '🌄 震撼', '😴 累了', '🤔 思考', '🎉 期待', '😢 难过', '😤 愤怒', '🤩 惊喜'];

export function DiaryEditor({ entry: initialEntry, trips, onSave, onCancel }: Props) {
  const { createEntry, updateEntry } = useDiary();
  const { lightUp, isLit } = useFootprints();

  const [type, setType] = useState<DiaryEntryType>(initialEntry?.type || 'memory_entry');
  const [date, setDate] = useState(initialEntry?.date || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(initialEntry?.startTime?.slice(0, 16) || '');
  const [endTime, setEndTime] = useState(initialEntry?.endTime?.slice(0, 16) || '');
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [locationName, setLocationName] = useState(initialEntry?.locationName || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState(initialEntry?.mood || '');
  const [tagsStr, setTagsStr] = useState(initialEntry?.tags?.join(', ') || '');
  const [tripId, setTripId] = useState(initialEntry?.tripId || '');
  const [photoRefs, setPhotoRefs] = useState<PhotoReference[]>(initialEntry?.photoRefs || []);
  const [showMoods, setShowMoods] = useState(false);
  const [isNew, setIsNew] = useState(!initialEntry);
  const entryId = useRef(initialEntry?.id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 景点状态（不存到 entry，单独管理）
  const [attractionId, setAttractionId] = useState(initialEntry?.attractionId || '');
  const [trackIds, setTrackIds] = useState<string[]>(initialEntry?.trackIds || []);

  // 自动保存
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);
  const footprintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 自动点亮足迹（有坐标时）
  useEffect(() => {
    if (footprintTimer.current) clearTimeout(footprintTimer.current);
    // 只在有 lat/lng 时触发
    if (!initialEntry?.lat && !initialEntry?.lng) return;
    footprintTimer.current = setTimeout(async () => {
      try {
        const lat = initialEntry?.lat;
        const lng = initialEntry?.lng;
        if (!lat || !lng) return;
        const resp = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
        const data = await resp.json();
        if (data.adcode && !isLit(data.adcode)) {
          lightUp(data.adcode, 'manual', initialEntry?.id);
        }
      } catch {}
    }, 2000);
    return () => { if (footprintTimer.current) clearTimeout(footprintTimer.current); };
  }, [initialEntry?.lat, initialEntry?.lng, initialEntry?.id, lightUp, isLit]);

  const doSave = useCallback(() => {
    const tags = tagsStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const startTimeIso = startTime ? new Date(startTime).toISOString() : undefined;
    const endTimeIso = endTime ? new Date(endTime).toISOString() : undefined;

    const data = {
      type,
      date,
      startTime: startTimeIso,
      endTime: endTimeIso,
      title: title || date,
      locationName: locationName || undefined,
      content,
      mood: mood || undefined,
      tags: tags.length > 0 ? tags : undefined,
      tripId: tripId || undefined,
      attractionId: attractionId || undefined,
      trackIds: trackIds.length > 0 ? trackIds : undefined,
      photoRefs,
      status: content ? 'published' as const : 'draft' as const,
    };

    if (isNew) {
      const id = createEntry(data);
      entryId.current = id;
      setIsNew(false);
    } else if (entryId.current) {
      updateEntry(entryId.current, data);
    }
  }, [type, date, startTime, endTime, title, locationName, content, mood, tagsStr, tripId, attractionId, photoRefs, isNew, createEntry, updateEntry]);

  // 自动保存 debounce
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [type, date, startTime, endTime, title, locationName, content, mood, tagsStr, tripId, attractionId, photoRefs, trackIds, doSave]);

  const handleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    doSave();
    onSave();
  }, [doSave, onSave]);

  const handleAttractionSelect = useCallback((attraction: { id: string; name: string; extract?: string; imageUrl?: string; wikipediaUrl?: string; lat?: number; lng?: number } | null) => {
    if (attraction) {
      setAttractionId(attraction.id);
      if (!locationName) {
        setLocationName(attraction.name);
      }
    } else {
      setAttractionId('');
    }
  }, [locationName]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={handleSave} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium text-sm flex-1">
            {isNew ? '新建日记' : '编辑日记'}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)]">自动保存</span>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            完成
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 类型选择 */}
        <div className="flex gap-2">
          {([
            { value: 'track_entry' as const, label: '轨迹日记' },
            { value: 'memory_entry' as const, label: '记忆' },
            { value: 'note_entry' as const, label: '笔记' },
          ]).map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                type === t.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 日期时间 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">日期</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">开始</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">结束</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 标题 */}
        <div>
          <input
            type="text"
            placeholder="标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-xl font-bold placeholder:text-white/20 focus:outline-none py-2"
          />
        </div>

        {/* 地点 */}
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="地点"
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 景点搜索 */}
        <div>
          <label className="text-xs text-[var(--color-text-secondary)] mb-1 flex items-center gap-1">
            <Landmark size={12} />
            景点
          </label>
          <AttractionSearch value={attractionId} onSelect={handleAttractionSelect} />
        </div>

        {/* 轨迹关联 */}
        <div>
          <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">GPS 轨迹</label>
          <TrackSelector selectedIds={trackIds} onChange={setTrackIds} />
        </div>

        {/* 正文 */}
        <MarkdownToolbar value={content} onChange={setContent} textareaRef={textareaRef} />
        <textarea
          ref={textareaRef}
          placeholder="今天发生了什么..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={12}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm leading-relaxed resize-y focus:outline-none focus:border-blue-500"
        />

        {/* 心情 + 标签 */}
        <div className="flex gap-3">
          {/* 心情 */}
          <div className="relative flex-1">
            <div
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setShowMoods(!showMoods)}
            >
              <Smile size={14} className="text-[var(--color-text-secondary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {mood || '心情'}
              </span>
            </div>
            {showMoods && (
              <div className="absolute top-full mt-1 left-0 bg-[var(--color-bg)] border border-white/10 rounded-xl p-2 shadow-xl z-20 grid grid-cols-5 gap-1 min-w-[280px]">
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => { setMood(m); setShowMoods(false); }}
                    className={`px-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
                      mood === m ? 'bg-blue-600 text-white' : 'hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 标签 */}
          <div className="relative flex-1">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="标签（逗号分隔）"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 照片引用 */}
        <div>
          <label className="text-xs text-[var(--color-text-secondary)] mb-1 flex items-center gap-1">
            <Image size={12} />
            照片
          </label>
          <DiaryPhotoManager photos={photoRefs} onChange={setPhotoRefs} />
        </div>

        {/* 旅行分组 */}
        {trips.length > 0 && (
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">归入旅行</label>
            <select
              value={tripId}
              onChange={e => setTripId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">不归入旅行</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.startDate})</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
