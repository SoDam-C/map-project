import type { GpsTrack, GpsPoint } from '@/lib/types';

/**
 * 假 GPS 轨迹数据 — 演示迷雾擦亮 + 速度着色 + 时间筛选
 * 覆盖不同时间段和速度类型
 */

function genId(i: number): string {
  return `seed-track-${i}`;
}

function makeTrack(
  id: string,
  startTime: number,
  endTime: number,
  points: GpsPoint[],
  title: string,
): GpsTrack {
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const distance = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    const dLat = (p.lat - prev.lat) * 111000;
    const dLng = (p.lng - prev.lng) * 111000 * Math.cos(prev.lat * Math.PI / 180);
    return sum + Math.sqrt(dLat * dLat + dLng * dLng);
  }, 0);

  return {
    id,
    deviceId: 'seed-device',
    title,
    type: 'continuous',
    sportType: undefined,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    distance,
    duration: (endTime - startTime) / 1000,
    pointCount: points.length,
    bounds: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)] as [number, number, number, number],
    createdAt: new Date(startTime).toISOString(),
    updatedAt: new Date(startTime).toISOString(),
    footprintProcessed: false,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate points along waypoints with given speed range and timing.
 * speedMin/speedMax in m/s, intervalMs between points.
 */
function generateSegment(
  waypoints: number[][],
  baseTime: number,
  speedMin: number,
  speedMax: number,
  intervalMs: number,
  jitter: number = 0.0005,
  elevBase: number = 10,
  elevRange: number = 15,
): GpsPoint[] {
  const points: GpsPoint[] = [];
  let idx = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const steps = 8 + Math.floor(Math.random() * 6);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      points.push({
        lat: lerp(waypoints[i][0], waypoints[i + 1][0], t) + (Math.random() - 0.5) * jitter,
        lng: lerp(waypoints[i][1], waypoints[i + 1][1], t) + (Math.random() - 0.5) * jitter,
        elevation: elevBase + Math.random() * elevRange,
        accuracy: 3 + Math.random() * 12,
        speed: speedMin + Math.random() * (speedMax - speedMin),
        bearing: Math.random() * 360,
        timestamp: baseTime + idx * intervalMs + Math.random() * (intervalMs * 0.3),
      });
      idx++;
    }
  }
  return points;
}

// ============================================================
// Time-relative seed data — offsets from "today" (2026-05-13)
// ============================================================

// "Today" — 2026-05-13 morning walk in Chengdu (slow: 0.8–2 m/s)
function makeChengduWalk(): GpsPoint[] {
  const base = new Date('2026-05-13T07:30:00+08:00').getTime();
  return generateSegment(
    [
      [30.5728, 104.0668],  // 天府广场
      [30.5750, 104.0750],  // 春熙路
      [30.5780, 104.0820],  // 太古里
      [30.5810, 104.0900],  // 九眼桥方向
      [30.5830, 104.0980],  // 合江亭
      [30.5800, 104.1050],  // 望江楼
    ],
    base, 0.8, 2.0, 8000, 0.0003, 500, 20,
  );
}

// "Yesterday" — 2026-05-12 cycling in Hangzhou (medium: 4–8 m/s)
function makeHangzhouCycle(): GpsPoint[] {
  const base = new Date('2026-05-12T16:00:00+08:00').getTime();
  return generateSegment(
    [
      [30.2500, 120.1500],  // 断桥
      [30.2450, 120.1400],  // 白堤
      [30.2380, 120.1350],  // 苏堤
      [30.2300, 120.1250],  // 花港观鱼
      [30.2220, 120.1300],  // 雷峰塔
      [30.2250, 120.1450],  // 南山路
      [30.2350, 120.1550],  // 湖滨
    ],
    base, 4.0, 8.0, 5000, 0.0004, 10, 8,
  );
}

// "3 days ago" — 2026-05-10 driving in Nanjing (fast: 12–22 m/s)
function makeNanjingDrive(): GpsPoint[] {
  const base = new Date('2026-05-10T14:00:00+08:00').getTime();
  return generateSegment(
    [
      [32.0600, 118.7800],  // 玄武湖
      [32.0550, 118.7950],  // 新街口
      [32.0400, 118.8100],  // 夫子庙
      [32.0200, 118.8300],  // 南京南站
      [32.0000, 118.8600],  // 江宁
    ],
    base, 12.0, 22.0, 4000, 0.0008, 15, 25,
  );
}

