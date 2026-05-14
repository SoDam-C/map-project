package com.map.gpslogger.model

data class Achievement(
    val id: String,
    val title: String,
    val description: String,
    val category: String,    // diary|footprint|travel|photo|track
    val icon: String,
    val rarity: String,      // common|rare|epic|legendary
    val target: Int? = null,
    val unit: String? = null,
    val check: (AchievementStats) -> Boolean,
)

data class AchievementStats(
    val totalEntries: Int = 0,
    val publishedEntries: Int = 0,
    val totalPhotos: Int = 0,
    val totalTrips: Int = 0,
    val provinceCount: Int = 0,
    val cityCount: Int = 0,
    val locationCount: Int = 0,
    val currentStreak: Int = 0,
    val longestStreak: Int = 0,
    val trackEntries: Int = 0,
    val tagCount: Int = 0,
    val withPhotosEntries: Int = 0,
    val totalDistanceKm: Double = 0.0,
    val exploredKm2: Double = 0.0,
    val trackingDays: Int = 0,
)

object AchievementRarity {
    const val COMMON = "common"
    const val RARE = "rare"
    const val EPIC = "epic"
    const val LEGENDARY = "legendary"

    val LABELS = mapOf(
        COMMON to "普通",
        RARE to "稀有",
        EPIC to "史诗",
        LEGENDARY to "传说",
    )

    fun getLabel(rarity: String): String = LABELS[rarity] ?: rarity
}

