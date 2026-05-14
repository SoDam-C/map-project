import type { LayerDefinition } from './types';
import type { FeatureCollection } from 'geojson';

interface AirportRaw {
  iata: string;
  name: string;
  lat: number;
  lon: number;
  elevation: number;
}

interface AirportsData {
  airports: AirportRaw[];
}

export const airports: LayerDefinition = {
  id: 'airports',
  name: '机场',
  category: '航空',
  icon: 'plane',
  defaultVisible: false,
  pollingInterval: 0,
  section: 'world',
  dataSourcePath: '/data/airports.json',

  buildGeoJSON: (rawData: unknown): FeatureCollection => {
    const data = rawData as AirportsData;
    return {
      type: 'FeatureCollection',
      features: data.airports.map((ap) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [ap.lon, ap.lat],
        },
        properties: {
          id: ap.iata,
          name: ap.name,
          iata: ap.iata,
          elevation: ap.elevation,
        },
      })),
    };
  },

  buildSource: (geojson: FeatureCollection) => ({
    type: 'geojson',
    data: geojson,
    generateId: true,
  }),

  buildLayers: (sourceId: string) => [
    {
      id: `${sourceId}-circles`,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 5,
        'circle-color': '#a78bfa',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#7c3aed',
      },
    } as const,
    {
      id: `${sourceId}-labels`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'iata'],
        'text-font': ['Open Sans Bold'],
        'text-size': 12,
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#fbbf24',
        'text-halo-color': '#1e1b4b',
        'text-halo-width': 2,
      },
    } as const,
  ],
};
