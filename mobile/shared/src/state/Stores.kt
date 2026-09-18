package de.parndt.cooking_diary.state

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import de.parndt.cooking_diary.data.Analytics
import de.parndt.cooking_diary.data.ApiClient
import de.parndt.cooking_diary.data.CategoryWithMeals
import de.parndt.cooking_diary.data.Entry
import de.parndt.cooking_diary.data.GeneralStats
import de.parndt.cooking_diary.data.Meal
import de.parndt.cooking_diary.data.SessionStore
import de.parndt.cooking_diary.data.SuggestionSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.datetime.LocalDate

/**
 * Screen state for one signed-in session. Tab screens keep their data here so switching tabs
 * doesn't refetch; [invalidate] refreshes everything after a mutation.
 */
class SessionState(val api: ApiClient, val userName: String) {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    val diary = DiaryStore(api, scope)
    val meals = MealsStore(api, scope)
    val analytics = AnalyticsStore(api, scope)
    val settings = SettingsStore(api, scope)

    fun invalidate() {
        diary.refresh()
        meals.refresh()
        analytics.refresh()
        settings.refreshCategories()
    }

    fun dispose() = scope.cancel()
}

enum class DiaryView { Week, Month, Timeline }

class DiaryStore(
    private val api: ApiClient,
    private val scope: CoroutineScope,
    private val prefs: SessionStore = SessionStore(),
) {
    var view by mutableStateOf(
        prefs.diaryView?.let { saved -> DiaryView.entries.firstOrNull { it.name == saved } } ?: DiaryView.Week
    ); private set

    fun selectView(next: DiaryView) {
        view = next
        prefs.diaryView = next.name
    }

    // Week/month views fetch `from..to` ranges; cached per range, cleared on refresh.
    private val rangeCache = mutableStateMapOf<String, List<Entry>>()
    private var activeRange: Pair<LocalDate, LocalDate>? = null
    var rangeError by mutableStateOf<String?>(null); private set

    private fun rangeKey(from: LocalDate, to: LocalDate) = "$from..$to"

    fun entriesInRange(from: LocalDate, to: LocalDate): List<Entry>? = rangeCache[rangeKey(from, to)]

    fun loadRange(from: LocalDate, to: LocalDate, force: Boolean = false) {
        activeRange = from to to
        val key = rangeKey(from, to)
        if (!force && key in rangeCache) return
        scope.launch {
            rangeError = null
            runCatching { api.entriesBetween(from, to) }
                .onSuccess { rangeCache[key] = it }
                .onFailure { rangeError = it.message }
        }
    }

    var entries by mutableStateOf<List<Entry>>(emptyList()); private set
    var hasMore by mutableStateOf(false); private set
    var loading by mutableStateOf(false); private set
    var loadingMore by mutableStateOf(false); private set
    var error by mutableStateOf<String?>(null); private set
    var stats by mutableStateOf<GeneralStats?>(null); private set
    var suggestions by mutableStateOf<List<Meal>>(emptyList()); private set
    private var loaded = false
    private var job: Job? = null

    fun ensureLoaded() {
        if (!loaded) refresh()
    }

    fun refresh() {
        loaded = true
        rangeCache.clear()
        activeRange?.let { (from, to) -> loadRange(from, to, force = true) }
        job?.cancel()
        job = scope.launch {
            loading = true
            error = null
            try {
                val page = async { api.entries(limit = PAGE_SIZE) }
                val analytics = async { runCatching { api.analytics().general }.getOrNull() }
                val suggested = async { runCatching { api.suggestions() }.getOrDefault(emptyList()) }
                val result = page.await()
                entries = result.entries
                hasMore = result.hasMore
                stats = analytics.await()
                suggestions = suggested.await()
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }

    fun loadMore() {
        if (loadingMore || !hasMore || loading) return
        scope.launch {
            loadingMore = true
            try {
                val page = api.entries(limit = PAGE_SIZE, offset = entries.size)
                entries = entries + page.entries.filter { new -> entries.none { it.id == new.id } }
                hasMore = page.hasMore
            } catch (_: Exception) {
                // Keep what we have; the user can scroll again to retry.
            } finally {
                loadingMore = false
            }
        }
    }

    private companion object {
        const val PAGE_SIZE = 20
    }
}

class MealsStore(private val api: ApiClient, private val scope: CoroutineScope) {
    var meals by mutableStateOf<List<Meal>>(emptyList()); private set
    var loading by mutableStateOf(false); private set
    var error by mutableStateOf<String?>(null); private set
    private var loaded = false

    fun ensureLoaded() {
        if (!loaded) refresh()
    }

    fun refresh() {
        loaded = true
        scope.launch {
            loading = true
            error = null
            try {
                meals = api.meals().sortedBy { it.title.lowercase() }
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }
}

class AnalyticsStore(private val api: ApiClient, private val scope: CoroutineScope) {
    var data by mutableStateOf<Analytics?>(null); private set
    var loading by mutableStateOf(false); private set
    var error by mutableStateOf<String?>(null); private set
    private var loaded = false

    fun ensureLoaded() {
        if (!loaded) refresh()
    }

    fun refresh() {
        loaded = true
        scope.launch {
            loading = true
            error = null
            try {
                data = api.analytics()
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }
}

class SettingsStore(private val api: ApiClient, private val scope: CoroutineScope) {
    var settings by mutableStateOf<SuggestionSettings?>(null); private set
    var categories by mutableStateOf<List<CategoryWithMeals>>(emptyList()); private set
    var loading by mutableStateOf(false); private set
    var error by mutableStateOf<String?>(null); private set
    private var loaded = false

    fun ensureLoaded() {
        if (!loaded) refresh()
    }

    fun refresh() {
        loaded = true
        scope.launch {
            loading = true
            error = null
            try {
                val s = async { api.settings() }
                val c = async { api.categories() }
                settings = s.await()
                categories = c.await().sortedBy { it.name.lowercase() }
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }

    fun refreshCategories() {
        if (!loaded) return
        scope.launch {
            runCatching { api.categories() }.onSuccess { categories = it.sortedBy { c -> c.name.lowercase() } }
        }
    }

    /** Optimistically applies the change, then persists it; reverts on failure. */
    fun update(transform: (SuggestionSettings) -> SuggestionSettings) {
        val previous = settings ?: return
        val next = transform(previous)
        settings = next
        scope.launch {
            runCatching { api.updateSettings(next) }
                .onSuccess { settings = it }
                .onFailure { settings = previous }
        }
    }

    fun createCategory(name: String, onDone: () -> Unit = {}) = scope.launch {
        runCatching { api.createCategory(name) }.onSuccess { refreshCategories(); onDone() }
    }

    fun renameCategory(id: String, name: String) = scope.launch {
        runCatching { api.renameCategory(id, name) }.onSuccess { refreshCategories() }
    }

    fun deleteCategory(id: String, onDone: () -> Unit = {}) = scope.launch {
        runCatching { api.deleteCategory(id) }.onSuccess { refreshCategories(); onDone() }
    }
}
