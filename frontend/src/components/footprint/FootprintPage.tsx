'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Map as MapLibreMap, FilterSpecification } from 'maplibre-gl';
import type { AdminLevel } from '@/lib/adminRegions';
import { MUNICIPALITIES } from '@/lib/adminRegions';
import { getCountry, parseRegionCode } from '@/lib/regionCode';
import { COUNTRY_REGISTRY, ensureCountryConfig, loadCountryConfigsFromApi } from '@/lib/countries';
import { detectCountryFromCoords, getCountryItem } from '@/lib/countryList';
import { initStorage } from '@/lib/storage';
import { useFootprints } from '@/hooks/useFootprints';
import { useRegionData, fitToLitFeatures, fitToAllFeatures } from '@/hooks/useRegionData';
import { usePhotos } from '@/hooks/usePhotos';
import { useTrips } from '@/hooks/useTrips';
import { useTracks } from '@/hooks/useTracks';
import { FootprintMap } from './FootprintMap';
import { DynamicPanel, type PanelTab } from './DynamicPanel';
import { PhotoMarkerLayer } from './PhotoMarker';
import { PhotoUploader } from './PhotoUploader';
import { PhotoTimeline } from './PhotoTimeline';
import { TripRouteLayer } from './TripRouteLayer';
import { TripEditor } from './TripEditor';
import { TripTimeline } from './TripTimeline';
import { TrackPanel } from './TrackPanel';
import { FootprintStatsPanel } from './FootprintStats';
import { ExplorerLevelBadge } from './ExplorerLevelBadge';
import { CelebrationOverlay, useNewlyLitAdcodes, checkMilestone } from './CelebrationOverlay';
import { AchievementsPanel } from './Achievements';
import { SharePoster } from './SharePoster';
import { SharePanel } from './SharePanel';
import { FogOverlay } from './FogOverlay';
import { GpsPointFog } from './GpsPointFog';
import { WishlistPanel } from './WishlistPanel';
import { useGpsPoints } from '@/hooks/useGpsPoints';
import type { AchievementStats } from '@/lib/achievements';

