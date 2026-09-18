package de.parndt.cooking_diary.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.data.Entry
import de.parndt.cooking_diary.data.EntryInput
import de.parndt.cooking_diary.data.Meal
import de.parndt.cooking_diary.data.MealInput
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.cancel
import de.parndt.cooking_diary.resources.entry_edit
import de.parndt.cooking_diary.resources.entry_new
import de.parndt.cooking_diary.resources.entry_new_meal_named
import de.parndt.cooking_diary.resources.entry_notes_placeholder
import de.parndt.cooking_diary.resources.entry_other_date
import de.parndt.cooking_diary.resources.entry_pick_meal
import de.parndt.cooking_diary.resources.field_date
import de.parndt.cooking_diary.resources.field_notes
import de.parndt.cooking_diary.resources.field_photo
import de.parndt.cooking_diary.resources.meals_search
import de.parndt.cooking_diary.resources.save
import de.parndt.cooking_diary.resources.today
import de.parndt.cooking_diary.resources.yesterday
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.components.AppTextField
import de.parndt.cooking_diary.ui.components.CircleIconButton
import de.parndt.cooking_diary.ui.components.IconBadge
import de.parndt.cooking_diary.ui.components.LIcon
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.MealImage
import de.parndt.cooking_diary.ui.components.PhotoSlot
import de.parndt.cooking_diary.ui.components.PrimaryButton
import de.parndt.cooking_diary.ui.components.SearchField
import de.parndt.cooking_diary.ui.components.SelectablePill
import de.parndt.cooking_diary.ui.components.SoftCard
import de.parndt.cooking_diary.ui.components.TitleText
import de.parndt.cooking_diary.ui.longDate
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import de.parndt.cooking_diary.ui.today
import kotlinx.coroutines.launch
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.atStartOfDayIn
import kotlinx.datetime.minus
import kotlinx.datetime.toLocalDateTime
import org.jetbrains.compose.resources.stringResource
import kotlin.time.Instant

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun EntryEditScreen(entry: Entry?, presetMealId: String?, presetDate: LocalDate? = null) {
    val session = LocalSession.current
    val navigator = LocalNavigator.current
    val colors = AppTheme.colors
    val scope = rememberCoroutineScope()

    var meals by remember { mutableStateOf<List<Meal>?>(null) }
    var selectedMealId by remember { mutableStateOf(entry?.mealId ?: presetMealId) }
    var query by remember { mutableStateOf("") }
    var date by remember { mutableStateOf(entry?.date ?: presetDate ?: today()) }
    var notes by remember { mutableStateOf(entry?.notes.orEmpty()) }
    var photoUrl by remember { mutableStateOf(entry?.photoUrls?.firstOrNull()) }
    var showDatePicker by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        meals = runCatching { session.api.meals() }.getOrElse { error = it.message; emptyList() }
            .sortedBy { it.title.lowercase() }
    }

    val selectedMeal = meals?.firstOrNull { it.id == selectedMealId }

    fun createMealAndSelect(title: String) {
        scope.launch {
            runCatching { session.api.createMeal(MealInput(title = title.trim())) }
                .onSuccess { created ->
                    meals = (meals.orEmpty() + created).sortedBy { it.title.lowercase() }
                    selectedMealId = created.id
                    query = ""
                }
                .onFailure { error = it.message }
        }
    }

    fun save() {
        val mealId = selectedMealId ?: return
        if (saving) return
        saving = true
        error = null
        val input = EntryInput(
            mealId = mealId,
            dateCooked = date.toString(),
            notes = notes.trim().ifEmpty { null },
            photoUrls = listOfNotNull(photoUrl),
        )
        scope.launch {
            try {
                if (entry == null) session.api.createEntry(input) else session.api.updateEntry(entry.id, input)
                session.invalidate()
                navigator.pop()
            } catch (e: Exception) {
                error = e.message
            } finally {
                saving = false
            }
        }
    }

    Column(Modifier.fillMaxSize().imePadding()) {
        DetailTopBar(stringResource(if (entry == null) Res.string.entry_new else Res.string.entry_edit), onBack = navigator::pop)

        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            FieldLabel(stringResource(Res.string.entry_pick_meal))
            val loadedMeals = meals
            when {
                loadedMeals == null -> LoadingState()
                selectedMeal != null -> SoftCard(Modifier.fillMaxWidth(), contentPadding = PaddingValues(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        MealImage(selectedMeal.defaultPhotoUrl, Modifier.size(56.dp), seed = selectedMeal.title)
                        Spacer(Modifier.width(12.dp))
                        TitleText(selectedMeal.title, Modifier.weight(1f))
                        CircleIconButton(Lucide.X, onClick = { selectedMealId = null }, container = colors.secondary, size = 36.dp)
                    }
                }
                else -> MealPicker(
                    meals = loadedMeals,
                    query = query,
                    onQueryChange = { query = it },
                    onPick = { selectedMealId = it.id },
                    onCreate = ::createMealAndSelect,
                )
            }

            FieldLabel(stringResource(Res.string.field_date))
            val yesterday = today().minus(DatePeriod(days = 1))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SelectablePill(stringResource(Res.string.today), date == today(), onClick = { date = today() })
                SelectablePill(stringResource(Res.string.yesterday), date == yesterday, onClick = { date = yesterday })
                val custom = date != today() && date != yesterday
                SelectablePill(
                    if (custom) longDate(date) else stringResource(Res.string.entry_other_date),
                    selected = custom,
                    onClick = { showDatePicker = true },
                    icon = Lucide.Calendar,
                )
            }

            FieldLabel(stringResource(Res.string.field_photo))
            PhotoSlot(photoUrl, { photoUrl = it })

            AppTextField(
                notes,
                { notes = it },
                stringResource(Res.string.field_notes),
                singleLine = false,
                minLines = 3,
                placeholder = stringResource(Res.string.entry_notes_placeholder),
            )
            error?.let { Text(it, color = colors.destructive, style = MaterialTheme.typography.bodyMedium) }
        }

        Box(Modifier.fillMaxWidth().background(colors.background).navigationBarsPadding().padding(20.dp)) {
            PrimaryButton(
                stringResource(Res.string.save),
                onClick = ::save,
                enabled = selectedMealId != null,
                loading = saving,
                icon = Lucide.Check,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }

    if (showDatePicker) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = date.atStartOfDayIn(TimeZone.UTC).toEpochMilliseconds(),
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let {
                        date = Instant.fromEpochMilliseconds(it).toLocalDateTime(TimeZone.UTC).date
                    }
                    showDatePicker = false
                }) { Text("OK", color = colors.foreground) }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text(stringResource(Res.string.cancel), color = colors.foreground)
                }
            },
            shape = AppShapes.card,
            colors = DatePickerDefaults.colors(containerColor = colors.card),
        ) {
            DatePicker(
                state = state,
                colors = DatePickerDefaults.colors(
                    containerColor = colors.card,
                    selectedDayContainerColor = colors.primary,
                    selectedDayContentColor = colors.onPrimary,
                    todayDateBorderColor = colors.primary,
                    todayContentColor = colors.foreground,
                ),
            )
        }
    }
}

