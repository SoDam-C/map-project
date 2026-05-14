package com.map.gpslogger.ui.diary

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.map.gpslogger.data.DiaryEntryEntity
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiarySearchScreen(navController: NavController) {
    val repository = remember { DiaryRepository() }
    val scope = rememberCoroutineScope()
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<DiaryEntryEntity>>(emptyList()) }
    var searched by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("搜索日记") },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface))
        },
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            OutlinedTextField(value = query, onValueChange = { query = it }, label = { Text("搜索标题、内容、地点...") },
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = { IconButton(onClick = {
                    searched = true
                    scope.launch {
                        results = if (query.isBlank()) emptyList() else repository.searchEntries(query)
                    }
                }) { Icon(Icons.Default.Search, contentDescription = "搜索") } },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(16.dp))
            if (searched && results.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("没有找到匹配的日记", color = AppColors.TextSecondary) }
            } else {
                LazyVerticalGrid(columns = GridCells.Fixed(1), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(results, key = { it.id }) { entry ->
                        DiaryEntryCard(entry = entry, notebook = null,
                            onClick = { navController.navigate(Screen.DiaryDetail.createRoute(entry.id)) })
                    }
                }
            }
        }
    }
}
