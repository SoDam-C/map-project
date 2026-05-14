package com.map.gpslogger.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.map.gpslogger.ui.diary.AchievementsScreen
import com.map.gpslogger.ui.diary.NotebookScreen
import com.map.gpslogger.ui.diary.AnnualReportScreen
import com.map.gpslogger.ui.diary.DiaryCreateScreen
import com.map.gpslogger.ui.diary.DiaryDetailScreen
import com.map.gpslogger.ui.diary.DiaryEditScreen
import com.map.gpslogger.ui.diary.DiaryScreen
import com.map.gpslogger.ui.diary.DiarySearchScreen
import com.map.gpslogger.ui.diary.DiaryStatsScreen
import com.map.gpslogger.ui.diary.PhotosScreen
import com.map.gpslogger.ui.diary.PlacesScreen
import com.map.gpslogger.ui.diary.TrackDetailScreen
import com.map.gpslogger.ui.diary.TrackListScreen
import com.map.gpslogger.ui.diary.TripCreateScreen
import com.map.gpslogger.ui.diary.TripDetailScreen
import com.map.gpslogger.ui.diary.TripListScreen
import com.map.gpslogger.ui.footprint.FootprintScreen
import com.map.gpslogger.ui.footprint.WishlistScreen
import com.map.gpslogger.ui.footprint.FogMapScreen
import com.map.gpslogger.ui.passport.PassportScreen
import com.map.gpslogger.ui.guide.GuideContentScreen
import com.map.gpslogger.ui.guide.GuideScreen
import com.map.gpslogger.ui.home.HomeScreen
import com.map.gpslogger.ui.profile.ProfileScreen
import com.map.gpslogger.ui.profile.ServerSettingsScreen

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

val bottomNavItems = listOf(
    BottomNavItem(Screen.FogMap.route, "地图", Icons.Default.Explore),
    BottomNavItem(Screen.Diary.route, "日记", Icons.Default.Book),
    BottomNavItem(Screen.Footprint.route, "足迹", Icons.Default.Map),
    BottomNavItem(Screen.Profile.route, "我的", Icons.Default.Person),
)

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                bottomNavItems.forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label) },
                        selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                    )
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.FogMap.route,
            modifier = Modifier.padding(innerPadding),
        ) {
            // Bottom nav destinations
            composable(Screen.Home.route) { HomeScreen(navController) }
            composable(Screen.Diary.route) { DiaryScreen(navController) }
            composable(Screen.Footprint.route) { FootprintScreen(navController) }
            composable(Screen.Wishlist.route) { WishlistScreen(navController) }
            composable(Screen.FogMap.route) { FogMapScreen(navController) }
            composable(Screen.Passport.route) { PassportScreen(navController) }
            composable(Screen.Profile.route) { ProfileScreen(navController) }

            // Diary sub-screens
            composable(Screen.DiaryCreate.route) { backStackEntry ->
                val notebookId = backStackEntry.arguments?.getString("notebookId") ?: "default"
                DiaryCreateScreen(navController, notebookId)
            }
            composable(Screen.Notebooks.route) { NotebookScreen(navController) }
            composable(Screen.DiaryDetail.route) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                DiaryDetailScreen(navController, id)
            }
            composable(Screen.DiaryEdit.route) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                DiaryEditScreen(navController, id)
            }
            composable(Screen.DiaryStats.route) { DiaryStatsScreen(navController) }
            composable(Screen.DiarySearch.route) { DiarySearchScreen(navController) }
            composable(Screen.DiaryPlaces.route) { PlacesScreen(navController) }
            composable(Screen.DiaryTracks.route) { TrackListScreen(navController) }
            composable(Screen.TrackDetail.route) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                TrackDetailScreen(navController, id)
            }
            composable(Screen.DiaryTrips.route) { TripListScreen(navController) }
            composable(Screen.TripDetail.route) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                TripDetailScreen(navController, id)
            }
            composable(Screen.TripCreate.route) { TripCreateScreen(navController) }
            composable(Screen.Achievements.route) { AchievementsScreen(navController) }
            composable(Screen.AnnualReport.route) { AnnualReportScreen(navController) }
            composable(Screen.Photos.route) { PhotosScreen(navController) }

            // Profile sub-screens
            composable(Screen.ServerSettings.route) { ServerSettingsScreen(navController) }

            // Guide screens
            composable(Screen.Guide.route) { GuideScreen(navController) }
            composable(Screen.GuideContent.route) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                GuideContentScreen(navController, id)
            }
        }
    }
}
