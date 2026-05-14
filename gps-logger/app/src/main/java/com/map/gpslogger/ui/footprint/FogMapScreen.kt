package com.map.gpslogger.ui.footprint

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.navigation.NavController
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.model.ExplorerLevel
import com.map.gpslogger.model.AdminRegions
import com.map.gpslogger.data.FootprintEntity
import com.map.gpslogger.data.GpsPointEntity
import com.map.gpslogger.data.TrackEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.geojson.Feature
import org.maplibre.geojson.FeatureCollection
import org.maplibre.geojson.LineString
import org.maplibre.geojson.Point

private const val TAG = "FogMap"

enum class MapStyle(val label: String, val icon: String) {
    LIGHT("亮色", "light"),
    DARK("暗色", "dark"),
    SATELLITE("卫星", "satellite"),
}

private val STYLE_URLS = mapOf(
    MapStyle.LIGHT to "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    MapStyle.DARK to "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
)

private const val SATELLITE_STYLE = """{"version":8,"sources":{"sat":{"type":"raster","tiles":["https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}","https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}","https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}","https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"],"tileSize":256}},"layers":[{"id":"sat-tiles","type":"raster","source":"sat"}]}"""

data class MapStats(
    val trackCount: Int = 0,
    val pointCount: Int = 0,
    val provinceCount: Int = 0,
    val exploredKm2: Double = 0.0,
    val totalDistanceKm: Double = 0.0,
    val level: Int = 1,
    val levelEmoji: String = "🌱",
    val levelName: String = "新手探索者",
    val trackingDays: Int = 0,
    val lastPoint: GpsPointEntity? = null,
)

private data class MapData(
    val tracks: List<TrackEntity>,
    val points: List<GpsPointEntity>,
    val footprints: List<FootprintEntity>,
    val stats: MapStats,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FogMapScreen(navController: NavController) {
    val lifecycleOwner = LocalLifecycleOwner.current
    var isLoading by remember { mutableStateOf(true) }
    var stats by remember { mutableStateOf(MapStats()) }
    var mapView by remember { mutableStateOf<MapView?>(null) }
    var mapRef by remember { mutableStateOf<MapLibreMap?>(null) }
    var mapData by remember { mutableStateOf<MapData?>(null) }
    var selectedStyle by remember { mutableStateOf(MapStyle.DARK) }
    var showStylePicker by remember { mutableStateOf(false) }
    var showStatsPanel by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // MapView lifecycle
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> mapView?.onStart()
                Lifecycle.Event.ON_RESUME -> mapView?.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView?.onPause()
                Lifecycle.Event.ON_STOP -> mapView?.onStop()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            mapView?.onDestroy()
            mapView = null
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // MapView
        AndroidView(
            factory = { ctx ->
                val mv = MapView(ctx)
                mapView = mv
                mv.getMapAsync { map ->
                    mapRef = map
                    // Load data and set up map
                    scope.launch(Dispatchers.IO) {
                        try {
                            val data = loadMapData()
                            mapData = data
                            stats = data.stats
                            withContext(Dispatchers.Main) {
                                if (mapView == null) return@withContext
                                applyStyleAndData(map, selectedStyle, data)
                                isLoading = false
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error loading map", e)
                            withContext(Dispatchers.Main) { isLoading = false }
                        }
                    }
                }
                mv
            },
            modifier = Modifier.fillMaxSize()
        )

        // Top bar overlay (transparent, floating)
        Row(
            modifier = Modifier
                .align(Alignment.TopStart)
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            // Level badge
            LevelBadge(level = stats.level, emoji = stats.levelEmoji, name = stats.levelName)

            // Stats card (toggleable)
            if (showStatsPanel) {
                StatsCard(stats = stats)
            }
        }

        // Bottom-right controls
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 12.dp, bottom = 24.dp),
            horizontalAlignment = Alignment.End,
        ) {
            // Stats toggle
            FloatingActionButton(
                onClick = { showStatsPanel = !showStatsPanel },
                modifier = Modifier
                    .padding(bottom = 8.dp)
                    .size(40.dp),
                containerColor = Color(0xEE1a1a2e),
                contentColor = Color.White,
            ) {
                Icon(Icons.Filled.Info, contentDescription = "统计", modifier = Modifier.size(20.dp))
            }

            // My location button
            FloatingActionButton(
                onClick = {
                    val lastPt = stats.lastPoint
                    if (lastPt != null) {
                        mapRef?.animateCamera(
                            CameraUpdateFactory.newLatLngZoom(
                                LatLng(lastPt.lat, lastPt.lng), 15.0
                            )
                        )
                    }
                },
                modifier = Modifier
                    .padding(bottom = 8.dp)
                    .size(40.dp),
                containerColor = Color(0xEE1a1a2e),
                contentColor = Color.White,
            ) {
                Icon(Icons.Filled.MyLocation, contentDescription = "定位", modifier = Modifier.size(20.dp))
            }

            // Map style switcher
            Box {
                FloatingActionButton(
                    onClick = { showStylePicker = !showStylePicker },
                    containerColor = Color(0xEE1a1a2e),
                    contentColor = Color.White,
                ) {
                    Icon(Icons.Filled.Layers, contentDescription = "地图源")
                }

                // Style picker popup
                if (showStylePicker) {
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(end = 52.dp, bottom = 4.dp)
                            .background(Color(0xEE1a1a2e), RoundedCornerShape(8.dp))
                            .padding(4.dp),
                    ) {
                        MapStyle.values().forEach { style ->
                            val isSelected = style == selectedStyle
                            Text(
                                text = style.label,
                                color = if (isSelected) Color(0xFFFFD700) else Color.White,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                modifier = Modifier
                                    .clickable {
                                        if (style != selectedStyle) {
                                            selectedStyle = style
                                            val data = mapData
                                            val map = mapRef
                                            if (data != null && map != null) {
                                                applyStyleAndData(map, style, data)
                                            }
                                        }
                                        showStylePicker = false
                                    }
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                fontSize = 14.sp,
                            )
                        }
                    }
                }
            }
        }

        // Loading
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = Color(0xFF00E5FF)
            )
        }
    }
}

