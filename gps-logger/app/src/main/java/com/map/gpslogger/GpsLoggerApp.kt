package com.map.gpslogger

import android.app.Application
import android.content.Intent
import android.os.Build
import androidx.room.Room
import androidx.room.TypeConverters
import androidx.work.Configuration
import androidx.work.WorkManager
import com.map.gpslogger.data.AppDatabase
import com.map.gpslogger.data.Converters
import com.map.gpslogger.data.MIGRATION_1_2
import com.map.gpslogger.data.MIGRATION_2_3
import com.map.gpslogger.data.MIGRATION_3_4
import org.maplibre.android.MapLibre
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class GpsLoggerApp : Application(), Configuration.Provider {

    lateinit var database: AppDatabase
        private set

    override fun onCreate() {
        // Install crash handler FIRST, before anything else
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            val sw = StringWriter()
            sw.write("CRASH at ${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())}\n")
            sw.write("Thread: ${thread.name}\n")
            sw.write("Device: ${Build.MANUFACTURER} ${Build.MODEL} (API ${Build.VERSION.SDK_INT})\n\n")
            throwable.printStackTrace(PrintWriter(sw))
            val crashLog = sw.toString()
            android.util.Log.e("GPSLogger-CRASH", crashLog)
            // Write to Download folder (easy to find)
            try {
                val downloadDir = File("/storage/emulated/0/Download")
                if (!downloadDir.exists()) downloadDir.mkdirs()
                val file = File(downloadDir, "gpslogger_crash.txt")
                file.writeText(crashLog)
                android.util.Log.e("GPSLogger-CRASH", "Crash log saved to: ${file.absolutePath}")
            } catch (e: Exception) {
                android.util.Log.e("GPSLogger-CRASH", "Failed to write to Download", e)
                // Fallback: internal
                try {
                    val file = File(filesDir, "gpslogger_crash.txt")
                    file.writeText(crashLog)
                } catch (_: Exception) {}
            }
            // Let the default handler kill the process
            defaultHandler?.uncaughtException(thread, throwable)
                ?: android.os.Process.killProcess(android.os.Process.myPid())
        }

        super.onCreate()
        instance = this

        MapLibre.getInstance(this)

        database = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "gps-logger.db"
        )
            .addTypeConverter(Converters())
            .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
            .fallbackToDestructiveMigration()
            .build()

        com.map.gpslogger.worker.SyncWorker.enqueue(this)
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.DEBUG)
            .build()

    companion object {
        lateinit var instance: GpsLoggerApp
            private set
        private var defaultHandler: Thread.UncaughtExceptionHandler? = null
    }

    init {
        defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
    }
}
