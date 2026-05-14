package com.map.gpslogger.ui.passport

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.map.gpslogger.model.ExplorerLevel

data class CoverData(
    val level: ExplorerLevel,
    val nextLevel: ExplorerLevel?,
    val levelProgress: Int,
    val overallPercent: Int,
    val provinceCount: Int,
    val totalDistanceKm: Double,
    val trackingDays: Int,
    val entryCount: Int,
    val mapLevel: Int,
)

@Composable
fun PassportCoverPage(data: CoverData) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        PassportColors.CoverStart,
                        PassportColors.CoverMid,
                        PassportColors.CoverEnd,
                    )
                ),
                RoundedCornerShape(16.dp),
            )
            .border(1.dp, PassportColors.Gold.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Decorative top line
            Text("— — — — — — — — —", color = PassportColors.Gold.copy(alpha = 0.3f), fontSize = 12.sp)

            Spacer(Modifier.height(16.dp))

            // Level circle
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(PassportColors.Gold.copy(alpha = 0.12f))
                    .border(2.dp, PassportColors.Gold, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(data.level.emoji, fontSize = 36.sp)
            }

            Spacer(Modifier.height(12.dp))

            // PASSPORT title
            Text(
                "PASSPORT",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = PassportColors.Gold,
                letterSpacing = 6.sp,
            )

            Spacer(Modifier.height(4.dp))

            // Level name
            Text(
                data.level.name,
                fontSize = 14.sp,
                color = Color(0xFFc9d1d9),
            )

            Spacer(Modifier.height(4.dp))
            Text(
                "LV ${data.mapLevel} · ${data.overallPercent}%",
                fontSize = 11.sp,
                color = Color(0xFF8b949e),
            )

            Spacer(Modifier.height(20.dp))

            // Stats row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                CoverStat("${data.provinceCount}/34", "省份")
                CoverStat(formatDist(data.totalDistanceKm), "里程")
                CoverStat("${data.trackingDays}", "天数")
                CoverStat("${data.entryCount}", "日记")
            }

            // Progress bar
            if (data.nextLevel != null) {
                Spacer(Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        "${data.level.emoji} ${data.level.name}",
                        fontSize = 10.sp,
                        color = Color(0xFF8b949e),
                    )
                    Text(
                        "${data.nextLevel.emoji} ${data.nextLevel.name}",
                        fontSize = 10.sp,
                        color = Color(0xFF8b949e),
                    )
                }
                Spacer(Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(5.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(Color(0xFF2d2d4e)),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(data.levelProgress / 100f)
                            .clip(RoundedCornerShape(2.dp))
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(PassportColors.Gold, Color(0xFF6366F1))
                                )
                            ),
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // Decorative bottom line
            Text("— — — — — — — — —", color = PassportColors.Gold.copy(alpha = 0.3f), fontSize = 12.sp)
        }
    }
}

@Composable
private fun CoverStat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 10.sp, color = Color(0xFF8b949e))
    }
}

private fun formatDist(km: Double): String = when {
    km < 1 -> "${"%.0f".format(km * 1000)}m"
    km < 100 -> "${"%.1f".format(km)}km"
    else -> "${"%.0f".format(km)}km"
}
