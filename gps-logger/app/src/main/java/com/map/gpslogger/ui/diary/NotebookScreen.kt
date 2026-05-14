package com.map.gpslogger.ui.diary

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.data.NotebookEntity
import com.map.gpslogger.repo.NotebookRepository
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotebookScreen(navController: NavController) {
    val context = LocalContext.current
    val repo = remember { NotebookRepository() }
    val scope = rememberCoroutineScope()

    var activeNotebooks by remember { mutableStateOf<List<NotebookEntity>>(emptyList()) }
    var archivedNotebooks by remember { mutableStateOf<List<NotebookEntity>>(emptyList()) }
    var showCreateDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        repo.getActive().collect { activeNotebooks = it }
        repo.getArchived().collect { archivedNotebooks = it }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("笔记本") },
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
                onClick = { showCreateDialog = true },
                containerColor = AppColors.Primary,
            ) {
                Icon(Icons.Default.Add, contentDescription = "新建笔记本", tint = AppColors.OnPrimary)
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (activeNotebooks.isEmpty()) {
                Text("暂无笔记本", color = AppColors.TextSecondary, modifier = Modifier.padding(vertical = 24.dp))
            } else {
                Text("活跃", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = AppColors.TextSecondary)
                Spacer(Modifier.height(4.dp))
                activeNotebooks.forEach { nb ->
                    NotebookCard(
                        notebook = nb,
                        isDefault = nb.isDefault,
                        onArchive = { scope.launch { repo.archiveNotebook(nb.id); Toast.makeText(context, "已归档", Toast.LENGTH_SHORT).show() } },
                    )
                }
            }

            if (archivedNotebooks.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = AppColors.Border)
                Spacer(Modifier.height(8.dp))
                Text("已归档", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = AppColors.TextSecondary)
                Spacer(Modifier.height(4.dp))
                archivedNotebooks.forEach { nb ->
                    NotebookCard(
                        notebook = nb,
                        isDefault = false,
                        onRestore = { scope.launch { repo.unarchiveNotebook(nb.id); Toast.makeText(context, "已恢复", Toast.LENGTH_SHORT).show() } },
                    )
                }
            }

            Spacer(Modifier.height(32.dp))
        }

        if (showCreateDialog) {
            CreateNotebookDialog(onDismiss = { showCreateDialog = false }, onConfirm = { title, icon, type ->
                scope.launch {
                    repo.createNotebook(title, icon, type)
                    showCreateDialog = false
                    Toast.makeText(context, "已创建", Toast.LENGTH_SHORT).show()
                }
            })
        }
    }
}

@Composable
private fun NotebookCard(
    notebook: NotebookEntity,
    isDefault: Boolean,
    onArchive: (() -> Unit)? = null,
    onRestore: (() -> Unit)? = null,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = AppColors.CardBackground),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(notebook.icon, fontSize = 24.sp)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(notebook.title, fontWeight = FontWeight.Medium, fontSize = 15.sp)
                Row {
                    Text(notebook.type, fontSize = 11.sp, color = AppColors.TextSecondary)
                    if (isDefault) {
                        Spacer(Modifier.width(8.dp))
                        Text("默认", fontSize = 11.sp, color = AppColors.Primary)
                    }
                    notebook.startDate?.let { if (it.isNotBlank()) {
                        Spacer(Modifier.width(8.dp))
                        Text("$it ~", fontSize = 11.sp, color = AppColors.TextSecondary)
                    }}
                }
            }
            if (onRestore != null) {
                TextButton(onClick = onRestore) { Text("恢复", fontSize = 12.sp) }
            } else if (onArchive != null && !isDefault) {
                TextButton(onClick = onArchive) { Text("归档", fontSize = 12.sp) }
            }
        }
    }
}

@Composable
private fun CreateNotebookDialog(onDismiss: () -> Unit, onConfirm: (title: String, icon: String, type: String) -> Unit) {
    var title by remember { mutableStateOf("") }
    var selectedIcon by remember { mutableStateOf("📓") }
    var selectedType by remember { mutableStateOf("custom") }

    val icons = listOf("📓", "🧳", "🏃", "📖", "💼", "🎨", "🎵", "🍳", "🎓", "💊", "🎮", "🌱", "📷", "✈️", "🏠", "❤️")
    val types = listOf("custom" to "自定义", "travel" to "旅行", "sport" to "运动", "growth" to "成长", "work" to "工作", "general" to "日常")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("新建笔记本") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = title, onValueChange = { title = it },
                    label = { Text("名称") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = AppColors.Border, focusedBorderColor = AppColors.Primary),
                )
                Text("图标", fontSize = 13.sp, color = AppColors.TextSecondary)
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    icons.forEach { icon ->
                        TextButton(
                            onClick = { selectedIcon = icon },
                            modifier = Modifier.size(40.dp).padding(0.dp),
                            colors = ButtonDefaults.textButtonColors(
                                contentColor = if (selectedIcon == icon) AppColors.Primary else AppColors.TextSecondary,
                            ),
                        ) { Text(icon, fontSize = 18.sp) }
                    }
                }
                Text("类型", fontSize = 13.sp, color = AppColors.TextSecondary)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    types.forEach { (t, label) ->
                        FilterChip(selected = selectedType == t, onClick = { selectedType = t },
                            label = { Text(label, fontSize = 12.sp) })
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                if (title.isBlank()) return@TextButton
                onConfirm(title, selectedIcon, selectedType)
            }) { Text("创建", color = AppColors.Primary) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("取消") } },
    )
}
