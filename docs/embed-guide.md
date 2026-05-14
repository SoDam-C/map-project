# 嵌入式地图使用指南

## 快速开始

在你的 HTML 页面中嵌入地图：

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints&center=104,35&zoom=4"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
/>
```

## URL 参数

所有参数均为可选，未指定时使用默认值。

### 基础参数

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `layers` | 显示的图层，逗号分隔 | `footprints` | `footprints,trips,tracks` |
| `center` | 地图中心经纬度 `lng,lat` | `104,35` | `116.4,39.9` |
| `zoom` | 缩放级别 (1-18) | `4` | `8` |
| `basemap` | 底图样式 ID | `dark` | `light`, `amap`, `voyager` |
| `accent` | 主题色 (URL encoded hex) | `%236366f1` | `%2322c55e` |

### 可用图层

| 图层 ID | 说明 | 类型 |
|---------|------|------|
| `footprints` | 足迹行政区划点亮 | 个人 |
| `trips` | 旅行路线和途经点 | 个人 |
| `tracks` | GPS 轨迹迷雾 | 个人 |
| `earthquakes` | 全球地震数据 | 世界 |
| `airports` | 全球机场 | 世界 |
| `ships` | 实时船舶位置 | 世界 |
| `commodities` | 大宗商品分布 | 世界 |
| `crops` | 农作物产区 | 世界 |

### 界面控制

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `controls` | 显示缩放按钮 | `true` |
| `legend` | 显示图例 | `false` |

## 底图选项

| ID | 说明 |
|----|------|
| `dark` | CartoCDN 暗色（默认） |
| `light` | CartoCDN 亮色 |
| `voyager` | CartoCDN 旅行者 |
| `amap` | 高德地图 |
| `amap-satellite` | 高德卫星 |

## 使用示例

### 基本足迹地图

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints"
  width="100%"
  height="600"
/>
```

### 足迹 + 行程叠加

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints,trips&center=116.4,39.9&zoom=6"
  width="100%"
  height="600"
/>
```

### 绿色主题 + 图例

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints,earthquakes&accent=%2322c55e&legend=true"
  width="100%"
  height="500"
/>
```

### 全功能展示

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints,trips,tracks,airports&basemap=dark&legend=true"
  width="100%"
  height="800"
/>
```

### 纯展示（无控件）

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints&controls=false"
  width="100%"
  height="400"
/>
```

### React 中使用

```jsx
function MapEmbed() {
  const src = new URL('https://your-domain.com/embed');
  src.searchParams.set('layers', 'footprints,trips');
  src.searchParams.set('center', '104,35');
  src.searchParams.set('zoom', '4');
  src.searchParams.set('legend', 'true');

  return (
    <iframe
      src={src.toString()}
      width="100%"
      height="600"
      style={{ border: 'none', borderRadius: '12px' }}
      allowFullScreen
    />
  );
}
```

## 响应式建议

```css
.embed-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
}

.embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}
```

```html
<div class="embed-container">
  <iframe src="https://your-domain.com/embed?layers=footprints" />
</div>
```

## 主题色参考

| 颜色 | Hex | URL encoded |
|------|-----|-------------|
| 靛蓝 | `#6366f1` | `%236366f1` |
| 翠绿 | `#22c55e` | `%2322c55e` |
| 琥珀 | `#f59e0b` | `%23f59e0b` |
| 玫红 | `#ec4899` | `%23ec4899` |
| 天蓝 | `#0ea5e9` | `%230ea5e9` |
| 紫色 | `#8b5cf6` | `%238b5cf6` |

## 自部署

```bash
# 克隆仓库
git clone https://github.com/your-org/map-project.git
cd map-project/frontend

# 安装依赖
npm install

# 开发
npm run dev

# Docker 部署
cd .. && docker compose up --build
```

嵌入地址将变为 `http://your-server:3000/embed?...`
