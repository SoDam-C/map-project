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
import { useTracks } from '@/hooks/useTracks';
import { FogOverlay } from '@/components/footprint/FogOverlay';
import { CelebrationOverlay, useNewlyLitAdcodes, checkMilestone } from '@/components/footprint/CelebrationOverlay';
import type { AchievementStats } from '@/lib/achievements';

/**
 * useFootprintLayer — manages all footprint map layer logic.
 * Returns state + handlers. The consuming component renders the map layers.
 */
export function useFootprintLayer(map: MapLibreMap | null, visible: boolean) {
  const [activeCountry, setActiveCountry] = useState('CHN');
  const [currentLevel, setCurrentLevel] = useState<AdminLevel>(1);
  const [forcedLevel, setForcedLevel] = useState<AdminLevel | null>(null);
  const [celebration, setCelebration] = useState<{ active: boolean; type: 'confetti' | 'milestone'; message: string }>({
    active: false, type: 'confetti', message: '',
  });

  const countryConfig = COUNTRY_REGISTRY[activeCountry] || ensureCountryConfig(activeCountry);
  const { footprints, lightUp, getStats, getCountryStats, getCountryLitAdcodes, resetFootprints, getOverallPercentage } = useFootprints();
  const { autoLightAllUnprocessed } = useTracks();

  const footprintStats = getStats();
  const countryStats = getCountryStats(activeCountry);

  useEffect(() => { initStorage(); }, []);
  useEffect(() => { loadCountryConfigsFromApi(); }, []);

  const autoLightDone = useRef(false);
  useEffect(() => {
    if (autoLightDone.current) return;
    autoLightDone.current = true;
    const timer = setTimeout(() => { autoLightAllUnprocessed(lightUp); }, 2000);
    return () => clearTimeout(timer);
  }, [autoLightAllUnprocessed, lightUp]);

  // Celebration
  const newlyLit = useNewlyLitAdcodes(footprints);
  useEffect(() => {
    if (newlyLit.size === 0) return;
    const provinceCount = Object.keys(footprints).filter(a => a.endsWith('0000')).length;
    const milestone = checkMilestone(newlyLit, provinceCount);
    if (milestone) {
      setCelebration({ active: true, type: 'milestone', message: `🎉 恭喜! 已点亮 ${milestone.count} 个省份!` });
    } else if ([...newlyLit].some(a => a.endsWith('0000'))) {
      setCelebration({ active: true, type: 'confetti', message: '点亮新省份!' });
    }
  }, [newlyLit, footprints]);

  const countryFootprints = useMemo(() => {
    const result: Record<string, import('@/lib/types').FootprintRecord> = {};
    for (const [key, fp] of Object.entries(footprints)) {
      if (getCountry(key) === activeCountry) result[key] = fp;
    }
    return result;
  }, [footprints, activeCountry]);

  // Level-aware filter
  useEffect(() => {
    const m = map;
    if (!m || !visible) return;
    try {
      if (currentLevel === 0) {
        const hasAny = Object.keys(countryFootprints).length > 0;
        if (m.getLayer('fp-lit-fill')) m.setFilter('fp-lit-fill', ['boolean', hasAny]);
        if (m.getLayer('fp-lit-line')) m.setFilter('fp-lit-line', ['boolean', hasAny]);
        if (m.getLayer('fp-unlit-fill')) m.setFilter('fp-unlit-fill', ['boolean', !hasAny]);
        if (m.getLayer('fp-unlit-line')) m.setFilter('fp-unlit-line', ['boolean', !hasAny]);
        if (m.getLayer('fp-label')) m.setFilter('fp-label', ['literal', false]);
      } else {
        const litArray = Object.entries(countryFootprints)
          .filter(([, fp]) => {
            if (fp.level === currentLevel) return true;
            if (activeCountry === 'CHN' && currentLevel === 2 && fp.level === 3) {
              const localId = parseRegionCode(fp as any).localId ?? '';
              if (MUNICIPALITIES.has(localId.slice(0, 2) + '0000')) return true;
            }
            return false;
          })
          .map(([adcode]) => adcode);
        if (m.getLayer('fp-lit-fill'))
          m.setFilter('fp-lit-fill', ['in', ['get', 'adcode'], ['literal', litArray]]);
        if (m.getLayer('fp-lit-line'))
          m.setFilter('fp-lit-line', ['in', ['get', 'adcode'], ['literal', litArray]]);
        if (m.getLayer('fp-unlit-fill'))
          m.setFilter('fp-unlit-fill', ['!', ['in', ['get', 'adcode'], ['literal', litArray]]]);
        if (m.getLayer('fp-unlit-line'))
          m.setFilter('fp-unlit-line', ['!', ['in', ['get', 'adcode'], ['literal', litArray]]]);
        if (m.getLayer('fp-label')) {
          m.setFilter('fp-label', ['all', ['!=', ['get', '_neighbor'], true], ['!', ['in', ['get', 'adcode'], ['literal', litArray]]]]);
        }
      }
    } catch {}
  }, [map, visible, countryFootprints, currentLevel, activeCountry]);

  // Toggle layer visibility
  useEffect(() => {
    const m = map;
    if (!m) return;
    const layers = ['fp-unlit-fill', 'fp-unlit-line', 'fp-lit-fill', 'fp-lit-line', 'fp-hover-line', 'fp-label'];
    const vis = visible ? 'visible' : 'none';
    for (const id of layers) {
      try { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis); } catch {}
    }
  }, [map, visible]);

  const getLitAdcodesForLevel = useCallback((level: AdminLevel): Set<string> => {
    return new Set(Object.entries(countryFootprints)
      .filter(([, fp]) => {
        if (fp.level === level) return true;
        if (level === 3 && fp.level === 2) return true;
        if (level === 4 && fp.level === 3) return true;
        if (activeCountry === 'CHN' && level === 2 && fp.level === 3) {
          const adcode = Object.keys(countryFootprints).find(k => countryFootprints[k] === fp) ?? '';
          const localId = parseRegionCode(adcode).localId;
          if (MUNICIPALITIES.has(localId.slice(0, 2) + '0000')) return true;
        }
        return false;
      })
      .map(([adcode]) => adcode));
  }, [countryFootprints, activeCountry]);

  const { switchToLevel } = useRegionData({ map, countryConfig });

  useEffect(() => {
    if (forcedLevel !== null) {
      switchToLevel(forcedLevel, getLitAdcodesForLevel(forcedLevel));
      setForcedLevel(null);
    }
  }, [forcedLevel, switchToLevel, getLitAdcodesForLevel]);

  // Hover
  useEffect(() => {
    const m = map;
    if (!m || !visible) return;
    const clearHover = () => {
      try { m.setFilter('fp-hover-line', ['literal', false]); } catch {}
      m.getCanvas().style.cursor = '';
    };
    const onMove = (e: any) => {
      const features = m.queryRenderedFeatures(e.point, { layers: ['fp-lit-fill', 'fp-unlit-fill'] });
      if (features.length > 0) {
        try { m.setFilter('fp-hover-line', ['==', ['get', 'adcode'], ['literal', String(features[0].properties?.adcode ?? '')]]); } catch {}
      } else { clearHover(); }
    };
    m.on('mousemove', onMove);
    m.on('mouseout', clearHover);
    return () => { m.off('mousemove', onMove); m.off('mouseout', clearHover); };
  }, [map, visible]);

  // Click to detect country
  const activeCountryRef = useRef(activeCountry);
  activeCountryRef.current = activeCountry;
  useEffect(() => {
    const m = map;
    if (!m || !visible) return;
    const onClick = (e: any) => {
      const detected = detectCountryFromCoords(e.lngLat.lng, e.lngLat.lat);
      if (detected && detected !== activeCountryRef.current) setActiveCountry(detected);
    };
    m.on('click', onClick);
    return () => { m.off('click', onClick); };
  }, [map, visible]);

  // Country change
  useEffect(() => {
    const item = getCountryItem(activeCountry);
    ensureCountryConfig(activeCountry, item?.nameZh, item?.flag);
    const config = COUNTRY_REGISTRY[activeCountry];
    const firstLevel = config?.levels?.length > 1 ? config.levels[1] : (config?.levels?.[0] ?? 1);
    setCurrentLevel(firstLevel);
    setForcedLevel(firstLevel);
  }, [activeCountry]);

  // Initialize map source + layers (once)
  const initDone = useRef(false);
  useEffect(() => {
    const m = map;
    if (!m || !visible || initDone.current) return;
    if (m.getSource('footprints-regions')) { initDone.current = true; return; }

    m.addSource('footprints-regions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    m.addLayer({ id: 'fp-unlit-fill', type: 'fill', source: 'footprints-regions', paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.03 } });
    m.addLayer({ id: 'fp-unlit-line', type: 'line', source: 'footprints-regions', paint: { 'line-color': '#ffffff', 'line-opacity': 0.06, 'line-width': 0.5 } });
    m.addLayer({ id: 'fp-lit-fill', type: 'fill', source: 'footprints-regions', paint: { 'fill-color': '#6366f1', 'fill-opacity': 0.5 } });
    m.addLayer({ id: 'fp-lit-line', type: 'line', source: 'footprints-regions', paint: { 'line-color': '#818cf8', 'line-width': 1.5 } });
    m.addLayer({ id: 'fp-hover-line', type: 'line', source: 'footprints-regions', paint: { 'line-color': '#ffffff', 'line-width': 2.5, 'line-opacity': 0.9 }, filter: ['literal', false] });
    m.addLayer({
      id: 'fp-label', type: 'symbol', source: 'footprints-regions',
      filter: ['!=', ['get', '_neighbor'], true],
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ''],
        'text-font': ['Open Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 5, 11, 8, 12],
        'text-max-width': 8, 'text-allow-overlap': false,
      },
      paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,0.8)', 'text-halo-width': 1.5 },
    });
    initDone.current = true;

    fetch('/api/geo/CHN/1.json')
      .then(r => r.json())
      .then(data => {
        (m.getSource('footprints-regions') as any)?.setData(data);
        const lit = getCountryLitAdcodes('CHN');
        if (!fitToLitFeatures(m, data.features, lit)) fitToAllFeatures(m, data.features);
      })
      .catch(e => console.error('[FootprintLayerManager] load provinces failed:', e));
  }, [map, visible, getCountryLitAdcodes]);

  const handleLevelChange = useCallback((level: AdminLevel) => {
    setCurrentLevel(level);
    setForcedLevel(level);
  }, []);

  return {
    activeCountry,
    currentLevel,
    countryConfig,
    countryStats,
    countryFootprints,
    footprints,
    footprintStats,
    getCountryLitAdcodes,
    getOverallPercentage,
    handleLevelChange,
    setActiveCountry,
    celebration,
    setCelebration,
    resetFootprints,
    lightUp,
  };
}

/**
 * FootprintLayerManager — renders fog overlay and celebration when visible.
 */
export function FootprintLayerManager({
  map,
  visible,
  countryFootprints,
  activeCountry,
  currentLevel,
  isDark,
}: {
  map: MapLibreMap | null;
  visible: boolean;
  countryFootprints: Record<string, import('@/lib/types').FootprintRecord>;
  activeCountry: string;
  currentLevel: AdminLevel;
  isDark: boolean;
}) {
  if (!visible) return null;
  return (
    <FogOverlay
      map={map}
      footprints={countryFootprints}
      activeCountry={activeCountry}
      currentLevel={currentLevel}
      isDark={isDark}
    />
  );
}
