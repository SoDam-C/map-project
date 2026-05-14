package com.map.gpslogger.ui.guide

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.model.GuideSection
import com.map.gpslogger.model.GuideTree
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuideContentScreen(navController: NavController, nodeId: String) {
    val tree = remember { GuideTree }
    val node = remember { tree.findById(nodeId) }
    val path = remember { tree.getPath(nodeId) }
    val allLeaves = remember { tree.getAllLeaves() }
    val currentIndex = remember { allLeaves.indexOfFirst { it.id == nodeId } }

    if (node == null || node.sections.isEmpty()) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("引导") },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
                )
            },
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("内容不存在", color = AppColors.TextSecondary)
            }
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("${node.icon} ${node.title}") },
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
                .padding(padding),
        ) {
            // 面包屑导航
            if (path.size > 1) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    path.forEachIndexed { index, breadcrumb ->
                        if (index > 0) {
                            Text(" › ", color = AppColors.TextSecondary, fontSize = 13.sp)
                        }
                        if (index == path.size - 1) {
                            Text(
                                "${breadcrumb.icon} ${breadcrumb.title}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = AppColors.Primary,
                            )
                        } else {
                            Text(
                                "${breadcrumb.icon} ${breadcrumb.title}",
                                fontSize = 13.sp,
                                color = AppColors.TextSecondary,
                                textDecoration = TextDecoration.Underline,
                                modifier = Modifier.clickable {
                                    navController.navigate(Screen.GuideContent.createRoute(breadcrumb.id))
                                },
                            )
                        }
                    }
                }
                HorizontalDivider(color = AppColors.Border)
            }

            // 内容区
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                node.sections.forEach { section ->
                    GuideSectionBlock(section = section)
                }
            }

            // 上一篇/下一篇导航
            if (currentIndex >= 0) {
                HorizontalDivider(color = AppColors.Border)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    if (currentIndex > 0) {
                        val prev = allLeaves[currentIndex - 1]
                        TextButton(onClick = {
                            navController.navigate(Screen.GuideContent.createRoute(prev.id)) {
                                popUpTo(Screen.Guide.route) { inclusive = true }
                            }
                        }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("${prev.icon} ${prev.title}", fontSize = 13.sp)
                        }
                    } else {
                        Spacer(Modifier.weight(1f))
                    }
                    if (currentIndex < allLeaves.size - 1) {
                        val next = allLeaves[currentIndex + 1]
                        TextButton(onClick = {
                            navController.navigate(Screen.GuideContent.createRoute(next.id)) {
                                popUpTo(Screen.Guide.route) { inclusive = true }
                            }
                        }) {
                            Text("${next.icon} ${next.title}", fontSize = 13.sp)
                            Spacer(Modifier.width(4.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                        }
                    } else {
                        Spacer(Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun GuideSectionBlock(section: GuideSection) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(section.heading, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = AppColors.Primary)
        // 简单渲染：\n 换行，**粗体**
        val paragraphs = section.body.split("\n\n")
        paragraphs.forEach { paragraph ->
            val lines = paragraph.split("\n")
            lines.forEach { line ->
                if (line.startsWith("• ")) {
                    Row {
                        Spacer(Modifier.width(8.dp))
                        Text("•", fontSize = 14.sp, color = AppColors.TextSecondary)
                        Spacer(Modifier.width(6.dp))
                        Text(
                            line.removePrefix("• "),
                            fontSize = 14.sp,
                            lineHeight = 21.sp,
                            color = AppColors.TextSecondary,
                        )
                    }
                } else {
                    Text(
                        line,
                        fontSize = 14.sp,
                        lineHeight = 21.sp,
                        color = AppColors.TextSecondary,
                    )
                }
            }
            if (paragraph != paragraphs.last()) {
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}
