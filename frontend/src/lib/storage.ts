/**
 * 统一存储层 — 封装 localStorage，支持类型安全读写、命名空间隔离、数据迁移
 * 后续可切换到 IndexedDB 或云端 API
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** 存储命名空间 */
const NAMESPACES = {
  footprints: 'map-footprints',
  photos: 'map-photos',
  trips: 'map-trips',
  tracks: 'map-tracks',
  settings: 'map-settings',
  diary: 'map-diary',
  'diary-trips': 'map-diary-trips',
  attractions: 'map-attractions',
  'place-bookmarks': 'map-place-bookmarks',
  wishlist: 'map-wishlist',
} as const;

export type StorageNamespace = keyof typeof NAMESPACES;

/** 存储版本号，用于数据迁移 */
const STORAGE_VERSION = 4;
const VERSION_KEY = 'map-storage-version';

function getFullKey(namespace: StorageNamespace): string {
  return NAMESPACES[namespace];
}

/** 读取原始数据 */
function getRaw(namespace: StorageNamespace): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getFullKey(namespace));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 写入原始数据 */
function setRaw(namespace: StorageNamespace, data: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getFullKey(namespace), JSON.stringify(data));
  } catch (e) {
    console.error(`Storage write failed for "${namespace}":`, e);
  }
}

/** 删除命名空间数据 */
function remove(namespace: StorageNamespace): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getFullKey(namespace));
}

/** 通用类型安全读取 */
export function load<T>(namespace: StorageNamespace): T | null {
  return getRaw(namespace) as T | null;
}

/** 通用类型安全写入 */
export function save<T>(namespace: StorageNamespace, data: T): void {
  setRaw(namespace, data);
}

/** 删除数据 */
export function removeData(namespace: StorageNamespace): void {
  remove(namespace);
}

/**
 * 足迹专用：加载足迹数据
 * 支持从旧版格式自动迁移
 */
export function loadFootprints(): Record<string, any> | null {
  const data = load<any>('footprints');
  if (!data) return null;

  // 检测是否旧版格式（{ adcode: string, litAt: string, source: string }）
  // 旧版 key 是 adcode，value 是 { adcode, litAt, source }
  // 新版 key 是 id，value 是 FootprintRecord
  const firstValue = Object.values(data)[0] as any;
  if (firstValue && typeof firstValue === 'object' && !firstValue.id && firstValue.adcode) {
    // 旧版格式，迁移为新版
    return migrateLegacyFootprints(data);
  }

  return data;
}

/** 迁移旧版足迹数据到新版格式 */
function migrateLegacyFootprints(legacy: Record<string, any>): Record<string, any> {
  const migrated: Record<string, any> = {};
  for (const [adcode, fp] of Object.entries(legacy)) {
    const record = fp as any;
    migrated[adcode] = {
      id: adcode,
      adcode: record.adcode,
      name: record.adcode, // 旧版无 name，后续可通过 adcode 查询补全
      level: inferLevel(adcode),
      center: [0, 0], // 旧版无 center，后续补全
      litAt: record.litAt,
      source: record.source || 'manual',
    };
  }
  // 自动保存迁移后的数据
  save('footprints', migrated);
  return migrated;
}

/** 从 adcode 推断行政层级（支持复合 ID） */
function inferLevel(adcode: string): number {
  const idx = adcode.indexOf(':');
  const localId = idx === -1 ? adcode : adcode.slice(idx + 1);
  if (localId.length === 6 && localId.endsWith('0000')) return 1;
  if (localId.length === 6 && localId.endsWith('00')) return 2;
  if (localId.length === 6) return 3;
  if (localId.length >= 9) return 4;
  return 0;
}

/** 初始化存储版本并执行迁移 */
export function initStorage(): void {
  if (typeof window === 'undefined') return;
  const currentVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
  if (currentVersion < STORAGE_VERSION) {
    runMigrations(currentVersion, STORAGE_VERSION);
    localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
  }
}

/** V3 → V4: 足迹 adcode 加国家前缀（CHN:） */
function migrateV3toV4(): void {
  const data = load<any>('footprints');
  if (!data) return;

  const migrated: Record<string, any> = {};
  for (const [key, fp] of Object.entries(data)) {
    const record = fp as any;
    if (!key.includes(':')) {
      // 旧版裸 adcode，加 CHN: 前缀
      const newKey = `CHN:${key}`;
      migrated[newKey] = {
        ...record,
        id: newKey,
        adcode: newKey,
      };
    } else {
      migrated[key] = record;
    }
  }

  save('footprints', migrated);
  console.log('[Storage] Migration v3 → v4: added country prefix to footprints');
}

/** 版本迁移路由 */
function runMigrations(from: number, to: number): void {
  for (let v = from + 1; v <= to; v++) {
    switch (v) {
      case 1:
        migrateV0toV1();
        break;
      case 2:
        // V2: 清除旧格式数据，使用新的 mock 数据
        remove('footprints');
        remove('photos');
        remove('trips');
        console.log('[Storage] Migration v1 → v2: cleared old data');
        break;
      case 3:
        migrateV3toV4();
        break;
      case 4:
        migrateV3toV4();
        break;
    }
  }
}

/** V0 → V1: 足迹数据格式迁移 */
function migrateV0toV1(): void {
  // 由 loadFootprints() 惰性执行，此处仅做标记
  console.log('[Storage] Migration v0 → v1: footprint format upgrade');
}

/**
 * 获取存储使用量估算（字节）
 */
export function getStorageUsage(): { used: number; limit: number; percent: number } {
  if (typeof window === 'undefined') return { used: 0, limit: 5 * 1024 * 1024, percent: 0 };
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += (localStorage.getItem(key) || '').length * 2; // UTF-16
    }
  }
  const limit = 5 * 1024 * 1024; // 通常 5MB
  return { used: total, limit, percent: Math.round((total / limit) * 100) };
}
