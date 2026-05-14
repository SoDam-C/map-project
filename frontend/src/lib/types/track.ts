/**
 * GPS 轨迹类型定义
 *
 * 数据模型：
 *   - GpsTrack: 轨迹元数据（一次持续定位的记录），存 IndexedDB tracks store
 *   - GpsPoint: 单个 GPS 点，存 IndexedDB track-points-{trackId} store
 *   - SportType/TrackPoint: 保留运动轨迹概念（作为 type: 'sport' 的子类型）
 */

/** GPS 单点数据 */
export interface GpsPoint {
  lat: number;
  lng: number;
  elevation?: number;     // 海拔（米）
  accuracy: number;       // GPS 精度（米）
  speed?: number;         // 速度（m/s）
  bearing?: number;       // 航向角（度）
  timestamp: number;       // Unix 时间戳（毫秒）
}

/** 轨迹类型 */
export type TrackType = 'continuous' | 'imported' | 'sport';

/** GPS 轨迹元数据（不含 GPS 点，避免大对象） */
export interface GpsTrack {
  id: string;             // UUID
  deviceId: string;       // 采集设备标识
  title?: string;
  type: TrackType;
  sportType?: string;     // 运动类型（type=sport 时）
  startTime: string;      // ISO 8601
  endTime: string;        // ISO 8601
  distance: number;       // 总距离（米）
  duration: number;       // 总时长（秒）
  pointCount: number;     // GPS 点数
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  createdAt: string;
  updatedAt: string;
  footprintProcessed?: boolean; // 是否已自动点亮过
}

/** 运动类型（保留，供运动轨迹子类型使用） */
export type SportType = 'running' | 'cycling' | 'walking' | 'hiking';

/** 运动类型配置 */
export interface SportConfig {
  type: SportType;
  label: string;
  icon: string;
  color: string;
}

export const SPORT_TYPES: SportConfig[] = [
  { type: 'running', label: '跑步', icon: 'person-running', color: '#ef4444' },
  { type: 'cycling', label: '骑行', icon: 'bike', color: '#f59e0b' },
  { type: 'walking', label: '步行', icon: 'footprints', color: '#22c55e' },
  { type: 'hiking', label: '登山', icon: 'mountain', color: '#8b5cf6' },
];

/** 兼容旧版 TrackRecord（后续可移除） */
export interface TrackRecord {
  id: string;
  type: SportType;
  title?: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  route: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  points: TrackPoint[];
  createdAt: string;
}

/** 兼容旧版 TrackPoint */
export interface TrackPoint {
  lat: number;
  lng: number;
  elevation?: number;
  timestamp: number;
  speed?: number;
  heartRate?: number;
}

/** 批量上传请求体 */
export interface TrackBatchUpload {
  tracks: GpsTrack[];
  points: TrackPointsBatch[];
}

/** 单条轨迹的 GPS 点批量 */
export interface TrackPointsBatch {
  trackId: string;
  points: GpsPoint[];
}

/** 轨迹自动点亮结果 */
export interface TrackFootprintResult {
  trackId: string;
  footprints: Array<{
    adcode: string;
    name: string;
    level: number;
    firstSeen: string;
    lastSeen: string;
    pointCount: number;
  }>;
}
