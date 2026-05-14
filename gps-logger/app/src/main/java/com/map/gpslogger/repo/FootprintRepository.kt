package com.map.gpslogger.repo

import com.map.gpslogger.GpsLoggerApp
import com.map.gpslogger.data.FootprintDao
import com.map.gpslogger.data.FootprintEntity
import com.map.gpslogger.data.LevelCount
import com.map.gpslogger.model.AdminRegions
import com.map.gpslogger.util.IdGenerator
import kotlinx.coroutines.flow.Flow

class FootprintRepository {

    private val dao: FootprintDao get() = GpsLoggerApp.instance.database.footprintDao()

    fun getAll(): Flow<List<FootprintEntity>> = dao.getAll()

    suspend fun getByAdcode(adcode: String): FootprintEntity? = dao.getByAdcode(adcode)

    suspend fun isLit(adcode: String): Boolean = dao.isLit(adcode)

    suspend fun getByLevel(level: Int): List<FootprintEntity> = dao.getByLevel(level)

    suspend fun getCountByLevel(): List<LevelCount> = dao.getCountByLevel()

    suspend fun getCityCountForProvince(provincePrefix: String): Int =
        dao.getCityCountForProvince(provincePrefix)

    private suspend fun lightAncestors(adcode: String, name: String) {
        val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            .format(java.util.Date())
        // Province-level ancestor
        val provinceCode = adcode.take(2) + "0000"
        if (provinceCode != adcode && !dao.isLit(provinceCode)) {
            val provinceName = AdminRegions.getProvinceName(provinceCode) ?: provinceCode
            dao.insert(FootprintEntity(
                id = provinceCode, adcode = provinceCode, name = provinceName,
                level = 1, centerLat = 0.0, centerLng = 0.0,
                litAt = now, source = "ancestor", sourceId = null,
            ))
        }
        // City-level ancestor
        if (adcode.length >= 6 && adcode != provinceCode) {
            val cityCode = adcode.take(4) + "00"
            if (cityCode != adcode && !dao.isLit(cityCode)) {
                dao.insert(FootprintEntity(
                    id = cityCode, adcode = cityCode, name = cityCode,
                    level = 2, centerLat = 0.0, centerLng = 0.0,
                    litAt = now, source = "ancestor", sourceId = null,
                ))
            }
        }
    }

    suspend fun lightUp(adcode: String, name: String, level: Int, centerLat: Double, centerLng: Double, source: String = "manual") {
        if (!dao.isLit(adcode)) {
            val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
                .format(java.util.Date())
            dao.insert(FootprintEntity(
                id = adcode, adcode = adcode, name = name,
                level = level, centerLat = centerLat, centerLng = centerLng,
                litAt = now, source = source, sourceId = null,
            ))
            lightAncestors(adcode, name)
        }
    }

    suspend fun getUnsynced(): List<FootprintEntity> = dao.getUnsynced()

    suspend fun markSynced(id: String) = dao.markSynced(id)

    /** 计算总体探索百分比（省/市/区三级加权平均） */
    suspend fun getOverallPercentage(): Int {
        val levelCounts = getCountByLevel()
        val totalProvinces = 34
        val totalCities = 333
        val totalDistricts = 2844

        val provinces = levelCounts.find { it.level == 1 }?.count ?: 0
        val cities = levelCounts.find { it.level == 2 }?.count ?: 0
        val districts = levelCounts.find { it.level == 3 }?.count ?: 0

        val pctP = if (totalProvinces > 0) (provinces * 100) / totalProvinces else 0
        val pctC = if (totalCities > 0) (cities * 100) / totalCities else 0
        val pctD = if (totalDistricts > 0) (districts * 100) / totalDistricts else 0

        return (pctP + pctC + pctD) / 3
    }
}
