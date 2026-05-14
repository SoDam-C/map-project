'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileJson, AlertTriangle, Check, X } from 'lucide-react';
import Link from 'next/link';
import { initStorage, save } from '@/lib/storage';
import type { DiaryStore, DiaryTripStore } from '@/lib/types';

export default function JsonImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select');
  const [data, setData] = useState<{ diary?: DiaryStore; trips?: DiaryTripStore } | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [conflictCount, setConflictCount] = useState(0);
  const [importCount, setImportCount] = useState(0);

  const handleFile = useCallback((file: File) => {
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        // 检测格式
        if (json.entries && typeof json.entries === 'object') {
          // 导出格式
          setData({ diary: json.entries, trips: json.trips || undefined });
        } else if (typeof json === 'object' && !json.entries && !json.trips) {
          // 纯 diary store 格式
          setData({ diary: json });
        } else {
          setError('无法识别的 JSON 格式');
          return;
        }

        // 计算冲突
        const existing = JSON.parse(localStorage.getItem('map-diary') || '{}');
        const incoming = data?.diary || json.entries || json;
        const conflicts = Object.keys(incoming).filter(id => id in existing).length;
        setConflictCount(conflicts);
        setImportCount(Object.keys(incoming).length);
        setStep('preview');
      } catch {
        setError('JSON 解析失败');
      }
    };
    reader.readAsText(file);
  }, [data]);

  const handleImport = useCallback((mode: 'merge' | 'replace') => {
    if (!data) return;

    if (mode === 'replace') {
      if (data.diary) save('diary', data.diary);
      if (data.trips) save('diary-trips', data.trips);
    } else {
      // merge：本地优先
      const existingDiary = JSON.parse(localStorage.getItem('map-diary') || '{}');
      if (data.diary) {
        const merged = { ...existingDiary };
        for (const [id, entry] of Object.entries(data.diary)) {
          if (!(id in merged)) merged[id] = entry;
        }
        save('diary', merged);
      }
      if (data.trips) {
        const existingTrips = JSON.parse(localStorage.getItem('map-diary-trips') || '{}');
        const merged = { ...existingTrips };
        for (const [id, trip] of Object.entries(data.trips)) {
          if (!(id in merged)) merged[id] = trip;
        }
        save('diary-trips', merged);
      }
    }

    setStep('done');
  }, [data]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/diary" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-medium text-sm flex items-center gap-2">
            <FileJson size={16} />
            导入数据
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 'select' && (
          <div
            className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-white/40 transition-colors cursor-pointer"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => { if ((e.target as HTMLInputElement).files?.[0]) handleFile((e.target as HTMLInputElement).files![0]); };
              input.click();
            }}
          >
            <Upload size={48} className="mx-auto mb-4 text-[var(--color-text-secondary)] opacity-40" />
            <p className="text-lg mb-2">选择 JSON 文件</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              支持从「导出 → JSON」导出的文件
            </p>
            {error && (
              <p className="text-red-400 text-sm mt-3 flex items-center gap-1 justify-center">
                <X size={14} />{error}
              </p>
            )}
          </div>
        )}

        {step === 'preview' && data && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-sm mb-1">文件：{fileName}</div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="text-center p-2 rounded-lg bg-blue-500/10">
                  <div className="text-xl font-bold text-blue-400">{importCount}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">篇日记</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                  <div className="text-xl font-bold text-yellow-400">{conflictCount}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">冲突（ID 重复）</div>
                </div>
              </div>
              {data.trips && (
                <div className="text-xs text-[var(--color-text-secondary)] mt-2">
                  包含 {Object.keys(data.trips).length} 个旅行分组
                </div>
              )}
            </div>

            {conflictCount > 0 && (
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-400 mb-1">检测到 {conflictCount} 个冲突</div>
                  <div className="text-[var(--color-text-secondary)]">
                    「合并」保留本地版本，「覆盖」用导入数据替换
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={() => handleImport('merge')}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                合并（保留本地）
              </button>
              {conflictCount > 0 && (
                <button
                  onClick={() => handleImport('replace')}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                >
                  覆盖
                </button>
              )}
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
              {importCount} 篇日记已导入
            </p>
            <Link href="/diary" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
              查看日记
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
