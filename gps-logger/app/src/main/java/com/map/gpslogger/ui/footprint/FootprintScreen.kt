package com.map.gpslogger.ui.footprint

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.LevelCount
import com.map.gpslogger.model.AdminRegions
import com.map.gpslogger.model.ExplorerLevel
import com.map.gpslogger.repo.FootprintRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FootprintScreen(navController: NavController) {
    val repository = remember { FootprintRepository() }

    var levelCounts by remember { mutableStateOf<List<LevelCount>>(emptyList()) }
    var litProvinces by remember { mutableStateOf<Set<String>>(emptySet()) }
    var cityCountsByProvince by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }
    var overallPercent by remember { mutableIntStateOf(0) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        levelCounts = repository.getCountByLevel()
        overallPercent = repository.getOverallPercentage()
        val allFootprints = repository.getByLevel(1)
        litProvinces = allFootprints.map { it.adcode }.toSet()
        val counts = mutableMapOf<String, Int>()
        AdminRegions.provinces.forEach { p ->
            counts[p.adcode] = repository.getCityCountForProvince(p.adcode)
        }
        cityCountsByProvince = counts
        loaded = true
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("足迹") },
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

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Overview stats
            item {
                val level = ExplorerLevel.calculate(overallPercent)
                val nextLevel = ExplorerLevel.next(level)
                val levelProgress = ExplorerLevel.progress(overallPercent)
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(level.emoji, fontSize = 28.sp)
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(level.name, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                Text("已探索 ${overallPercent}%", fontSize = 12.sp, color = AppColors.TextSecondary)
                            }
                            Text("$overallPercent%", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
                        }
                        Spacer(Modifier.height(8.dp))
                        Box(
                            modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(AppColors.Surface),
                        ) {
                            Box(
                                modifier = Modifier.fillMaxHeight().fillMaxWidth(levelProgress / 100f).clip(RoundedCornerShape(3.dp)).background(AppColors.Primary),
                            )
                        }
                        if (nextLevel != null) {
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "距离 ${nextLevel.emoji} ${nextLevel.name} 还需 ${nextLevel.minPercent - overallPercent}%",
                                fontSize = 11.sp, color = AppColors.TextSecondary,
                            )
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))
                Text("探索进度", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))
            }

            // Fog map button
            item {
                Card(
                    onClick = { navController.navigate(Screen.FogMap.route) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("🌫️", fontSize = 24.sp)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("轨迹迷雾地图", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("查看 GPS 轨迹走过的路径", fontSize = 11.sp, color = AppColors.TextSecondary)
                        }
                        Text("→", fontSize = 18.sp, color = AppColors.TextSecondary)
                    }
                }
            }

            // Passport button
            item {
                Card(
                    onClick = { navController.navigate(Screen.Passport.route) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("📕", fontSize = 24.sp)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("旅行护照", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("查看省份印章与成就", fontSize = 11.sp, color = AppColors.TextSecondary)
                        }
                        Text("→", fontSize = 18.sp, color = AppColors.TextSecondary)
                    }
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OverviewCard(
                        modifier = Modifier.weight(1f),
                        label = "省份",
                        value = "${litProvinces.size}",
                        total = AdminRegions.provinces.size,
                    )
                    val cityTotal = levelCounts.find { it.level == 2 }?.count ?: 0
                    OverviewCard(
                        modifier = Modifier.weight(1f),
                        label = "城市",
                        value = "$cityTotal",
                        total = 333,
                    )
                    val districtTotal = levelCounts.find { it.level == 3 }?.count ?: 0
                    OverviewCard(
                        modifier = Modifier.weight(1f),
                        label = "区县",
                        value = "$districtTotal",
                        total = 2844,
                    )
                }
            }

            // Overall progress bar
            item {
                val provincePercent = (litProvinces.size.toFloat() / AdminRegions.provinces.size * 100).toInt()
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("全国总进度", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("${litProvinces.size}/34 省 · ${provincePercent}%", fontSize = 13.sp, color = AppColors.TextSecondary)
                        }
                        Spacer(Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(AppColors.Surface)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(litProvinces.size.toFloat() / AdminRegions.provinces.size)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(progressColor(provincePercent))
                            )
                        }
                    }
                }
            }

            item {
                Spacer(Modifier.height(4.dp))
                Text("省份进度", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(8.dp))
            }

            // Province list sorted by completion
            val sortedProvinces = AdminRegions.provinces.sortedWith(
                compareByDescending<AdminRegions.Province> { if (it.adcode in litProvinces) 1 else 0 }
                    .thenBy { it.name }
            )

            items(sortedProvinces) { province ->
                val isLit = province.adcode in litProvinces
                val cityCount = cityCountsByProvince[province.adcode] ?: 0
                ProvinceProgressCard(
                    name = province.name,
                    isLit = isLit,
                    cityCount = cityCount,
                    onClick = {},
                )
            }
        }
    }
}

@Composable
private fun OverviewCard(modifier: Modifier, label: String, value: String, total: Int) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground)) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
            Spacer(Modifier.height(2.dp))
            Text("$label ($total)", fontSize = 11.sp, color = AppColors.TextSecondary)
        }
    }
}

@Composable
private fun ProvinceProgressCard(name: String, isLit: Boolean, cityCount: Int, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (isLit) "🟢" else "⚫",
                fontSize = 14.sp,
            )
            Spacer(Modifier.width(12.dp))
            Text(
                name,
                fontSize = 15.sp,
                fontWeight = if (isLit) FontWeight.Medium else FontWeight.Normal,
                color = if (isLit) AppColors.TextPrimary else AppColors.TextSecondary,
                modifier = Modifier.weight(1f),
            )
            if (isLit && cityCount > 0) {
                Text(
                    "$cityCount 市",
                    fontSize = 12.sp,
                    color = AppColors.TextSecondary,
                )
            } else if (isLit) {
                Text(
                    "已点亮",
                    fontSize = 12.sp,
                    color = AppColors.Primary,
                )
            }
        }
    }
}

private fun progressColor(percent: Int): androidx.compose.ui.graphics.Color = when {
    percent >= 80 -> AppColors.Success
    percent >= 50 -> AppColors.Primary
    percent >= 20 -> AppColors.Warning
    else -> AppColors.Error
}
