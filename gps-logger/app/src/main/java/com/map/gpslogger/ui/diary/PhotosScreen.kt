package com.map.gpslogger.ui.diary

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.PhotoRecordEntity
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhotosScreen(navController: NavController) {
    val dao = remember { GpsLoggerApp.instance.database.photoRecordDao() }
    var photos by remember { mutableStateOf<List<PhotoRecordEntity>>(emptyList()) }

    LaunchedEffect(Unit) {
        dao.getAll().collect { photos = it }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("照片") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
    ) { padding ->
        if (photos.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("暂无照片", color = AppColors.TextSecondary, fontSize = 16.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("通过 EXIF 导入或日记关联添加照片", color = AppColors.TextSecondary, fontSize = 13.sp)
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(4.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                items(photos, key = { it.id }) { photo ->
                    PhotoGridItem(photo = photo)
                }
            }
        }
    }
}

@Composable
private fun PhotoGridItem(photo: PhotoRecordEntity) {
    Card(
        modifier = Modifier
            .aspectRatio(1f)
            .padding(2.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.SurfaceVariant),
    ) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                photo.regionName?.let {
                    Spacer(Modifier.height(4.dp))
                    Text(it, fontSize = 9.sp, color = AppColors.TextSecondary, maxLines = 1)
                }
                Text(photo.takenAt.take(10), fontSize = 9.sp, color = AppColors.TextSecondary)
            }
        }
    }
}
