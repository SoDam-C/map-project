package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface DiaryEntryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: DiaryEntryEntity)

    @Update
    suspend fun update(entry: DiaryEntryEntity)

    @Query("DELETE FROM diary_entries WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM diary_entries WHERE id = :id")
    suspend fun getById(id: String): DiaryEntryEntity?

    @Query("SELECT * FROM diary_entries ORDER BY date DESC, startTime DESC")
    fun getAll(): Flow<List<DiaryEntryEntity>>

    @Query("SELECT * FROM diary_entries ORDER BY date DESC, startTime DESC")
    suspend fun getAllOnce(): List<DiaryEntryEntity>

    @Query("SELECT * FROM diary_entries WHERE notebookId = :notebookId ORDER BY date DESC, startTime DESC")
    fun getByNotebook(notebookId: String): Flow<List<DiaryEntryEntity>>

    @Query("SELECT * FROM diary_entries WHERE date = :date ORDER BY startTime DESC")
    suspend fun getByDate(date: String): List<DiaryEntryEntity>

    @Query("SELECT * FROM diary_entries WHERE date BETWEEN :from AND :to ORDER BY date DESC, startTime DESC")
    suspend fun getByDateRange(from: String, to: String): List<DiaryEntryEntity>

    @Query("SELECT * FROM diary_entries WHERE tripId = :tripId ORDER BY date DESC")
    suspend fun getByTripId(tripId: String): List<DiaryEntryEntity>

    @Query("SELECT * FROM diary_entries WHERE type = :type ORDER BY date DESC")
    fun getByType(type: String): Flow<List<DiaryEntryEntity>>

    @Query("SELECT DISTINCT date FROM diary_entries ORDER BY date DESC")
    suspend fun getAllDates(): List<String>

    @Query("SELECT * FROM diary_entries WHERE synced = 0")
    suspend fun getUnsynced(): List<DiaryEntryEntity>

    @Query("UPDATE diary_entries SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)

    @Query("SELECT COUNT(*) FROM diary_entries")
    suspend fun totalCount(): Int

    @Query("SELECT COUNT(*) FROM diary_entries WHERE content != '' AND content IS NOT NULL")
    suspend fun publishedCount(): Int

    @Query("SELECT COUNT(*) FROM diary_entries WHERE status = 'draft'")
    suspend fun draftCount(): Int

    @Query("SELECT COUNT(*) FROM diary_entries WHERE photoRefsJson != '[]'")
    suspend fun withPhotosCount(): Int

    @Query("""
        SELECT * FROM diary_entries
        WHERE title LIKE '%' || :query || '%'
           OR content LIKE '%' || :query || '%'
           OR locationName LIKE '%' || :query || '%'
           OR tags LIKE '%' || :query || '%'
        ORDER BY date DESC, startTime DESC
    """)
    suspend fun search(query: String): List<DiaryEntryEntity>

    @Query("SELECT date, COUNT(*) as count FROM diary_entries WHERE date >= :startDate GROUP BY date ORDER BY date")
    suspend fun getDailyCounts(startDate: String): List<DateCount>

    @Query("SELECT mood, COUNT(*) as count FROM diary_entries WHERE mood IS NOT NULL AND mood != '' GROUP BY mood")
    suspend fun getMoodDistribution(): List<MoodCount>

    @Query("SELECT type, COUNT(*) as count FROM diary_entries GROUP BY type")
    suspend fun getTypeDistribution(): List<TypeCount>

    @Query("SELECT date FROM diary_entries GROUP BY date ORDER BY date")
    suspend fun getAllDatesOrdered(): List<String>

    data class DateCount(val date: String, val count: Int)
    data class MoodCount(val mood: String, val count: Int)
    data class TypeCount(val type: String, val count: Int)
}
