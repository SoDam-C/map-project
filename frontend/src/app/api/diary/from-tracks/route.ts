/**
 * POST /api/diary/from-tracks — 从 GPS 轨迹自动生成日记骨架
 *
 * 读取 track-data/index.json 中的轨迹元数据，
 * 为每条尚未关联日记的轨迹创建一个 draft 状态的 track_entry。
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');
const TRACKS_FILE = join(DATA_DIR, 'index.json');
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

interface GpsTrack {
  id: string;
  deviceId: string;
  title?: string;
  type: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  pointCount: number;
  bounds: [number, number, number, number];
  createdAt: string;
  updatedAt: string;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackIds, tripId } = body as { trackIds?: string[]; tripId?: string };

    const tracksIndex = readJson<Record<string, GpsTrack>>(TRACKS_FILE);
    if (!tracksIndex) {
      return NextResponse.json({ error: 'No tracks found' }, { status: 404 });
    }

    const diaryStore = readJson<DiaryStore>(DIARY_FILE) || {};

    // 收集所有已关联轨迹的 ID
    const linkedTrackIds = new Set<string>();
    for (const entry of Object.values(diaryStore)) {
      entry.trackIds?.forEach(tid => linkedTrackIds.add(tid));
    }

    // 确定要处理的轨迹
    const targetIds = trackIds || Object.keys(tracksIndex);
    const created: DiaryEntry[] = [];
    let merged = 0;

    for (const trackId of targetIds) {
      const track = tracksIndex[trackId];
      if (!track) continue;

      // 已关联则跳过
      if (linkedTrackIds.has(trackId)) {
        merged++;
        continue;
      }

      const startTime = track.startTime;
      const date = startTime.slice(0, 10);
      const lat = (track.bounds[1] + track.bounds[3]) / 2;
      const lng = (track.bounds[0] + track.bounds[2]) / 2;

      // 生成友好标题
      const startHour = parseInt(startTime.slice(11, 13));
      let timeLabel: string;
      if (startHour < 6) timeLabel = '凌晨';
      else if (startHour < 9) timeLabel = '早晨';
      else if (startHour < 12) timeLabel = '上午';
      else if (startHour < 14) timeLabel = '中午';
      else if (startHour < 18) timeLabel = '下午';
      else if (startHour < 21) timeLabel = '傍晚';
      else timeLabel = '晚上';

      const id = `diary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      const entry: DiaryEntry = {
        id,
        type: 'track_entry',
        date,
        startTime,
        endTime: track.endTime,
        title: track.title || `${date} ${timeLabel}的记录`,
        lat,
        lng,
        content: '',
        photoRefs: [],
        status: 'draft',
        trackIds: [trackId],
        tripId,
        createdAt: now,
        updatedAt: now,
      };

      diaryStore[id] = entry;
      created.push(entry);
    }

    writeJson(DIARY_FILE, diaryStore);

    return NextResponse.json({
      entries: created,
      merged,
    });
  } catch (e) {
    console.error('[diary/from-tracks] Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
