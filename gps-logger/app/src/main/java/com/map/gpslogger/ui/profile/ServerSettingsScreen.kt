package com.map.gpslogger.ui.profile

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.ui.theme.AppColors
import com.map.gpslogger.util.getServerUrl
import com.map.gpslogger.util.setServerUrl

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerSettingsScreen(navController: NavController) {
    val context = LocalContext.current
    var serverUrl by remember { mutableStateOf(getServerUrl(context)) }
    var syncStatus by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("服务器设置") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
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
            Text("服务器地址", fontSize = 14.sp, color = AppColors.TextSecondary)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = serverUrl,
                onValueChange = { serverUrl = it },
                label = { Text("URL") },
                placeholder = { Text("http://192.168.1.100:3000") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = AppColors.Border,
                    focusedBorderColor = AppColors.Primary,
                ),
            )
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = {
                    setServerUrl(context, serverUrl)
                    Toast.makeText(context, "已保存", Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = AppColors.Primary),
            ) {
                Text("保存")
            }

            if (syncStatus.isNotBlank()) {
                Spacer(Modifier.height(16.dp))
                Text(syncStatus, fontSize = 13.sp, color = AppColors.TextSecondary)
            }

            Spacer(Modifier.height(32.dp))
            HorizontalDivider(color = AppColors.Border)
            Spacer(Modifier.height(16.dp))

            Text("同步说明", fontSize = 14.sp, color = AppColors.TextSecondary)
            Spacer(Modifier.height(8.dp))
            Text(
                "• WiFi 环境下自动同步（每 15 分钟）\n" +
                "• 日记、足迹、旅行数据会自动上传\n" +
                "• GPS 轨迹保持原有上传机制\n" +
                "• 同步失败不影响本地数据",
                fontSize = 13.sp,
                color = AppColors.TextSecondary,
                lineHeight = 20.sp,
            )
        }
    }
}
