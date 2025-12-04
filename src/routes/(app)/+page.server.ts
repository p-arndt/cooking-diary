import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { EntryService } from '$lib/server/services/entry.service';
import { MealService } from '$lib/server/services/meal.service';
import { SettingsService } from '$lib/server/services/settings.service';
import { AnalyticsService } from '$lib/server/services/analytics.service';
import { getMonthStart, getMonthEnd } from '$lib/utils/date';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const view = url.searchParams.get('view') || 'timeline'; // 'calendar' or 'timeline'
	const monthParam = url.searchParams.get('month');
	const searchMealId = url.searchParams.get('meal');
	
	const currentDate = monthParam ? new Date(monthParam) : new Date();
	const monthStart = getMonthStart(currentDate);
	const monthEnd = getMonthEnd(currentDate);

	// Get entries for the current month
	const entries = await EntryService.getEntriesByDateRange(
		locals.user.id,
		monthStart,
		monthEnd
	);

	// Get dates with entries for calendar highlighting
	const datesWithEntries = await EntryService.getDatesWithEntries(
		locals.user.id,
		monthStart,
		monthEnd
	);

	// For timeline view, get paginated entries
	const timelineData = view === 'timeline' 
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

	// Get entries for searched meal
	const searchedMealEntries = searchMealId 
		? await EntryService.getEntriesByMealId(locals.user.id, searchMealId)
		: [];

	const searchedMeal = searchMealId 
		? meals.find(m => m.id === searchMealId) || null
		: null;

	return {
		user: locals.user,
		view,
		entries,
		timelineEntries,
		hasMoreEntries,
		datesWithEntries,
		currentMonth: currentDate.toISOString(),
		meals,
		suggestionMeals,
		searchMealId,
		searchedMeal,
		searchedMealEntries
	};
};
