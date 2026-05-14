/**
 * 日记系统类型定义
 *
 * 三种条目类型：
 *   - track_entry:  关联 GPS 轨迹的日记（被动记录 + 主动文字）
 *   - memory_entry: 纯记忆条目（手动创建，无轨迹，只有地点+文字）
 *   - note_entry:   游离笔记（不关联时间/地点，如旅行规划、感想）
 */

/** 日记条目类型 */
export type DiaryEntryType = 'track_entry' | 'memory_entry' | 'note_entry';

/** 日记条目状态 */
export type DiaryEntryStatus = 'draft' | 'published';

/** 照片引用（外部 URL） */
export interface PhotoReference {
  id: string;
  url: string;
  caption?: string;
  takenAt?: string;
}

/** 景点信息（来自 Wikipedia 或手动输入） */
export interface AttractionInfo {
  id: string;
  name: string;
  extract?: string;
  imageUrl?: string;
  wikipediaUrl?: string;
  rating?: number;
  lat?: number;
  lng?: number;
  source: 'wikipedia' | 'manual';
  fetchedAt: string;
}

/** 日记条目 */
export interface DiaryEntry {
  id: string;
  type: DiaryEntryType;
  date: string;
  startTime?: string;
  endTime?: string;
  title: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  adcode?: string;
  content: string;
  mood?: string;
  tags?: string[];
  trackIds?: string[];
  attractionId?: string;
  photoRefs: PhotoReference[];
  tripId?: string;
  status: DiaryEntryStatus;
  createdAt: string;
  updatedAt: string;
}

/** 旅行分组 */
export interface DiaryTrip {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  entryIds: string[];
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** 存储结构 */
export type DiaryStore = Record<string, DiaryEntry>;
export type DiaryTripStore = Record<string, DiaryTrip>;
export type AttractionStore = Record<string, AttractionInfo>;
