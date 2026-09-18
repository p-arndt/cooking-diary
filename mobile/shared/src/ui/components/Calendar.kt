package de.parndt.cooking_diary.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.diary_next
import de.parndt.cooking_diary.resources.diary_prev
import de.parndt.cooking_diary.resources.nav_add_entry
import de.parndt.cooking_diary.resources.today
import de.parndt.cooking_diary.resources.weekdays_short
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import de.parndt.cooking_diary.ui.today
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import org.jetbrains.compose.resources.stringArrayResource
import org.jetbrains.compose.resources.stringResource
import kotlin.math.abs

fun LocalDate.startOfWeek(): LocalDate = minus(DatePeriod(days = dayOfWeek.ordinal))

fun LocalDate.startOfMonth(): LocalDate = LocalDate(year, month, 1)

/** The 42 cells (6 Monday-first rows) of the month grid containing [monthStart]. */
fun monthGridDays(monthStart: LocalDate): List<LocalDate> {
    val first = monthStart.startOfWeek()
    return (0 until 42).map { first.plus(DatePeriod(days = it)) }
}

/** Pill-shaped segmented control, the native twin of the web dashboard's timeline/calendar toggle. */
@Composable
fun <T> SegmentedControl(options: List<Pair<T, String>>, selected: T, onSelect: (T) -> Unit, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Row(
        modifier.fillMaxWidth().clip(AppShapes.pill).background(colors.secondary).padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        options.forEach { (value, label) ->
            val active = value == selected
            Box(
                Modifier
                    .weight(1f)
                    .then(if (active) Modifier.softShadow(AppShapes.pill, elevation = 4.dp, dark = colors.isDark) else Modifier)
                    .clip(AppShapes.pill)
                    .background(if (active) colors.card else Color.Transparent)
                    .clickable { onSelect(value) }
                    .padding(vertical = 9.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (active) colors.foreground else colors.mutedForeground,
                )
            }
        }
    }
}

/** Title with prev/next chevrons and an optional "Heute" pill to jump back. */
@Composable
fun PeriodHeader(title: String, onPrev: () -> Unit, onNext: () -> Unit, showToday: Boolean, onToday: () -> Unit) {
    val colors = AppTheme.colors
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
        if (showToday) {
            Pill(
                stringResource(Res.string.today),
                container = colors.primary.copy(alpha = 0.16f),
                content = colors.foreground,
                onClick = onToday,
                modifier = Modifier.padding(end = 6.dp),
            )
        }
        CircleIconButton(Lucide.ChevronLeft, onPrev, size = 38.dp, container = colors.secondary, contentDescription = stringResource(Res.string.diary_prev))
        Spacer(Modifier.size(6.dp))
        CircleIconButton(Lucide.ChevronRight, onNext, size = 38.dp, container = colors.secondary, contentDescription = stringResource(Res.string.diary_next))
    }
}

