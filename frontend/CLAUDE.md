# 全球数据地图

基于地图的多图层数据可视化平台 + 多维日记系统 + 足迹点亮。纯前端 + Mock 数据，可部署至 Docker。

## 产品定位

- **世界数据**：客观的全球公开数据，如航线、机场、地震、大宗商品储量、农作物产区等
- **足迹系统**：五级行政区划点亮（国家→省→市→区→街道），支持手动/GPS/照片/轨迹点亮
- **日记系统**：多维日记（GPS 轨迹 + 时间 + 位置 + 文字），支持日记骨架自动生成
- **Android 采集**：GPS Logger App（Nexus-Pocket），实时采集 + 上传

## 技术栈

- **框架**: Next.js 16 (App Router) + TypeScript
- **地图**: MapLibre GL JS（免费开源，GPU 渲染）
- **样式**: Tailwind CSS
- **图标**: lucide-react
- **存储**: localStorage（客户端）+ JSON 文件（服务端 track-data/）
- **部署**: Docker (standalone output) + Docker Compose
- **Android**: Kotlin + Jetpack Compose + Room + WorkManager
- **PWA**: Service Worker 缓存 + manifest.json

## 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局（PWA meta + SW 注册）
│   ├── page.tsx                # 主页面（世界数据地图）
│   ├── globals.css             # 全局样式
│   ├── diary/                  # 日记系统
│   │   ├── page.tsx            # 日记主页（时间线 + 搜索 + 导航）
│   │   ├── [id]/page.tsx       # 日记详情页
│   │   ├── stats/page.tsx      # 统计面板
│   │   ├── map/page.tsx        # 日记地图（标记点 + 弹窗）
│   │   ├── photos/page.tsx     # 照片浏览器（时间线/网格）
│   │   ├── achievements/page.tsx # 成就系统
│   │   ├── import/page.tsx     # EXIF 照片导入
│   │   ├── import/json/page.tsx # JSON 数据导入（合并/覆盖）
│   │   ├── tracks/page.tsx     # 轨迹回放（播放/暂停/速度）
│   │   ├── report/page.tsx     # 年度足迹报告
│   │   ├── places/page.tsx     # 地点收藏
│   │   └── progress/page.tsx   # 城市点亮进度
│   ├── diary/trips/
│   │   └── [id]/page.tsx       # 旅行详情页（时间线+统计）
│   ├── footprint/              # 足迹系统
│   │   └── page.tsx            # 足迹点亮页面
│   └── api/                    # API 路由
│       ├── diary/              # 日记 CRUD + 搜索 + 导出
│       │   ├── route.ts        # GET(列表+过滤) POST(批量创建)
│       │   ├── [id]/route.ts   # GET/PUT/DELETE 单条
│       │   ├── trips/route.ts  # 旅行分组 CRUD
│       │   ├── attractions/search/route.ts # Wikipedia 景点搜索
│       │   ├── from-tracks/route.ts       # 轨迹→日记骨架
│       │   └── export/route.ts # 导出 JSON/Markdown/GeoJSON
│       ├── geo/                # 地理数据
│       │   ├── [iso3]/[level]/ # 行政区划 GeoJSON
│       │   └── reverse/route.ts # 逆地理编码（经纬度→adcode）
│       └── tracks/             # GPS 轨迹
│           ├── batch/route.ts  # 批量上传
│           ├── [id]/route.ts   # 单条轨迹
│           └── [id]/points/    # GPS 点分页查询
├── components/
│   ├── GuidePanel.tsx          # 使用引导面板
│   ├── map/
│   │   ├── MapViewer.tsx       # MapLibre 地图组件 (forwardRef)
│   │   └── MapControls.tsx     # 底图选择器 + 缩放/重置
│   ├── layers/                 # 图层系统
│   │   ├── LayerPanel.tsx      # 双分区图层面板
│   │   ├── LayerToggle.tsx     # 单个图层开关
│   │   └── registry.ts         # 图层注册表
│   ├── diary/                  # 日记组件
│   │   ├── DiaryPage.tsx       # 日记主页（时间线+搜索+导航）
│   │   ├── DiaryTimeline.tsx   # 日期分组时间线
│   │   ├── DiaryEntryCard.tsx  # 日记卡片（三种状态）
│   │   ├── DiaryEditor.tsx     # 日记编辑器（自动保存+足迹点亮）
│   │   ├── DiarySearch.tsx     # 全文搜索+筛选
│   │   ├── DiaryPhotoManager.tsx # 照片 URL 管理
│   │   ├── AttractionSearch.tsx # Wikipedia 景点搜索
│   │   ├── TripCard.tsx        # 旅行卡片
│   │   ├── AchievementSystem.tsx # 成就定义+检测逻辑
│   │   └── PlaceBookmark.tsx   # 地点收藏管理
│   └── footprint/              # 足迹组件
│       ├── FootprintPage.tsx   # 足迹主页面
│       ├── FootprintMap.tsx    # 足迹地图
│       ├── TrackPanel.tsx      # 轨迹面板
│       ├── FogOverlay.tsx      # 地图迷雾模式
│       ├── CityProgress.tsx    # 城市点亮进度
│       ├── SharePoster.tsx     # 足迹海报生成
│       ├── ExplorerLevelBadge.tsx # 探索等级徽章
│       ├── CelebrationOverlay.tsx # 点亮庆祝动画
│       └── WishlistPanel.tsx   # 愿望清单面板
├── hooks/
│   ├── useMapLayers.ts         # 图层生命周期
│   ├── useDiary.ts             # 日记 CRUD（localStorage persist）
│   ├── useDiaryTrips.ts        # 旅行分组 CRUD
│   ├── useAttractionSearch.ts  # Wikipedia 搜索
│   ├── useFootprints.ts        # 足迹管理（点亮/撤销/统计）
│   ├── useWishlist.ts          # 愿望清单 CRUD
│   ├── usePhotos.ts            # 照片管理（EXIF 提取）
│   ├── useTracks.ts            # GPS 轨迹管理（IndexedDB）
│   └── useTrips.ts             # 旅行记录管理
├── lib/
│   ├── types/                  # 类型定义
│   │   ├── diary.ts            # DiaryEntry, DiaryTrip, AttractionInfo
│   │   ├── footprint.ts        # FootprintRecord, FootprintStatsData
│   │   ├── track.ts            # GpsTrack, GpsPoint, SportConfig
│   │   ├── trip.ts             # TripRecord, TripWaypoint
│   │   ├── photo.ts            # PhotoRecord, ExifGpsInfo
│   │   └── index.ts            # 统一导出
│   ├── storage.ts              # localStorage 工具（命名空间+迁移）
│   ├── explorerLevel.ts        # 探索等级定义与计算
│   ├── tripUtils.ts            # 旅行距离/时长计算工具
│   ├── adminRegions.ts         # 行政区划工具（adcode 解析）
│   └── mapStyles.ts            # 底图源配置
├── layers/                     # 世界数据图层
│   ├── types.ts
│   ├── earthquakes.ts          # 地震
│   ├── ships.ts                # 船舶
│   ├── airports.ts             # 机场
│   ├── commodities.ts          # 大宗商品
│   └── crop-areas.ts           # 农作物产区
└── data/                       # Mock 数据
```

## 架构设计

```
page.tsx (世界数据地图编排器)
    │
    ├── MapViewer ────── MapLibre 地图（纯渲染）
    ├── MapControls ──── 底图选择 + 缩放 + 重置
    ├── LayerPanel ───── 左侧双分区图层面板
    └── useMapLayers ─── 图层生命周期

