package de.parndt.cooking_diary

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsTopHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import coil3.ImageLoader
import coil3.compose.setSingletonImageLoaderFactory
import coil3.network.ktor3.KtorNetworkFetcherFactory
import coil3.request.crossfade
import de.parndt.cooking_diary.data.ApiClient
import de.parndt.cooking_diary.data.SessionStore
import de.parndt.cooking_diary.state.SessionState
import de.parndt.cooking_diary.ui.Navigator
import de.parndt.cooking_diary.ui.PlatformBackHandler
import de.parndt.cooking_diary.ui.Route
import de.parndt.cooking_diary.ui.components.FloatingTabBar
import de.parndt.cooking_diary.ui.isTab
import de.parndt.cooking_diary.ui.screens.AnalyticsScreen
import de.parndt.cooking_diary.ui.screens.CategoriesScreen
import de.parndt.cooking_diary.ui.screens.DiaryScreen
import de.parndt.cooking_diary.ui.screens.EntryEditScreen
import de.parndt.cooking_diary.ui.screens.LoginScreen
import de.parndt.cooking_diary.ui.screens.MealDetailScreen
import de.parndt.cooking_diary.ui.screens.MealEditScreen
import de.parndt.cooking_diary.ui.screens.MealsScreen
import de.parndt.cooking_diary.ui.screens.SettingsScreen
import de.parndt.cooking_diary.ui.theme.AppTheme
import de.parndt.cooking_diary.ui.theme.CookingDiaryTheme
import kotlinx.coroutines.launch
import org.jetbrains.compose.reload.DevelopmentEntryPoint

val LocalApi = staticCompositionLocalOf<ApiClient> { error("ApiClient not provided") }
val LocalSession = staticCompositionLocalOf<SessionState> { error("Not signed in") }
val LocalNavigator = staticCompositionLocalOf<Navigator> { error("Navigator not provided") }

@Composable
@DevelopmentEntryPoint
fun App() {
    val store = remember { SessionStore() }
    val api = remember { ApiClient(store) }
    var session by remember {
        mutableStateOf(store.token?.let { SessionState(api, store.userName.orEmpty()) })
    }

    DisposableEffect(api) {
        api.onUnauthorized = {
            store.clearSession()
            session?.dispose()
            session = null
        }
        onDispose { api.onUnauthorized = {} }
    }

    setSingletonImageLoaderFactory { context ->
        ImageLoader.Builder(context)
            .components { add(KtorNetworkFetcherFactory(httpClient = { api.http })) }
            .crossfade(true)
            .build()
    }

    CookingDiaryTheme {
        CompositionLocalProvider(LocalApi provides api) {
            Box(Modifier.fillMaxSize().background(AppTheme.colors.background)) {
                val current = session
                if (current == null) {
                    LoginScreen(
                        store = store,
                        onSignedIn = { name -> session = SessionState(api, name) },
                    )
                } else {
                    val scope = rememberCoroutineScope()
                    SignedInApp(
                        session = current,
                        onSignOut = {
                            scope.launch {
                                api.signOut()
                                store.clearSession()
                                current.dispose()
                                session = null
                            }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun SignedInApp(session: SessionState, onSignOut: () -> Unit) {
    val navigator = remember(session) { Navigator() }
    PlatformBackHandler(enabled = navigator.canGoBack) { navigator.pop() }

    CompositionLocalProvider(LocalSession provides session, LocalNavigator provides navigator) {
        Box(Modifier.fillMaxSize()) {
            AnimatedContent(
                targetState = navigator.current,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                modifier = Modifier.fillMaxSize(),
            ) { route ->
                when (route) {
                    Route.Diary -> DiaryScreen()
                    Route.Meals -> MealsScreen()
                    Route.Analytics -> AnalyticsScreen()
                    Route.Settings -> SettingsScreen(onSignOut = onSignOut)
                    Route.Categories -> CategoriesScreen()
                    is Route.MealDetail -> MealDetailScreen(route.mealId)
                    is Route.MealEdit -> MealEditScreen(route.mealId)
                    is Route.EntryEdit -> EntryEditScreen(route.entry, route.presetMealId, route.presetDate)
                }
            }

            if (navigator.current.isTab) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .windowInsetsTopHeight(WindowInsets.statusBars)
                        .background(AppTheme.colors.background.copy(alpha = 0.94f))
                )
            }

            AnimatedVisibility(
                visible = navigator.current.isTab,
                enter = slideInVertically { it } + fadeIn(),
                exit = slideOutVertically { it } + fadeOut(),
                modifier = Modifier.align(Alignment.BottomCenter),
            ) {
                FloatingTabBar(
                    currentTab = navigator.currentTab,
                    onSelect = navigator::switchTab,
                    onAdd = { navigator.push(Route.EntryEdit()) },
                    modifier = Modifier.navigationBarsPadding().padding(horizontal = 16.dp).padding(bottom = 8.dp),
                )
            }
        }
    }
}
