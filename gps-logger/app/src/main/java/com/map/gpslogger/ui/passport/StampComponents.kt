package com.map.gpslogger.ui.passport

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.map.gpslogger.data.FootprintEntity
import com.map.gpslogger.model.Achievement
import com.map.gpslogger.model.AdminRegions

// ========== Passport Color Palette ==========

object PassportColors {
    val PageBackground = Color(0xFFF5F0E8)
    val PageBorder = Color(0xFFD4A574)
    val Gold = Color(0xFFFFD700)
    val GoldDark = Color(0xFFB8860B)
    val CoverStart = Color(0xFF1a1a3e)
    val CoverMid = Color(0xFF16213e)
    val CoverEnd = Color(0xFF0f3460)
    val StampGps = Color(0xFF22D3EE)
    val StampManual = Color(0xFF6366F1)
    val StampPhoto = Color(0xFFF472B6)
    val StampTrip = Color(0xFFFB923C)
    val StampAncestor = Color(0xFF818CF8)
    val StampGhost = Color(0xFF9CA3AF)
    val TextOnPaper = Color(0xFF3D3028)
    val TextOnPaperSecondary = Color(0xFF8B7D6B)
}

val RARITY_STAMP_COLORS = mapOf(
    "common" to Color(0xFF9CA3AF),
    "rare" to Color(0xFF60A5FA),
    "epic" to Color(0xFFA78BFA),
    "legendary" to Color(0xFFFBBF24),
)

// ========== Stamp Rotation Helper ==========

fun stampAngle(key: String): Float {
    val hash = key.hashCode()
    return (hash % 160) / 10f - 8f
}

// ========== Province Stamp ==========

@Composable
fun ProvinceStamp(
    province: AdminRegions.Province,
    footprint: FootprintEntity?,
    isVisited: Boolean,
) {
    val angle = remember(province.adcode) { stampAngle(province.adcode) }
    val stampColor = if (isVisited && footprint != null) {
        when (footprint.source) {
            "gps" -> PassportColors.StampGps
            "manual" -> PassportColors.StampManual
            "photo" -> PassportColors.StampPhoto
            "trip" -> PassportColors.StampTrip
            "ancestor" -> PassportColors.StampAncestor
            else -> PassportColors.StampGps
        }
    } else PassportColors.StampGhost

    val alpha = if (isVisited) 1f else 0.15f

    Box(
        modifier = Modifier
            .size(80.dp)
            .rotate(angle)
            .then(
                if (isVisited) {
                    Modifier.border(2.dp, stampColor, CircleShape)
                } else {
                    Modifier.drawBehind {
                        drawCircle(
                            color = stampColor,
                            radius = size.minDimension / 2 - 1.dp.toPx(),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(
                                width = 1.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 4f))
                            )
                        )
                    }
                }
            )
            .padding(6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.alpha(alpha),
        ) {
            // Province name (shortened)
            val shortName = province.name
                .replace("省", "").replace("市", "").replace("自治区", "")
                .replace("壮族自治区", "").replace("回族自治区", "")
                .replace("维吾尔自治区", "").replace("特别行政区", "")
            Text(
                shortName,
                fontSize = if (shortName.length > 2) 11.sp else 13.sp,
                fontWeight = FontWeight.Bold,
                color = stampColor,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
            if (isVisited && footprint != null) {
                // Date
                val dateStr = try {
                    val iso = footprint.litAt
                    if (iso.length >= 10) iso.substring(5, 10).replace("-", "/") else ""
                } catch (_: Exception) { "" }
                if (dateStr.isNotBlank()) {
                    Spacer(Modifier.height(1.dp))
                    Text(dateStr, fontSize = 9.sp, color = stampColor.copy(alpha = 0.7f))
                }
                // Source icon
                val sourceIcon = when (footprint.source) {
                    "gps" -> "📡"; "manual" -> "📍"; "photo" -> "📷"
                    "trip" -> "✈️"; "track" -> "🛤️"; "ancestor" -> "🔗"
                    else -> "📍"
                }
                Text(sourceIcon, fontSize = 10.sp)
            }
        }
    }
}

// ========== Achievement Stamp ==========

@Composable
fun AchievementStamp(
    achievement: Achievement,
    isUnlocked: Boolean,
) {
    val rarityColor = RARITY_STAMP_COLORS[achievement.rarity] ?: Color.Gray
    val angle = remember(achievement.id) { stampAngle(achievement.id) }
    val alpha = if (isUnlocked) 1f else 0.15f

    Box(
        modifier = Modifier
            .size(width = 90.dp, height = 72.dp)
            .rotate(angle)
            .then(
                if (isUnlocked) {
                    Modifier.border(2.dp, rarityColor, RoundedCornerShape(12.dp))
                } else {
                    Modifier.drawBehind {
                        drawRoundRect(
                            color = rarityColor,
                            cornerRadius = CornerRadius(12.dp.toPx()),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(
                                width = 1.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 4f))
                            )
                        )
                    }
                }
            )
            .padding(6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.alpha(alpha),
        ) {
            Text(
                if (isUnlocked) achievement.icon else "?",
                fontSize = 22.sp,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                achievement.title,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                color = if (isUnlocked) PassportColors.TextOnPaper else PassportColors.StampGhost,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 12.sp,
            )
        }
    }
}

// ========== Milestone Stamp ==========

data class MilestoneDef(
    val id: String,
    val title: String,
    val icon: String,
    val value: String,
)

@Composable
fun MilestoneStamp(
    milestone: MilestoneDef,
    isReached: Boolean,
) {
    val angle = remember(milestone.id) { stampAngle(milestone.id) }
    val stampColor = if (isReached) PassportColors.Gold else PassportColors.StampGhost
    val alpha = if (isReached) 1f else 0.15f

    Box(
        modifier = Modifier
            .size(72.dp)
            .rotate(angle)
            .then(
                if (isReached) {
                    Modifier.border(2.dp, stampColor, CircleShape)
                } else {
                    Modifier.drawBehind {
                        drawCircle(
                            color = stampColor,
                            radius = size.minDimension / 2 - 1.dp.toPx(),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(
                                width = 1.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 4f))
                            )
                        )
                    }
                }
            )
            .padding(6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.alpha(alpha),
        ) {
            Text(milestone.icon, fontSize = 20.sp)
            Text(
                milestone.value,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = stampColor,
            )
            Text(
                milestone.title,
                fontSize = 8.sp,
                color = if (isReached) PassportColors.TextOnPaperSecondary else PassportColors.StampGhost,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
        }
    }
}

// ========== Page Divider ==========

@Composable
fun PageDivider() {
    Column(
        modifier = Modifier.padding(vertical = 16.dp, horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        HorizontalDivider(color = PassportColors.PageBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
        Spacer(Modifier.height(4.dp))
        Text("· · ·", color = PassportColors.PageBorder.copy(alpha = 0.5f), fontSize = 12.sp, letterSpacing = 4.sp)
        Spacer(Modifier.height(4.dp))
        HorizontalDivider(color = PassportColors.PageBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
    }
}

