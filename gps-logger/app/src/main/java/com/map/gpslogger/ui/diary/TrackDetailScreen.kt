package com.map.gpslogger.ui.diary

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.map.gpslogger.ui.theme.AppColors
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackDetailScreen(navController: NavController, id: String) {
    val dao = remember { GpsLoggerApp.instance.database.trackDao() }
    var track by remember { mutableStateOf<TrackEntity?>(null) }

    LaunchedEffect(id) {
        track = dao.getTrack(id)
    }

    if (track == null) {
        Scaffold(
            topBar = {
                TopAppBar(title = { Text("轨迹详情") },
                    navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回") } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface))
            },
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("轨迹不存在", color = AppColors.TextSecondary)
            }
        }
        return
    }

    val t = track!!
    val dateFormat = SimpleDateFormat("yyyy/MM/dd HH:mm:ss", Locale.US)
    val startTime = dateFormat.format(Date(t.startTime))
    val endTime = t.endTime?.let { dateFormat.format(Date(it)) }
    val durationMin = t.duration / 60
    val distanceKm = t.distance / 1000.0

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("轨迹详情") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Status
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(t.title ?: "未命名轨迹", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text(if (t.endTime == null) "正在记录" else "已完成", fontSize = 13.sp, color = AppColors.TextSecondary)
                }
            }

            // Stats
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    StatRow("距离", "%.2f km".format(distanceKm))
                    StatRow("时长", "$durationMin 分钟")
                    StatRow("GPS 点数", "${t.pointCount}")
                    StatRow("开始", startTime)
                    endTime?.let { StatRow("结束", it) }
                    t.sportType?.let { StatRow("运动类型", it) }
                    StatRow("上传状态", if (t.uploaded) "已上传" else "未上传")
                }
            }
        }
    }
}

@Composable
private fun StatRow(label: String, value: String) {
    Row(
        modifier = Modifier.padding(vertical = 4.dp).fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, fontSize = 14.sp, color = AppColors.TextSecondary)
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Medium)
    }
}
