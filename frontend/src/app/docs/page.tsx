'use client';

import { useState } from 'react';

/* ==================== DATA ==================== */

interface DocSection {
  id: string;
  icon: string;
  title: string;
  children?: DocSection[];
  content?: string;
  screenshot?: string;
}

const SECTIONS: DocSection[] = [
  {
    id: 'overview', icon: '🌐', title: '项目概览',
    content: `## Nexus Pocket — 我的足迹

一个集 **GPS 轨迹采集、足迹点亮、多维日记、数据可视化** 于一体的个人数据平台。

### 两个端

| | Web 前端 | Android APP |
|---|---------|------------|
| 框架 | Next.js 16 + TypeScript | Kotlin + Jetpack Compose |
| 地图 | MapLibre GL JS | 列表/卡片式（无地图） |
| 存储 | localStorage + JSON 文件 | Room（SQLite） |
| 定位 | 浏览器 Geolocation API | Play Services FusedLocation |
| 部署 | Docker (standalone) | GitHub Actions APK |

### 设计哲学

1. **离线优先** — 不依赖网络就能用，WiFi 时自动同步
2. **数据自由** — 混合存储（数据库 + Markdown 文件），兼容 Obsidian
3. **五级行政** — 国家→省→市→区→街道，逐级点亮
4. **信息流设计** — 笔记本是标签不是容器，所有日记在一个时间线
5. **渐进增强** — GPS Logger 起家，逐步解锁日记/足迹/成就`,
  },
  {
    id: 'architecture', icon: '🏗️', title: '系统架构',
    children: [
      {
        id: 'web-arch', icon: '💻', title: 'Web 前端架构',
        content: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">📦 数据层</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>localStorage</b> — 命名空间隔离，500ms debounce 持久化<br>
• <b>JSON 文件</b> — 服务端 track-data/ 存储 GPS 轨迹<br>
• <b>类型定义</b> — src/lib/types/ 统一管理
</div></div>
<div style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">🗺️ 地图层系统</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>MapLibre GL JS</b> — GPU 渲染，免费开源<br>
• <b>注册表模式</b> — registry.ts 一行注册一个图层<br>
• <b>双分区</b> — 世界数据 vs 个人数据<br>
• <b>命令式更新</b> — 绕过 React 直接操作 map
</div></div>
<div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">📝 日记系统</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>三种类型</b> — 轨迹日记/记忆/笔记<br>
• <b>800ms 自动保存</b> — debounce 防抖<br>
• <b>笔记本</b> — 标签筛选，非独立容器<br>
• <b>Markdown 渲染</b> — react-markdown + remark-gfm
</div></div>
<div style="background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">📍 足迹系统</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>五级行政</b> — 国/省/市/区/街道<br>
• <b>祖先级联</b> — 点亮子区域自动创建祖先<br>
• <b>迷雾模式</b> — 未点亮区域覆盖迷雾<br>
• <b>城市进度</b> — 省份排行+进度条
</div></div></div>`,
      },
      {
        id: 'android-arch', icon: '📱', title: 'Android APP 架构',
        content: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">📱 UI 层</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>Jetpack Compose</b> — Material3 暗色主题<br>
• <b>Navigation Compose</b> — 底部 4 Tab 导航<br>
• <b>17 个功能页面</b> — 全部从空壳→完整实现<br>
• <b>使用引导</b> — 树形文档 + 内容页
</div></div>
<div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">💾 数据层</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>Room v3</b> — 8 张表（GPS+日记+足迹+照片...）<br>
• <b>3 次迁移</b> — v1→v2（5 表）→v3（notebooks）<br>
• <b>混合存储</b> — Room 元数据 + .md 文件<br>
• <b>YAML frontmatter</b> — Obsidian 兼容
</div></div>
<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">📡 服务层</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>GpsService</b> — 前台 Service + 通知栏控制<br>
• <b>UploadWorker</b> — WorkManager 批量上传<br>
• <b>SyncWorker</b> — 15 分钟 WiFi 周期同步<br>
• <b>OkHttp</b> — 网络请求
</div></div>
<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px;">
<div style="font-weight:600;margin-bottom:8px;">🏗️ 构建</div>
<div style="font-size:13px;color:#94a3b8;">
• <b>GitHub Actions</b> — 自动构建 debug APK<br>
• <b>Gradle 8.10</b> — JDK 17, Temurin<br>
• <b>minSdk 26</b> — Android 8.0+
</div></div></div>`,
      },
      {
        id: 'sync', icon: '🔄', title: '同步策略',
        content: `## Fire-and-Forget 模式

不等待同步完成，用户操作零延迟：

\`\`\`
用户操作 → 本地写入（即时）→ 标记 synced=false
                                      ↓ (WiFi, 15min)
                              SyncWorker 推送到服务端
\`\`\`

### Android 端

| 操作 | 本地 | 同步 |
|------|------|------|
| 写日记 | Room insert | .md 文件 + API 推送 |
| 点亮足迹 | Room insert | API 推送 |
| 创建笔记本 | Room insert | API 推送 |
| GPS 轨迹 | Room insert | UploadWorker（独立） |

### Web 端

| 操作 | 本地 | 同步 |
|------|------|------|
| 写日记 | localStorage | fetch → /api/diary |
| 点亮足迹 | localStorage | fetch → /api/footprints |
| GPS 轨迹 | IndexedDB | fetch → /api/tracks |

### Markdown 混合存储

Android APP 同时维护 Room 数据库和 .md 文件：

\`\`\`
Room (SQLite)                    文件系统
├── diary_entries               diary/
│   ├── id: "diary-xxx"          └── 2024/
│   ├── title: "丽江漫步"          └── 03/
│   ├── content: "今天..."          ├── 2024-03-15-丽江漫步.md
│   ├── notebookId: "default"      └── 2024-03-20-读书笔记.md
│   └── mood: "😊"              └── 2025/
│                                    └── 01/...
\`\`\`

Obsidian 打开 \`diary/\` 文件夹即可使用 Dataview、AI 插件等。`,
      },
    ],
  },
  {
    id: 'features', icon: '✨', title: '核心功能详解',
    children: [
      {
        id: 'diary', icon: '📝', title: '日记系统',
        content: `## 设计理念

日记不只是流水账，它承载着不同阶段、不同主题的生活。

### 信息流 + 标签筛选

不同于「每个笔记本是独立容器」的传统做法，Nexus Pocket 采用 **一个信息流 + 笔记本作为标签筛选** 的设计：

- 所有日记在同一个时间线里
- 每篇日记带着笔记本标签（如 🧳云南之旅）
- 顶部横滑可按笔记本筛选
- 不选 = 看全部

### 三种类型

| 类型 | 图标 | 适用场景 |
|------|------|---------|
| 记忆 | 🔵 | 日常随想、感悟 |
| 轨迹 | 🟢 | 户外活动、GPS 轨迹 |
| 笔记 | 📝 | 短小记录、待完善 |

类型只是标记，不影响功能。任何类型中都可以写任何内容。

### 自动保存

编辑日记时，每次修改 **800ms 后自动保存**。不需要手动点保存按钮，专注于写作即可。

### Web 端现实页面

- **日记主页** — \`/diary\`：时间线 + 月份导航 + 搜索
- **编辑器** — Markdown 工具栏（粗体/斜体/标题/列表/代码/链接）
- **详情页** — 完整内容 + 照片 + 轨迹回放入口
- **统计** — 月度趋势 + 心情分布 + 类型分布`,
      },
      {
        id: 'notebook', icon: '📓', title: '笔记本系统',
        content: `## 为什么需要笔记本？

日记可能有旅行、运动、读书、工作等不同主题。混在一起时间久了很难找。

## 核心设计

**笔记本是标签，不是容器。** 这是最关键的设计决策：

\`\`\`
传统方式（Notion 风格）：
  📓 旅行/
    ├── 云南之旅
    └── 日本行
  📓 运动/
    └── 跑步计划
  📓 读书/
    └── ...
  → 切换笔记本才能看到不同内容

Nexus Pocket 方式：
  📅 全部日记（一个时间线）
    ├── 🧳 云南之旅    ← 标签
    ├── 🏃 跑步记录    ← 标签
    ├── 📖 读《三体》    ← 标签
    └── 💼 工作周报    ← 标签
  → 顶部横滑筛选，或查看全部
\`\`\`

## 笔记本类型

| 类型 | 默认展开字段 |
|------|-------------|
| 旅行 | 📍 定位、📸 照片、✈️ 关联旅行 |
| 运动 | 🛤️ 关联轨迹、配速/距离 |
| 成长 | 😊 心情、📝 长文 |
| 工作 | 📅 项目关联 |
| 日常 | 全部可选 |

类型只是建议，不是限制。

## Android 现实页面

- **日记页顶部** — 横滑 FilterChip 筛选笔记本
- **新建日记** — 顶部笔记本选择行
- **管理页** — ⚙️ 入口，可创建/归档/恢复`,
      },
      {
        id: 'footprint', icon: '📍', title: '足迹点亮系统',
        content: `## 五级行政区划

\`\`\`
🌍 国家 (1)
  └── 🏛️ 省份 (34)
      └── 🏙️ 城市 (333)
            └── 🏘️ 区县 (2844)
                  └── 🛣️ 乡镇街道 (38722)
\`\`\`

## 祖先级联

点亮子区域时，所有祖先自动创建。比如点亮「杭州市」→「浙江省」和「中国」自动点亮。

## 点亮方式

| 来源 | 说明 | APP 端 |
|------|------|--------|
| 手动 | 点击地图区域 | 未来 |
| GPS | 定位自动打卡 | GpsService |
| 照片 | EXIF GPS 导入 | 导入功能 |
| 轨迹 | GPS 轨迹分析 | 自动 |
| 祖先 | 子区域点亮时 | 自动 |

## Web 端现实页面

- **足迹地图** — \`/footprint\`：MapLibre 地图 + 行政区划图层
- **迷雾模式** — 未点亮区域覆盖深色迷雾，已点亮区域更亮
- **城市进度** — \`/diary/progress\`：省份排行 + 进度条 + 城市展开
- **海报分享** — 4 种主题的 SVG 进度环 + html2canvas 导出`,
      },
      {
        id: 'stats', icon: '📊', title: '统计与成就',
        content: `## 数据统计

**Web 端** \`/diary/stats\`：
- GitHub 风格日历热力图（365 天）
- 月度活跃度柱状图
- 心情分布 + 类型分布

**Android 端**：
- 总日记/已发布/草稿/照片数
- 月度趋势图（最近 12 个月）
- 心情分布图、类型分布图
- 连续天数（当前 + 最长）

## 成就系统（22 枚勋章）

| 类别 | 示例 |
|------|------|
| 📝 日记 | 第一篇、10/50/100 篇、连续 3/7/30 天 |
| 👣 足迹 | 第一步、5/10/20/34 个省 |
| 🧳 旅行 | 第一次、5 次、10 次旅行 |
| 📸 照片 | 10/50/100 张照片 |
| 🛤️ 轨迹 | 轨迹日记、10 篇轨迹日记 |

## 年度报告

- 左右切换年份
- 核心数据：活跃天数、字数、照片数
- 月度活跃度柱状图
- 写作连续性 + 年度心情分析`,
      },
      {
        id: 'data-model', icon: '🗃️', title: '数据模型',
        content: `## Android Room 数据库（v4，9 张表）

\`\`\`
┌─────────────────┐
│   gps_points      │  ← 原有，不动
│   tracks           │  ← 原有，不动
├─────────────────┤
│   diary_entries    │  ← v2 新增
│   diary_trips      │  ← v2 新增
│   notebooks       │  ← v3 新增
│   place_bookmarks │  ← v2 新增
│   footprints      │  ← v2 新增
│   photo_records   │  ← v2 新增
│   wishlist        │  ← v4 新增
└─────────────────┘
\`\`\`

## 迁移策略

四次迁移，全部纯加法（不改动现有表）：

| 迁移 | 变更 |
|------|------|
| v1 → v2 | 新增 5 张表 + 索引 |
| v2 → v3 | 新增 notebooks 表 + diary_entries.notebookId 列 |
| v3 → v4 | 新增 wishlist 表（愿望清单） |

## Markdown 文件格式

\`\`\`
---
id: diary-1710483200000-abc123
type: memory_entry
notebook: default
date: 2024-03-15
mood: 😊
location: 丽江古城
tags: ["旅行", "古城"]
status: published
createdAt: "2024-03-15T10:30:00"
updatedAt: "2024-03-15T10:30:00"
---

今天在丽江古城走了整整一天...
\`\`\`

YAML frontmatter 兼容 Obsidian，可直接用 Dataview 查询。`,
      },
    ],
  },
  {
    id: 'pages', icon: '📄', title: '页面路由总览',
    content: `## Web 端路由

| 路由 | 功能 |
|------|------|
| \`/\` | 世界数据地图（MapLibre） |
| \`/footprint\` | 足迹地图 + 行政区划 + 迷雾 |
| \`/diary\` | 日记主页（时间线 + 搜索） |
| \`/diary/[id]\` | 日记详情 |
| \`/diary/stats\` | 统计面板 |
| \`/diary/map\` | 日记地图（标记点） |
| \`/diary/photos\` | 照片浏览器 |
| \`/diary/achievements\` | 成就系统 |
| \`/diary/report\` | 年度报告 |
| \`/diary/progress\` | 城市点亮进度 |
| \`/diary/places\` | 地点收藏 |
| \`/diary/tracks\` | 轨迹回放 |
| \`/diary/trips/[id]\` | 旅行详情 |

## Android 端路由

底部 4 Tab → 子页面：

| Tab | 路由 | 子页面 |
|-----|------|--------|
| 🏠️ 首页 | home | — |
| 📖 日记 | diary | create / [id] / [id]/edit / stats / search / notebooks / trips / ... |
| 📍 足迹 | footprint | — |
| 👤 我的 | profile | settings/server / guide / guide/[id] |`,
  },
  {
    id: 'tech', icon: '⚡', title: '技术栈与部署',
    content: `## 技术栈

### Web 前端
- **Next.js 16** (App Router)
- **TypeScript** + Tailwind CSS
- **MapLibre GL JS** (免费地图)
- **lucide-react** (图标)
- **react-markdown** + **remark-gfm** (Markdown 渲染)
- **html2canvas** (海报生成)

### Android APP
- **Kotlin** + **Jetpack Compose**
- **Room** (SQLite ORM)
- **WorkManager** (后台任务)
- **Play Services Location** (GPS)
- **OkHttp** (网络)
- **kotlinx.serialization** (JSON)
- **Navigation Compose** (导航)

### 共用
- **API 路由** — Next.js API Routes
- **JSON 文件** — GPS 轨迹数据
- **Tailscale / Docker** — 私有部署

## 部署

### Web 端

\`\`\`bash
cd frontend && npm run build
cd .. && docker compose up --build
\`\`\`

Docker Compose 配置了 Nginx 反向代理 + standalone 输出。

### Android APP

\`\`\`bash
# 自动构建（push 到 main 触发）
GitHub Actions → .github/workflows/build-apk.yml

# 手动构建
./gradlew assembleDebug
\`\`\`

## API 路由

| 方法 | 路由 | 功能 |
|------|------|------|
| GET/POST | \`/api/diary\` | 日记列表/批量创建 |
| GET/PUT/DELETE | \`/api/diary/[id]\` | 日记单条 |
| GET | \`/api/geo/[iso3]/[level]/\` | 行政区划 GeoJSON |
| GET | \`/api/geo/reverse\` | 逆地理编码 |
| POST | \`/api/tracks/batch\` | 批量上传 GPS 轨迹 |
| GET | \`/api/diary/trips\` | 旅行列表 |
| GET | \`/api/diary/export\` | 数据导出 JSON/Markdown/GeoJSON |`,
      },
];