// "A week ago" — 2026-05-06 highway Wuhan → Yichang (very fast: 25–35 m/s)
function makeWuhanHighway(): GpsPoint[] {
  const base = new Date('2026-05-06T09:00:00+08:00').getTime();
  return generateSegment(
    [
      [30.5930, 114.3060],  // 武汉
      [30.5500, 114.1000],  // 汉阳西
      [30.4500, 113.9000],  // 仙桃
      [30.3500, 113.7000],  // 潜江
      [30.2500, 113.5000],  // 荆州
      [30.1500, 113.3000],  // 枝江
      [30.0500, 113.1000],  // 宜昌
    ],
    base, 25.0, 35.0, 6000, 0.001, 30, 40,
  );
}

// ============================================================
// Older tracks (Jan–Apr 2026) — for month/year/all filters
// ============================================================

// Track 0: 北京城区 — 天安门 → 国贸 (walking 1.5–4.5 m/s, Jan 15)
function makeBeijingPoints(): GpsPoint[] {
  return generateSegment(
    [
      [39.9087, 116.3975],
      [39.9120, 116.4050],
      [39.9150, 116.4150],
      [39.9160, 116.4250],
      [39.9090, 116.4350],
      [39.9050, 116.4450],
      [39.9000, 116.4550],
    ],
    new Date('2026-01-15T08:00:00Z').getTime(),
    1.5, 4.5, 30000, 0.0005, 40, 10,
  );
}

// Track 1: 上海浦东 — 外滩 → 张江 (mix walk/run 2–6 m/s, Feb 20)
function makeShanghaiPoints(): GpsPoint[] {
  return generateSegment(
    [
      [31.2400, 121.4900],
      [31.2350, 121.5000],
      [31.2300, 121.5100],
      [31.2200, 121.5200],
      [31.2100, 121.5400],
      [31.2000, 121.5600],
      [31.1950, 121.5900],
    ],
    new Date('2026-02-20T10:00:00Z').getTime(),
    2.0, 6.0, 25000, 0.0005, 5, 10,
  );
}

// Track 2: 广州 → 深圳 (highway 15–40 m/s, Apr 5)
function makeGzSzPoints(): GpsPoint[] {
  return generateSegment(
    [
      [23.1300, 113.2640],
      [23.1100, 113.3200],
      [23.0500, 113.4000],
      [22.9500, 113.5000],
      [22.8500, 113.6500],
      [22.7500, 113.7500],
      [22.7000, 113.8500],
      [22.6800, 113.9200],
      [22.6500, 114.0500],
    ],
    new Date('2026-04-05T09:00:00Z').getTime(),
    15.0, 40.0, 40000, 0.001, 10, 30,
  );
}

export interface SeedTrackData {
  track: GpsTrack;
  points: GpsPoint[];
}

// ============================================================
// Dense overlapping tracks — to test density accumulation
// ============================================================

// Chengdu afternoon: overlaps morning walk (春熙路→太古里→九眼桥)
function makeChengduAfternoon(): GpsPoint[] {
  const base = new Date('2026-05-13T14:00:00+08:00').getTime();
  return generateSegment(
    [
      [30.5680, 104.0600],  // 人民公园
      [30.5720, 104.0650],  // 天府广场 (overlaps morning start)
      [30.5750, 104.0750],  // 春熙路 (overlaps morning)
      [30.5780, 104.0820],  // 太古里 (overlaps morning)
      [30.5800, 104.0880],  // 东门大桥
      [30.5820, 104.0950],  // 水井坊
    ],
    base, 1.0, 2.5, 7000, 0.0003, 500, 15,
  );
}

// Chengdu evening: different district but touches same center
function makeChengduEvening(): GpsPoint[] {
  const base = new Date('2026-05-13T19:30:00+08:00').getTime();
  return generateSegment(
    [
      [30.5650, 104.0580],  // 宽窄巷子
      [30.5700, 104.0620],  // 骡马市
      [30.5730, 104.0680],  // 天府广场 (triple overlap)
      [30.5760, 104.0780],  // 红星路 (near morning route)
      [30.5785, 104.0830],  // 太古里 (triple overlap)
      [30.5810, 104.0920],  // 九眼桥 (overlaps morning)
    ],
    base, 0.8, 1.8, 9000, 0.0003, 500, 12,
  );
}

