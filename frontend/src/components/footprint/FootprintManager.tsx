'use client';

import type { AdminLevel } from '@/lib/adminRegions';

interface FootprintManagerProps {
  map: import('maplibre-gl').Map | null;
  visible: boolean;
  accentColor: string;
  forcedLevel?: AdminLevel | null;
  onLevelChange?: (level: AdminLevel) => void;
}

/**
 * FootprintManager is now a thin wrapper.
 * All map layer management (source, layers, filters, click) is handled
 * imperatively in FootprintPage.tsx for reliable timing.
 */
export function FootprintManager(_props: FootprintManagerProps) {
  return null;
}
