import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { AnalyticsService } from '$lib/server/services/analytics.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const [patternsSummary, generalStats, topMeals, categoryStats, monthlyStats] = await Promise.all([
		AnalyticsService.getCookingPatternsSummary(locals.user.id),
		AnalyticsService.getGeneralStatistics(locals.user.id),
		AnalyticsService.getTopMeals(locals.user.id, 10),
		AnalyticsService.getCategoryStatistics(locals.user.id),
		AnalyticsService.getMonthlyStatistics(locals.user.id)
	]);

	return {
		user: locals.user,
		patternsSummary,
		generalStats,
		topMeals,
		categoryStats,
		monthlyStats
	};
};

