package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface PhotoRecordDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(photo: PhotoRecordEntity)

    @Update
    suspend fun update(photo: PhotoRecordEntity)

    @Query("DELETE FROM photo_records WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM photo_records ORDER BY takenAt DESC")
    fun getAll(): Flow<List<PhotoRecordEntity>>

    @Query("SELECT * FROM photo_records WHERE takenAt BETWEEN :from AND :to ORDER BY takenAt DESC")
    suspend fun getByDateRange(from: String, to: String): List<PhotoRecordEntity>

    @Query("SELECT * FROM photo_records WHERE synced = 0")
    suspend fun getUnsynced(): List<PhotoRecordEntity>

    @Query("UPDATE photo_records SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)
}
