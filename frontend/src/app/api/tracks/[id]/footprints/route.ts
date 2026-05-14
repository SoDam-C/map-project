/**
 * POST /api/tracks/[id]/footprints — 从轨迹 GPS 点自动计算点亮区域
 *
 * 逻辑：
 * 1. 读取轨迹的所有 GPS 点
 * 2. 检测每个点所在的国家（通过经纬度判断）
 * 3. 对每个国家，加载对应级别的行政区划 GeoJSON
 * 4. 用 point-in-polygon 匹配每个点到行政区划
 * 5. 返回匹配到的 adcode 列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'track-data');
const GEO_DATA_ROOT = resolve(process.cwd(), 'geo-data');

interface GpsPoint {
  lat: number;
  lng: number;
  elevation?: number;
  accuracy: number;
  speed?: number;
  bearing?: number;
  timestamp: number;
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

/** Ray casting point-in-polygon */
function pointInPolygon(x: number, y: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInMultiPolygon(lng: number, lat: number, geometry: any): boolean {
  if (geometry.type === 'Polygon') {
    // GeoJSON: [lng, lat]
    return pointInPolygon(lng, lat, geometry.coordinates[0]);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(
      (poly: number[][][]) => pointInPolygon(lng, lat, poly[0]),
    );
  }
  return false;
}

/** 加载国家列表，用于匹配坐标到国家 */
function loadCountryList(): Array<{ iso3: string; bbox: [number, number, number, number] }> {
  // 内置常用国家 bbox 列表（与 countryList.ts POPULAR_COUNTRIES 同步）
  // bbox 格式: [minLat, minLng, maxLat, maxLng]
  const COUNTRIES: Array<{ iso3: string; bbox: [number, number, number, number] }> = [
    { iso3: 'CHN', bbox: [18, 73, 54, 135] },
    { iso3: 'JPN', bbox: [26, 129, 46, 146] },
    { iso3: 'KOR', bbox: [33, 125, 39, 130] },
    { iso3: 'THA', bbox: [6, 97, 21, 106] },
    { iso3: 'SGP', bbox: [1.1, 103.6, 1.5, 104.1] },
    { iso3: 'MYS', bbox: [1, 100, 8, 119] },
    { iso3: 'VNM', bbox: [8, 102, 24, 110] },
    { iso3: 'IDN', bbox: [-11, 95, 6, 141] },
    { iso3: 'PHL', bbox: [5, 117, 21, 127] },
    { iso3: 'MMR', bbox: [9, 92, 28, 102] },
    { iso3: 'KHM', bbox: [10, 102, 15, 108] },
    { iso3: 'LAO', bbox: [13, 100, 23, 108] },
    { iso3: 'NPL', bbox: [26, 80, 31, 89] },
    { iso3: 'LKA', bbox: [6, 79, 10, 82] },
    { iso3: 'IND', bbox: [6, 68, 36, 97] },
    { iso3: 'AUS', bbox: [-47, 113, -10, 154] },
    { iso3: 'NZL', bbox: [-47, 166, -34, 179] },
    { iso3: 'USA', bbox: [24, -125, 50, -66] },
    { iso3: 'CAN', bbox: [40, -141, 84, -52] },
    { iso3: 'MEX', bbox: [14, -118, 33, -86] },
    { iso3: 'GBR', bbox: [50, -8, 59, 2] },
    { iso3: 'FRA', bbox: [41, -5, 51, 10] },
    { iso3: 'DEU', bbox: [47, 6, 55, 15] },
    { iso3: 'ITA', bbox: [36, 7, 47, 19] },
    { iso3: 'ESP', bbox: [36, -9, 44, 4] },
    { iso3: 'PRT', bbox: [37, -10, 42, -7] },
    { iso3: 'NLD', bbox: [50, 3, 54, 8] },
    { iso3: 'BEL', bbox: [49, 3, 52, 7] },
    { iso3: 'CHE', bbox: [46, 6, 48, 11] },
    { iso3: 'AUT', bbox: [46, 10, 49, 17] },
    { iso3: 'CZE', bbox: [48, 12, 51, 19] },
    { iso3: 'POL', bbox: [49, 14, 55, 24] },
    { iso3: 'SWE', bbox: [55, 11, 69, 25] },
    { iso3: 'NOR', bbox: [58, 5, 71, 31] },
    { iso3: 'DNK', bbox: [54, 8, 58, 15] },
    { iso3: 'FIN', bbox: [60, 20, 70, 32] },
    { iso3: 'GRC', bbox: [35, 20, 42, 27] },
    { iso3: 'TUR', bbox: [36, 26, 42, 45] },
    { iso3: 'RUS', bbox: [41, 27, 77, 191] },
    { iso3: 'BRA', bbox: [-34, -74, 5, -35] },
    { iso3: 'ARG', bbox: [-56, -74, -21, -53] },
    { iso3: 'CHL', bbox: [-56, -76, -17, -66] },
    { iso3: 'ZAF', bbox: [-35, 16, -22, 33] },
    { iso3: 'EGY', bbox: [22, 25, 32, 37] },
    { iso3: 'MAR', bbox: [27, -14, 36, -1] },
    { iso3: 'ARE', bbox: [22, 51, 26, 57] },
    { iso3: 'SAU', bbox: [15, 35, 33, 56] },
    { iso3: 'ISR', bbox: [29, 34, 33, 36] },
    { iso3: 'TWN', bbox: [22, 120, 25, 122] },
    { iso3: 'HKG', bbox: [22, 114, 22.6, 114.5] },
    { iso3: 'MAC', bbox: [22.1, 113.5, 22.2, 113.6] },
    { iso3: 'MNG', bbox: [42, 87, 52, 120] },
    { iso3: 'ROU', bbox: [43, 20, 48, 30] },
    { iso3: 'HUN', bbox: [46, 16, 49, 23] },
    { iso3: 'HRV', bbox: [42, 14, 46, 20] },
    { iso3: 'SRB', bbox: [42, 18, 46, 23] },
    { iso3: 'BGR', bbox: [41, 22, 44, 29] },
    { iso3: 'UKR', bbox: [45, 22, 52, 40] },
  ];
  return COUNTRIES;
}

/** 通过坐标粗略匹配国家（bbox 匹配） */
function detectCountry(lat: number, lng: number, countries: Array<{ iso3: string; bbox: number[] }>): string | null {
  // 注意 bbox 格式: [minLat, minLng, maxLat, maxLng]
  for (const c of countries) {
    const [minLat, minLng, maxLat, maxLng] = c.bbox;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return c.iso3;
    }
  }
  return null;
}

