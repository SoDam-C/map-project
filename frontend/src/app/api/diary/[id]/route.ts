/**
 * GET    /api/diary/[id] — 获取单条日记
 * PUT    /api/diary/[id] — 更新日记
 * DELETE /api/diary/[id] — 删除日记
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

type DiaryStore = Record<string, Record<string, unknown>>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = readJson<DiaryStore>(DIARY_FILE) || {};
  const entry = store[id];
  if (!entry) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const store = readJson<DiaryStore>(DIARY_FILE) || {};

  if (!store[id]) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  store[id] = { ...store[id], ...body, id, updatedAt: new Date().toISOString() };
  writeJson(DIARY_FILE, store);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = readJson<DiaryStore>(DIARY_FILE) || {};

  if (!store[id]) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  delete store[id];
  writeJson(DIARY_FILE, store);
  return NextResponse.json({ success: true });
}
