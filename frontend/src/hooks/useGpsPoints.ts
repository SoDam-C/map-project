'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getTrackPoints, initIndexedDB } from '@/lib/indexeddb';
import type { GpsTrack, GpsPoint } from '@/lib/types';
import type { FeatureCollection, Feature, Point, LineString } from 'geojson';
import { getSeedTracks } from '@/data/seed-tracks';

export interface TrackInfo {
  trackId: string;
  title: string;
  startTime: number;
  endTime: number;
  /** Speed at each vertex (parallel to the line coordinates) */
  speeds: number[];
}

export interface GpsPointsData {
  points: FeatureCollection<Point>;
  /** One LineString per track (full coordinates, for fog corridor + line rendering) */
  lines: FeatureCollection<LineString>;
  totalPoints: number;
  tracks: TrackInfo[];
}

function calcSpeed(p1: GpsPoint, p2: GpsPoint): number {
  const dt = (p2.timestamp - p1.timestamp) / 1000;
  if (dt <= 0) return p2.speed ?? 0;
  const dLat = (p2.lat - p1.lat) * 111000;
  const dLng = (p2.lng - p1.lng) * 111000 * Math.cos(p1.lat * Math.PI / 180);
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  return dist / dt;
}

/** Smooth speeds with a moving-average window to reduce visual jitter. */
function smoothSpeeds(raw: number[], window: number = 3): number[] {
  const out: number[] = [];
  const half = Math.floor(window / 2);
  for (let i = 0; i < raw.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(raw.length - 1, i + half); j++) {
      sum += raw[j];
      count++;
    }
    out.push(sum / count);
  }
  return out;
}

/**
 * Load GPS points from all tracks, convert to GeoJSON for fog rendering.
 * Falls back to seed data when IndexedDB is empty.
 */
export function useGpsPoints(tracks: GpsTrack[]) {
  const [data, setData] = useState<GpsPointsData>({
    points: { type: 'FeatureCollection', features: [] },
    lines: { type: 'FeatureCollection', features: [] },
    totalPoints: 0,
    tracks: [],
  });
  const [loading, setLoading] = useState(false);
  const loadRef = useRef(false);

  const loadAllPoints = useCallback(async () => {
    setLoading(true);
    try {
      await initIndexedDB();

      const pointFeatures: Feature<Point>[] = [];
      const lineFeatures: Feature<LineString>[] = [];
      const trackInfos: TrackInfo[] = [];
      let totalCount = 0;

      // If no tracks from IndexedDB, use seed data
      let effectiveTracks = tracks;
      if (tracks.length === 0) {
        const seedData = getSeedTracks();
        effectiveTracks = seedData.map(s => s.track);

        for (const seed of seedData) {
          for (let pi = 0; pi < seed.points.length; pi++) {
            const p = seed.points[pi];
            const speed = (pi > 0)
              ? ((seed.points[pi - 1].speed ?? 0) + (p.speed ?? 0)) / 2 || calcSpeed(seed.points[pi - 1], p)
              : (p.speed ?? 0);
            pointFeatures.push({
              type: 'Feature',
              properties: { trackId: seed.track.id, timestamp: p.timestamp, speed },
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            });
          }

          const coords: [number, number][] = seed.points.map(p => [p.lng, p.lat] as [number, number]);
          if (coords.length >= 2) {
            lineFeatures.push({
              type: 'Feature',
              properties: { trackId: seed.track.id },
              geometry: { type: 'LineString', coordinates: coords },
            });
          }

          // Compute per-vertex speeds and smooth them
          const rawSpeeds: number[] = seed.points.map((p, i) => {
            if (i === 0) return p.speed ?? 0;
            return ((seed.points[i - 1].speed ?? 0) + (p.speed ?? 0)) / 2
              || calcSpeed(seed.points[i - 1], p);
          });
          const speeds = smoothSpeeds(rawSpeeds);

          totalCount += seed.points.length;

          trackInfos.push({
            trackId: seed.track.id,
            title: seed.track.title ?? '',
            startTime: new Date(seed.track.startTime).getTime(),
            endTime: new Date(seed.track.endTime).getTime(),
            speeds,
          });
        }
      } else {
        // Load from IndexedDB
        const MAX_POINTS = 5000;
        for (const track of effectiveTracks) {
          if (totalCount >= MAX_POINTS) break;
          const remaining = MAX_POINTS - totalCount;
          const limit = Math.min(remaining, 2000);

          const points = await getTrackPoints(track.id, 0, limit) as GpsPoint[];
          if (points.length === 0) continue;

          const step = Math.max(1, Math.floor(points.length / 500));
          const sampled = points.filter((_, i) => i % step === 0);

          for (let si = 0; si < sampled.length; si++) {
            const p = sampled[si];
            const speed = (si > 0)
              ? ((sampled[si - 1].speed ?? 0) + (p.speed ?? 0)) / 2 || calcSpeed(sampled[si - 1], p)
              : (p.speed ?? 0);
            pointFeatures.push({
              type: 'Feature',
              properties: { trackId: track.id, timestamp: p.timestamp, speed },
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            });
          }

          const coords: [number, number][] = points.map(p => [p.lng, p.lat]);
          if (coords.length >= 2) {
            lineFeatures.push({
              type: 'Feature',
              properties: { trackId: track.id },
              geometry: { type: 'LineString', coordinates: coords },
            });
          }

          const rawSpeeds: number[] = points.map((p, i) => {
            if (i === 0) return p.speed ?? 0;
            return ((points[i - 1].speed ?? 0) + (p.speed ?? 0)) / 2
              || calcSpeed(points[i - 1], p);
          });
          const speeds = smoothSpeeds(rawSpeeds);

          totalCount += points.length;

          trackInfos.push({
            trackId: track.id,
            title: track.title ?? '',
            startTime: new Date(track.startTime).getTime(),
            endTime: new Date(track.endTime).getTime(),
            speeds,
          });
        }
      }

      setData({
        points: { type: 'FeatureCollection', features: pointFeatures },
        lines: { type: 'FeatureCollection', features: lineFeatures },
        totalPoints: totalCount,
        tracks: trackInfos,
      });
    } catch (e) {
      console.error('[useGpsPoints] Failed to load points:', e);
    } finally {
      setLoading(false);
    }
  }, [tracks]);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    loadAllPoints();
  }, [loadAllPoints]);

  return { data, loading, reload: loadAllPoints };
}
