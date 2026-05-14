package com.map.gpslogger.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.display.DisplayManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.R
import com.map.gpslogger.data.GpsPointEntity
import com.map.gpslogger.data.TrackEntity
import com.map.gpslogger.model.AdminRegions
import com.map.gpslogger.repo.FootprintRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.UUID

class GpsService : Service() {

    private lateinit var fusedClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var currentTrackId: String? = null
    private var totalPoints = 0
    private var totalDistance = 0.0
    private var isScreenOn = true
    private var currentSpeed = 0f
    private var currentInterval = 30_000L  // 当前实际间隔，避免频繁重启定位

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var statsJob: Job? = null

    // bounds 追踪
    private var minLng = Double.MAX_VALUE
    private var minLat = Double.MAX_VALUE
    private var maxLng = -Double.MAX_VALUE
    private var maxLat = -Double.MAX_VALUE
    private var firstTimestamp: Long = 0L

    private val displayListener = object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) {}
        override fun onDisplayRemoved(displayId: Int) {}
        override fun onDisplayChanged(displayId: Int) {
            val dm = getSystemService(DISPLAY_SERVICE) as DisplayManager
            isScreenOn = dm.getDisplay(0)?.state == android.view.Display.STATE_ON
            updateLocationInterval()
        }
    }

    override fun onCreate() {
        super.onCreate()
        fusedClient = LocationServices.getFusedLocationProviderClient(this)

        val dm = getSystemService(DISPLAY_SERVICE) as DisplayManager
        dm.registerDisplayListener(displayListener, null)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    onLocationReceived(location)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        createNotificationChannel()

        try {
            val notification = buildNotification(0, "0.0 km")
            startForeground(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start foreground", e)
            stopSelf()
            return START_NOT_STICKY
        }

        // 检查是否已有活跃轨迹
        serviceScope.launch {
            try {
                val activeTrack = GpsLoggerApp.instance.database.trackDao().getActiveTrack()
                if (activeTrack != null) {
                    currentTrackId = activeTrack.id
                    totalPoints = GpsLoggerApp.instance.database.gpsPointDao().getPointCount(activeTrack.id)
                    totalDistance = activeTrack.distance
                    firstTimestamp = activeTrack.startTime
                    restoreBounds(activeTrack.bounds)
                } else {
                    startNewTrack()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load track data", e)
            }
        }

        startLocationUpdates()
        startStatsUpdater()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        statsJob?.cancel()

        val dm = getSystemService(DISPLAY_SERVICE) as DisplayManager
        dm.unregisterDisplayListener(displayListener)

        // 结束当前轨迹
        currentTrackId?.let { trackId ->
            serviceScope.launch {
                val dao = GpsLoggerApp.instance.database.trackDao()
                val track = dao.getTrack(trackId) ?: return@launch
                dao.update(track.copy(endTime = System.currentTimeMillis()))
                Log.d(TAG, "Track $trackId ended, ${track.pointCount} points")
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startNewTrack() {
        val trackId = UUID.randomUUID().toString()
        val deviceId = fetchDeviceId()
        val now = System.currentTimeMillis()

        val track = TrackEntity(
            id = trackId,
            deviceId = deviceId,
            title = null,
            type = "continuous",
            sportType = null,
            startTime = now,
            endTime = null,
        )

        serviceScope.launch {
            GpsLoggerApp.instance.database.trackDao().insert(track)
        }

        currentTrackId = trackId
        totalPoints = 0
        totalDistance = 0.0
        firstTimestamp = now
        minLng = Double.MAX_VALUE
        minLat = Double.MAX_VALUE
        maxLng = -Double.MAX_VALUE
        maxLat = -Double.MAX_VALUE

        Log.d(TAG, "New track started: $trackId, device: $deviceId")
    }

    private fun onLocationReceived(location: android.location.Location) {
        val trackId = currentTrackId ?: return

        val lat = location.latitude
        val lng = location.longitude
        val accuracy = location.accuracy
        val speed = location.speed
        val bearing = location.bearing
        val timestamp = location.time

        // 过滤精度太低的点
        if (accuracy > 50) return

        currentSpeed = speed

        // 更新 bounds
        if (lng < minLng) minLng = lng
        if (lat < minLat) minLat = lat
        if (lng > maxLng) maxLng = lng
        if (lat > maxLat) maxLat = lat

        val point = GpsPointEntity(
            trackId = trackId,
            lat = lat,
            lng = lng,
            elevation = location.altitude,
            accuracy = accuracy,
            speed = speed,
            bearing = bearing,
            timestamp = timestamp,
        )

        serviceScope.launch {
            GpsLoggerApp.instance.database.gpsPointDao().insertPoints(listOf(point))
        }

        totalPoints++
        updateNotification()

        // 速度变化时调整间隔
        updateLocationInterval()
    }

    private fun startLocationUpdates() {
        val request = buildLocationRequest()
        try {
            fusedClient.requestLocationUpdates(request, locationCallback, mainLooper)
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission not granted", e)
            stopSelf()
        }
    }

    private fun stopLocationUpdates() {
        fusedClient.removeLocationUpdates(locationCallback)
    }

    private fun buildLocationRequest(): LocationRequest {
        val interval = computeInterval()
        currentInterval = interval

        return LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, interval)
            .setMinUpdateIntervalMillis((interval * 0.5).toLong())
            .setWaitForAccurateLocation(false)
            .build()
    }

    /**
     * 基于速度动态计算定位间隔
     * 亮屏：速度 0→20m/s 对应间隔 30s→2s 线性插值
     * 息屏：仍然跟随速度，但整体更省电
     */
    private fun computeInterval(): Long {
        if (!isScreenOn) {
            // 息屏模式：更省电，但仍追踪移动
            return when {
                currentSpeed > 8f -> 10_000L   // 息屏+快速移动（驾车）：10s
                currentSpeed > 2f -> 20_000L   // 息屏+中速（骑行/跑步）：20s
                currentSpeed > 0.5f -> 30_000L // 息屏+慢速（步行）：30s
                else -> 60_000L                // 息屏+静止：60s
            }
        }

        // 亮屏：基于速度连续插值
        val minInterval = 2_000L    // 下限：2s（高速时）
        val maxInterval = 30_000L   // 上限：30s（静止时）
        val maxSpeed = 20.0f        // 参考最高速度 20m/s ≈ 72km/h

        val speed = currentSpeed.coerceIn(0f, maxSpeed)
        val ratio = speed / maxSpeed
        return (maxInterval - ratio * (maxInterval - minInterval)).toLong()
            .coerceIn(minInterval, maxInterval)
    }

    private fun updateLocationInterval() {
        val newInterval = computeInterval()
        // 间隔变化超过 2 秒才重启定位，避免频繁切换
        if (Math.abs(newInterval - currentInterval) >= 2_000L) {
            currentInterval = newInterval
            try {
                fusedClient.removeLocationUpdates(locationCallback)
                startLocationUpdates()
            } catch (e: SecurityException) {
                Log.e(TAG, "Failed to update interval", e)
            }
        }
    }

    private fun startStatsUpdater() {
        statsJob = serviceScope.launch {
            while (isActive) {
                updateTrackStats()
                delay(5 * 60 * 1000L) // 每 5 分钟
            }
        }
    }

    private suspend fun updateTrackStats() {
        val trackId = currentTrackId ?: return
        val pointDao = GpsLoggerApp.instance.database.gpsPointDao()
        val trackDao = GpsLoggerApp.instance.database.trackDao()

        val track = trackDao.getTrack(trackId) ?: return
        val pointCount = pointDao.getPointCount(trackId)
        val lastPoint = pointDao.getLastPoint(trackId)
        val firstPoint = pointDao.getFirstPoint(trackId)

        val duration = if (firstPoint != null && lastPoint != null) {
            (lastPoint.timestamp - firstPoint.timestamp) / 1000L
        } else 0L

        trackDao.update(
            track.copy(
                pointCount = pointCount,
                distance = totalDistance,
                duration = duration,
                bounds = listOf(minLng, minLat, maxLng, maxLat),
                updatedAt = System.currentTimeMillis(),
            )
        )

        // 自动匹配省份并点亮足迹
        try {
            val lastP = pointDao.getLastPoint(trackId) ?: return
            val province = AdminRegions.findNearestProvince(lastP.lat, lastP.lng)
            if (province != null) {
                val repo = FootprintRepository()
                repo.lightUp(
                    adcode = province.adcode,
                    name = province.name,
                    level = 1,
                    centerLat = province.centerLat,
                    centerLng = province.centerLng,
                    source = "gps",
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Auto-footprint failed", e)
        }
    }

    // ============ 通知 ============

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.channel_name),
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = getString(R.string.channel_description)
            setShowBadge(false)
        }

        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(channel)
    }

    private fun buildNotification(points: Int, distance: String): Notification {
        val stopIntent = Intent(this, GpsService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPending = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text, points, distance))
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setSilent(true)
            .addAction(android.R.drawable.ic_media_pause, getString(R.string.notification_stop), stopPending)
            .build()
    }

    private fun updateNotification() {
        val nm = getSystemService(NotificationManager::class.java)
        val distanceStr = formatDistance(totalDistance)
        val notification = buildNotification(totalPoints, distanceStr)
        nm.notify(NOTIFICATION_ID, notification)
    }

    // ============ 工具 ============

    private fun fetchDeviceId(): String {
        val prefs = getSharedPreferences("gps-logger", MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        if (deviceId == null) {
            deviceId = "android-${android.os.Build.MODEL}-${UUID.randomUUID().toString().slice(0..7)}"
            prefs.edit().putString("device_id", deviceId).apply()
        }
        return deviceId
    }

    private fun restoreBounds(bounds: List<Double>) {
        if (bounds.size == 4) {
            minLng = bounds[0]
            minLat = bounds[1]
            maxLng = bounds[2]
            maxLat = bounds[3]
        }
    }

    private fun formatDistance(meters: Double): String {
        return if (meters < 1000) {
            "${meters.toInt()}m"
        } else {
            "${"%.1f".format(meters / 1000)}km"
        }
    }

    companion object {
        private const val TAG = "GpsService"
        private const val CHANNEL_ID = "gps_recording"
        private const val NOTIFICATION_ID = 1
        const val ACTION_STOP = "com.map.gpslogger.STOP"

        fun start(context: Context) {
            val intent = Intent(context, GpsService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, GpsService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
