package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters

@Entity(tableName = "tracks")
@TypeConverters(Converters::class)
data class TrackEntity(
    @PrimaryKey
    val id: String,
    val deviceId: String,
    val title: String?,
    val type: String = "continuous", // continuous | imported | sport
    val sportType: String?,
    val startTime: Long,  // Unix ms
    val endTime: Long?,    // Unix ms, null = still recording
    val distance: Double = 0.0,  // meters
    val duration: Long = 0L,     // seconds
    val pointCount: Int = 0,
    val bounds: List<Double> = listOf(0.0, 0.0, 0.0, 0.0), // [minLng, minLat, maxLng, maxLat]
    val uploaded: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
