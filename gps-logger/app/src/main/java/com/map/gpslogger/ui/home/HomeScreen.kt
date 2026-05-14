package com.map.gpslogger.ui.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.repo.FootprintRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(navController: NavController) {
    val diaryRepo = remember { DiaryRepository() }
    val footprintRepo = remember { FootprintRepository() }
    val scope = rememberCoroutineScope()

    var entryCount by remember { mutableStateOf(0) }
    var provinceCount by remember { mutableStateOf(0) }
    var tripCount by remember { mutableStateOf(0) }
    var recentEntries by remember { mutableStateOf<List<com.map.gpslogger.data.DiaryEntryEntity>>(emptyList()) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        scope.launch {
            entryCount = diaryRepo.getEntryCount()
            val trips = diaryRepo.getAllTrips()
            // Collect once
            trips.collect { tripList -> tripCount = tripList.size }
            val levelCounts = footprintRepo.getCountByLevel()
            provinceCount = levelCounts.find { it.level == 1 }?.count ?: 0
            recentEntries = diaryRepo.searchEntries("")
            loaded = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nexus Pocket") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Welcome header
            Text("欢迎回来", fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))

            // Quick stats
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                QuickStatCard(modifier = Modifier.weight(1f), label = "日记", value = "$entryCount", onClick = {
                    navController.navigate(Screen.Diary.route)
                })
                QuickStatCard(modifier = Modifier.weight(1f), label = "旅行", value = "$tripCount", onClick = {
                    navController.navigate(Screen.DiaryTrips.route)
                })
                QuickStatCard(modifier = Modifier.weight(1f), label = "省份", value = "$provinceCount/34", onClick = {
                    navController.navigate(Screen.Footprint.route)
                })
            }

            // GPS Service status
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("📡", fontSize = 24.sp)
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("GPS 采集", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                        Text("服务就绪，可开始记录轨迹", fontSize = 12.sp, color = AppColors.TextSecondary)
                    }
                }
            }

            // Quick actions
            Text("快捷操作", fontSize = 16.sp, fontWeight = FontWeight.Medium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ActionButton(modifier = Modifier.weight(1f), icon = "📝", label = "写日记", onClick = {
                    navController.navigate(Screen.DiaryCreate.route)
                })
                ActionButton(modifier = Modifier.weight(1f), icon = "✈️", label = "新旅行", onClick = {
                    navController.navigate(Screen.TripCreate.route)
                })
                ActionButton(modifier = Modifier.weight(1f), icon = "📍", label = "足迹", onClick = {
                    navController.navigate(Screen.Footprint.route)
                })
            }

            // Recent entries
            if (recentEntries.isNotEmpty()) {
                Text("最近日记", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                recentEntries.take(5).forEach { entry ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                entry.title.ifBlank { "无标题" },
                                fontWeight = FontWeight.Medium, fontSize = 14.sp,
                            )
                            Spacer(Modifier.height(4.dp))
                            Row {
                                Text(entry.date, fontSize = 12.sp, color = AppColors.TextSecondary)
                                entry.locationName?.let { if (it.isNotBlank()) {
                                    Spacer(Modifier.width(8.dp))
                                    Text("📍 $it", fontSize = 12.sp, color = AppColors.TextSecondary)
                                }}
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun QuickStatCard(modifier: Modifier, label: String, value: String, onClick: () -> Unit) {
    Card(
        modifier = modifier,
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
            Spacer(Modifier.height(4.dp))
            Text(label, fontSize = 11.sp, color = AppColors.TextSecondary)
        }
    }
}

@Composable
private fun ActionButton(modifier: Modifier, icon: String, label: String, onClick: () -> Unit) {
    Card(
        modifier = modifier,
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(icon, fontSize = 24.sp)
            Spacer(Modifier.height(4.dp))
            Text(label, fontSize = 12.sp, color = AppColors.TextSecondary)
        }
    }
}
