package com.map.gpslogger.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "wishlist",
    indices = [Index("adcode", unique = true), Index("priority")]
)
data class WishlistEntity(
    @PrimaryKey val id: String,
    val adcode: String,
    val name: String,
    val level: Int,
    val priority: String,  // must_go | next_time | if_chance
    val note: String?,
    val addedAt: String,
    val synced: Boolean = false,
)
