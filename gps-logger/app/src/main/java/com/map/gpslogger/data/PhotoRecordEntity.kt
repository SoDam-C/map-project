package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "photo_records",
    indices = [
        Index("takenAt"),
        Index("adcode"),
    ],
)
data class PhotoRecordEntity(
    @PrimaryKey val id: String,
    val localUri: String,          // content:// URI on device
    val remoteUrl: String?,        // uploaded URL
    val lat: Double?,
    val lng: Double?,
    val takenAt: String,           // ISO 8601 from EXIF
    val adcode: String?,
    val regionName: String?,
    val thumbnailUri: String?,     // cached thumbnail path
    val description: String?,
    val tags: String?,             // JSON array
    val synced: Boolean = false,
    val createdAt: String,
)
