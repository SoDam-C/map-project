/**
 * POST /api/tracks/batch — 批量上传轨迹元数据和 GPS 点
 *
 * 请求体：
 * {
 *   tracks: GpsTrack[],
 *   points: { trackId: string, points: GpsPoint[] }[]
 * }
 *
 * 存储到服务器端 JSON 文件（后续可替换为 SQLite）
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');

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
  type: 'continuous' | 'imported' | 'sport';
  sportType?: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  pointCount: number;
  bounds: [number, number, number, number];
  createdAt: string;
  updatedAt: string;
}

interface GpsPoint {
  lat: number;
  lng: number;
  elevation?: number;
  accuracy: number;
  speed?: number;
  bearing?: number;
  timestamp: number;
}

interface TrackPointsBatch {
  trackId: string;
  points: GpsPoint[];
}

interface TrackBatchUpload {
  tracks: GpsTrack[];
  points: TrackPointsBatch[];
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackBatchUpload = await request.json();

    if (!body.tracks || !Array.isArray(body.tracks)) {
      return NextResponse.json({ error: 'Missing tracks array' }, { status: 400 });
    }

    const results = { saved: 0, points: 0, skipped: 0 };

    // 1. 保存/更新轨迹元数据
    const index = readJson<Record<string, GpsTrack>>(join(DATA_DIR, 'index.json')) || {};

    for (const track of body.tracks) {
      const existing = index[track.id];
      // 增量更新：如果已存在且 updatedAt 更新，才覆盖
      if (existing && existing.updatedAt >= track.updatedAt) {
        results.skipped++;
        continue;
      }
      index[track.id] = track;
      results.saved++;
    }

    writeJson(join(DATA_DIR, 'index.json'), index);

    // 2. 保存 GPS 点（增量合并）
    if (body.points && Array.isArray(body.points)) {
      for (const batch of body.points) {
        if (!batch.trackId || !batch.points?.length) continue;

        const trackDir = join(DATA_DIR, 'points', batch.trackId);
        const existingPoints = readJson<GpsPoint[]>(join(trackDir, 'points.json')) || [];
        const existingTimestamps = new Set(existingPoints.map(p => p.timestamp));

        // 合并去重
        const newPoints = batch.points.filter(p => !existingTimestamps.has(p.timestamp));
        if (newPoints.length === 0) continue;

        const merged = [...existingPoints, ...newPoints].sort((a, b) => a.timestamp - b.timestamp);
        writeJson(join(trackDir, 'points.json'), merged);
        results.points += newPoints.length;

        // 更新轨迹元数据的 pointCount
        if (index[batch.trackId]) {
          index[batch.trackId].pointCount = merged.length;
        }
      }

      // 更新 index（反映 pointCount 变化）
      writeJson(join(DATA_DIR, 'index.json'), index);
    }

    return NextResponse.json({ success: true, ...results });
  } catch (e) {
    console.error('[tracks/batch] Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** GET /api/tracks/batch — 列出所有轨迹 */
export async function GET() {
  try {
    const index = readJson<Record<string, GpsTrack>>(join(DATA_DIR, 'index.json')) || {};
    const tracks = Object.values(index).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
    return NextResponse.json({ tracks, total: tracks.length });
  } catch (e) {
    console.error('[tracks/batch] GET error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