diary/page.tsx (日记系统编排器)
    │
    ├── DiaryTimeline ──── 日期分组时间线
    ├── DiarySearch ────── 全文搜索 + 类型/心情/照片筛选
    ├── DiaryEditor ────── 编辑器（自动保存 800ms debounce）
    │     ├── MarkdownToolbar ── Notion 风格格式工具栏
    │     ├── AttractionSearch ── Wikipedia 景点搜索
    │     ├── TrackSelector ──── GPS 轨迹关联选择
    │     └── DiaryPhotoManager ─ 照片 URL 管理（拖拽排序）
    ├── DiaryPage 导航 ──→ stats / map / photos / achievements / import / tracks / trips/[id]
    └── useFootprints ──── 写日记自动点亮足迹

footprint/page.tsx (足迹系统编排器)
    │
    ├── FootprintMap ──── MapLibre 地图 + 行政区划图层
    ├── ExplorerLevelBadge ── 探索等级徽章（7 级）
    ├── CelebrationOverlay ── 点亮庆祝动画（粒子撒花）
    ├── WishlistPanel ─── 愿望清单面板（优先级分组）
    ├── DynamicPanel ──── 标签切换面板（足迹/统计/愿望）
    ├── useFootprints ─── 点亮/撤销/统计/ancestor 自动创建
    ├── useWishlist ───── 愿望清单 CRUD
    └── 逆地理编码 API ── 经纬度 → adcode（高德 API / 最近省份匹配）
