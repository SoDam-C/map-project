package com.map.gpslogger.util

/**
 * 定位参数配置
 */
object LocationConfig {
    /** 移动时定位间隔（毫秒） */
    const val INTERVAL_MOVING = 3_000L

    /** 静止时定位间隔（毫秒） */
    const val INTERVAL_STATIONARY = 30_000L

    /** 息屏时定位间隔（毫秒） */
    const val INTERVAL_SCREEN_OFF = 60_000L

    /** 判定移动的速度阈值（m/s） */
    const val SPEED_THRESHOLD = 0.5f

    /** GPS 精度过滤阈值（米），超过此值的点丢弃 */
    const val ACCURACY_THRESHOLD = 50f

    /** 上传批次大小（每次最多上传的点数） */
    const val UPLOAD_BATCH_SIZE = 5000
}
