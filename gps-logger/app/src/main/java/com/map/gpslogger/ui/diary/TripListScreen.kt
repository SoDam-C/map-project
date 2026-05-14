package com.map.gpslogger.ui.diary

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.DiaryTripEntity
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TripListScreen(navController: NavController) {
    val repository = remember { DiaryRepository() }
    val trips by repository.getAllTrips().collectAsState(initial = emptyList())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("旅行") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(Screen.TripCreate.route) },
                containerColor = AppColors.Primary,
            ) {
                Icon(Icons.Default.Add, contentDescription = "新建旅行", tint = AppColors.OnPrimary)
            }
        },
    ) { padding ->
        if (trips.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("还没有旅行记录", color = AppColors.TextSecondary, fontSize = 16.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("点击 + 创建旅行", color = AppColors.TextSecondary, fontSize = 14.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 12.dp),
            ) {
                items(trips, key = { it.id }) { trip ->
                    TripCard(trip = trip, onClick = {
                        navController.navigate(Screen.TripDetail.createRoute(trip.id))
                    })
                }
            }
        }
    }
}

@Composable
fun TripCard(trip: DiaryTripEntity, onClick: () -> Unit) {
    val dateFormat = SimpleDateFormat("yyyy/MM/dd", Locale.US)
    val start = try { dateFormat.parse(trip.startDate) } catch (_: Exception) { null }
    val end = try { dateFormat.parse(trip.endDate) } catch (_: Exception) { null }
    val days = if (start != null && end != null) {
        ((end.time - start.time) / (1000 * 60 * 60 * 24) + 1).toInt()
    } else null

    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(trip.title, fontWeight = FontWeight.Medium, fontSize = 16.sp)
            Spacer(Modifier.height(6.dp))
            Row {
                Text("${trip.startDate} ~ ${trip.endDate}", fontSize = 12.sp, color = AppColors.TextSecondary)
                days?.let { d ->
                    Spacer(Modifier.width(12.dp))
                    Text("${d}天", fontSize = 12.sp, color = AppColors.Primary)
                }
            }
            trip.description?.let { if (it.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(it.take(80) + if (it.length > 80) "..." else "", fontSize = 13.sp, color = AppColors.TextSecondary, maxLines = 2)
            }}
        }
    }
}
