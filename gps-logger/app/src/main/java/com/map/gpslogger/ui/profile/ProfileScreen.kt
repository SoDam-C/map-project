package com.map.gpslogger.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavController
import android.widget.Toast
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.model.Achievements
import com.map.gpslogger.model.AdminRegions
import com.map.gpslogger.model.ExplorerLevel
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.repo.FootprintRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private data class ProfileStats(
    val entryCount: Int = 0,
    val photoCount: Int = 0,
    val footprintCount: Int = 0,
    val provinceCount: Int = 0,
    val totalDistanceKm: Double = 0.0,
    val exploredKm2: Double = 0.0,
    val trackingDays: Int = 0,
    val unlockedAchievementIcons: List<String> = emptyList(),
    val unlockedCount: Int = 0,
    val totalAchievements: Int = 0,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(navController: NavController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var stats by remember { mutableStateOf(ProfileStats()) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val db = GpsLoggerApp.instance.database
                val diaryRepo = DiaryRepository()
                val footprintRepo = FootprintRepository()

                val entryCount = diaryRepo.getEntryCount()
                val photoCount = diaryRepo.getWithPhotosCount()
                val footprints = footprintRepo.getByLevel(1)
                val footprintCount = footprints.size + (footprintRepo.getCountByLevel().find { it.level == 2 }?.count ?: 0)
                val provinceCount = footprints.size
                val overallPercent = footprintRepo.getOverallPercentage()

                // Track stats
                val tracks = db.trackDao().getAllOnce()
                val totalDistanceKm = tracks.sumOf { it.distance } / 1000.0
                val firstTs = tracks.minOfOrNull { it.startTime } ?: 0L
                val trackingDays = if (firstTs > 0) {
                    ((System.currentTimeMillis() - firstTs) / (1000 * 60 * 60 * 24)).toInt().coerceAtLeast(1)
                } else 0

                // Explored area
                val trackIds = tracks.map { it.id }
                val points = if (trackIds.isNotEmpty()) db.gpsPointDao().getByTrackIds(trackIds) else emptyList()
                val cellSize = 0.001
                val exploredCells = mutableSetOf<Pair<Int, Int>>()
                for (p in points) {
                    exploredCells.add((p.lng / cellSize).toInt() to (p.lat / cellSize).toInt())
                }
                val cellAreaKm2 = (cellSize * 111.0) * (cellSize * 111.0)
                val exploredKm2 = exploredCells.size * cellAreaKm2

                // Achievements
                val dates = diaryRepo.getAllDatesOrdered()
                val currentStreak = calculateCurrentStreak(dates)
                val longestStreak = calculateLongestStreak(dates)
                val achievementStats = com.map.gpslogger.model.AchievementStats(
                    totalEntries = entryCount,
                    totalPhotos = photoCount,
                    provinceCount = provinceCount,
                    currentStreak = currentStreak,
                    longestStreak = longestStreak,
                )
                val unlocked = Achievements.getUnlocked(achievementStats)

                withContext(Dispatchers.Main) {
                    stats = ProfileStats(
                        entryCount = entryCount,
                        photoCount = photoCount,
                        footprintCount = footprintCount,
                        provinceCount = provinceCount,
                        totalDistanceKm = totalDistanceKm,
                        exploredKm2 = exploredKm2,
                        trackingDays = trackingDays,
                        unlockedAchievementIcons = unlocked.map { it.icon },
                        unlockedCount = unlocked.size,
                        totalAchievements = Achievements.all.size,
                    )
                    loaded = true
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { loaded = true }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("我的") },
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
                .verticalScroll(rememberScrollState()),
        ) {
            // === Passport Card ===
            PassportCard(stats = stats)

            Spacer(Modifier.height(16.dp))

            // === Achievement Badges Row ===
            if (stats.unlockedAchievementIcons.isNotEmpty()) {
                AchievementBadgesRow(
                    icons = stats.unlockedAchievementIcons,
                    unlocked = stats.unlockedCount,
                    total = stats.totalAchievements,
                    onClick = { navController.navigate(Screen.Achievements.route) },
                )
                Spacer(Modifier.height(12.dp))
            }

            // === Quick Stats Grid ===
            QuickStatsGrid(stats = stats)

            Spacer(Modifier.height(12.dp))

            HorizontalDivider(color = AppColors.Border)

            // === Menu Items ===
            MenuSection(items = listOf(
                MenuItem("📕", "护照", "旅行护照与印章收集") { navController.navigate(Screen.Passport.route) },
                MenuItem("📊", "数据统计", "日记统计与趋势") { navController.navigate(Screen.DiaryStats.route) },
                MenuItem("🏆", "成就", "${stats.unlockedCount}/${stats.totalAchievements} 已解锁") { navController.navigate(Screen.Achievements.route) },
                MenuItem("📅", "年度报告", "年度足迹总结") { navController.navigate(Screen.AnnualReport.route) },
                MenuItem("📸", "照片", "照片时间线") { navController.navigate(Screen.Photos.route) },
                MenuItem("🛤️", "轨迹", "GPS 轨迹管理") { navController.navigate(Screen.DiaryTracks.route) },
                MenuItem("📍", "地点收藏", "收藏的地点") { navController.navigate(Screen.DiaryPlaces.route) },
                MenuItem("❤️", "愿望清单", "想去的地点") { navController.navigate(Screen.Wishlist.route) },
            ))

            HorizontalDivider(color = AppColors.Border)

            MenuSection(items = listOf(
                MenuItem("📖", "使用指南", "功能说明与使用方式") { navController.navigate(Screen.Guide.route) },
                MenuItem("📄", "Markdown 导出", "日记导出为 Obsidian 兼容 .md 文件") {
                    scope.launch {
                        val diaryRepo = DiaryRepository()
                        val count = stats.entryCount
                        diaryRepo.syncAllToMarkdown()
                        Toast.makeText(context, "已导出 $count 篇日记为 .md 文件", Toast.LENGTH_SHORT).show()
                    }
                },
                MenuItem("🖥️", "服务器设置", "同步服务器配置") { navController.navigate(Screen.ServerSettings.route) },
            ))

            Spacer(Modifier.height(32.dp))
        }
    }
}

