'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PhotoReference } from '@/lib/types';
import { Image, Plus, X, GripVertical } from 'lucide-react';

interface Props {
  photos: PhotoReference[];
  onChange: (photos: PhotoReference[]) => void;
}

function SortablePhoto({ photo, onRemove }: { photo: PhotoReference; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group w-24 h-24 rounded-lg overflow-hidden bg-white/5 border border-white/10">
      <img
        src={photo.url}
        alt={photo.caption || ''}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-0.5 rounded bg-black/50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={10} className="text-white" />
      </div>
      {/* 删除按钮 */}
      <button
        onClick={() => onRemove(photo.id)}
        className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={10} />
      </button>
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white text-center px-1 truncate">
          {photo.caption}
        </div>
      )}
    </div>
  );
}

export function DiaryPhotoManager({ photos, onChange }: Props) {
  const [urlInput, setUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleAdd = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;

    const photo: PhotoReference = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url,
      caption: captionInput.trim() || undefined,
    };

    onChange([...photos, photo]);
    setUrlInput('');
    setCaptionInput('');
  }, [urlInput, captionInput, photos, onChange]);

  const handleRemove = useCallback((id: string) => {
    onChange(photos.filter(p => p.id !== id));
  }, [photos, onChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex(p => p.id === active.id);
    const newIndex = photos.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...photos];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onChange(next);
  }, [photos, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  }, [handleAdd]);

  return (
    <div className="space-y-3">
      {/* 已添加的照片（可拖拽排序） */}
      {photos.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex gap-2 flex-wrap">
              {photos.map(photo => (
                <SortablePhoto key={photo.id} photo={photo} onRemove={handleRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 添加照片 URL */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="照片 URL"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="说明（可选）"
            value={captionInput}
            onChange={e => setCaptionInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!urlInput.trim()}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <p className="text-[10px] text-[var(--color-text-secondary)] opacity-60">
        拖拽排序 · 粘贴外部照片链接（如相册、图床 URL）
      </p>
    </div>
  );
}
