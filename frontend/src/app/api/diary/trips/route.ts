/**
 * GET  /api/diary/trips — 获取旅行列表
 * POST /api/diary/trips — 创建旅行
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');
const TRIPS_FILE = join(DATA_DIR, 'trips.json');

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

type TripStore = Record<string, Record<string, unknown>>;

export async function GET() {
  const store = readJson<TripStore>(TRIPS_FILE) || {};
  const trips = Object.values(store).sort(
    (a, b) => String(b.startDate).localeCompare(String(a.startDate)),
  );
  return NextResponse.json({ trips });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const store = readJson<TripStore>(TRIPS_FILE) || {};

  if (!body.id || !body.title || !body.startDate) {
    return NextResponse.json({ error: 'id, title, startDate required' }, { status: 400 });
  }

  store[body.id] = {
    ...body,
    entryIds: body.entryIds || [],
    trackIds: body.trackIds || [],
    destinations: body.destinations || [],
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeJson(TRIPS_FILE, store);
  return NextResponse.json({ success: true, id: body.id });
}