/** 加载指定国家指定级别的 GeoJSON */
function loadGeoJson(iso3: string, level: number): any[] | null {
  const filePath = join(GEO_DATA_ROOT, 'current', iso3, `${level}.json`);
  const data = readJson<{ type: string; features: any[] }>(filePath);
  if (!data) return null;

  // 中国 level 2 需要合并所有省级文件
  if (iso3 === 'CHN' && level === 2) {
    const dir = join(GEO_DATA_ROOT, 'current', 'CHN', '2');
    if (existsSync(dir)) {
      const allFeatures: any[] = [...data.features];
      const files = readdirSync(dir).filter((f: string) => f.endsWith('.json'));
      for (const file of files) {
        const provinceData = readJson<{ features: any[] }>(join(dir, file));
        if (provinceData) allFeatures.push(...provinceData.features);
      }
      return allFeatures;
    }
  }

  return data.features;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 读取轨迹元数据
  const index = readJson<Record<string, any>>(join(DATA_DIR, 'index.json'));

  // 读取 GPS 点：优先服务端文件，其次 POST body
  let allPoints: GpsPoint[] = [];
  const pointsPath = join(DATA_DIR, 'points', id, 'points.json');
  const filePoints = readJson<GpsPoint[]>(pointsPath);
  if (filePoints && filePoints.length > 0) {
    allPoints = filePoints;
  } else {
    // 尝试从 POST body 获取 points（兼容未上传到服务端的轨迹）
    try {
      const body = await request.json();
      if (body.points?.length > 0) {
        allPoints = body.points;
      }
    } catch { /* no body */ }
  }

  if (allPoints.length === 0) {
    return NextResponse.json({ trackId: id, footprints: [] });
  }

  const countries = loadCountryList();
  if (countries.length === 0) {
    return NextResponse.json({ error: 'Country list not available' }, { status: 500 });
  }

  // 按 accuracy 过滤（丢弃精度太低的点）
  const validPoints = allPoints.filter(p => p.accuracy < 100);
  // 采样减少计算量（每 30 秒一个点足够匹配行政区划）
  const sampled = [validPoints[0]];
  let lastTs = validPoints[0]?.timestamp || 0;
  for (const p of validPoints) {
    if (p.timestamp - lastTs >= 30000) {
      sampled.push(p);
      lastTs = p.timestamp;
    }
  }

  // 按国家分组 GPS 点
  const pointsByCountry = new Map<string, GpsPoint[]>();
  for (const p of sampled) {
    const iso3 = detectCountry(p.lat, p.lng, countries);
    if (!iso3) continue;
    const arr = pointsByCountry.get(iso3) || [];
    arr.push(p);
    pointsByCountry.set(iso3, arr);
  }

  // 对每个国家做 point-in-polygon 匹配
  const footprints: Array<{
    adcode: string;
    name: string;
    level: number;
    firstSeen: string;
    lastSeen: string;
    pointCount: number;
  }> = [];

  for (const [iso3, points] of pointsByCountry) {
    // 从低到高尝试各级行政区划
    for (let level = 0; level <= 3; level++) {
      const features = loadGeoJson(iso3, level);
      if (!features || features.length === 0) continue;

      const matchedAdcodes = new Map<string, { name: string; firstTs: number; lastTs: number; count: number }>();

      for (const p of points) {
        for (const f of features) {
          if (!f.geometry) continue;
          if (pointInMultiPolygon(p.lng, p.lat, f.geometry)) {
            const adcode = String(f.properties?.adcode ?? '');
            const name = String(f.properties?.name ?? '');
            if (!adcode) continue;

            const existing = matchedAdcodes.get(adcode);
            if (existing) {
              existing.lastTs = Math.max(existing.lastTs, p.timestamp);
              existing.count++;
            } else {
              matchedAdcodes.set(adcode, {
                name,
                firstTs: p.timestamp,
                lastTs: p.timestamp,
                count: 1,
              });
            }
            break; // 每个点只匹配一个区域
          }
        }
      }

      for (const [adcode, info] of matchedAdcodes) {
        footprints.push({
          adcode,
          name: info.name,
          level,
          firstSeen: new Date(info.firstTs).toISOString(),
          lastSeen: new Date(info.lastTs).toISOString(),
          pointCount: info.count,
        });
      }

      // 只在最低成功级别匹配（避免重复）
      if (matchedAdcodes.size > 0) break;
    }
  }

  return NextResponse.json({
    trackId: id,
    footprints,
    totalPoints: allPoints.length,
    matchedPoints: sampled.length,
    matchedRegions: footprints.length,
  });
}
