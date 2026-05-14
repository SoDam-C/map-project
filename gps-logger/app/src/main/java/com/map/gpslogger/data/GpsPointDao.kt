package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface GpsPointDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertPoints(points: List<GpsPointEntity>)

    @Query("SELECT * FROM gps_points WHERE uploaded = 0 ORDER BY timestamp ASC LIMIT :limit")
    suspend fun getUnuploadedPoints(limit: Int = 5000): List<GpsPointEntity>

    @Query("SELECT COUNT(*) FROM gps_points WHERE uploaded = 0")
    suspend fun getUnuploadedCount(): Int

    @Query("UPDATE gps_points SET uploaded = 1 WHERE trackId = :trackId AND uploaded = 0")
    suspend fun markUploaded(trackId: String)

    @Query("SELECT COUNT(*) FROM gps_points WHERE trackId = :trackId")
    suspend fun getPointCount(trackId: String): Int

    @Query("SELECT * FROM gps_points WHERE trackId = :trackId ORDER BY timestamp ASC LIMIT 1")
    suspend fun getFirstPoint(trackId: String): GpsPointEntity?

    @Query("SELECT * FROM gps_points WHERE trackId = :trackId ORDER BY timestamp DESC LIMIT 1")
    suspend fun getLastPoint(trackId: String): GpsPointEntity?

    @Query("DELETE FROM gps_points WHERE trackId = :trackId")
    suspend fun deleteByTrackId(trackId: String)

    @Query("SELECT * FROM gps_points WHERE trackId IN (:trackIds) ORDER BY timestamp ASC")
    suspend fun getByTrackIds(trackIds: List<String>): List<GpsPointEntity>

    @Query("SELECT * FROM gps_points ORDER BY timestamp ASC")
    suspend fun getAllOrdered(): List<GpsPointEntity>
}
