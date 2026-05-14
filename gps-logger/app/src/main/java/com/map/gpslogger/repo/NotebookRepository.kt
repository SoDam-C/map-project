package com.map.gpslogger.repo

import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.data.NotebookDao
import com.map.gpslogger.data.NotebookEntity
import com.map.gpslogger.util.IdGenerator
import kotlinx.coroutines.flow.Flow

class NotebookRepository {

    private val dao: NotebookDao get() = GpsLoggerApp.instance.database.notebookDao()

    fun getActive(): Flow<List<NotebookEntity>> = dao.getActive()

    fun getAll(): Flow<List<NotebookEntity>> = dao.getAll()

    fun getArchived(): Flow<List<NotebookEntity>> = dao.getArchived()

    suspend fun getById(id: String): NotebookEntity? = dao.getById(id)

    suspend fun getDefault(): NotebookEntity? = dao.getDefault()

    suspend fun ensureDefault() {
        if (dao.count() == 0) {
            val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
                .format(java.util.Date())
            dao.insert(NotebookEntity(
                id = "default",
                title = "日记",
                icon = "📖",
                color = 0xFF6366F1,
                type = "general",
                startDate = null,
                endDate = null,
                isDefault = true,
                sortOrder = 0,
                createdAt = now,
                updatedAt = now,
            ))
        }
    }

    suspend fun createNotebook(title: String, icon: String, type: String = "custom"): String {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        val id = IdGenerator.notebookId()
        val count = dao.count()
        val colors = listOf(0xFF3B82F6, 0xFF22C55E, 0xFFF59E0B, 0xFFEF4444, 0xFF8B5CF6, 0xFFEC4899, 0xFF14B8A6, 0xFFF97316)
        dao.insert(NotebookEntity(
            id = id,
            title = title,
            icon = icon,
            color = colors[count % colors.size],
            type = type,
            startDate = null,
            endDate = null,
            sortOrder = count,
            createdAt = now,
            updatedAt = now,
        ))
        return id
    }

    suspend fun updateNotebook(notebook: NotebookEntity) {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        dao.update(notebook.copy(updatedAt = now))
    }

    suspend fun archiveNotebook(id: String) {
        val notebook = dao.getById(id) ?: return
        dao.update(notebook.copy(isArchived = true, updatedAt =
            java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).format(java.util.Date())))
    }

    suspend fun unarchiveNotebook(id: String) {
        val notebook = dao.getById(id) ?: return
        dao.update(notebook.copy(isArchived = false, updatedAt =
            java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).format(java.util.Date())))
    }

    suspend fun deleteNotebook(id: String) {
        if (id == "default") return // 不删除默认笔记本
        dao.delete(id)
    }
}
