package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "diary_entries",
    indices = [
        Index("date"),
        Index("type"),
        Index("tripId"),
        Index("status"),
    ],
)
data class DiaryEntryEntity(
    @PrimaryKey val id: String,
    val type: String,              // track_entry | memory_entry | note_entry
    val date: String,              // YYYY-MM-DD
    val startTime: String?,        // ISO 8601
    val endTime: String?,
    val title: String,
    val locationName: String?,
    val lat: Double?,
    val lng: Double?,
    val adcode: String?,
    val content: String,           // Markdown
    val mood: String?,
    val tags: String?,             // JSON array string, via TypeConverter
    val trackIds: String?,         // JSON array string
    val attractionId: String?,
    val photoRefsJson: String,     // JSON array of PhotoReference
    val tripId: String?,
    val notebookId: String = "default",
    val status: String,            // draft | published
    val synced: Boolean = false,
    val createdAt: String,
    val updatedAt: String,
)
