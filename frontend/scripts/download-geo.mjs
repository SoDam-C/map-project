#!/usr/bin/env node

/**
 * 行政区划数据下载脚本
 *
 * 从 GADM 4.1 和 DataV GeoAtlas 下载所有国家的行政区划数据，
 * 标准化后存入 geo-data/current/ 目录。
 *
 * 用法：node scripts/download-geo.mjs [--force] [--concurrency N] [--countries ISO3,ISO3]
 *
 * 选项：
 *   --force        强制重新下载（覆盖已有文件）
 *   --concurrency  并发下载数（默认 5）
 *   --countries    仅下载指定国家（逗号分隔）
 *   --dry-run      仅列出待下载文件，不实际下载
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const GEO_DATA = join(ROOT, 'geo-data');
const COUNTRIES_JSON = join(ROOT, 'public', 'data', 'geo', 'countries.json');

// 解析命令行参数
const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');
const concurrencyIdx = args.indexOf('--concurrency');
const MAX_CONCURRENCY = concurrencyIdx >= 0 ? parseInt(args[concurrencyIdx + 1]) || 3 : 3;
const countriesIdx = args.indexOf('--countries');
const onlyCountries = countriesIdx >= 0 ? args[countriesIdx + 1]?.split(',').map(s => s.trim().toUpperCase()) : null;

// 中国 34 省级 adcode
const CHINA_PROVINCES = [
  '110000','120000','130000','140000','150000','210000','220000','230000',
  '310000','320000','330000','340000','350000','360000','370000','410000',
  '420000','430000','440000','450000','460000','500000','510000','520000',
  '530000','540000','610000','620000','630000','640000','650000','710000',
  '810000','820000',
];

const DATAV_BASE = 'https://geo.datav.aliyun.com/areas_v3/bound';
const GADM_BASE = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json';

// ============ 工具函数 ============

let downloaded = 0;
let failed = 0;
let skipped = 0;
let totalBytes = 0;

function log(msg) {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`[${time}] ${msg}`);
}

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchWithRetry(url, retries = MAX_RETRIES) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 120000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchWithRetry(res.headers.location, retries).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  }).catch(async (err) => {
    if (retries > 0) {
      await sleep(RETRY_DELAY * (MAX_RETRIES - retries + 1));
      return fetchWithRetry(url, retries - 1);
    }
    throw err;
  });
}

// ============ 数据标准化 ============

function normalizeChinaFeature(feature, level) {
  return {
    ...feature,
    properties: {
      ...feature.properties,
      adcode: 'CHN:' + String(feature.properties?.adcode ?? ''),
      name: feature.properties?.name || '',
      level,
    },
  };
}

function normalizeGadmFeature(feature, iso3, level) {
  const props = feature.properties || {};
  const gid = props[`GID_${level}`] || '';
  const name = props[`NAME_${level}`] || props[`NAME_0`] || '';
  return {
    ...feature,
    properties: {
      ...props,
      adcode: `${iso3}:${gid}`,
      name,
      level,
    },
  };
}

// ============ 下载任务定义 ============

function buildDownloadTasks(countries) {
  const tasks = [];

  for (const country of countries) {
    const { iso3, levels } = country;

    if (onlyCountries && !onlyCountries.includes(iso3)) continue;

    if (iso3 === 'CHN') {
      // 中国：level 1 全省级单文件
      tasks.push({
        id: `CHN_1`,
        url: `${DATAV_BASE}/100000_full.json`,
        dest: join(GEO_DATA, 'current', 'CHN', '1.json'),
        normalize: (data) => {
          const fc = JSON.parse(data.toString());
          fc.features = fc.features.map(f => normalizeChinaFeature(f, 1));
          return fc;
        },
      });

      // 中国：level 2 按省拆分
      for (const provCode of CHINA_PROVINCES) {
        tasks.push({
          id: `CHN_2_${provCode}`,
          url: `${DATAV_BASE}/${provCode}_full.json`,
          dest: join(GEO_DATA, 'current', 'CHN', '2', `${provCode}.json`),
          normalize: (data) => {
            const fc = JSON.parse(data.toString());
            fc.features = fc.features.map(f => normalizeChinaFeature(f, 2));
            return fc;
          },
        });
      }
    } else {
      // 国际：GADM level 0-2（跳过 level 0 如果太小）
      for (const lv of levels) {
        if (lv > 2) continue; // 只下载 0-2 级
        tasks.push({
          id: `${iso3}_${lv}`,
          url: `${GADM_BASE}/gadm41_${iso3}_${lv}.json`,
          dest: join(GEO_DATA, 'current', iso3, `${lv}.json`),
          normalize: (data) => {
            const fc = JSON.parse(data.toString());
            fc.features = fc.features.map(f => normalizeGadmFeature(f, iso3, lv));
            return fc;
          },
        });
      }
    }
  }

  return tasks;
}

// ============ 并发下载器 ============

async function runTask(task) {
  // 跳过已存在文件（除非 force）
  if (!force && existsSync(task.dest)) {
    skipped++;
    return;
  }

  if (dryRun) {
    log(`  [DRY] ${task.id} → ${task.dest}`);
    downloaded++;
    return;
  }

  try {
    const data = await fetchWithRetry(task.url);
    const normalized = task.normalize(data);
    ensureDir(task.dest);
    writeFileSync(task.dest, JSON.stringify(normalized));
    totalBytes += data.length;
    downloaded++;
    log(`  [OK] ${task.id} (${formatBytes(data.length)})`);
  } catch (e) {
    failed++;
    log(`  [FAIL] ${task.id}: ${e.message}`);
  }
}

async function runAll(tasks) {
  log(`共 ${tasks.length} 个下载任务（并发 ${MAX_CONCURRENCY}，${force ? '强制重下' : '跳过已有'}）`);

  const executing = new Set();
  for (const task of tasks) {
    if (executing.size >= MAX_CONCURRENCY) {
      await Promise.race(executing);
    }
    const p = runTask(task).then(() => executing.delete(p));
    executing.add(p);
  }
  await Promise.all(executing);
}

// ============ 主函数 ============

async function main() {
  log('读取国家配置...');
  const countries = JSON.parse(readFileSync(COUNTRIES_JSON, 'utf-8'));

  const tasks = buildDownloadTasks(countries);
  log(`待下载: ${tasks.length} 个文件`);

  const startTime = Date.now();
  await runAll(tasks);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // 更新 _meta.json
  if (!dryRun) {
    const metaPath = join(GEO_DATA, 'current', '_meta.json');
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    meta.updatedAt = new Date().toISOString();
    meta.countries = onlyCountries ? onlyCountries.length : countries.length;
    meta.totalFiles = downloaded + skipped;
    // 计算总大小
    let totalSize = 0;
    const { readdirSync, statSync } = await import('fs');
    function walkDir(dir) {
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) walkDir(full);
          else if (entry.name.endsWith('.json') && entry.name !== '_meta.json') {
            totalSize += statSync(full).size;
          }
        }
      } catch {}
    }
    walkDir(join(GEO_DATA, 'current'));
    meta.totalSize = totalSize;
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  log('========== 下载完成 ==========');
  log(`  下载: ${downloaded}  跳过: ${skipped}  失败: ${failed}`);
  log(`  数据量: ${formatBytes(totalBytes)}`);
  log(`  耗时: ${elapsed}s`);
}

main().catch(e => {
  console.error('下载脚本出错:', e);
  process.exit(1);
});
