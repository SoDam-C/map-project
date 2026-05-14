/**
 * GET /api/diary/attractions/search?q=西湖 — 搜索景点信息
 *
 * 1. 先查本地缓存 (track-data/attractions.json)
 * 2. 未命中则调用 Wikipedia API
 * 3. 结果写入缓存
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');
const CACHE_FILE = join(DATA_DIR, 'attractions.json');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function writeJson(path: string, data: unknown) {
  ensureDir(join(path, '..'));
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

interface WikiSearchResult {
  pageid: number;
  title: string;
  snippet: string;
}

interface WikiQueryResult {
  query: {
    search: WikiSearchResult[];
  };
}

interface WikiDetailResult {
  query: {
    pages: Record<string, {
      pageid: number;
      title: string;
      extract?: string;
      thumbnail?: { source: string };
      coordinates?: { lat: number; lon: number }[];
    }>;
  };
}

interface CachedAttraction {
  id: string;
  name: string;
  searchKey: string;
  info: {
    id: string;
    name: string;
    extract?: string;
    imageUrl?: string;
    wikipediaUrl?: string;
    rating?: number;
    lat?: number;
    lng?: number;
    source: 'wikipedia' | 'manual';
    fetchedAt: string;
  };
}

type AttractionCache = Record<string, CachedAttraction>;

async function searchWikipedia(query: string): Promise<{
  results: Array<{
    pageId: number;
    title: string;
    extract?: string;
    imageUrl?: string;
    coordinates?: { lat: number; lng: number };
    wikipediaUrl: string;
  }>;
}> {
  // 1. 搜索
  const searchUrl = `https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
  const searchResp = await fetch(searchUrl);
  const searchData: WikiQueryResult = await searchResp.json();

  if (!searchData.query.search?.length) {
    return { results: [] };
  }

  // 2. 获取详情
  const pageIds = searchData.query.search.map(r => r.pageid).join('|');
  const detailUrl = `https://zh.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=extracts|pageimages|coordinates&exintro=1&explaintext=1&pithumbsize=400&format=json&origin=*`;
  const detailResp = await fetch(detailUrl);
  const detailData: WikiDetailResult = await detailResp.json();

  const results = searchData.query.search
    .map(sr => {
      const page = detailData.query.pages[String(sr.pageid)];
      if (!page) return null;

      return {
        pageId: sr.pageid,
        title: page.title,
        extract: page.extract || undefined,
        imageUrl: page.thumbnail?.source || undefined,
        coordinates: page.coordinates?.[0]
          ? { lat: page.coordinates[0].lat, lng: page.coordinates[0].lon }
          : undefined,
        wikipediaUrl: `https://zh.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return { results };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'q parameter required' }, { status: 400 });
    }

    const q = query.trim();

    // 1. 查本地缓存
    const cache = readJson<AttractionCache>(CACHE_FILE) || {};
    const cacheKey = q.toLowerCase();
    const cached = cache[cacheKey];
    if (cached) {
      return NextResponse.json({
        results: [cached.info],
        cached: true,
      });
    }

    // 2. 调用 Wikipedia API
    const wikiResults = await searchWikipedia(q);

    if (wikiResults.results.length === 0) {
      return NextResponse.json({ results: [], cached: false });
    }

    // 3. 写入缓存（取第一个结果作为主缓存）
    const first = wikiResults.results[0];
    const attractionId = `attr-${first.pageId}`;
    const now = new Date().toISOString();

    const newCache: CachedAttraction = {
      id: attractionId,
      name: first.title,
      searchKey: cacheKey,
      info: {
        id: attractionId,
        name: first.title,
        extract: first.extract,
        imageUrl: first.imageUrl,
        wikipediaUrl: first.wikipediaUrl,
        lat: first.coordinates?.lat,
        lng: first.coordinates?.lng,
        source: 'wikipedia',
        fetchedAt: now,
      },
    };

    cache[cacheKey] = newCache;
    writeJson(CACHE_FILE, cache);

    return NextResponse.json({
      results: wikiResults.results.map(r => ({
        id: `attr-${r.pageId}`,
        name: r.title,
        extract: r.extract,
        imageUrl: r.imageUrl,
        wikipediaUrl: r.wikipediaUrl,
        lat: r.coordinates?.lat,
        lng: r.coordinates?.lng,
        source: 'wikipedia' as const,
        fetchedAt: now,
      })),
      cached: false,
    });
  } catch (e) {
    console.error('[diary/attractions/search] Error:', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
