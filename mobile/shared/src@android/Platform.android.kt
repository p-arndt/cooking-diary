package de.parndt.cooking_diary.data

/** Set by MainActivity from the app's debuggable flag, which only debug builds carry. */
var isDebugBuild: Boolean = false

actual fun defaultServerUrl(): String = if (isDebugBuild) "http://10.0.2.2:5173" else PRODUCTION_SERVER_URL
