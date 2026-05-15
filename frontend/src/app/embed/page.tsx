'use client';

import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapViewer, type MapViewerHandle } from '@/components/map/MapViewer';
import { useFootprintLayer, FootprintLayerManager } from '@/components/travel/FootprintLayerManager';
import { TripRouteLayer } from '@/components/footprint/TripRouteLayer';
import { GpsPointFog } from '@/components/footprint/GpsPointFog';
import { useTrips } from '@/hooks/useTrips';
import { useTracks } from '@/hooks/useTracks';
import { useGpsPoints } from '@/hooks/useGpsPoints';
import { useMapLayers } from '@/hooks/useMapLayers';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { basemapStyles } from '@/lib/mapStyles';

const VALID_LAYERS = [
  'footprints', 'trips', 'tracks',
  'earthquakes', 'airports', 'ships', 'commodities', 'crops',
] as const;
type EmbedLayer = typeof VALID_LAYERS[number];

function EmbedMap() {
  const params = useSearchParams();

  // Parse URL params
  const layersParam = params.get('layers') || 'footprints';
  const activeLayers = new Set<EmbedLayer>(
    layersParam.split(',').filter((l): l is EmbedLayer => (VALID_LAYERS as readonly string[]).includes(l))
  );
  const centerParam = params.get('center')?.split(',').map(Number) as [number, number] | undefined;
  const zoomParam = params.get('zoom') ? Number(params.get('zoom')) : 4;
  const basemapParam = params.get('basemap') || 'dark';
  const accentParam = params.get('accent') || '#6366f1';
  const showControls = params.get('controls') !== 'false';
  const showLegend = params.get('legend') === 'true';

  const [mapInstance, setMapInstance] = useState<import('maplibre-gl').Map | null>(null);
  const mapViewerRef = useRef<MapViewerHandle>(null);

  // Data hooks
  const { trips } = useTrips();
  const { tracks } = useTracks();
  const { data: gpsData, loading: gpsLoading } = useGpsPoints(tracks);

  // World data layers (earthquakes, airports, etc.)
  const showWorldLayers = ['earthquakes', 'airports', 'ships', 'commodities', 'crops'].some(l => activeLayers.has(l as EmbedLayer));
  const { layerStates, toggleLayer, initializeLayers } = useMapLayers();

  // Footprint layer
  const footprintsVisible = activeLayers.has('footprints');
  const footprintLayer = useFootprintLayer(mapInstance, footprintsVisible);

  const handleMapReady = useCallback((map: import('maplibre-gl').Map) => {
    setMapInstance(map);
    if (showWorldLayers) {
      initializeLayers(map);
    }
  }, [initializeLayers, showWorldLayers]);

  // Sync world layer visibility with URL params
  useEffect(() => {
    if (!mapInstance) return;
    const worldLayerMap: Record<string, string> = {
      earthquakes: 'earthquakes',
      airports: 'airports',
      ships: 'ships',
      commodities: 'commodities',
      crops: 'crop-areas',
    };
    for (const [embedId, layerId] of Object.entries(worldLayerMap)) {
      const state = layerStates.get(layerId);
      if (!state) continue;
      const shouldBeVisible = activeLayers.has(embedId as EmbedLayer);
      if (state.visible !== shouldBeVisible) {
        toggleLayer(layerId);
      }
    }
  }, [mapInstance, activeLayers, layerStates, toggleLayer]);

  const handleZoomIn = useCallback(() => mapViewerRef.current?.getMap()?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapViewerRef.current?.getMap()?.zoomOut(), []);

  const isDark = (basemapStyles[basemapParam]?.theme ?? 'dark') === 'dark';
  const btnClass = isDark
    ? 'bg-black/40 text-gray-200 border border-white/10 hover:bg-black/50'
    : 'bg-white/60 text-gray-700 border border-black/10 hover:bg-white/70';

  const activeLayerLabels: Record<string, string> = {
    footprints: '足迹',
    trips: '行程',
    tracks: '轨迹',
    earthquakes: '地震',
    airports: '机场',
    ships: '船舶',
    commodities: '大宗商品',
    crops: '农作物',
  };

  return (
    <div className="h-full w-full relative">
      <MapViewer
        ref={mapViewerRef}
        basemapTheme={basemapParam}
        onMapReady={handleMapReady}
        initialCenter={centerParam || [104, 35]}
        initialZoom={zoomParam}
      />

      {/* Travel layers */}
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
        visible={activeLayers.has('trips')}
        accentColor={accentParam}
      />

      {activeLayers.has('tracks') && (
        <GpsPointFog
          map={mapInstance}
          gpsData={gpsData}
          loading={gpsLoading}
          isDark={isDark}
        />
      )}

      {/* Zoom controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button onClick={handleZoomIn} className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${btnClass}`}>
            <ZoomIn size={16} />
          </button>
          <button onClick={handleZoomOut} className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${btnClass}`}>
            <ZoomOut size={16} />
          </button>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className={`absolute bottom-4 left-4 z-10 rounded-lg shadow-lg backdrop-blur-xl px-3 py-2 text-xs ${
          isDark ? 'bg-black/50 text-gray-300 border border-white/10' : 'bg-white/70 text-gray-700 border border-black/10'
        }`}>
          <div className="font-medium mb-1">图层</div>
          {[...activeLayers].map(l => (
            <div key={l} className="flex items-center gap-2 py-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentParam }} />
              <span>{activeLayerLabels[l] || l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-gray-950" />}>
      <EmbedMap />
    </Suspense>
  );
}
