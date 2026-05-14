package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface TrackDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(track: TrackEntity)

    @Update
    suspend fun update(track: TrackEntity)

    @Query("SELECT * FROM tracks ORDER BY startTime DESC")
    fun getAllTracks(): Flow<List<TrackEntity>>

    @Query("SELECT * FROM tracks WHERE endTime IS NULL LIMIT 1")
    suspend fun getActiveTrack(): TrackEntity?

    @Query("SELECT * FROM tracks WHERE id = :id")
    suspend fun getTrack(id: String): TrackEntity?

    @Query("UPDATE tracks SET uploaded = 1 WHERE id = :id")
    suspend fun markUploaded(id: String)

    @Query("DELETE FROM tracks WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM tracks ORDER BY startTime DESC")
    suspend fun getAllOnce(): List<TrackEntity>
}
