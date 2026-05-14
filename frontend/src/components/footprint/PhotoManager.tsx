'use client';

import type { Map as MapLibreMap } from 'maplibre-gl';
import { PhotoMarkerLayer } from './PhotoMarker';

interface PhotoManagerProps {
  map: MapLibreMap | null;
  visible: boolean;
  photos: Record<string, import('@/lib/types').PhotoRecord>;
  onPhotoClick?: (photo: import('@/lib/types').PhotoRecord) => void;
}

export function PhotoManager({ map, visible, photos, onPhotoClick }: PhotoManagerProps) {
  return (
    <PhotoMarkerLayer
      map={map}
      photos={photos}
      visible={visible}
      onPhotoClick={onPhotoClick}
    />
  );
}