// ========== Style & Data Application ==========

private fun applyStyleAndData(map: MapLibreMap, style: MapStyle, data: MapData) {
    val styleUrl = if (style == MapStyle.SATELLITE) SATELLITE_STYLE else STYLE_URLS[style]!!
    val isDark = style == MapStyle.DARK || style == MapStyle.SATELLITE
    val trackColor = if (isDark) "#00E5FF" else "#2962FF"
    val pointColor = if (isDark) "#00E5FF" else "#2962FF"

    // Save camera position
    val currentCamera = map.cameraPosition

    map.setStyle(styleUrl) { mapStyle ->
        // Track lines
        val trackFeatures = data.tracks.mapNotNull { track ->
            val tps = data.points.filter { it.trackId == track.id }
            if (tps.size < 2) return@mapNotNull null
            Feature.fromGeometry(
                LineString.fromLngLats(tps.map { Point.fromLngLat(it.lng, it.lat) })
            )
        }
        if (trackFeatures.isNotEmpty()) {
            mapStyle.addSource(GeoJsonSource(
                "tracks-source", FeatureCollection.fromFeatures(trackFeatures)
            ))
            val lineLayer = LineLayer("track-line", "tracks-source")
            lineLayer.setProperties(
                PropertyFactory.lineColor(trackColor),
                PropertyFactory.lineWidth(4f),
                PropertyFactory.lineOpacity(0.9f),
                PropertyFactory.lineCap("round"),
                PropertyFactory.lineJoin("round"),
            )
            mapStyle.addLayer(lineLayer)
        }

        // GPS point dots
        if (data.points.isNotEmpty()) {
            val pointFeatures = data.points.map { p ->
                Feature.fromGeometry(Point.fromLngLat(p.lng, p.lat))
            }
            mapStyle.addSource(GeoJsonSource(
                "points-source", FeatureCollection.fromFeatures(pointFeatures)
            ))
            val dotLayer = CircleLayer("gps-point-dot", "points-source")
            dotLayer.setProperties(
                PropertyFactory.circleRadius(4f),
                PropertyFactory.circleColor(pointColor),
                PropertyFactory.circleOpacity(0.7f),
            )
            mapStyle.addLayer(dotLayer)
        }

        // Footprint province glow
        if (data.footprints.isNotEmpty()) {
            val fpFeatures = data.footprints.map { fp ->
                Feature.fromGeometry(Point.fromLngLat(fp.centerLng, fp.centerLat))
            }
            mapStyle.addSource(GeoJsonSource(
                "footprints-source", FeatureCollection.fromFeatures(fpFeatures)
            ))
            val glowLayer = CircleLayer("footprint-glow", "footprints-source")
            glowLayer.setProperties(
                PropertyFactory.circleRadius(50f),
                PropertyFactory.circleColor("#FFD700"),
                PropertyFactory.circleOpacity(0.2f),
                PropertyFactory.circleBlur(1f),
            )
            mapStyle.addLayer(glowLayer)
        }

        // Restore camera or set initial position
        val lastPt = data.stats.lastPoint
        if (currentCamera.target != null && currentCamera.zoom > 1.0) {
            map.cameraPosition = currentCamera
        } else if (lastPt != null) {
            map.cameraPosition = CameraPosition.Builder()
                .target(LatLng(lastPt.lat, lastPt.lng))
                .zoom(14.0)
                .build()
        } else {
            map.cameraPosition = CameraPosition.Builder()
                .target(LatLng(35.0, 105.0))
                .zoom(4.0)
                .build()
        }
    }
}

