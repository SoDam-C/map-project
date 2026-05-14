package com.map.gpslogger.data

import androidx.room.ProvidedTypeConverter
import androidx.room.TypeConverter
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@ProvidedTypeConverter
class Converters {
    private val json = Json { ignoreUnknownKeys = true }

    @TypeConverter
    fun fromDoubleList(value: List<Double>): String = json.encodeToString(value)

    @TypeConverter
    fun toDoubleList(value: String): List<Double> =
        json.decodeFromString(value)

    @TypeConverter
    fun fromStringList(value: List<String>): String = json.encodeToString(value)

    @TypeConverter
    fun toStringList(value: String): List<String> =
        if (value.isBlank()) emptyList() else json.decodeFromString(value)

    @TypeConverter
    fun fromPhotoRefList(value: List<PhotoRef>): String = json.encodeToString(value)

    @TypeConverter
    fun toPhotoRefList(value: String): List<PhotoRef> =
        if (value.isBlank()) emptyList() else json.decodeFromString(value)
}

@kotlinx.serialization.Serializable
data class PhotoRef(
    val id: String = "",
    val url: String = "",
    val caption: String? = null,
    val takenAt: String? = null,
)
