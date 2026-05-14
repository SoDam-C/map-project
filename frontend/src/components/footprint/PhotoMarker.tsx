'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { PhotoRecord } from '@/lib/types';

interface PhotoMarkerLayerProps {
  map: MapLibreMap | null;
  photos: Record<string, PhotoRecord>;
  visible: boolean;
  onPhotoClick?: (photo: PhotoRecord) => void;
}

export function PhotoMarkerLayer({ map, photos, visible, onPhotoClick }: PhotoMarkerLayerProps) {
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const popupRef = useRef<HTMLDivElement | null>(null);

  // 添加/更新 markers
  useEffect(() => {
    const m = map;
    if (!m || !visible) return;

    const currentIds = new Set(Object.keys(photos));
    const existingIds = markersRef.current.keys();

    // 移除不再存在的 markers
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        const marker = markersRef.current.get(id);
        marker?.remove();
        markersRef.current.delete(id);
      }
    }

    // 添加新的 markers
    for (const [id, photo] of Object.entries(photos)) {
      if (markersRef.current.has(id)) continue;

      const el = document.createElement('div');
      el.style.cssText = 'width:32px;height:32px;border-radius:50%;overflow:hidden;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;background:#6366f1;';
      if (photo.thumbnail) {
        const img = document.createElement('img');
        img.src = photo.thumbnail;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
        el.style.position = 'relative';
        el.appendChild(img);
      } else {
        el.textContent = '\uD83D\uDCF8';
        el.style.background = '#6366f1';
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPhotoClick?.(photo);
      });

      const marker = new (window as any).maplibregl.Marker({ element: el })
        .setLngLat([photo.lng, photo.lat])
        .addTo(m);

      markersRef.current.set(id, marker);
    }

    return () => {
      for (const [, marker] of markersRef.current) {
        marker.remove();
      }
      markersRef.current.clear();
    };
  }, [map, photos, visible, onPhotoClick]);

  // 控制可见性
  useEffect(() => {
    for (const [, marker] of markersRef.current) {
      if (visible) {
        marker.addTo(map!);
      } else {
        marker.remove();
      }
    }
  }, [map, visible]);

  return null;
}
