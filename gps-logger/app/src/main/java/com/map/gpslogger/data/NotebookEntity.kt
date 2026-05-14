package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * 笔记本：日记条目的主题分组容器。
 * 所有日记在一个时间线流里，notebook 作为标签/筛选维度。
 */
@Entity(
    tableName = "notebooks",
    indices = [
        Index("sortOrder"),
        Index("isArchived"),
    ],
)
data class NotebookEntity(
    @PrimaryKey val id: String,
    val title: String,
    val icon: String,              // emoji
    val color: Long,               // ARGB color
    val type: String,              // general | travel | sport | growth | work | custom
    val startDate: String?,        // 阶段性起止
    val endDate: String?,
    val isArchived: Boolean = false,
    val isDefault: Boolean = false,
    val sortOrder: Int = 0,
    val createdAt: String,
    val updatedAt: String,
)
