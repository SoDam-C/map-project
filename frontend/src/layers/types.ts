import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';

export type LayerId = string;
export type LayerCategory = string;
export type BasemapTheme = string;
export type LayerSection = 'world' | 'personal' | 'travel';

export interface LayerDefinition {
  readonly id: LayerId;
  readonly name: string;
  readonly category: LayerCategory;
  readonly icon: string;
  readonly defaultVisible: boolean;
  readonly pollingInterval: number;
  readonly dataSourcePath: string;
  readonly section: LayerSection;
  readonly minZoom?: number;
  readonly maxZoom?: number;
  buildGeoJSON: (rawData: unknown) => FeatureCollection;
  buildSource: (geojson: FeatureCollection) => SourceSpecification;
  buildLayers: (sourceId: string) => LayerSpecification[];
}

export interface LayerRuntimeState {
  readonly definition: LayerDefinition;
  visible: boolean;
  loaded: boolean;
  loading: boolean;
  geojson: FeatureCollection | null;
  pollingHandle: ReturnType<typeof setInterval> | null;
}

export interface LayerRegistry {
  readonly layers: ReadonlyMap<LayerId, LayerDefinition>;
  getCategories: () => readonly LayerCategory[];
  getCategoriesBySection: (section: LayerSection) => readonly LayerCategory[];
  getLayersByCategory: (category: LayerCategory) => readonly LayerDefinition[];
  getLayer: (id: LayerId) => LayerDefinition | undefined;
  getAllLayerIds: () => readonly LayerId[];
}

export interface BasemapStyle {
  readonly id: BasemapTheme;
  readonly name: string;
  readonly url?: string;
  readonly styleSpec?: Record<string, unknown>;
  readonly requiresKey?: boolean;   // 是否需要 API Key
  readonly keyHint?: string;       // 需要的环境变量名
  readonly theme?: 'dark' | 'light'; // 底图明暗风格，用于 UI 自适应
  readonly accent?: string;          // 主题色 hex，如 '#6366f1'
}
