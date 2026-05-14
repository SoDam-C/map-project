'use client';

import { useState, useCallback } from 'react';

interface AttractionResult {
  id: string;
  name: string;
  extract?: string;
  imageUrl?: string;
  wikipediaUrl?: string;
  lat?: number;
  lng?: number;
  source: 'wikipedia' | 'manual';
  fetchedAt: string;
}

export function useAttractionSearch() {
  const [results, setResults] = useState<AttractionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(`/api/diary/attractions/search?q=${encodeURIComponent(query)}`);
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || '搜索失败');
        setResults([]);
        return;
      }

      setResults(data.results || []);
    } catch {
      setError('网络错误');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
