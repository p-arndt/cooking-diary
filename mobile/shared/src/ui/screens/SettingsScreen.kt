package de.parndt.cooking_diary.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalApi
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.settings_account
import de.parndt.cooking_diary.resources.settings_categories
import de.parndt.cooking_diary.resources.settings_days_threshold
import de.parndt.cooking_diary.resources.settings_excluded
import de.parndt.cooking_diary.resources.settings_logout
import de.parndt.cooking_diary.resources.settings_server
import de.parndt.cooking_diary.resources.settings_suggestions
import de.parndt.cooking_diary.resources.settings_title
import de.parndt.cooking_diary.resources.settings_use_weekday
import de.parndt.cooking_diary.resources.settings_use_weekday_hint
import de.parndt.cooking_diary.resources.stat_categories
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.components.ErrorState
import de.parndt.cooking_diary.ui.components.IconBadge
import de.parndt.cooking_diary.ui.components.LIcon
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.PrimaryButton
import de.parndt.cooking_diary.ui.components.SelectablePill
import de.parndt.cooking_diary.ui.components.SoftCard
import de.parndt.cooking_diary.ui.theme.AppTheme
import org.jetbrains.compose.resources.stringResource

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(onSignOut: () -> Unit) {
    val session = LocalSession.current
    val navigator = LocalNavigator.current
    val api = LocalApi.current
    val store = session.settings
    val colors = AppTheme.colors
    LaunchedEffect(Unit) { store.ensureLoaded() }

    LazyColumn(
        contentPadding = TabContentPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize(),
    ) {
        item { ScreenHeader(stringResource(Res.string.settings_title)) }

        item {
            SectionLabel(stringResource(Res.string.settings_account))
            SoftCard(Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(52.dp).clip(CircleShape).background(colors.primary),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(initials(session.userName), style = MaterialTheme.typography.titleMedium, color = colors.onPrimary)
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(session.userName, style = MaterialTheme.typography.titleMedium)
                        Text(
                            stringResource(Res.string.settings_server, api.baseUrl.substringAfter("://")),
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.mutedForeground,
                        )
                    }
                }
            }
        }

        val settings = store.settings
        when {
            settings == null && store.error != null -> item { ErrorState(store.error!!, onRetry = store::refresh) }
            settings == null -> item { LoadingState() }
            else -> item {
                SectionLabel(stringResource(Res.string.settings_suggestions))
                SoftCard(Modifier.fillMaxWidth()) {
                    var days by remember(settings.suggestionDaysThreshold) {
                        mutableFloatStateOf(settings.suggestionDaysThreshold.toFloat())
                    }
                    Text(
                        stringResource(Res.string.settings_days_threshold, days.toInt()),
                        style = MaterialTheme.typography.labelLarge,
                    )
                    Slider(
                        value = days,
                        onValueChange = { days = it },
                        onValueChangeFinished = { store.update { it.copy(suggestionDaysThreshold = days.toInt()) } },
                        valueRange = 0f..60f,
                        steps = 59,
                        colors = SliderDefaults.colors(
                            thumbColor = colors.primary,
                            activeTrackColor = colors.primary,
                            inactiveTrackColor = colors.secondary,
                            activeTickColor = colors.primary,
                            inactiveTickColor = colors.secondary,
                        ),
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(stringResource(Res.string.settings_use_weekday), style = MaterialTheme.typography.labelLarge)
                            Text(
                                stringResource(Res.string.settings_use_weekday_hint),
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.mutedForeground,
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Switch(
                            checked = settings.suggestionUseDayOfWeek,
                            onCheckedChange = { checked -> store.update { it.copy(suggestionUseDayOfWeek = checked) } },
                            colors = SwitchDefaults.colors(
                                checkedTrackColor = colors.primary,
                                checkedThumbColor = colors.card,
                                uncheckedTrackColor = colors.secondary,
                                uncheckedBorderColor = colors.border,
                                uncheckedThumbColor = colors.mutedForeground,
                            ),
                        )
                    }
                    if (store.categories.isNotEmpty()) {
                        Spacer(Modifier.height(16.dp))
                        Text(stringResource(Res.string.settings_excluded), style = MaterialTheme.typography.labelLarge)
                        Spacer(Modifier.height(8.dp))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            store.categories.forEach { category ->
                                val excluded = category.id in settings.suggestionExcludedCategoryIds
                                SelectablePill(category.name, excluded, onClick = {
                                    store.update {
                                        val ids = it.suggestionExcludedCategoryIds
                                        it.copy(suggestionExcludedCategoryIds = if (excluded) ids - category.id else ids + category.id)
                                    }
                                })
                            }
                        }
                    }
                }
            }
        }

        item {
            SoftCard(Modifier.fillMaxWidth(), onClick = { navigator.push(Route.Categories) }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconBadge(Lucide.Tags, tint = colors.plum)
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(Res.string.settings_categories), style = MaterialTheme.typography.titleMedium)
                        Text(
                            "${store.categories.size} ${stringResource(Res.string.stat_categories)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.mutedForeground,
                        )
                    }
                    LIcon(Lucide.ChevronRight, size = 18.dp, tint = colors.mutedForeground)
                }
            }
        }

        item {
            Spacer(Modifier.height(8.dp))
            PrimaryButton(
                stringResource(Res.string.settings_logout),
                onClick = onSignOut,
                icon = Lucide.LogOut,
                container = colors.destructive.copy(alpha = 0.12f),
                content = colors.destructive,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
fun SectionLabel(text: String) {
    Text(
        text.uppercase(),
        style = MaterialTheme.typography.labelMedium,
        color = AppTheme.colors.mutedForeground,
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(8.dp))
}

private fun initials(name: String): String =
    name.split(' ').filter { it.isNotBlank() }.take(2).joinToString("") { it.first().uppercase() }.ifEmpty { "?" }
