package de.parndt.cooking_diary.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyListScope
import de.parndt.cooking_diary.resources.diary_day_empty
import de.parndt.cooking_diary.resources.diary_view_month
import de.parndt.cooking_diary.resources.diary_view_timeline
import de.parndt.cooking_diary.resources.diary_view_week
import de.parndt.cooking_diary.resources.diary_week_empty
import de.parndt.cooking_diary.state.DiaryStore
import de.parndt.cooking_diary.state.DiaryView
import de.parndt.cooking_diary.ui.Navigator
import de.parndt.cooking_diary.ui.components.CompactEmptyState
import de.parndt.cooking_diary.ui.components.MonthGrid
import de.parndt.cooking_diary.ui.components.PeriodHeader
import de.parndt.cooking_diary.ui.components.SegmentedControl
import de.parndt.cooking_diary.ui.components.SoftCard
import de.parndt.cooking_diary.ui.components.WeekStrip
import de.parndt.cooking_diary.ui.components.monthGridDays
import de.parndt.cooking_diary.ui.components.startOfMonth
import de.parndt.cooking_diary.ui.components.startOfWeek
import de.parndt.cooking_diary.ui.monthLong
import de.parndt.cooking_diary.ui.weekRangeLabel
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.plus
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import de.parndt.cooking_diary.LocalNavigator
import de.parndt.cooking_diary.LocalSession
import de.parndt.cooking_diary.data.Entry
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.app_name
import de.parndt.cooking_diary.resources.diary_empty
import de.parndt.cooking_diary.resources.diary_end
import de.parndt.cooking_diary.resources.entry_delete_confirm
import de.parndt.cooking_diary.resources.greeting_afternoon
import de.parndt.cooking_diary.resources.greeting_evening
import de.parndt.cooking_diary.resources.greeting_morning
import de.parndt.cooking_diary.resources.nav_add_entry
import de.parndt.cooking_diary.resources.stat_entries
import de.parndt.cooking_diary.resources.stat_meals
import de.parndt.cooking_diary.resources.stat_per_week
import de.parndt.cooking_diary.ui.Lucide
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.components.DateDivider
import de.parndt.cooking_diary.ui.components.EmptyState
import de.parndt.cooking_diary.ui.components.EntryCard
import de.parndt.cooking_diary.ui.components.ErrorState
import de.parndt.cooking_diary.ui.components.LoadingState
import de.parndt.cooking_diary.ui.components.PrimaryButton
import de.parndt.cooking_diary.ui.components.StatTile
import de.parndt.cooking_diary.ui.components.SuggestionHero
import de.parndt.cooking_diary.ui.components.formatStat
import de.parndt.cooking_diary.ui.relativeDayLabel
import de.parndt.cooking_diary.ui.theme.AppTheme
import de.parndt.cooking_diary.ui.today
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource
import kotlin.time.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

