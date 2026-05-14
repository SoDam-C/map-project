/**
 * IndexedDB 存储封装
 *
 * 用于存储 GPS 轨迹等大数据量数据（超出 localStorage 5MB 限制）
 * 基于 idb 库：https://github.com/nicolo-ribaudo/idb
 *
 * 数据库: map-data
 * Object stores:
 *   - tracks: GpsTrack 元数据（不含 GPS 点）
 *   - track-points-{trackId}: 单条轨迹的 GPS 点（每条轨迹一个 store）
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'map-data';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // tracks store: 轨迹元数据
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/** 初始化数据库（页面加载时调用一次） */
export async function initIndexedDB(): Promise<void> {
  const db = await getDb();
  // 验证连接
  await db.count('tracks');
}

/** 获取所有轨迹元数据 */
export async function getAllTracks(): Promise<any[]> {
  const db = await getDb();
  return db.getAll('tracks');
}

/** 获取单条轨迹 */
export async function getTrack(id: string): Promise<any | undefined> {
  const db = await getDb();
  return db.get('tracks', id);
}

/** 保存轨迹元数据 */
export async function putTrack(track: any): Promise<void> {
  const db = await getDb();
  await db.put('tracks', track);
}

/** 删除轨迹 */
export async function deleteTrack(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('tracks', id);
}

/** 获取指定轨迹的 GPS 点数量 */
export async function getTrackPointCount(trackId: string): Promise<number> {
  const db = await getDb();
  const storeName = `track-points-${trackId}`;
  if (!db.objectStoreNames.contains(storeName)) return 0;
  return db.count(storeName);
}

/**
 * 获取指定轨迹的 GPS 点（分页）
 * @param trackId 轨迹 ID
 * @param offset 跳过前 N 个点
 * @param limit 最多返回 N 个点
 */
export async function getTrackPoints(
  trackId: string,
  offset: number = 0,
  limit: number = 1000,
): Promise<any[]> {
  const db = await getDb();
  const storeName = `track-points-${trackId}`;
  if (!db.objectStoreNames.contains(storeName)) return [];

  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  const points: any[] = [];
  let skipped = 0;
  let count = 0;

  // idb 库的 openCursor 返回 Promise
  let cursor = await store.openCursor();
  while (cursor) {
    if (skipped < offset) {
      skipped++;
    } else if (count < limit) {
      points.push(cursor.value);
      count++;
    } else {
      break;
    }
    cursor = await cursor.continue();
  }

  return points;
}

/**
 * 批量保存 GPS 点到指定轨迹
 * 自动创建对应的 object store（如果不存在）
 */
export async function putTrackPoints(
  trackId: string,
  points: any[],
): Promise<void> {
  const db = await getDb();
  const storeName = `track-points-${trackId}`;

  // 如果 store 不存在，创建它
  if (!db.objectStoreNames.contains(storeName)) {
    db.createObjectStore(storeName, { keyPath: 'timestamp' });
  }

  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const point of points) {
    store.put(point);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 获取指定轨迹 GPS 点的时间范围
 */
export async function getTrackTimeRange(
  trackId: string,
): Promise<{ min: number; max: number } | null> {
  const db = await getDb();
  const storeName = `track-points-${trackId}`;
  if (!db.objectStoreNames.contains(storeName)) return null;

  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  const all = await store.getAll() as any[];
  if (all.length === 0) return null;

  return {
    min: all[0].timestamp,
    max: all[all.length - 1].timestamp,
  };
}

/**
 * 删除轨迹及其所有 GPS 点
 */
export async function deleteTrackWithPoints(trackId: string): Promise<void> {
  const db = await getDb();
  const storeName = `track-points-${trackId}`;

  // 删除 GPS 点 store
  if (db.objectStoreNames.contains(storeName)) {
    db.deleteObjectStore(storeName);
  }

  // 删除轨迹元数据
  await db.delete('tracks', trackId);
}

/**
 * 获取数据库统计信息
 */
export async function getIndexedDBStats(): Promise<{
  trackCount: number;
  totalPoints: number;
  storeNames: string[];
}> {
  const db = await getDb();
  const trackCount = await db.count('tracks');
  const storeNames = Array.from(db.objectStoreNames) as string[];

  let totalPoints = 0;
  for (const name of storeNames) {
    if (name.startsWith('track-points-')) {
      totalPoints += await db.count(name);
    }
  }

  return { trackCount, totalPoints, storeNames };
}
