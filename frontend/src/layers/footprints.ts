import type { LayerDefinition } from './types';

/**
 * 足迹图层 — 注册到 LayerRegistry 用于图层面板显示
 * 实际的地图渲染由 FootprintManager 组件管理（因为需要动态数据加载）
 */
export const footprints: LayerDefinition = {
  id: 'footprints',
  name: '足迹',
  category: '足迹',
  icon: 'footprints',
  defaultVisible: false,
  pollingInterval: 0,
  dataSourcePath: '', // 不走标准数据加载
  section: 'travel',
  minZoom: 3,
  maxZoom: 18,

  buildGeoJSON: () => ({ type: 'FeatureCollection', features: [] }),
  buildSource: () => ({ type: 'geojson', data: { type: 'FeatureCollection', features: [] } }),
  buildLayers: () => [], // 图层由 FootprintManager 动态添加
};
