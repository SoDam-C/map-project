'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useTrips } from '@/hooks/useTrips';
import { usePhotos } from '@/hooks/usePhotos';
import { useTracks } from '@/hooks/useTracks';
import { useGpsPoints } from '@/hooks/useGpsPoints';
import { TravelControls } from './TravelControls';
import { TravelLayerPanel, DEFAULT_LAYERS, type TravelLayerState } from './TravelLayerPanel';
import { FootprintDetailPanel } from './FootprintDetailPanel';
import { TripDetailPanel } from './TripDetailPanel';
import { useFootprintLayer, FootprintLayerManager } from './FootprintLayerManager';
import { TripRouteLayer } from '@/components/footprint/TripRouteLayer';
import { GpsPointFog } from '@/components/footprint/GpsPointFog';
import { PhotoMarkerLayer } from '@/components/footprint/PhotoMarker';
import { PhotoUploader } from '@/components/footprint/PhotoUploader';
import { PhotoTimeline } from '@/components/footprint/PhotoTimeline';
import { TrackPanel } from '@/components/footprint/TrackPanel';
import { CelebrationOverlay } from '@/components/footprint/CelebrationOverlay';
import { ExplorerLevelBadge } from '@/components/footprint/ExplorerLevelBadge';
import type { AchievementStats } from '@/lib/achievements';

type DetailPanel = 'none' | 'footprint' | 'trips' | 'tracks' | 'photos';

