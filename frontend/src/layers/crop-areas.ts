import type { LayerDefinition } from './types';
import type { FeatureCollection } from 'geojson';

interface CropAreaRaw {
  id: string;
  name: string;
  crop: string;
  country: string;
  area_mha: number;
  polygon: number[][][];
  production_mt?: number;
  season: string;
  unit?: string;
}

interface CropAreasData {
  cropAreas: CropAreaRaw[];
}

const cropLabels: Record<string, string> = {
  wheat: '小麦',
  corn: '玉米',
  soybean: '大豆',
  rice: '水稻',
  cotton: '棉花',
  sugar_cane: '甘蔗',
};

function getAreaLabel(item: CropAreaRaw): string {
  if (item.area_mha >= 1000) return `${(item.area_mha / 1000).toFixed(0)}百万公顷`;
  return `${item.area_mha}千公顷`;
}

function getProductionLabel(item: CropAreaRaw): string {
  if (!item.production_mt) return '';
  if (item.unit === '包') {
    if (item.production_mt >= 1000000) return `${(item.production_mt / 1000000).toFixed(1)}百万包`;
    return `${(item.production_mt / 1000).toFixed(0)}千包`;
  }
  if (item.production_mt >= 1000) return `${(item.production_mt / 1000).toFixed(0)}千吨`;
  return `${item.production_mt} 吨`;
}

export const cropAreas: LayerDefinition = {
  id: 'crop-areas',
  name: '农作物产区',
  category: '农业',
  icon: 'wheat',
  defaultVisible: false,
  pollingInterval: 0,
  section: 'world',
  dataSourcePath: '/data/crop-areas.json',

  buildGeoJSON: (rawData: unknown): FeatureCollection => {
    const data = rawData as CropAreasData;
    return {
      type: 'FeatureCollection',
      features: data.cropAreas.map((item) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: item.polygon,
        },
        properties: {
          id: item.id,
          name: item.name,
          crop: item.crop,
          cropLabel: cropLabels[item.crop] ?? item.crop,
          country: item.country,
          area: item.area_mha,
          areaLabel: getAreaLabel(item),
          production: item.production_mt ?? 0,
          productionLabel: getProductionLabel(item),
          season: item.season,
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
    // 多边形填充 — 按作物类型着色
    {
      id: `${sourceId}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'match', ['get', 'crop'],
          'wheat', '#fbbf24',
          'corn', '#84cc16',
          'soybean', '#22c55e',
          'rice', '#a3e635',
          'cotton', '#f9fafb',
          'sugar_cane', '#a16207',
          '#ffffff',
        ],
        'fill-opacity': 0.3,
      },
    } as const,
    // 多边形边界线
    {
      id: `${sourceId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': [
          'match', ['get', 'crop'],
          'wheat', '#d97706',
          'corn', '#65a30d',
          'soybean', '#16a34a',
          'rice', '#84cc16',
          'cotton', '#d1d5db',
          'sugar_cane', '#92400e',
          '#9ca3af',
        ],
        'line-width': 1.5,
        'line-opacity': 0.8,
      },
    } as const,
    // 作物类型标签（缩放级别2+显示）
    {
      id: `${sourceId}-crop-labels`,
      type: 'symbol',
      source: sourceId,
      minzoom: 2,
      layout: {
        'text-field': ['get', 'cropLabel'],
        'text-font': ['Open Sans Bold'],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
      },
    } as const,
    // 名称+面积标签（缩放级别3+显示）
    {
      id: `${sourceId}-name-labels`,
      type: 'symbol',
      source: sourceId,
      minzoom: 3,
      layout: {
        'text-field': ['concat', ['get', 'name'], '\n', ['get', 'areaLabel']],
        'text-font': ['Open Sans Regular'],
        'text-size': 10,
        'text-max-width': 8,
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#e5e7eb',
        'text-halo-color': '#000000',
        'text-halo-width': 1.5,
      },
    } as const,
    // 产量标签（缩放级别5+显示）
    {
      id: `${sourceId}-production-labels`,
      type: 'symbol',
      source: sourceId,
      minzoom: 5,
      layout: {
        'text-field': ['get', 'productionLabel'],
        'text-font': ['Open Sans Regular'],
        'text-size': 9,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#d1d5db',
        'text-halo-color': '#000000',
        'text-halo-width': 1,
      },
    } as const,
  ],
};
