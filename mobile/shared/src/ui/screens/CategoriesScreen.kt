package de.parndt.cooking_diary.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.data.CategoryWithMeals
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.cancel
import de.parndt.cooking_diary.resources.categories_delete_confirm
import de.parndt.cooking_diary.resources.categories_empty
import de.parndt.cooking_diary.resources.categories_meal_count
import de.parndt.cooking_diary.resources.categories_new
import de.parndt.cooking_diary.resources.categories_title
import de.parndt.cooking_diary.resources.edit
import de.parndt.cooking_diary.resources.save
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.components.AppTextField
import de.parndt.cooking_diary.ui.components.CircleIconButton
import de.parndt.cooking_diary.ui.components.EmptyState
import de.parndt.cooking_diary.ui.components.IconBadge
import de.parndt.cooking_diary.ui.components.LIcon
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.SoftCard
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import org.jetbrains.compose.resources.stringResource

@Composable
fun CategoriesScreen() {
    val session = LocalSession.current
    val navigator = LocalNavigator.current
    val store = session.settings
    val colors = AppTheme.colors
    var newName by remember { mutableStateOf("") }
    var renaming by remember { mutableStateOf<CategoryWithMeals?>(null) }
    var deleting by remember { mutableStateOf<CategoryWithMeals?>(null) }

    LaunchedEffect(Unit) { store.ensureLoaded() }

    Column(Modifier.fillMaxSize().imePadding()) {
        DetailTopBar(stringResource(Res.string.categories_title), onBack = navigator::pop)
        LazyColumn(
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.weight(1f).navigationBarsPadding(),
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AppTextField(newName, { newName = it }, stringResource(Res.string.categories_new), Modifier.weight(1f), leadingIcon = Lucide.Tags)
                    CircleIconButton(
                        Lucide.Plus,
                        onClick = { if (newName.isNotBlank()) store.createCategory(newName) { newName = "" } },
                        container = colors.primary,
                        content = colors.onPrimary,
                        size = 52.dp,
                    )
                }
            }
            when {
                store.categories.isEmpty() && store.loading -> item { LoadingState() }
                store.categories.isEmpty() -> item { EmptyState(Lucide.Tags, stringResource(Res.string.categories_empty)) }
                else -> items(store.categories, key = { it.id }) { category ->
                    SoftCard(Modifier.fillMaxWidth(), contentPadding = PaddingValues(start = 14.dp, end = 6.dp, top = 12.dp, bottom = 12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconBadge(Lucide.Tags, tint = colors.plum, size = 38.dp)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(category.name, style = MaterialTheme.typography.titleMedium)
                                Text(
                                    stringResource(Res.string.categories_meal_count, category.meals.size),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.mutedForeground,
                                )
                            }
                            IconButton(onClick = { renaming = category }) {
                                LIcon(Lucide.Pencil, size = 18.dp, tint = colors.mutedForeground)
                            }
                            IconButton(onClick = { deleting = category }) {
                                LIcon(Lucide.Trash, size = 18.dp, tint = colors.destructive)
                            }
                        }
                    }
                }
            }
        }
    }

    renaming?.let { category ->
        var name by remember(category.id) { mutableStateOf(category.name) }
        AlertDialog(
            onDismissRequest = { renaming = null },
            shape = AppShapes.card,
            containerColor = colors.card,
            title = { Text(stringResource(Res.string.edit)) },
            text = { AppTextField(name, { name = it }, stringResource(Res.string.categories_title)) },
            confirmButton = {
                TextButton(onClick = {
                    if (name.isNotBlank()) store.renameCategory(category.id, name)
                    renaming = null
                }) { Text(stringResource(Res.string.save), color = colors.foreground) }
            },
            dismissButton = {
                TextButton(onClick = { renaming = null }) { Text(stringResource(Res.string.cancel), color = colors.mutedForeground) }
            },
        )
    }

    deleting?.let { category ->
        ConfirmDeleteDialog(
            text = stringResource(Res.string.categories_delete_confirm, category.name),
            onDismiss = { deleting = null },
            onConfirm = {
                deleting = null
                store.deleteCategory(category.id) { session.meals.refresh() }
            },
        )
    }
}

