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
fun AnnualReportScreen(navController: NavController) {
    val repository = remember { DiaryRepository() }
    val scope = rememberCoroutineScope()

    val currentYear = java.time.LocalDate.now().year
    var selectedYear by remember { mutableStateOf(currentYear) }
    var activeDays by remember { mutableStateOf(0) }
    var totalEntries by remember { mutableStateOf(0) }
    var totalPhotos by remember { mutableStateOf(0) }
    var monthlyCounts by remember { mutableStateOf<List<Pair<String, Int>>>(emptyList()) }
    var moodDist by remember { mutableStateOf<List<Pair<String, Int>>>(emptyList()) }
    var currentStreak by remember { mutableStateOf(0) }
    var longestStreak by remember { mutableStateOf(0) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(selectedYear) {
        scope.launch {
            val yearStart = "$selectedYear-01-01"
            val yearEnd = "$selectedYear-12-31"
            val yearEntries = repository.getEntriesByDateRange(yearStart, yearEnd)
            totalEntries = yearEntries.size
            totalPhotos = yearEntries.count { it.photoRefsJson != "[]" && it.photoRefsJson.isNotBlank() }
            activeDays = yearEntries.map { it.date }.distinct().size

            // Monthly counts
            val monthMap = mutableMapOf<String, Int>()
            yearEntries.forEach { entry ->
                val month = entry.date.take(7)
                monthMap[month] = (monthMap[month] ?: 0) + 1
            }
            monthlyCounts = (1..12).map { m ->
                val monthStr = "${selectedYear}-${m.toString().padStart(2, '0')}"
                monthStr to (monthMap[monthStr] ?: 0)
            }

            // Mood distribution for the year
            val moodMap = mutableMapOf<String, Int>()
            yearEntries.forEach { entry ->
                entry.mood?.let { if (it.isNotBlank()) moodMap[it] = (moodMap[it] ?: 0) + 1 } }
            moodDist = moodMap.entries.sortedByDescending { it.value }.map { it.key to it.value }

            // Streaks for the year
            val yearDates = yearEntries.map { it.date }.distinct().sorted()
            currentStreak = calculateCurrentStreak(yearDates)
            longestStreak = calculateLongestStreak(yearDates)

            loaded = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("年度报告") },
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
            // Year selector
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = { selectedYear-- }, enabled = selectedYear > 2020) { Text("◀") }
                Text("$selectedYear", fontSize = 28.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 24.dp))
                TextButton(onClick = { selectedYear++ }, enabled = selectedYear <= currentYear) { Text("▶") }
            }

            // Core metrics
            Text("$selectedYear 年足迹总结", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ReportStatCard(modifier = Modifier.weight(1f), label = "活跃天数", value = "$activeDays")
                ReportStatCard(modifier = Modifier.weight(1f), label = "日记篇数", value = "$totalEntries")
                ReportStatCard(modifier = Modifier.weight(1f), label = "照片数", value = "$totalPhotos")
            }

            // Monthly activity
            if (monthlyCounts.isNotEmpty()) {
                Text("月度活跃度", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                    val maxVal = monthlyCounts.maxOf { it.second }.coerceAtLeast(1)
                    Column(modifier = Modifier.padding(12.dp)) {
                        monthlyCounts.forEach { (month, count) ->
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 1.dp)) {
                                Text(month.takeLast(5), fontSize = 11.sp, color = AppColors.TextSecondary, modifier = Modifier.width(40.dp))
                                Spacer(Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier.weight(1f).height(16.dp).clip(RoundedCornerShape(3.dp)).background(AppColors.Surface),
                                ) {
                                    if (count > 0) {
                                        Box(
                                            modifier = Modifier.fillMaxHeight().fillMaxWidth(count.toFloat() / maxVal)
                                                .clip(RoundedCornerShape(3.dp)).background(AppColors.Primary),
                                        )
                                    }
                                }
                                Spacer(Modifier.width(6.dp))
                                Text("$count", fontSize = 11.sp, color = AppColors.TextSecondary, modifier = Modifier.width(24.dp))
                            }
                        }
                    }
                }
            }

            // Streaks
            Text("写作连续性", fontSize = 16.sp, fontWeight = FontWeight.Medium)
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("$currentStreak", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
                        Text("当前连续", fontSize = 11.sp, color = AppColors.TextSecondary)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("$longestStreak", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = AppColors.Warning)
                        Text("最长连续", fontSize = 11.sp, color = AppColors.TextSecondary)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("$activeDays", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = AppColors.Success)
                        Text("总活跃天", fontSize = 11.sp, color = AppColors.TextSecondary)
                    }
                }
            }

            // Mood distribution
            if (moodDist.isNotEmpty()) {
                Text("年度心情", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("主心情", fontSize = 13.sp, color = AppColors.TextSecondary)
                            Spacer(Modifier.width(8.dp))
                            Text(moodDist.first().first, fontSize = 28.sp)
                            Spacer(Modifier.width(4.dp))
                            Text("× ${moodDist.first().second}", fontSize = 14.sp, color = AppColors.TextSecondary)
                        }
                        Spacer(Modifier.height(8.dp))
                        moodDist.forEach { (mood, count) ->
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 1.dp)) {
                                Text(mood, fontSize = 16.sp, modifier = Modifier.width(32.dp))
                                Spacer(Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier.weight(1f).height(14.dp).clip(RoundedCornerShape(3.dp)).background(AppColors.Surface),
                                ) {
                                    Box(
                                        modifier = Modifier.fillMaxHeight().fillMaxWidth(count.toFloat() / moodDist.first().second)
                                            .clip(RoundedCornerShape(3.dp)).background(AppColors.Primary.copy(alpha = 0.7f)),
                                    )
                                }
                                Spacer(Modifier.width(6.dp))
                                Text("$count", fontSize = 11.sp, color = AppColors.TextSecondary, modifier = Modifier.width(24.dp))
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
private fun ReportStatCard(modifier: Modifier, label: String, value: String) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
            Spacer(Modifier.height(2.dp))
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
        if (dates.contains(check.toString())) { streak++; check = check.minusDays(1) } else break
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
        if (curr == prev.plusDays(1)) { current++; longest = maxOf(longest, current) } else { current = 1 }
    }
    return longest
}
