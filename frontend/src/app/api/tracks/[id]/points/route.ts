/**
 * GET  /api/tracks/[id]/points  — 获取轨迹 GPS 点（分页）
 *
 * 查询参数：
 *   offset  — 跳过前 N 个点（默认 0）
 *   limit   — 最多返回 N 个点（默认 1000）
 *   since   — 只返回 timestamp >= since 的点（毫秒）
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '1000', 10);
  const since = searchParams.get('since');

  // 验证轨迹存在
  const index = readJson<Record<string, any>>(join(DATA_DIR, 'index.json'));
  if (!index || !index[id]) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  // 读取 GPS 点
  const pointsPath = join(DATA_DIR, 'points', id, 'points.json');
  const allPoints: GpsPoint[] = readJson<GpsPoint[]>(pointsPath) || [];

  // 按 since 过滤
  let filtered = allPoints;
  if (since) {
    const sinceTs = parseInt(since, 10);
    if (!isNaN(sinceTs)) {
      filtered = allPoints.filter(p => p.timestamp >= sinceTs);
    }
  }

  // 分页
  const sliced = filtered.slice(offset, offset + limit);
  const total = filtered.length;

  return NextResponse.json({
    trackId: id,
    points: sliced,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  });
}
