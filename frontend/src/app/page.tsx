'use client';

import { useRef, useState, useCallback } from 'react';
import { MapViewer } from '@/components/map/MapViewer';
import type { MapViewerHandle } from '@/components/map/MapViewer';
import { MapControls } from '@/components/map/MapControls';
import { LayerPanel } from '@/components/layers/LayerPanel';
import { GuidePanel } from '@/components/GuidePanel';
import { useMapLayers } from '@/hooks/useMapLayers';
import { useDiaryMapLayer } from '@/hooks/useDiaryMapLayer';
import { useTrips } from '@/hooks/useTrips';
import { useTracks } from '@/hooks/useTracks';
import { useGpsPoints } from '@/hooks/useGpsPoints';
import { useFootprintLayer, FootprintLayerManager } from '@/components/travel/FootprintLayerManager';
import { TripRouteLayer } from '@/components/footprint/TripRouteLayer';
import { GpsPointFog } from '@/components/footprint/GpsPointFog';
import { basemapStyles } from '@/lib/mapStyles';
import { accentFrom } from '@/lib/theme';
import Link from 'next/link';
import { Compass } from 'lucide-react';

const DEFAULT_ACCENT = '#6366f1';

export default function HomePage() {
  const mapViewerRef = useRef<MapViewerHandle>(null);
  const [basemapId, setBasemapId] = useState('dark');
  const style = basemapStyles[basemapId];
  const isDark = (style?.theme ?? 'dark') === 'dark';
  const accent = accentFrom(style?.accent ?? DEFAULT_ACCENT);
  const [panelOpen, setPanelOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideHighlight, setGuideHighlight] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<import('maplibre-gl').Map | null>(null);

  const handleOpenGuide = useCallback((keyHint?: string) => {
    setGuideHighlight(keyHint ?? null);
    setGuideOpen(true);
  }, []);

  const handleCloseGuide = useCallback(() => {
    setGuideOpen(false);
    setGuideHighlight(null);
  }, []);

  const handleShowFullGuide = useCallback(() => {
    setGuideHighlight(null);
  }, []);

  const { layerStates, toggleLayer, initializeLayers } = useMapLayers();
  const { addLayer: addDiaryLayer, removeLayer: removeDiaryLayer } = useDiaryMapLayer(mapInstance);

  // Travel layer state
  const { trips } = useTrips();
  const { tracks } = useTracks();
  const { data: gpsData, loading: gpsLoading } = useGpsPoints(tracks);

  // Read travel layer visibility from registry state
  const footprintsVisible = layerStates.get('footprints')?.visible ?? false;
  const tripsVisible = layerStates.get('travel-trips')?.visible ?? false;
  const tracksVisible = layerStates.get('travel-tracks')?.visible ?? false;

  // Footprint layer hook (manages all footprint map logic)
  const footprintLayer = useFootprintLayer(mapInstance, footprintsVisible);

  const handleMapReady = useCallback(
    (map: import('maplibre-gl').Map) => {
      initializeLayers(map);
      setMapInstance(map);
      addDiaryLayer();
    },
    [initializeLayers]
  );

  const handleZoomIn = useCallback(() => {
    mapViewerRef.current?.getMap()?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapViewerRef.current?.getMap()?.zoomOut();
  }, []);

  const handleReset = useCallback(() => {
    const map = mapViewerRef.current?.getMap();
    if (map) {
      map.easeTo({ center: [10, 30], zoom: 2.5, duration: 1000 });
    }
  }, []);

  const entryBtn = isDark
    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 hover:bg-indigo-500/30'
    : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100';

  return (
    <main className="relative h-full w-full">
      <MapViewer
        ref={mapViewerRef}
        basemapTheme={basemapId}
        onMapReady={handleMapReady}
      />

      <MapControls
        currentBasemap={basemapId}
        onSelectBasemap={setBasemapId}
        onOpenGuide={handleOpenGuide}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        isDark={isDark}
        accent={accent}
      />

      <LayerPanel
        layerStates={layerStates}
        onToggleLayer={toggleLayer}
        isOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((prev) => !prev)}
        onOpenGuide={handleOpenGuide}
        isDark={isDark}
        accent={accent}
      />

      <GuidePanel
        isOpen={guideOpen}
        onClose={handleCloseGuide}
        highlightKey={guideHighlight}
        onShowFull={handleShowFullGuide}
        isDark={isDark}
        accent={accent}
      />

      {/* Travel layers on main map */}
      <FootprintLayerManager
        map={mapInstance}
        visible={footprintsVisible}
        countryFootprints={footprintLayer.countryFootprints}
        activeCountry={footprintLayer.activeCountry}
        currentLevel={footprintLayer.currentLevel}
        isDark={isDark}
      />

      <TripRouteLayer
        map={mapInstance}
        trips={trips}
        visible={tripsVisible}
        accentColor={DEFAULT_ACCENT}
      />

      {tracksVisible && (
        <GpsPointFog
          map={mapInstance}
          gpsData={gpsData}
          loading={gpsLoading}
          isDark={isDark}
        />
      )}

      {/* 底部入口按钮 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        <Link
          href="/travel"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-xl transition-all hover:scale-105 ${entryBtn}`}
        >
          <Compass size={16} />
          <span className="text-sm font-medium">旅行</span>
        </Link>
      </div>
    </main>
  );
}
