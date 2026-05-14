package com.map.gpslogger.ui.passport

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.map.gpslogger.model.Achievement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import com.map.gpslogger.model.AchievementRarity

private val RARITY_ORDER = listOf(
    AchievementRarity.LEGENDARY,
    AchievementRarity.EPIC,
    AchievementRarity.RARE,
    AchievementRarity.COMMON,
)

private val RARITY_LABELS = mapOf(
    AchievementRarity.COMMON to "普通",
    AchievementRarity.RARE to "稀有",
    AchievementRarity.EPIC to "史诗",
    AchievementRarity.LEGENDARY to "传说",
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AchievementStampPage(
    achievements: List<Achievement>,
    unlockedIds: Set<String>,
) {
    val unlockedCount = achievements.count { it.id in unlockedIds }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = PassportColors.PageBackground),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Section header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "成就印章",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = PassportColors.TextOnPaper,
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "$unlockedCount/${achievements.size}",
                    fontSize = 12.sp,
                    color = PassportColors.TextOnPaperSecondary,
                    modifier = Modifier
                        .background(PassportColors.PageBorder.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                )
            }

            Spacer(Modifier.height(12.dp))

            // Group by rarity
            val byRarity = achievements.groupBy { it.rarity }

            RARITY_ORDER.forEach { rarity ->
                val group = byRarity[rarity] ?: return@forEach
                val color = RARITY_STAMP_COLORS[rarity] ?: Color.Gray
                val label = RARITY_LABELS[rarity] ?: rarity
                val groupUnlocked = group.count { it.id in unlockedIds }

                // Rarity label
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        label,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = color,
                        modifier = Modifier
                            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp),
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("$groupUnlocked/${group.size}", fontSize = 11.sp, color = PassportColors.TextOnPaperSecondary)
                }

                Spacer(Modifier.height(8.dp))

                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    group.forEach { achievement ->
                        AchievementStamp(
                            achievement = achievement,
                            isUnlocked = achievement.id in unlockedIds,
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))
            }
        }
    }
}