export function FootprintPage() {
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('stats');
  const [panelVisible, setPanelVisible] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [forcedLevel, setForcedLevel] = useState<AdminLevel | null>(null);
  const [currentLevel, setCurrentLevel] = useState<AdminLevel>(1);
  const [activeCountry, setActiveCountry] = useState('CHN');
  const [viewMode, setViewMode] = useState<'statistics' | 'tracks'>('statistics');

  const countryConfig = COUNTRY_REGISTRY[activeCountry] || ensureCountryConfig(activeCountry);

  const { footprints, lightUp, getStats, getCountryStats, getCountryLitAdcodes, resetFootprints, getOverallPercentage } = useFootprints();
  const { photos, importPhoto, importStatus, deletePhoto, getPhotosByDate } = usePhotos();
  const { autoLightAllUnprocessed, tracks } = useTracks();
  const { data: gpsData, loading: gpsLoading } = useGpsPoints(tracks);

  // 初始化存储
  useEffect(() => {
    initStorage();
  }, []);

  // 启动时从 API 预加载所有国家配置
  useEffect(() => {
    loadCountryConfigsFromApi();
  }, []);

  // 页面加载后自动处理未点亮的轨迹
  const autoLightDone = useRef(false);
  useEffect(() => {
    if (autoLightDone.current) return;
    autoLightDone.current = true;
    const timer = setTimeout(() => {
      autoLightAllUnprocessed(lightUp);
    }, 2000);
    return () => clearTimeout(timer);
  }, [autoLightAllUnprocessed, lightUp]);

  // Celebration animation
  const newlyLit = useNewlyLitAdcodes(footprints);
  const [celebration, setCelebration] = useState<{ active: boolean; type: 'confetti' | 'milestone'; message: string }>({ active: false, type: 'confetti', message: '' });
  const prevProvinceCount = useRef(0);
  useEffect(() => {
    if (newlyLit.size === 0) return;
    const provinceCount = Object.keys(footprints).filter(a => a.endsWith('0000')).length;
    const milestone = checkMilestone(newlyLit, provinceCount);
    if (milestone) {
      setCelebration({ active: true, type: 'milestone', message: `🎉 恭喜! 已点亮 ${milestone.count} 个省份!` });
    } else if ([...newlyLit].some(a => a.endsWith('0000'))) {
      const newProvince = [...newlyLit].find(a => a.endsWith('0000'));
      setCelebration({ active: true, type: 'confetti', message: `点亮新省份!` });
    }
    prevProvinceCount.current = provinceCount;
  }, [newlyLit, footprints]);
  const { trips, createTrip, updateTrip, addWaypoint, deleteTrip, getTripsList, getTripDistance } = useTrips();

  const footprintStats = getStats();
  const countryStats = getCountryStats(activeCountry);

  const achievementStats: AchievementStats = useMemo(() => ({
    footprintStats,
    activeCountry,
    totalTrips: getTripsList().length,
    totalPhotos: Object.keys(photos).length,
    totalDistance: getTripsList().reduce((sum, t) => sum + getTripDistance(t), 0),
  }), [footprintStats, activeCountry, getTripsList, photos, getTripDistance]);

  const { switchToLevel } = useRegionData({ map: mapInstance, countryConfig });
  const footprintsRef = useRef(footprints);
  footprintsRef.current = footprints;

  // 当前国家的足迹
  const countryFootprints = useMemo(() => {
    const result: Record<string, import('@/lib/types').FootprintRecord> = {};
    for (const [key, fp] of Object.entries(footprints)) {
      if (getCountry(key) === activeCountry) {
        result[key] = fp;
      }
    }
    return result;
  }, [footprints, activeCountry]);

  // Level-aware filter
  useEffect(() => {
    const m = mapInstance;
    if (!m) return;
    try {
      if (currentLevel === 0) {
        const hasAny = Object.keys(countryFootprints).length > 0;
        const litAll: FilterSpecification = hasAny ? ['boolean', true] : ['boolean', false];
        const unlitAll: FilterSpecification = hasAny ? ['boolean', false] : ['boolean', true];
        if (m.getLayer('fp-lit-fill')) m.setFilter('fp-lit-fill', litAll);
        if (m.getLayer('fp-lit-line')) m.setFilter('fp-lit-line', litAll);
        if (m.getLayer('fp-unlit-fill')) m.setFilter('fp-unlit-fill', unlitAll);
        if (m.getLayer('fp-unlit-line')) m.setFilter('fp-unlit-line', unlitAll);
        // level 0 不显示标签
        if (m.getLayer('fp-label')) m.setFilter('fp-label', ['literal', false]);
      } else {
        const litArray = Object.entries(countryFootprints)
          .filter(([adcode, fp]) => {
            if (fp.level === currentLevel) return true;
            // 中国直辖市特殊处理
            if (activeCountry === 'CHN' && currentLevel === 2 && fp.level === 3) {
              const localId = parseRegionCode(adcode).localId;
              if (MUNICIPALITIES.has(localId.slice(0, 2) + '0000')) return true;
            }
            return false;
          })
          .map(([adcode]) => adcode);
        if (m.getLayer('fp-lit-fill')) {
          m.setFilter('fp-lit-fill', ['in', ['get', 'adcode'], ['literal', litArray]]);
        }
        if (m.getLayer('fp-lit-line')) {
          m.setFilter('fp-lit-line', ['in', ['get', 'adcode'], ['literal', litArray]]);
        }
        if (m.getLayer('fp-unlit-fill')) {
          m.setFilter('fp-unlit-fill', ['!', ['in', ['get', 'adcode'], ['literal', litArray]]]);
        }
        if (m.getLayer('fp-unlit-line')) {
          m.setFilter('fp-unlit-line', ['!', ['in', ['get', 'adcode'], ['literal', litArray]]]);
        }
        // 标签：只显示当前级别的主国家区域（排除邻国）
        if (m.getLayer('fp-label')) {
          const labelFilter: FilterSpecification = [
            'all',
            ['!=', ['get', '_neighbor'], true],
            ['!', ['in', ['get', 'adcode'], ['literal', litArray]]],
          ];
          m.setFilter('fp-label', labelFilter);
        }
      }
    } catch { /* ignore */ }
  }, [mapInstance, countryFootprints, currentLevel, activeCountry]);

  // Toggle footprint layers visibility based on viewMode
  useEffect(() => {
    const m = mapInstance;
    if (!m) return;
    const footprintLayers = ['fp-unlit-fill', 'fp-unlit-line', 'fp-lit-fill', 'fp-lit-line', 'fp-hover-line', 'fp-label'];
    const visibility = viewMode === 'statistics' ? 'visible' : 'none';
    for (const layerId of footprintLayers) {
      try {
        if (m.getLayer(layerId)) {
          m.setLayoutProperty(layerId, 'visibility', visibility);
        }
      } catch { /* ignore */ }
    }
  }, [mapInstance, viewMode]);

  const getLitAdcodesForLevel = useCallback((level: AdminLevel): Set<string> => {
    return new Set(Object.entries(countryFootprints)
      .filter(([adcode, fp]) => {
        if (fp.level === level) return true;
        if (level === 3 && fp.level === 2) return true;
        if (level === 4 && fp.level === 3) return true;
        if (activeCountry === 'CHN' && level === 2 && fp.level === 3) {
          const localId = parseRegionCode(adcode).localId;
          if (MUNICIPALITIES.has(localId.slice(0, 2) + '0000')) return true;
        }
        return false;
      })
      .map(([adcode]) => adcode));
  }, [countryFootprints, activeCountry]);

  // Handle forced level changes
  useEffect(() => {
    if (forcedLevel !== null) {
      switchToLevel(forcedLevel, getLitAdcodesForLevel(forcedLevel));
      setForcedLevel(null);
    }
  }, [forcedLevel, switchToLevel, getLitAdcodesForLevel]);

  // Hover
  useEffect(() => {
    const m = mapInstance;
    if (!m) return;
    const clearHover = () => {
      try { m.setFilter('fp-hover-line', ['literal', false]); } catch {}
      m.getCanvas().style.cursor = '';
    };
    const onMove = (e: any) => {
      const features = m.queryRenderedFeatures(e.point, {
        layers: ['fp-lit-fill', 'fp-unlit-fill'],
      });
      if (features.length > 0) {
        const adcode = String(features[0].properties?.adcode ?? '');
        try {
          m.setFilter('fp-hover-line', ['==', ['get', 'adcode'], ['literal', adcode]]);
        } catch {}
        m.getCanvas().style.cursor = '';
      } else {
        clearHover();
      }
    };
    m.on('mousemove', onMove);
    m.on('mouseout', clearHover);
    return () => { m.off('mousemove', onMove); m.off('mouseout', clearHover); };
  }, [mapInstance]);

  const handleMapReady = useCallback((map: MapLibreMap) => {
    setMapInstance(map);
    if (map.getSource('footprints-regions')) return;

    map.addSource('footprints-regions', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id: 'fp-unlit-fill', type: 'fill', source: 'footprints-regions',
      paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.03 },
    });
    map.addLayer({
      id: 'fp-unlit-line', type: 'line', source: 'footprints-regions',
      paint: { 'line-color': '#ffffff', 'line-opacity': 0.06, 'line-width': 0.5 },
    });
    map.addLayer({
      id: 'fp-lit-fill', type: 'fill', source: 'footprints-regions',
      paint: { 'fill-color': '#6366f1', 'fill-opacity': 0.5 },
    });
    map.addLayer({
      id: 'fp-lit-line', type: 'line', source: 'footprints-regions',
      paint: { 'line-color': '#818cf8', 'line-width': 1.5 },
    });
    map.addLayer({
      id: 'fp-hover-line', type: 'line', source: 'footprints-regions',
      paint: { 'line-color': '#ffffff', 'line-width': 2.5, 'line-opacity': 0.9 },
      filter: ['literal', false],
    });
    map.addLayer({
      id: 'fp-label', type: 'symbol', source: 'footprints-regions',
      filter: ['!=', ['get', '_neighbor'], true],
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ''],
        'text-font': ['Open Sans Regular'],
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          3, 10,
          5, 11,
          8, 12,
        ],
        'text-max-width': 8,
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.8)',
        'text-halo-width': 1.5,
      },
    });

    // Load initial province-level data for China via API route
    fetch('/api/geo/CHN/1.json')
      .then(r => r.json())
      .then(data => {
        (map.getSource('footprints-regions') as any)?.setData(data);
        const litAdcodes = getCountryLitAdcodes('CHN');
        if (!fitToLitFeatures(map, data.features, litAdcodes)) {
          fitToAllFeatures(map, data.features);
        }
      })
      .catch(e => console.error('[FootprintPage] Failed to load provinces:', e));
  }, [getCountryLitAdcodes]);

  const handleLevelChange = useCallback((level: AdminLevel) => {
    setCurrentLevel(level);
    setForcedLevel(level);
  }, []);

  // 点击地图时根据鼠标位置检测国家（同步，只设状态）
  const activeCountryRef = useRef(activeCountry);
  activeCountryRef.current = activeCountry;
  useEffect(() => {
    const m = mapInstance;
    if (!m) return;
    const onClick = (e: any) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      const detected = detectCountryFromCoords(lng, lat);
      if (detected && detected !== activeCountryRef.current) {
        setActiveCountry(detected);
      }
    };
    m.on('click', onClick);
    return () => { m.off('click', onClick); };
  }, [mapInstance]);

  // 国家变化后：立即注册配置 → 触发数据加载 → 后台获取完整配置
  useEffect(() => {
    const iso3 = activeCountry;

    // 立即确保配置存在（用 getCountryItem 的名称创建 fallback）
    const item = getCountryItem(iso3);
    const config = ensureCountryConfig(iso3, item?.nameZh, item?.flag);

    // 设置初始级别
    const firstLevel = config.levels.length > 1 ? config.levels[1] : config.levels[0];
    setCurrentLevel(firstLevel);
    setForcedLevel(firstLevel);
  }, [activeCountry]);

  const handleImportPhoto = async (file: File) => {
    return await importPhoto(file);
  };

  const handlePhotoClick = (photo: import('@/lib/types').PhotoRecord) => {
    mapInstance?.flyTo({ center: [photo.lng, photo.lat], zoom: 14, duration: 1000 });
  };

  const handleTripClick = (trip: import('@/lib/types').TripRecord) => {
    if (!mapInstance || trip.waypoints.length === 0) return;
    const first = trip.waypoints[0];
    mapInstance.flyTo({ center: [first.lng, first.lat], zoom: 8, duration: 1000 });
  };

  const photosByDate = getPhotosByDate();
  const tripsList = getTripsList();
  const isDark = true;
  const accentColor = '#6366f1';

  return (
    <main className="relative h-full w-full">
      <CelebrationOverlay
        active={celebration.active}
        type={celebration.type}
        message={celebration.message}
        onComplete={() => setCelebration(prev => ({ ...prev, active: false }))}
      />
      <FootprintMap
        onMapReady={handleMapReady}
        isDark={isDark}
        accentColor={accentColor}
      />

      {/* 当前国家 + 视图/级别切换栏 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-black/50 backdrop-blur-xl rounded-lg p-1 border border-white/10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white">
          <span>{countryConfig.flag}</span>
          <span className="font-medium">{countryConfig.name}</span>
        </div>
        <div className="w-px bg-white/10" />
        <button
          onClick={() => setViewMode('statistics')}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            viewMode === 'statistics'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          统计
        </button>
        <button
          onClick={() => setViewMode('tracks')}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            viewMode === 'tracks'
              ? 'bg-amber-500 text-white'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          轨迹
        </button>
        {viewMode === 'statistics' && (
          <>
            <div className="w-px bg-white/10" />
            {countryConfig.levels.map(lv => (
              <button
                key={lv}
                onClick={() => handleLevelChange(lv)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  currentLevel === lv
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {countryConfig.levelNames[lv] || `L${lv}`}
              </button>
            ))}
          </>
        )}
      </div>

      {/* 图层和面板 */}
      <PhotoMarkerLayer
        map={mapInstance}
        photos={photos}
        visible={activeTab === 'photos'}
        onPhotoClick={handlePhotoClick}
      />

      <TripRouteLayer
        map={mapInstance}
        trips={trips}
        visible={activeTab === 'trips'}
        accentColor={accentColor}
      />

      <DynamicPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        visible={panelVisible}
        onToggle={() => setPanelVisible(prev => !prev)}
        isDark={isDark}
        accentColor={accentColor}
      >
        {activeTab === 'stats' && (
          <div className="p-4 space-y-3">
            <ExplorerLevelBadge overallPercent={getOverallPercentage()} />
          </div>
        )}

        {activeTab === 'stats' && (
          <FootprintStatsPanel
            stats={countryStats}
            achievementStats={achievementStats}
            onReset={resetFootprints}
            onOpenShare={() => { setActiveTab('share'); if (!panelVisible) setPanelVisible(true); }}
            currentLevel={currentLevel}
            onLevelChange={handleLevelChange}
            countryConfig={countryConfig}
            isDark={isDark}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsPanel stats={achievementStats} isDark={isDark} />
        )}

        {activeTab === 'wishlist' && (
          <WishlistPanel isDark={isDark} litAdcodes={getCountryLitAdcodes(activeCountry)} />
        )}

        {activeTab === 'photos' && (
          <div className="p-4 space-y-3">
            <PhotoUploader onImport={handleImportPhoto} importStatus={importStatus} isDark={isDark} />
            <PhotoTimeline
              photosByDate={photosByDate}
              onDeletePhoto={deletePhoto}
              onPhotoClick={handlePhotoClick}
              isDark={isDark}
            />
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="p-4 space-y-3">
            <TripEditor
              onCreateTrip={createTrip}
              onUpdateTrip={updateTrip}
              onAddWaypoint={addWaypoint}
              isDark={isDark}
            />
            <TripTimeline
              trips={tripsList}
              distanceGetter={getTripDistance}
              onDeleteTrip={deleteTrip}
              onTripClick={handleTripClick}
              isDark={isDark}
            />
          </div>
        )}

        {activeTab === 'tracks' && (
          <div className="p-4">
            <TrackPanel
              map={mapInstance}
              isDark={isDark}
              accentColor={accentColor}
            />
          </div>
        )}

        {activeTab === 'share' && (
          <div className="p-4">
            <SharePoster stats={countryStats} countryConfig={countryConfig} isDark={isDark} />
          </div>
        )}
      </DynamicPanel>

      {/* 迷雾模式按钮 */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
        {viewMode === 'statistics' && (
          <FogOverlay
            map={mapInstance}
            footprints={countryFootprints}
            activeCountry={activeCountry}
            currentLevel={currentLevel}
            isDark={isDark}
          />
        )}
        {viewMode === 'tracks' && (
          <GpsPointFog
            map={mapInstance}
            gpsData={gpsData}
            loading={gpsLoading}
            isDark={isDark}
          />
        )}
      </div>

      {shareOpen && (
        <SharePanel stats={countryStats} countryConfig={countryConfig} isDark={isDark} onClose={() => setShareOpen(false)} />
      )}
    </main>
  );
}
