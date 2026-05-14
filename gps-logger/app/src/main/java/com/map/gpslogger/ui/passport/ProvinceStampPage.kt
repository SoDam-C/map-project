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
import com.map.gpslogger.data.FootprintEntity
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import com.map.gpslogger.model.AdminRegions

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProvinceStampPage(
    provinces: List<AdminRegions.Province>,
    footprints: Map<String, FootprintEntity>,
) {
    val visitedCount = provinces.count { it.adcode in footprints }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = PassportColors.PageBackground),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Section header
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "省份印章",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = PassportColors.TextOnPaper,
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "$visitedCount/${provinces.size}",
                    fontSize = 12.sp,
                    color = PassportColors.TextOnPaperSecondary,
                    modifier = Modifier
                        .background(PassportColors.PageBorder.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                )
            }

            Spacer(Modifier.height(16.dp))

            // Sort: visited first (by date desc), then unvisited (by name)
            val sorted = provinces.sortedWith(
                compareByDescending<AdminRegions.Province> { if (it.adcode in footprints) 1L else 0L }
                    .thenByDescending { footprints[it.adcode]?.litAt ?: "" }
                    .thenBy { it.name }
            )

            // Stamp grid
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                sorted.forEach { province ->
                    val fp = footprints[province.adcode]
                    ProvinceStamp(
                        province = province,
                        footprint = fp,
                        isVisited = fp != null,
                    )
                }
            }
        }
    }
}
