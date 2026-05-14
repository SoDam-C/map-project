package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface WishlistDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: WishlistEntity)

    @Query("DELETE FROM wishlist WHERE adcode = :adcode")
    suspend fun delete(adcode: String)

    @Query("SELECT * FROM wishlist ORDER BY addedAt DESC")
    fun getAll(): kotlinx.coroutines.flow.Flow<List<WishlistEntity>>

    @Query("SELECT * FROM wishlist WHERE adcode = :adcode")
    suspend fun getByAdcode(adcode: String): WishlistEntity?

    @Query("SELECT * FROM wishlist WHERE priority = :priority ORDER BY addedAt DESC")
    suspend fun getByPriority(priority: String): List<WishlistEntity>

    @Query("SELECT COUNT(*) FROM wishlist")
    suspend fun count(): Int
}