@Composable
private fun MealPicker(
    meals: List<Meal>,
    query: String,
    onQueryChange: (String) -> Unit,
    onPick: (Meal) -> Unit,
    onCreate: (String) -> Unit,
) {
    val colors = AppTheme.colors
    val q = query.trim()
    val matches = remember(meals, q) {
        if (q.isEmpty()) meals else meals.filter { it.title.contains(q, ignoreCase = true) }
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        SearchField(query, onQueryChange, stringResource(Res.string.meals_search))
        SoftCard(Modifier.fillMaxWidth(), contentPadding = PaddingValues(6.dp)) {
            matches.take(8).forEach { meal ->
                Row(
                    Modifier.fillMaxWidth().clip(AppShapes.tile).clickable { onPick(meal) }.padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    MealImage(meal.defaultPhotoUrl, Modifier.size(44.dp), iconSize = 20.dp, seed = meal.title)
                    Spacer(Modifier.width(12.dp))
                    TitleText(meal.title, Modifier.weight(1f), style = MaterialTheme.typography.titleSmall)
                    LIcon(Lucide.ChevronRight, size = 16.dp, tint = colors.mutedForeground)
                }
            }
            if (q.isNotEmpty() && meals.none { it.title.equals(q, ignoreCase = true) }) {
                Row(
                    Modifier.fillMaxWidth().clip(AppShapes.tile).clickable { onCreate(q) }.padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconBadge(Lucide.Plus, tint = colors.primary, size = 44.dp)
                    Spacer(Modifier.width(12.dp))
                    Text(
                        stringResource(Res.string.entry_new_meal_named, q),
                        style = MaterialTheme.typography.titleSmall,
                        color = colors.foreground,
                    )
                }
            }
        }
    }
}
