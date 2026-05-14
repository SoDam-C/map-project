'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, Lock, BookOpen, ExternalLink } from 'lucide-react';
import { basemapList } from '@/lib/mapStyles';
import type { AccentColors } from '@/lib/theme';

interface GuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  highlightKey?: string | null;
  onShowFull?: () => void;
  isDark: boolean;
  accent: AccentColors;
}

const KEY_CARDS = [
  {
    key: 'NEXT_PUBLIC_MAPTILER_KEY',
    name: 'MapTiler（标准 / 卫星 / 地形图）',
    envVar: 'NEXT_PUBLIC_MAPTILER_KEY',
    check: () => basemapList.some(s => s.id === 'streets' && !s.requiresKey),
    registerUrl: 'https://maptiler.com',
    registerLabel: 'MapTiler 官网',
    steps: [
      '打开 {MapTiler 官网|https://maptiler.com} 注册免费账户',
      '进入 Dashboard → API Keys',
      '复制默认 Key（每月 10 万次免费请求）',
    ],
  },
  {
    key: 'NEXT_PUBLIC_TIANDITU_KEY',
    name: '天地图（中国官方地图）',
    envVar: 'NEXT_PUBLIC_TIANDITU_KEY',
    check: () => basemapList.some(s => s.id === 'tianditu' && !s.requiresKey),
    registerUrl: 'https://console.tianditu.gov.cn',
    registerLabel: '天地图开发者控制台',
    steps: [
      '访问 {天地图开发者控制台|https://console.tianditu.gov.cn} 注册账号',
      '创建应用 → 选择「浏览器端」类型',
      '复制生成的 Key',
    ],
  },
  {
    key: 'NEXT_PUBLIC_STADIA_KEY',
    name: 'Stadia Maps（户外 / 暗色风格）',
    envVar: 'NEXT_PUBLIC_STADIA_KEY',
    check: () => basemapList.some(s => s.id === 'stadia_dark' && !s.requiresKey),
    registerUrl: 'https://stadiamaps.com',
    registerLabel: 'Stadia Maps',
    steps: [
      '访问 {Stadia Maps|https://stadiamaps.com} 注册账号',
      '创建 API Token（有免费额度）',
      '复制 Token',
    ],
  },
];

/* ===== 主题色工具 ===== */

const t = (isDark: boolean) => ({
  overlay: 'bg-black/40 backdrop-blur-sm',
  modal: isDark
    ? 'bg-gray-900/95 border-white/10'
    : 'bg-white/95 border-black/10',
  headerBorder: isDark ? 'border-white/10' : 'border-black/10',
  title: isDark ? 'text-gray-100' : 'text-gray-900',
  body: isDark ? 'text-gray-300' : 'text-gray-600',
  subtle: isDark ? 'text-gray-500' : 'text-gray-400',
  muted: isDark ? 'text-gray-600' : 'text-gray-400',
  closeBtn: isDark
    ? 'text-gray-400 hover:text-white hover:bg-white/10'
    : 'text-gray-400 hover:text-gray-800 hover:bg-black/5',
  cardBg: isDark ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/10',
  cardInnerBorder: isDark ? 'border-white/10' : 'border-black/10',
  cardInnerBorderLight: isDark ? 'border-white/5' : 'border-black/5',
  infoBg: isDark ? 'bg-white/5' : 'bg-black/[0.03]',
  sectionBg: isDark ? 'bg-white/5' : 'bg-black/[0.03]',
  sectionStrong: isDark ? 'text-gray-200' : 'text-gray-800',
});

/** 解析步骤文本中的内联链接，语法：{显示文字|URL} */
function renderStepText(text: string, accent: AccentColors) {
  const parts = text.split(/(\{[^}]+\})/);
  return parts.map((part, i) => {
    const m = part.match(/^\{([^|]+)\|(.+)\}$/);
    if (m) {
      return (
        <a
          key={i}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: accent.text }}
          className="hover:opacity-80 transition-opacity"
        >
          {m[1]}
        </a>
      );
    }
    return part;
  });
}

