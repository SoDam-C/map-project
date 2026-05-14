'use client';

import { useRef, useCallback, useState } from 'react';
import { Camera, Upload, X, MapPin, Calendar } from 'lucide-react';
import type { PhotoRecord, PhotoImportStatus } from '@/lib/types';

interface PhotoUploaderProps {
  onImport: (file: File) => Promise<PhotoRecord | null>;
  importStatus: PhotoImportStatus;
  isDark: boolean;
}

export function PhotoUploader({ onImport, importStatus, isDark }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await onImport(file);
      }
    }
  }, [onImport]);

  const bg = isDark ? 'bg-gray-900/80 border-white/10' : 'bg-white/80 border-gray-200';
  const hoverBg = dragOver
    ? (isDark ? 'border-blue-400/50 bg-blue-500/10' : 'border-blue-400 bg-blue-50')
    : '';
  const text = isDark ? 'text-gray-400' : 'text-gray-500';
  const subText = isDark ? 'text-gray-600' : 'text-gray-400';

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-4 rounded-lg border-2 border-dashed transition-colors ${bg} ${hoverBg}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="flex flex-col items-center gap-2">
          {importStatus === 'reading' || importStatus === 'extracting' || importStatus === 'geocoding' ? (
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <>
              <Camera size={20} className={text} />
              <span className={`text-xs ${text}`}>
                {importStatus === 'done' ? '导入成功！' : importStatus === 'error' ? '该照片无GPS信息' : '点击或拖拽导入照片'}
              </span>
              <span className={`text-[10px] ${subText}`}>
                支持含GPS信息的照片，自动定位到地图
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
