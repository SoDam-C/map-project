package com.map.gpslogger.ui.footprint

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.WishlistEntity
import com.map.gpslogger.repo.FootprintRepository
import com.map.gpslogger.repo.WishlistRepository
import com.map.gpslogger.ui.theme.AppColors

private data class PriorityInfo(val label: String, val emoji: String)

private val PRIORITY_LABELS = mapOf(
    "must_go" to PriorityInfo("想去了", "🔴"),
    "next_time" to PriorityInfo("下次去", "🟡"),
    "if_chance" to PriorityInfo("有机会去", "🟢"),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WishlistScreen(navController: NavController) {
    val repo = remember { WishlistRepository() }
    val footprintRepo = remember { FootprintRepository() }

    var items by remember { mutableStateOf<List<WishlistEntity>>(emptyList()) }
    var litAdcodes by remember { mutableStateOf<Set<String>>(emptySet()) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        repo.getAll().collect { items = it }
        litAdcodes = footprintRepo.getByLevel(1).map { it.adcode }.toSet()
        loaded = true
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("愿望清单") },
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

        if (items.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("❤️", fontSize = 48.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("还没有想去的地点", fontSize = 14.sp, color = AppColors.TextSecondary)
                }
            }
            return@Scaffold
        }

        // Group by priority
        val grouped = items.groupBy { it.priority }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            PRIORITY_LABELS.forEach { (priority, info) ->
                val groupItems = grouped[priority] ?: emptyList()
                if (groupItems.isEmpty()) return@forEach

                item {
                    Text(
                        "${info.emoji} ${info.label} (${groupItems.size})",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = AppColors.TextSecondary,
                    )
                }

                items(groupItems) { item ->
                    val isVisited = item.adcode in litAdcodes
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                if (isVisited) "✅" else "📍",
                                fontSize = 16.sp,
                            )
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    item.name,
                                    fontSize = 14.sp,
                                    fontWeight = if (isVisited) FontWeight.Normal else FontWeight.Medium,
                                    color = if (isVisited) AppColors.TextSecondary else AppColors.TextPrimary,
                                )
                                if (isVisited) {
                                    Text("已到达!", fontSize = 11.sp, color = AppColors.Success)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
