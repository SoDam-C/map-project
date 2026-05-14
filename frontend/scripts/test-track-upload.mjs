/**
 * 测试脚本：验证 GPS 轨迹全流程
 *
 * 1. 生成模拟 GPS 点（北京 → 上海 路线）
 * 2. POST /api/tracks/batch — 上传轨迹
 * 3. GET /api/tracks/batch — 列出轨迹
 * 4. GET /api/tracks/{id} — 获取单条轨迹
 * 5. GET /api/tracks/{id}/points — 分页获取 GPS 点
 * 6. POST /api/tracks/{id}/footprints — 自动点亮
 * 7. DELETE /api/tracks/{id} — 删除轨迹
 *
 * 用法：node scripts/test-track-upload.mjs [BASE_URL]
 * 默认 BASE_URL = http://localhost:3000
 */

import { randomUUID } from 'crypto';

const BASE_URL = process.argv[2] || 'http://localhost:3000';

/** 生成北京 → 上海 模拟轨迹（约 1200km，200 个点） */
function generateMockTrack() {
  const startLat = 39.9042, startLng = 116.4074;  // 北京
  const endLat = 31.2304, endLng = 121.4737;       // 上海
  const numPoints = 200;
  const startTime = Date.now() - 8 * 3600 * 1000; // 8小时前

  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 加一些随机偏移模拟真实 GPS
    const lat = startLat + (endLat - startLat) * t + (Math.random() - 0.5) * 0.02;
    const lng = startLng + (endLng - startLng) * t + (Math.random() - 0.5) * 0.02;
    points.push({
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      accuracy: Math.round(5 + Math.random() * 20),
      speed: Math.round((20 + Math.random() * 80) * 10) / 10, // m/s
      bearing: Math.round(180 + (Math.random() - 0.5) * 30),
      timestamp: startTime + Math.round(t * 8 * 3600 * 1000) + Math.round(Math.random() * 30000),
    });
  }

  // 计算 bounds
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const p of points) {
    if (p.lng < minLng) minLng = p.lng;
    if (p.lat < minLat) minLat = p.lat;
    if (p.lng > maxLng) maxLng = p.lng;
    if (p.lat > maxLat) maxLat = p.lat;
  }

  // 计算距离（简化 Haversine）
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversine(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng);
    distance += d;
  }

  const trackId = randomUUID();
  const now = new Date().toISOString();

  const track = {
    id: trackId,
    deviceId: 'test-device-001',
    title: '北京→上海 测试轨迹',
    type: 'continuous',
    startTime: new Date(points[0].timestamp).toISOString(),
    endTime: new Date(points[points.length - 1].timestamp).toISOString(),
    distance: Math.round(distance),
    duration: Math.round((points[points.length - 1].timestamp - points[0].timestamp) / 1000),
    pointCount: points.length,
    bounds: [minLng, minLat, maxLng, maxLat],
    createdAt: now,
    updatedAt: now,
  };

  return { track, points };
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function test() {
  console.log('=== GPS 轨迹全流程测试 ===\n');
  console.log(`服务端: ${BASE_URL}\n`);

  // 生成模拟数据
  console.log('1. 生成模拟轨迹数据...');
  const { track, points } = generateMockTrack();
  console.log(`   轨迹 ID: ${track.id}`);
  console.log(`   GPS 点数: ${points.length}`);
  console.log(`   总距离: ${(track.distance / 1000).toFixed(1)} km`);
  console.log(`   总时长: ${Math.round(track.duration / 60)} 分钟\n`);

  // Step 1: 批量上传
  console.log('2. POST /api/tracks/batch — 上传轨迹...');
  const uploadResp = await fetch(`${BASE_URL}/api/tracks/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tracks: [track],
      points: [{ trackId: track.id, points }],
    }),
  });
  const uploadResult = await uploadResp.json();
  console.log(`   状态: ${uploadResp.status}`);
  console.log(`   结果: ${JSON.stringify(uploadResult)}\n`);

  if (!uploadResp.ok) {
    console.error('上传失败，终止测试');
    process.exit(1);
  }

  // Step 2: 列出轨迹
  console.log('3. GET /api/tracks/batch — 列出轨迹...');
  const listResp = await fetch(`${BASE_URL}/api/tracks/batch`);
  const listResult = await listResp.json();
  console.log(`   状态: ${listResp.status}`);
  console.log(`   轨迹总数: ${listResult.total}`);
  const found = listResult.tracks.find(t => t.id === track.id);
  console.log(`   找到测试轨迹: ${found ? '是' : '否'}\n`);

  // Step 3: 获取单条轨迹
  console.log('4. GET /api/tracks/{id} — 获取轨迹详情...');
  const detailResp = await fetch(`${BASE_URL}/api/tracks/${track.id}`);
  const detail = await detailResp.json();
  console.log(`   状态: ${detailResp.status}`);
  console.log(`   标题: ${detail.title}`);
  console.log(`   点数: ${detail.pointCount}\n`);

  // Step 4: 分页获取 GPS 点
  console.log('5. GET /api/tracks/{id}/points — 分页获取 GPS 点...');
  const pointsResp = await fetch(`${BASE_URL}/api/tracks/${track.id}/points?offset=0&limit=5`);
  const pointsResult = await pointsResp.json();
  console.log(`   状态: ${pointsResp.status}`);
  console.log(`   总点数: ${pointsResult.total}`);
  console.log(`   返回: ${pointsResult.points.length} 个点`);
  console.log(`   首点: [${pointsResult.points[0]?.lat}, ${pointsResult.points[0]?.lng}]`);
  console.log(`   hasMore: ${pointsResult.hasMore}\n`);

  // Step 5: 自动点亮
  console.log('6. POST /api/tracks/{id}/footprints — 自动计算点亮区域...');
  const fpResp = await fetch(`${BASE_URL}/api/tracks/${track.id}/footprints`, {
    method: 'POST',
  });
  const fpResult = await fpResp.json();
  console.log(`   状态: ${fpResp.status}`);
  console.log(`   匹配区域数: ${fpResult.matchedRegions}`);
  console.log(`   采样点数: ${fpResult.matchedPoints}`);
  if (fpResult.footprints?.length > 0) {
    console.log('   匹配到的区域:');
    for (const fp of fpResult.footprints.slice(0, 10)) {
      console.log(`     ${fp.adcode} (${fp.name}) — ${fp.pointCount} 点`);
    }
    if (fpResult.footprints.length > 10) {
      console.log(`     ... 还有 ${fpResult.footprints.length - 10} 个`);
    }
  }
  console.log();

  // Step 6: 删除轨迹
  console.log('7. DELETE /api/tracks/{id} — 删除轨迹...');
  const delResp = await fetch(`${BASE_URL}/api/tracks/${track.id}`, {
    method: 'DELETE',
  });
  const delResult = await delResp.json();
  console.log(`   状态: ${delResp.status}`);
  console.log(`   结果: ${JSON.stringify(delResult)}\n`);

  // 验证删除
  console.log('8. 验证删除...');
  const verifyResp = await fetch(`${BASE_URL}/api/tracks/${track.id}`);
  console.log(`   GET 状态: ${verifyResp.status} (期望 404)`);
  console.log(`   ${verifyResp.status === 404 ? '删除验证通过' : '警告：轨迹可能未被删除'}\n`);

  console.log('=== 测试完成 ===');
}

test().catch(e => {
  console.error('测试失败:', e);
  process.exit(1);
});
