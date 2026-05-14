'use client';

import { useState, useCallback, useRef } from 'react';
import { load, save } from '@/lib/storage';
import type { WishlistItem, WishlistPriority, WishlistStore } from '@/lib/types';

const NAMESPACE = 'wishlist' as const;

function loadFromStorage(): WishlistStore {
  if (typeof window === 'undefined') return {};
  return load<WishlistStore>(NAMESPACE) || {};
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistStore>(loadFromStorage);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((data: WishlistStore) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(NAMESPACE, data), 500);
  }, []);

  const addItem = useCallback((adcode: string, name: string, level: number, priority: WishlistPriority, note?: string) => {
    setItems(prev => {
      if (adcode in prev) return prev;
      const next = {
        ...prev,
        [adcode]: {
          id: adcode,
          adcode,
          name,
          level: level as WishlistItem['level'],
          priority,
          addedAt: new Date().toISOString(),
          note,
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const removeItem = useCallback((adcode: string) => {
    setItems(prev => {
      const next = { ...prev };
      delete next[adcode];
      persist(next);
      return next;
    });
  }, [persist]);

  const updatePriority = useCallback((adcode: string, priority: WishlistPriority) => {
    setItems(prev => {
      if (!(adcode in prev)) return prev;
      const next = { ...prev, [adcode]: { ...prev[adcode], priority } };
      persist(next);
      return next;
    });
  }, [persist]);

  const isWishlisted = useCallback((adcode: string): boolean => {
    return adcode in items;
  }, [items]);

  const getAll = useCallback((): WishlistItem[] => {
    return Object.values(items).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  }, [items]);

  /** Check which wishlisted items have been visited (footprint exists) */
  const getVisitedWishlist = useCallback((litAdcodes: Set<string>): WishlistItem[] => {
    return Object.values(items).filter(item => litAdcodes.has(item.adcode));
  }, [items]);

  return { items, addItem, removeItem, updatePriority, isWishlisted, getAll, getVisitedWishlist };
}
