package com.map.gpslogger

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.map.gpslogger.service.GpsService

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed — starting GPS service")
            GpsService.start(context)
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}
