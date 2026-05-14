package com.map.gpslogger.ui.diary

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.model.Mood
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiaryEditScreen(navController: NavController, id: String) {
    val context = LocalContext.current
    val repository = remember { DiaryRepository() }
    val scope = rememberCoroutineScope()

    var entry by remember { mutableStateOf<com.map.gpslogger.data.DiaryEntryEntity?>(null) }

    LaunchedEffect(id) {
        entry = repository.getEntry(id)
    }
    var title by remember(entry) { mutableStateOf(entry?.title ?: "") }
    var content by remember(entry) { mutableStateOf(entry?.content ?: "") }
    var mood by remember(entry) { mutableStateOf(entry?.mood) }
    var tags by remember(entry) { mutableStateOf("") }
    var locationName by remember(entry) { mutableStateOf(entry?.locationName ?: "") }
    var saving by remember { mutableStateOf(false) }

    LaunchedEffect(entry?.tags) {
        entry?.tags?.let { if (it.isNotBlank()) { try {
            val list = kotlinx.serialization.json.Json.decodeFromString<List<String>>(it); tags = list.joinToString(", ")
        } catch (_: Exception) {} } }
    }

    if (entry == null) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("日记不存在", color = AppColors.TextSecondary) }; return }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("编辑日记") },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回") } },
                actions = { TextButton(onClick = {
                    saving = true; scope.launch {
                        repository.updateEntry(entry!!.copy(title = title, content = content, mood = mood,
                            tags = if (tags.isBlank()) null else """["${tags.split(",").map { it.trim() }.joinToString("\",\"")}"]""",
                            locationName = locationName.ifBlank { null },
                            status = if (content.isNotBlank()) "published" else "draft"))
                        saving = false; Toast.makeText(context, "已保存", Toast.LENGTH_SHORT).show(); navController.popBackStack()
                    }
                }) { if (saving) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Icon(Icons.Default.Check, contentDescription = "保存") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface))
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState())) {
            OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("标题") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = locationName, onValueChange = { locationName = it }, label = { Text("地点") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("心情:", fontSize = 14.sp, color = AppColors.TextSecondary, modifier = Modifier.align(Alignment.CenterVertically))
                Mood.options.forEach { (emoji, _) -> TextButton(onClick = { mood = if (mood == emoji) null else emoji }) { Text(emoji, fontSize = 22.sp) } }
            }
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = tags, onValueChange = { tags = it }, label = { Text("标签（逗号分隔）") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = content, onValueChange = { content = it }, label = { Text("内容（支持 Markdown）") },
                modifier = Modifier.fillMaxWidth().height(300.dp),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
        }
    }
}
