package de.parndt.cooking_diary.data

import kotlinx.datetime.LocalDate
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val name: String,
    val email: String,
    val image: String? = null,
)

@Serializable
data class AuthResponse(val token: String, val user: User)

@Serializable
data class Category(val id: String, val name: String)

@Serializable
data class CategoryMealRef(val id: String, val title: String)

@Serializable
data class CategoryWithMeals(
    val id: String,
    val name: String,
    val meals: List<CategoryMealRef> = emptyList(),
)

enum class Difficulty(val apiValue: String) {
    Easy("easy"), Medium("medium"), Hard("hard");

    companion object {
        fun fromApi(value: String?): Difficulty? = entries.firstOrNull { it.apiValue == value }
    }
}

@Serializable
data class Meal(
    val id: String,
    val title: String,
    val defaultNotes: String? = null,
    val defaultPhotoUrl: String? = null,
    val prepTime: String? = null,
    val cookTime: String? = null,
    val difficulty: String? = null,
    val categories: List<Category> = emptyList(),
)

@Serializable
data class MealDetail(
    val id: String,
    val title: String,
    val defaultNotes: String? = null,
    val defaultPhotoUrl: String? = null,
    val prepTime: String? = null,
    val cookTime: String? = null,
    val difficulty: String? = null,
    val categories: List<Category> = emptyList(),
    val entries: List<Entry> = emptyList(),
) {
    fun asMeal() = Meal(id, title, defaultNotes, defaultPhotoUrl, prepTime, cookTime, difficulty, categories)
}

@Serializable
data class EntryMeal(
    val id: String,
    val title: String,
    val defaultPhotoUrl: String? = null,
    val categories: List<Category> = emptyList(),
)

@Serializable
data class Entry(
    val id: String,
    val mealId: String,
    /** ISO date or datetime; the calendar day is always the first 10 characters. */
    val dateCooked: String,
    val notes: String? = null,
    val photoUrls: List<String>? = null,
    val meal: EntryMeal? = null,
) {
    val date: LocalDate get() = LocalDate.parse(dateCooked.take(10))
    val photoUrl: String? get() = photoUrls?.firstOrNull() ?: meal?.defaultPhotoUrl
}

@Serializable
data class EntriesPage(val entries: List<Entry>, val hasMore: Boolean = false)

@Serializable
data class MealsResponse(val meals: List<Meal>)

@Serializable
data class CategoriesResponse(val categories: List<CategoryWithMeals>)

@Serializable
data class GeneralStats(
    val totalEntries: Int = 0,
    val totalMeals: Int = 0,
    val totalCategories: Int = 0,
    val entriesWithPhotos: Int = 0,
    val entriesWithNotes: Int = 0,
    val averageEntriesPerWeek: Double = 0.0,
    /** 0 = Sunday … 6 = Saturday (Postgres DOW). */
    val mostActiveDay: Int? = null,
)

@Serializable
data class TopMeal(val mealId: String, val mealTitle: String, val count: Int)

@Serializable
data class CategoryStat(
    val categoryId: String,
    val categoryName: String,
    val entryCount: Int,
    val mealCount: Int,
)

@Serializable
data class MonthlyStat(val year: Int, val month: Int, val count: Int)

@Serializable
data class Analytics(
    val general: GeneralStats = GeneralStats(),
    val topMeals: List<TopMeal> = emptyList(),
    val categories: List<CategoryStat> = emptyList(),
    val monthly: List<MonthlyStat> = emptyList(),
)

@Serializable
data class SuggestionSettings(
    val suggestionDaysThreshold: Int = 14,
    val suggestionUseDayOfWeek: Boolean = true,
    val suggestionExcludedCategoryIds: List<String> = emptyList(),
)

@Serializable
data class MealInput(
    val title: String,
    val defaultNotes: String? = null,
    val defaultPhotoUrl: String? = null,
    val prepTime: String? = null,
    val cookTime: String? = null,
    val difficulty: String? = null,
    val categoryIds: List<String> = emptyList(),
)

@Serializable
data class EntryInput(
    val mealId: String,
    val dateCooked: String,
    val notes: String? = null,
    val photoUrls: List<String>? = null,
)

@Serializable
internal data class SignInBody(val email: String, val password: String)

@Serializable
internal data class SignUpBody(val name: String, val email: String, val password: String)

@Serializable
internal data class NameBody(val name: String)

@Serializable
internal data class UploadResponse(val url: String)

@Serializable
internal data class ErrorBody(val error: String? = null, val message: String? = null)
