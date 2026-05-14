package com.map.gpslogger.ui.passport

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.data.FootprintEntity
import com.map.gpslogger.model.AchievementStats
import com.map.gpslogger.model.Achievements
import com.map.gpslogger.model.AdminRegions
import com.map.gpslogger.model.ExplorerLevel
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.repo.FootprintRepository
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private data class PassportData(
    val provinceFootprints: Map<String, FootprintEntity> = emptyMap(),
    val unlockedIds: Set<String> = emptySet(),
    val totalDistanceKm: Double = 0.0,
    val exploredKm2: Double = 0.0,
    val trackingDays: Int = 0,
    val provinceCount: Int = 0,
    val entryCount: Int = 0,
    val overallPercent: Int = 0,
    val mapLevel: Int = 1,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PassportScreen(navController: NavController) {
    val scope = rememberCoroutineScope()
    var data by remember { mutableStateOf(PassportData()) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val db = GpsLoggerApp.instance.database
                val diaryRepo = DiaryRepository()
                val footprintRepo = FootprintRepository()

                // Province footprints
                val footprints = footprintRepo.getByLevel(1)
                val fpMap = footprints.associateBy { it.adcode }
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

                // Diary
                val entryCount = diaryRepo.getEntryCount()
                val dates = diaryRepo.getAllDatesOrdered()
                val currentStreak = calculateCurrentStreak(dates)
                val longestStreak = calculateLongestStreak(dates)
                val photoCount = diaryRepo.getWithPhotosCount()

                // Achievements
                val stats = AchievementStats(
                    totalEntries = entryCount,
                    totalPhotos = photoCount,
                    provinceCount = provinceCount,
                    currentStreak = currentStreak,
                    longestStreak = longestStreak,
                    totalDistanceKm = totalDistanceKm,
                    exploredKm2 = exploredKm2,
                    trackingDays = trackingDays,
                )
                val unlocked = Achievements.getUnlocked(stats).map { it.id }.toSet()

                // Map level
                val score = exploredKm2 * 2.0 + provinceCount * 50.0 + totalDistanceKm * 0.5 + trackingDays * 5.0
                val mapLevel = (1 + kotlin.math.sqrt(score).toInt()).coerceIn(1, 9999)

                withContext(Dispatchers.Main) {
                    data = PassportData(
                        provinceFootprints = fpMap,
                        unlockedIds = unlocked,
                        totalDistanceKm = totalDistanceKm,
                        exploredKm2 = exploredKm2,
                        trackingDays = trackingDays,
                        provinceCount = provinceCount,
                        entryCount = entryCount,
                        overallPercent = overallPercent,
                        mapLevel = mapLevel,
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
                title = { Text("护照") },
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
                .padding(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(0.dp),
        ) {
            // Cover page
            val explorerLevel = ExplorerLevel.calculate(data.overallPercent)
            val nextLevel = ExplorerLevel.next(explorerLevel)
            val levelProgress = ExplorerLevel.progress(data.overallPercent)

            PassportCoverPage(
                data = CoverData(
                    level = explorerLevel,
                    nextLevel = nextLevel,
                    levelProgress = levelProgress,
                    overallPercent = data.overallPercent,
                    provinceCount = data.provinceCount,
                    totalDistanceKm = data.totalDistanceKm,
                    trackingDays = data.trackingDays,
                    entryCount = data.entryCount,
                    mapLevel = data.mapLevel,
                )
            )

            PageDivider()

            // Province stamps
            ProvinceStampPage(
                provinces = AdminRegions.provinces,
                footprints = data.provinceFootprints,
            )

            PageDivider()

            // Achievement stamps
            AchievementStampPage(
                achievements = Achievements.all,
                unlockedIds = data.unlockedIds,
            )

            PageDivider()

            // Milestone stamps
            MilestoneStampPage(
                totalDistanceKm = data.totalDistanceKm,
                exploredKm2 = data.exploredKm2,
                trackingDays = data.trackingDays,
                provinceCount = data.provinceCount,
            )

            Spacer(Modifier.height(32.dp))
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
