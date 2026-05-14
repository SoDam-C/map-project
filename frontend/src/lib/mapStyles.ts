import type { BasemapStyle } from '@/layers/types';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';
const TIANDITU_KEY = process.env.NEXT_PUBLIC_TIANDITU_KEY || '';
const STADIA_KEY = process.env.NEXT_PUBLIC_STADIA_KEY || '';

function buildBasemapStyles(): Record<string, BasemapStyle> {
  const styles: Record<string, BasemapStyle> = {
    // ========== 无需 API Key ==========

    dark: {
      id: 'dark',
      name: '暗色',
      url: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      theme: 'dark',
      accent: '#6366f1',
    },
    light: {
      id: 'light',
      name: '亮色',
      url: 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      theme: 'light',
      accent: '#3b82f6',
    },
    voyager: {
      id: 'voyager',
      name: '旅行者',
      url: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      theme: 'light',
      accent: '#0ea5e9',
    },
    liberty: {
      id: 'liberty',
      name: '自由地图',
      url: 'https://tiles.openfreemap.org/styles/liberty',
      theme: 'light',
      accent: '#6366f1',
    },
    esri: {
      id: 'esri',
      name: 'ESRI 卫星',
      theme: 'dark',
      accent: '#f97316',
      styleSpec: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '&copy; Esri',
          },
          'esri-labels': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
          },
        },
        layers: [
          { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' },
          { id: 'esri-labels-layer', type: 'raster', source: 'esri-labels' },
        ],
      },
    },
    amap: {
      id: 'amap',
      name: '高德地图',
      theme: 'light',
      accent: '#2563eb',
      styleSpec: {
        version: 8,
        sources: {
          'amap-road': {
            type: 'raster',
            tiles: Array.from({ length: 4 }, (_, i) =>
              `https://webrd0${i + 1}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`
            ),
            tileSize: 256,
            attribution: '&copy; 高德地图',
          },
        },
        layers: [
          { id: 'amap-road-layer', type: 'raster', source: 'amap-road' },
        ],
      },
    },
    amap_satellite: {
      id: 'amap_satellite',
      name: '高德卫星',
      theme: 'dark',
      accent: '#0ea5e9',
      styleSpec: {
        version: 8,
        sources: {
          'amap-sat': {
            type: 'raster',
            tiles: Array.from({ length: 4 }, (_, i) =>
              `https://webst0${i + 1}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}`
            ),
            tileSize: 256,
            attribution: '&copy; 高德地图',
          },
          'amap-sat-label': {
            type: 'raster',
            tiles: Array.from({ length: 4 }, (_, i) =>
              `https://webst0${i + 1}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}`
            ),
            tileSize: 256,
          },
        },
        layers: [
          { id: 'amap-sat-layer', type: 'raster', source: 'amap-sat' },
          { id: 'amap-sat-label-layer', type: 'raster', source: 'amap-sat-label' },
        ],
      },
    },

    // ========== 需要 API Key（未配置时标记不可用） ==========

    streets: {
      id: 'streets',
      name: '标准地图',
      requiresKey: !MAPTILER_KEY,
      keyHint: 'NEXT_PUBLIC_MAPTILER_KEY',
      theme: 'light',
      accent: '#6366f1',
      ...(MAPTILER_KEY ? {
        url: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      } : {}),
    },
    satellite: {
      id: 'satellite',
      name: '卫星地图',
      requiresKey: !MAPTILER_KEY,
      keyHint: 'NEXT_PUBLIC_MAPTILER_KEY',
      theme: 'dark',
      accent: '#0ea5e9',
      ...(MAPTILER_KEY ? {
        url: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
      } : {}),
    },
    topo: {
      id: 'topo',
      name: '地形图',
      requiresKey: !MAPTILER_KEY,
      keyHint: 'NEXT_PUBLIC_MAPTILER_KEY',
      theme: 'light',
      accent: '#16a34a',
      ...(MAPTILER_KEY ? {
        url: `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`,
      } : {}),
    },
    tianditu: {
      id: 'tianditu',
      name: '天地图',
      requiresKey: !TIANDITU_KEY,
      keyHint: 'NEXT_PUBLIC_TIANDITU_KEY',
      theme: 'light',
      accent: '#e11d48',
      ...(TIANDITU_KEY ? {
        styleSpec: {
          version: 8,
          sources: {
            'tdt-vec': {
              type: 'raster',
              tiles: Array.from({ length: 8 }, (_, i) =>
                `https://t${i}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`
              ),
              tileSize: 256,
              attribution: '&copy; 天地图',
            },
            'tdt-cva': {
              type: 'raster',
              tiles: Array.from({ length: 8 }, (_, i) =>
                `https://t${i}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${TIANDITU_KEY}`
              ),
              tileSize: 256,
            },
          },
          layers: [
            { id: 'tdt-vec-layer', type: 'raster', source: 'tdt-vec' },
            { id: 'tdt-cva-layer', type: 'raster', source: 'tdt-cva' },
          ],
        },
      } : {}),
    },
    stadia_dark: {
      id: 'stadia_dark',
      name: 'Stadia 暗色',
      requiresKey: !STADIA_KEY,
      keyHint: 'NEXT_PUBLIC_STADIA_KEY',
      theme: 'dark',
      accent: '#8b5cf6',
      ...(STADIA_KEY ? {
        url: `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${STADIA_KEY}`,
      } : {}),
    },
    stadia_outdoors: {
      id: 'stadia_outdoors',
      name: 'Stadia 户外',
      requiresKey: !STADIA_KEY,
      keyHint: 'NEXT_PUBLIC_STADIA_KEY',
      theme: 'light',
      accent: '#16a34a',
      ...(STADIA_KEY ? {
        url: `https://tiles.stadiamaps.com/styles/outdoors.json?api_key=${STADIA_KEY}`,
      } : {}),
    },
  };

  return styles;
}

export const basemapStyles = buildBasemapStyles();
export const basemapList: BasemapStyle[] = Object.values(basemapStyles);
