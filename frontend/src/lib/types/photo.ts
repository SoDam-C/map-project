/**
 * 照片相关类型定义
 */

/** 照片记录 */
export interface PhotoRecord {
  id: string;
  lat: number;
  lng: number;
  takenAt: string;
  adcode?: string;
  regionName?: string;
  thumbnail: string;
  description?: string;
  tags?: string[];
}

/** 照片导入状态 */
export type PhotoImportStatus = 'idle' | 'reading' | 'extracting' | 'geocoding' | 'done' | 'error';

/** EXIF GPS 信息 */
export interface ExifGpsInfo {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/** 照片存储结构 */
export type PhotoStore = Record<string, PhotoRecord>;
