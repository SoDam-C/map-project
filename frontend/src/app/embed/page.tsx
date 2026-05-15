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

const CUSTOM_SOURCE = 'embed-custom';
const CUSTOM_LAYER = 'embed-custom-layer';

/**
 * Load external GeoJSON data and add as a map layer.
 * Supports Point (circle), LineString (line), Polygon (fill).
 */
function useCustomDataLayer(
  map: import('maplibre-gl').Map | null,
  dataUrl: string | null,
  color: string,
  radius: number,
  lineWidth: number,
  opacity: number,
  labelField: string | null,
) {
  const loaded = useRef(false);

  useEffect(() => {
    const m = map;
    if (!m || !dataUrl) return;
    if (loaded.current) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(dataUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const geojson = await res.json();
        if (cancelled) return;

        // Remove previous if exists
        try { if (m.getLayer(CUSTOM_LAYER)) m.removeLayer(CUSTOM_LAYER); } catch {}
        try { if (m.getSource(CUSTOM_SOURCE)) m.removeSource(CUSTOM_SOURCE); } catch {}

        m.addSource(CUSTOM_SOURCE, {
          type: 'geojson',
          data: geojson,
        });

        // Detect geometry type from first feature
        const geomType = geojson?.features?.[0]?.geometry?.type ?? 'Point';

        if (geomType === 'Point' || geomType === 'MultiPoint') {
          m.addLayer({
            id: CUSTOM_LAYER,
            type: 'circle',
            source: CUSTOM_SOURCE,
            paint: {
              'circle-radius': radius,
              'circle-color': color,
              'circle-opacity': opacity,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-opacity': opacity * 0.6,
            },
          });
        } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
          m.addLayer({
            id: CUSTOM_LAYER,
            type: 'line',
            source: CUSTOM_SOURCE,
            paint: {
              'line-color': color,
              'line-width': lineWidth,
              'line-opacity': opacity,
            },
            layout: { 'line-cap': 'round', 'line-join': 'round' },
          });
        } else {
          // Polygon / MultiPolygon — fill + outline
          m.addLayer({
            id: CUSTOM_LAYER,
            type: 'fill',
            source: CUSTOM_SOURCE,
            paint: {
              'fill-color': color,
              'fill-opacity': opacity * 0.5,
            },
          });
          m.addLayer({
            id: CUSTOM_LAYER + '-outline',
            type: 'line',
            source: CUSTOM_SOURCE,
            paint: {
              'line-color': color,
              'line-width': lineWidth,
              'line-opacity': opacity,
            },
          });
        }

        // Optional: add labels
        if (labelField) {
          m.addLayer({
            id: CUSTOM_LAYER + '-label',
            type: 'symbol',
            source: CUSTOM_SOURCE,
            layout: {
              'text-field': ['coalesce', ['get', labelField], ''],
              'text-font': ['Open Sans Regular'],
              'text-size': 11,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-allow-overlap': false,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(0,0,0,0.8)',
              'text-halo-width': 1.5,
            },
          });
        }

        // Auto-fit to data bounds
        if (geojson?.features?.length > 0) {
          const bounds = new (await import('maplibre-gl')).LngLatBounds();
          for (const f of geojson.features) {
            if (f.geometry?.type === 'Point') {
              bounds.extend(f.geometry.coordinates as [number, number]);
            } else {
              const coords = extractCoords(f.geometry);
              for (const c of coords) bounds.extend(c as [number, number]);
            }
          }
          try {
            m.fitBounds(bounds, { padding: 40, duration: 1000 });
          } catch { /* empty bounds, skip */ }
        }

        loaded.current = true;
      } catch (err) {
        console.error('[embed] Failed to load custom data:', err);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [map, dataUrl, color, radius, lineWidth, opacity, labelField]);
}

function extractCoords(geometry: any): number[][] {
  if (!geometry) return [];
  const coords: number[][] = [];
  const walk = (arr: any) => {
    if (Array.isArray(arr) && typeof arr[0] === 'number') {
      coords.push(arr);
    } else if (Array.isArray(arr)) {
      arr.forEach(walk);
    }
  };
  walk(geometry.coordinates);
  return coords;
}

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

  // Custom data layer params
  const dataUrl = params.get('data');
  const dataColor = params.get('dataColor') || accentParam;
  const dataRadius = Number(params.get('dataRadius')) || 6;
  const dataLineWidth = Number(params.get('dataLineWidth')) || 2;
  const dataOpacity = Number(params.get('dataOpacity')) || 0.85;
  const dataLabel = params.get('dataLabel') || null;

  const [mapInstance, setMapInstance] = useState<import('maplibre-gl').Map | null>(null);
  const mapViewerRef = useRef<MapViewerHandle>(null);

  // Data hooks
  const { trips } = useTrips();
  const { tracks } = useTracks();
  const { data: gpsData, loading: gpsLoading } = useGpsPoints(tracks);

  // World data layers
  const showWorldLayers = ['earthquakes', 'airports', 'ships', 'commodities', 'crops'].some(l => activeLayers.has(l as EmbedLayer));
  const { layerStates, toggleLayer, initializeLayers } = useMapLayers();

  // Footprint layer
  const footprintsVisible = activeLayers.has('footprints');
  const footprintLayer = useFootprintLayer(mapInstance, footprintsVisible);

  // Custom external data layer
  useCustomDataLayer(mapInstance, dataUrl, dataColor, dataRadius, dataLineWidth, dataOpacity, dataLabel);

  const handleMapReady = useCallback((map: import('maplibre-gl').Map) => {
    setMapInstance(map);
    if (showWorldLayers) {
      initializeLayers(map);
    }
  }, [initializeLayers, showWorldLayers]);

  // Sync world layer visibility
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

  // Legend items
  const legendItems = [...activeLayers].map(l => ({ label: activeLayerLabels[l] || l, color: accentParam }));
  if (dataUrl) {
    legendItems.push({ label: params.get('dataName') || '自定义数据', color: dataColor });
  }

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
      {showLegend && legendItems.length > 0 && (
        <div className={`absolute bottom-4 left-4 z-10 rounded-lg shadow-lg backdrop-blur-xl px-3 py-2 text-xs ${
          isDark ? 'bg-black/50 text-gray-300 border border-white/10' : 'bg-white/70 text-gray-700 border border-black/10'
        }`}>
          <div className="font-medium mb-1">图层</div>
          {legendItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
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