/** Mon–Sun day pills; swipe horizontally to change week. */
@Composable
fun WeekStrip(
    weekStart: LocalDate,
    selected: LocalDate?,
    daysWithEntries: Set<LocalDate>,
    onSelect: (LocalDate) -> Unit,
    onSwipe: (forward: Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = AppTheme.colors
    val names = stringArrayResource(Res.array.weekdays_short)
    val now = today()
    Row(
        modifier
            .fillMaxWidth()
            .pointerInput(weekStart) {
                var total = 0f
                detectHorizontalDragGestures(
                    onDragStart = { total = 0f },
                    onDragEnd = { if (abs(total) > 80f) onSwipe(total < 0) },
                    onHorizontalDrag = { _, amount -> total += amount },
                )
            },
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        (0 until 7).forEach { offset ->
            val day = weekStart.plus(DatePeriod(days = offset))
            val isSelected = day == selected
            val isToday = day == now
            val shape = RoundedCornerShape(18.dp)
            Column(
                Modifier
                    .weight(1f)
                    .clip(shape)
                    .background(if (isSelected) colors.primary else colors.card)
                    .border(
                        width = if (isToday && !isSelected) 2.dp else 1.dp,
                        color = if (isToday && !isSelected) colors.primary else if (isSelected) colors.primary else colors.border,
                        shape = shape,
                    )
                    .clickable { onSelect(day) }
                    .padding(vertical = 10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                val content = if (isSelected) colors.onPrimary else colors.foreground
                Text(
                    names.getOrElse(offset) { "" },
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isSelected) content else colors.mutedForeground,
                )
                Text(day.day.toString(), style = MaterialTheme.typography.titleMedium, color = content)
                Spacer(Modifier.height(4.dp))
                Box(
                    Modifier
                        .size(5.dp)
                        .alpha(if (day in daysWithEntries) 1f else 0f)
                        .clip(CircleShape)
                        .background(if (isSelected) colors.onPrimary else colors.primary)
                )
            }
        }
    }
}

/** Monday-first month grid like the web calendar: entry days tinted with a dot, today ringed, selection filled. */
@Composable
fun MonthGrid(
    monthStart: LocalDate,
    selected: LocalDate,
    daysWithEntries: Set<LocalDate>,
    onSelect: (LocalDate) -> Unit,
    onSwipe: (forward: Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = AppTheme.colors
    val names = stringArrayResource(Res.array.weekdays_short)
    val now = today()
    Column(
        modifier.pointerInput(monthStart) {
            var total = 0f
            detectHorizontalDragGestures(
                onDragStart = { total = 0f },
                onDragEnd = { if (abs(total) > 80f) onSwipe(total < 0) },
                onHorizontalDrag = { _, amount -> total += amount },
            )
        },
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Row(Modifier.fillMaxWidth()) {
            names.forEach {
                Text(
                    it.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.mutedForeground,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f).padding(vertical = 4.dp),
                )
            }
        }
        monthGridDays(monthStart).chunked(7).forEach { week ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                week.forEach { day ->
                    val isSelected = day == selected
                    val hasEntries = day in daysWithEntries
                    val inMonth = day.month == monthStart.month
                    val shape = RoundedCornerShape(14.dp)
                    Box(
                        Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .alpha(if (inMonth || isSelected) 1f else 0.35f)
                            .clip(shape)
                            .background(
                                when {
                                    isSelected -> colors.primary
                                    hasEntries -> colors.primary.copy(alpha = 0.12f)
                                    else -> Color.Transparent
                                }
                            )
                            .then(if (day == now && !isSelected) Modifier.border(2.dp, colors.primary, shape) else Modifier)
                            .clickable { onSelect(day) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            day.day.toString(),
                            style = MaterialTheme.typography.labelLarge,
                            color = if (isSelected) colors.onPrimary else colors.foreground,
                        )
                        if (hasEntries) {
                            Box(
                                Modifier
                                    .align(Alignment.BottomCenter)
                                    .padding(bottom = 5.dp)
                                    .size(4.dp)
                                    .clip(CircleShape)
                                    .background(if (isSelected) colors.onPrimary else colors.primary)
                            )
                        }
                    }
                }
            }
        }
    }
}

/** Compact dashed empty state with an "add entry" action. */
@Composable
fun CompactEmptyState(message: String, onAdd: () -> Unit, modifier: Modifier = Modifier) {
    val colors = AppTheme.colors
    Row(
        modifier
            .fillMaxWidth()
            .dashedBorder(colors.border, AppShapes.card)
            .padding(start = 18.dp, end = 10.dp, top = 10.dp, bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(message, style = MaterialTheme.typography.bodyMedium, color = colors.mutedForeground, modifier = Modifier.weight(1f))
        PrimaryButton(
            stringResource(Res.string.nav_add_entry),
            onClick = onAdd,
            icon = Lucide.Plus,
            modifier = Modifier.height(44.dp),
        )
    }
}

private fun Modifier.dashedBorder(color: Color, shape: RoundedCornerShape): Modifier = drawBehind {
    val outline = shape.createOutline(size, layoutDirection, this)
    drawOutline(
        outline,
        color = color,
        style = Stroke(width = 2.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f))),
    )
}