// Beijing afternoon: Wangfujing → Jianguomen (overlaps morning route)
function makeBeijingAfternoon(): GpsPoint[] {
  return generateSegment(
    [
      [39.9140, 116.4100],  // 王府井
      [39.9120, 116.4180],  // 东单 (near morning route)
      [39.9100, 116.4280],  // 建国门 (overlaps morning)
      [39.9080, 116.4380],  // 国贸 (overlaps morning end)
      [39.9050, 116.4450],  // 大望路
      [39.9020, 116.4550],  // 四惠方向
    ],
    new Date('2026-01-15T14:00:00Z').getTime(),
    1.5, 4.0, 25000, 0.0005, 40, 10,
  );
}

// Beijing evening: Xidan → Qianmen (creates dense area with others)
function makeBeijingEvening(): GpsPoint[] {
  return generateSegment(
    [
      [39.9080, 116.3730],  // 西单
      [39.9090, 116.3900],  // 中南海附近
      [39.9087, 116.3975],  // 天安门 (overlaps morning start)
      [39.9070, 116.4050],  // 前门
      [39.9090, 116.4120],  // 崇文门 (near afternoon route)
      [39.9120, 116.4200],  // 北京站
    ],
    new Date('2026-01-15T18:00:00Z').getTime(),
    1.2, 3.0, 20000, 0.0004, 45, 8,
  );
}

// Beijing Forbidden City grid walk — zigzag covers entire palace (~960m x 750m)
// Creates a dense filled area to test large-scale fog clearing
function makeForbiddenCityGrid(): GpsPoint[] {
  const base = new Date('2026-01-16T10:00:00+08:00').getTime();
  const points: GpsPoint[] = [];
  const latStart = 39.9130;
  const latEnd = 39.9235;
  const lngStart = 116.3910;
  const lngEnd = 116.3972;
  const latSteps = 12;
  const lngSteps = 7;
  let idx = 0;
  for (let j = 0; j < lngSteps; j++) {
    const lng = lngStart + (lngEnd - lngStart) * j / (lngSteps - 1);
    const reverse = j % 2 === 1;
    for (let i = 0; i < latSteps; i++) {
      const latIdx = reverse ? latSteps - 1 - i : i;
      const lat = latStart + (latEnd - latStart) * latIdx / (latSteps - 1);
      points.push({
        lat: lat + (Math.random() - 0.5) * 0.0002,
        lng: lng + (Math.random() - 0.5) * 0.0002,
        elevation: 44 + Math.random() * 5,
        accuracy: 3 + Math.random() * 6,
        speed: 0.5 + Math.random() * 1.0,
        bearing: Math.random() * 360,
        timestamp: base + idx * 4000 + Math.random() * 800,
      });
      idx++;
    }
  }
  return points;
}

export function getSeedTracks(): SeedTrackData[] {
  const tracks: { pts: GpsPoint[]; title: string }[] = [
    { pts: makeChengduWalk(), title: '成都晨跑散步' },         // today
    { pts: makeChengduAfternoon(), title: '成都下午逛街' },     // today (overlap)
    { pts: makeChengduEvening(), title: '成都晚间散步' },       // today (overlap)
    { pts: makeHangzhouCycle(), title: '杭州西湖骑行' },       // yesterday
    { pts: makeNanjingDrive(), title: '南京城市驾车' },        // 3 days ago
    { pts: makeWuhanHighway(), title: '武汉→宜昌高速' },      // week ago
    { pts: makeBeijingPoints(), title: '北京城区轨迹' },       // Jan
    { pts: makeBeijingAfternoon(), title: '北京下午出行' },     // Jan (overlap)
    { pts: makeBeijingEvening(), title: '北京晚间出行' },       // Jan (overlap)
    { pts: makeForbiddenCityGrid(), title: '故宫全景游览' },   // Jan (dense grid)
    { pts: makeShanghaiPoints(), title: '上海浦东轨迹' },      // Feb (old)
    { pts: makeGzSzPoints(), title: '广州→深圳轨迹' },        // Apr (old)
  ];

  return tracks.map((t, i) => {
    const pts = t.pts;
    return {
      track: makeTrack(genId(i), pts[0].timestamp, pts[pts.length - 1].timestamp, pts, t.title),
      points: pts,
    };
  });
}
