'use client';

import { useState, useEffect, useMemo } from 'react';
import { initStorage, load } from '@/lib/storage';
import type { FootprintStore, FootprintRecord } from '@/lib/types';
import { COUNTRY_REGISTRY } from '@/lib/countries';
import { MapPin, TrendingUp, Target, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProvinceProgress {
  name: string;
  adcode: string;
  lit: number;
  total: number;
  percent: number;
  cities: string[];
}

export function CityProgress() {
  const [footprints, setFootprints] = useState<FootprintStore>({});
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    initStorage();
    setFootprints(load<FootprintStore>('footprints') || {});
    setReady(true);
  }, []);

  // Group footprints by province
  const provinceProgress = useMemo((): ProvinceProgress[] => {
    const config = COUNTRY_REGISTRY['CHN'];
    if (!config) return [];

    const totalCities = config.levelTotals[2] || 0;
    const provinceMap: Record<string, ProvinceProgress> = {};

    // Initialize provinces from footprints
    for (const [adcode, fp] of Object.entries(footprints)) {
      if (!adcode.startsWith('CHN:')) continue;
      const localCode = adcode.replace('CHN:', '');

      // Extract province code (first 2 digits + 0000)
      const provinceCode = localCode.slice(0, 2) + '0000';
      const provinceAdcode = `CHN:${provinceCode}`;

      if (fp.level === 2) {
        // City-level footprint
        if (!provinceMap[provinceCode]) {
          provinceMap[provinceCode] = {
            name: fp.name,
            adcode: provinceAdcode,
            lit: 0,
            total: totalCities,
            percent: 0,
            cities: [],
          };
        }
        provinceMap[provinceCode].lit++;
        provinceMap[provinceCode].cities.push(fp.name);
      }
    }

    // Also count from level 3 footprints (district level → belongs to city)
    for (const [adcode, fp] of Object.entries(footprints)) {
      if (!adcode.startsWith('CHN:') || fp.level !== 3) continue;
      const localCode = adcode.replace('CHN:', '');
      const cityCode = localCode.slice(0, 4) + '00';
      const provinceCode = localCode.slice(0, 2) + '0000';
      const cityAdcode = `CHN:${cityCode}`;

      if (!provinceMap[provinceCode]) {
        provinceMap[provinceCode] = {
          name: provinceCode,
          adcode: `CHN:${provinceCode}`,
          lit: 0,
          total: totalCities,
          percent: 0,
          cities: [],
        };
      }

      // Only count unique cities
      if (!provinceMap[provinceCode].cities.includes(cityAdcode)) {
        provinceMap[provinceCode].cities.push(cityAdcode);
      }
    }

    // Recalculate lit count from unique cities
    for (const prov of Object.values(provinceMap)) {
      // Deduplicate cities
      const uniqueCities = new Set(prov.cities);
      prov.lit = uniqueCities.size;
      prov.percent = prov.total > 0 ? Math.round((prov.lit / prov.total) * 100) : 0;
    }

    return Object.values(provinceMap)
      .sort((a, b) => b.percent - a.percent || b.lit - a.lit);
  }, [footprints]);

  // Overall stats
  const totalLit = provinceProgress.reduce((s, p) => s + p.lit, 0);
  const totalCities = provinceProgress.length > 0 ? provinceProgress[0].total : 0;
  const overallPercent = totalCities > 0 ? Math.round((totalLit / totalCities) * 100) : 0;
  const completedProvinces = provinceProgress.filter(p => p.percent === 100).length;

  // Get color by percent
  const getBarColor = (percent: number) => {
    if (percent >= 80) return 'bg-emerald-500';
    if (percent >= 50) return 'bg-blue-500';
    if (percent >= 20) return 'bg-amber-500';
    return 'bg-red-400';
  };

  const getBarGradient = (percent: number) => {
    if (percent >= 80) return 'linear-gradient(90deg, #10b981, #34d399)';
    if (percent >= 50) return 'linear-gradient(90deg, #3b82f6, #60a5fa)';
    if (percent >= 20) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold">城市点亮进度</h1>
        </div>

        {/* 总览卡片 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-bold">{totalLit}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">已点亮城市</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-bold">{overallPercent}%</div>
            <div className="text-xs text-[var(--color-text-secondary)]">全国进度</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-bold">{completedProvinces}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">省全覆盖</div>
          </div>
        </div>

        {/* 全国总进度条 */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Target size={16} className="text-indigo-400" />
              全国城市点亮
            </span>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {totalLit} / {totalCities}
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${overallPercent}%`,
                background: getBarGradient(overallPercent),
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--color-text-secondary)]">
            <span>{provinceProgress.length} 个省份有足迹</span>
            <span>34 省级行政区</span>
          </div>
        </div>

        {/* 省份排行 */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            省份点亮排行
          </h3>

          {provinceProgress.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
              暂无足迹数据，去点亮你的第一个城市吧
            </p>
          ) : (
            <div className="space-y-2">
              {provinceProgress.map((prov, index) => (
                <div key={prov.adcode}>
                  <button
                    onClick={() => setExpanded(expanded === prov.adcode ? null : prov.adcode)}
                    className="w-full flex items-center gap-3 py-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {/* 排名 */}
                    <span className={`w-6 text-center text-sm font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-amber-600' :
                      'text-[var(--color-text-secondary)]'
                    }`}>
                      {index + 1}
                    </span>

                    {/* 省名 */}
                    <span className="w-16 text-sm truncate text-left">{prov.name}</span>

                    {/* 进度条 */}
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(prov.percent)}`}
                        style={{ width: `${prov.percent}%` }}
                      />
                    </div>

                    {/* 百分比 */}
                    <span className={`text-xs w-12 text-right ${
                      prov.percent >= 80 ? 'text-emerald-400' :
                      prov.percent >= 50 ? 'text-blue-400' :
                      prov.percent >= 20 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {prov.percent}%
                    </span>

                    {/* 展开箭头 */}
                    <ChevronRight size={14} className={`text-[var(--color-text-secondary)] transition-transform ${expanded === prov.adcode ? 'rotate-90' : ''}`} />
                  </button>

                  {/* 展开详情 */}
                  {expanded === prov.adcode && (
                    <div className="ml-9 mr-4 mb-2 p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                        已点亮 {prov.lit} / {prov.total} 个城市
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {prov.cities.map((city, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px]"
                          >
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提示 */}
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-center">
          <Award size={20} className="mx-auto mb-2 text-indigo-400" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            前往 <Link href="/footprint" className="text-indigo-400 hover:text-indigo-300">足迹地图</Link> 点亮更多城市
          </p>
        </div>
      </div>
    </div>
  );
}
