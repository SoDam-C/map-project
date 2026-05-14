package com.map.gpslogger.ui.guide

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.map.gpslogger.model.GuideNode
import com.map.gpslogger.model.GuideTree
import com.map.gpslogger.ui.navigation.Screen
import com.map.gpslogger.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuideScreen(navController: NavController) {
    val tree = remember { GuideTree.root }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("📖 使用指南") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Surface),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            items(tree.children, key = { it.id }) { node ->
                GuideTreeNode(node = node, navController = navController, depth = 0)
            }
        }
    }
}

@Composable
private fun GuideTreeNode(node: GuideNode, navController: NavController, depth: Int) {
    val hasChildren = node.children.isNotEmpty()
    val isLeaf = node.sections.isNotEmpty()
    var expanded by remember { mutableStateOf(false) }

    val contentColor = if (isLeaf) AppColors.TextPrimary else AppColors.TextPrimary

    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable {
                    if (isLeaf) {
                        navController.navigate(Screen.GuideContent.createRoute(node.id))
                    } else if (hasChildren) {
                        expanded = !expanded
                    }
                }
                .padding(vertical = 10.dp, horizontal = (depth * 16).dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(node.icon, fontSize = 18.sp)
            Spacer(Modifier.width(10.dp))
            Text(
                node.title,
                fontSize = if (depth == 0) 16.sp else 15.sp,
                fontWeight = if (depth == 0) FontWeight.Bold else FontWeight.Medium,
                color = contentColor,
                modifier = Modifier.weight(1f),
            )
            if (hasChildren) {
                Icon(
                    if (expanded) Icons.Default.ExpandMore else Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = AppColors.TextSecondary,
                    modifier = Modifier.size(20.dp),
                )
            } else if (isLeaf) {
                Text("›", fontSize = 18.sp, color = AppColors.TextSecondary)
            }
        }

        // 子节点
        if (hasChildren && expanded) {
            Column {
                node.children.forEach { child ->
                    GuideTreeNode(node = child, navController = navController, depth = depth + 1)
                }
            }
        }
    }
}
