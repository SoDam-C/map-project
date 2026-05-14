package com.map.gpslogger.worker

import android.content.Context
import android.util.Log
import androidx.work.*
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.data.DiaryEntryEntity
import com.map.gpslogger.data.DiaryTripEntity
import com.map.gpslogger.data.FootprintEntity
import com.map.gpslogger.util.getServerUrl
import com.map.gpslogger.util.isWifiConnected
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
private val client = OkHttpClient.Builder()
    .connectTimeout(15, TimeUnit.SECONDS)
    .writeTimeout(60, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

@Serializable
data class SyncDiaryEntry(
    val id: String,
    val type: String,
    val date: String,
    val title: String,
    val content: String,
    val locationName: String?,
    val mood: String?,
    val tags: String?,
    val status: String,
    val updatedAt: String,
)

@Serializable
data class SyncFootprint(
    val id: String,
    val adcode: String,
    val name: String,
    val level: Int,
    val centerLat: Double,
    val centerLng: Double,
    val litAt: String,
    val source: String,
)

class SyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        if (!isWifiConnected(applicationContext)) {
            Log.d(TAG, "Not on WiFi, skipping sync")
            return Result.success()
        }

        val db = GpsLoggerApp.instance.database
        val baseUrl = getServerUrl(applicationContext)

        return try {
            // Push unsynced diary entries
            pushDiaryEntries(db.diaryEntryDao().getUnsynced(), baseUrl)
            // Push unsynced trips
            pushTrips(db.diaryTripDao().getUnsynced(), baseUrl)
            // Push unsynced footprints
            pushFootprints(db.footprintDao().getUnsynced(), baseUrl)

            Log.d(TAG, "Sync completed successfully")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Sync failed", e)
            Result.retry()
        }
    }

    private suspend fun pushDiaryEntries(entries: List<DiaryEntryEntity>, baseUrl: String) {
        if (entries.isEmpty()) return
        val syncEntries = entries.map {
            SyncDiaryEntry(
                id = it.id, type = it.type, date = it.date,
                title = it.title, content = it.content,
                locationName = it.locationName, mood = it.mood,
                tags = it.tags, status = it.status, updatedAt = it.updatedAt,
            )
        }
        val body = json.encodeToString(syncEntries)
        val request = Request.Builder()
            .url("$baseUrl/api/diary")
            .post(body.toRequestBody(JSON_MEDIA_TYPE))
            .build()

        val response = client.newCall(request).execute()
        if (response.isSuccessful) {
            val dao = GpsLoggerApp.instance.database.diaryEntryDao()
            entries.forEach { dao.markSynced(it.id) }
            Log.d(TAG, "Pushed ${entries.size} diary entries")
        } else {
            Log.e(TAG, "Failed to push diary entries: ${response.code}")
        }
    }

    private suspend fun pushTrips(trips: List<DiaryTripEntity>, baseUrl: String) {
        if (trips.isEmpty()) return
        val body = json.encodeToString(trips.map {
            mapOf(
                "id" to it.id, "title" to it.title,
                "description" to (it.description ?: ""),
                "startDate" to it.startDate, "endDate" to it.endDate,
                "updatedAt" to it.updatedAt,
            )
        })
        val request = Request.Builder()
            .url("$baseUrl/api/diary/trips")
            .post(body.toRequestBody(JSON_MEDIA_TYPE))
            .build()

        val response = client.newCall(request).execute()
        if (response.isSuccessful) {
            val dao = GpsLoggerApp.instance.database.diaryTripDao()
            trips.forEach { dao.markSynced(it.id) }
            Log.d(TAG, "Pushed ${trips.size} trips")
        }
    }

    private suspend fun pushFootprints(footprints: List<FootprintEntity>, baseUrl: String) {
        if (footprints.isEmpty()) return
        val syncFootprints = footprints.map {
            SyncFootprint(
                id = it.id, adcode = it.adcode, name = it.name,
                level = it.level, centerLat = it.centerLat, centerLng = it.centerLng,
                litAt = it.litAt, source = it.source,
            )
        }
        val body = json.encodeToString(syncFootprints)
        val request = Request.Builder()
            .url("$baseUrl/api/footprints")
            .post(body.toRequestBody(JSON_MEDIA_TYPE))
            .build()

        val response = client.newCall(request).execute()
        if (response.isSuccessful) {
            val dao = GpsLoggerApp.instance.database.footprintDao()
            footprints.forEach { dao.markSynced(it.id) }
            Log.d(TAG, "Pushed ${footprints.size} footprints")
        }
    }

    companion object {
        private const val TAG = "SyncWorker"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.UNMETERED) // WiFi only
                .build()

            val request = PeriodicWorkRequestBuilder<SyncWorker>(15, java.util.concurrent.TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, java.util.concurrent.TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork("diary_sync", ExistingPeriodicWorkPolicy.KEEP, request)
        }
    }
}
