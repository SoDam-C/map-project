package com.map.gpslogger.model

enum class PlaceCategory(val id: String, val label: String, val icon: String) {
    FOOD("food", "美食", "🍜"),
    SCENIC("scenic", "景点", "🏞️"),
    HOTEL("hotel", "住宿", "🏨"),
    SHOPPING("shopping", "购物", "🛍️"),
    TRANSPORT("transport", "交通", "🚄"),
    OTHER("other", "其他", "📍");

    companion object {
        fun fromId(id: String): PlaceCategory =
            entries.firstOrNull { it.id == id } ?: OTHER
    }
}