object Achievements {
    val all: List<Achievement> = listOf(
        // 日记类
        Achievement("diary_first", "第一篇日记", "写下你的第一篇日记", "diary", "📝", AchievementRarity.COMMON, check = { it.totalEntries >= 1 }),
        Achievement("diary_10", "记录达人", "写 10 篇日记", "diary", "📖", AchievementRarity.RARE, 10, "篇", { it.totalEntries >= 10 }),
        Achievement("diary_50", "高产作家", "写 50 篇日记", "diary", "📚", AchievementRarity.EPIC, 50, "篇", { it.totalEntries >= 50 }),
        Achievement("diary_100", "百篇大关", "写 100 篇日记", "diary", "🏆", AchievementRarity.LEGENDARY, 100, "篇", { it.totalEntries >= 100 }),
        Achievement("streak_3", "三天连续", "连续写 3 天", "diary", "🔥", AchievementRarity.RARE, check = { it.currentStreak >= 3 || it.longestStreak >= 3 }),
        Achievement("streak_7", "一周坚持", "连续写 7 天", "diary", "🔥", AchievementRarity.RARE, check = { it.currentStreak >= 7 || it.longestStreak >= 7 }),
        Achievement("streak_30", "月度挑战", "连续写 30 天", "diary", "🔥", AchievementRarity.EPIC, check = { it.currentStreak >= 30 || it.longestStreak >= 30 }),
        Achievement("photo_entry", "图文并茂", "写一篇带照片的日记", "diary", "📷", AchievementRarity.RARE, check = { it.withPhotosEntries >= 1 }),
        Achievement("tag_5", "标签达人", "使用 5 个不同标签", "diary", "🏷️", AchievementRarity.RARE, 5, "个", { it.tagCount >= 5 }),

        // 足迹类
        Achievement("fp_first", "第一步", "点亮第一个足迹", "footprint", "👣", AchievementRarity.COMMON, check = { it.provinceCount >= 1 }),
        Achievement("fp_5", "探索者", "点亮 5 个省份", "footprint", "🗺️", AchievementRarity.RARE, 5, "省", { it.provinceCount >= 5 }),
        Achievement("fp_10", "旅行家", "点亮 10 个省份", "footprint", "✈️", AchievementRarity.EPIC, 10, "省", { it.provinceCount >= 10 }),
        Achievement("fp_20", "走遍中国", "点亮 20 个省份", "footprint", "🌏", AchievementRarity.EPIC, 20, "省", { it.provinceCount >= 20 }),
        Achievement("fp_34", "全境通关", "点亮全部 34 个省级行政区", "footprint", "👑", AchievementRarity.LEGENDARY, 34, "省", { it.provinceCount >= 34 }),

        // 旅行类
        Achievement("trip_first", "第一次旅行", "创建第一个旅行", "travel", "🧳", AchievementRarity.COMMON, check = { it.totalTrips >= 1 }),
        Achievement("trip_5", "旅行达人", "完成 5 次旅行", "travel", "🚂", AchievementRarity.EPIC, 5, "次", { it.totalTrips >= 5 }),
        Achievement("trip_10", "环球旅行家", "完成 10 次旅行", "travel", "🌍", AchievementRarity.LEGENDARY, 10, "次", { it.totalTrips >= 10 }),

        // 照片类
        Achievement("photo_10", "摄影入门", "记录 10 张照片", "photo", "📸", AchievementRarity.RARE, 10, "张", { it.totalPhotos >= 10 }),
        Achievement("photo_50", "摄影达人", "记录 50 张照片", "photo", "🎞️", AchievementRarity.EPIC, 50, "张", { it.totalPhotos >= 50 }),
        Achievement("photo_100", "百图纪念", "记录 100 张照片", "photo", "🖼️", AchievementRarity.LEGENDARY, 100, "张", { it.totalPhotos >= 100 }),

        // 轨迹类
        Achievement("track_entry", "轨迹日记", "写一篇关联 GPS 轨迹的日记", "track", "🛤️", AchievementRarity.COMMON, check = { it.trackEntries >= 1 }),
        Achievement("track_10", "轨迹达人", "写 10 篇轨迹日记", "track", "📍", AchievementRarity.RARE, 10, "篇", { it.trackEntries >= 10 }),

        // 里程类
        Achievement("dist_10", "初出茅庐", "累计行程 10 公里", "track", "🚶", AchievementRarity.COMMON, 10, "km", { it.totalDistanceKm >= 10 }),
        Achievement("dist_100", "百里之行", "累计行程 100 公里", "track", "🚗", AchievementRarity.RARE, 100, "km", { it.totalDistanceKm >= 100 }),
        Achievement("dist_1000", "千里之行", "累计行程 1000 公里", "track", "🚄", AchievementRarity.EPIC, 1000, "km", { it.totalDistanceKm >= 1000 }),
        Achievement("dist_10000", "万里之行", "累计行程 10000 公里", "track", "✈️", AchievementRarity.LEGENDARY, 10000, "km", { it.totalDistanceKm >= 10000 }),

        // 探索面积类
        Achievement("area_1", "立足之地", "探索 1 平方公里", "track", "📐", AchievementRarity.COMMON, 1, "km²", { it.exploredKm2 >= 1 }),
        Achievement("area_10", "探索者", "探索 10 平方公里", "track", "🗺️", AchievementRarity.RARE, 10, "km²", { it.exploredKm2 >= 10 }),
        Achievement("area_100", "大探索家", "探索 100 平方公里", "track", "🌏", AchievementRarity.EPIC, 100, "km²", { it.exploredKm2 >= 100 }),
        Achievement("area_1000", "领土开拓者", "探索 1000 平方公里", "track", "👑", AchievementRarity.LEGENDARY, 1000, "km²", { it.exploredKm2 >= 1000 }),

        // 记录天数类
        Achievement("days_7", "一周打卡", "累计记录 7 天", "track", "📅", AchievementRarity.COMMON, 7, "天", { it.trackingDays >= 7 }),
        Achievement("days_30", "月度坚持", "累计记录 30 天", "track", "📆", AchievementRarity.RARE, 30, "天", { it.trackingDays >= 30 }),
        Achievement("days_100", "百日征途", "累计记录 100 天", "track", "🗓️", AchievementRarity.EPIC, 100, "天", { it.trackingDays >= 100 }),
        Achievement("days_365", "年度探索者", "累计记录 365 天", "track", "🏅", AchievementRarity.LEGENDARY, 365, "天", { it.trackingDays >= 365 }),
    )

    fun getUnlocked(stats: AchievementStats): List<Achievement> =
        all.filter { it.check(stats) }

    fun getByCategory(): Map<String, List<Achievement>> =
        all.groupBy { it.category }

    fun getByRarity(): Map<String, List<Achievement>> =
        all.groupBy { it.rarity }
}
