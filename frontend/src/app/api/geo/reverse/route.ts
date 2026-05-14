/**
 * GET /api/geo/reverse?lat=30.5&lng=114.3
 *
 * 逆地理编码：经纬度 → 行政区划 adcode
 * 使用高德 API（免费额度），无 key 时回退到简单中国省份匹配
 */

import { NextRequest, NextResponse } from 'next/server';

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY || process.env.AMAP_KEY || '';

// 中国各省大致中心坐标（简化匹配）
const PROVINCE_CENTERS: Record<string, { name: string; adcode: string; lat: number; lng: number }> = {
  beijing: { name: '北京市', adcode: '110000', lat: 39.9, lng: 116.4 },
  tianjin: { name: '天津市', adcode: '120000', lat: 39.1, lng: 117.2 },
  hebei: { name: '河北省', adcode: '130000', lat: 38.0, lng: 114.5 },
  shanxi: { name: '山西省', adcode: '140000', lat: 37.6, lng: 112.3 },
  inner_mongolia: { name: '内蒙古自治区', adcode: '150000', lat: 42.8, lng: 111.7 },
  liaoning: { name: '辽宁省', adcode: '210000', lat: 41.3, lng: 122.4 },
  jilin: { name: '吉林省', adcode: '220000', lat: 43.5, lng: 126.5 },
  heilongjiang: { name: '黑龙江省', adcode: '230000', lat: 47.3, lng: 128.0 },
  shanghai: { name: '上海市', adcode: '310000', lat: 31.2, lng: 121.5 },
  jiangsu: { name: '江苏省', adcode: '320000', lat: 33.0, lng: 119.5 },
  zhejiang: { name: '浙江省', adcode: '330000', lat: 29.2, lng: 120.2 },
  anhui: { name: '安徽省', adcode: '340000', lat: 31.8, lng: 117.3 },
  fujian: { name: '福建省', adcode: '350000', lat: 26.1, lng: 118.3 },
  jiangxi: { name: '江西省', adcode: '360000', lat: 27.6, lng: 115.9 },
  shandong: { name: '山东省', adcode: '370000', lat: 36.7, lng: 118.5 },
  henan: { name: '河南省', adcode: '410000', lat: 34.8, lng: 113.7 },
  hubei: { name: '湖北省', adcode: '420000', lat: 30.6, lng: 112.3 },
  hunan: { name: '湖南省', adcode: '430000', lat: 27.6, lng: 111.5 },
  guangdong: { name: '广东省', adcode: '440000', lat: 23.1, lng: 113.3 },
  guangxi: { name: '广西壮族自治区', adcode: '450000', lat: 22.8, lng: 108.3 },
  hainan: { name: '海南省', adcode: '460000', lat: 19.2, lng: 109.7 },
  chongqing: { name: '重庆市', adcode: '500000', lat: 29.6, lng: 106.5 },
  sichuan: { name: '四川省', adcode: '510000', lat: 30.7, lng: 102.7 },
  guizhou: { name: '贵州省', adcode: '520000', lat: 26.6, lng: 106.7 },
  yunnan: { name: '云南省', adcode: '530000', lat: 25.0, lng: 101.7 },
  tibet: { name: '西藏自治区', adcode: '540000', lat: 30.7, lng: 89.1 },
  shaanxi: { name: '陕西省', adcode: '610000', lat: 34.3, lng: 108.9 },
  gansu: { name: '甘肃省', adcode: '620000', lat: 36.1, lng: 103.8 },
  qinghai: { name: '青海省', adcode: '630000', lat: 35.6, lng: 96.8 },
  ningxia: { name: '宁夏回族自治区', adcode: '640000', lat: 37.3, lng: 106.2 },
  xinjiang: { name: '新疆维吾尔自治区', adcode: '650000', lat: 41.8, lng: 86.1 },
  taiwan: { name: '台湾省', adcode: '710000', lat: 23.7, lng: 121.0 },
  hongkong: { name: '香港特别行政区', adcode: '810000', lat: 22.3, lng: 114.2 },
  macau: { name: '澳门特别行政区', adcode: '820000', lat: 22.1, lng: 113.5 },
};

function findNearestProvince(lat: number, lng: number): { adcode: string; name: string } {
  let minDist = Infinity;
  let result = { adcode: '000000', name: '未知' };

  for (const prov of Object.values(PROVINCE_CENTERS)) {
    const dist = Math.sqrt((lat - prov.lat) ** 2 + (lng - prov.lng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      result = { adcode: prov.adcode, name: prov.name };
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
    }

    // 优先使用高德 API
    if (AMAP_KEY) {
      try {
        const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lng},${lat}&extensions=base`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const data = await resp.json();

        if (data.status === '1' && data.regeocode) {
          const adcode = data.regeocode.addressComponent?.adcode;
          const province = data.regeocode.addressComponent?.province || '';
          const city = data.regeocode.addressComponent?.city || '';
          const district = data.regeocode.addressComponent?.district || '';
          return NextResponse.json({
            adcode,
            province,
            city,
            district,
            formattedAddress: data.regeocode.formattedAddress,
            source: 'amap',
          });
        }
      } catch (e) {
        console.error('[geo/reverse] AMap API error:', e);
      }
    }

    // 回退：简单省份匹配
    const nearest = findNearestProvince(lat, lng);
    return NextResponse.json({
      adcode: nearest.adcode,
      province: nearest.name,
      source: 'nearest',
    });
  } catch (e) {
    console.error('[geo/reverse] Error:', e);
    return NextResponse.json({ error: 'Reverse geocode failed' }, { status: 500 });
  }
}
