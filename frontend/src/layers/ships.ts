import type { LayerDefinition } from './types';
import type { FeatureCollection } from 'geojson';

interface ShipRaw {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  type: string;
  destination: string;
}

interface ShipsData {
  vessels: ShipRaw[];
}

export const ships: LayerDefinition = {
  id: 'ships',
  name: '船舶',
  category: '海事',
  icon: 'ship',
  defaultVisible: false,
  section: 'world',
  pollingInterval: 10000,
  dataSourcePath: '/data/ships.json',

  buildGeoJSON: (rawData: unknown): FeatureCollection => {
    const data = rawData as ShipsData;
    return {
      type: 'FeatureCollection',
      features: data.vessels.map((vessel) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [vessel.lon, vessel.lat],
        },
        properties: {
          id: vessel.mmsi,
          name: vessel.name,
          heading: vessel.heading,
          speed: vessel.speed,
          vesselType: vessel.type,
          destination: vessel.destination,
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
      id: `${sourceId}-symbols`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': 'ship-arrow',
        'icon-size': 0.6,
        'icon-rotate': ['get', 'heading'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-anchor': 'center',
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-optional': true,
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': '#1e293b',
        'text-halo-width': 1.5,
      },
    } as const,
  ],
};
