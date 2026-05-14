package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "footprints",
    indices = [
        Index("adcode", unique = true),
        Index("level"),
        Index("source"),
    ],
)
data class FootprintEntity(
    @PrimaryKey val id: String,     // same as adcode (e.g. "CHN:110000")
    val adcode: String,
    val name: String,
    val level: Int,                // 0=country, 1=province, 2=city, 3=district, 4=town
    val centerLat: Double,
    val centerLng: Double,
    val litAt: String,             // ISO 8601
    val source: String,            // manual|gps|photo|trip|track|ancestor
    val sourceId: String?,
    val synced: Boolean = false,
)
