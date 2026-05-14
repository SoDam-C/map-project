import type { LayerDefinition } from './types';

/**
 * 行程图层 — 注册到 LayerRegistry 用于图层面板显示
 * 实际的地图渲染由 TripRouteLayer 组件管理
 */
export const travelTrips: LayerDefinition = {
  id: 'travel-trips',
  name: '行程',
  category: '旅行',
  icon: 'route',
  defaultVisible: false,
  pollingInterval: 0,
  dataSourcePath: '',
  section: 'travel',
  minZoom: 3,
  maxZoom: 18,
  buildGeoJSON: () => ({ type: 'FeatureCollection', features: [] }),
  buildSource: () => ({ type: 'geojson', data: { type: 'FeatureCollection', features: [] } }),
  buildLayers: () => [],
};
