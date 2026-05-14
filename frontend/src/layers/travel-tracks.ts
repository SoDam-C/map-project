import type { LayerDefinition } from './types';

/**
 * 轨迹图层 — 注册到 LayerRegistry 用于图层面板显示
 * 实际的地图渲染由 GpsPointFog 组件管理
 */
export const travelTracks: LayerDefinition = {
  id: 'travel-tracks',
  name: '轨迹',
  category: '旅行',
  icon: 'navigation',
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
