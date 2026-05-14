'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Image, MapPin, Calendar, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';

interface ExifPhoto {
  file: File;
  lat?: number;
  lng?: number;
  date?: string;
  error?: string;
}

interface ImportedEntry {
  date: string;
  lat?: number;
  lng?: number;
  photoUrl: string;
  caption: string;
}

/**
 * 从照片 EXIF 中提取 GPS 和时间信息
 * 支持格式：JPEG, HEIC, TIFF
 */
function extractExifData(file: File): Promise<{ lat?: number; lng?: number; date?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target?.result as ArrayBuffer);

        // 查找 EXIF 头
        if (view.getUint16(0, false) !== 0xFFD8) {
          // 不是 JPEG，尝试其他方式
          resolve({ date: file.lastModified ? new Date(file.lastModified).toISOString() : undefined });
          return;
        }

        let offset = 2;
        while (offset < view.byteLength - 4) {
          const marker = view.getUint16(offset, false);
          if (marker === 0xFFE1) {
            // APP1 - EXIF
            const exifStart = offset + 4;
            if (view.getUint32(exifStart, false) !== 0x45786966) {
              // No "Exif" header
              break;
            }
            const tiffStart = exifStart + 6;
            const isLittleEndian = view.getUint16(tiffStart, false) === 0x4949;

            const getU16 = (o: number) => view.getUint16(o, isLittleEndian);
            const getU32 = (o: number) => view.getUint32(o, isLittleEndian);
            const getS32 = (o: number) => view.getInt32(o, isLittleEndian);
            const getRational = (o: number) => ({
              num: getU32(o),
              den: getU32(o + 4),
            });

            const ifdOffset = tiffStart + getU32(tiffStart + 4);
            const numEntries = getU16(ifdOffset);

            interface GpsCoord { degrees: { num: number; den: number }; minutes: { num: number; den: number }; seconds: { num: number; den: number } }
            let gpsLat: GpsCoord | undefined;
            let gpsLng: GpsCoord | undefined;
            let gpsLatRef = 'N';
            let gpsLngRef = 'E';
            let dateTimeStr: string | undefined;

            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdOffset + 2 + i * 12;
              const tag = getU16(entryOffset);
              const type = getU16(entryOffset + 2);
              const count = getU32(entryOffset + 4);
              const valueOffset = entryOffset + 8;

              // DateTimeOriginal (0x9003) or DateTime (0x0132)
              if ((tag === 0x9003 || tag === 0x0132) && type === 2) {
                const strOffset = count <= 4 ? valueOffset : tiffStart + getU32(valueOffset);
                let str = '';
                for (let j = 0; j < count - 1; j++) {
                  const ch = view.getUint8(strOffset + j);
                  if (ch === 0) break;
                  str += String.fromCharCode(ch);
                }
                if (str) dateTimeStr = str;
              }

              // GPS IFD pointer (0x8825)
              if (tag === 0x8825) {
                const gpsIfdOffset = tiffStart + getU32(valueOffset);
                const gpsNumEntries = getU16(gpsIfdOffset);

                for (let j = 0; j < gpsNumEntries; j++) {
                  const gpsEntryOffset = gpsIfdOffset + 2 + j * 12;
                  const gpsTag = getU16(gpsEntryOffset);
                  const gpsType = getU16(gpsEntryOffset + 2);
                  const gpsCount = getU32(gpsEntryOffset + 4);
                  const gpsValueOffset = gpsEntryOffset + 8;

                  const readRational = () => {
                    const offset = gpsCount * 8 <= 4 ? gpsValueOffset : tiffStart + getU32(gpsValueOffset);
                    return getRational(offset);
                  };

                  // GPSLatitudeRef (0x0001)
                  if (gpsTag === 0x0001) {
                    gpsLatRef = String.fromCharCode(view.getUint8(gpsValueOffset));
                  }
                  // GPSLatitude (0x0002)
                  if (gpsTag === 0x0002) {
                    const offset = gpsCount * 8 <= 4 ? gpsValueOffset : tiffStart + getU32(gpsValueOffset);
                    gpsLat = {
                      degrees: getRational(offset),
                      minutes: getRational(offset + 8),
                      seconds: getRational(offset + 16),
                    };
                  }
                  // GPSLongitudeRef (0x0003)
                  if (gpsTag === 0x0003) {
                    gpsLngRef = String.fromCharCode(view.getUint8(gpsValueOffset));
                  }
                  // GPSLongitude (0x0004)
                  if (gpsTag === 0x0004) {
                    const offset = gpsCount * 8 <= 4 ? gpsValueOffset : tiffStart + getU32(gpsValueOffset);
                    gpsLng = {
                      degrees: getRational(offset),
                      minutes: getRational(offset + 8),
                      seconds: getRational(offset + 16),
                    };
                  }
                }
              }
            }

            // 计算经纬度
            let lat: number | undefined;
            let lng: number | undefined;
            if (gpsLat && gpsLng) {
              lat = gpsLat.degrees.num / gpsLat.degrees.den +
                    gpsLat.minutes.num / gpsLat.minutes.den / 60 +
                    gpsLat.seconds.num / gpsLat.seconds.den / 3600;
              if (gpsLatRef === 'S') lat = -lat;

              lng = gpsLng.degrees.num / gpsLng.degrees.den +
                    gpsLng.minutes.num / gpsLng.minutes.den / 60 +
                    gpsLng.seconds.num / gpsLng.seconds.den / 3600;
              if (gpsLngRef === 'W') lng = -lng;
            }

            // 解析日期
            let date: string | undefined;
            if (dateTimeStr) {
              // 格式: "2025:01:15 14:30:00"
              const match = dateTimeStr.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
              if (match) {
                date = new Date(
                  parseInt(match[1]),
                  parseInt(match[2]) - 1,
                  parseInt(match[3]),
                  parseInt(match[4]),
                  parseInt(match[5]),
                  parseInt(match[6]),
                ).toISOString();
              }
            }

            resolve({ lat, lng, date });
            return;
          }
          offset += 2 + view.getUint16(offset + 2, false);
        }

        resolve({ date: file.lastModified ? new Date(file.lastModified).toISOString() : undefined });
      } catch {
        resolve({ date: file.lastModified ? new Date(file.lastModified).toISOString() : undefined });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function ImportPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<ExifPhoto[]>([]);
  const [processing, setProcessing] = useState(false);
  const [imported, setImported] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select');

  const handleFiles = useCallback(async (files: FileList) => {
    setProcessing(true);
    const results: ExifPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = await extractExifData(file);
      results.push({
        file,
        lat: data.lat,
        lng: data.lng,
        date: data.date,
        error: !data.lat ? '无 GPS 信息' : undefined,
      });
    }

    setPhotos(results);
    setProcessing(false);
    setStep('preview');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleImport = useCallback(async () => {
    if (photos.length === 0) return;

    // 按日期分组
    const byDate = new Map<string, ExifPhoto[]>();
    photos.forEach(p => {
      const date = p.date ? p.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(p);
    });

    // 为每个日期创建日记骨架
    const diaryStore = JSON.parse(localStorage.getItem('map-diary') || '{}');

    for (const [date, datePhotos] of byDate) {
      const id = `diary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const avgLat = datePhotos.reduce((s, p) => s + (p.lat || 0), 0) / datePhotos.filter(p => p.lat).length;
      const avgLng = datePhotos.reduce((s, p) => s + (p.lng || 0), 0) / datePhotos.filter(p => p.lng).length;

      const photoRefs = datePhotos.map((p, i) => ({
        id: `photo-${Date.now()}-${i}`,
        url: URL.createObjectURL(p.file),
        caption: p.file.name.replace(/\.[^.]+$/, ''),
      }));

      diaryStore[id] = {
        id,
        type: 'memory_entry',
        date,
        startTime: datePhotos[0]?.date || now,
        title: `${date} 的照片`,
        lat: isNaN(avgLat) ? undefined : avgLat,
        lng: isNaN(avgLng) ? undefined : avgLng,
        content: '',
        photoRefs,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
    }

    localStorage.setItem('map-diary', JSON.stringify(diaryStore));
    setStep('done');
    setImported(true);
  }, [photos]);

  const withGps = photos.filter(p => p.lat && p.lng).length;
  const withoutGps = photos.length - withGps;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/diary" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-medium text-sm">导入照片</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 'select' && (
          <div
            className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-white/40 transition-colors cursor-pointer"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*';
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files.length > 0) handleFiles(files);
              };
              input.click();
            }}
          >
            <Upload size={48} className="mx-auto mb-4 text-[var(--color-text-secondary)] opacity-40" />
            <p className="text-lg mb-2">拖拽照片到此处或点击选择</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              支持 JPEG/HEIC，自动提取 GPS 坐标和时间
            </p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* 摘要 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xl font-bold">{photos.length}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">总照片</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xl font-bold text-green-400">{withGps}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">有 GPS</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-xl font-bold text-yellow-400">{withoutGps}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">无 GPS</div>
              </div>
            </div>

            {/* 照片列表 */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {photos.map((photo, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                    <img
                      src={URL.createObjectURL(photo.file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{photo.file.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {photo.date ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {photo.date.slice(0, 16).replace('T', ' ')}
                        </span>
                      ) : '未知时间'}
                    </div>
                  </div>
                  <div className="text-xs">
                    {photo.lat && photo.lng ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <MapPin size={10} />
                        {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-yellow-400 flex items-center gap-1">
                        <AlertCircle size={10} />
                        无定位
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={handleImport}
                disabled={processing || photos.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {processing ? '处理中...' : `创建 ${new Set(photos.map(p => p.date?.slice(0, 10))).size} 篇日记`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">导入完成</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              已创建日记骨架，请在日记中补充文字内容
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/diary"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                查看日记
              </Link>
              <button
                onClick={() => { setStep('select'); setPhotos([]); setImported(false); }}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
              >
                继续导入
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
