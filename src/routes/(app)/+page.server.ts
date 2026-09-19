import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { EntryService } from '$lib/server/services/entry.service';
import { MealService } from '$lib/server/services/meal.service';
import { SettingsService } from '$lib/server/services/settings.service';
import { AnalyticsService } from '$lib/server/services/analytics.service';
import { addDays, getMonthEnd, getMonthStart, getWeekStart, toDateString } from '$lib/utils/date';

/** Malformed query params fall back to today instead of failing the page. */
function validDateOrNow(param: string | null): Date {
	const date = param ? new Date(param) : null;
	return date && !isNaN(date.getTime()) ? date : new Date();
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const view = url.searchParams.get('view') || 'week'; // 'week', 'calendar' or 'timeline'
	const monthParam = url.searchParams.get('month');
	const searchMealId = url.searchParams.get('meal');

	const currentDate = validDateOrNow(monthParam);
	const monthStart = getMonthStart(currentDate);
	const monthEnd = getMonthEnd(currentDate);

	// Get entries for the current month
	const entries = await EntryService.getEntriesByDateRange(locals.user.id, monthStart, monthEnd);

	// Get dates with entries for calendar highlighting
	const datesWithEntries = await EntryService.getDatesWithEntries(
		locals.user.id,
		monthStart,
		monthEnd
	);

	// Week boundaries as plain YYYY-MM-DD strings: parsing those yields UTC midnight,
	// which is what getEntriesByDateRange expects when it slices toISOString()
	const weekParam = url.searchParams.get('week');
	const weekStartDate = getWeekStart(validDateOrNow(weekParam && `${weekParam}T00:00:00`));
	const weekStart = toDateString(weekStartDate)!;
	const weekEnd = toDateString(addDays(weekStartDate, 6))!;
	const weekEntries =
		view === 'week'
			? await EntryService.getEntriesByDateRange(
					locals.user.id,
					new Date(weekStart),
					new Date(weekEnd)
				)
			: [];

	// For timeline view, get paginated entries
	const timelineData =
		view === 'timeline'
			? await EntryService.getAllEntries(locals.user.id, 15, 0)
			: { entries: [], hasMore: false };
	const timelineEntries = timelineData.entries;
	const hasMoreEntries = timelineData.hasMore;

	// Get meals for quick add dialog
	const meals = await MealService.getMealsByUserId(locals.user.id);

	// Get user settings and compute suggestion meals
	const settings = await SettingsService.getSettings(locals.user.id);

	// Get preferred categories for today based on patterns
	let preferredCategoryIds: string[] = [];
	if (settings.suggestionUseDayOfWeek) {
		const todayPatterns = await AnalyticsService.getTopCategoriesForDay(
			locals.user.id,
			new Date().getDay(),
			3
		);
		preferredCategoryIds = todayPatterns.map((p) => p.categoryId);
	}

	// Get meals for suggestions with user preferences
	const suggestionMeals = await MealService.getMealsForSuggestion(locals.user.id, {
		daysThreshold: settings.suggestionDaysThreshold,
		excludedCategoryIds: settings.suggestionExcludedCategoryIds || [],
		preferredCategoryIds
	});

	const stats = await AnalyticsService.getGeneralStatistics(locals.user.id);

	// Get entries for searched meal
	const searchedMealEntries = searchMealId
		? await EntryService.getEntriesByMealId(locals.user.id, searchMealId)
		: [];

	const searchedMeal = searchMealId ? meals.find((m) => m.id === searchMealId) || null : null;

	return {
		user: locals.user,
		view,
		entries,
		timelineEntries,
		hasMoreEntries,
		datesWithEntries,
		currentMonth: currentDate.toISOString(),
		weekStart,
		weekEntries,
		meals,
		suggestionMeals,
		searchMealId,
		searchedMeal,
		searchedMealEntries,
		stats: {
			totalEntries: stats.totalEntries,
			totalMeals: stats.totalMeals,
			averageEntriesPerWeek: stats.averageEntriesPerWeek
		}
	};
};
