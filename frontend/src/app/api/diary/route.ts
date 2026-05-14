/**
 * GET  /api/diary — 获取日记列表（支持过滤）
 * POST /api/diary — 批量创建/更新日记
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');
const DIARY_FILE = join(DATA_DIR, 'diary.json');

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

interface DiaryEntry {
  id: string;
  type: 'track_entry' | 'memory_entry' | 'note_entry';
  date: string;
  startTime?: string;
  endTime?: string;
  title: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  adcode?: string;
  content: string;
  mood?: string;
  tags?: string[];
  trackIds?: string[];
  attractionId?: string;
  photoRefs: { id: string; url: string; caption?: string; takenAt?: string }[];
  tripId?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

type DiaryStore = Record<string, DiaryEntry>;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const tripId = searchParams.get('tripId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const store = readJson<DiaryStore>(DIARY_FILE) || {};
  let entries = Object.values(store);

  // 过滤
  if (type) entries = entries.filter(e => e.type === type);
  if (tripId) entries = entries.filter(e => e.tripId === tripId);
  if (dateFrom) entries = entries.filter(e => e.date >= dateFrom);
  if (dateTo) entries = entries.filter(e => e.date <= dateTo);

  // 排序：日期倒序，同日按 startTime 正序
  entries.sort((a, b) => {
    const dc = b.date.localeCompare(a.date);
    if (dc !== 0) return dc;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const total = entries.length;
  const paginated = entries.slice(offset, offset + limit);

  return NextResponse.json({ entries: paginated, total, offset, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { entries } = body as { entries: DiaryEntry[] };

  if (!entries || !Array.isArray(entries)) {
    return NextResponse.json({ error: 'entries array required' }, { status: 400 });
  }

  const store = readJson<DiaryStore>(DIARY_FILE) || {};
  let saved = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.id || !entry.date) {
      skipped++;
      continue;
    }
    const existing = store[entry.id];
    if (existing && existing.updatedAt >= entry.updatedAt) {
      skipped++;
      continue;
    }
    store[entry.id] = entry;
    saved++;
  }

  writeJson(DIARY_FILE, store);
  return NextResponse.json({ success: true, saved, skipped });
}
