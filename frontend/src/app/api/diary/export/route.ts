/**
 * GET /api/diary/export?format=markdown|json|geojson
 *
 * 导出日记数据：
 *   - markdown: 每篇日记一个 Markdown 文件（打包为 text/plain）
 *   - json:     完整 JSON 数据
 *   - geojson:  有坐标的日记导出为 GeoJSON FeatureCollection
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');
const DIARY_FILE = join(DATA_DIR, 'diary.json');
const FOOTPRINTS_FILE = join(DATA_DIR, 'footprints.json');

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function entryToMarkdown(entry: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`# ${entry.title || '无标题'}`);
  lines.push('');

  const meta: string[] = [];
  if (entry.date) meta.push(`日期: ${entry.date}`);
  if (entry.startTime) meta.push(`开始: ${String(entry.startTime)}`);
  if (entry.endTime) meta.push(`结束: ${String(entry.endTime)}`);
  if (entry.locationName) meta.push(`地点: ${String(entry.locationName)}`);
  if (entry.mood) meta.push(`心情: ${String(entry.mood)}`);
  if (entry.type) meta.push(`类型: ${String(entry.type)}`);
  if (meta.length > 0) {
    lines.push(meta.join('\n'));
    lines.push('');
  }

  if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0) {
    lines.push(`标签: ${entry.tags.map((t: string) => `#${t}`).join(' ')}`);
    lines.push('');
  }

  if (entry.content && String(entry.content).length > 0) {
    lines.push(String(entry.content));
  }

  if (entry.photoRefs && Array.isArray(entry.photoRefs) && entry.photoRefs.length > 0) {
    lines.push('');
    lines.push('## 照片');
    lines.push('');
    for (const photo of entry.photoRefs) {
      const caption = photo.caption || '';
      lines.push(`![${caption}](${photo.url})`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const diary = readJson<Record<string, Record<string, unknown>>>(DIARY_FILE);
    if (!diary || Object.keys(diary).length === 0) {
      return NextResponse.json({ error: 'No diary data' }, { status: 404 });
    }

    const entries = Object.values(diary).sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || ''))
    );

    if (format === 'markdown') {
      const md = entries.map(entryToMarkdown).join('\n');
      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="diary-export.md"',
        },
      });
    }

    if (format === 'geojson') {
      const features = entries
        .filter(e => e.lat && e.lng)
        .map(e => ({
          type: 'feature' as const,
          properties: {
            id: e.id,
            title: e.title,
            date: e.date,
            type: e.type,
            locationName: e.locationName,
            content: e.content,
            mood: e.mood,
            tags: e.tags,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [e.lng, e.lat],
          },
        }));

      const geojson = {
        type: 'FeatureCollection' as const,
        features,
      };

      return new NextResponse(JSON.stringify(geojson, null, 2), {
        headers: {
          'Content-Type': 'application/geo+json',
          'Content-Disposition': 'attachment; filename="diary-geojson.geojson"',
        },
      });
    }

    // json
    return new NextResponse(JSON.stringify(diary, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="diary-export.json"',
      },
    });
  } catch (e) {
    console.error('[diary/export] Error:', e);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
