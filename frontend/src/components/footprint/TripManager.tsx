'use client';

import type { Map as MapLibreMap } from 'maplibre-gl';
import { TripRouteLayer } from './TripRouteLayer';

interface TripManagerProps {
  map: MapLibreMap | null;
  visible: boolean;
  trips: Record<string, import('@/lib/types').TripRecord>;
  accentColor: string;
}

export function TripManager({ map, visible, trips, accentColor }: TripManagerProps) {
  return (
    <TripRouteLayer
      map={map}
      trips={trips}
      visible={visible}
      accentColor={accentColor}
    />
  );
}
