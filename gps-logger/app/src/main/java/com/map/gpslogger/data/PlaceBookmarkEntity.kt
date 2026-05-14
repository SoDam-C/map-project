package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "place_bookmarks",
    indices = [
        Index("category"),
        Index("name"),
    ],
)
data class PlaceBookmarkEntity(
    @PrimaryKey val id: String,
    val name: String,
    val lat: Double,
    val lng: Double,
    val category: String,          // food|scenic|hotel|shopping|transport|other
    val note: String?,
    val visitedCount: Int = 0,
    val tags: String?,             // JSON array
    val synced: Boolean = false,
    val createdAt: String,
    val updatedAt: String,
)
