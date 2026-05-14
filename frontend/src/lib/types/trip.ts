/**
 * 行程相关类型定义
 */

/** 交通方式 */
export type TransportType =
  | 'plane'
  | 'train'
  | 'car'
  | 'taxi'
  | 'bus'
  | 'cycling'
  | 'running'
  | 'walking'
  | 'ship'
  | 'other';

/** 行程途经点 */
export interface TripWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  adcode?: string;
  arrivedAt: string;
  transportType?: TransportType;
  notes?: string;
}

/** 行程记录 */
export interface TripRecord {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  transportType: TransportType;
  waypoints: TripWaypoint[];
  route?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  photoIds: string[];
  footprints: string[];
  createdAt: string;
  updatedAt: string;
}

/** 交通方式配置 */
export interface TransportConfig {
  type: TransportType;
  label: string;
  icon: string;
}

/** 所有交通方式配置 */
export const TRANSPORT_TYPES: TransportConfig[] = [
  { type: 'plane', label: '飞机', icon: 'plane' },
  { type: 'train', label: '火车', icon: 'train-front' },
  { type: 'car', label: '自驾', icon: 'car' },
  { type: 'taxi', label: '打车', icon: 'car-taxi-front' },
  { type: 'bus', label: '公交', icon: 'bus' },
  { type: 'cycling', label: '骑行', icon: 'bike' },
  { type: 'running', label: '跑步', icon: 'person-running' },
  { type: 'walking', label: '步行', icon: 'footprints' },
  { type: 'ship', label: '轮船', icon: 'ship' },
  { type: 'other', label: '其他', icon: 'route' },
];

/** 行程存储结构 */
export type TripStore = Record<string, TripRecord>;
