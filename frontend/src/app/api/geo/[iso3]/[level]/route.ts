/**
 * GeoJSON API Route — 本地文件优先，远程 API 作为 fallback
 *
 * 数据目录结构（项目根目录 geo-data/）：
 *   geo-data/current/{ISO3}/{level}.json        — 单文件级别
 *   geo-data/current/CHN/2/{省级adcode}.json     — 中国按省拆分
 *   geo-data/historical/{name}/{ISO3}/{level}.json — 历史区划
 *
 * 通过 ?dataset=historical/CHN_2000 参数选择数据集（默认 current）
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

// geo-data 根目录（相对于项目根）
const GEO_DATA_ROOT = resolve(process.cwd(), 'geo-data');

interface FeatureCollection {
  type: 'FeatureCollection';
  features: any[];
}

// ============ 本地文件读取 ============

/** 从本地文件系统读取 GeoJSON */
function readLocalFile(datasetPath: string, iso3: string, level: number, parentCode?: string): FeatureCollection | null {
  let filePath: string;

  if (iso3 === 'CHN' && level === 2 && parentCode) {
    // 中国 level 2：按省拆分
    filePath = join(datasetPath, 'CHN', '2', `${parentCode}.json`);
  } else {
    // 标准路径：{ISO3}/{level}.json
    filePath = join(datasetPath, iso3, `${level}.json`);
  }

  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[geo-api] Failed to read ${filePath}:`, e);
    return null;
  }
}

/** 中国 level 2：合并所有省级文件（无 bbox 过滤时） */
function readChinaLevel2All(datasetPath: string): FeatureCollection {
  const dir = join(datasetPath, 'CHN', '2');
  const allFeatures: any[] = [];

  if (!existsSync(dir)) {
    return { type: 'FeatureCollection', features: allFeatures };
  }

  try {
    const files = readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data: FeatureCollection = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
        allFeatures.push(...data.features);
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  return { type: 'FeatureCollection', features: allFeatures };
}

/** 中国 level 2：按 bbox 过滤可见省份并合并 */
function readChinaLevel2Filtered(datasetPath: string, bounds: { west: number; east: number; south: number; north: number }): FeatureCollection {
  // 简单方案：合并所有省级文件，由客户端做 bbox 过滤
  // 后续可优化为按省份 bbox 预过滤
  return readChinaLevel2All(datasetPath);
}

/** 中国 level 3：合并所有市级文件 */
function readChinaLevel3All(datasetPath: string): FeatureCollection {
  // level 3 数据来自省级 full 文件（level 2 目录下的文件包含市级数据）
  // 后续可添加 geo-data/current/CHN/3/ 目录支持
  return { type: 'FeatureCollection', features: [] };
}

// ============ 远程 API fallback ============

const DATAV_BASE = 'https://geo.datav.aliyun.com/areas_v3/bound';
const GADM_BASE = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json';

function prefixChinaFeature(f: any): any {
  return {
    ...f,
    properties: {
      ...f.properties,
      adcode: 'CHN:' + String(f.properties?.adcode ?? ''),
      level: 1,
    },
  };
}

async function fetchChinaBase(level: number): Promise<FeatureCollection | null> {
  try {
    const resp = await fetch(`${DATAV_BASE}/100000_full.json`);
    if (!resp.ok) return null;
    const data: FeatureCollection = await resp.json();
    data.features = data.features.map(prefixChinaFeature);
    return data;
  } catch {
    return null;
  }
}

async function fetchChinaLevel2(): Promise<FeatureCollection | null> {
  const CHINA_PROVINCES = [
    '110000','120000','130000','140000','150000','210000','220000','230000',
    '310000','320000','330000','340000','350000','360000','370000','410000',
    '420000','430000','440000','450000','460000','500000','510000','520000',
    '530000','540000','610000','620000','630000','640000','650000','710000',
    '810000','820000',
  ];
  const allFeatures: any[] = [];
  await Promise.all(CHINA_PROVINCES.map(async (code) => {
    try {
      const resp = await fetch(`${DATAV_BASE}/${code}_full.json`);
      if (!resp.ok) return;
      const data: FeatureCollection = await resp.json();
      data.features = data.features.map(f => ({
        ...f,
        properties: { ...f.properties, adcode: 'CHN:' + String(f.properties?.adcode ?? ''), level: 2 },
      }));
      allFeatures.push(...data.features);
    } catch { /* skip */ }
  }));
  return { type: 'FeatureCollection', features: allFeatures };
}

function normalizeGadmFeature(feature: any, iso3: string, level: number): any {
  const props = feature.properties || {};
  const gid = props[`GID_${level}`] || '';
  const name = props[`NAME_${level}`] || props[`NAME_0`] || '';
  return {
    ...feature,
    properties: { ...props, adcode: `${iso3}:${gid}`, name, level },
  };
}

async function fetchGadmLevel(iso3: string, level: number): Promise<FeatureCollection | null> {
  try {
    const resp = await fetch(`${GADM_BASE}/gadm41_${iso3}_${level}.json`);
    if (!resp.ok) return null;
    const data: FeatureCollection = await resp.json();
    data.features = data.features.map(f => normalizeGadmFeature(f, iso3, level));
    return data;
  } catch {
    return null;
  }
}

// ============ 主处理函数 ============

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ iso3: string; level: string }> },
) {
  const { iso3, level: levelStr } = await params;
  const level = parseInt(levelStr, 10);
  const searchParams = request.nextUrl.searchParams;

  if (isNaN(level) || level < 0 || level > 4) {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
  }
  if (!/^[A-Z]{3}$/.test(iso3)) {
    return NextResponse.json({ error: 'Invalid ISO3 code' }, { status: 400 });
  }

  // 确定数据集路径
  const dataset = searchParams.get('dataset') || 'current';
  const datasetPath = join(GEO_DATA_ROOT, dataset);

  let data: FeatureCollection | null = null;

  // 1. 优先从本地文件读取
  if (iso3 === 'CHN') {
    if (level <= 1) {
      data = readLocalFile(datasetPath, 'CHN', 1);
    } else if (level === 2) {
      const bbox = searchParams.get('bbox');
      if (bbox) {
        const [w, s, e, n] = bbox.split(',').map(Number);
        if (!isNaN(w) && !isNaN(s) && !isNaN(e) && !isNaN(n)) {
          data = readChinaLevel2Filtered(datasetPath, { west: w, south: s, east: e, north: n });
        } else {
          data = readChinaLevel2All(datasetPath);
        }
      } else {
        data = readChinaLevel2All(datasetPath);
      }
    } else if (level === 3) {
      data = readChinaLevel3All(datasetPath);
    }
    // level 4 (乡镇)：本地暂不支持，需要远程 ruiduobao
  } else {
    data = readLocalFile(datasetPath, iso3, level);
  }

  // 2. 本地未命中，走远程 fallback
  if (!data) {
    if (iso3 === 'CHN') {
      if (level <= 1) {
        data = await fetchChinaBase(level);
      } else if (level === 2) {
        data = await fetchChinaLevel2();
      }
    } else if (level <= 3) {
      data = await fetchGadmLevel(iso3, level);
    }
  }

  if (!data) {
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      { status: 404 },
    );
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'X-Data-Source': data ? 'local' : 'remote',
    },
  });
}
