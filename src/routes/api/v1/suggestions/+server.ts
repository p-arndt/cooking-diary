import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api';
import { AnalyticsService } from '$lib/server/services/analytics.service';
import { MealService } from '$lib/server/services/meal.service';
import { SettingsService } from '$lib/server/services/settings.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	const settings = await SettingsService.getSettings(user.id);

	const preferredCategoryIds = settings.suggestionUseDayOfWeek
		? (await AnalyticsService.getTopCategoriesForDay(user.id, new Date().getDay(), 3)).map(
				(p) => p.categoryId
			)
		: [];

	const meals = await MealService.getMealsForSuggestion(user.id, {
		daysThreshold: settings.suggestionDaysThreshold,
		excludedCategoryIds: settings.suggestionExcludedCategoryIds,
		preferredCategoryIds
	});
	return json({ meals });
};
