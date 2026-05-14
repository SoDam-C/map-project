package com.map.gpslogger.model

/**
 * Hardcoded Chinese province data (34 provinces) for offline use.
 * Data ported from web frontend adminRegions.ts.
 */
object AdminRegions {

    data class Province(
        val adcode: String,
        val name: String,
        val centerLat: Double,
        val centerLng: Double,
    )

    val provinces: List<Province> = listOf(
        Province("110000", "北京市", 39.905, 116.405),
        Province("120000", "天津市", 39.125, 117.19),
        Province("130000", "河北省", 38.03, 114.48),
        Province("140000", "山西省", 37.871, 112.549),
        Province("150000", "内蒙古自治区", 40.818, 111.670),
        Province("210000", "辽宁省", 41.796, 123.429),
        Province("220000", "吉林省", 43.887, 125.324),
        Province("230000", "黑龙江省", 45.757, 126.642),
        Province("310000", "上海市", 31.230, 121.473),
        Province("320000", "江苏省", 32.041, 118.767),
        Province("330000", "浙江省", 30.287, 120.153),
        Province("340000", "安徽省", 31.861, 117.283),
        Province("350000", "福建省", 26.075, 119.306),
        Province("360000", "江西省", 28.676, 115.892),
        Province("370000", "山东省", 36.675, 117.0),
        Province("410000", "河南省", 34.757, 113.665),
        Province("420000", "湖北省", 30.593, 114.305),
        Province("430000", "湖南省", 28.194, 112.982),
        Province("440000", "广东省", 23.125, 113.280),
        Province("450000", "广西壮族自治区", 22.824, 108.320),
        Province("460000", "海南省", 20.031, 110.331),
        Province("500000", "重庆市", 29.563, 106.551),
        Province("510000", "四川省", 30.572, 104.066),
        Province("520000", "贵州省", 26.578, 106.713),
        Province("530000", "云南省", 25.040, 102.712),
        Province("540000", "西藏自治区", 29.660, 91.132),
        Province("610000", "陕西省", 34.263, 108.940),
        Province("620000", "甘肃省", 36.061, 103.834),
        Province("630000", "青海省", 36.617, 101.778),
        Province("640000", "宁夏回族自治区", 38.466, 106.278),
        Province("650000", "新疆维吾尔自治区", 43.792, 87.617),
        Province("710000", "台湾省", 25.044, 121.509),
        Province("810000", "香港特别行政区", 22.319, 114.169),
        Province("820000", "澳门特别行政区", 22.201, 113.544),
    )

    fun getProvinceName(adcode: String): String? =
        provinces.find { it.adcode == adcode }?.name

    /** 通过最近中心点匹配省份（简单近似，适合省份级） */
    fun findNearestProvince(lat: Double, lng: Double): Province? {
        var nearest: Province? = null
        var minDist = Double.MAX_VALUE
        for (p in provinces) {
            val dLat = lat - p.centerLat
            val dLng = lng - p.centerLng
            val dist = dLat * dLat + dLng * dLng
            if (dist < minDist) {
                minDist = dist
                nearest = p
            }
        }
        return nearest
    }
}
