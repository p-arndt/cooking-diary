package de.parndt.cooking_diary.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.text.intl.Locale
import de.parndt.cooking_diary.resources.Res
import de.parndt.cooking_diary.resources.months_long
import de.parndt.cooking_diary.resources.months_short
import de.parndt.cooking_diary.resources.today
import de.parndt.cooking_diary.resources.weekdays
import de.parndt.cooking_diary.resources.yesterday
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.todayIn
import org.jetbrains.compose.resources.stringArrayResource
import org.jetbrains.compose.resources.stringResource
import kotlin.time.Clock

fun today(): LocalDate = Clock.System.todayIn(TimeZone.currentSystemDefault())

private val isGerman: Boolean get() = Locale.current.language != "en"

/** "Heute", "Gestern" or e.g. "Mittwoch, 16. Sep" / "Wednesday, Sep 16" (year added when not current). */
@Composable
fun relativeDayLabel(date: LocalDate): String {
    val now = today()
    return when (date) {
        now -> stringResource(Res.string.today)
        now.minus(DatePeriod(days = 1)) -> stringResource(Res.string.yesterday)
        else -> longDate(date, withWeekday = true)
    }
}

@Composable
fun longDate(date: LocalDate, withWeekday: Boolean = false): String {
    val weekdays = stringArrayResource(Res.array.weekdays)
    val months = stringArrayResource(Res.array.months_short)
    val weekday = weekdays.getOrElse(date.dayOfWeek.ordinal) { "" }
    val month = months.getOrElse(date.month.ordinal) { "" }
    val year = if (date.year != today().year) " ${date.year}" else ""
    val core = if (isGerman) "${date.day}. $month$year" else "$month ${date.day}$year"
    return if (withWeekday) "$weekday, $core" else core
}

@Composable
fun monthShort(month: Int): String = stringArrayResource(Res.array.months_short).getOrElse(month - 1) { "$month" }

@Composable
fun monthLong(month: Int): String = stringArrayResource(Res.array.months_long).getOrElse(month - 1) { "$month" }

/** Postgres day-of-week (0 = Sunday) to the localized weekday name. */
@Composable
fun weekdayFromDow(dow: Int): String {
    val weekdays = stringArrayResource(Res.array.weekdays)
    return weekdays.getOrElse((dow + 6) % 7) { "" }
}

/** "14.–20. Sep" / "Sep 14–20", spelling out both months when the week spans two. */
@Composable
fun weekRangeLabel(start: LocalDate, end: LocalDate): String {
    val months = stringArrayResource(Res.array.months_short)
    val m1 = months.getOrElse(start.month.ordinal) { "" }
    val m2 = months.getOrElse(end.month.ordinal) { "" }
    return if (isGerman) {
        if (start.month == end.month) "${start.day}.–${end.day}. $m2" else "${start.day}. $m1 – ${end.day}. $m2"
    } else {
        if (start.month == end.month) "$m1 ${start.day}–${end.day}" else "$m1 ${start.day} – $m2 ${end.day}"
    }
}
