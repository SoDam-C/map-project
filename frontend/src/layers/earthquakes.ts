import type { LayerDefinition } from './types';
import type { FeatureCollection } from 'geojson';

export const earthquakes: LayerDefinition = {
  id: 'earthquakes',
  name: '地震',
  category: '地球物理',
  icon: 'activity',
  defaultVisible: true,
  pollingInterval: 0,
  section: 'world',
  dataSourcePath: '/data/earthquakes.json',

  buildGeoJSON: (rawData: unknown): FeatureCollection => {
    return rawData as FeatureCollection;
  },

  buildSource: (geojson: FeatureCollection) => ({
    type: 'geojson',
    data: geojson,
    generateId: true,
  }),

  buildLayers: (sourceId: string) => [
    {
      id: `${sourceId}-halo`,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'magnitude'],
          3, 12,
          5, 20,
          7, 30,
        ],
        'circle-color': '#ff4444',
        'circle-opacity': 0.15,
        'circle-blur': 0.5,
      },
    } as const,
    {
      id: `${sourceId}-circles`,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'magnitude'],
          3, 4,
          5, 8,
          7, 14,
        ],
        'circle-color': [
          'interpolate', ['linear'], ['get', 'magnitude'],
          3, '#ffff00',
          5, '#ff8800',
          7, '#ff0000',
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
      },
    } as const,
  ],
};
