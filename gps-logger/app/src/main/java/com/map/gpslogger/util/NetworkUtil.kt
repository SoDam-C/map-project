package com.map.gpslogger.util

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Log
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
data class ServerTrack(
    val id: String,
    val deviceId: String,
    val title: String? = null,
    val type: String = "continuous",
    val sportType: String? = null,
    val startTime: String,
    val endTime: String,
    val distance: Long,
    val duration: Long,
    val pointCount: Int,
    val bounds: List<Double>,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class ServerPoint(
    val lat: Double,
    val lng: Double,
    val elevation: Double? = null,
    val accuracy: Float,
    val speed: Float? = null,
    val bearing: Float? = null,
    val timestamp: Long,
)

@Serializable
data class PointsBatch(
    val trackId: String,
    val points: List<ServerPoint>,
)

@Serializable
data class BatchUploadRequest(
    val tracks: List<ServerTrack>,
    val points: List<PointsBatch>,
)

@Serializable
data class BatchUploadResponse(
    val success: Boolean,
    val saved: Int = 0,
    val points: Int = 0,
    val skipped: Int = 0,
)

fun isWifiConnected(context: Context): Boolean {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = cm.activeNetwork ?: return false
    val caps = cm.getNetworkCapabilities(network) ?: return false
    return caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
}

fun isNetworkAvailable(context: Context): Boolean {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = cm.activeNetwork ?: return false
    val caps = cm.getNetworkCapabilities(network) ?: return false
    return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

fun getServerUrl(context: Context): String {
    val prefs = context.getSharedPreferences("gps-logger", Context.MODE_PRIVATE)
    return prefs.getString("server_url", DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
}

fun setServerUrl(context: Context, url: String) {
    context.getSharedPreferences("gps-logger", Context.MODE_PRIVATE)
        .edit()
        .putString("server_url", url.trimEnd('/'))
        .apply()
}

/**
 * 上传轨迹和 GPS 点到服务端
 * @return true 表示成功
 */
suspend fun uploadToServer(
    tracks: List<ServerTrack>,
    pointsBatches: List<PointsBatch>,
    context: Context,
): BatchUploadResponse? {
    val baseUrl = getServerUrl(context)
    val url = "$baseUrl/api/tracks/batch"

    val body = BatchUploadRequest(tracks = tracks, points = pointsBatches)
    val bodyJson = json.encodeToString(body)
    Log.d(TAG, "Uploading to $url, body size: ${bodyJson.length}")

    val request = Request.Builder()
        .url(url)
        .post(bodyJson.toRequestBody(JSON_MEDIA_TYPE))
        .build()

    return try {
        val response = client.newCall(request).execute()
        if (response.isSuccessful) {
            val responseBody = response.body?.string() ?: return null
            json.decodeFromString<BatchUploadResponse>(responseBody)
        } else {
            Log.e(TAG, "Upload failed: ${response.code} ${response.body?.string()}")
            null
        }
    } catch (e: Exception) {
        Log.e(TAG, "Upload error", e)
        null
    }
}

private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

private const val TAG = "NetworkUtil"
// Tailscale 服务器地址
private const val DEFAULT_SERVER_URL = "http://100.106.252.64:3000"
