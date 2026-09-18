package de.parndt.cooking_diary.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.data.Meal
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.close
import de.parndt.cooking_diary.resources.suggest_cook_today
import de.parndt.cooking_diary.resources.suggest_empty
import de.parndt.cooking_diary.resources.suggest_how_about
import de.parndt.cooking_diary.resources.suggest_picking
import de.parndt.cooking_diary.resources.suggest_shuffle
import de.parndt.cooking_diary.resources.suggest_subtitle
import de.parndt.cooking_diary.resources.suggest_title
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

/** Amber gradient "What should I cook today?" card with a slot-machine style shuffle. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SuggestionHero(
    meals: List<Meal>,
    onCookToday: (Meal) -> Unit,
    onOpen: (Meal) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = AppTheme.colors
    val onHero = colors.onPrimary
    val scope = rememberCoroutineScope()
    var suggested by remember { mutableStateOf<Meal?>(null) }
    var shuffling by remember { mutableStateOf(false) }

    fun shuffle() {
        if (meals.isEmpty() || shuffling) return
        shuffling = true
        scope.launch {
            repeat(8) {
                suggested = meals.random()
                delay(90)
            }
            shuffling = false
        }
    }

    Box(
        modifier
            .fillMaxWidth()
            .softShadow(AppShapes.card, elevation = 16.dp, dark = colors.isDark)
            .clip(AppShapes.card)
            .background(Brush.linearGradient(listOf(colors.primary, colors.primary, colors.accentVariant)))
            .padding(16.dp)
    ) {
        val meal = suggested
        if (meal == null) {
            // Decorative only: matchParentSize keeps it from growing the card.
            Box(Modifier.matchParentSize()) {
                LIcon(
                    Lucide.ChefHat,
                    size = 96.dp,
                    tint = onHero,
                    modifier = Modifier.align(Alignment.CenterEnd).offset(x = 20.dp, y = 24.dp).rotate(-12f).alpha(0.12f),
                )
            }
        }
        if (meal == null) {
            // Compact single row so the diary's week strip stays above the fold.
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(40.dp).clip(AppShapes.image).background(onHero.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center,
                ) { LIcon(Lucide.Sparkles, size = 18.dp, tint = onHero) }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(stringResource(Res.string.suggest_title), style = MaterialTheme.typography.titleMedium, color = onHero)
                    Text(
                        stringResource(if (meals.isEmpty()) Res.string.suggest_empty else Res.string.suggest_subtitle),
                        style = MaterialTheme.typography.bodySmall,
                        color = onHero.copy(alpha = 0.75f),
                        maxLines = 2,
                    )
                }
                Spacer(Modifier.width(10.dp))
                CircleIconButton(
                    Lucide.Shuffle,
                    onClick = ::shuffle,
                    container = onHero,
                    content = Color.White,
                    size = 48.dp,
                    contentDescription = stringResource(Res.string.suggest_shuffle),
                )
            }
        } else {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    MealImage(
                        meal.defaultPhotoUrl,
                        Modifier.size(88.dp).border(4.dp, onHero.copy(alpha = 0.1f), AppShapes.image),
                        iconSize = 36.dp,
                        seed = meal.title,
                    )
                    Spacer(Modifier.width(16.dp))
                    Column(Modifier.weight(1f).padding(end = 28.dp)) {
                        Text(
                            stringResource(if (shuffling) Res.string.suggest_picking else Res.string.suggest_how_about).uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = onHero.copy(alpha = 0.7f),
                        )
                        Text(
                            meal.title,
                            style = MaterialTheme.typography.titleLarge,
                            color = onHero,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(6.dp))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            val chip = onHero.copy(alpha = 0.1f)
                            meal.prepTime?.let { Pill(it, icon = Lucide.Clock, container = chip, content = onHero) }
                            meal.cookTime?.let { Pill(it, icon = Lucide.Flame, container = chip, content = onHero) }
                            difficultyLabel(meal.difficulty)?.let { Pill(it, icon = Lucide.Gauge, container = chip, content = onHero) }
                        }
                    }
                }
                if (!shuffling) {
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PrimaryButton(
                            text = stringResource(Res.string.suggest_cook_today),
                            onClick = { onCookToday(meal) },
                            container = onHero,
                            content = Color.White,
                            modifier = Modifier.weight(1f),
                        )
                        CircleIconButton(
                            Lucide.ChevronRight,
                            onClick = { onOpen(meal) },
                            container = onHero.copy(alpha = 0.1f),
                            content = onHero,
                            size = 52.dp,
                        )
                        CircleIconButton(
                            Lucide.Shuffle,
                            onClick = ::shuffle,
                            container = onHero.copy(alpha = 0.1f),
                            content = onHero,
                            size = 52.dp,
                            contentDescription = stringResource(Res.string.suggest_shuffle),
                        )
                    }
                }
            }
            val closeLabel = stringResource(Res.string.close)
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .size(30.dp)
                    .clip(CircleShape)
                    .background(onHero.copy(alpha = 0.1f))
                    .clickable(onClickLabel = closeLabel) { suggested = null },
                contentAlignment = Alignment.Center,
            ) { LIcon(Lucide.X, size = 14.dp, tint = onHero) }
        }
    }
}
