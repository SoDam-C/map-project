package com.map.gpslogger.model

object Mood {
    val options = listOf(
        "😊" to "开心",
        "😐" to "平静",
        "😢" to "难过",
        "😤" to "生气",
        "🤔" to "思考",
        "😴" to "疲惫",
        "🥰" to "幸福",
        "😤" to "焦虑",
        "🎉" to "兴奋",
        "🥱" to "无聊",
        "😰" to "紧张",
        "🤩" to "惊喜",
    )

    val emojis = options.map { it.first }
}
