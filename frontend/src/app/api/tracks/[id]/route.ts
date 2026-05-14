/**
 * GET  /api/tracks/[id]     — 获取单条轨迹元数据
 * DELETE /api/tracks/[id]   — 删除轨迹及其 GPS 点
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, rmSync } from 'fs';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const index = readJson<Record<string, any>>(join(DATA_DIR, 'index.json'));
  if (!index || !index[id]) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }
  return NextResponse.json(index[id]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const index = readJson<Record<string, any>>(join(DATA_DIR, 'index.json'));
  if (!index || !index[id]) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  // 删除 GPS 点目录
  const pointsDir = join(DATA_DIR, 'points', id);
  if (existsSync(pointsDir)) {
    rmSync(pointsDir, { recursive: true, force: true });
  }

  // 从 index 中移除
  delete index[id];
  const { writeFileSync } = await import('fs');
  writeFileSync(join(DATA_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');

  return NextResponse.json({ success: true, deleted: id });
}
