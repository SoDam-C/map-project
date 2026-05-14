package com.map.gpslogger.repo

import android.content.Context
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.data.DiaryEntryDao
import com.map.gpslogger.data.DiaryEntryEntity
import com.map.gpslogger.data.DiaryTripDao
import com.map.gpslogger.data.DiaryTripEntity
import com.map.gpslogger.data.PhotoRef
import com.map.gpslogger.util.IdGenerator
import com.map.gpslogger.util.MarkdownStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

class DiaryRepository {

    private val entryDao: DiaryEntryDao get() = GpsLoggerApp.instance.database.diaryEntryDao()
    private val tripDao: DiaryTripDao get() = GpsLoggerApp.instance.database.diaryTripDao()

    // === Entry CRUD ===

    fun getAllEntries(): Flow<List<DiaryEntryEntity>> = entryDao.getAll()

    fun getEntriesByNotebook(notebookId: String): Flow<List<DiaryEntryEntity>> = entryDao.getByNotebook(notebookId)

    suspend fun getEntry(id: String): DiaryEntryEntity? = entryDao.getById(id)

    suspend fun getEntriesByDate(date: String): List<DiaryEntryEntity> = entryDao.getByDate(date)

    suspend fun getEntriesByDateRange(from: String, to: String): List<DiaryEntryEntity> = entryDao.getByDateRange(from, to)

    suspend fun getAllDates(): List<String> = entryDao.getAllDates()

    suspend fun createEntry(
        type: String = "memory_entry",
        date: String,
        title: String = "",
        content: String = "",
        lat: Double? = null,
        lng: Double? = null,
        locationName: String? = null,
        notebookId: String = "default",
    ): String {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        val id = IdGenerator.diaryId()
        val entry = DiaryEntryEntity(
            id = id,
            type = type,
            date = date,
            startTime = null,
            endTime = null,
            title = title,
            locationName = locationName,
            lat = lat,
            lng = lng,
            adcode = null,
            content = content,
            mood = null,
            tags = null,
            trackIds = null,
            attractionId = null,
            photoRefsJson = "[]",
            tripId = null,
            notebookId = notebookId,
            status = "draft",
            createdAt = now,
            updatedAt = now,
        )
        entryDao.insert(entry)
        // 同步写入 .md 文件
        withContext(Dispatchers.IO) {
            MarkdownStore.writeEntry(GpsLoggerApp.instance, entry)
        }
        return id
    }

    suspend fun updateEntry(entry: DiaryEntryEntity) {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        val updated = entry.copy(updatedAt = now, synced = false)
        entryDao.update(updated)
        // 同步写入 .md 文件
        withContext(Dispatchers.IO) {
            MarkdownStore.writeEntry(GpsLoggerApp.instance, updated)
        }
    }

    suspend fun deleteEntry(id: String) {
        val entry = entryDao.getById(id)
        if (entry != null) {
            entryDao.delete(id)
            // 同步删除 .md 文件
            withContext(Dispatchers.IO) {
                MarkdownStore.deleteEntry(GpsLoggerApp.instance, entry)
            }
        }
    }

    suspend fun searchEntries(query: String): List<DiaryEntryEntity> = entryDao.search(query)

    /** 批量同步所有日记到 .md 文件（初始化或设置中触发） */
    suspend fun syncAllToMarkdown() {
        val entries = entryDao.getAllOnce()
        withContext(Dispatchers.IO) {
            MarkdownStore.syncAllFromRoom(GpsLoggerApp.instance, entries)
        }
    }

    /** 从 .md 文件读取内容（Obsidian 修改后同步回 Room） */
    suspend fun syncContentFromFile(entry: DiaryEntryEntity): DiaryEntryEntity? {
        return withContext(Dispatchers.IO) {
            val content = MarkdownStore.readEntryContent(GpsLoggerApp.instance, entry) ?: return@withContext null
            val updated = entry.copy(content = content)
            entryDao.update(updated)
            updated
        }
    }

    // === Trip CRUD ===

    fun getAllTrips(): Flow<List<DiaryTripEntity>> = tripDao.getAll()

    suspend fun getTrip(id: String): DiaryTripEntity? = tripDao.getById(id)

    suspend fun createTrip(title: String, startDate: String, endDate: String): String {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        val id = IdGenerator.tripId()
        val trip = DiaryTripEntity(
            id = id,
            title = title,
            description = null,
            coverImageUrl = null,
            startDate = startDate,
            endDate = endDate,
            destinations = null,
            entryIds = null,
            trackIds = null,
            createdAt = now,
            updatedAt = now,
        )
        tripDao.insert(trip)
        return id
    }

    suspend fun updateTrip(trip: DiaryTripEntity) {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        tripDao.update(trip.copy(updatedAt = now, synced = false))
    }

    suspend fun deleteTrip(id: String) = tripDao.delete(id)

    // === Stats ===

    suspend fun getEntryCount() = entryDao.totalCount()
    suspend fun getPublishedCount() = entryDao.publishedCount()
    suspend fun getDraftCount() = entryDao.draftCount()
    suspend fun getWithPhotosCount() = entryDao.withPhotosCount()

    suspend fun getDailyCounts(startDate: String) = entryDao.getDailyCounts(startDate)
    suspend fun getMoodDistribution() = entryDao.getMoodDistribution()
    suspend fun getTypeDistribution() = entryDao.getTypeDistribution()
    suspend fun getAllDatesOrdered() = entryDao.getAllDatesOrdered()
}
