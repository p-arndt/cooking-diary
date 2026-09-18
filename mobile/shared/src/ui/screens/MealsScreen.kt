package de.parndt.cooking_diary.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.data.Meal
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.categories_title
import de.parndt.cooking_diary.resources.meals_empty
import de.parndt.cooking_diary.resources.meals_new
import de.parndt.cooking_diary.resources.meals_search
import de.parndt.cooking_diary.resources.nav_meals
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.components.CircleIconButton
import de.parndt.cooking_diary.ui.components.EmptyState
import de.parndt.cooking_diary.ui.components.ErrorState
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.MealImage
import de.parndt.cooking_diary.ui.components.Pill
import de.parndt.cooking_diary.ui.components.PrimaryButton
import de.parndt.cooking_diary.ui.components.SearchField
import de.parndt.cooking_diary.ui.components.TitleText
import de.parndt.cooking_diary.ui.components.difficultyLabel
import de.parndt.cooking_diary.ui.components.softShadow
import de.parndt.cooking_diary.ui.theme.AppShapes
import de.parndt.cooking_diary.ui.theme.AppTheme
import org.jetbrains.compose.resources.stringResource
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.clip

@Composable
fun MealsScreen() {
    val session = LocalSession.current
    val navigator = LocalNavigator.current
    val store = session.meals
    var query by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(Unit) { store.ensureLoaded() }

    val filtered = remember(store.meals, query) {
        val q = query.trim().lowercase()
        if (q.isEmpty()) store.meals
        else store.meals.filter { meal ->
            meal.title.lowercase().contains(q) || meal.categories.any { it.name.lowercase().contains(q) }
        }
    }

    PullToRefreshBox(
        isRefreshing = store.loading && store.meals.isNotEmpty(),
        onRefresh = { store.refresh() },
        modifier = Modifier.fillMaxSize(),
    ) {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = TabContentPadding,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxSize(),
        ) {
            item(span = { GridItemSpan(2) }) {
                ScreenHeader(title = stringResource(Res.string.nav_meals)) {
                    CircleIconButton(
                        Lucide.Plus,
                        onClick = { navigator.push(Route.MealEdit(null)) },
                        container = AppTheme.colors.primary,
                        content = AppTheme.colors.onPrimary,
                        contentDescription = stringResource(Res.string.meals_new),
                    )
                }
            }
            item(span = { GridItemSpan(2) }) {
                Column {
                    SearchField(query, { query = it }, stringResource(Res.string.meals_search))
                    Spacer(Modifier.height(12.dp))
                    Pill(
                        stringResource(Res.string.categories_title),
                        icon = Lucide.Tags,
                        onClick = { navigator.push(Route.Categories) },
                    )
                }
            }
            when {
                store.meals.isEmpty() && store.loading -> item(span = { GridItemSpan(2) }) { LoadingState() }
                store.meals.isEmpty() && store.error != null -> item(span = { GridItemSpan(2) }) {
                    ErrorState(store.error!!, onRetry = store::refresh)
                }
                filtered.isEmpty() -> item(span = { GridItemSpan(2) }) {
                    EmptyState(
                        Lucide.ChefHat,
                        stringResource(Res.string.meals_empty),
                        action = {
                            PrimaryButton(
                                stringResource(Res.string.meals_new),
                                icon = Lucide.Plus,
                                onClick = { navigator.push(Route.MealEdit(null)) },
                            )
                        },
                    )
                }
                else -> items(filtered, key = { it.id }) { meal ->
                    MealGridCard(meal, onClick = { navigator.push(Route.MealDetail(meal.id)) })
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MealGridCard(meal: Meal, onClick: () -> Unit) {
    val colors = AppTheme.colors
    Column(Modifier.clip(AppShapes.tile).clickable(onClick = onClick)) {
        MealImage(
            meal.defaultPhotoUrl,
            Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .softShadow(AppShapes.card, dark = colors.isDark),
            shape = AppShapes.card,
            iconSize = 40.dp,
            seed = meal.title,
        )
        TitleText(meal.title, Modifier.padding(top = 10.dp, start = 4.dp, end = 4.dp), maxLines = 2)
        val chips = listOfNotNull(meal.cookTime?.let { Lucide.Flame to it }, difficultyLabel(meal.difficulty)?.let { Lucide.Gauge to it })
        if (chips.isNotEmpty()) {
            FlowRow(
                Modifier.padding(top = 6.dp, start = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                chips.forEach { (icon, text) -> Pill(text, icon = icon) }
            }
        }
    }
}