// ========== Passport Card ==========

@Composable
private fun PassportCard(stats: ProfileStats) {
    val overallPercent = if (AdminRegions.provinces.isNotEmpty()) {
        (stats.provinceCount.toFloat() / AdminRegions.provinces.size * 100).toInt()
    } else 0
    val level = ExplorerLevel.calculate(overallPercent)
    val nextLevel = ExplorerLevel.next(level)
    val levelProgress = ExplorerLevel.progress(overallPercent)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Box {
            // Gradient background
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color(0xFF1a1a3e),
                                Color(0xFF16213e),
                                Color(0xFF0f3460),
                            )
                        ),
                        RoundedCornerShape(16.dp),
                    )
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                ) {
                    // Header: Level + Explorer title
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // Level circle
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFFD700).copy(alpha = 0.15f))
                                .border(2.dp, Color(0xFFFFD700), CircleShape),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                level.emoji,
                                fontSize = 28.sp,
                            )
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                level.name,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                "已探索 $overallPercent% · LV ${calculateMapLevel(stats)}",
                                fontSize = 12.sp,
                                color = Color(0xFF8b949e),
                            )
                        }
                        // Province badge
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                "${stats.provinceCount}",
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFFFD700),
                            )
                            Text(
                                "/ 34 省",
                                fontSize = 11.sp,
                                color = Color(0xFF8b949e),
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // Level progress bar
                    if (nextLevel != null) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(
                                "${level.emoji} ${level.name}",
                                fontSize = 11.sp,
                                color = Color(0xFF8b949e),
                            )
                            Text(
                                "下一级: ${nextLevel.emoji} ${nextLevel.name} (${nextLevel.minPercent}%)",
                                fontSize = 11.sp,
                                color = Color(0xFF8b949e),
                            )
                        }
                        Spacer(Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(Color(0xFF2d2d4e)),
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(levelProgress / 100f)
                                    .clip(RoundedCornerShape(3.dp))
                                    .background(
                                        Brush.horizontalGradient(
                                            colors = listOf(Color(0xFF6366F1), Color(0xFF22D3EE))
                                        )
                                    ),
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // Stats row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                    ) {
                        PassportStat(formatArea(stats.exploredKm2), "探索面积")
                        PassportStat(formatDistance(stats.totalDistanceKm), "总里程")
                        PassportStat("${stats.trackingDays}", "记录天数")
                        PassportStat("${stats.entryCount}", "日记")
                    }
                }
            }
        }
    }
}

