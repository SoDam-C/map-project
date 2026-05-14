package com.map.gpslogger.ui.diary

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.DiaryEntryEntity
import com.map.gpslogger.data.NotebookEntity
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.repo.NotebookRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiaryScreen(navController: NavController) {
    val diaryRepo = remember { DiaryRepository() }
    val notebookRepo = remember { NotebookRepository() }

    var notebooks by remember { mutableStateOf<List<NotebookEntity>>(emptyList()) }
    var selectedNotebookId by remember { mutableStateOf<String?>(null) } // null = 全部

    // 确保默认笔记本存在
    LaunchedEffect(Unit) {
        notebookRepo.ensureDefault()
    }

    // 加载笔记本列表
    LaunchedEffect(Unit) {
        notebookRepo.getActive().collect { notebooks = it }
    }

    // 根据选中笔记本筛选日记
    val entries by (if (selectedNotebookId != null)
        diaryRepo.getEntriesByNotebook(selectedNotebookId!!)
    else
        diaryRepo.getAllEntries()
    ).collectAsState(initial = emptyList())

    val notebookMap = remember(notebooks) { notebooks.associateBy { it.id } }

    val grouped = remember(entries) {
        entries
            .sortedWith(compareByDescending<DiaryEntryEntity> { it.date }.thenByDescending { it.startTime })
            .groupBy { it.date }
            .toList()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("日记") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
                actions = {
                    IconButton(onClick = { navController.navigate(Screen.DiarySearch.route) }) {
                        Text("🔍", fontSize = 18.sp)
                    }
                    IconButton(onClick = { navController.navigate(Screen.DiaryStats.route) }) {
                        Text("📊", fontSize = 18.sp)
                    }
                },
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    // 传递当前选中的笔记本给创建页
                    val nbId = selectedNotebookId ?: "default"
                    navController.navigate(Screen.DiaryCreate.createRoute(nbId))
                },
                containerColor = AppColors.Primary,
            ) {
                Text("+", color = AppColors.OnPrimary, fontWeight = FontWeight.Bold, fontSize = 24.sp)
            }
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // 笔记本筛选条
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(
                    selected = selectedNotebookId == null,
                    onClick = { selectedNotebookId = null },
                    label = { Text("全部", fontSize = 13.sp) },
                )
                notebooks.forEach { nb ->
                    FilterChip(
                        selected = selectedNotebookId == nb.id,
                        onClick = { selectedNotebookId = if (selectedNotebookId == nb.id) null else nb.id },
                        label = { Text("${nb.icon} ${nb.title}", fontSize = 13.sp) },
                    )
                }
                // 管理笔记本按钮
                IconButton(onClick = { navController.navigate(Screen.Notebooks.route) }, modifier = Modifier.size(32.dp)) {
                    Text("⚙️", fontSize = 14.sp)
                }
            }

            // 日记时间线
            if (grouped.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("还没有日记", color = AppColors.TextSecondary, fontSize = 16.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("点击 + 开始记录", color = AppColors.TextSecondary, fontSize = 14.sp)
                    }
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(1),
                    modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 8.dp),
                ) {
                    grouped.forEach { (date, dateEntries) ->
                        item(span = { GridItemSpan(1) }) {
                            Text(date, fontSize = 14.sp, fontWeight = FontWeight.Medium,
                                color = AppColors.TextSecondary, modifier = Modifier.padding(vertical = 4.dp))
                        }
                        items(dateEntries, key = { it.id }) { entry ->
                            DiaryEntryCard(
                                entry = entry,
                                notebook = notebookMap[entry.notebookId],
                                onClick = { navController.navigate(Screen.DiaryDetail.createRoute(entry.id)) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DiaryEntryCard(entry: DiaryEntryEntity, notebook: NotebookEntity?, onClick: () -> Unit) {
    val isDraft = entry.status == "draft" && entry.content.isBlank()
    val hasTrack = entry.trackIds != null && entry.trackIds.isNotBlank()

    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isDraft) AppColors.CardBackground.copy(alpha = 0.3f) else AppColors.CardBackground)) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // 笔记本标签
                notebook?.let {
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = Color(it.color.toULong()).copy(alpha = 0.15f),
                    ) {
                        Text("${it.icon}", fontSize = 11.sp, modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp))
                    }
                    Spacer(Modifier.width(6.dp))
                }
                Text(entry.title.ifBlank { entry.locationName ?: "无标题" },
                    fontWeight = FontWeight.Medium, fontSize = 15.sp,
                    color = if (isDraft) AppColors.TextSecondary else AppColors.TextPrimary,
                    modifier = Modifier.weight(1f), maxLines = 1)
                entry.mood?.let { Spacer(Modifier.width(4.dp)); Text(it, fontSize = 16.sp) }
            }
            entry.locationName?.let { if (it.isNotBlank() && it != entry.title) {
                Spacer(Modifier.height(4.dp)); Text("📍 $it", fontSize = 12.sp, color = AppColors.TextSecondary)
            }}
            if (entry.content.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(entry.content.take(100) + if (entry.content.length > 100) "..." else "",
                    fontSize = 13.sp, color = AppColors.TextSecondary, maxLines = 2)
            }
            Spacer(Modifier.height(4.dp))
            Row {
                entry.startTime?.let { Text(it.take(16).replace("T", " "), fontSize = 11.sp, color = AppColors.TextSecondary) }
                if (hasTrack) { Spacer(Modifier.width(8.dp)); Text("🛤️ 轨迹", fontSize = 11.sp, color = AppColors.TextSecondary) }
                if (isDraft) { Spacer(Modifier.width(8.dp)); Text("待填充", fontSize = 11.sp, color = AppColors.Warning) }
            }
        }
    }
}