// ========== Data Loading ==========

private suspend fun loadMapData(): MapData {
    val db = GpsLoggerApp.instance.database
    val tracks = db.trackDao().getAllOnce()
    val footprints = db.footprintDao().getByLevel(1)

    val trackIds = tracks.map { it.id }
    val points = if (trackIds.isNotEmpty())
        db.gpsPointDao().getByTrackIds(trackIds)
    else emptyList()

    // Last GPS point for camera focus
    val lastPoint = if (points.isNotEmpty()) points.last() else null

    // Explored area estimate
    val cellSize = 0.001
    val exploredCells = mutableSetOf<Pair<Int, Int>>()
    for (p in points) {
        exploredCells.add((p.lng / cellSize).toInt() to (p.lat / cellSize).toInt())
    }
    val cellAreaKm2 = (cellSize * 111.0) * (cellSize * 111.0)
    val exploredKm2 = exploredCells.size * cellAreaKm2

    val totalDistanceKm = tracks.sumOf { it.distance } / 1000.0
    val firstTs = tracks.minOfOrNull { it.startTime } ?: 0L
    val trackingDays = if (firstTs > 0) {
        ((System.currentTimeMillis() - firstTs) / (1000 * 60 * 60 * 24)).toInt().coerceAtLeast(1)
    } else 0

    val level = calculateLevel(exploredKm2, footprints.size, totalDistanceKm, trackingDays)

    // Use ExplorerLevel based on province coverage
    val overallPercent = if (AdminRegions.provinces.isNotEmpty()) {
        (footprints.size.toFloat() / AdminRegions.provinces.size * 100).toInt()
    } else 0
    val explorerLevel = ExplorerLevel.calculate(overallPercent)

    return MapData(
        tracks = tracks,
        points = points,
        footprints = footprints,
        stats = MapStats(
            trackCount = tracks.size,
            pointCount = points.size,
            provinceCount = footprints.size,
            exploredKm2 = exploredKm2,
            totalDistanceKm = totalDistanceKm,
            level = level,
            levelEmoji = explorerLevel.emoji,
            levelName = explorerLevel.name,
            trackingDays = trackingDays,
            lastPoint = lastPoint,
        )
    )
}

private fun calculateLevel(km2: Double, provinces: Int, km: Double, days: Int): Int {
    val score = km2 * 2.0 + provinces * 50.0 + km * 0.5 + days * 5.0
    return (1 + kotlin.math.sqrt(score).toInt()).coerceIn(1, 9999)
}

// ========== UI Components ==========

@Composable
private fun LevelBadge(level: Int, emoji: String, name: String) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Color(0xEE1a1a2e),
        shadowElevation = 4.dp,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(emoji, fontSize = 18.sp)
            Spacer(modifier = Modifier.width(6.dp))
            Column {
                Text(name, fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                Text("LV $level", fontSize = 9.sp, color = Color(0xFF8b949e))
            }
        }
    }
}

@Composable
private fun StatsCard(stats: MapStats) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = Color(0xEE1a1a2e),
        shadowElevation = 4.dp,
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text("探索统计", style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF8b949e), fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            StatRow("探索面积", formatArea(stats.exploredKm2))
            StatRow("省份", "${stats.provinceCount} / 34")
            StatRow("总里程", formatDistance(stats.totalDistanceKm))
            StatRow("轨迹", "${stats.trackCount}")
            StatRow("记录天数", "${stats.trackingDays} 天")
        }
    }
}

@Composable
private fun StatRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, color = Color(0xFFc9d1d9), fontSize = 12.sp)
        Text(value, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}

private fun formatArea(km2: Double): String = when {
    km2 < 1 -> "${"%.0f".format(km2 * 100)} 公亩"
    km2 < 100 -> "${"%.1f".format(km2)} km²"
    else -> "${"%.0f".format(km2)} km²"
}

private fun formatDistance(km: Double): String = when {
    km < 1 -> "${"%.0f".format(km * 1000)} m"
    km < 100 -> "${"%.1f".format(km)} km"
    else -> "${"%.0f".format(km)} km"
}
