'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Globe, ZoomIn, ZoomOut, RotateCcw, Lock } from 'lucide-react';
import { basemapList } from '@/lib/mapStyles';
import type { AccentColors } from '@/lib/theme';

const CLOSE_DELAY = 2000;

interface MapControlsProps {
  currentBasemap: string;
  onSelectBasemap: (id: string) => void;
  onOpenGuide: (keyHint?: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  isDark: boolean;
  accent: AccentColors;
}

export function MapControls({
  currentBasemap,
  onSelectBasemap,
  onOpenGuide,
  onZoomIn,
  onZoomOut,
  onReset,
  isDark,
  accent,
}: MapControlsProps) {
  const inactiveBtn = isDark
    ? 'bg-black/40 text-gray-200 border border-white/10 hover:bg-black/50'
    : 'bg-white/60 text-gray-700 border border-black/10 hover:bg-white/70';
  const menuBgClass = isDark
    ? 'bg-black/50 backdrop-blur-xl border border-white/10'
    : 'bg-white/70 backdrop-blur-xl border border-black/10';

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }, [clearTimer]);

  const handleMouseEnter = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleMouseLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        clearTimer();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, clearTimer]);

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
      {/* 底图选择器 */}
      <div
        ref={menuRef}
        className="relative"
        onMouseEnter={open ? handleMouseEnter : undefined}
        onMouseLeave={open ? handleMouseLeave : undefined}
      >
        <button
          onClick={() => {
            clearTimer();
            setOpen((prev) => !prev);
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${open ? '' : inactiveBtn}`}
          style={open ? { backgroundColor: accent.bg, color: '#fff' } : undefined}
          title="切换底图"
        >
          <Globe size={18} />
        </button>
        {open && (
          <div className={`absolute top-12 right-0 rounded-lg shadow-xl py-1 min-w-[160px] ${menuBgClass}`}>
            {basemapList.map((style) => {
              const unavailable = style.requiresKey;
              const isActive = currentBasemap === style.id;
              const activeStyle = isActive ? { backgroundColor: accent.bg, color: '#fff' } : undefined;
              const unavailableClass = unavailable ? 'text-yellow-500/80 hover:bg-yellow-500/10 cursor-pointer' : '';
              const normalClass = !isActive && !unavailable
                ? (isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-black/5')
                : '';
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    if (unavailable) {
                      setOpen(false);
                      onOpenGuide(style.keyHint);
                    } else {
                      onSelectBasemap(style.id);
                    }
                  }}
                  title={unavailable ? `点击查看配置步骤` : style.name}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${unavailableClass} ${normalClass}`}
                  style={activeStyle}
                >
                  {unavailable ? (
                    <Lock size={12} className="shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  )}
                  <span className="flex-1 truncate">{style.name}</span>
                  {unavailable && (
                    <span className="text-[10px] text-gray-600 shrink-0">需Key</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button onClick={onZoomIn} className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${inactiveBtn}`} title="放大">
        <ZoomIn size={18} />
      </button>
      <button onClick={onZoomOut} className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${inactiveBtn}`} title="缩小">
        <ZoomOut size={18} />
      </button>
      <button onClick={onReset} className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${inactiveBtn}`} title="重置视图">
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
