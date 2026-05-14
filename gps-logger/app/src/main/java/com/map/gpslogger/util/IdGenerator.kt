package com.map.gpslogger.util

import java.util.UUID

object IdGenerator {
    fun diaryId(): String = "diary-${System.currentTimeMillis()}-${randomId()}"
    fun tripId(): String = "trip-${System.currentTimeMillis()}-${randomId()}"
    fun placeId(): String = "place-${System.currentTimeMillis()}-${randomId()}"
    fun notebookId(): String = "nb-${System.currentTimeMillis()}-${randomId()}"
    fun photoId(): String = "photo-${System.currentTimeMillis()}-${randomId()}"

    private fun randomId(): String = UUID.randomUUID().toString().substring(0, 6)
}
