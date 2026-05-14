/**
 * GET    /api/diary/trips/[id] — 获取单个旅行
 * PUT    /api/diary/trips/[id] — 更新旅行
 * DELETE /api/diary/trips/[id] — 删除旅行
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = readJson<TripStore>(TRIPS_FILE) || {};
  const trip = store[id];
  if (!trip) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(trip);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const store = readJson<TripStore>(TRIPS_FILE) || {};

  if (!store[id]) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  store[id] = { ...store[id], ...body, id, updatedAt: new Date().toISOString() };
  writeJson(TRIPS_FILE, store);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = readJson<TripStore>(TRIPS_FILE) || {};

  if (!store[id]) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  delete store[id];
  writeJson(TRIPS_FILE, store);
  return NextResponse.json({ success: true });
}
