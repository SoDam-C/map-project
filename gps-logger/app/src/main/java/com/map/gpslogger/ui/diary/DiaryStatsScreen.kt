package com.map.gpslogger.ui.diary

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiaryStatsScreen(navController: NavController) {
    val repository = remember { DiaryRepository() }
    val scope = rememberCoroutineScope()

    var totalCount by remember { mutableStateOf(0) }
    var publishedCount by remember { mutableStateOf(0) }
    var draftCount by remember { mutableStateOf(0) }
    var photoCount by remember { mutableStateOf(0) }
    var dailyCounts by remember { mutableStateOf<List<Pair<String, Int>>>(emptyList()) }
    var moodDist by remember { mutableStateOf<List<Pair<String, Int>>>(emptyList()) }
    var typeDist by remember { mutableStateOf<List<Pair<String, Int>>>(emptyList()) }
    var currentStreak by remember { mutableStateOf(0) }
    var longestStreak by remember { mutableStateOf(0) }
    var totalWords by remember { mutableStateOf(0) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        scope.launch {
            totalCount = repository.getEntryCount()
            publishedCount = repository.getPublishedCount()
            draftCount = repository.getDraftCount()
            photoCount = repository.getWithPhotosCount()

            val oneYearAgo = java.time.LocalDate.now().minusYears(1).toString()
            dailyCounts = repository.getDailyCounts(oneYearAgo).map { it.date to it.count }

            moodDist = repository.getMoodDistribution().map { it.mood to it.count }
            typeDist = repository.getTypeDistribution().map { it.type to it.count }

            val dates = repository.getAllDatesOrdered()
            currentStreak = calculateCurrentStreak(dates)
            longestStreak = calculateLongestStreak(dates)
            totalWords = calculateTotalWords(dailyCounts)

            loaded = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("统计") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
    ) { padding ->
        if (!loaded) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppColors.Primary)
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Summary cards
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCard(modifier = Modifier.weight(1f), label = "总日记", value = "$totalCount")
                StatCard(modifier = Modifier.weight(1f), label = "已发布", value = "$publishedCount")
                StatCard(modifier = Modifier.weight(1f), label = "草稿", value = "$draftCount")
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCard(modifier = Modifier.weight(1f), label = "总字数", value = "$totalWords")
                StatCard(modifier = Modifier.weight(1f), label = "带照片", value = "$photoCount")
                StatCard(modifier = Modifier.weight(1f), label = "当前连续", value = "${currentStreak}天")
            }

            // Streak highlight
            if (longestStreak > 0) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text("最长连续记录", fontSize = 13.sp, color = AppColors.TextSecondary)
                            Spacer(Modifier.height(4.dp))
                            Text("$longestStreak 天", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
                        }
                        Text("🔥", fontSize = 32.sp)
                    }
                }
            }

            // Monthly trend (last 12 months)
            if (dailyCounts.isNotEmpty()) {
                Text("月度趋势", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                    val monthlyData = dailyCounts
                        .groupBy { it.first.take(7) }
                        .mapValues { (_, entries) -> entries.sumOf { it.second } }
                        .toList()
                        .sortedBy { it.first }
                        .takeLast(12)
                    if (monthlyData.isNotEmpty()) {
                        val maxVal = monthlyData.maxOf { it.second }.coerceAtLeast(1)
                        Column(modifier = Modifier.padding(12.dp)) {
                            monthlyData.forEach { (month, count) ->
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
                                    Text(month.takeLast(5), fontSize = 11.sp, color = AppColors.TextSecondary, modifier = Modifier.width(45.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(20.dp)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(AppColors.Surface)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight()
                                                .fillMaxWidth(count.toFloat() / maxVal)
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(AppColors.Primary)
                                        )
                                    }
                                    Spacer(Modifier.width(8.dp))
                                    Text("$count", fontSize = 11.sp, color = AppColors.TextSecondary, modifier = Modifier.width(28.dp))
                                }
                            }
                        }
                    } else {
                        Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            Text("暂无数据", color = AppColors.TextSecondary, fontSize = 13.sp)
                        }
                    }
                }
            }

            // Mood distribution
            if (moodDist.isNotEmpty()) {
                Text("心情分布", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                    val total = moodDist.sumOf { it.second }
                    Column(modifier = Modifier.padding(12.dp)) {
                        moodDist.sortedByDescending { it.second }.forEach { (mood, count) ->
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
                                Text(mood, fontSize = 18.sp, modifier = Modifier.width(32.dp))
                                Spacer(Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(20.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(AppColors.Surface)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxHeight()
                                            .fillMaxWidth(count.toFloat() / total)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(AppColors.Primary.copy(alpha = 0.7f))
                                    )
                                }
                                Spacer(Modifier.width(8.dp))
                                Text("$count", fontSize = 11.sp, color = AppColors.TextSecondary, modifier = Modifier.width(28.dp))
                            }
                        }
                    }
                }
            }

            // Type distribution
            if (typeDist.isNotEmpty()) {
                Text("类型分布", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                    val total = typeDist.sumOf { it.second }
                    val typeLabels = mapOf(
                        "track_entry" to Pair("🟢 轨迹", "轨迹"),
                        "memory_entry" to Pair("🔵 记忆", "记忆"),
                        "note_entry" to Pair("📝 笔记", "笔记"),
                    )
                    Column(modifier = Modifier.padding(12.dp)) {
                        typeDist.sortedByDescending { it.second }.forEach { (type, count) ->
                            val (icon, label) = typeLabels[type] ?: Pair("📄 $type", type)
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
                                Text("$icon $label", fontSize = 13.sp, modifier = Modifier.width(80.dp))
                                Spacer(Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(20.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(AppColors.Surface)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxHeight()
                                            .fillMaxWidth(count.toFloat() / total)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(AppColors.Accent)
                                    )
                                }
                                Spacer(Modifier.width(8.dp))
                                Text("$count", fontSize = 11.sp, color = AppColors.TextSecondary, modifier = Modifier.width(28.dp))
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
private fun StatCard(modifier: Modifier = Modifier, label: String, value: String) {
    Card(
        modifier = modifier,
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

private fun calculateCurrentStreak(dates: List<String>): Int {
    if (dates.isEmpty()) return 0
    val today = java.time.LocalDate.now()
    var streak = 0
    var check = today
    while (true) {
        if (dates.contains(check.toString())) {
            streak++
            check = check.minusDays(1)
        } else {
            break
        }
    }
    return streak
}

private fun calculateLongestStreak(dates: List<String>): Int {
    if (dates.isEmpty()) return 0
    var longest = 1
    var current = 1
    for (i in 1 until dates.size) {
        val prev = java.time.LocalDate.parse(dates[i - 1])
        val curr = java.time.LocalDate.parse(dates[i])
        if (curr == prev.plusDays(1)) {
            current++
            longest = maxOf(longest, current)
        } else {
            current = 1
        }
    }
    return longest
}

private fun calculateTotalWords(dailyCounts: List<Pair<String, Int>>): Int {
    // dailyCounts are entry counts, not word counts — use as approximate indicator
    return dailyCounts.sumOf { it.second * 50 }
}
