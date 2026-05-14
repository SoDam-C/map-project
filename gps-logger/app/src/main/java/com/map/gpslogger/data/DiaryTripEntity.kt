package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "diary_trips",
    indices = [Index("startDate")],
)
data class DiaryTripEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val coverImageUrl: String?,
    val startDate: String,
    val endDate: String,
    val destinations: String?,     // JSON array
    val entryIds: String?,         // JSON array
    val trackIds: String?,         // JSON array
    val synced: Boolean = false,
    val createdAt: String,
    val updatedAt: String,
)
