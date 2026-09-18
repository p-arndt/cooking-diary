package de.parndt.cooking_diary.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.data.Analytics
import de.parndt.cooking_diary.data.MonthlyStat
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.analytics_categories
import de.parndt.cooking_diary.resources.analytics_empty
import de.parndt.cooking_diary.resources.analytics_monthly
import de.parndt.cooking_diary.resources.analytics_most_active
import de.parndt.cooking_diary.resources.analytics_title
import de.parndt.cooking_diary.resources.analytics_top_meals
import de.parndt.cooking_diary.resources.stat_categories
import de.parndt.cooking_diary.resources.stat_entries
import de.parndt.cooking_diary.resources.stat_meals
import de.parndt.cooking_diary.resources.stat_per_week
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.components.EmptyState
import de.parndt.cooking_diary.ui.components.ErrorState
import de.parndt.cooking_diary.ui.components.IconBadge
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.SoftCard
import de.parndt.cooking_diary.ui.components.StatTile
import de.parndt.cooking_diary.ui.components.formatStat
import de.parndt.cooking_diary.ui.monthShort
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import de.parndt.cooking_diary.ui.today
import de.parndt.cooking_diary.ui.weekdayFromDow
import org.jetbrains.compose.resources.stringResource

@Composable
fun AnalyticsScreen() {
    val store = LocalSession.current.analytics
    LaunchedEffect(Unit) { store.ensureLoaded() }
    val data = store.data

    PullToRefreshBox(
        isRefreshing = store.loading && data != null,
        onRefresh = { store.refresh() },
        modifier = Modifier.fillMaxSize(),
    ) {
        LazyColumn(
            contentPadding = TabContentPadding,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxSize(),
        ) {
            item { ScreenHeader(stringResource(Res.string.analytics_title)) }
            when {
                data == null && store.error != null -> item { ErrorState(store.error!!, onRetry = store::refresh) }
                data == null -> item { LoadingState() }
                data.general.totalEntries == 0 -> item {
                    EmptyState(Lucide.TrendingUp, stringResource(Res.string.analytics_empty))
                }
                else -> analyticsContent(data)
            }
        }
    }
}

private fun androidx.compose.foundation.lazy.LazyListScope.analyticsContent(data: Analytics) {
    item {
        val colors = AppTheme.colors
        val g = data.general
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(Lucide.BookOpen, colors.primary, g.totalEntries.toString(), stringResource(Res.string.stat_entries), Modifier.weight(1f))
                StatTile(Lucide.UtensilsCrossed, colors.accent, g.totalMeals.toString(), stringResource(Res.string.stat_meals), Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(Lucide.Tags, colors.plum, g.totalCategories.toString(), stringResource(Res.string.stat_categories), Modifier.weight(1f))
                StatTile(Lucide.TrendingUp, colors.teal, formatStat(g.averageEntriesPerWeek), stringResource(Res.string.stat_per_week), Modifier.weight(1f))
            }
        }
    }
    data.general.mostActiveDay?.let { dow ->
        item {
            val colors = AppTheme.colors
            SoftCard(Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconBadge(Lucide.Calendar, tint = colors.blue)
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(stringResource(Res.string.analytics_most_active), style = MaterialTheme.typography.labelMedium, color = colors.mutedForeground)
                        Text(weekdayFromDow(dow), style = MaterialTheme.typography.titleLarge)
                    }
                }
            }
        }
    }
    item { MonthlyChart(data.monthly) }
    if (data.topMeals.isNotEmpty()) {
        item {
            val navigator = LocalNavigator.current
            RankingCard(
                title = stringResource(Res.string.analytics_top_meals),
                rows = data.topMeals.take(6).map { RankingRow(it.mealTitle, it.count) { navigator.push(Route.MealDetail(it.mealId)) } },
                color = AppTheme.colors.accent,
            )
        }
    }
    if (data.categories.any { it.entryCount > 0 }) {
        item {
            RankingCard(
                title = stringResource(Res.string.analytics_categories),
                rows = data.categories.filter { it.entryCount > 0 }.sortedByDescending { it.entryCount }.take(6)
                    .map { RankingRow(it.categoryName, it.entryCount, null) },
                color = AppTheme.colors.teal,
            )
        }
    }
}

/** Last 12 months as rounded amber bars, oldest first, with empty months filled in. */
@Composable
private fun MonthlyChart(monthly: List<MonthlyStat>) {
    val colors = AppTheme.colors
    val months = remember(monthly) {
        val now = today()
        (11 downTo 0).map { back ->
            val total = now.year * 12 + (now.month.ordinal) - back
            val year = total / 12
            val month = total % 12 + 1
            Triple(year, month, monthly.firstOrNull { it.year == year && it.month == month }?.count ?: 0)
        }
    }
    val max = (months.maxOf { it.third }).coerceAtLeast(1)
    val progress = remember(monthly) { Animatable(0f) }
    LaunchedEffect(monthly) { progress.animateTo(1f, tween(700)) }

    SoftCard(Modifier.fillMaxWidth()) {
        Text(stringResource(Res.string.analytics_monthly), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth().height(140.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            months.forEach { (_, _, count) ->
                Column(Modifier.weight(1f).fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        if (count > 0) count.toString() else "",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.mutedForeground,
                    )
                    Canvas(Modifier.fillMaxWidth().weight(1f).padding(top = 4.dp)) {
                        val barHeight = size.height * (count.toFloat() / max) * progress.value
                        drawRoundRect(
                            color = colors.secondary,
                            size = size,
                            cornerRadius = CornerRadius(size.width / 2),
                        )
                        if (count > 0) {
                            drawRoundRect(
                                color = colors.primary,
                                topLeft = Offset(0f, size.height - barHeight),
                                size = Size(size.width, barHeight.coerceAtLeast(size.width)),
                                cornerRadius = CornerRadius(size.width / 2),
                            )
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            months.forEach { (_, month, _) ->
                Text(
                    monthShort(month).take(1),
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.mutedForeground,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

private data class RankingRow(val label: String, val count: Int, val onClick: (() -> Unit)?)

@Composable
private fun RankingCard(title: String, rows: List<RankingRow>, color: Color) {
    val colors = AppTheme.colors
    val max = rows.maxOfOrNull { it.count }?.coerceAtLeast(1) ?: 1
    SoftCard(Modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(12.dp))
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            rows.forEach { row ->
                Column(
                    Modifier.then(
                        if (row.onClick != null) Modifier.clip(AppShapes.image).clickable(onClick = row.onClick) else Modifier
                    )
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(row.label, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                        Text("${row.count}×", style = MaterialTheme.typography.labelLarge, color = colors.mutedForeground)
                    }
                    Spacer(Modifier.height(6.dp))
                    Box(Modifier.fillMaxWidth().height(8.dp).clip(AppShapes.pill).background(colors.secondary)) {
                        Box(Modifier.fillMaxWidth(row.count.toFloat() / max).fillMaxHeight().clip(AppShapes.pill).background(color))
                    }
                }
            }
        }
    }
}
