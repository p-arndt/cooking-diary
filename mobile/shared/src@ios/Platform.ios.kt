package de.parndt.cooking_diary.data

import kotlin.experimental.ExperimentalNativeApi

@OptIn(ExperimentalNativeApi::class)
actual fun defaultServerUrl(): String =
    if (Platform.isDebugBinary) "http://localhost:5173" else PRODUCTION_SERVER_URL