/* ==================== COMPONENT ==================== */

function TreeNode({ node, depth, activeId, onSelect }: {
  node: DocSection;
  depth: number;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;
  const isActive = activeId === node.id;
  const [expanded, setExpanded] = useState(depth === 0);

  const handleClick = () => {
    if (isLeaf) {
      onSelect(node.id);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`doc-tree-node ${isActive ? 'active' : ''} ${isLeaf ? 'leaf' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <span className="tree-toggle">{hasChildren ? (expanded ? '▾' : '▸') : '›'}</span>
        <span className="node-icon">{node.icon}</span>
        <span className="node-title">{node.title}</span>
      </button>
      {hasChildren && expanded && (
        <div className="tree-children">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentPage({ section, onBack, onSelect }: { section: DocSection; onBack: () => void; onSelect: (id: string) => void }) {
  const allLeaves = SECTIONS.flatMap(collectLeaves);
  const currentIndex = allLeaves.findIndex((s) => s.id === section.id);
  const prev = currentIndex > 0 ? allLeaves[currentIndex - 1] : null;
  const next = currentIndex < allLeaves.length - 1 ? allLeaves[currentIndex + 1] : null;

  return (
    <div className="content-page">
      <div className="content-header">
        <button className="back-btn" onClick={onBack}>← 返回目录</button>
        <h2><span className="content-icon">{section.icon}</span> {section.title}</h2>
      </div>
      <div className="content-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content || '') }} />
      <div className="content-nav">
        {prev && (
          <button onClick={() => onSelect(prev.id)} className="nav-btn">
            ← {prev.icon} {prev.title}
          </button>
        )}
        {next && (
          <button onClick={() => onSelect(next.id)} className="nav-btn">
            {next.icon} {next.title} →
          </button>
        )}
      </div>
    </div>
  );
}

function collectLeaves(node: DocSection): DocSection[] {
  if (!node.children?.length) return [node];
  return node.children.flatMap(collectLeaves);
}

function findById(node: DocSection): DocSection[] {
  const result: DocSection[] = [];
  if (node.id) result.push(node);
  if (node.children) node.children.forEach((c) => result.push(...findById(c)));
  return result;
}

function renderMarkdown(md: string): string {
  if (!md) return '';
  // Basic markdown: headers, bold, code blocks, lists, tables, horizontal rules
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^```(\w*)\n([\s\S]*?)```$/gm, '<pre><code>$2</code></pre>')
    .replace(/^    (.+)$/gm, '<li>$1</li>')
    .replace(/^\| (.+)$/gm, '<li>$1</li>')
    .replace(/^-{3,}$/gm, '<hr />')
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('| ') || line.match(/^[\|\s-]+$/)) return line;
      return line;
    });
}

/* ==================== MAIN ==================== */

export default function DocsPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="docs-container">
      <div className="docs-sidebar">
        <div className="docs-header">
          <h1>📖 项目文档</h1>
          <p className="docs-subtitle">Nexus Pocket 设计 · 架构 · 功能详解</p>
        </div>
        <div className="docs-tree">
          {SECTIONS.map((section) => (
            <TreeNode key={section.id} node={section} depth={0} activeId={activeId} onSelect={setActiveId} />
          ))}
        </div>
        <div className="docs-footer">
          <p>GitHub: <a href="https://github.com/SoDam-C/Nexus-Pocket" target="_blank">SoDam-C/Nexus-Pocket</a></p>
        </div>
      </div>
      <div className="docs-content">
        {activeId ? (
          (() => {
            const section = SECTIONS.flatMap(findById).find((s) => s.id === activeId);
            return section ? (
              <ContentPage section={section} onBack={() => setActiveId(null)} onSelect={setActiveId} />
            ) : <div className="empty-state">内容不存在</div>;
          })()
        ) : (
          <div className="landing-page">
            <div className="landing-hero">
              <div className="landing-icon">🗺️</div>
              <h1>Nexus Pocket</h1>
              <p className="landing-tagline">足迹点亮 · 多维日记 · GPS 采集</p>
            </div>
            <div className="landing-stats">
              <div className="landing-stat">
                <div className="stat-number">8</div>
                <div className="stat-label">数据库表</div>
              </div>
              <div className="landing-stat">
                <div className="stat-number">17</div>
                <div className="stat-label">Android 页面</div>
              </div>
              <div className="landing-stat">
                <div className="stat-number">22</div>
                <div className="stat-label">成就勋章</div>
              </div>
              <div className="landing-stat">
                <div className="stat-number">5</div>
                <div className="stat-label">行政区划层级</div>
              </div>
            </div>
            <div className="landing-sections">
              <h3>📖 开始探索</h3>
              <p>点击左侧目录树展开功能分类，点击具体主题查看详细说明。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
