package com.map.gpslogger.ui.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Diary : Screen("diary")
    object DiaryCreate : Screen("diary/create?notebookId={notebookId}") {
        fun createRoute(notebookId: String = "default") = "diary/create?notebookId=$notebookId"
    }
    object Notebooks : Screen("diary/notebooks")
    object DiaryDetail : Screen("diary/{id}") {
        fun createRoute(id: String) = "diary/$id"
    }
    object DiaryEdit : Screen("diary/{id}/edit") {
        fun createRoute(id: String) = "diary/$id/edit"
    }
    object DiaryStats : Screen("diary/stats")
    object DiarySearch : Screen("diary/search")
    object DiaryPlaces : Screen("diary/places")
    object DiaryTracks : Screen("diary/tracks")
    object TrackDetail : Screen("diary/tracks/{id}") {
        fun createRoute(id: String) = "diary/tracks/$id"
    }
    object DiaryTrips : Screen("diary/trips")
    object TripDetail : Screen("diary/trips/{id}") {
        fun createRoute(id: String) = "diary/trips/$id"
    }
    object TripCreate : Screen("diary/trip/create")
    object Achievements : Screen("diary/achievements")
    object AnnualReport : Screen("diary/report")
    object Photos : Screen("diary/photos")
    object Footprint : Screen("footprint")
    object FogMap : Screen("footprint/map")
    object Passport : Screen("passport")
    object Wishlist : Screen("footprint/wishlist")
    object Profile : Screen("profile")
    object Guide : Screen("guide")
    object GuideContent : Screen("guide/{id}") {
        fun createRoute(id: String) = "guide/$id"
    }
    object ServerSettings : Screen("settings/server")
}
