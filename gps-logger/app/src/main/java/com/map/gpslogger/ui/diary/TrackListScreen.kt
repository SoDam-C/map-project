package com.map.gpslogger.ui.diary

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.TrackEntity
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackListScreen(navController: NavController) {
    val dao = remember { GpsLoggerApp.instance.database.trackDao() }
    val tracks by dao.getAllTracks().collectAsState(initial = emptyList())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("轨迹") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
    ) { padding ->
        if (tracks.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("暂无轨迹记录", color = AppColors.TextSecondary, fontSize = 16.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("开始 GPS 采集以记录轨迹", color = AppColors.TextSecondary, fontSize = 14.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(vertical = 12.dp),
            ) {
                items(tracks, key = { it.id }) { track ->
                    TrackCard(track = track, onClick = {
                        navController.navigate(Screen.TrackDetail.createRoute(track.id))
                    })
                }
            }
        }
    }
}

@Composable
private fun TrackCard(track: TrackEntity, onClick: () -> Unit) {
    val dateFormat = SimpleDateFormat("yyyy/MM/dd HH:mm", Locale.US)
    val startTime = dateFormat.format(Date(track.startTime))
    val durationMin = track.duration / 60
    val distanceKm = track.distance / 1000.0

    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (track.endTime == null) "录制中" else "已完成", fontSize = 12.sp,
                    color = if (track.endTime == null) AppColors.Warning else AppColors.Success)
                Spacer(Modifier.width(8.dp))
                Text(track.title ?: "未命名轨迹", fontWeight = FontWeight.Medium, fontSize = 14.sp, modifier = Modifier.weight(1f))
                if (track.uploaded) Text("已上传", fontSize = 11.sp, color = AppColors.Success)
            }
            Spacer(Modifier.height(6.dp))
            Row {
                Text(startTime, fontSize = 12.sp, color = AppColors.TextSecondary)
                Spacer(Modifier.width(12.dp))
                Text("%.2f km".format(distanceKm), fontSize = 12.sp, color = AppColors.TextSecondary)
                Spacer(Modifier.width(12.dp))
                Text("${durationMin}分钟", fontSize = 12.sp, color = AppColors.TextSecondary)
            }
            Row {
                Text("${track.pointCount} 个点", fontSize = 11.sp, color = AppColors.TextSecondary)
                track.sportType?.let { Spacer(Modifier.width(8.dp)); Text(it, fontSize = 11.sp, color = AppColors.TextSecondary) }
            }
        }
    }
}
