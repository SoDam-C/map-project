import type { LayerDefinition } from './types';
import type { FeatureCollection } from 'geojson';

interface CommodityRaw {
  id: string;
  name: string;
  commodity: string;
  country: string;
  reserves_mb?: number;
  production_bpd?: number;
  reserves_tcf?: number;
  production_mmcfpd?: number;
  reserves_mt?: number;
  production_mtpa?: number;
  reserves_kt_lce?: number;
  production_kt_lce?: number;
  type: string;
  polygon: number[][][];
}

interface CommoditiesData {
  commodities: CommodityRaw[];
}

const commodityLabels: Record<string, string> = {
  oil: '石油',
  gas: '天然气',
  iron_ore: '铁矿',
  copper: '铜矿',
  lithium: '锂矿',
  coal: '煤炭',
};

function getProductionLabel(item: CommodityRaw): string {
  if (item.production_bpd) return `${(item.production_bpd / 1000).toFixed(0)}K 桶/日`;
  if (item.production_mmcfpd) return `${(item.production_mmcfpd / 1000).toFixed(0)}K 千立方英尺/日`;
  if (item.production_mtpa) return `${item.production_mtpa} 百万吨/年`;
  if (item.production_kt_lce) return `${item.production_kt_lce} 千吨`;
  return '';
}

export const commodities: LayerDefinition = {
  id: 'commodities',
  name: '大宗商品',
  category: '资源',
  icon: 'gem',
  defaultVisible: false,
  pollingInterval: 0,
  section: 'world',
  dataSourcePath: '/data/commodities.json',

  buildGeoJSON: (rawData: unknown): FeatureCollection => {
    const data = rawData as CommoditiesData;
    return {
      type: 'FeatureCollection',
      features: data.commodities.map((item) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: item.polygon,
        },
        properties: {
          id: item.id,
          name: item.name,
          commodity: item.commodity,
          country: item.country,
          commodityLabel: commodityLabels[item.commodity] ?? item.commodity,
          productionLabel: getProductionLabel(item),
          mineType: item.type,
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
    // 多边形填充 — 按商品类型着色
    {
      id: `${sourceId}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'match', ['get', 'commodity'],
          'oil', '#f59e0b',
          'gas', '#06b6d4',
          'iron_ore', '#ef4444',
          'copper', '#f97316',
          'lithium', '#22d3ee',
          'coal', '#6b7280',
          '#ffffff',
        ],
        'fill-opacity': 0.25,
      },
    } as const,
    // 多边形边界线
    {
      id: `${sourceId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': [
          'match', ['get', 'commodity'],
          'oil', '#d97706',
          'gas', '#0891b2',
          'iron_ore', '#dc2626',
          'copper', '#ea580c',
          'lithium', '#06b6d4',
          'coal', '#4b5563',
          '#9ca3af',
        ],
        'line-width': 1.5,
        'line-opacity': 0.8,
      },
    } as const,
    // 商品类型标签（缩放级别3+显示）
    {
      id: `${sourceId}-type-labels`,
      type: 'symbol',
      source: sourceId,
      minzoom: 2,
      layout: {
        'text-field': ['get', 'commodityLabel'],
        'text-font': ['Open Sans Bold'],
        'text-size': 11,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
      },
    } as const,
    // 名称标签（缩放级别4+显示）
    {
      id: `${sourceId}-name-labels`,
      type: 'symbol',
      source: sourceId,
      minzoom: 4,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular'],
        'text-size': 10,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
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
        'text-offset': [0, 2.2],
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
