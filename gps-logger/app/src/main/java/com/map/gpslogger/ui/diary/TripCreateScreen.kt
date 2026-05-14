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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.map.gpslogger.repo.DiaryRepository
import com.map.gpslogger.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TripCreateScreen(navController: NavController, editId: String? = null) {
    val context = LocalContext.current
    val repository = remember { DiaryRepository() }
    val scope = rememberCoroutineScope()

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf("") }
    var endDate by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }

    val isEdit = editId != null
    val screenTitle = if (isEdit) "编辑旅行" else "新建旅行"

    // Load existing trip if editing
    LaunchedEffect(editId) {
        editId?.let {
            repository.getTrip(it)?.let { trip ->
                title = trip.title
                description = trip.description ?: ""
                startDate = trip.startDate
                endDate = trip.endDate
            }
        }
    }

    val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(screenTitle) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    TextButton(onClick = {
                        if (title.isBlank()) {
                            Toast.makeText(context, "请输入旅行标题", Toast.LENGTH_SHORT).show()
                            return@TextButton
                        }
                        if (startDate.isBlank() || endDate.isBlank()) {
                            Toast.makeText(context, "请选择日期", Toast.LENGTH_SHORT).show()
                            return@TextButton
                        }
                        saving = true
                        scope.launch {
                            if (isEdit && editId != null) {
                                val trip = repository.getTrip(editId) ?: return@launch
                                repository.updateTrip(trip.copy(
                                    title = title,
                                    description = description.ifBlank { null },
                                    startDate = startDate,
                                    endDate = endDate,
                                ))
                            } else {
                                repository.createTrip(
                                    title = title,
                                    startDate = startDate.ifBlank { today },
                                    endDate = endDate.ifBlank { today },
                                )
                            }
                            saving = false
                            Toast.makeText(context, "已保存", Toast.LENGTH_SHORT).show()
                            navController.popBackStack()
                        }
                    }) {
                        if (saving) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Check, contentDescription = "保存")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("旅行标题") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = AppColors.Border,
                    focusedBorderColor = AppColors.Primary,
                ),
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = startDate,
                onValueChange = { startDate = it },
                label = { Text("开始日期 (YYYY-MM-DD)") },
                placeholder = { Text(today) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = AppColors.Border,
                    focusedBorderColor = AppColors.Primary,
                ),
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = endDate,
                onValueChange = { endDate = it },
                label = { Text("结束日期 (YYYY-MM-DD)") },
                placeholder = { Text(today) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = AppColors.Border,
                    focusedBorderColor = AppColors.Primary,
                ),
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("描述（可选）") },
                modifier = Modifier.fillMaxWidth().height(200.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = AppColors.Border,
                    focusedBorderColor = AppColors.Primary,
                ),
            )
        }
    }
}