function Step({ children, isDark, accent }: { children: React.ReactNode; isDark: boolean; accent: AccentColors }) {
  const colors = t(isDark);
  const content = typeof children === 'string' ? renderStepText(children, accent) : children;
  return (
    <div className="flex gap-3 py-2">
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: accent.bg }}
      >
        <Check size={10} />
      </div>
      <div className={`text-sm leading-relaxed ${colors.body}`}>{content}</div>
    </div>
  );
}

function KeySetupCard({
  name,
  envVar,
  steps,
  isConfigured,
  autoExpand,
  registerUrl,
  registerLabel,
  isDark,
  accent,
}: {
  name: string;
  envVar: string;
  steps: string[];
  isConfigured: boolean;
  autoExpand?: boolean;
  registerUrl: string;
  registerLabel: string;
  isDark: boolean;
  accent: AccentColors;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colors = t(isDark);

  useEffect(() => {
    if (autoExpand) setOpen(true);
  }, [autoExpand]);

  useEffect(() => {
    if (autoExpand && ref.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [autoExpand]);

  return (
    <div
      ref={ref}
      className={`rounded-lg border transition-colors ${
        autoExpand ? 'border-yellow-500/50 bg-yellow-500/5' : colors.cardBg
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Lock size={14} className="text-yellow-400" />
          )}
          <span className={`text-sm font-medium ${colors.title}`}>{name}</span>
        </div>
        <span className={`text-[11px] ${isConfigured ? 'text-green-400' : 'text-yellow-400'}`}>
          {isConfigured ? '已配置' : '未配置'}
        </span>
      </button>
      {open && (
        <div className={`border-t px-4 py-3 space-y-2 ${colors.cardInnerBorder}`}>
          <div className={`pb-2 border-b ${colors.cardInnerBorderLight}`}>
            <a
              href={registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={{ backgroundColor: accent.pillBg, color: accent.text }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accent.pillHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accent.pillBg)}
            >
              <ExternalLink size={12} />
              {registerLabel}
            </a>
          </div>
          {steps.map((s, i) => (
            <Step key={i} isDark={isDark} accent={accent}>{s}</Step>
          ))}
          <Step isDark={isDark} accent={accent}>
            在 <code className={`px-1.5 py-0.5 rounded text-xs`} style={{ backgroundColor: accent.pillBg, color: accent.text }}>frontend/.env.local</code> 中添加：
            <pre className={`mt-1 rounded p-2 text-xs overflow-x-auto ${isDark ? 'bg-black/40 text-gray-400' : 'bg-black/[0.03] text-gray-500'}`}>
              {envVar}=你的密钥
            </pre>
          </Step>
          <Step isDark={isDark} accent={accent}>
            重启开发服务器 <code className={`px-1.5 py-0.5 rounded text-xs`} style={{ backgroundColor: accent.pillBg, color: accent.text }}>npm run dev</code>
          </Step>
        </div>
      )}
    </div>
  );
}

/** 聚焦模式 */
function FocusedGuide({
  highlightKey,
  onShowFull,
  onClose,
  isDark,
  accent,
}: {
  highlightKey: string;
  onShowFull: () => void;
  onClose: () => void;
  isDark: boolean;
  accent: AccentColors;
}) {
  const card = KEY_CARDS.find(c => c.key === highlightKey);
  if (!card) return null;

  const isConfigured = card.check();
  const c = t(isDark);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className={c.overlay} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[480px] border rounded-2xl shadow-2xl overflow-hidden ${c.modal}`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${c.headerBorder}`}>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Lock size={16} className="text-yellow-400" />
            )}
            <h2 className={`text-base font-semibold ${c.title}`}>{card.name}</h2>
          </div>
          <button onClick={onClose} className={`transition-colors p-1.5 rounded-lg ${c.closeBtn}`}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isConfigured ? (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Check size={16} />
              <span>已配置，可以直接使用</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`pb-2 border-b ${c.cardInnerBorderLight}`}>
                <a
                  href={card.registerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{ backgroundColor: accent.pillBg, color: accent.text }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accent.pillHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accent.pillBg)}
                >
                  <ExternalLink size={12} />
                  {card.registerLabel}
                </a>
              </div>
              {card.steps.map((s, i) => (
                <Step key={i} isDark={isDark} accent={accent}>{s}</Step>
              ))}
              <Step isDark={isDark} accent={accent}>
                在 <code className={`px-1.5 py-0.5 rounded text-xs`} style={{ backgroundColor: accent.pillBg, color: accent.text }}>frontend/.env.local</code> 中添加：
                <pre className={`mt-1 rounded p-2 text-xs overflow-x-auto ${isDark ? 'bg-black/40 text-gray-400' : 'bg-black/[0.03] text-gray-500'}`}>
                  {card.envVar}=你的密钥
                </pre>
              </Step>
              <Step isDark={isDark} accent={accent}>
                重启开发服务器 <code className={`px-1.5 py-0.5 rounded text-xs`} style={{ backgroundColor: accent.pillBg, color: accent.text }}>npm run dev</code>
              </Step>
            </div>
          )}
        </div>

        <div className={`px-6 py-3 border-t ${c.headerBorder}`}>
          <button
            onClick={onShowFull}
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
            style={{ color: accent.text }}
          >
            <BookOpen size={12} />
            查看完整使用说明
          </button>
        </div>
      </div>
    </div>
  );
}

/** 完整模式 */
function FullGuide({ onClose, isDark, accent }: { onClose: () => void; isDark: boolean; accent: AccentColors }) {
  const c = t(isDark);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className={c.overlay} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[680px] max-h-[80vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden ${c.modal}`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${c.headerBorder} shrink-0`}>
          <h2 className={`text-base font-semibold ${c.title}`}>使用说明</h2>
          <button onClick={onClose} className={`transition-colors p-1.5 rounded-lg ${c.closeBtn}`}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-8">
          {/* 快速开始 */}
          <section>
            <h3 className={`text-sm font-semibold ${c.title} mb-4`}>快速开始</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '🗺️', label: '选择底图', desc: '右上角地球图标' },
                { icon: '📊', label: '开关图层', desc: '左侧面板切换' },
                { icon: '🔍', label: '缩放浏览', desc: '滚轮缩放，拖拽平移' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-4 text-center ${c.sectionBg}`}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className={`text-xs font-medium ${c.sectionStrong}`}>{item.label}</p>
                  <p className={`text-[11px] ${c.muted} mt-1`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 图层说明 */}
          <section>
            <h3 className={`text-sm font-semibold ${c.title} mb-4`}>数据图层</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 ${c.sectionBg}`}>
                <h4 className="text-xs font-semibold text-green-400 mb-2">世界数据</h4>
                <ul className={`text-xs space-y-1 ${c.body}`}>
                  <li><strong className={c.sectionStrong}>地震</strong> — 圆点大小/颜色按震级</li>
                  <li><strong className={c.sectionStrong}>船舶</strong> — 箭头表示航向（10秒轮询）</li>
                  <li><strong className={c.sectionStrong}>机场</strong> — 紫色圆点 + IATA 代码</li>
                  <li><strong className={c.sectionStrong}>大宗商品</strong> — 储量产区多边形</li>
                  <li><strong className={c.sectionStrong}>农作物</strong> — 产区面积产量多边形</li>
                </ul>
              </div>
              <div className={`rounded-xl p-4 ${c.sectionBg}`}>
                <h4 className="text-xs font-semibold text-green-400 mb-2">我的数据</h4>
                <p className={`text-xs ${c.muted} mb-3`}>个人数据图层，即将开放：</p>
                <ul className={`text-xs space-y-1 ${c.body}`}>
                  <li>足迹地图</li>
                  <li>收藏地点</li>
                  <li>自定义标注</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 底图 Key 配置 */}
          <section>
            <h3 className={`text-sm font-semibold ${c.title} mb-2`}>底图解锁</h3>
            <p className={`text-xs ${c.body} mb-4`}>
              部分底图需要 API Key。点击底图菜单中锁定的选项可直接跳转到对应步骤。
            </p>
            <div className="space-y-2">
              {KEY_CARDS.map(card => (
                <KeySetupCard
                  key={card.key}
                  name={card.name}
                  envVar={card.envVar}
                  steps={card.steps}
                  isConfigured={card.check()}
                  registerUrl={card.registerUrl}
                  registerLabel={card.registerLabel}
                  isDark={isDark}
                  accent={accent}
                />
              ))}
            </div>
            <div className={`mt-4 rounded-lg p-3 ${c.infoBg}`}>
              <p className={`text-[11px] ${c.muted}`}>
                无需配置即可使用：暗色、亮色、旅行者、自由地图、ESRI 卫星、高德地图、高德卫星
              </p>
            </div>
          </section>

          {/* 新功能介绍 */}
          <section>
            <h3 className={`text-sm font-semibold ${c.title} mb-2`}>🆕 新功能</h3>
            <div className={`space-y-3`}>
              <div className={`rounded-lg p-3 ${c.sectionBg}`}>
                <h4 className={`text-xs font-semibold mb-1`}>🎯 探索等级系统</h4>
                <p className={`text-[11px] ${c.body}`}>点亮足迹积累探索百分比，自动升级等级（新手探索者→传奇旅行家）。足迹页顶部和「我的」页可见。</p>
              </div>
              <div className={`rounded-lg p-3 ${c.sectionBg}`}>
                <h4 className={`text-xs font-semibold mb-1`}>💎 成就稀有度</h4>
                <p className={`text-[11px] ${c.body}`}>成就分为普通(灰)、稀有(蓝)、史诗(紫)、传说(金)四个等级。成就页按稀有度分组，带进度条。</p>
              </div>
              <div className={`rounded-lg p-3 ${c.sectionBg}`}>
                <h4 className={`text-xs font-semibold mb-1`}>🎉 点亮庆祝动画</h4>
                <p className={`text-[11px] ${c.body}`}>点亮新省份或达到里程碑(5/10/20/34省)时触发撒花庆祝动画。</p>
              </div>
              <div className={`rounded-lg p-3 ${c.sectionBg}`}>
                <h4 className={`text-xs font-semibold mb-1`}>📈 统计增强</h4>
                <p className={`text-[11px] ${c.body}`}>统计页新增城市点亮进度条。旅行详情新增距离和途经城市数。</p>
              </div>
              <div className={`rounded-lg p-3 ${c.sectionBg}`}>
                <h4 className={`text-xs font-semibold mb-1`}>📤 分享卡片</h4>
                <p className={`text-[11px] ${c.body}`}>分享海报新增竖版(9:16)布局，适合微信朋友圈/小红书。展示探索等级和详细数据。</p>
              </div>
              <div className={`rounded-lg p-3 ${c.sectionBg}`}>
                <h4 className={`text-xs font-semibold mb-1`}>❤️ 愿望清单</h4>
                <p className={`text-[11px] ${c.body}`}>足迹页新增「愿望」标签，可记录想去的地方。分三个优先级：想去了、下次去、有机会去。已到达会自动标记。</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function GuidePanel({ isOpen, onClose, highlightKey, onShowFull, isDark, accent }: GuidePanelProps) {
  if (!isOpen) return null;

  if (highlightKey) {
    return (
      <FocusedGuide
        highlightKey={highlightKey}
        onShowFull={() => onShowFull?.()}
        onClose={onClose}
        isDark={isDark}
        accent={accent}
      />
    );
  }

  return <FullGuide onClose={onClose} isDark={isDark} accent={accent} />;
}
