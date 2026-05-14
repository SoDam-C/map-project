package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface FootprintDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(footprint: FootprintEntity)

    @Query("DELETE FROM footprints WHERE adcode = :adcode")
    suspend fun delete(adcode: String)

    @Query("SELECT * FROM footprints WHERE adcode = :adcode")
    suspend fun getByAdcode(adcode: String): FootprintEntity?

    @Query("SELECT EXISTS(SELECT 1 FROM footprints WHERE adcode = :adcode)")
    suspend fun isLit(adcode: String): Boolean

    @Query("SELECT * FROM footprints ORDER BY level ASC, adcode ASC")
    fun getAll(): Flow<List<FootprintEntity>>

    @Query("SELECT * FROM footprints WHERE level = :level ORDER BY adcode ASC")
    suspend fun getByLevel(level: Int): List<FootprintEntity>

    @Query("SELECT level, COUNT(*) as count FROM footprints GROUP BY level")
    suspend fun getCountByLevel(): List<LevelCount>

    @Query("SELECT * FROM footprints WHERE adcode LIKE :countryPrefix || ':%' ORDER BY adcode ASC")
    suspend fun getByCountry(countryPrefix: String): List<FootprintEntity>

    @Query("SELECT * FROM footprints WHERE synced = 0")
    suspend fun getUnsynced(): List<FootprintEntity>

    @Query("UPDATE footprints SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)

    @Query("SELECT COUNT(*) FROM footprints WHERE adcode LIKE :provincePrefix || '%' AND level = 2")
    suspend fun getCityCountForProvince(provincePrefix: String): Int
}

data class LevelCount(val level: Int, val count: Int)