@Composable
private fun PassportStat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 10.sp, color = Color(0xFF8b949e))
    }
}

// ========== Achievement Badges ==========

@Composable
private fun AchievementBadgesRow(
    icons: List<String>,
    unlocked: Int,
    total: Int,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
        shape = RoundedCornerShape(12.dp),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("成就勋章", fontSize = 13.sp, fontWeight = FontWeight.Medium, color = AppColors.TextPrimary)
                Text("$unlocked/$total", fontSize = 11.sp, color = AppColors.TextSecondary)
            }
            Spacer(Modifier.height(8.dp))
            // Badge grid (max 2 rows of 8)
            val displayIcons = icons.take(16)
            val rows = displayIcons.chunked(8)
            rows.forEach { rowIcons ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    rowIcons.forEach { icon ->
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF6366F1).copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(icon, fontSize = 18.sp)
                        }
                    }
                    // Empty placeholders to keep alignment
                    repeat(8 - rowIcons.size) {
                        Spacer(Modifier.size(36.dp))
                    }
                }
                if (rowIcons != rows.last()) Spacer(Modifier.height(4.dp))
            }
            if (icons.size > 16) {
                Spacer(Modifier.height(4.dp))
                Text("还有 ${icons.size - 16} 个成就…", fontSize = 11.sp, color = AppColors.TextSecondary)
            }
        }
    }
}

// ========== Quick Stats Grid ==========

@Composable
private fun QuickStatsGrid(stats: ProfileStats) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        QuickStatCard(modifier = Modifier.weight(1f), value = "${stats.footprintCount}", label = "足迹")
        QuickStatCard(modifier = Modifier.weight(1f), value = "${stats.photoCount}", label = "照片")
        QuickStatCard(modifier = Modifier.weight(1f), value = "${stats.unlockedCount}", label = "成就")
    }
}

@Composable
private fun QuickStatCard(modifier: Modifier, value: String, label: String) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
        shape = RoundedCornerShape(10.dp),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
            Spacer(Modifier.height(2.dp))
            Text(label, fontSize = 11.sp, color = AppColors.TextSecondary)
        }
    }
}

// ========== Menu Section ==========

private data class MenuItem(
    val icon: String,
    val title: String,
    val subtitle: String,
    val onClick: () -> Unit,
)

@Composable
private fun MenuSection(items: List<MenuItem>) {
    items.forEach { item ->
        SettingsItem(icon = item.icon, title = item.title, subtitle = item.subtitle, onClick = item.onClick)
    }
}

@Composable
private fun SettingsItem(icon: String, title: String, subtitle: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(icon, fontSize = 20.sp)
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontSize = 15.sp)
            Text(subtitle, fontSize = 12.sp, color = AppColors.TextSecondary)
        }
        Icon(
            Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = null,
            tint = AppColors.TextSecondary,
        )
    }
}

// ========== Helpers ==========

private fun calculateMapLevel(stats: ProfileStats): Int {
    val score = stats.exploredKm2 * 2.0 + stats.provinceCount * 50.0 + stats.totalDistanceKm * 0.5 + stats.trackingDays * 5.0
    return (1 + kotlin.math.sqrt(score).toInt()).coerceIn(1, 9999)
}

private fun formatArea(km2: Double): String = when {
    km2 < 1 -> "${"%.0f".format(km2 * 100)} 公亩"
    km2 < 100 -> "${"%.1f".format(km2)} km²"
    else -> "${"%.0f".format(km2)} km²"
}

private fun formatDistance(km: Double): String = when {
    km < 1 -> "${"%.0f".format(km * 1000)} m"
    km < 100 -> "${"%.1f".format(km)} km"
    else -> "${"%.0f".format(km)} km"
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
