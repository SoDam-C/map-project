package com.map.gpslogger.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.map.gpslogger.GpsLoggerApp
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
private val JSON_TYPE = "application/json; charset=utf-8".toMediaType()

@Serializable
data class ServerDiaryEntry(
    val id: String,
    val type: String,
    val date: String,
    val startTime: String? = null,
    val endTime: String? = null,
    val title: String,
    val locationName: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val content: String,
    val mood: String? = null,
    val tags: List<String> = emptyList(),
    val trackIds: List<String> = emptyList(),
    val photoRefs: List<ServerPhotoRef> = emptyList(),
    val tripId: String? = null,
    val notebookId: String = "default",
    val status: String,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class ServerPhotoRef(
    val id: String,
    val url: String,
    val caption: String? = null,
    val takenAt: String? = null,
)

class DiaryUploadWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val db = GpsLoggerApp.instance.database
        val dao = db.diaryEntryDao()

        val entries = dao.getUnsynced()
        if (entries.isEmpty()) {
            return Result.success()
        }

        val serverEntries = entries.map { e ->
            val parsedTags: List<String> = if (!e.tags.isNullOrBlank()) {
                try { json.decodeFromString<List<String>>(e.tags) } catch (_: Exception) { emptyList() }
            } else emptyList()
            val trackIds: List<String> = if (!e.trackIds.isNullOrBlank()) {
                try { json.decodeFromString<List<String>>(e.trackIds) } catch (_: Exception) { emptyList() }
            } else emptyList()
            val photoRefs: List<ServerPhotoRef> = if (e.photoRefsJson.isNotBlank() && e.photoRefsJson != "[]") {
                try { json.decodeFromString<List<ServerPhotoRef>>(e.photoRefsJson) } catch (_: Exception) { emptyList() }
            } else emptyList()

            ServerDiaryEntry(
                id = e.id,
                type = e.type,
                date = e.date,
                startTime = e.startTime,
                endTime = e.endTime,
                title = e.title,
                locationName = e.locationName,
                lat = e.lat,
                lng = e.lng,
                content = e.content,
                mood = e.mood,
                tags = parsedTags,
                trackIds = trackIds,
                photoRefs = photoRefs,
                tripId = e.tripId,
                notebookId = e.notebookId,
                status = e.status,
                createdAt = e.createdAt,
                updatedAt = e.updatedAt,
            )
        }

        val body = json.encodeToString(mapOf("entries" to serverEntries))
        val url = "${com.map.gpslogger.util.getServerUrl(applicationContext)}/api/diary"

        return try {
            val request = Request.Builder()
                .url(url)
                .post(body.toRequestBody(JSON_TYPE))
                .build()
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                serverEntries.forEach { dao.markSynced(it.id) }
                Log.d(TAG, "Uploaded ${serverEntries.size} diary entries")
                Result.success()
            } else {
                Log.e(TAG, "Upload failed: ${response.code}")
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Upload error", e)
            Result.retry()
        }
    }

    companion object {
        private const val TAG = "DiaryUpload"

        fun enqueueNow(context: Context) {
            val request = OneTimeWorkRequestBuilder<DiaryUploadWorker>()
                .build()
            WorkManager.getInstance(context).enqueue(request)
        }
    }
}
