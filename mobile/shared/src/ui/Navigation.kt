package de.parndt.cooking_diary.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import de.parndt.cooking_diary.data.Entry
import kotlinx.datetime.LocalDate

sealed interface Route {
    data object Diary : Route
    data object Meals : Route
    data object Analytics : Route
    data object Settings : Route
    data class MealDetail(val mealId: String) : Route
    data class MealEdit(val mealId: String?) : Route
    data class EntryEdit(
        val entry: Entry? = null,
        val presetMealId: String? = null,
        val presetDate: LocalDate? = null,
    ) : Route
    data object Categories : Route
}

val Route.isTab: Boolean
    get() = this == Route.Diary || this == Route.Meals || this == Route.Analytics || this == Route.Settings

/** Minimal back stack: tabs are roots, detail screens are pushed on top. */
class Navigator {
    private val stack = mutableStateListOf<Route>(Route.Diary)

    val current: Route get() = stack.last()
    val canGoBack: Boolean get() = stack.size > 1

    /** The tab that owns the current screen, used to highlight the bottom bar. */
    val currentTab: Route get() = stack.first()

    fun push(route: Route) {
        stack.add(route)
    }

    fun pop() {
        if (canGoBack) stack.removeAt(stack.lastIndex)
    }

    fun switchTab(tab: Route) {
        stack.clear()
        stack.add(tab)
    }
}

/** System back gesture/button; a no-op where the platform has no global back action (iOS). */
@Composable
expect fun PlatformBackHandler(enabled: Boolean, onBack: () -> Unit)
