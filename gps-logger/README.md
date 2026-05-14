# GPS Logger — Android 持续定位 App

装在二手安卓机上，持续记录 GPS 轨迹，WiFi 时自动上传到服务器。

## 安装

### 方式一：GitHub Actions 自动构建（推荐）

1. Fork 此仓库
2. 编辑 `gps-logger/app/src/main/java/com/map/gpslogger/util/NetworkUtil.kt`，将 `DEFAULT_SERVER_URL` 改为你的 Tailscale 地址
3. Push 到 GitHub
4. 打开 Actions 页面 → Build GPS Logger APK → Run workflow
5. 构建完成后下载 `gps-logger-debug.apk`，安装到手机

### 方式二：Android Studio

1. 用 Android Studio 打开 `gps-logger/` 目录
2. 等待 Gradle sync 完成
3. Run → Build APK

## 配置

编辑 `NetworkUtil.kt` 中的 `DEFAULT_SERVER_URL`：

```kotlin
private const val DEFAULT_SERVER_URL = "http://100.x.x.x:3000"
```

## 使用

1. 安装后授予定位权限 → 自动开始记录
2. 通知栏显示「正在记录 GPS」+ 点数和距离
3. 连接 WiFi 后自动上传（或手动点击上传按钮）
4. Web 端打开足迹页面 → 轨迹 tab → 导入/同步查看

## 省电策略

| 状态 | 定位间隔 |
|------|---------|
| 移动中（速度 > 0.5m/s） | 3 秒 |
| 静止 | 30 秒 |
| 息屏 | 60 秒 |

## 上传策略

- WiFi + 未充电时：每 15 分钟自动上传
- 手动：点击上传按钮立即上传
- 失败自动重试（指数退避，最多 3 次）
