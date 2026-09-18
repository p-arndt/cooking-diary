package de.parndt.cooking_diary

import de.parndt.cooking_diary.data.AppJson
import de.parndt.cooking_diary.data.Difficulty
import de.parndt.cooking_diary.data.EntriesPage
import de.parndt.cooking_diary.data.normalizeServerUrl
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ModelsTest {
    @Test
    fun `server url gets a scheme and loses trailing slashes`() {
        assertEquals("https://koch.example.com", normalizeServerUrl(" koch.example.com/ "))
        assertEquals("http://10.0.2.2:5173", normalizeServerUrl("http://10.0.2.2:5173//"))
    }

    @Test
    fun `entry dates are read as calendar days regardless of time part`() {
        val json = """
            {"entries":[
              {"id":"1","mealId":"m","dateCooked":"2026-09-18T00:00:00.000Z","photoUrls":[],"unknown":1,
               "meal":{"id":"m","title":"Flammkuchen","defaultPhotoUrl":"/files/a.jpg","categories":[{"id":"c","name":"Schnell"}]}},
              {"id":"2","mealId":"m","dateCooked":"2026-09-17","notes":null,"photoUrls":null}
            ],"hasMore":true}
        """.trimIndent()
        val page = AppJson.decodeFromString<EntriesPage>(json)
        assertEquals(LocalDate(2026, 9, 18), page.entries[0].date)
        assertEquals(LocalDate(2026, 9, 17), page.entries[1].date)
        assertEquals("/files/a.jpg", page.entries[0].photoUrl)
        assertNull(page.entries[1].photoUrl)
    }

    @Test
    fun `unknown difficulty maps to null`() {
        assertEquals(Difficulty.Hard, Difficulty.fromApi("hard"))
        assertNull(Difficulty.fromApi("impossible"))
    }
}
