package de.parndt.cooking_diary.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.nav_add_entry
import de.parndt.cooking_diary.resources.nav_analytics
import de.parndt.cooking_diary.resources.nav_diary
import de.parndt.cooking_diary.resources.nav_meals
import de.parndt.cooking_diary.resources.nav_settings
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import org.jetbrains.compose.resources.stringResource

/** Floating dark pill with a raised amber "+" in the middle — mirrors the web's `bottom-tab-bar.svelte`. */
@Composable
fun FloatingTabBar(
    currentTab: Route,
    onSelect: (Route) -> Unit,
    onAdd: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = AppTheme.colors
    Box(modifier.fillMaxWidth().height(92.dp), contentAlignment = Alignment.BottomCenter) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .softShadow(AppShapes.pill, elevation = 18.dp, dark = colors.isDark)
                .clip(AppShapes.pill)
                .background(colors.navBar)
                .then(if (colors.isDark) Modifier.border(1.dp, colors.border, AppShapes.pill) else Modifier)
                .padding(horizontal = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Tab(Lucide.BookOpen, stringResource(Res.string.nav_diary), currentTab == Route.Diary) { onSelect(Route.Diary) }
            Tab(Lucide.ChefHat, stringResource(Res.string.nav_meals), currentTab == Route.Meals) { onSelect(Route.Meals) }
            Box(Modifier.size(72.dp))
            Tab(Lucide.TrendingUp, stringResource(Res.string.nav_analytics), currentTab == Route.Analytics) { onSelect(Route.Analytics) }
            Tab(Lucide.Settings, stringResource(Res.string.nav_settings), currentTab == Route.Settings) { onSelect(Route.Settings) }
        }
        val addLabel = stringResource(Res.string.nav_add_entry)
        Box(
            modifier = Modifier
                .offset(y = (-28).dp)
                .size(64.dp)
                .softShadow(CircleShape, elevation = 14.dp, dark = colors.isDark)
                .clip(CircleShape)
                .background(colors.background)
                .padding(4.dp)
                .clip(CircleShape)
                .background(colors.primary)
                .clickable(onClick = onAdd)
                .semantics { contentDescription = addLabel },
            contentAlignment = Alignment.Center,
        ) {
            LIcon(Lucide.Plus, size = 26.dp, tint = colors.onPrimary)
        }
    }
}

@Composable
private fun RowScope.Tab(icon: ImageVector, label: String, active: Boolean, onClick: () -> Unit) {
    val colors = AppTheme.colors
    val tint = if (active) colors.primary else colors.navBarContent.copy(alpha = 0.55f)
    Column(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .clip(AppShapes.pill)
            .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        LIcon(icon, size = 21.dp, tint = tint)
        Text(
            label,
            color = tint,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
            maxLines = 1,
            modifier = Modifier.padding(top = 2.dp),
        )
    }
}
