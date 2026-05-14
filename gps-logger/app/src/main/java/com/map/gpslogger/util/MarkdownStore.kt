package com.map.gpslogger.util

import android.content.Context
import android.util.Log
import com.map.gpslogger.data.DiaryEntryEntity
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * 混合存储：Room 管元数据，.md 文件存内容。
 * 文件结构：<storage>/diary/YYYY/MM/YYYY-MM-DD-标题.md
 * YAML frontmatter 兼容 Obsidian。
 */
object MarkdownStore {

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true; prettyPrint = true }
    private const val TAG = "MarkdownStore"
    private const val DIR_NAME = "diary"

    @Serializable
    data class Frontmatter(
        val id: String,
        val type: String,
        val notebook: String,
        val date: String,
        val startTime: String? = null,
        val mood: String? = null,
        val location: String? = null,
        val lat: Double? = null,
        val lng: Double? = null,
        val adcode: String? = null,
        val tags: List<String> = emptyList(),
        val status: String,
        val createdAt: String,
        val updatedAt: String,
    )

    /** 获取日记文件夹路径 */
    fun getDiaryDir(context: Context): File {
        // 使用外部存储（用户可访问），回退到内部存储
        val dirs = context.getExternalFilesDirs(null)
        val base = if (dirs != null && dirs.isNotEmpty() && dirs[0] != null) dirs[0] else context.filesDir
        val dir = File(base, DIR_NAME)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    /** 写入日记到 .md 文件 */
    fun writeEntry(context: Context, entry: DiaryEntryEntity) {
        try {
            val dir = getDiaryDir(context)
            val yearMonth = File(dir, entry.date.take(7).replace("-", "/"))
            if (!yearMonth.exists()) yearMonth.mkdirs()

            val title = entry.title.ifBlank { "无标题" }.replace("/", "-").replace("\\", "-")
            val filename = "${entry.date}-$title.md"
            val file = File(yearMonth, filename)

            val tags = parseTags(entry.tags)
            val frontmatter = Frontmatter(
                id = entry.id,
                type = entry.type,
                notebook = entry.notebookId,
                date = entry.date,
                startTime = entry.startTime,
                mood = entry.mood,
                location = entry.locationName,
                lat = entry.lat,
                lng = entry.lng,
                adcode = entry.adcode,
                tags = tags,
                status = entry.status,
                createdAt = entry.createdAt,
                updatedAt = entry.updatedAt,
            )

            val yaml = "---\n" + json.encodeToString(frontmatter).trim() + "\n---\n\n"
            val content = entry.content.ifBlank { "" }
            file.writeText(yaml + content, Charsets.UTF_8)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to write entry ${entry.id}", e)
        }
    }

    /** 删除日记 .md 文件 */
    fun deleteEntry(context: Context, entry: DiaryEntryEntity) {
        try {
            val file = findFile(context, entry)
            if (file != null && file.exists()) file.delete()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete entry ${entry.id}", e)
        }
    }

    /** 查找日记对应的 .md 文件 */
    private fun findFile(context: Context, entry: DiaryEntryEntity): File? {
        val dir = getDiaryDir(context)
        val yearMonth = File(dir, entry.date.take(7).replace("-", "/"))
        if (!yearMonth.exists()) return null

        // 尝试匹配文件名前缀（日期）
        val prefix = "${entry.date}-"
        return yearMonth.listFiles()?.firstOrNull { it.name.startsWith(prefix) }
    }

    /** 批量同步：将 Room 中所有日记写入 .md 文件（初始化用） */
    fun syncAllFromRoom(context: Context, entries: List<DiaryEntryEntity>) {
        var count = 0
        entries.forEach { entry ->
            writeEntry(context, entry)
            count++
        }
        Log.d(TAG, "Synced $count entries to markdown files")
    }

    /** 从 .md 文件读取内容（用于 Obsidian 修改后同步回 Room） */
    fun readEntryContent(context: Context, entry: DiaryEntryEntity): String? {
        return try {
            val file = findFile(context, entry)
            if (file != null && file.exists()) {
                val text = file.readText(Charsets.UTF_8)
                // 去掉 frontmatter
                val endIndex = text.indexOf("\n---\n")
                if (endIndex >= 0) text.substring(endIndex + 5).trim() else text
            } else null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read entry ${entry.id}", e)
            null
        }
    }

    /** 扫描 .md 文件列表 */
    fun scanFiles(context: Context): List<File> {
        val dir = getDiaryDir(context)
        if (!dir.exists()) return emptyList()
        return dir.walkTopDown()
            .filter { it.isFile && it.extension == "md" }
            .sortedByDescending { it.name }
            .toList()
    }

    private fun parseTags(tagsJson: String?): List<String> {
        if (tagsJson.isNullOrBlank()) return emptyList()
        return try {
            json.decodeFromString<List<String>>(tagsJson)
        } catch (_: Exception) {
            tagsJson.split(",").map { it.trim() }.filter { it.isNotBlank() }
        }
    }
}
