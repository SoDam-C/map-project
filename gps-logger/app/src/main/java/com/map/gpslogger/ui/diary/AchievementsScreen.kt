package com.map.gpslogger.ui.diary

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.model.Achievement
import com.map.gpslogger.model.AchievementRarity
import com.map.gpslogger.model.AchievementStats
import com.map.gpslogger.model.Achievements
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.repo.FootprintRepository
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

private val RARITY_COLORS = mapOf(
    AchievementRarity.COMMON to Color(0xFF9CA3AF),
    AchievementRarity.RARE to Color(0xFF60A5FA),
    AchievementRarity.EPIC to Color(0xFFA78BFA),
    AchievementRarity.LEGENDARY to Color(0xFFFBBF24),
)

private val RARITY_ORDER = listOf(AchievementRarity.LEGENDARY, AchievementRarity.EPIC, AchievementRarity.RARE, AchievementRarity.COMMON)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AchievementsScreen(navController: NavController) {
    val diaryRepo = remember { DiaryRepository() }
    val footprintRepo = remember { FootprintRepository() }
    val scope = rememberCoroutineScope()

    var unlockedIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    var stats by remember { mutableStateOf<AchievementStats?>(null) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        scope.launch {
            val db = GpsLoggerApp.instance.database
            val tracks = db.trackDao().getAllOnce()
            val totalDistanceKm = tracks.sumOf { it.distance } / 1000.0
            val firstTs = tracks.minOfOrNull { it.startTime } ?: 0L
            val trackingDays = if (firstTs > 0) {
                ((System.currentTimeMillis() - firstTs) / (1000 * 60 * 60 * 24)).toInt().coerceAtLeast(1)
            } else 0

            val trackIds = tracks.map { it.id }
            val points = if (trackIds.isNotEmpty()) db.gpsPointDao().getByTrackIds(trackIds) else emptyList()
            val cellSize = 0.001
            val exploredCells = mutableSetOf<Pair<Int, Int>>()
            for (p in points) {
                exploredCells.add((p.lng / cellSize).toInt() to (p.lat / cellSize).toInt())
            }
            val cellAreaKm2 = (cellSize * 111.0) * (cellSize * 111.0)
            val exploredKm2 = exploredCells.size * cellAreaKm2

            val s = AchievementStats(
                totalEntries = diaryRepo.getEntryCount(),
                publishedEntries = diaryRepo.getPublishedCount(),
                totalPhotos = diaryRepo.getWithPhotosCount(),
                currentStreak = calculateCurrentStreak(diaryRepo.getAllDatesOrdered()),
                longestStreak = calculateLongestStreak(diaryRepo.getAllDatesOrdered()),
                provinceCount = footprintRepo.getByLevel(1).size,
                totalDistanceKm = totalDistanceKm,
                exploredKm2 = exploredKm2,
                trackingDays = trackingDays,
            )
            stats = s
            unlockedIds = Achievements.getUnlocked(s).map { it.id }.toSet()
            loaded = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("成就") },
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
            // Summary
            Text(
                "${unlockedIds.size} / ${Achievements.all.size}",
                fontSize = 28.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
            Text("已解锁成就", fontSize = 14.sp, color = AppColors.TextSecondary, modifier = Modifier.align(Alignment.CenterHorizontally))
            Spacer(Modifier.height(8.dp))

            // By rarity tier
            val currentStats = stats ?: AchievementStats()
            RARITY_ORDER.forEach { rarity ->
                val achievements = Achievements.getByRarity()[rarity] ?: emptyList()
                if (achievements.isEmpty()) return@forEach
                val rarityColor = RARITY_COLORS[rarity] ?: Color.Gray
                val rarityLabel = AchievementRarity.getLabel(rarity)
                val unlockedInGroup = achievements.count { it.id in unlockedIds }

                // Rarity header
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        rarityLabel,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = rarityColor,
                        modifier = Modifier
                            .border(1.dp, rarityColor.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp),
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("$unlockedInGroup/${achievements.size}", fontSize = 11.sp, color = AppColors.TextSecondary)
                }
                Spacer(Modifier.height(6.dp))

                achievements.forEach { achievement ->
                    AchievementCard(
                        achievement = achievement,
                        isUnlocked = achievement.id in unlockedIds,
                        rarityColor = rarityColor,
                        currentStats = currentStats,
                    )
                }
                Spacer(Modifier.height(4.dp))
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun AchievementCard(
    achievement: Achievement,
    isUnlocked: Boolean,
    rarityColor: Color,
    currentStats: AchievementStats,
) {
    val borderColor = if (isUnlocked) rarityColor.copy(alpha = 0.4f) else Color.Transparent
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, borderColor, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(
            containerColor = if (isUnlocked) AppColors.CardBackground else AppColors.Surface,
        ),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (isUnlocked) achievement.icon else "🔒",
                fontSize = 28.sp,
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    achievement.title,
                    fontWeight = FontWeight.Medium, fontSize = 14.sp,
                    color = if (isUnlocked) AppColors.TextPrimary else AppColors.TextSecondary,
                )
                Text(
                    achievement.description,
                    fontSize = 12.sp,
                    color = AppColors.TextSecondary,
                )
                // Progress bar for achievements with target
                if (achievement.target != null && !isUnlocked) {
                    val current = getProgressCurrent(achievement, currentStats)
                    val progress = (current.toFloat() / achievement.target).coerceIn(0f, 1f)
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(4.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(AppColors.Surface),
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(progress)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(rarityColor),
                            )
                        }
                        Spacer(Modifier.width(6.dp))
                        Text("$current/${achievement.target}", fontSize = 10.sp, color = AppColors.TextSecondary)
                    }
                }
            }
            if (isUnlocked) {
                Text("✅", fontSize = 16.sp)
            }
        }
    }
}

private fun getProgressCurrent(achievement: Achievement, stats: AchievementStats): Int {
    return when {
        achievement.id.startsWith("diary_") -> stats.totalEntries
        achievement.id.startsWith("streak_") -> maxOf(stats.currentStreak, stats.longestStreak)
        achievement.id.startsWith("fp_") -> stats.provinceCount
        achievement.id.startsWith("trip_") -> stats.totalTrips
        achievement.id.startsWith("photo_") && achievement.id != "photo_entry" -> stats.totalPhotos
        achievement.id.startsWith("track_") -> stats.trackEntries
        achievement.id.startsWith("dist_") -> stats.totalDistanceKm.toInt()
        achievement.id.startsWith("area_") -> stats.exploredKm2.toInt()
        achievement.id.startsWith("days_") -> stats.trackingDays
        achievement.id == "tag_5" -> stats.tagCount
        else -> 0
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
