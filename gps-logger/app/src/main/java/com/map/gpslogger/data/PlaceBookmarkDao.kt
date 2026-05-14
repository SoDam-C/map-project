package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface PlaceBookmarkDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(bookmark: PlaceBookmarkEntity)

    @Update
    suspend fun update(bookmark: PlaceBookmarkEntity)

    @Query("DELETE FROM place_bookmarks WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM place_bookmarks ORDER BY createdAt DESC")
    fun getAll(): Flow<List<PlaceBookmarkEntity>>

    @Query("SELECT * FROM place_bookmarks WHERE category = :category ORDER BY createdAt DESC")
    suspend fun getByCategory(category: String): List<PlaceBookmarkEntity>

    @Query("""
        SELECT * FROM place_bookmarks
        WHERE name LIKE '%' || :query || '%'
           OR note LIKE '%' || :query || '%'
           OR tags LIKE '%' || :query || '%'
        ORDER BY createdAt DESC
    """)
    suspend fun search(query: String): List<PlaceBookmarkEntity>

    @Query("SELECT * FROM place_bookmarks WHERE synced = 0")
    suspend fun getUnsynced(): List<PlaceBookmarkEntity>

    @Query("UPDATE place_bookmarks SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)
}
