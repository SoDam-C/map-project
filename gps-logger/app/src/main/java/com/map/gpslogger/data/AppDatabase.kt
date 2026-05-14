package com.map.gpslogger.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [
        GpsPointEntity::class,
        TrackEntity::class,
        DiaryEntryEntity::class,
        DiaryTripEntity::class,
        PlaceBookmarkEntity::class,
        FootprintEntity::class,
        PhotoRecordEntity::class,
        NotebookEntity::class,
        WishlistEntity::class,
    ],
    version = 4,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun gpsPointDao(): GpsPointDao
    abstract fun trackDao(): TrackDao
    abstract fun diaryEntryDao(): DiaryEntryDao
    abstract fun diaryTripDao(): DiaryTripDao
    abstract fun placeBookmarkDao(): PlaceBookmarkDao
    abstract fun footprintDao(): FootprintDao
    abstract fun photoRecordDao(): PhotoRecordDao
    abstract fun notebookDao(): NotebookDao
    abstract fun wishlistDao(): WishlistDao
}

val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS diary_entries (
                id TEXT PRIMARY KEY NOT NULL,
                type TEXT NOT NULL,
                date TEXT NOT NULL,
                startTime TEXT,
                endTime TEXT,
                title TEXT NOT NULL,
                locationName TEXT,
                lat REAL,
                lng REAL,
                adcode TEXT,
                content TEXT NOT NULL DEFAULT '',
                mood TEXT,
                tags TEXT,
                trackIds TEXT,
                attractionId TEXT,
                photoRefsJson TEXT NOT NULL DEFAULT '[]',
                tripId TEXT,
                status TEXT NOT NULL DEFAULT 'draft',
                synced INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        """)
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS diary_trips (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                coverImageUrl TEXT,
                startDate TEXT NOT NULL,
                endDate TEXT NOT NULL,
                destinations TEXT,
                entryIds TEXT,
                trackIds TEXT,
                synced INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        """)
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS place_bookmarks (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                category TEXT NOT NULL,
                note TEXT,
                visitedCount INTEGER NOT NULL DEFAULT 0,
                tags TEXT,
                synced INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        """)
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS footprints (
                id TEXT PRIMARY KEY NOT NULL,
                adcode TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                level INTEGER NOT NULL,
                centerLat REAL NOT NULL,
                centerLng REAL NOT NULL,
                litAt TEXT NOT NULL,
                source TEXT NOT NULL,
                sourceId TEXT,
                synced INTEGER NOT NULL DEFAULT 0
            )
        """)
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS photo_records (
                id TEXT PRIMARY KEY NOT NULL,
                localUri TEXT NOT NULL,
                remoteUrl TEXT,
                lat REAL,
                lng REAL,
                takenAt TEXT NOT NULL,
                adcode TEXT,
                regionName TEXT,
                thumbnailUri TEXT,
                description TEXT,
                tags TEXT,
                synced INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL
            )
        """)
        database.execSQL("CREATE INDEX IF NOT EXISTS index_diary_entries_date ON diary_entries(date)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_diary_entries_type ON diary_entries(type)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_diary_entries_tripId ON diary_entries(tripId)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_diary_entries_status ON diary_entries(status)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_diary_trips_startDate ON diary_trips(startDate)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_place_bookmarks_category ON place_bookmarks(category)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_place_bookmarks_name ON place_bookmarks(name)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_footprints_adcode ON footprints(adcode)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_footprints_level ON footprints(level)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_footprints_source ON footprints(source)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_photo_records_takenAt ON photo_records(takenAt)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_photo_records_adcode ON photo_records(adcode)")
    }
}

val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        // 1. Create notebooks table
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS notebooks (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                icon TEXT NOT NULL,
                color INTEGER NOT NULL,
                type TEXT NOT NULL,
                startDate TEXT,
                endDate TEXT,
                isArchived INTEGER NOT NULL DEFAULT 0,
                isDefault INTEGER NOT NULL DEFAULT 0,
                sortOrder INTEGER NOT NULL DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        """)
        database.execSQL("CREATE INDEX IF NOT EXISTS index_notebooks_sortOrder ON notebooks(sortOrder)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_notebooks_isArchived ON notebooks(isArchived)")

        // 2. Insert default notebook
        val now = "'${java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).format(java.util.Date())}'"
        database.execSQL("""
            INSERT OR IGNORE INTO notebooks (id, title, icon, color, type, isDefault, sortOrder, createdAt, updatedAt)
            VALUES ('default', '日记', '📖', ${0xFF6366F1}, 'general', 1, 0, $now, $now)
        """)

        // 3. Add notebookId column to diary_entries
        database.execSQL("ALTER TABLE diary_entries ADD COLUMN notebookId TEXT NOT NULL DEFAULT 'default'")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_diary_entries_notebookId ON diary_entries(notebookId)")
    }
}

val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS wishlist (
                id TEXT PRIMARY KEY NOT NULL,
                adcode TEXT NOT NULL,
                name TEXT NOT NULL,
                level INTEGER NOT NULL,
                priority TEXT NOT NULL,
                note TEXT,
                addedAt TEXT NOT NULL,
                synced INTEGER NOT NULL DEFAULT 0
            )
        """)
        database.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS index_wishlist_adcode ON wishlist(adcode)")
        database.execSQL("CREATE INDEX IF NOT EXISTS index_wishlist_priority ON wishlist(priority)")
    }
}
