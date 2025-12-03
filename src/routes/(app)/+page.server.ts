import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { EntryService } from '$lib/server/services/entry.service';
import { MealService } from '$lib/server/services/meal.service';
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

	// For timeline view, get all entries
	const timelineEntries = view === 'timeline' 
		? await EntryService.getAllEntries(locals.user.id, 50)
		: [];

	// Get meals for quick add dialog
	const meals = await MealService.getMealsByUserId(locals.user.id);

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
		datesWithEntries,
		currentMonth: currentDate.toISOString(),
		meals,
		searchMealId,
		searchedMeal,
		searchedMealEntries
	};
};
