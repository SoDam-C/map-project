'use client';

import exifr from 'exifr';
import type { ExifGpsInfo } from '@/lib/types';

/**
 * 从照片文件中提取 GPS 信息
 * @returns GPS 信息，如果没有则返回 null
 */
export async function extractGps(file: File): Promise<ExifGpsInfo | null> {
  try {
    const gps = await exifr.gps(file);
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      return {
        latitude: gps.latitude,
        longitude: gps.longitude,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 从照片文件中提取拍摄时间
 * @returns ISO 时间字符串，如果没有则返回 null
 */
export async function extractDateTaken(file: File): Promise<string | null> {
  try {
    const exif = await exifr.parse(file, { tiff: true, exif: true, gps: false });
    if (exif?.DateTimeOriginal) {
      return new Date(exif.DateTimeOriginal).toISOString();
    }
    if (exif?.CreateDate) {
      return new Date(exif.CreateDate).toISOString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 生成照片缩略图（base64）
 */
export function generateThumbnail(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
