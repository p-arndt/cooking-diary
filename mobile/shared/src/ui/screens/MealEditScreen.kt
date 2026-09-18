package de.parndt.cooking_diary.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.data.Category
import de.parndt.cooking_diary.data.Difficulty
import de.parndt.cooking_diary.data.MealInput
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.categories_new
import de.parndt.cooking_diary.resources.field_categories
import de.parndt.cooking_diary.resources.field_cook_time
import de.parndt.cooking_diary.resources.field_difficulty
import de.parndt.cooking_diary.resources.field_notes
import de.parndt.cooking_diary.resources.field_photo
import de.parndt.cooking_diary.resources.field_prep_time
import de.parndt.cooking_diary.resources.field_title
import de.parndt.cooking_diary.resources.meals_edit
import de.parndt.cooking_diary.resources.meals_new
import de.parndt.cooking_diary.resources.save
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.components.AppTextField
import de.parndt.cooking_diary.ui.components.CircleIconButton
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.PhotoSlot
import de.parndt.cooking_diary.ui.components.PrimaryButton
import de.parndt.cooking_diary.ui.components.SelectablePill
import de.parndt.cooking_diary.ui.components.difficultyLabel
import de.parndt.cooking_diary.ui.theme.AppTheme
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MealEditScreen(mealId: String?) {
    val session = LocalSession.current
    val navigator = LocalNavigator.current
    val colors = AppTheme.colors
    val scope = rememberCoroutineScope()

    var loaded by remember { mutableStateOf(mealId == null) }
    var title by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var prepTime by remember { mutableStateOf("") }
    var cookTime by remember { mutableStateOf("") }
    var difficulty by remember { mutableStateOf<Difficulty?>(null) }
    var photoUrl by remember { mutableStateOf<String?>(null) }
    val selectedCategories = remember { mutableStateListOf<String>() }
    var allCategories by remember { mutableStateOf<List<Category>>(emptyList()) }
    var newCategory by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(mealId) {
        runCatching { session.api.categories() }.onSuccess { list ->
            allCategories = list.map { Category(it.id, it.name) }.sortedBy { it.name.lowercase() }
        }
        if (mealId != null) {
            runCatching { session.api.meal(mealId) }.onSuccess { meal ->
                title = meal.title
                notes = meal.defaultNotes.orEmpty()
                prepTime = meal.prepTime.orEmpty()
                cookTime = meal.cookTime.orEmpty()
                difficulty = Difficulty.fromApi(meal.difficulty)
                photoUrl = meal.defaultPhotoUrl
                selectedCategories.addAll(meal.categories.map { it.id })
                loaded = true
            }.onFailure { error = it.message }
        }
    }

    fun addCategory() {
        val name = newCategory.trim()
        if (name.isEmpty()) return
        scope.launch {
            runCatching { session.api.createCategory(name) }.onSuccess { created ->
                allCategories = (allCategories + created).sortedBy { it.name.lowercase() }
                selectedCategories.add(created.id)
                newCategory = ""
            }
        }
    }

    fun save() {
        if (title.isBlank() || saving) return
        saving = true
        error = null
        val input = MealInput(
            title = title.trim(),
            defaultNotes = notes.trim().ifEmpty { null },
            defaultPhotoUrl = photoUrl,
            prepTime = prepTime.trim().ifEmpty { null },
            cookTime = cookTime.trim().ifEmpty { null },
            difficulty = difficulty?.apiValue,
            categoryIds = selectedCategories.toList(),
        )
        scope.launch {
            try {
                val saved = if (mealId == null) session.api.createMeal(input) else session.api.updateMeal(mealId, input)
                session.invalidate()
                navigator.pop()
                if (mealId == null) navigator.push(Route.MealDetail(saved.id))
            } catch (e: Exception) {
                error = e.message
            } finally {
                saving = false
            }
        }
    }

    Column(Modifier.fillMaxSize().imePadding()) {
        DetailTopBar(stringResource(if (mealId == null) Res.string.meals_new else Res.string.meals_edit), onBack = navigator::pop)
        if (!loaded) {
            if (error != null) Text(error!!, color = colors.destructive, modifier = Modifier.padding(20.dp)) else LoadingState()
            return@Column
        }
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            AppTextField(title, { title = it }, stringResource(Res.string.field_title))
            FieldLabel(stringResource(Res.string.field_photo))
            PhotoSlot(photoUrl, { photoUrl = it })
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AppTextField(prepTime, { prepTime = it }, stringResource(Res.string.field_prep_time), Modifier.weight(1f), leadingIcon = Lucide.Clock)
                AppTextField(cookTime, { cookTime = it }, stringResource(Res.string.field_cook_time), Modifier.weight(1f), leadingIcon = Lucide.Flame)
            }
            FieldLabel(stringResource(Res.string.field_difficulty))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Difficulty.entries.forEach { level ->
                    SelectablePill(
                        text = difficultyLabel(level.apiValue).orEmpty(),
                        selected = difficulty == level,
                        onClick = { difficulty = if (difficulty == level) null else level },
                    )
                }
            }
            FieldLabel(stringResource(Res.string.field_categories))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                allCategories.forEach { category ->
                    val selected = category.id in selectedCategories
                    SelectablePill(category.name, selected, onClick = {
                        if (selected) selectedCategories.remove(category.id) else selectedCategories.add(category.id)
                    })
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AppTextField(newCategory, { newCategory = it }, stringResource(Res.string.categories_new), Modifier.weight(1f), leadingIcon = Lucide.Tags)
                CircleIconButton(Lucide.Plus, onClick = ::addCategory, container = colors.secondary, content = colors.onSecondary, size = 48.dp)
            }
            AppTextField(notes, { notes = it }, stringResource(Res.string.field_notes), singleLine = false, minLines = 3)
            error?.let { Text(it, color = colors.destructive, style = MaterialTheme.typography.bodyMedium) }
        }
        Box(Modifier.fillMaxWidth().background(colors.background).navigationBarsPadding().padding(20.dp)) {
            PrimaryButton(
                stringResource(Res.string.save),
                onClick = ::save,
                enabled = title.isNotBlank(),
                loading = saving,
                icon = Lucide.Check,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
fun FieldLabel(text: String) {
    Text(text, style = MaterialTheme.typography.titleSmall, color = AppTheme.colors.mutedForeground)
}
