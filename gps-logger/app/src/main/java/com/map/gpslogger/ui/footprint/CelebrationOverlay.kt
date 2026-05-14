package com.map.gpslogger.ui.footprint

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

private val CONFETTI_COLORS = listOf(
    Color(0xFFFBBF24), Color(0xFFF87171), Color(0xFF60A5FA),
    Color(0xFF34D399), Color(0xFFA78BFA), Color(0xFFFB923C),
    Color(0xFFF472B6),
)

@Composable
fun CelebrationOverlay(
    active: Boolean,
    message: String,
    onComplete: () -> Unit,
) {
    if (!active) return

    val particles = remember {
        List(30) { i ->
            ParticleData(
                color = CONFETTI_COLORS[i % CONFETTI_COLORS.size],
                startX = (Math.random() * 300 - 150).toInt().dp,
                startY = (-50 - Math.random() * 100).toInt().dp,
                endY = (400 + Math.random() * 200).toInt().dp,
                driftX = ((Math.random() - 0.5) * 100).toInt().dp,
                size = (4 + Math.random() * 6).toInt().dp,
                delay = (Math.random() * 500).toLong(),
            )
        }
    }

    // Auto dismiss
    LaunchedEffect(active) {
        delay(2500)
        onComplete()
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        // Message
        androidx.compose.animation.AnimatedVisibility(
            visible = true,
            enter = androidx.compose.animation.fadeIn(tween(300)),
        ) {
            androidx.compose.foundation.layout.Box(
                modifier = Modifier
                    .offset(y = (-80).dp)
                    .background(Color.Black.copy(alpha = 0.7f), androidx.compose.foundation.shape.RoundedCornerShape(16.dp))
                    .padding(horizontal = 24.dp, vertical = 12.dp),
            ) {
                Text(message, color = Color.White, fontSize = 16.sp)
            }
        }

        // Confetti particles
        particles.forEach { particle ->
            val offsetY = remember { Animatable(0f) }
            val offsetX = remember { Animatable(0f) }
            val alpha = remember { Animatable(1f) }

            LaunchedEffect(particle.delay) {
                delay(particle.delay)
                offsetY.animateTo(
                    particle.endY.value.toFloat(),
                    animationSpec = tween(1500, easing = FastOutSlowInEasing),
                )
                offsetX.animateTo(
                    particle.driftX.value.toFloat(),
                    animationSpec = tween(1500, easing = FastOutSlowInEasing),
                )
                alpha.animateTo(
                    0f,
                    animationSpec = tween(500),
                )
            }

            Box(
                modifier = Modifier
                    .offset { IntOffset(offsetX.value.toInt(), offsetY.value.toInt()) }
                    .size(particle.size)
                    .clip(CircleShape)
                    .background(particle.color)
                    .alpha(alpha.value),
            )
        }
    }
}

private data class ParticleData(
    val color: Color,
    val startX: androidx.compose.ui.unit.Dp,
    val startY: androidx.compose.ui.unit.Dp,
    val endY: androidx.compose.ui.unit.Dp,
    val driftX: androidx.compose.ui.unit.Dp,
    val size: androidx.compose.ui.unit.Dp,
    val delay: Long,
)
