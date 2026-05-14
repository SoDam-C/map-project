package com.map.gpslogger.ui.diary

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TripDetailScreen(navController: NavController, id: String) {
    val context = LocalContext.current
    val repository = remember { DiaryRepository() }
    val entryDao = remember { GpsLoggerApp.instance.database.diaryEntryDao() }
    val scope = rememberCoroutineScope()

    var trip by remember { mutableStateOf<com.map.gpslogger.data.DiaryTripEntity?>(null) }

    LaunchedEffect(id) {
        trip = repository.getTrip(id)
    }
    var entries by remember { mutableStateOf(emptyList<com.map.gpslogger.data.DiaryEntryEntity>()) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    LaunchedEffect(id) {
        entries = entryDao.getByTripId(id)
    }

    if (trip == null) {
        Scaffold(
            topBar = {
                TopAppBar(title = { Text("旅行详情") },
                    navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回") } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface))
            },
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("旅行不存在", color = AppColors.TextSecondary)
            }
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("旅行详情") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        navController.navigate("${Screen.TripCreate.route}?editId=$id")
                    }) {
                        Icon(Icons.Default.Edit, contentDescription = "编辑")
                    }
                    IconButton(onClick = { showDeleteConfirm = true }) {
                        Icon(Icons.Default.Delete, contentDescription = "删除", tint = AppColors.Error)
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
        ) {
            Text(trip!!.title, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text("${trip!!.startDate} ~ ${trip!!.endDate}", fontSize = 14.sp, color = AppColors.TextSecondary)

            // Stats
            val start = try { java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).parse(trip!!.startDate) } catch (_: Exception) { null }
            val end = try { java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).parse(trip!!.endDate) } catch (_: Exception) { null }
            val days = if (start != null && end != null) ((end.time - start.time) / (1000 * 60 * 60 * 24) + 1).toInt() else null
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                days?.let { Text("$it 天", fontSize = 13.sp, color = AppColors.TextSecondary) }
                Text("${entries.size} 篇日记", fontSize = 13.sp, color = AppColors.TextSecondary)
            }

            trip!!.description?.let { if (it.isNotBlank()) {
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = AppColors.Border)
                Spacer(Modifier.height(8.dp))
                Text(it, fontSize = 14.sp, lineHeight = 20.sp)
            }}

            // Trip entries
            if (entries.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = AppColors.Border)
                Spacer(Modifier.height(12.dp))
                Text("旅行日记", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(8.dp))
                val grouped = entries.sortedBy { it.date }.groupBy { it.date }
                grouped.forEach { (date, dateEntries) ->
                    Text(date, fontSize = 13.sp, color = AppColors.TextSecondary, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.height(4.dp))
                    dateEntries.forEach { entry ->
                        Card(
                            onClick = { navController.navigate(Screen.DiaryDetail.createRoute(entry.id)) },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    entry.title.ifBlank { "无标题" },
                                    fontWeight = FontWeight.Medium, fontSize = 14.sp,
                                )
                                entry.locationName?.let { if (it.isNotBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text("📍 $it", fontSize = 12.sp, color = AppColors.TextSecondary)
                                }}
                                if (entry.content.isNotBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text(entry.content.take(60) + if (entry.content.length > 60) "..." else "",
                                        fontSize = 12.sp, color = AppColors.TextSecondary, maxLines = 2)
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                }
            }

            Spacer(Modifier.height(32.dp))
        }

        if (showDeleteConfirm) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirm = false },
                title = { Text("删除旅行") },
                text = { Text("确定要删除这个旅行记录吗？关联的日记不会被删除。") },
                confirmButton = {
                    TextButton(onClick = {
                        showDeleteConfirm = false
                        scope.launch {
                            repository.deleteTrip(id)
                            Toast.makeText(context, "已删除", Toast.LENGTH_SHORT).show()
                            navController.popBackStack()
                        }
                    }) { Text("删除", color = AppColors.Error) }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirm = false }) { Text("取消") }
                },
            )
        }
    }
}