```

### 关键设计决策

1. **命令式地图更新** — `map.setLayoutProperty()` / `source.setData()` 直接操作，绕过 React
2. **Source/Layer ID 约定** — `layer-{layerId}` 前缀，底图切换时自动保留数据图层
3. **注册表模式** — 新增图层 = 1 个文件 + 1 行 import
4. **双分区图层** — `section: 'world' | 'personal'`，世界数据 vs 个人数据
5. **中文标签** — 自动将底图文本图层替换为 `name:zh`，跳过数据图层
6. **下拉菜单规范** — 点击切换不关闭、鼠标移出 2 秒延迟关闭、点击外部立即关闭
7. **存储模式** — localStorage 命名空间 + debounce persist（500ms），服务端 JSON 文件
8. **日记骨架** — GPS 轨迹自动生成 draft 日记，用户用文字填充
9. **足迹 ancestor** — 点亮子区域时自动创建所有祖先区域的足迹
10. **PWA 策略** — API 网络优先、静态资源缓存优先、页面网络优先+缓存回退

## 日记系统

### 三种条目类型

| 类型 | 说明 | 显示样式 |
|------|------|---------|
| `track_entry` | 关联 GPS 轨迹的日记 | 绿色轨迹图标 |
| `memory_entry` | 纯记忆（无轨迹） | 蓝色调背景 |
| `note_entry` | 游离笔记 | 默认样式 |

### 日记页面路由

| 路由 | 功能 |
|------|------|
| `/diary` | 主页：时间线 + 搜索 + 月份导航 + 旅行分组 |
| `/diary/[id]` | 详情：完整内容 + 照片 + 景点卡片 + 轨迹回放入口 |
| `/diary/stats` | 统计面板：月度趋势 + 心情分布 + 类型分布 + 连续天数 |
| `/diary/map` | 日记地图：MapLibre 标记点 + 弹窗跳转详情 |
| `/diary/photos` | 照片浏览器：时间线/网格切换 + 大图预览 |
| `/diary/achievements` | 成就系统：20+ 勋章（日记/足迹/旅行/照片/轨迹） |
| `/diary/import` | EXIF 导入：拖拽照片 → 提取 GPS+时间 → 生成日记骨架 |
| `/diary/tracks` | 轨迹回放：播放/暂停/速度控制 + 已播放轨迹高亮 |
| `/diary/report` | 年度足迹报告：年度总结 + 月度活跃 + 心情分析 + 成就 |
| `/diary/places` | 地点收藏：分类收藏 + 搜索 + 标签 + GPS定位 |
| `/diary/progress` | 城市点亮进度：省份排行 + 进度条 + 覆盖率统计 |

### API 路由

| 方法 | 路由 | 功能 |
|------|------|------|
| GET/POST | `/api/diary` | 列表（type/tripId/dateFrom/dateTo 过滤）/ 批量创建 |
| GET/PUT/DELETE | `/api/diary/[id]` | 单条 CRUD |
| GET/POST | `/api/diary/trips` | 旅行分组列表 / 创建 |
| GET/PUT/DELETE | `/api/diary/trips/[id]` | 单条旅行 CRUD |
| GET | `/api/diary/attractions/search?q=` | Wikipedia 景点搜索（本地缓存） |
| POST | `/api/diary/from-tracks` | GPS 轨迹 → 日记骨架 |
| GET | `/api/diary/export?format=json\|markdown\|geojson` | 数据导出 |
| GET | `/api/geo/reverse?lat=&lng=` | 逆地理编码（高德 API / 最近省份） |

### 自动保存机制

日记编辑器使用 800ms debounce 自动保存到 localStorage。保存时如果日记有坐标，会自动调用逆地理编码 API 点亮足迹。

### 数据导出

- **JSON**: 完整日记数据（`track-data/diary.json`）
- **Markdown**: 每篇日记一个 Markdown 文档（标题+元信息+正文+照片）
- **GeoJSON**: 有坐标的日记导出为 GeoJSON FeatureCollection

## 足迹系统

### 五级行政区划

0=国家 → 1=省/州 → 2=市/县 → 3=区县 → 4=乡镇/街道

### 点亮来源

| 来源 | 说明 | source 值 |
|------|------|-----------|
| 手动 | 点击地图区域 | `manual` |
| GPS | 定位自动打卡 | `gps` |
| 照片 | EXIF GPS 导入 | `photo` |
| 旅行 | 旅行途经点 | `trip` |
| 轨迹 | GPS 轨迹分析 | `track` |
| 祖先 | 子区域点亮时自动创建 | `ancestor` |

### 逆地理编码

`/api/geo/reverse?lat=&lng=` — 优先使用高德 API（需配置 `NEXT_PUBLIC_AMAP_KEY`），无 key 时回退到最近省份匹配。

## 成就系统

22 枚成就勋章，分 5 类 + 4 个稀有度等级：

| 类别 | 示例成就 |
|------|---------|
| 日记 | 第一篇、10/50/100 篇、连续 3/7/30 天、图文并茂、标签达人 |
| 足迹 | 第一步、5/10/20/34 个省 |
| 旅行 | 第一次旅行、5 次旅行、10 个目的地 |
| 照片 | 10/50/100 张照片 |
| 轨迹 | 轨迹起点、10 篇轨迹日记 |

### 稀有度等级

| 稀有度 | 颜色 | 示例成就 |
|--------|------|---------|
| 🥉 普通 | 灰色边框 | 第一篇日记、第一步足迹 |
| 🥈 稀有 | 蓝色边框 | 10 篇日记、5 省、5 次旅行 |
| 🥇 史诗 | 紫色边框+微光 | 50 篇日记、20 省、50 张照片 |
| 💎 传说 | 金色边框+光晕 | 100 篇日记、34 省全点亮 |

成就页按稀有度分组展示，有 `target` 的成就显示"当前/目标"进度条。

## 探索等级系统

基于足迹点亮覆盖率自动升级的 7 级探索等级：

| 等级 | Emoji | 名称 | 所需覆盖率 |
|------|-------|------|-----------|
| 1 | 🌱 | 新手探索者 | 0% |
| 2 | 🗺️ | 初级旅行者 | 5% |
| 3 | 🧳 | 资深旅行家 | 15% |
| 4 | ✈️ | 环球探险家 | 30% |
| 5 | 🌍 | 世界征服者 | 50% |
| 6 | 👑 | 传奇旅行家 | 75% |
| 7 | 💎 | 全知全能 | 95% |

覆盖率按省份/城市/区县加权平均计算。足迹页顶部和「我的」页可见等级徽章。

## 点亮庆祝动画

- 点亮新省份时触发 CSS 撒花粒子动画
- 里程碑检测：1/5/10/20/34 省自动触发大庆祝
- 普通点亮：地图区域脉冲高亮
- 无外部依赖，纯 CSS 动画实现

## 愿望清单

- 足迹页新增「愿望」标签（DynamicPanel）
- 三种优先级：想去了（高）、下次去（中）、有机会去（低）
- 已到达的愿望自动标记为"已去过"
- localStorage 存储（`wishlist` 命名空间）
- Android Room v4 新增 `wishlist` 表

## 旅行统计增强

- Haversine 公式计算旅行距离
- 旅行详情页新增：总里程(km)、旅行时长(h)、途经城市数
- 统计页新增城市点亮进度条（省份/城市覆盖率）
- 工具函数：`haversineDistance()`、`calculateRouteDistance()`、`formatDistance()`

## 足迹海报增强

- 原有 `SharePoster` 组件增强
- 4 种主题：深邃夜空、渐变紫、暖阳橙、深海蓝
- SVG 进度环显示总体探索进度
- 各级行政区划进度条
- 新增竖版(9:16)布局，适合微信朋友圈/小红书
- 竖版展示探索等级徽章和详细数据网格
- html2canvas 导出 + Web Share API 分享

## EXIF 照片导入

1. 拖拽/选择照片文件
2. 自动解析 JPEG EXIF（GPS 坐标 + 拍摄时间）
3. 按日期分组，每组生成一篇 draft 日记骨架
4. 日记包含照片缩略图、坐标、时间信息

## 轨迹回放

- 从日记详情页点击「回放轨迹」进入
- MapLibre 地图显示完整轨迹（灰色）+ 已播放轨迹（绿色）
- 当前位置标记（蓝色圆点）
- 播放控制：播放/暂停、重置、快进 10%、速度 1x/2x/4x/8x
- 实时信息：时间、速度(km/h)、海拔(m)

## Markdown 渲染 + 富文本工具栏

- 参考 Notion 的编辑体验
- 日记详情页使用 `react-markdown` + `remark-gfm` 渲染 Markdown（支持 GFM 表格、删除线、任务列表）
- 编辑器顶部工具栏：粗体/斜体/标题1-3/有序列表/无序列表/引用/代码/链接/分割线
- 工具栏智能插入：块级元素在行首插入，行内元素包裹选中文字

## 日记详情页嵌入地图

- 参考 Day One 的地图集成
- 有坐标的日记自动在详情页显示 200px 高的 MapLibre 小地图
- CartoCDN dark 底图 + 蓝色标记点
- `DiaryMiniMap` 组件：轻量、无交互、纯展示

## 旅行详情页

- 参考 TripIt 的行程时间线
- `/diary/trips/[id]` — 旅行详情页
- 统计概览：天数、日记数、照片数
- 按日期分组的日记时间线，每条显示标题、地点、内容预览、照片缩略图
- 支持编辑旅行标题、删除旅行

## 日历热力图

- 参考 GitHub 贡献图
- `CalendarHeatmap` 组件，展示最近 365 天的写作活跃度
- 颜色梯度：无记录→绿色深浅四级
- 统计：活跃天数、最长连续天数
- 点击日期可跳转到对应日记

## 照片拖拽排序

- 参考 Google Photos
- 使用 `@dnd-kit/core` + `@dnd-kit/sortable`
- 拖拽手柄（左侧六点图标）+ 删除按钮（右侧叉号）
- 悬浮时显示操作控件

## 日记服务端同步

- 参考 Notion 的实时同步
- `useDiary` hook 自动在每次本地保存后同步到 `/api/diary`
- `syncFromServer()` 方法支持从服务端拉取（以 `updatedAt` 为准合并）
- Fire-and-forget 策略：网络失败不影响本地使用

## JSON 数据导入

- `/diary/import/json` — JSON 导入页面
- 支持两种格式：纯 diary store、导出格式（含 entries+trips）
- 冲突检测：显示 ID 重复数量
- 两种模式：合并（保留本地）或覆盖（替换全部）

## 主地图个人数据层

- 参考 Google Maps 个人地点图层
- `useDiaryMapLayer` hook 在主地图添加日记标记点
- 蓝色圆点 = 有内容，灰色 = 待填充
- 缩放到 6 级以上显示文字标签
- 点击标记跳转到日记详情页

## 轨迹关联选择

- 参考 Strava 的活动关联
- `TrackSelector` 组件：下拉列表显示所有 GPS 轨迹
- 多选模式，显示关联数量
- 从 `/api/tracks/batch` 获取轨迹列表

## 键盘快捷键

- 参考 Notion 的快捷键体系
- `N` — 新建日记
- `Ctrl+S` — 保存
- `Ctrl+N` — 新建日记
- `Escape` — 关闭编辑器/返回
- 输入框内仅 Escape 生效，避免干扰文本输入

## 打印 CSS

- 参考 Medium 的打印布局
- `@media print` 全局样式
- 隐藏导航、按钮、交互元素
- 白色背景、黑色文字、保留照片
- 自动分页、避免内容断裂

## 地图迷雾模式

- 参考 灵敢足迹 v2.6.0 的迷雾探索
- 足迹页面顶部「迷雾模式」按钮切换
- 未点亮区域覆盖深色迷雾层（fog-fill + fog-glow 双层）
- 已点亮区域更亮（opacity 0.7），未点亮区域几乎不可见
- 迷雾覆盖率指示器：实时显示探索百分比
- 颜色随进度变化：>80% 绿色、>50% 蓝色、>20% 橙色、<20% 红色
- 切换时平滑过渡，恢复时还原所有图层样式

## 年度足迹报告

- 参考 灵敢足迹/一生足迹 的年度总结
- `/diary/report` — 支持选择年份
- 核心数据：活跃天数、总字数、照片数
- 月度活跃度柱状图（12个月）
- 写作连续性：当前连续天数 + 最长连续天数
- 年度心情：主心情 emoji + 分布图
- 最常记录的地点排行
- 年度成就勋章（8项：日记新手/坚持记录/高产出/摄影达人/旅行家/连续7天/连续30天/足迹开拓）
- 支持导出为图片（html2canvas）

## 地点收藏系统

- 参考 Google Maps 收藏夹
- `/diary/places` — 地点收藏管理
- 6 个分类：美食、景点、住宿、购物、交通、其他
- 支持搜索 + 分类筛选
- 每个地点：名称、坐标、分类、备注、标签
- 支持 GPS 定位获取当前坐标
- 添加/编辑对话框（底部弹出式）
- 按分类分组显示
- localStorage 存储（`place-bookmarks` 命名空间）

## 城市点亮进度

- 参考 灵敢足迹 的进度可视化
- `/diary/progress` — 城市点亮进度页面
- 全国总进度条 + 已点亮城市数
- 省份点亮排行榜（按进度排序）
- 可展开查看省份内已点亮的城市列表
- 颜色编码：≥80% 绿色、≥50% 蓝色、≥20% 橙色、<20% 红色
- 省全覆盖统计
- 链接到足迹地图继续点亮

## 足迹海报增强

- 原有 `SharePoster` 组件增强
- 4 种主题：深邃夜空、渐变紫、暖阳橙、深海蓝
- SVG 进度环显示总体探索进度
- 各级行政区划进度条
- html2canvas 导出 + Web Share API 分享

## Android App (Nexus-Pocket)

GitHub: SoDam-C/Nexus-Pocket

- **GPS 采集**: 前台 Service + 通知栏控制
- **数据存储**: Room Database v4（GpsPoint + Track + DiaryEntry + Wishlist）
- **上传**: WorkManager + OkHttpClient 批量上传
- **构建**: GitHub Actions 自动构建 APK

## PWA 支持

- `manifest.json`: standalone 模式，蓝色主题
- `sw.js`: Service Worker 缓存策略
  - API 请求：网络优先，缓存回退
  - 静态资源：缓存优先，网络更新
  - 页面：网络优先，缓存回退
- `layout.tsx`: 自动注册 SW + Apple Web App meta

## 底图配置

### 可用底图

**无需 API Key：**

| 底图 | 来源 | 特点 |
|------|------|------|
| 暗色 | CartoCDN dark-matter | 极简深色，数据叠加效果好 |
| 亮色 | CartoCDN positron | 极简浅色 |
| 旅行者 | CartoCDN voyager | 信息较丰富，有道路和地名 |
| 自由地图 | OpenFreeMap | 完全免费开源，OSM 底层 |
| ESRI 卫星 | ESRI World Imagery | 高清卫星影像 + 地名标注 |
| 高德地图 | 高德 | 中国道路/POI 最详细（GCJ-02 坐标系，有偏移） |
| 高德卫星 | 高德 | 卫星影像 + 地名标注 |

**需要 API Key：**

| 底图 | 来源 | 特点 | 环境变量 |
|------|------|------|---------|
| 标准地图 | MapTiler streets-v2 | 全球中文支持好 | `NEXT_PUBLIC_MAPTILER_KEY` |
| 卫星地图 | MapTiler hybrid | 卫星影像 + 中文标签 | `NEXT_PUBLIC_MAPTILER_KEY` |
| 地形图 | MapTiler topo-v2 | 等高线地形 | `NEXT_PUBLIC_MAPTILER_KEY` |
| 天地图 | 天地图 WMTS | 中国官方地图，中文最全 | `NEXT_PUBLIC_TIANDITU_KEY` |
| Stadia 暗色 | Stadia alidade_smooth_dark | 精美暗色风格 | `NEXT_PUBLIC_STADIA_KEY` |
| Stadia 户外 | Stadia outdoors | 户外地形风格 | `NEXT_PUBLIC_STADIA_KEY` |

### 配置 API Key

在 `frontend/.env.local` 中添加（已有模板文件参考）：

- **MapTiler**: https://maptiler.com 注册，每月 10 万次免费
- **天地图**: https://console.tianditu.gov.cn 注册开发者
- **Stadia Maps**: https://stadiamaps.com 注册，有免费额度
- **高德**: 用于逆地理编码（`NEXT_PUBLIC_AMAP_KEY` 或 `AMAP_KEY`）

未配置 Key 的底图在选择菜单中显示为灰色锁定状态。

## 使用引导

页面内置引导面板（左侧面板标题栏的 `?` 按钮），包含：
- 快速开始步骤
- 各图层说明
- 底图 Key 配置的逐步解锁指南（自动检测配置状态，已配置的显示绿色勾号）
- 新功能介绍（探索等级、成就稀有度、点亮庆祝、统计增强、分享卡片、愿望清单）

## 世界数据图层

| 图层 | 分类 | 数据 | 可视化 |
|------|------|------|--------|
| 地震 | 地球物理 | 震级、位置、深度 | 圆点大小/颜色按震级插值 + 光晕 |
| 船舶 | 海事 | MMSI、船名、航向、航速 | 旋转箭头 + 船名标签（10秒轮询） |
| 机场 | 航空 | IATA、名称、海拔 | 紫色圆点 + 金色 IATA 代码 |
| 大宗商品 | 资源 | 石油/天然气/矿产储量产量 | 多边形填充 + 类型着色 |
| 农作物产区 | 农业 | 粮食产区面积产量 | 多边形填充 + 作物着色 |

## 真实数据源（后续接入）

| 来源 | 数据 | 格式 | 频率 |
|------|------|------|------|
| [EIA OpenData](https://www.eia.gov/opendata/) | 美国石油/天然气/煤炭 | JSON | 周/月/年 |
| [USGS ScienceBase](https://www.usgs.gov/products/web-tools/apis) | 全球矿产资源 | JSON/GeoJSON | 年度 |
| [FAO FAOSTAT](https://www.fao.org/faostat/) | 全球农作物产量/面积 | JSON/CSV | 年度 |
| [USDA CropScape](https://nassgeodata.gmu.edu/CropScape/) | 美国农作物覆盖(30m栅格) | GeoTIFF | 年度 |
| [FAO Hand-in-Hand](https://data.apps.fao.org/) | 全球农业空间数据 | GeoJSON/栅格 | 不定 |
| [World Bank](https://data.worldbank.org/) | 大宗商品价格、发展指标 | JSON/XML | 年度 |

接入方式：将 `useMapLayers.ts` 中 `mockDataStore[dataSourcePath]` 改为 `fetch(dataSourcePath)` 即可。

## 如何添加新图层

以添加「全球港口」为例：

### 1. 创建 Mock 数据

`src/data/ports.json`：
```json
{
  "ports": [
    { "id": "shanghai", "name": "上海港", "country": "中国", "lat": 31.2, "lon": 121.5, "throughput_mteu": 4700 }
  ]
}
```

### 2. 创建图层定义

`src/layers/ports.ts`：
```typescript
import type { LayerDefinition } from './types';
import type { FeatureCollection } from 'geojson';

