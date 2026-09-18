package de.parndt.cooking_diary.data

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.api.createClientPlugin
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.delete
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.Url
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.datetime.LocalDate
import kotlinx.serialization.json.Json

val AppJson = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
    coerceInputValues = true
}

class ApiException(val status: HttpStatusCode?, message: String) : Exception(message) {
    val isUnauthorized get() = status == HttpStatusCode.Unauthorized
}

/** Thin wrapper around the SvelteKit JSON API (`/api/v1`) plus better-auth's email/password endpoints. */
class ApiClient(private val session: SessionStore) {
    val http = HttpClient {
        expectSuccess = false
        install(ContentNegotiation) { json(AppJson) }
        install(HttpTimeout) {
            connectTimeoutMillis = 10_000
            requestTimeoutMillis = 30_000
        }
        // Attach the session token to every request against our own server (API calls and photo loads via Coil).
        install(createClientPlugin("SessionAuth") {
            onRequest { request, _ ->
                val serverHost = runCatching { Url(baseUrl).host }.getOrNull()
                if (request.url.host == serverHost) {
                    session.token?.let { request.bearerAuth(it) }
                    request.header(HttpHeaders.AcceptLanguage, "de")
                }
            }
        })
    }

    /** Called whenever the server rejects the stored token, so the UI can return to the login screen. */
    var onUnauthorized: () -> Unit = {}

    val baseUrl: String get() = session.serverUrl

    fun absoluteUrl(path: String?): String? = when {
        path.isNullOrBlank() -> null
        path.startsWith("http://") || path.startsWith("https://") -> path
        else -> baseUrl + (if (path.startsWith("/")) path else "/$path")
    }

    private suspend fun <T> call(block: suspend () -> HttpResponse, parse: suspend (HttpResponse) -> T): T {
        val response = try {
            block()
        } catch (e: ApiException) {
            throw e
        } catch (e: Exception) {
            throw ApiException(null, e.message ?: "Network error")
        }
        if (!response.status.isSuccess()) {
            if (response.status == HttpStatusCode.Unauthorized && session.token != null) onUnauthorized()
            val text = runCatching { response.bodyAsText() }.getOrDefault("")
            val parsed = runCatching { AppJson.decodeFromString<ErrorBody>(text) }.getOrNull()
            throw ApiException(response.status, parsed?.message ?: parsed?.error ?: response.status.description)
        }
        return parse(response)
    }

    private suspend inline fun <reified T> getJson(path: String, crossinline params: HttpRequestBuilder.() -> Unit = {}): T =
        call({ http.get(baseUrl + path) { params() } }) { it.body() }

    private suspend inline fun <reified B, reified T> sendJson(method: String, path: String, body: B): T =
        call({
            val builder: HttpRequestBuilder.() -> Unit = {
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            when (method) {
                "POST" -> http.post(baseUrl + path, builder)
                else -> http.patch(baseUrl + path, builder)
            }
        }) { it.body() }

    private suspend fun deletePath(path: String) {
        call({ http.delete(baseUrl + path) }) { }
    }

    // --- Auth ---

    suspend fun signIn(email: String, password: String): AuthResponse =
        sendJson("POST", "/api/auth/sign-in/email", SignInBody(email.trim(), password))

    suspend fun signUp(name: String, email: String, password: String): AuthResponse =
        sendJson("POST", "/api/auth/sign-up/email", SignUpBody(name.trim(), email.trim(), password))

    suspend fun signOut() {
        runCatching { call({ http.post("$baseUrl/api/auth/sign-out") }) { } }
    }

    suspend fun me(): User = getJson("/api/v1/me")

    // --- Entries ---

    suspend fun entries(limit: Int = 20, offset: Int = 0): EntriesPage =
        getJson("/api/v1/entries") {
            parameter("limit", limit)
            parameter("offset", offset)
        }

    suspend fun entriesBetween(from: LocalDate, to: LocalDate): List<Entry> =
        getJson<EntriesPage>("/api/v1/entries") {
            parameter("from", from.toString())
            parameter("to", to.toString())
        }.entries

    suspend fun createEntry(input: EntryInput): Entry = sendJson("POST", "/api/v1/entries", input)

    suspend fun updateEntry(id: String, input: EntryInput): Entry = sendJson("PATCH", "/api/v1/entries/$id", input)

    suspend fun deleteEntry(id: String) = deletePath("/api/v1/entries/$id")

    // --- Meals ---

    suspend fun meals(query: String? = null): List<Meal> =
        getJson<MealsResponse>("/api/v1/meals") {
            if (!query.isNullOrBlank()) parameter("q", query)
        }.meals

    suspend fun meal(id: String): MealDetail = getJson("/api/v1/meals/$id")

    suspend fun createMeal(input: MealInput): Meal = sendJson("POST", "/api/v1/meals", input)

    suspend fun updateMeal(id: String, input: MealInput): Meal = sendJson("PATCH", "/api/v1/meals/$id", input)

    suspend fun deleteMeal(id: String) = deletePath("/api/v1/meals/$id")

    suspend fun suggestions(): List<Meal> = getJson<MealsResponse>("/api/v1/suggestions").meals

    // --- Categories ---

    suspend fun categories(): List<CategoryWithMeals> = getJson<CategoriesResponse>("/api/v1/categories").categories

    suspend fun createCategory(name: String): Category = sendJson("POST", "/api/v1/categories", NameBody(name.trim()))

    suspend fun renameCategory(id: String, name: String): Category =
        sendJson("PATCH", "/api/v1/categories/$id", NameBody(name.trim()))

    suspend fun deleteCategory(id: String) = deletePath("/api/v1/categories/$id")

    // --- Analytics & settings ---

    suspend fun analytics(): Analytics = getJson("/api/v1/analytics")

    suspend fun settings(): SuggestionSettings = getJson("/api/v1/settings")

    suspend fun updateSettings(settings: SuggestionSettings): SuggestionSettings =
        sendJson("PATCH", "/api/v1/settings", settings)

    // --- Files ---

    suspend fun uploadPhoto(bytes: ByteArray, fileName: String, mimeType: String): String =
        call({
            http.submitFormWithBinaryData(
                url = "$baseUrl/api/v1/files",
                formData = formData {
                    append("file", bytes, Headers.build {
                        append(HttpHeaders.ContentType, mimeType)
                        append(HttpHeaders.ContentDisposition, "filename=\"$fileName\"")
                    })
                },
            )
        }) { it.body<UploadResponse>().url }
}
