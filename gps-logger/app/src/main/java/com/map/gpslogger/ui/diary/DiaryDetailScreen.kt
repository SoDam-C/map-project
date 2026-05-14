package com.map.gpslogger.ui.diary

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiaryDetailScreen(navController: NavController, id: String) {
    val repository = remember { DiaryRepository() }
    val scope = rememberCoroutineScope()
    var entry by remember { mutableStateOf<com.map.gpslogger.data.DiaryEntryEntity?>(null) }

    LaunchedEffect(id) {
        entry = repository.getEntry(id)
    }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    val photoRefs = remember(entry?.photoRefsJson) {
        try { if (entry?.photoRefsJson.isNullOrBlank()) emptyList()
            else Json.decodeFromString<List<Map<String, String>>>(entry!!.photoRefsJson) }
        catch (_: Exception) { emptyList() }
    }
    val tags = remember(entry?.tags) {
        try { if (entry?.tags.isNullOrBlank()) emptyList()
            else Json.decodeFromString<List<String>>(entry?.tags ?: "") }
        catch (_: Exception) { emptyList() }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("日记详情") },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回") } },
                actions = {
                    IconButton(onClick = { navController.navigate(Screen.DiaryEdit.createRoute(id)) }) {
                        Icon(Icons.Default.Edit, contentDescription = "编辑") }
                    IconButton(onClick = { showDeleteConfirm = true }) {
                        Icon(Icons.Default.Delete, contentDescription = "删除", tint = AppColors.Error) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface))
        },
    ) { padding ->
        if (entry == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("日记不存在", color = AppColors.TextSecondary)
            }
            return@Scaffold
        }
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState())) {
            Text(when (entry!!.type) { "track_entry" -> "轨迹日记"; "memory_entry" -> "记忆"; "note_entry" -> "笔记"; else -> entry!!.type },
                fontSize = 12.sp, color = AppColors.TextSecondary)
            Spacer(Modifier.height(8.dp))
            Text(entry!!.title.ifBlank { "无标题" }, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Row { Text(entry!!.date, fontSize = 13.sp, color = AppColors.TextSecondary)
                entry!!.startTime?.let { Spacer(Modifier.width(12.dp)); Text(it.take(16).replace("T", " "), fontSize = 13.sp, color = AppColors.TextSecondary) } }
            entry!!.locationName?.let { if (it.isNotBlank()) { Spacer(Modifier.height(4.dp)); Text("📍 $it", fontSize = 13.sp, color = AppColors.TextSecondary) } }
            entry!!.mood?.let { Spacer(Modifier.height(12.dp)); Text(it, fontSize = 32.sp) }
            if (tags.isNotEmpty()) { Spacer(Modifier.height(12.dp)); Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { tags.forEach { SuggestionChip(onClick = {}, label = { Text("#$it", fontSize = 12.sp) }) } } }
            if (entry!!.content.isNotBlank()) { Spacer(Modifier.height(16.dp)); HorizontalDivider(color = AppColors.Border); Spacer(Modifier.height(12.dp)); Text(entry!!.content, fontSize = 15.sp, lineHeight = 22.sp) }
            if (photoRefs.isNotEmpty()) { Spacer(Modifier.height(16.dp)); HorizontalDivider(color = AppColors.Border); Spacer(Modifier.height(12.dp)); Text("${photoRefs.size} 张照片", fontSize = 13.sp, color = AppColors.TextSecondary) }
            Spacer(Modifier.height(32.dp))
        }
        if (showDeleteConfirm) {
            AlertDialog(onDismissRequest = { showDeleteConfirm = false }, title = { Text("删除日记") },
                text = { Text("确定要删除这篇日记吗？此操作不可撤销。") },
                confirmButton = { TextButton(onClick = { showDeleteConfirm = false; scope.launch { repository.deleteEntry(id); navController.popBackStack() } }) { Text("删除", color = AppColors.Error) } },
                dismissButton = { TextButton(onClick = { showDeleteConfirm = false }) { Text("取消") } })
        }
    }
}
