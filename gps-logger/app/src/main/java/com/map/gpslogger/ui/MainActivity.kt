package com.map.gpslogger.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.service.GpsService
import com.map.gpslogger.ui.navigation.AppNavigation
import com.map.gpslogger.ui.theme.AppTheme
import com.map.gpslogger.worker.UploadWorker

class MainActivity : ComponentActivity() {

    private val permissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { perms ->
        if (perms.values.all { it }) {
            GpsService.start(this)
        } else {
            Toast.makeText(this, "需要定位权限才能工作", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val perms = listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ).filter {
            checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED
        }

        setContent {
            AppTheme {
                AppNavigation()
            }
        }

        // Request permissions if needed
        if (perms.isNotEmpty()) {
            permissionRequest.launch(perms.toTypedArray())
        } else {
            try {
                GpsService.start(this)
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to start GPS service", e)
            }
        }

        try {
            UploadWorker.schedule(this)
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Failed to schedule upload worker", e)
        }
    }
}
