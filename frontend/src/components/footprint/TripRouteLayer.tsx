'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { TripRecord } from '@/lib/types';
import { TRANSPORT_TYPES } from '@/lib/types';

interface TripRouteLayerProps {
  map: MapLibreMap | null;
  trips: Record<string, TripRecord>;
  visible: boolean;
  accentColor: string;
}

const SOURCE_ID = 'trips-routes';
const ROUTE_LAYER_ID = 'trips-route-line';
const WAYPOINT_LAYER_ID = 'trips-waypoint-circle';

export function TripRouteLayer({ map, trips, visible, accentColor }: TripRouteLayerProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    const m = map;
    if (!m) return;

    const addLayers = () => {
      if (m.getSource(SOURCE_ID)) return;

      // 路线数据 source
      m.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: buildRouteFeatures(trips),
        },
      });

      // 路线线条
      m.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': accentColor,
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [2, 1],
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });

      // 途经点圆圈
      m.addLayer({
        id: WAYPOINT_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 6,
          'circle-color': '#fff',
          'circle-stroke-width': 2,
          'circle-stroke-color': accentColor,
        },
        filter: ['==', ['get', 'type'], 'waypoint'],
      });

      initializedRef.current = true;
    };

    if (m.isStyleLoaded()) {
      addLayers();
    } else {
      m.once('style.load', addLayers);
    }

    return () => {
      try {
        if (m.getLayer(WAYPOINT_LAYER_ID)) m.removeLayer(WAYPOINT_LAYER_ID);
        if (m.getLayer(ROUTE_LAYER_ID)) m.removeLayer(ROUTE_LAYER_ID);
        if (m.getSource(SOURCE_ID)) m.removeSource(SOURCE_ID);
      } catch { /* ignore */ }
      initializedRef.current = false;
    };
  }, [map, accentColor]);

  // 更新数据
  useEffect(() => {
    const m = map;
    if (!m || !initializedRef.current) return;
    try {
      const source = m.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: buildRouteFeatures(trips),
        });
      }
    } catch { /* ignore */ }
  }, [map, trips]);

  // 可见性控制
  useEffect(() => {
    const m = map;
    if (!m || !initializedRef.current) return;
    try {
      if (m.getLayer(ROUTE_LAYER_ID)) {
        m.setLayoutProperty(ROUTE_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
      }
      if (m.getLayer(WAYPOINT_LAYER_ID)) {
        m.setLayoutProperty(WAYPOINT_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
      }
    } catch { /* ignore */ }
  }, [map, visible]);

  return null;
}

function buildRouteFeatures(trips: Record<string, TripRecord>) {
  const features: any[] = [];

  for (const trip of Object.values(trips)) {
    // 路线线条
    if (trip.route && trip.route.coordinates.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {
          type: 'route',
          tripId: trip.id,
          title: trip.title,
          transportType: trip.transportType,
        },
        geometry: trip.route,
      });
    } else if (trip.waypoints.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {
          type: 'route',
          tripId: trip.id,
          title: trip.title,
          transportType: trip.transportType,
        },
        geometry: {
          type: 'LineString',
          coordinates: trip.waypoints.map(wp => [wp.lng, wp.lat]),
        },
      });
    }

    // 途经点
    for (const wp of trip.waypoints) {
      features.push({
        type: 'Feature',
        properties: {
          type: 'waypoint',
          tripId: trip.id,
          waypointId: wp.id,
          name: wp.name,
        },
        geometry: {
          type: 'Point',
          coordinates: [wp.lng, wp.lat],
        },
      });
    }
  }

  return features;
}
