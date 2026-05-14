package com.map.gpslogger.ui.diary

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.NotebookEntity
import com.map.gpslogger.model.Mood
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.repo.NotebookRepository
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiaryCreateScreen(navController: NavController, initialNotebookId: String? = null) {
    val context = LocalContext.current
    val repository = remember { DiaryRepository() }
    val notebookRepo = remember { NotebookRepository() }
    val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())

    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var mood by remember { mutableStateOf<String?>(null) }
    var tags by remember { mutableStateOf("") }
    var locationName by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("memory_entry") }
    var showMoodPicker by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var selectedNotebookId by remember { mutableStateOf(initialNotebookId ?: "default") }
    var notebooks by remember { mutableStateOf<List<NotebookEntity>>(emptyList()) }

    val scope = rememberCoroutineScope()
    var savedEntryId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        notebookRepo.ensureDefault()
        notebookRepo.getActive().collect { notebooks = it }
    }

    LaunchedEffect(title, content, mood, tags, locationName, selectedNotebookId) {
        if (savedEntryId == null) return@LaunchedEffect
        delay(800)
        savedEntryId?.let { id ->
            val entry = repository.getEntry(id) ?: return@LaunchedEffect
            repository.updateEntry(entry.copy(
                title = title, content = content, mood = mood,
                tags = if (tags.isBlank()) null else """["${tags.split(",").map { it.trim() }.joinToString("\",\"")}"]""",
                locationName = locationName.ifBlank { null },
                notebookId = selectedNotebookId,
                status = if (content.isNotBlank()) "published" else "draft",
            ))
        }
    }

    LaunchedEffect(Unit) {
        val id = repository.createEntry(type = type, date = today, title = title, notebookId = selectedNotebookId)
        savedEntryId = id
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("新建日记") },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回") } },
                actions = { TextButton(onClick = {
                    saving = true; scope.launch {
                        savedEntryId?.let { id ->
                            val entry = repository.getEntry(id) ?: return@launch
                            repository.updateEntry(entry.copy(
                                title = title.ifBlank { today }, content = content, mood = mood,
                                tags = if (tags.isBlank()) null else """["${tags.split(",").map { it.trim() }.joinToString("\",\"")}"]""",
                                locationName = locationName.ifBlank { null },
                                notebookId = selectedNotebookId,
                                status = if (content.isNotBlank()) "published" else "draft",
                            ))
                        }
                        saving = false; Toast.makeText(context, "已保存", Toast.LENGTH_SHORT).show()
                        navController.popBackStack()
                    }
                }) { if (saving) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Icon(Icons.Default.Check, contentDescription = "保存") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface))
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState())) {
            // 笔记本选择
            if (notebooks.isNotEmpty()) {
                Text("笔记本", fontSize = 13.sp, color = AppColors.TextSecondary)
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    notebooks.forEach { nb ->
                        val selected = selectedNotebookId == nb.id
                        FilterChip(
                            selected = selected,
                            onClick = { selectedNotebookId = nb.id },
                            label = { Text("${nb.icon} ${nb.title}", fontSize = 12.sp) },
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("memory_entry" to "记忆", "track_entry" to "轨迹", "note_entry" to "笔记").forEach { (t, label) ->
                    FilterChip(selected = type == t, onClick = { type = t }, label = { Text(label, fontSize = 12.sp) })
                }
            }
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("标题") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = locationName, onValueChange = { locationName = it }, label = { Text("地点") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = mood ?: "", onValueChange = {}, label = { Text("心情") }, readOnly = true,
                modifier = Modifier.fillMaxWidth().clickable { showMoodPicker = !showMoodPicker },
                interactionSource = remember { MutableInteractionSource() },
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            if (showMoodPicker) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Mood.options.forEach { (emoji, label) ->
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            TextButton(onClick = { mood = emoji; showMoodPicker = false }) { Text(emoji, fontSize = 24.sp) }
                            Text(label, fontSize = 10.sp, color = AppColors.TextSecondary)
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = tags, onValueChange = { tags = it }, label = { Text("标签（逗号分隔）") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = content, onValueChange = { content = it }, label = { Text("内容（支持 Markdown）") },
                modifier = Modifier.fillMaxWidth().height(300.dp),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary))
            Spacer(Modifier.height(16.dp))
            Text("自动保存中...", color = AppColors.TextSecondary, fontSize = 12.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
        }
    }
}
