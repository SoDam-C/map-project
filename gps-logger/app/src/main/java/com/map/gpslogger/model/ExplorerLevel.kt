package com.map.gpslogger.model

data class ExplorerLevel(
    val id: String,
    val name: String,
    val emoji: String,
    val minPercent: Int,
) {
    companion object {
        val LEVELS = listOf(
            ExplorerLevel("novice",       "新手探索者", "🌱", 0),
            ExplorerLevel("beginner",     "初级旅行者", "🗺️", 5),
            ExplorerLevel("intermediate", "资深旅行家", "🧳", 15),
            ExplorerLevel("advanced",     "环球探险家", "✈️", 30),
            ExplorerLevel("expert",       "世界征服者", "🌍", 50),
            ExplorerLevel("master",       "传奇旅行家", "👑", 75),
            ExplorerLevel("legend",       "全知全能",   "💎", 95),
        )

        fun calculate(percent: Int): ExplorerLevel {
            for (i in LEVELS.indices.reversed()) {
                if (percent >= LEVELS[i].minPercent) return LEVELS[i]
            }
            return LEVELS[0]
        }

        fun next(current: ExplorerLevel): ExplorerLevel? {
            val idx = LEVELS.indexOf(current)
            return if (idx in 0 until LEVELS.lastIndex) LEVELS[idx + 1] else null
        }

        fun progress(percent: Int): Int {
            val level = calculate(percent)
            val nxt = next(level) ?: return 100
            val range = nxt.minPercent - level.minPercent
            val done = percent - level.minPercent
            return if (range > 0) (done * 100 / range).coerceIn(0, 100) else 100
        }
    }
}
