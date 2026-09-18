package de.parndt.cooking_diary.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.data.MealDetail
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.back
import de.parndt.cooking_diary.resources.edit
import de.parndt.cooking_diary.resources.meals_cooked_times
import de.parndt.cooking_diary.resources.meals_delete_confirm
import de.parndt.cooking_diary.resources.meals_history
import de.parndt.cooking_diary.resources.meals_never_cooked
import de.parndt.cooking_diary.resources.meals_notes
import de.parndt.cooking_diary.resources.suggest_cook_today
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.components.CircleIconButton
import de.parndt.cooking_diary.ui.components.ErrorState
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.MealImage
import de.parndt.cooking_diary.ui.components.Pill
import de.parndt.cooking_diary.ui.components.PrimaryButton
import de.parndt.cooking_diary.ui.components.SoftCard
import de.parndt.cooking_diary.ui.components.difficultyLabel
import de.parndt.cooking_diary.ui.relativeDayLabel
import de.parndt.cooking_diary.ui.theme.AppTheme
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MealDetailScreen(mealId: String) {
    val session = LocalSession.current
    val navigator = LocalNavigator.current
    val colors = AppTheme.colors
    val scope = rememberCoroutineScope()
    var meal by remember { mutableStateOf<MealDetail?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var reloadKey by remember { mutableIntStateOf(0) }
    var confirmDelete by remember { mutableStateOf(false) }

    LaunchedEffect(mealId, reloadKey) {
        error = null
        runCatching { session.api.meal(mealId) }
            .onSuccess { meal = it }
            .onFailure { error = it.message }
    }

    val current = meal
    if (current == null) {
        Column(Modifier.fillMaxSize()) {
            DetailTopBar(null, onBack = navigator::pop)
            if (error != null) ErrorState(error!!, onRetry = { reloadKey++ }, Modifier.padding(20.dp)) else LoadingState()
        }
        return
    }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Box(Modifier.fillMaxWidth().height(340.dp)) {
                val heroPhoto = current.defaultPhotoUrl
                    ?: current.entries.sortedByDescending { it.date }.firstNotNullOfOrNull { it.photoUrls?.firstOrNull() }
                MealImage(heroPhoto, Modifier.fillMaxSize(), shape = RoundedCornerShape(0.dp), iconSize = 72.dp, seed = current.title)
                Box(
                    Modifier.fillMaxWidth().height(120.dp).background(
                        Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.35f), Color.Transparent))
                    )
                )
            }
            Column(
                Modifier
                    .offset(y = (-32).dp)
                    .clip(RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp))
                    .background(colors.background)
                    .padding(horizontal = 20.dp, vertical = 24.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(current.title, style = MaterialTheme.typography.headlineLarge)
                val chips = listOfNotNull(
                    current.prepTime?.let { Lucide.Clock to it },
                    current.cookTime?.let { Lucide.Flame to it },
                    difficultyLabel(current.difficulty)?.let { Lucide.Gauge to it },
                )
                if (chips.isNotEmpty() || current.categories.isNotEmpty()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        chips.forEach { (icon, text) ->
                            Pill(text, icon = icon, container = colors.primary.copy(alpha = 0.16f), content = colors.foreground)
                        }
                        current.categories.forEach { Pill(it.name, icon = Lucide.Tags) }
                    }
                }

                PrimaryButton(
                    text = stringResource(Res.string.suggest_cook_today),
                    icon = Lucide.Plus,
                    onClick = { navigator.push(Route.EntryEdit(presetMealId = current.id)) },
                    modifier = Modifier.fillMaxWidth(),
                )

                if (!current.defaultNotes.isNullOrBlank()) {
                    SoftCard(Modifier.fillMaxWidth()) {
                        Text(stringResource(Res.string.meals_notes), style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(6.dp))
                        Text(current.defaultNotes, style = MaterialTheme.typography.bodyMedium, color = colors.mutedForeground)
                    }
                }

                SoftCard(Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(Res.string.meals_history), style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                        Pill(
                            if (current.entries.isEmpty()) stringResource(Res.string.meals_never_cooked)
                            else stringResource(Res.string.meals_cooked_times, current.entries.size),
                            container = colors.primary,
                            content = colors.onPrimary,
                        )
                    }
                    if (current.entries.isNotEmpty()) {
                        Spacer(Modifier.height(14.dp))
                        current.entries.sortedByDescending { it.date }.forEachIndexed { index, entry ->
                            TimelineRow(
                                title = relativeDayLabel(entry.date),
                                subtitle = entry.notes,
                                isLast = index == current.entries.lastIndex,
                                onClick = { navigator.push(Route.EntryEdit(entry = entry)) },
                            )
                        }
                    }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            CircleIconButton(Lucide.ChevronLeft, onClick = navigator::pop, contentDescription = stringResource(Res.string.back))
            Spacer(Modifier.weight(1f))
            CircleIconButton(Lucide.Pencil, onClick = { navigator.push(Route.MealEdit(current.id)) }, contentDescription = stringResource(Res.string.edit))
            CircleIconButton(Lucide.Trash, onClick = { confirmDelete = true }, content = colors.destructive)
        }
    }

    if (confirmDelete) {
        ConfirmDeleteDialog(
            text = stringResource(Res.string.meals_delete_confirm),
            onDismiss = { confirmDelete = false },
            onConfirm = {
                confirmDelete = false
                scope.launch {
                    runCatching { session.api.deleteMeal(current.id) }.onSuccess {
                        session.invalidate()
                        navigator.pop()
                    }
                }
            },
        )
    }
}

@Composable
private fun TimelineRow(title: String, subtitle: String?, isLast: Boolean, onClick: () -> Unit) {
    val colors = AppTheme.colors
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(20.dp)) {
            Box(Modifier.padding(top = 5.dp).size(10.dp).clip(CircleShape).background(colors.primary))
            if (!isLast) Box(Modifier.width(2.dp).height(if (subtitle.isNullOrBlank()) 26.dp else 44.dp).background(colors.primary.copy(alpha = 0.3f)))
        }
        Spacer(Modifier.width(10.dp))
        Column(Modifier.padding(bottom = 10.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = colors.mutedForeground, maxLines = 2)
            }
        }
    }
}