export function TravelPage() {
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [layers, setLayers] = useState<TravelLayerState>({ ...DEFAULT_LAYERS });
  const [detailPanel, setDetailPanel] = useState<DetailPanel>('none');
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);

  const isDark = true;
  const accentColor = '#6366f1';

  // Hooks
  const footprintLayer = useFootprintLayer(mapInstance, layers.footprints);
  const { trips, createTrip, updateTrip, addWaypoint, deleteTrip, getTripsList, getTripDistance } = useTrips();
  const { photos, importPhoto, importStatus, deletePhoto, getPhotosByDate } = usePhotos();
  const { tracks } = useTracks();
  const { data: gpsData, loading: gpsLoading } = useGpsPoints(tracks);

  const tripsList = getTripsList();
  const photosByDate = getPhotosByDate();

  const achievementStats: AchievementStats = useMemo(() => ({
    footprintStats: footprintLayer.footprintStats,
    activeCountry: footprintLayer.activeCountry,
    totalTrips: tripsList.length,
    totalPhotos: Object.keys(photos).length,
    totalDistance: tripsList.reduce((sum, t) => sum + getTripDistance(t), 0),
  }), [footprintLayer.footprintStats, footprintLayer.activeCountry, tripsList, photos, getTripDistance]);

  // Layer toggle
  const handleToggleLayer = useCallback((id: keyof TravelLayerState) => {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Open detail panel
  const handleOpenDetail = useCallback((id: keyof TravelLayerState) => {
    if (id === 'footprints') setDetailPanel('footprint');
    else if (id === 'trips') setDetailPanel('trips');
    else if (id === 'tracks') setDetailPanel('tracks');
    else if (id === 'photos') setDetailPanel('photos');
  }, []);

  const handleMapReady = useCallback((map: MapLibreMap) => {
    setMapInstance(map);
  }, []);

  // Trip/Photo click → fly to
  const handleTripClick = useCallback((trip: import('@/lib/types').TripRecord) => {
    if (!mapInstance || trip.waypoints.length === 0) return;
    const first = trip.waypoints[0];
    mapInstance.flyTo({ center: [first.lng, first.lat], zoom: 8, duration: 1000 });
  }, [mapInstance]);

  const handlePhotoClick = useCallback((photo: import('@/lib/types').PhotoRecord) => {
    mapInstance?.flyTo({ center: [photo.lng, photo.lat], zoom: 14, duration: 1000 });
  }, [mapInstance]);

  const handleImportPhoto = async (file: File) => await importPhoto(file);

  // Country info bar (top center)
  const countryConfig = footprintLayer.countryConfig;

  return (
    <main className="relative h-full w-full">
      {/* Celebration */}
      <CelebrationOverlay
        active={footprintLayer.celebration.active}
        type={footprintLayer.celebration.type}
        message={footprintLayer.celebration.message}
        onComplete={() => footprintLayer.setCelebration(prev => ({ ...prev, active: false }))}
      />

      {/* Map + Controls */}
      <TravelControls
        onMapReady={handleMapReady}
        isDark={isDark}
        accentColor={accentColor}
      />

      {/* Country info bar */}
      {layers.footprints && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-black/50 backdrop-blur-xl rounded-lg p-1 border border-white/10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white">
            <span>{countryConfig.flag}</span>
            <span className="font-medium">{countryConfig.name}</span>
          </div>
          <div className="w-px bg-white/10" />
          {countryConfig.levels.map(lv => (
            <button
              key={lv}
              onClick={() => footprintLayer.handleLevelChange(lv)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                footprintLayer.currentLevel === lv
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              {countryConfig.levelNames[lv] || `L${lv}`}
            </button>
          ))}
        </div>
      )}

      {/* Left: Layer panel */}
      <TravelLayerPanel
        layers={layers}
        onToggle={handleToggleLayer}
        onOpenDetail={handleOpenDetail}
        isOpen={layerPanelOpen}
        onTogglePanel={() => setLayerPanelOpen(prev => !prev)}
        isDark={isDark}
        accentColor={accentColor}
      />

      {/* Map layers */}
      <FootprintLayerManager
        map={mapInstance}
        visible={layers.footprints}
        countryFootprints={footprintLayer.countryFootprints}
        activeCountry={footprintLayer.activeCountry}
        currentLevel={footprintLayer.currentLevel}
        isDark={isDark}
      />

      <TripRouteLayer
        map={mapInstance}
        trips={trips}
        visible={layers.trips}
        accentColor={accentColor}
      />

      {layers.tracks && (
        <GpsPointFog
          map={mapInstance}
          gpsData={gpsData}
          loading={gpsLoading}
          isDark={isDark}
        />
      )}

      <PhotoMarkerLayer
        map={mapInstance}
        photos={photos}
        visible={layers.photos}
        onPhotoClick={handlePhotoClick}
      />

      {/* Right: Detail panels */}
      <FootprintDetailPanel
        visible={detailPanel === 'footprint'}
        onClose={() => setDetailPanel('none')}
        countryStats={footprintLayer.countryStats}
        countryConfig={countryConfig}
        achievementStats={achievementStats}
        getOverallPercentage={footprintLayer.getOverallPercentage}
        getCountryLitAdcodes={footprintLayer.getCountryLitAdcodes}
        resetFootprints={footprintLayer.resetFootprints}
        activeCountry={footprintLayer.activeCountry}
        currentLevel={footprintLayer.currentLevel}
        onLevelChange={footprintLayer.handleLevelChange}
        isDark={isDark}
      />

      <TripDetailPanel
        visible={detailPanel === 'trips'}
        onClose={() => setDetailPanel('none')}
        trips={tripsList}
        createTrip={createTrip}
        updateTrip={updateTrip}
        addWaypoint={addWaypoint}
        deleteTrip={deleteTrip}
        getTripDistance={getTripDistance}
        onTripClick={handleTripClick}
        isDark={isDark}
      />

      {/* Tracks detail panel */}
      {detailPanel === 'tracks' && (
        <div className="absolute top-0 right-0 z-20 h-full w-[360px] max-w-[85vw] bg-gray-950/95 backdrop-blur-xl border-l border-white/10">
          <div className="flex items-center justify-between px-4 h-12 border-b border-white/5">
            <h2 className="text-sm font-semibold text-gray-300">轨迹</h2>
            <button onClick={() => setDetailPanel('none')} className="p-1 rounded hover:bg-white/10 text-gray-400">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <TrackPanel map={mapInstance} isDark={isDark} accentColor={accentColor} />
          </div>
        </div>
      )}

      {/* Photos detail panel */}
      {detailPanel === 'photos' && (
        <div className="absolute top-0 right-0 z-20 h-full w-[360px] max-w-[85vw] bg-gray-950/95 backdrop-blur-xl border-l border-white/10">
          <div className="flex items-center justify-between px-4 h-12 border-b border-white/5">
            <h2 className="text-sm font-semibold text-gray-300">照片</h2>
            <button onClick={() => setDetailPanel('none')} className="p-1 rounded hover:bg-white/10 text-gray-400">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <PhotoUploader onImport={handleImportPhoto} importStatus={importStatus} isDark={isDark} />
            <PhotoTimeline
              photosByDate={photosByDate}
              onDeletePhoto={deletePhoto}
              onPhotoClick={handlePhotoClick}
              isDark={isDark}
            />
          </div>
        </div>
      )}
    </main>
  );
}
