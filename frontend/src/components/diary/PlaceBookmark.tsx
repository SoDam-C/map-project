'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { initStorage, load, save } from '@/lib/storage';
import { MapPin, Star, Trash2, Search, Plus, X, Navigation, Clock, Tag } from 'lucide-react';

interface PlaceBookmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  note?: string;
  createdAt: string;
  visitedCount: number;
  tags: string[];
}

const CATEGORIES = [
  { id: 'food', label: '美食', icon: '🍜' },
  { id: 'scenic', label: '景点', icon: '🏞️' },
  { id: 'hotel', label: '住宿', icon: '🏨' },
  { id: 'shopping', label: '购物', icon: '🛍️' },
  { id: 'transport', label: '交通', icon: '🚄' },
  { id: 'other', label: '其他', icon: '📍' },
];

const NAMESPACE = 'place-bookmarks';

export function PlaceBookmarkManager() {
  const [bookmarks, setBookmarks] = useState<PlaceBookmark[]>([]);
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formCategory, setFormCategory] = useState('other');
  const [formNote, setFormNote] = useState('');
  const [formTags, setFormTags] = useState('');

  useEffect(() => {
    initStorage();
    const data = load<PlaceBookmark[]>(NAMESPACE) || [];
    setBookmarks(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setReady(true);
  }, []);

  const persist = useCallback((data: PlaceBookmark[]) => {
    save(NAMESPACE, data);
  }, []);

  const filtered = useMemo(() => {
    let result = bookmarks;
    if (filterCategory) {
      result = result.filter(b => b.category === filterCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.note?.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [bookmarks, filterCategory, searchQuery]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, PlaceBookmark[]> = {};
    filtered.forEach(b => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return Object.entries(groups);
  }, [filtered]);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormLat('');
    setFormLng('');
    setFormCategory('other');
    setFormNote('');
    setFormTags('');
    setEditId(null);
    setShowAdd(false);
  }, []);

  const handleSave = useCallback(() => {
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    if (!formName.trim() || isNaN(lat) || isNaN(lng)) return;

    const tags = formTags.split(/[,，\s]+/).filter(Boolean);

    if (editId) {
      const updated = bookmarks.map(b =>
        b.id === editId ? { ...b, name: formName.trim(), lat, lng, category: formCategory, note: formNote.trim(), tags } : b
      );
      setBookmarks(updated);
      persist(updated);
    } else {
      const newBookmark: PlaceBookmark = {
        id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: formName.trim(),
        lat,
        lng,
        category: formCategory,
        note: formNote.trim() || undefined,
        createdAt: new Date().toISOString(),
        visitedCount: 1,
        tags,
      };
      const updated = [newBookmark, ...bookmarks];
      setBookmarks(updated);
      persist(updated);
    }
    resetForm();
  }, [formName, formLat, formLng, formCategory, formNote, formTags, editId, bookmarks, persist, resetForm]);

  const handleEdit = useCallback((bookmark: PlaceBookmark) => {
    setEditId(bookmark.id);
    setFormName(bookmark.name);
    setFormLat(String(bookmark.lat));
    setFormLng(String(bookmark.lng));
    setFormCategory(bookmark.category);
    setFormNote(bookmark.note || '');
    setFormTags(bookmark.tags.join(', '));
    setShowAdd(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    persist(updated);
  }, [bookmarks, persist]);

  const handleUseLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setFormLat(pos.coords.latitude.toFixed(6));
          setFormLng(pos.coords.longitude.toFixed(6));
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  if (!ready) return null;

  const categoryStats = CATEGORIES.map(c => ({
    ...c,
    count: bookmarks.filter(b => b.category === c.id).length,
  }));

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star size={24} className="text-yellow-400" />
            地点收藏
          </h1>
          <button
            onClick={() => { resetForm(); setShowAdd(true); }}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <Plus size={16} />
            收藏地点
          </button>
        </div>

        {/* 搜索 + 分类筛选 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索收藏地点..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCategory(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
              filterCategory === null
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                : 'bg-white/5 text-[var(--color-text-secondary)] border border-white/10 hover:bg-white/10'
            }`}
          >
            全部 ({bookmarks.length})
          </button>
          {categoryStats.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(filterCategory === c.id ? null : c.id)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${
                filterCategory === c.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-white/5 text-[var(--color-text-secondary)] border border-white/10 hover:bg-white/10'
              }`}
            >
              {c.icon} {c.label} ({c.count})
            </button>
          ))}
        </div>

        {/* 收藏列表 */}
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-text-secondary)]">
            <Star size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">
              {bookmarks.length === 0 ? '还没有收藏地点' : '没有匹配的地点'}
            </p>
            <p className="text-sm">
              {bookmarks.length === 0 ? '点击右上角开始收藏' : '试试其他关键词'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([catId, items]) => {
              const cat = CATEGORIES.find(c => c.id === catId);
              return (
                <div key={catId}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{cat?.icon}</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {cat?.label || catId}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] opacity-60">
                      {items.length} 个
                    </span>
                  </div>
                  <div className="space-y-2 ml-4">
                    {items.map(bookmark => (
                      <div
                        key={bookmark.id}
                        className="rounded-xl p-3 border border-white/10 hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{bookmark.name}</h3>
                            <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <MapPin size={10} />
                                {bookmark.lat.toFixed(4)}, {bookmark.lng.toFixed(4)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {bookmark.createdAt.slice(0, 10)}
                              </span>
                            </div>
                            {bookmark.note && (
                              <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{bookmark.note}</p>
                            )}
                            {bookmark.tags.length > 0 && (
                              <div className="flex gap-1 mt-1.5">
                                {bookmark.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[var(--color-text-secondary)] flex items-center gap-0.5"
                                  >
                                    <Tag size={8} />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={() => handleEdit(bookmark)}
                              className="p-1.5 rounded hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                            >
                              <Tag size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(bookmark.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-[var(--color-text-secondary)] hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 添加/编辑对话框 */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
            <div className="relative w-full max-w-2xl bg-[var(--color-bg)] border border-white/10 rounded-t-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editId ? '编辑地点' : '收藏新地点'}</h2>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* 名称 */}
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="地点名称"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                autoFocus
              />

              {/* 分类 */}
              <div className="flex gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setFormCategory(c.id)}
                    className={`flex-1 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 ${
                      formCategory === c.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : 'bg-white/5 text-[var(--color-text-secondary)] border border-white/10'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              {/* 坐标 */}
              <div className="flex gap-2">
                <input
                  value={formLat}
                  onChange={e => setFormLat(e.target.value)}
                  placeholder="纬度"
                  type="number"
                  step="any"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
                <input
                  value={formLng}
                  onChange={e => setFormLng(e.target.value)}
                  placeholder="经度"
                  type="number"
                  step="any"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={handleUseLocation}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  title="使用当前位置"
                >
                  <Navigation size={16} />
                </button>
              </div>

              {/* 备注 */}
              <textarea
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                placeholder="备注（可选）"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 resize-none"
              />

              {/* 标签 */}
              <input
                value={formTags}
                onChange={e => setFormTags(e.target.value)}
                placeholder="标签，用逗号分隔"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              />

              {/* 保存 */}
              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {editId ? '保存修改' : '收藏'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
