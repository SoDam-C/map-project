package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface DiaryTripDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(trip: DiaryTripEntity)

    @Update
    suspend fun update(trip: DiaryTripEntity)

    @Query("DELETE FROM diary_trips WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM diary_trips WHERE id = :id")
    suspend fun getById(id: String): DiaryTripEntity?

    @Query("SELECT * FROM diary_trips ORDER BY startDate DESC")
    fun getAll(): Flow<List<DiaryTripEntity>>

    @Query("SELECT * FROM diary_trips WHERE synced = 0")
    suspend fun getUnsynced(): List<DiaryTripEntity>

    @Query("UPDATE diary_trips SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)
}
