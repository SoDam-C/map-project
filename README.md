# Map Project — 全球数据地图 + 旅行足迹

基于 MapLibre GL JS 的多图层数据可视化平台 + 旅行足迹记录系统。支持 Docker 部署和 iframe 嵌入。

## 功能

### 世界数据地图
- 多图层全球数据展示：地震、船舶、机场、大宗商品、农作物
- 10+ 底图切换（CartoCDN / 高德 / MapTiler / 天地图等）
- 实时数据轮询（船舶位置等）

### 旅行足迹
- 五级行政区划点亮（国家 → 省 → 市 → 区 → 街道）
- GPS 轨迹迷雾探索（单画布同步渲染）
- 旅行行程管理 + 路线展示
- 照片 EXIF 导入 + 地图标注
- 探索等级 + 成就勋章系统
- 足迹海报生成 + 分享

### 日记系统
- 多维日记（GPS 轨迹 + 时间 + 位置 + 文字）
- Markdown 编辑器 + Notion 风格工具栏
- 时间线 + 全文搜索
- 年度报告 + 统计面板

### 嵌入式展示
- 通过 iframe 嵌入到外部站点
- URL 参数控制图层、底图、主题色
- 支持足迹、行程、轨迹、世界数据等图层

## 技术栈

- **前端**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **地图**: MapLibre GL JS（GPU 渲染）
- **图标**: lucide-react
- **存储**: localStorage + IndexedDB（客户端）
- **部署**: Docker + Docker Compose
- **Android**: Kotlin + Jetpack Compose（Nexus-Pocket GPS 采集 App）

## 快速开始

```bash
# 开发
cd frontend && npm install && npm run dev

# Docker 部署
cd .. && docker compose up --build
```

访问 http://localhost:3000

## 嵌入式使用

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints,trips&center=104,35&zoom=4&legend=true"
  width="100%"
  height="600"
  frameborder="0"
/>
```

详细文档：[docs/embed-guide.md](docs/embed-guide.md)

### 可用 URL 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `layers` | 图层列表（footprints,trips,tracks,earthquakes,...） | footprints |
| `center` | 中心经纬度 lng,lat | 104,35 |
| `zoom` | 缩放级别 | 4 |
| `basemap` | 底图（dark/light/amap/voyager） | dark |
| `accent` | 主题色 hex | #6366f1 |
| `controls` | 显示缩放按钮 | true |
| `legend` | 显示图例 | false |

## 项目结构

```
map-project/
├── frontend/          # Next.js 前端
│   ├── src/
│   │   ├── app/       # 路由（page, diary, footprint, travel, embed）
│   │   ├── components/# 组件（map, layers, footprint, travel, diary）
│   │   ├── hooks/     # 数据管理 hooks
│   │   ├── layers/    # 图层定义
│   │   ├── lib/       # 工具函数 + 类型
│   │   └── data/      # 种子数据
│   └── Dockerfile
├── gps-logger/        # Android GPS 采集 App（Nexus-Pocket）
├── docs/              # 文档
└── docker-compose.yml
```

## 底图配置

无需 Key 的底图：暗色、亮色、旅行者、高德地图、ESRI 卫星

需要 Key 的底图（按需配置 `frontend/.env.local`）：
- MapTiler: `NEXT_PUBLIC_MAPTILER_KEY`
- 天地图: `NEXT_PUBLIC_TIANDITU_KEY`
- Stadia: `NEXT_PUBLIC_STADIA_KEY`
- 高德逆地理编码: `NEXT_PUBLIC_AMAP_KEY`

## License

MIT