export const ports: LayerDefinition = {
  id: 'ports',
  name: '港口',
  category: '交通',
  icon: 'anchor',
  defaultVisible: false,
  pollingInterval: 0,
  dataSourcePath: '/data/ports.json',
  section: 'world',
  buildGeoJSON: (raw: unknown): FeatureCollection => { /* ... */ },
  buildSource: (geojson) => ({ type: 'geojson', data: geojson, generateId: true }),
  buildLayers: (sourceId) => [ /* ... */ ],
};
```

### 3. 注册图层和 Mock 数据

- `registry.ts` — 添加 `import { ports } from '@/layers/ports'` 并加入数组
- `useMapLayers.ts` — 添加 `import portsRaw from '@/data/ports.json'` 并加入 `mockDataStore`
- `LayerToggle.tsx` — 如需新图标，在 `iconMap` 中添加

### 4. 个人数据图层

将 `section` 设为 `'personal'`，图层会自动归入「我的数据」分区。

## 底图切换机制

切换底图时自动保留所有数据图层（通过 `layer-` 前缀识别）。`style.load` 监听在 `setStyle()` 之前注册，确保内联 style 对象（栅格底图）也能正确恢复数据图层。

## 开发与部署

```bash
cd frontend && npm run dev    # 开发
npm run build                 # 构建
cd .. && docker compose up --build  # Docker 部署
```
