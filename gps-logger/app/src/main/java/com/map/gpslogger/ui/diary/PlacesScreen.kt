package com.map.gpslogger.ui.diary

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.PlaceBookmarkEntity
import com.map.gpslogger.model.PlaceCategory
import com.map.gpslogger.util.IdGenerator
import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlacesScreen(navController: NavController) {
    val context = LocalContext.current
    val dao = remember { GpsLoggerApp.instance.database.placeBookmarkDao() }
    val scope = rememberCoroutineScope()

    var bookmarks by remember { mutableStateOf<List<PlaceBookmarkEntity>>(emptyList()) }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var showAddDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        dao.getAll().collect { bookmarks = it }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("地点收藏") },
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
                onClick = { showAddDialog = true },
                containerColor = AppColors.Primary,
            ) {
                Icon(Icons.Default.Add, contentDescription = "添加地点", tint = AppColors.OnPrimary)
            }
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Search
            OutlinedTextField(
                value = searchQuery, onValueChange = { searchQuery = it },
                label = { Text("搜索地点...") }, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary),
            )

            // Category filters
            Row(modifier = Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(selected = selectedCategory == null, onClick = { selectedCategory = null }, label = { Text("全部", fontSize = 12.sp) })
                PlaceCategory.entries.forEach { cat ->
                    FilterChip(selected = selectedCategory == cat.id, onClick = { selectedCategory = cat.id }, label = { Text("${cat.icon} ${cat.label}", fontSize = 12.sp) })
                }
            }

            Spacer(Modifier.height(8.dp))

            val filteredBookmarks = if (searchQuery.isNotBlank()) {
                bookmarks.filter { it.name.contains(searchQuery, ignoreCase = true) || it.note?.contains(searchQuery, ignoreCase = true) == true }
            } else if (selectedCategory != null) {
                bookmarks.filter { it.category == selectedCategory }
            } else {
                bookmarks
            }

            if (filteredBookmarks.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("暂无收藏地点", color = AppColors.TextSecondary)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(vertical = 8.dp),
                ) {
                    items(filteredBookmarks, key = { it.id }) { bookmark ->
                        PlaceBookmarkCard(bookmark = bookmark, onDelete = {
                            scope.launch { dao.delete(it); Toast.makeText(context, "已删除", Toast.LENGTH_SHORT).show() }
                        })
                    }
                }
            }
        }

        if (showAddDialog) {
            AddPlaceDialog(onDismiss = { showAddDialog = false }, onConfirm = { name, category, note, lat, lng ->
                scope.launch {
                    val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).format(java.util.Date())
                    dao.insert(PlaceBookmarkEntity(
                        id = IdGenerator.placeId(), name = name, lat = lat, lng = lng,
                        category = category, note = note.ifBlank { null },
                        tags = null,
                        createdAt = now, updatedAt = now,
                    ))
                    showAddDialog = false
                }
            })
        }
    }
}

@Composable
private fun PlaceBookmarkCard(bookmark: PlaceBookmarkEntity, onDelete: (String) -> Unit) {
    val category = PlaceCategory.entries.find { it.id == bookmark.category }
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(category?.icon ?: "📍", fontSize = 20.sp)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(bookmark.name, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                bookmark.note?.let { if (it.isNotBlank()) {
                    Text(it.take(50), fontSize = 12.sp, color = AppColors.TextSecondary, maxLines = 1)
                }}
                Text("${category?.label ?: "其他"} · ${bookmark.lat.toFixed(4)}, ${bookmark.lng.toFixed(4)}",
                    fontSize = 11.sp, color = AppColors.TextSecondary)
            }
            IconButton(onClick = { onDelete(bookmark.id) }) {
                Icon(Icons.Default.Delete, contentDescription = "删除", tint = AppColors.Error, modifier = Modifier.size(18.dp))
            }
        }
    }
}

private fun Double.toFixed(digits: Int) = "%.${digits}f".format(this)

@Composable
private fun AddPlaceDialog(onDismiss: () -> Unit, onConfirm: (name: String, category: String, note: String, lat: Double, lng: Double) -> Unit) {
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("other") }
    var note by remember { mutableStateOf("") }
    var latStr by remember { mutableStateOf("") }
    var lngStr by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("添加地点") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("名称") },
                    modifier = Modifier.fillMaxWidth(), singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    PlaceCategory.entries.forEach { cat ->
                        FilterChip(selected = category == cat.id, onClick = { category = cat.id },
                            label = { Text(cat.icon, fontSize = 14.sp) })
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = latStr, onValueChange = { latStr = it }, label = { Text("纬度") },
                        modifier = Modifier.weight(1f), singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
                    OutlinedTextField(value = lngStr, onValueChange = { lngStr = it }, label = { Text("经度") },
                        modifier = Modifier.weight(1f), singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
                }
                OutlinedTextField(value = note, onValueChange = { note = it }, label = { Text("备注") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val lat = latStr.toDoubleOrNull() ?: return@TextButton
                val lng = lngStr.toDoubleOrNull() ?: return@TextButton
                if (name.isBlank()) return@TextButton
                onConfirm(name, category, note, lat, lng)
            }) { Text("添加", color = AppColors.Primary) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("取消") } },
    )
}
