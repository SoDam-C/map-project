package com.map.gpslogger.ui.passport

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.ExperimentalLayoutApi

private data class MilestoneCheck(
    val def: MilestoneDef,
    val reached: Boolean,
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MilestoneStampPage(
    totalDistanceKm: Double,
    exploredKm2: Double,
    trackingDays: Int,
    provinceCount: Int,
) {
    val milestones = buildMilestones(totalDistanceKm, exploredKm2, trackingDays, provinceCount)
    val reachedCount = milestones.count { it.reached }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = PassportColors.PageBackground),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "里程碑",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = PassportColors.TextOnPaper,
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "$reachedCount/${milestones.size}",
                    fontSize = 12.sp,
                    color = PassportColors.TextOnPaperSecondary,
                    modifier = Modifier
                        .background(PassportColors.PageBorder.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                )
            }

            Spacer(Modifier.height(16.dp))

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                milestones.forEach { m ->
                    MilestoneStamp(milestone = m.def, isReached = m.reached)
                }
            }
        }
    }
}

private fun buildMilestones(
    distKm: Double, areaKm2: Double, days: Int, provinces: Int
): List<MilestoneCheck> {
    val now = System.currentTimeMillis()
    return listOf(
        // Distance milestones
        MilestoneCheck(MilestoneDef("dist_10", "10公里", "🚶", "10km"), distKm >= 10),
        MilestoneCheck(MilestoneDef("dist_100", "百里", "🚗", "100km"), distKm >= 100),
        MilestoneCheck(MilestoneDef("dist_1000", "千里", "🚄", "1k km"), distKm >= 1000),
        MilestoneCheck(MilestoneDef("dist_10000", "万里", "✈️", "10k km"), distKm >= 10000),
        // Area milestones
        MilestoneCheck(MilestoneDef("area_1", "立足", "📐", "1km²"), areaKm2 >= 1),
        MilestoneCheck(MilestoneDef("area_10", "探索", "🗺️", "10km²"), areaKm2 >= 10),
        MilestoneCheck(MilestoneDef("area_100", "开拓", "🌏", "100km²"), areaKm2 >= 100),
        MilestoneCheck(MilestoneDef("area_1000", "征服", "👑", "1k km²"), areaKm2 >= 1000),
        // Province milestones
        MilestoneCheck(MilestoneDef("prov_1", "第一步", "👣", "1省"), provinces >= 1),
        MilestoneCheck(MilestoneDef("prov_5", "五省", "🗺️", "5省"), provinces >= 5),
        MilestoneCheck(MilestoneDef("prov_10", "十省", "🧳", "10省"), provinces >= 10),
        MilestoneCheck(MilestoneDef("prov_34", "全境", "👑", "34省"), provinces >= 34),
        // Days milestones
        MilestoneCheck(MilestoneDef("days_7", "一周", "📅", "7天"), days >= 7),
        MilestoneCheck(MilestoneDef("days_30", "一月", "📆", "30天"), days >= 30),
        MilestoneCheck(MilestoneDef("days_100", "百日", "🗓️", "100天"), days >= 100),
        MilestoneCheck(MilestoneDef("days_365", "一年", "🏅", "365天"), days >= 365),
    )
}