@Composable
fun DiaryScreen() {
    val session = LocalSession.current
    val navigator = LocalNavigator.current
    val store = session.diary
    val colors = AppTheme.colors
    val scope = rememberCoroutineScope()
    var pendingDelete by remember { mutableStateOf<Entry?>(null) }

    var weekStart by remember { mutableStateOf(today().startOfWeek()) }
    var weekSelected by remember { mutableStateOf<LocalDate?>(null) }
    var monthStart by remember { mutableStateOf(today().startOfMonth()) }
    var monthSelected by remember { mutableStateOf(today()) }

    LaunchedEffect(Unit) { store.ensureLoaded() }

    val range: Pair<LocalDate, LocalDate>? = when (store.view) {
        DiaryView.Week -> weekStart to weekStart.plus(DatePeriod(days = 6))
        DiaryView.Month -> monthGridDays(monthStart).let { it.first() to it.last() }
        DiaryView.Timeline -> null
    }
    LaunchedEffect(range) { range?.let { (from, to) -> store.loadRange(from, to) } }
    val rangeEntries = range?.let { (from, to) -> store.entriesInRange(from, to) }
    val daysWithEntries = remember(rangeEntries) { rangeEntries.orEmpty().map { it.date }.toSet() }

    val listState = rememberLazyListState()
    val nearEnd by remember {
        derivedStateOf {
            val last = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= listState.layoutInfo.totalItemsCount - 4
        }
    }
    LaunchedEffect(nearEnd, store.entries.size, store.view) {
        if (nearEnd && store.view == DiaryView.Timeline) store.loadMore()
    }

    fun addFor(date: LocalDate) = navigator.push(Route.EntryEdit(presetDate = date))

    val entryCard: @Composable (Entry) -> Unit = { entry ->
        EntryCard(
            entry = entry,
            onClick = { navigator.push(Route.MealDetail(entry.mealId)) },
            onEdit = { navigator.push(Route.EntryEdit(entry = entry)) },
            onDelete = { pendingDelete = entry },
        )
    }

    PullToRefreshBox(
        isRefreshing = store.loading && store.entries.isNotEmpty(),
        onRefresh = { store.refresh() },
        modifier = Modifier.fillMaxSize(),
    ) {
        LazyColumn(
            state = listState,
            contentPadding = TabContentPadding,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxSize(),
        ) {
            item(key = "header") {
                ScreenHeader(title = stringResource(Res.string.app_name), eyebrow = greeting(session.userName))
            }
            item(key = "hero") {
                SuggestionHero(
                    meals = store.suggestions,
                    onCookToday = { navigator.push(Route.EntryEdit(presetMealId = it.id)) },
                    onOpen = { navigator.push(Route.MealDetail(it.id)) },
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
            store.stats?.let { stats ->
                item(key = "stats") {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        StatTile(Lucide.BookOpen, colors.primary, stats.totalEntries.toString(), stringResource(Res.string.stat_entries), Modifier.weight(1f), compact = true)
                        StatTile(Lucide.UtensilsCrossed, colors.accent, stats.totalMeals.toString(), stringResource(Res.string.stat_meals), Modifier.weight(1f), compact = true)
                        StatTile(Lucide.TrendingUp, colors.teal, formatStat(stats.averageEntriesPerWeek), stringResource(Res.string.stat_per_week), Modifier.weight(1f), compact = true)
                    }
                }
            }
            item(key = "view-toggle") {
                SegmentedControl(
                    options = listOf(
                        DiaryView.Week to stringResource(Res.string.diary_view_week),
                        DiaryView.Month to stringResource(Res.string.diary_view_month),
                        DiaryView.Timeline to stringResource(Res.string.diary_view_timeline),
                    ),
                    selected = store.view,
                    onSelect = store::selectView,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }

            when (store.view) {
                DiaryView.Week -> {
                    val weekEnd = weekStart.plus(DatePeriod(days = 6))
                    fun shiftWeek(weeks: Int) {
                        weekStart = weekStart.plus(DatePeriod(days = 7 * weeks))
                        weekSelected = null
                    }
                    item(key = "week-header") {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            PeriodHeader(
                                title = weekRangeLabel(weekStart, weekEnd),
                                onPrev = { shiftWeek(-1) },
                                onNext = { shiftWeek(1) },
                                showToday = weekStart != today().startOfWeek(),
                                onToday = { weekStart = today().startOfWeek(); weekSelected = null },
                            )
                            WeekStrip(
                                weekStart = weekStart,
                                selected = weekSelected,
                                daysWithEntries = daysWithEntries,
                                onSelect = { weekSelected = if (weekSelected == it) null else it },
                                onSwipe = { forward -> shiftWeek(if (forward) 1 else -1) },
                            )
                        }
                    }
                    val visible = rangeEntries?.filter { weekSelected == null || it.date == weekSelected }
                    rangeContent(
                        entries = visible,
                        error = store.rangeError,
                        emptyMessage = { stringResource(if (weekSelected == null) Res.string.diary_week_empty else Res.string.diary_day_empty) },
                        onAdd = { addFor(weekSelected ?: today().takeIf { it in weekStart..weekEnd } ?: weekStart) },
                        onRetry = { store.loadRange(weekStart, weekEnd, force = true) },
                        entryCard = entryCard,
                    )
                }
                DiaryView.Month -> {
                    fun shiftMonth(months: Int) {
                        monthStart = monthStart.plus(DatePeriod(months = months))
                        monthSelected = if (monthStart == today().startOfMonth()) today() else monthStart
                    }
                    item(key = "month-grid") {
                        SoftCard(Modifier.fillMaxWidth()) {
                            PeriodHeader(
                                title = "${monthLong(monthStart.month.ordinal + 1)} ${monthStart.year}",
                                onPrev = { shiftMonth(-1) },
                                onNext = { shiftMonth(1) },
                                showToday = monthStart != today().startOfMonth(),
                                onToday = { monthStart = today().startOfMonth(); monthSelected = today() },
                            )
                            Spacer(Modifier.height(10.dp))
                            MonthGrid(
                                monthStart = monthStart,
                                selected = monthSelected,
                                daysWithEntries = daysWithEntries,
                                onSelect = { monthSelected = it },
                                onSwipe = { forward -> shiftMonth(if (forward) 1 else -1) },
                            )
                        }
                    }
                    item(key = "month-day-title") {
                        DateDivider(relativeDayLabel(monthSelected), highlight = monthSelected == today(), modifier = Modifier.padding(top = 8.dp))
                    }
                    val visible = rangeEntries?.filter { it.date == monthSelected }
                    rangeContent(
                        entries = visible,
                        error = store.rangeError,
                        emptyMessage = { stringResource(Res.string.diary_day_empty) },
                        onAdd = { addFor(monthSelected) },
                        onRetry = { range?.let { (from, to) -> store.loadRange(from, to, force = true) } },
                        entryCard = entryCard,
                        grouped = false,
                    )
                }
                DiaryView.Timeline -> timelineContent(store, navigator, entryCard)
            }
        }
    }

    pendingDelete?.let { entry ->
        ConfirmDeleteDialog(
            text = stringResource(Res.string.entry_delete_confirm),
            onDismiss = { pendingDelete = null },
            onConfirm = {
                pendingDelete = null
                scope.launch {
                    runCatching { session.api.deleteEntry(entry.id) }.onSuccess { session.invalidate() }
                }
            },
        )
    }
}

/** Entries of a week/month range grouped by day (newest first), or a compact empty state. */
private fun LazyListScope.rangeContent(
    entries: List<Entry>?,
    error: String?,
    emptyMessage: @Composable () -> String,
    onAdd: () -> Unit,
    onRetry: () -> Unit,
    entryCard: @Composable (Entry) -> Unit,
    grouped: Boolean = true,
) {
    when {
        entries == null && error != null -> item(key = "range-error") { ErrorState(error, onRetry = onRetry) }
        entries == null -> item(key = "range-loading") { LoadingState() }
        entries.isEmpty() -> item(key = "range-empty") { CompactEmptyState(emptyMessage(), onAdd = onAdd) }
        !grouped -> items(entries, key = { "r-" + it.id }) { entryCard(it) }
        else -> entries.groupBy { it.date }.toList().sortedByDescending { it.first }.forEach { (date, dayEntries) ->
            item(key = "range-date-$date") {
                DateDivider(relativeDayLabel(date), highlight = date == today(), modifier = Modifier.padding(top = 8.dp))
            }
            items(dayEntries, key = { "r-" + it.id }) { entryCard(it) }
        }
    }
}

private fun LazyListScope.timelineContent(
    store: DiaryStore,
    navigator: Navigator,
    entryCard: @Composable (Entry) -> Unit,
) {
    when {
        store.entries.isEmpty() && store.loading -> item(key = "loading") { LoadingState() }
        store.entries.isEmpty() && store.error != null -> item(key = "error") {
            ErrorState(store.error!!, onRetry = store::refresh)
        }
        store.entries.isEmpty() -> item(key = "empty") {
            EmptyState(
                icon = Lucide.ChefHat,
                message = stringResource(Res.string.diary_empty),
                modifier = Modifier.padding(top = 12.dp),
                action = {
                    PrimaryButton(
                        stringResource(Res.string.nav_add_entry),
                        icon = Lucide.Plus,
                        onClick = { navigator.push(Route.EntryEdit()) },
                    )
                },
            )
        }
        else -> {
            store.entries.groupBy { it.date }.toList().sortedByDescending { it.first }.forEach { (date, entries) ->
                item(key = "date-$date") {
                    DateDivider(relativeDayLabel(date), highlight = date == today(), modifier = Modifier.padding(top = 12.dp))
                }
                items(entries, key = { it.id }) { entryCard(it) }
            }
            item(key = "footer") {
                if (store.loadingMore) {
                    LoadingState()
                } else if (!store.hasMore) {
                    Text(
                        stringResource(Res.string.diary_end),
                        style = MaterialTheme.typography.bodySmall,
                        color = AppTheme.colors.mutedForeground,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun greeting(userName: String): String {
    val firstName = userName.substringBefore(' ')
    val hour = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).hour
    val res = when {
        hour < 11 -> Res.string.greeting_morning
        hour < 17 -> Res.string.greeting_afternoon
        else -> Res.string.greeting_evening
    }
    return stringResource(res, firstName)
}

