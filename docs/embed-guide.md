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

### 自定义数据（外挂图层）

通过 `data` 参数传入外部 GeoJSON 文件的 URL，地图会自动拉取并渲染为自定义图层。

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `data` | GeoJSON 数据文件 URL | — | `https://mysite.com/points.geojson` |
| `dataColor` | 数据点/线/面颜色 | 跟随 `accent` | `%23ff0000` |
| `dataRadius` | 圆点半径（Point 数据） | `6` | `10` |
| `dataLineWidth` | 线条宽度（Line/Polygon 数据） | `2` | `4` |
| `dataOpacity` | 透明度 0-1 | `0.85` | `0.6` |
| `dataLabel` | 标签字段名（显示文字标注） | — | `name` |
| `dataName` | 图例中显示的名称 | `自定义数据` | `我的店铺` |

**支持的几何类型：**
- `Point` / `MultiPoint` → 圆点标记
- `LineString` / `MultiLineString` → 线条
- `Polygon` / `MultiPolygon` → 填充区域 + 边框

**注意事项：**
- GeoJSON 文件需要允许跨域（CORS），即服务器需返回 `Access-Control-Allow-Origin: *`
- 数据加载后会自动缩放地图以适配数据范围（除非指定了 `center`）
- GeoJSON Feature 的 `properties` 中可以有任意字段，`dataLabel` 指定哪个字段作为文字标签

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

### 自定义数据 — 展示自己的 POI

```html
<iframe
  src="https://your-domain.com/embed?data=https://mysite.com/shops.geojson&dataColor=%23ff0000&dataRadius=8&dataLabel=name&dataName=我的店铺&legend=true"
  width="100%"
  height="600"
/>
```

GeoJSON 文件示例（`shops.geojson`）：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "旗舰店", "type": "直营" },
      "geometry": { "type": "Point", "coordinates": [116.4, 39.9] }
    },
    {
      "type": "Feature",
      "properties": { "name": "中关村店", "type": "加盟" },
      "geometry": { "type": "Point", "coordinates": [116.32, 39.98] }
    }
  ]
}
```

### 自定义数据 — 展示路线

```html
<iframe
  src="https://your-domain.com/embed?data=https://mysite.com/route.geojson&dataColor=%2322c55e&dataLineWidth=4&dataName=配送路线&legend=true&basemap=dark"
  width="100%"
  height="500"
/>
```

### 自定义数据 + 足迹叠加

```html
<iframe
  src="https://your-domain.com/embed?layers=footprints&data=https://mysite.com/regions.geojson&dataColor=%23f59e0b&dataName=销售区域&legend=true"
  width="100%"
  height="600"
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
