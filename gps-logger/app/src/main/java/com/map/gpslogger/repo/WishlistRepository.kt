package com.map.gpslogger.repo

import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.data.WishlistDao
import com.map.gpslogger.data.WishlistEntity
import kotlinx.coroutines.flow.Flow

class WishlistRepository {

    private val dao: WishlistDao get() = GpsLoggerApp.instance.database.wishlistDao()

    fun getAll(): Flow<List<WishlistEntity>> = dao.getAll()

    suspend fun getByAdcode(adcode: String): WishlistEntity? = dao.getByAdcode(adcode)

    suspend fun isWishlisted(adcode: String): Boolean = dao.getByAdcode(adcode) != null

    suspend fun add(adcode: String, name: String, level: Int, priority: String, note: String? = null) {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        dao.insert(WishlistEntity(
            id = adcode,
            adcode = adcode,
            name = name,
            level = level,
            priority = priority,
            note = note,
            addedAt = now,
        ))
    }

    suspend fun remove(adcode: String) = dao.delete(adcode)

    suspend fun updatePriority(adcode: String, priority: String) {
        val existing = dao.getByAdcode(adcode) ?: return
        dao.insert(existing.copy(priority = priority))
    }

    suspend fun count(): Int = dao.count()
}
