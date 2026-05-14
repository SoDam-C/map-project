'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { LayerId, LayerRuntimeState } from '@/layers/types';
import { layerRegistry } from '@/components/layers/registry';

import earthquakesRaw from '@/data/earthquakes.json';
import shipsRaw from '@/data/ships.json';
import airportsRaw from '@/data/airports.json';
import commoditiesRaw from '@/data/commodities.json';
import cropAreasRaw from '@/data/crop-areas.json';

const mockDataStore: Record<string, unknown> = {
  '/data/earthquakes.json': earthquakesRaw,
  '/data/ships.json': shipsRaw,
  '/data/airports.json': airportsRaw,
  '/data/commodities.json': commoditiesRaw,
  '/data/crop-areas.json': cropAreasRaw,
};

function sourceIdFor(layerId: LayerId): string {
  return `layer-${layerId}`;
}

const shipArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <polygon points="12,2 20,20 12,16 4,20" fill="#38bdf8" stroke="#0ea5e9" stroke-width="1"/>
</svg>`;

export interface UseMapLayersReturn {
  layerStates: ReadonlyMap<LayerId, LayerRuntimeState>;
  toggleLayer: (layerId: LayerId) => void;
  initializeLayers: (map: MapLibreMap) => void;
}

export function useMapLayers(): UseMapLayersReturn {
  const mapRef = useRef<MapLibreMap | null>(null);
  const [layerStates, setLayerStates] = useState(() => {
    const states = new Map<LayerId, LayerRuntimeState>();
    for (const id of layerRegistry.getAllLayerIds()) {
      const def = layerRegistry.getLayer(id)!;
      states.set(id, {
        definition: def,
        visible: def.defaultVisible,
        loaded: false,
        loading: false,
        geojson: null,
        pollingHandle: null,
      });
    }
    return states;
  });

  const loadLayerData = useCallback(
    async (dataSourcePath: string, buildGeoJSON: (raw: unknown) => FeatureCollection): Promise<FeatureCollection> => {
      const rawData = mockDataStore[dataSourcePath];
      if (rawData === undefined) {
        throw new Error(`No mock data for path: ${dataSourcePath}`);
      }
      return buildGeoJSON(rawData);
    },
    []
  );

  const addShipIcon = useCallback((map: MapLibreMap) => {
    if (map.hasImage('ship-arrow')) return;
    const img = new Image(24, 24);
    img.onload = () => {
      if (!map.hasImage('ship-arrow')) {
        map.addImage('ship-arrow', img);
      }
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(shipArrowSvg);
  }, []);

  const initializeLayers = useCallback(
    async (map: MapLibreMap) => {
      mapRef.current = map;

      addShipIcon(map);

      const loadedLayers: Array<{ id: LayerId; geojson: FeatureCollection }> = [];

      for (const id of layerRegistry.getAllLayerIds()) {
        const def = layerRegistry.getLayer(id)!;

        setLayerStates((prev) => {
          const next = new Map(prev);
          const current = next.get(id)!;
          next.set(id, { ...current, loading: true });
          return next;
        });

        try {
          // Skip layers with no data source (e.g. footprints managed by external components)
          if (!def.dataSourcePath) {
            setLayerStates((prev) => {
              const next = new Map(prev);
              const current = next.get(id)!;
              next.set(id, { ...current, loaded: true, loading: false, geojson: def.buildGeoJSON(null) });
              return next;
            });
            continue;
          }
          const geojson = await loadLayerData(def.dataSourcePath, def.buildGeoJSON);
          loadedLayers.push({ id, geojson });

          setLayerStates((prev) => {
            const next = new Map(prev);
            const current = next.get(id)!;
            next.set(id, { ...current, loaded: true, loading: false, geojson });
            return next;
          });
        } catch (err) {
          console.error(`Failed to load layer "${id}":`, err);
          setLayerStates((prev) => {
            const next = new Map(prev);
            const current = next.get(id)!;
            next.set(id, { ...current, loading: false });
            return next;
          });
        }
      }

      // Add all layers to map in one pass
      for (const { id, geojson } of loadedLayers) {
        const def = layerRegistry.getLayer(id)!;
        const sid = sourceIdFor(id);

        if (!map.getSource(sid)) {
          map.addSource(sid, def.buildSource(geojson) as maplibregl.SourceSpecification);
        }

        const layerSpecs = def.buildLayers(sid);
        for (const spec of layerSpecs) {
          if (!map.getLayer(spec.id)) {
            map.addLayer(spec);
          }
          map.setLayoutProperty(
            spec.id,
            'visibility',
            def.defaultVisible ? 'visible' : 'none'
          );
        }

        // Set up polling for layers that need it
        if (def.pollingInterval > 0) {
          const handle = setInterval(async () => {
            try {
              const fresh = await loadLayerData(def.dataSourcePath, def.buildGeoJSON);
              const source = map.getSource(sid) as maplibregl.GeoJSONSource | undefined;
              if (source) {
                source.setData(fresh);
              }
              setLayerStates((prev) => {
                const next = new Map(prev);
                const current = next.get(id)!;
                next.set(id, { ...current, geojson: fresh });
                return next;
              });
            } catch {
              // silent — will retry on next interval
            }
          }, def.pollingInterval);

          setLayerStates((prev) => {
            const next = new Map(prev);
            const current = next.get(id)!;
            next.set(id, { ...current, pollingHandle: handle });
            return next;
          });
        }
      }
    },
    [loadLayerData, addShipIcon]
  );

  const toggleLayer = useCallback((layerId: LayerId) => {
    setLayerStates((prev) => {
      const next = new Map(prev);
      const current = next.get(layerId);
      if (!current) return prev;

      const newVisible = !current.visible;
      next.set(layerId, { ...current, visible: newVisible });

      // Imperative: update map directly, bypass React
      const map = mapRef.current;
      if (map && current.loaded) {
        const sid = sourceIdFor(layerId);
        const layerSpecs = current.definition.buildLayers(sid);
        for (const spec of layerSpecs) {
          if (map.getLayer(spec.id)) {
            map.setLayoutProperty(
              spec.id,
              'visibility',
              newVisible ? 'visible' : 'none'
            );
          }
        }
      }

      return next;
    });
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    const handles = layerStates.values();
    const intervals: ReturnType<typeof setInterval>[] = [];
    for (const state of handles) {
      if (state.pollingHandle) intervals.push(state.pollingHandle);
    }
    return () => {
      for (const h of intervals) clearInterval(h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { layerStates, toggleLayer, initializeLayers };
}
