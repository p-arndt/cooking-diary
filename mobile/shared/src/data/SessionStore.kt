package de.parndt.cooking_diary.data

import com.russhwolf.settings.Settings
import com.russhwolf.settings.set

/** Persists the server URL and session token (SharedPreferences on Android, NSUserDefaults on iOS). */
class SessionStore(private val settings: Settings = Settings()) {
    var serverUrl: String
        get() = settings.getStringOrNull(KEY_SERVER) ?: defaultServerUrl()
        set(value) {
            settings[KEY_SERVER] = normalizeServerUrl(value)
        }

    var token: String?
        get() = settings.getStringOrNull(KEY_TOKEN)
        set(value) {
            if (value == null) settings.remove(KEY_TOKEN) else settings[KEY_TOKEN] = value
        }

    var userName: String?
        get() = settings.getStringOrNull(KEY_USER_NAME)
        set(value) {
            if (value == null) settings.remove(KEY_USER_NAME) else settings[KEY_USER_NAME] = value
        }

    /** Last selected diary view (week/month/timeline); kept across sign-outs as a UI preference. */
    var diaryView: String?
        get() = settings.getStringOrNull(KEY_DIARY_VIEW)
        set(value) {
            if (value == null) settings.remove(KEY_DIARY_VIEW) else settings[KEY_DIARY_VIEW] = value
        }

    fun clearSession() {
        token = null
        userName = null
    }

    private companion object {
        const val KEY_SERVER = "server_url"
        const val KEY_TOKEN = "session_token"
        const val KEY_USER_NAME = "user_name"
        const val KEY_DIARY_VIEW = "diary_view"
    }
}

fun normalizeServerUrl(raw: String): String {
    val trimmed = raw.trim().trimEnd('/')
    if (trimmed.isEmpty()) return trimmed
    return if ("://" in trimmed) trimmed else "https://$trimmed"
}

/** Server release builds use by default; users can switch to another one on the login screen. */
const val PRODUCTION_SERVER_URL = "https://cooking-diary.allthing.eu"

/** Debug builds point at a local dev server (emulator host alias / simulator localhost), release builds at [PRODUCTION_SERVER_URL]. */
expect fun defaultServerUrl(): String
