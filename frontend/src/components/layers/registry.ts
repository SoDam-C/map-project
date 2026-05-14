import type { LayerDefinition, LayerId, LayerCategory, LayerSection, LayerRegistry } from '@/layers/types';
import { earthquakes } from '@/layers/earthquakes';
import { ships } from '@/layers/ships';
import { airports } from '@/layers/airports';
import { commodities } from '@/layers/commodities';
import { cropAreas } from '@/layers/crop-areas';
import { footprints } from '@/layers/footprints';
import { travelTrips } from '@/layers/travel-trips';
import { travelTracks } from '@/layers/travel-tracks';

const allDefinitions: readonly LayerDefinition[] = [
  earthquakes,
  ships,
  airports,
  commodities,
  cropAreas,
  footprints,
  travelTrips,
  travelTracks,
];

function createRegistry(definitions: readonly LayerDefinition[]): LayerRegistry {
  const layerMap = new Map<LayerId, LayerDefinition>();
  const categorySet = new Set<LayerCategory>();

  for (const def of definitions) {
    if (layerMap.has(def.id)) {
      throw new Error(`Duplicate layer id: "${def.id}"`);
    }
    layerMap.set(def.id, def);
    categorySet.add(def.category);
  }

  const categories = Array.from(categorySet).sort();

  return Object.freeze({
    layers: Object.freeze(new Map(layerMap)),

    getCategories: () => categories,

    getCategoriesBySection: (section: LayerSection) =>
      Array.from(categorySet)
        .filter((cat) => definitions.some((d) => d.category === cat && d.section === section))
        .sort(),

    getLayersByCategory: (category: LayerCategory) =>
      definitions
        .filter((d) => d.category === category)
        .sort((a, b) => a.name.localeCompare(b.name)),

    getLayer: (id: LayerId) => layerMap.get(id),

    getAllLayerIds: () => Array.from(layerMap.keys()),
  });
}

export const layerRegistry: LayerRegistry = createRegistry(allDefinitions);
