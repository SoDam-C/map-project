package com.map.gpslogger.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.data.GpsPointEntity
import com.map.gpslogger.data.TrackEntity
import com.map.gpslogger.util.PointsBatch
import com.map.gpslogger.util.ServerPoint
import com.map.gpslogger.util.ServerTrack
import com.map.gpslogger.util.isNetworkAvailable
import com.map.gpslogger.util.uploadToServer
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

class UploadWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        if (!isNetworkAvailable(applicationContext)) {
            Log.d(TAG, "No network, skipping upload")
            return Result.success()
        }

        val db = GpsLoggerApp.instance.database
        val pointDao = db.gpsPointDao()
        val trackDao = db.trackDao()

        // 查询未上传的点
        val unuploadedPoints = pointDao.getUnuploadedPoints(UPLOAD_BATCH_SIZE)
        if (unuploadedPoints.isEmpty()) {
            Log.d(TAG, "No unuploaded points")
            return Result.success()
        }

        // 按 trackId 分组
        val grouped = unuploadedPoints.groupBy { it.trackId }

        // 构造服务端 Track 对象
        val serverTracks = mutableListOf<ServerTrack>()
        val serverPoints = mutableListOf<PointsBatch>()

        for ((trackId, points) in grouped) {
            val track = trackDao.getTrack(trackId) ?: continue

            val isoFormatter = DateTimeFormatter.ISO_INSTANT

            serverTracks.add(
                ServerTrack(
                    id = track.id,
                    deviceId = track.deviceId,
                    title = track.title,
                    type = track.type,
                    sportType = track.sportType,
                    startTime = Instant.ofEpochMilli(track.startTime).toString(),
                    endTime = track.endTime?.let { Instant.ofEpochMilli(it).toString() } ?: Instant.now().toString(),
                    distance = track.distance.toLong(),
                    duration = track.duration,
                    pointCount = points.size,
                    bounds = track.bounds,
                    createdAt = Instant.ofEpochMilli(track.createdAt).toString(),
                    updatedAt = Instant.ofEpochMilli(track.updatedAt).toString(),
                )
            )

            serverPoints.add(
                PointsBatch(
                    trackId = trackId,
                    points = points.map { p ->
                        ServerPoint(
                            lat = p.lat,
                            lng = p.lng,
                            elevation = p.elevation,
                            accuracy = p.accuracy,
                            speed = p.speed,
                            bearing = p.bearing,
                            timestamp = p.timestamp,
                        )
                    },
                )
            )
        }

        // 上传
        val result = uploadToServer(serverTracks, serverPoints, applicationContext)
        if (result != null && result.success) {
            // 标记已上传
            for (trackId in grouped.keys) {
                pointDao.markUploaded(trackId)
                trackDao.markUploaded(trackId)
            }
            Log.d(TAG, "Upload success: ${result.points} points, ${result.saved} tracks")
            return Result.success()
        }

        Log.w(TAG, "Upload failed, will retry")
        return Result.retry()
    }

    companion object {
        private const val TAG = "UploadWorker"
        private const val UPLOAD_BATCH_SIZE = 5000
        private const val WORK_NAME = "gps_upload"

        /** 注册周期上传任务（15 分钟一次，WiFi 约束） */
        fun schedule(context: Context) {
            val constraints = androidx.work.Constraints.Builder()
                .setRequiredNetworkType(NetworkType.UNMETERED) // WiFi
                .setRequiresBatteryNotLow(true)
                .build()

            val request = PeriodicWorkRequestBuilder<UploadWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setBackoffCriteria(
                    androidx.work.BackoffPolicy.EXPONENTIAL,
                    10,
                    TimeUnit.MINUTES,
                )
                .build()

            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    request,
                )
        }

        /** 立即执行一次上传（手动触发） */
        fun enqueueNow(context: Context) {
            val request = OneTimeWorkRequestBuilder<UploadWorker>()
                .setConstraints(
                    androidx.work.Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build(),
                )
                .setBackoffCriteria(
                    androidx.work.BackoffPolicy.EXPONENTIAL,
                    30,
                    TimeUnit.SECONDS,
                )
                .build()

            WorkManager.getInstance(context)
                .enqueue(request)
        }
    }
}
