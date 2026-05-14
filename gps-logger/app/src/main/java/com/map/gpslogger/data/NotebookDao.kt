package com.map.gpslogger.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface NotebookDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(notebook: NotebookEntity)

    @Update
    suspend fun update(notebook: NotebookEntity)

    @Query("DELETE FROM notebooks WHERE id = :id")
    suspend fun delete(id: String)

    @Query("SELECT * FROM notebooks WHERE id = :id")
    suspend fun getById(id: String): NotebookEntity?

    @Query("SELECT * FROM notebooks WHERE isDefault = 1 LIMIT 1")
    suspend fun getDefault(): NotebookEntity?

    @Query("SELECT * FROM notebooks WHERE isArchived = 0 ORDER BY sortOrder ASC, createdAt DESC")
    fun getActive(): Flow<List<NotebookEntity>>

    @Query("SELECT * FROM notebooks WHERE isArchived = 1 ORDER BY updatedAt DESC")
    fun getArchived(): Flow<List<NotebookEntity>>

    @Query("SELECT * FROM notebooks ORDER BY sortOrder ASC, createdAt DESC")
    fun getAll(): Flow<List<NotebookEntity>>

    @Query("SELECT COUNT(*) FROM notebooks")
    suspend fun count(): Int
}
