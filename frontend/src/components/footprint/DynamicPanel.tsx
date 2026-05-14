'use client';

import {
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  BarChart3,
  Trophy,
  Camera,
  Route,
  Share2,
  Navigation,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type PanelTab = 'stats' | 'achievements' | 'photos' | 'trips' | 'tracks' | 'share' | 'wishlist';

interface TabDef {
  id: PanelTab;
  icon: ReactNode;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'stats', icon: <BarChart3 size={20} />, label: '统计' },
  { id: 'achievements', icon: <Trophy size={20} />, label: '成就' },
  { id: 'wishlist', icon: <Heart size={20} />, label: '愿望' },
  { id: 'photos', icon: <Camera size={20} />, label: '照片' },
  { id: 'trips', icon: <Route size={20} />, label: '行程' },
  { id: 'tracks', icon: <Navigation size={20} />, label: '轨迹' },
  { id: 'share', icon: <Share2 size={20} />, label: '分享' },
];

interface DynamicPanelProps {
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  visible: boolean;
  onToggle: () => void;
  children: ReactNode;
  isDark: boolean;
  accentColor: string;
}

export function DynamicPanel({
  activeTab,
  onTabChange,
  visible,
  onToggle,
  children,
  isDark,
  accentColor,
}: DynamicPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  // 点击面板外部 → 收起
  useEffect(() => {
    if (!visible) return;
    const handlePointerDown = (e: PointerEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (panel.contains(e.target as Node)) return;
      onToggle();
    };
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [visible, onToggle]);

  // 触摸向左滑 → 收起
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) && dx < 0) {
      swiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swiping.current) {
      onToggle();
      swiping.current = false;
    }
  }, [onToggle]);

  const handleTabClick = useCallback((tab: PanelTab) => {
    onTabChange(tab);
    if (!visible) {
      onToggle();
    }
  }, [visible, onTabChange, onToggle]);

  const bg = isDark ? 'bg-gray-950/95' : 'bg-white/95';
  const border = isDark ? 'border-white/10' : 'border-gray-200';
  const tabInactive = isDark ? 'text-gray-500' : 'text-gray-400';
  const tabActiveBg = isDark ? 'bg-white/10' : 'bg-gray-100';

  // 面板总宽 360px，tab 在右边缘 48px
  // 隐藏时 translate-x(-312px)：内容区滑出屏幕，tab 留在屏幕左边缘
  return (
    <div
      ref={panelRef}
      className={`
        absolute top-0 left-0 z-20 h-full
        w-[360px] max-w-[85vw]
        ${bg}
        backdrop-blur-xl
        transition-transform duration-300 ease-in-out
        flex flex-row
        select-none
        ${visible ? 'translate-x-0' : '-translate-x-[312px]'}
      `}
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 面板内容区（左侧 312px） */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 overflow-hidden">
        <div className={`flex items-center justify-between px-4 h-12 shrink-0 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>

      {/* Tab 栏（右边缘 48px，滑出时留在屏幕上） */}
      <div className={`w-12 shrink-0 flex flex-col items-center py-3 gap-1 border-l ${border}`}>
        <button
          onClick={onToggle}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors mb-1 ${
            isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          {visible
            ? <ChevronRight size={18} />
            : <ChevronLeft size={18} />
          }
        </button>

        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                ${isActive ? tabActiveBg : ''}
                ${isActive ? '' : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')}
              `}
              style={isActive ? { color: accentColor } : undefined}
              title={tab.label}
            >
              {tab.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
