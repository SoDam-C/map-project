package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "gps_points",
    indices = [
        Index("trackId"),
        Index("timestamp"),
        Index("uploaded"),
    ],
)
data class GpsPointEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val trackId: String,
    val lat: Double,
    val lng: Double,
    val elevation: Double?,
    val accuracy: Float,
    val speed: Float?,
    val bearing: Float?,
    val timestamp: Long,
    val uploaded: Boolean = false,
)
